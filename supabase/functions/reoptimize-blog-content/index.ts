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
    const { postId, currentContent, optimizationGoals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Reoptimizing content for post:', postId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch current post data
    const { data: post, error: fetchError } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    const systemPrompt = `You are an expert content optimizer specializing in SEO and AI-crawler optimization. 
Your task is to analyze blog content and provide specific, actionable recommendations for improvement.

Focus on:
1. SEO improvements (title, headings, keywords)
2. Content structure and readability
3. E-E-A-T signals (expertise, authority, trustworthiness)
4. Answer-first structure for AI crawlers
5. Internal linking opportunities
6. Citation quality and placement

Provide concrete suggestions with before/after examples.`;

    const userPrompt = `Analyze this published blog post and suggest improvements:

**Current Title:** ${post.title}
**Meta Description:** ${post.meta_description || 'None'}
**Category:** ${post.category || 'None'}
**Funnel Stage:** ${post.funnel_stage}
**Current SEO Score:** ${post.seo_score || 0}/100
**Tags:** ${post.tags?.join(', ') || 'None'}

**Content:**
${currentContent}

**Optimization Goals:**
${optimizationGoals || 'General improvement for better ranking and AI visibility'}

**Current Issues:**
- SEO Score: ${post.seo_score || 0}/100 (target: 80+)
- Citations: ${post.citations?.length || 0} sources
- Content length: ~${currentContent.length} characters

Provide:
1. Top 5 specific improvements ranked by impact
2. Suggested title variations (if needed)
3. Meta description optimization
4. Content structure recommendations
5. Internal linking suggestions based on funnel stage
6. Citation recommendations

Format as a clear, numbered list with actionable items.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestions = data.choices[0].message.content;

    console.log('Optimization suggestions generated');

    // Log the optimization in content_updates table
    await supabaseClient
      .from('content_updates')
      .insert({
        post_id: postId,
        post_type: 'blog_post',
        change_type: 'ai_optimization',
        description: 'AI-generated optimization suggestions',
        changed_by: null // System-generated
      });

    return new Response(
      JSON.stringify({ 
        suggestions,
        currentScore: post.seo_score || 0,
        postData: {
          title: post.title,
          metaDescription: post.meta_description,
          category: post.category,
          funnelStage: post.funnel_stage
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in reoptimize-blog-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
