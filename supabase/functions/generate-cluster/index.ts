import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { clusterId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch cluster
    const { data: cluster, error: clusterErr } = await supabaseClient
      .from('content_clusters')
      .select('*')
      .eq('id', clusterId)
      .single();
    if (clusterErr || !cluster) throw new Error('Cluster not found');

    // Fetch site settings for Master Prompt
    const { data: settings } = await supabaseClient
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    // Update status to generating
    await supabaseClient.from('content_clusters').update({ status: 'generating' }).eq('id', clusterId);

    const masterPrompt = settings ? [
      settings.master_prompt,
      `Brand Voice: ${settings.brand_voice}`,
      `Mission: ${settings.mission_statement}`,
      `EEAT: ${settings.eeat_authority_block}`,
      `Speakable Rules: ${settings.speakable_rules}`,
      `FAQ Rules: ${settings.faq_rules}`,
      `Anti-hallucination: ${settings.anti_hallucination_rules}`,
    ].filter(Boolean).join('\n\n') : '';

    const stages = [
      { stage: 'TOFU', count: 3, desc: 'educational awareness content' },
      { stage: 'MOFU', count: 2, desc: 'solution comparison and evaluation content' },
      { stage: 'BOFU', count: 1, desc: 'decision-focused content with clear CTAs' },
    ];

    const progress: Record<string, string> = {};
    let articleIndex = 0;

    for (const { stage, count, desc } of stages) {
      for (let i = 0; i < count; i++) {
        articleIndex++;
        const key = `article_${articleIndex}`;
        progress[key] = 'generating';
        await supabaseClient.from('content_clusters').update({ progress }).eq('id', clusterId);

        try {
          const systemPrompt = `${masterPrompt}\n\nYou are writing article ${articleIndex} of 6 in a content cluster about "${cluster.topic}".\nFunnel Stage: ${stage} (${desc})\nPrimary Keyword: ${cluster.primary_keyword}\nTarget Audience: ${cluster.target_audience || 'business owners, coaches, consultants'}\n\nRequirements:\n- 1500-2000 words\n- Use markdown formatting\n- Include 5-8 AEO FAQ questions and answers at the end\n- Include an EEAT authority block\n- Include a speakable summary (40-60 words)\n- Use question-based H2 headers\n- Start with a direct answer`;

          const userPrompt = `Write a complete ${stage} blog post about "${cluster.topic}" focusing on "${cluster.primary_keyword}". This is article ${articleIndex}/6 in the cluster. Make it unique from other articles in this cluster.\n\nReturn the content in this JSON format:\n{"title": "...", "slug": "...", "content": "...", "excerpt": "...", "meta_description": "...", "tags": [...], "faqs": [{"question": "...", "answer": "..."}]}`;

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
                  name: "create_blog_post",
                  description: "Create a blog post with structured data",
                  parameters: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      slug: { type: "string" },
                      content: { type: "string" },
                      excerpt: { type: "string" },
                      meta_description: { type: "string" },
                      tags: { type: "array", items: { type: "string" } },
                      faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"] } },
                    },
                    required: ["title", "slug", "content", "excerpt", "meta_description", "tags", "faqs"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "create_blog_post" } },
            }),
          });

          if (!response.ok) {
            progress[key] = 'error';
            await supabaseClient.from('content_clusters').update({ progress }).eq('id', clusterId);
            continue;
          }

          const data = await response.json();
          const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

          // Ensure unique slug
          const slug = `${result.slug}-${Date.now()}`;

          // Save blog post
          const { data: post } = await supabaseClient.from('blog_posts').insert({
            title: result.title,
            slug,
            content: result.content,
            excerpt: result.excerpt,
            meta_description: result.meta_description,
            tags: result.tags,
            funnel_stage: stage,
            status: 'draft',
            group_id: clusterId,
            language: 'en',
            hreflang: 'en',
            reading_time: Math.ceil((result.content?.split(/\s+/).length || 0) / 200),
          }).select('id').single();

          // Save QAs
          if (post && result.faqs?.length) {
            const qaInserts = result.faqs.map((faq: { question: string; answer: string }) => ({
              question: faq.question,
              answer: faq.answer,
              slug: `${slug}-faq-${Math.random().toString(36).slice(2, 8)}`,
              status: 'draft',
              group_id: clusterId,
              source_blog_id: post.id,
              language: 'en',
              hreflang: 'en',
            }));
            await supabaseClient.from('qa_articles').insert(qaInserts);
          }

          progress[key] = 'complete';
          await supabaseClient.from('content_clusters').update({ progress }).eq('id', clusterId);

          // Rate limiting delay
          if (articleIndex < 6) {
            await new Promise(r => setTimeout(r, 3000));
          }
        } catch (err) {
          console.error(`Error generating article ${articleIndex}:`, err);
          progress[key] = 'error';
          await supabaseClient.from('content_clusters').update({ progress }).eq('id', clusterId);
        }
      }
    }

    const hasErrors = Object.values(progress).some(s => s === 'error');
    await supabaseClient.from('content_clusters').update({
      status: hasErrors ? 'error' : 'complete',
      progress,
    }).eq('id', clusterId);

    return new Response(JSON.stringify({ success: true, progress }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-cluster error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
