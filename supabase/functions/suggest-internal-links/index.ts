import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, funnelStage, currentSlug } = await req.json();

    if (!content) {
      throw new Error('Content is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching existing published blog posts...');

    // Fetch all published blog posts except the current one
    const { data: existingPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, funnel_stage, meta_description, content, tags, category')
      .eq('status', 'published')
      .neq('slug', currentSlug || 'none')
      .limit(50);

    if (fetchError) {
      console.error('Error fetching posts:', fetchError);
      throw fetchError;
    }

    if (!existingPosts || existingPosts.length === 0) {
      console.log('No published posts found for linking');
      return new Response(
        JSON.stringify({ 
          suggestions: [],
          message: 'No published posts available for internal linking yet.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${existingPosts.length} published posts. Analyzing content...`);

    // Prepare context for AI
    const postsContext = existingPosts.map(post => ({
      title: post.title,
      slug: post.slug,
      funnel_stage: post.funnel_stage,
      description: post.meta_description || post.content?.substring(0, 200),
      tags: post.tags || [],
      category: post.category
    }));

    const systemPrompt = `You are an expert SEO strategist specializing in internal linking for content marketing.

Your task is to analyze blog post content and suggest strategic internal links to other relevant posts.

INTERNAL LINKING BEST PRACTICES:
1. Link to relevant, related content that adds value to the reader
2. Use natural, descriptive anchor text (not "click here" or generic phrases)
3. Prioritize linking across different funnel stages (TOFU → MOFU → BOFU)
4. Suggest 3-7 high-quality links (quality over quantity)
5. Place links where they naturally fit in the content flow
6. Each link should have a clear purpose and relevance

FUNNEL STAGE STRATEGY:
- TOFU (Top): Link to other educational content and MOFU comparison content
- MOFU (Middle): Link to TOFU education and BOFU decision content
- BOFU (Bottom): Link to MOFU evaluation content and related BOFU content

Return suggestions in this exact JSON format:
{
  "suggestions": [
    {
      "targetSlug": "post-slug",
      "targetTitle": "Post Title",
      "anchorText": "natural descriptive anchor text",
      "contextSnippet": "excerpt from current content where link should be inserted",
      "placement": "suggest where in the article (intro/middle/conclusion)",
      "reasoning": "why this link is valuable here",
      "funnelStrategy": "explain the funnel relationship"
    }
  ]
}`;

    const userPrompt = `Current Article:
Title: ${title || 'Untitled'}
Funnel Stage: ${funnelStage || 'Unknown'}

Content excerpt:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

Available Posts for Linking:
${JSON.stringify(postsContext, null, 2)}

Analyze the current article and suggest 3-7 strategic internal links from the available posts. Focus on relevance, natural anchor text, and funnel progression strategy.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling AI to generate link suggestions...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits depleted. Please add funds to continue.');
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    console.log('AI response received, parsing suggestions...');

    // Parse AI response
    let parsedSuggestions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : aiContent;
      parsedSuggestions = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiContent);
      throw new Error('Failed to parse AI suggestions');
    }

    const suggestions = parsedSuggestions.suggestions || [];

    console.log(`Generated ${suggestions.length} link suggestions`);

    return new Response(
      JSON.stringify({ 
        suggestions,
        totalAvailablePosts: existingPosts.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suggest-internal-links:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
