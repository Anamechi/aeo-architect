import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { blogPostId, content: rawContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    let articleContent = rawContent || '';

    if (blogPostId && !articleContent) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      const { data: post } = await supabaseClient
        .from('blog_posts')
        .select('title, content')
        .eq('id', blogPostId)
        .single();
      if (post) articleContent = `Title: ${post.title}\n\n${post.content}`;
    }

    if (!articleContent) throw new Error('No content provided');

    const systemPrompt = `You are a citation research expert. Analyze the article and identify 5-8 opportunities where high-authority citations would strengthen the content. For each opportunity:
1. Identify the claim or statement that needs a citation
2. Suggest a real, authoritative source (government sites, .edu, established industry publications like HubSpot, Gartner, Forrester, McKinsey, etc.)
3. Do NOT suggest competitor marketing agency websites
4. Prioritize English and Spanish language sources
5. Provide the exact URL if known, or describe the source clearly

Return citations that would pass EEAT scrutiny.`;

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
          { role: 'user', content: `Analyze this article for citation opportunities:\n\n${articleContent.slice(0, 6000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_citations",
            description: "Return citation suggestions",
            parameters: {
              type: "object",
              properties: {
                citations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      claim: { type: "string", description: "The statement needing citation" },
                      suggested_source: { type: "string", description: "Source name" },
                      url: { type: "string", description: "URL if known" },
                      anchor_text: { type: "string", description: "Suggested link text" },
                      relevance: { type: "string", enum: ["high", "medium", "low"] },
                      authority_type: { type: "string", description: "e.g. government, academic, industry report" },
                    },
                    required: ["claim", "suggested_source", "anchor_text", "relevance"],
                  },
                },
              },
              required: ["citations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_citations" } },
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('discover-citations error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
