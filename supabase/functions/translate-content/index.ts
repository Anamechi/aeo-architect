import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { blogPostId, targetLanguage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch source article
    const { data: source, error: fetchErr } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();
    if (fetchErr || !source) throw new Error('Source article not found');

    // Fetch site settings
    const { data: settings } = await supabaseClient
      .from('site_settings')
      .select('master_prompt, brand_voice')
      .limit(1)
      .single();

    const systemPrompt = `You are a professional translator. Translate the following blog post to ${targetLanguage}. Preserve all markdown formatting, links, and structure. Do not translate brand names, URLs, or technical terms. Maintain the same tone and style.\n\n${settings?.brand_voice || ''}`;

    const userPrompt = `Translate this blog post:\n\nTitle: ${source.title}\nExcerpt: ${source.excerpt}\nMeta Description: ${source.meta_description}\nContent:\n${source.content}\nImage Alt Text: ${source.image_alt_text || ''}\nImage Caption: ${source.image_caption || ''}`;

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
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "translate_post",
            description: "Return translated blog post fields",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                excerpt: { type: "string" },
                meta_description: { type: "string" },
                content: { type: "string" },
                image_alt_text: { type: "string" },
                image_caption: { type: "string" },
              },
              required: ["title", "content", "excerpt", "meta_description"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "translate_post" } },
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);

    const data = await response.json();
    const translated = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    // Create translated post
    const { data: newPost, error: insertErr } = await supabaseClient.from('blog_posts').insert({
      title: translated.title,
      slug: `${targetLanguage}-${source.slug}`,
      content: translated.content,
      excerpt: translated.excerpt,
      meta_description: translated.meta_description,
      image_alt_text: translated.image_alt_text || null,
      image_caption: translated.image_caption || null,
      featured_image_url: source.featured_image_url,
      funnel_stage: source.funnel_stage,
      category: source.category,
      tags: source.tags,
      citations: source.citations,
      status: 'draft',
      group_id: source.group_id,
      language: targetLanguage,
      hreflang: targetLanguage,
      translated_from: source.id,
      reading_time: source.reading_time,
    }).select('id').single();

    if (insertErr) throw insertErr;

    // Translate associated QAs
    const { data: sourceQas } = await supabaseClient
      .from('qa_articles')
      .select('*')
      .eq('source_blog_id', blogPostId);

    if (sourceQas?.length) {
      for (const qa of sourceQas) {
        const qaResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: `Translate this Q&A to ${targetLanguage}. Keep it concise.` },
              { role: 'user', content: `Question: ${qa.question}\nAnswer: ${qa.answer}` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "translate_qa",
                description: "Return translated Q&A",
                parameters: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "translate_qa" } },
          }),
        });

        if (qaResp.ok) {
          const qaData = await qaResp.json();
          const translatedQa = JSON.parse(qaData.choices[0].message.tool_calls[0].function.arguments);

          await supabaseClient.from('qa_articles').insert({
            question: translatedQa.question,
            answer: translatedQa.answer,
            slug: `${targetLanguage}-${qa.slug}`,
            status: 'draft',
            group_id: source.group_id,
            source_blog_id: newPost?.id,
            language: targetLanguage,
            hreflang: targetLanguage,
            translated_from: qa.id,
          });
        }

        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return new Response(JSON.stringify({ success: true, translatedPostId: newPost?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('translate-content error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
