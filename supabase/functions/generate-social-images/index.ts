import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// On-brand, text-free, square conceptual images (no people, so no likeness/diversity concerns).
const BRAND = 'Clean modern editorial vector illustration, ANAMECHI brand palette of deep indigo #2C21A2, teal #00B3B0, fresh green and warm orange accents on a soft off-white background, minimal, flat, professional, square 1:1 composition, high quality, absolutely no text, no words, no letters, no numbers, no logos, no watermark';

const PROMPTS = [
  `A chaotic zigzag line settling into a smooth steady upward line, symbolizing predictable revenue after chaos. ${BRAND}`,
  `A simple funnel capturing glowing dots as leads, with a gentle follow-up loop arrow, symbolizing automated lead follow up. ${BRAND}`,
  `A friendly AI chat assistant bubble beside a clock, symbolizing a 24 hour assistant that never sleeps. ${BRAND}`,
  `Four connected gears or rounded blocks working together in a ring, symbolizing four business systems in sync. ${BRAND}`,
  `Five glowing stars rising from a completed checkmark task, symbolizing growing reputation and reviews. ${BRAND}`,
  `Chat message bubbles transforming into raised hands, symbolizing fast response to interested leads. ${BRAND}`,
  `A sturdy structured foundation supporting neatly stacked growth blocks, symbolizing stability before scale. ${BRAND}`,
  `A looping arrow circulating between a storefront and a returning client, symbolizing client retention and lifetime value. ${BRAND}`,
  `A magnifying glass scanning a simple business dashboard and revealing a highlighted hidden leak, symbolizing a diagnostic scan. ${BRAND}`,
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supa = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Ensure a public bucket exists (ignore error if it already exists)
    try { await supa.storage.createBucket('social-images', { public: true }); } catch (_e) { /* exists */ }

    const results: { index: number; url: string | null; error?: string }[] = [];

    for (let i = 0; i < PROMPTS.length; i++) {
      try {
        const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{ role: 'user', content: PROMPTS[i] }],
            modalities: ['image', 'text'],
          }),
        });
        if (!resp.ok) {
          results.push({ index: i, url: null, error: `gateway ${resp.status}` });
          continue;
        }
        const data = await resp.json();
        const dataUri: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!dataUri || !dataUri.includes(',')) {
          results.push({ index: i, url: null, error: 'no image' });
          continue;
        }
        const b64 = dataUri.split(',')[1];
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);

        const path = `aug23-31/post-${i + 1}.png`;
        const { error: upErr } = await supa.storage
          .from('social-images')
          .upload(path, bytes, { contentType: 'image/png', upsert: true });
        if (upErr) {
          results.push({ index: i, url: null, error: `upload ${upErr.message}` });
          continue;
        }
        const { data: pub } = supa.storage.from('social-images').getPublicUrl(path);
        results.push({ index: i, url: pub.publicUrl });
      } catch (e) {
        results.push({ index: i, url: null, error: e instanceof Error ? e.message : 'unknown' });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-social-images error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
