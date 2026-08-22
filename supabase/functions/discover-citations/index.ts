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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let articleContent = rawContent || '';

    if (blogPostId && !articleContent) {
      const { data: post } = await supabaseClient
        .from('blog_posts')
        .select('title, content')
        .eq('id', blogPostId)
        .single();
      if (post) articleContent = `Title: ${post.title}\n\n${post.content}`;
    }

    if (!articleContent) throw new Error('No content provided');

    // Load the owner-approved citation allowlist
    const { data: approvedRows } = await supabaseClient
      .from('approved_sources')
      .select('pattern, match_type')
      .eq('status', 'approved');
    const approved = (approvedRows || []) as { pattern: string; match_type: string }[];
    const allowlistText = approved.map((a) => a.pattern).join(', ')
      || 'government (.gov), academic (.edu), schema.org, Pew Research, Gartner, Forrester, McKinsey, Harvard Business Review, Nielsen, and official platform docs from Google, OpenAI, Anthropic, Microsoft, Bing, Perplexity, Meta';

    const hostOf = (url: string): string => {
      try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
    };
    const isApproved = (url: string): boolean => {
      const host = hostOf(url);
      if (!host) return false;
      return approved.some((a) => {
        const p = a.pattern.toLowerCase().replace(/^\./, '');
        if (a.match_type === 'exact') return host === p;
        return host === p || host.endsWith('.' + p) || host.endsWith(p);
      });
    };

    const systemPrompt = `You are a citation research expert for ANAMECHI Marketing. Analyze the article and identify 4-6 places where a high-authority citation would strengthen a factual claim. STRICT RULES:
1. You may ONLY suggest sources from this owner-approved allowlist: ${allowlistText}.
2. Never suggest a domain that is not on that allowlist. Never suggest competitor marketing agencies, Wikipedia, blogs, or forums.
3. Provide the exact real URL on an approved domain. If you cannot supply a real approved URL for a claim, do not invent one; skip that claim.
4. English-language sources only.
5. Each citation must be a real, verifiable page that would pass EEAT scrutiny.`;

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
    const suggestions = Array.isArray(result.citations) ? result.citations : [];

    // Enforce the allowlist: keep only approved-domain citations; route unknowns to a pending queue
    const citations: any[] = [];
    const rejected: any[] = [];
    const pendingDomains = new Set<string>();

    for (const c of suggestions) {
      if (c.url && isApproved(c.url)) {
        citations.push(c);
      } else {
        rejected.push({ ...c, reason: c.url ? 'domain not on approved allowlist' : 'no URL supplied' });
        const host = c.url ? hostOf(c.url) : '';
        if (host) pendingDomains.add(host);
      }
    }

    // Add genuinely new domains as PENDING for owner review (never overwrite an existing approved/rejected decision)
    for (const host of pendingDomains) {
      await supabaseClient
        .from('approved_sources')
        .upsert(
          { pattern: host, match_type: 'exact', status: 'pending', category: 'suggested-by-engine', notes: 'Proposed by discover-citations; review before use.' },
          { onConflict: 'pattern', ignoreDuplicates: true }
        );
    }

    return new Response(JSON.stringify({ citations, rejected, pending_added: [...pendingDomains] }), {
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
