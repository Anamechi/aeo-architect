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
          const systemPrompt = `${masterPrompt}\n\nYou are writing article ${articleIndex} of 6 in a content cluster about "${cluster.topic}".\nFunnel Stage: ${stage} (${desc})\nPrimary Keyword: ${cluster.primary_keyword}\nTarget Audience: ${cluster.target_audience || 'business owners, coaches, consultants'}\n\nThe "content" field must be ARTICLE PROSE ONLY (markdown), 1500-2000 words: start with a direct answer, use question-based H2 headers, short paragraphs, a 40-60 word speakable summary, and an EEAT authority block written as prose.\nDo NOT put any JSON-LD, schema markup, code fence, "[ARTICLE SCHEMA]" label, or title or meta block inside content. The website adds all schema automatically.\nDo NOT put the FAQs inside content; return them only in the "faqs" field (5-8 genuine question and answer pairs).\nAlso return a meta_description of 150 to 160 characters, an excerpt of about 250 characters, and 4 to 8 topical tags.`;

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
          const baseSlug = String(result.slug || result.title || 'post')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
          const slug = `${baseSlug}-${Date.now()}`;

          // Clean the body so it is prose only. Strip any schema or code fence the model may still have emitted.
          const cleanContent = String(result.content || '')
            .replace(/^\s*\[ARTICLE SCHEMA\][\s\S]*?(```|$)/i, '')
            .replace(/```json[\s\S]*?```/gi, '')
            .replace(/```[\s\S]*?@context[\s\S]*?```/gi, '')
            .replace(/^\s*\{[\s\S]*?@context[\s\S]*?\}\s*/i, '')
            .trim();

          // Populate every SEO field, with fallbacks so nothing is left empty
          const metaDescription = (result.meta_description && String(result.meta_description).trim())
            || (result.excerpt && String(result.excerpt).trim())
            || cleanContent.replace(/[#*`>_]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 157);
          const excerpt = (result.excerpt && String(result.excerpt).trim())
            || metaDescription.slice(0, 250);
          const tags = (Array.isArray(result.tags) && result.tags.length)
            ? result.tags
            : [cluster.primary_keyword].filter(Boolean);
          const category = cluster.category || 'AI Marketing Systems';
          const faqs = Array.isArray(result.faqs) ? result.faqs : [];

          // Build correct JSON-LD server-side (right domain + verified LinkedIn), stored in schema_data, never in the body
          const canonical = `https://anamechimarketing.com/blog/${slug}`;
          const schemaData = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                "headline": result.title,
                "description": metaDescription,
                "articleSection": stage,
                "inLanguage": "en",
                "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
                "author": { "@type": "Person", "name": "Dr. Deanna Romulus", "url": "https://anamechimarketing.com/", "sameAs": ["https://www.linkedin.com/in/deannaromulusmba"] },
                "publisher": { "@type": "Organization", "name": "ANAMECHI Marketing", "url": "https://anamechimarketing.com/" },
              },
              ...(faqs.length ? [{
                "@type": "FAQPage",
                "mainEntity": faqs.map((f: { question: string; answer: string }) => ({
                  "@type": "Question",
                  "name": f.question,
                  "acceptedAnswer": { "@type": "Answer", "text": f.answer },
                })),
              }] : []),
            ],
          };

          // Save blog post
          const { data: post } = await supabaseClient.from('blog_posts').insert({
            title: result.title,
            slug,
            content: cleanContent,
            excerpt,
            meta_description: metaDescription,
            tags,
            category,
            schema_data: schemaData,
            funnel_stage: stage,
            status: 'draft',
            group_id: clusterId,
            language: 'en',
            hreflang: 'en',
            reading_time: Math.ceil((cleanContent.split(/\s+/).length || 0) / 200),
          }).select('id').single();

          // Save QAs
          if (post && faqs.length) {
            const qaInserts = faqs.map((faq: { question: string; answer: string }) => ({
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
