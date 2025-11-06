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

**CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE EXACTLY:**

1. **PARAGRAPH LENGTH:** Every paragraph MUST be 2-4 lines maximum. NO EXCEPTIONS. Break long paragraphs into multiple short ones.

2. **VISUAL STRUCTURE:**
   - Use H2 (##) headers every 200-300 words to break content into scannable sections
   - Use H3 (###) sub-headers within sections for additional clarity
   - Add bullet points or numbered lists frequently to break up text
   - Never have more than 3-4 consecutive paragraphs without a header or list

3. **WHITE SPACE:** Generous spacing between sections. Each section should feel breathable and easy to scan.

4. **NO WALLS OF TEXT:** If you see a paragraph longer than 4 lines, split it immediately into 2-3 shorter paragraphs.

5. **CONTENT STRUCTURE:**
   - Opening paragraph: 2-3 lines with clear value proposition
   - Body sections: Each with H2 header, 2-4 short paragraphs, bullet points
   - Visual breaks: Insert image suggestions [Insert professional image: description] every 300-400 words
   - Closing: Short 2-3 line motivational paragraph + clear CTA

**EXAMPLE OF CORRECT FORMATTING:**

# Title Here

Opening hook paragraph (2-3 lines max). Clear and engaging.

Second paragraph building on the hook (2-3 lines). Sets expectations.

## Section Header with Keywords

First paragraph under section (2-4 lines). Introduces the concept clearly.

Second paragraph (2-4 lines). Provides additional context or example.

**Key benefits:**
- Bullet point one
- Bullet point two
- Bullet point three

Short transition paragraph (2-3 lines).

### Sub-section Header

Brief explanation (2-3 lines).

[Insert professional image: relevant visual description]

Another brief paragraph (2-4 lines).

---

**BRAND VOICE:** Intelligent, visionary, empowering, culturally resonant, confident yet warm
**SEO/AEO:** Semantic keywords naturally integrated, EEAT principles, meta description ≤160 chars
**LENGTH:** 900-1,500 words total, readability grade ≤9

Current issues to fix: ${JSON.stringify(auditResults.issues)}
Missing elements: ${JSON.stringify(auditResults.missingElements)}

Return optimized content in this JSON format:
{
  "title": "Optimized title",
  "excerpt": "Compelling 2-3 sentence excerpt",
  "content": "Full markdown content with SHORT PARAGRAPHS and proper formatting",
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
