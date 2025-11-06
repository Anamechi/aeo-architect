import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, auditResults } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Fetch the blog post
    const { data: post, error: fetchError } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are the Content Optimization Engine for ANAMECHI Marketing, founded by Dr. Deanna Romulus — a Visionary Strategist and Empowerment Architect.

Rewrite the blog post to meet ANAMECHI Excellence Standards:

TONE: Intelligent, visionary, empowering, culturally resonant, confident yet warm
STRUCTURE: Magnetic headline → Engaging intro → Key sections (H2/H3) → FAQ/Takeaways → CTA
FORMATTING: Short paragraphs (2-4 lines), bullet lists, visual breaks every 300-400 words
SEO/AEO: Semantic keywords, internal links, EEAT principles, meta description ≤160 chars
LENGTH: 900-1,500 words, readability grade ≤9

Current issues to fix: ${JSON.stringify(auditResults.issues)}
Missing elements: ${JSON.stringify(auditResults.missingElements)}

Return optimized content in this JSON format:
{
  "title": "Optimized title",
  "excerpt": "Compelling 2-3 sentence excerpt",
  "content": "Full markdown content with proper headers, formatting",
  "metaDescription": "SEO-optimized meta description ≤160 chars",
  "suggestedImagePrompt": "Detailed prompt for Nano Banana image generation",
  "suggestedCTA": "Motivational CTA text",
  "internalLinks": ["suggested internal link topics"],
  "keywords": ["semantic", "keywords"]
}`;

    const userPrompt = `
Original Post:
Title: ${post.title}
Content: ${post.content}
Funnel Stage: ${post.funnel_stage || 'TOFU'}
Category: ${post.category || 'Marketing'}
`;

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
        tools: [{
          type: "function",
          function: {
            name: "optimize_blog_post",
            description: "Return optimized blog post content",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                excerpt: { type: "string" },
                content: { type: "string" },
                metaDescription: { type: "string" },
                suggestedImagePrompt: { type: "string" },
                suggestedCTA: { type: "string" },
                internalLinks: { type: "array", items: { type: "string" } },
                keywords: { type: "array", items: { type: "string" } }
              },
              required: ["title", "excerpt", "content", "metaDescription"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "optimize_blog_post" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    // Robust parsing: prefer tool calls, fallback to JSON content
    let optimizedContent: any = null;
    const choice = data.choices?.[0];
    const toolArgs = choice?.message?.tool_calls?.[0]?.function?.arguments;

    try {
      if (toolArgs) {
        optimizedContent = JSON.parse(toolArgs);
      } else if (choice?.message?.content) {
        // Try parsing direct JSON content
        const content = choice.message.content.trim();
        // Remove code fences if present
        const cleaned = content.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        optimizedContent = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error('Failed to parse optimized content:', e);
    }

    if (!optimizedContent || !optimizedContent.title || !optimizedContent.content) {
      console.error('Invalid optimized content payload:', JSON.stringify(choice));
      return new Response(
        JSON.stringify({ error: 'AI did not return a valid optimized payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify(optimizedContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in optimize-blog-post:', error);
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
