import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentFunnelStage, category, tags, currentSlug } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('Fetching link suggestions for:', { currentFunnelStage, category, tags });

    // Define linking strategy based on funnel stage
    let targetStages: string[] = [];
    let linkingStrategy = '';

    if (currentFunnelStage === 'TOFU') {
      targetStages = ['MOFU'];
      linkingStrategy = 'Guide readers from awareness to consideration with these articles:';
    } else if (currentFunnelStage === 'MOFU') {
      targetStages = ['TOFU', 'BOFU'];
      linkingStrategy = 'Provide context with TOFU content and guide to decision with BOFU:';
    } else if (currentFunnelStage === 'BOFU') {
      targetStages = ['MOFU'];
      linkingStrategy = 'Provide additional context with these consideration-stage articles:';
    }

    // Query for relevant published posts
    const { data: posts, error } = await supabaseClient
      .from('blog_posts')
      .select('id, title, slug, funnel_stage, category, tags, meta_description')
      .eq('status', 'published')
      .in('funnel_stage', targetStages)
      .neq('slug', currentSlug || 'none')
      .limit(20);

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    console.log(`Found ${posts?.length || 0} potential articles to link`);

    // Score and rank articles based on relevance
    const scoredPosts = posts?.map(post => {
      let score = 0;
      
      // Category match (high priority)
      if (post.category && category && post.category.toLowerCase() === category.toLowerCase()) {
        score += 50;
      }
      
      // Tag overlap (medium priority)
      const postTags = post.tags || [];
      const currentTags = tags || [];
      const tagOverlap = postTags.filter((tag: string) => 
        currentTags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
      ).length;
      score += tagOverlap * 15;
      
      // Funnel stage priority (TOFU->MOFU highest, MOFU->BOFU second)
      if (currentFunnelStage === 'TOFU' && post.funnel_stage === 'MOFU') {
        score += 30;
      } else if (currentFunnelStage === 'MOFU' && post.funnel_stage === 'BOFU') {
        score += 35;
      } else if (currentFunnelStage === 'MOFU' && post.funnel_stage === 'TOFU') {
        score += 25;
      } else if (currentFunnelStage === 'BOFU' && post.funnel_stage === 'MOFU') {
        score += 30;
      }
      
      return { ...post, score };
    }) || [];

    // Sort by score and take top 5
    const topSuggestions = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        funnelStage: post.funnel_stage,
        category: post.category,
        metaDescription: post.meta_description,
        relevanceScore: post.score,
        linkReason: generateLinkReason(currentFunnelStage, post.funnel_stage, post.category === category)
      }));

    console.log('Returning top suggestions:', topSuggestions.length);

    return new Response(
      JSON.stringify({
        suggestions: topSuggestions,
        strategy: linkingStrategy,
        totalFound: posts?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in suggest-funnel-links:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestions: [],
        strategy: '',
        totalFound: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateLinkReason(currentStage: string, targetStage: string, sameCategory: boolean): string {
  const categoryBonus = sameCategory ? ' (same topic area)' : '';
  
  if (currentStage === 'TOFU' && targetStage === 'MOFU') {
    return `Guides reader to next step in journey${categoryBonus}`;
  } else if (currentStage === 'MOFU' && targetStage === 'BOFU') {
    return `Moves reader toward conversion${categoryBonus}`;
  } else if (currentStage === 'MOFU' && targetStage === 'TOFU') {
    return `Provides foundational context${categoryBonus}`;
  } else if (currentStage === 'BOFU' && targetStage === 'MOFU') {
    return `Adds supporting detail${categoryBonus}`;
  }
  
  return `Related content${categoryBonus}`;
}
