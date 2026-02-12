import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { blogPostId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: post, error } = await supabaseClient
      .from('blog_posts')
      .select('id, title, content, group_id, language, slug')
      .eq('id', blogPostId)
      .single();
    if (error || !post) throw new Error('Post not found');

    // Fetch site settings for FAQ rules
    const { data: settings } = await supabaseClient
      .from('site_settings')
      .select('faq_rules, master_prompt')
      .limit(1)
      .single();

    const systemPrompt = `You are an FAQ generation expert. Generate 4 contextual Q&A pairs based on the article content. Each answer must be 80-120 words, starting with a direct answer, using plain language at 8th-9th grade reading level.\n\n${settings?.faq_rules || ''}\n\n${settings?.master_prompt || ''}`;

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
          { role: 'user', content: `Generate 4 FAQ Q&A pairs for this article:\n\nTitle: ${post.title}\n\nContent:\n${post.content?.slice(0, 4000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_faqs",
            description: "Return 4 FAQ Q&A pairs",
            parameters: {
              type: "object",
              properties: {
                faqs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" },
                    },
                    required: ["question", "answer"],
                  },
                },
              },
              required: ["faqs"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_faqs" } },
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    // Insert QAs
    const qaInserts = result.faqs.map((faq: { question: string; answer: string }, i: number) => ({
      question: faq.question,
      answer: faq.answer,
      slug: `${post.slug}-faq-${i + 1}-${Date.now()}`,
      status: 'draft',
      group_id: post.group_id,
      source_blog_id: post.id,
      language: post.language || 'en',
      hreflang: post.language || 'en',
    }));

    const { error: insertErr } = await supabaseClient.from('qa_articles').insert(qaInserts);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, count: result.faqs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-article-qas error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
