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
    const { topic, keywords, funnelStage, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch Master Prompt from site_settings
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const { data: settings } = await supabaseClient
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    const masterContext = settings ? `\n\nMASTER PROMPT CONTEXT:\nBrand Voice: ${settings.brand_voice || ''}\nMission: ${settings.mission_statement || ''}\nEEAT: ${settings.eeat_authority_block || ''}\nSpeakable Rules: ${settings.speakable_rules || ''}\nFAQ Rules: ${settings.faq_rules || ''}\nAnti-hallucination: ${settings.anti_hallucination_rules || ''}` : '';

    let systemPrompt = "";
    let userPrompt = "";

    // Define prompts based on action type
    if (action === "outline") {
      systemPrompt = `You are an expert content strategist and SEO specialist. Create detailed, AI-optimized blog post outlines that follow best practices:
- Start with a clear, direct answer (answer-first approach)
- Use question-based H2 and H3 headings
- Include sections for: Quick Answer, Detailed Explanation, How-To Steps, Common Mistakes, Expert Tips
- Optimize for both traditional search engines and AI crawlers (ChatGPT, Perplexity, etc.)
- Consider the funnel stage for appropriate content depth${masterContext}`;

      userPrompt = `Create a detailed blog post outline for:
Topic: ${topic}
Keywords: ${keywords || 'N/A'}
Funnel Stage: ${funnelStage}

Format the outline with:
- Title (60 chars max, include year or make it a question)
- Meta Description (120-160 chars)
- Main sections with H2/H3 structure
- Brief notes for each section`;
    } else if (action === "full-content") {
      systemPrompt = `You are an expert content writer specializing in AI-optimized, SEO-friendly blog posts. Write comprehensive articles that:
- Start with a direct answer in the first paragraph
- Use conversational, clear language
- Include question-based headings (H2, H3)
- Keep paragraphs short (one idea each)
- Add lists, tables, and actionable tips
- Cite authoritative sources when making claims
- Include a clear CTA based on funnel stage
- Use markdown formatting
- Word count: 1500-2000 words
- Include a speakable summary (40-60 words)
- Include an EEAT authority block${masterContext}`;

      userPrompt = `Write a complete blog post for:
Topic: ${topic}
Keywords: ${keywords || 'N/A'}
Funnel Stage: ${funnelStage}

Requirements:
- ${funnelStage === 'TOFU' ? 'Educational, awareness-focused content' : funnelStage === 'MOFU' ? 'Solution comparison and evaluation content' : 'Decision-focused content with clear CTAs'}
- 800-1200 words
- Include 3-5 H2 sections with supporting H3 subsections
- Add at least 3 citations to authoritative sources
- End with relevant CTA`;
    } else if (action === "optimize") {
      systemPrompt = `You are an SEO optimization expert. Analyze blog content and provide specific, actionable improvement suggestions for:
- Title optimization (questions, year, clarity)
- Meta description effectiveness
- Content structure (headings, paragraphs)
- AI crawler optimization (answer-first, clear structure)
- E-E-A-T signals (citations, expertise)
- Keyword usage and density
- Spell-check and professional tone${masterContext}`;

      userPrompt = `Analyze and suggest improvements for this blog content:
${topic}

Provide 5-7 specific, prioritized suggestions with examples.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway request failed");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-blog-content function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
