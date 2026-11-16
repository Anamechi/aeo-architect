import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Upload a base64 data-URI image to the public blog-images Storage bucket and
// return its public URL, so the database never stores a multi-megabyte data URI.
// If the input is already an http(s) URL it is returned unchanged (idempotent).
// Returns null when the input is not a usable image; throws only on upload failure.
// deno-lint-ignore no-explicit-any
async function hostImage(supa: any, dataUri: string, key: string): Promise<string | null> {
  if (!dataUri) return null;
  if (/^https?:\/\//i.test(dataUri)) return dataUri;
  if (!dataUri.startsWith('data:') || !dataUri.includes(',')) return null;
  const header = dataUri.slice(5, dataUri.indexOf(','));
  const mime = (header.split(';')[0] || 'image/png').toLowerCase();
  const ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '') || 'png';
  const b64 = dataUri.split(',')[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
  try { await supa.storage.createBucket('blog-images', { public: true }); } catch (_e) { /* exists */ }
  const path = `${key}.${ext}`;
  const { error: upErr } = await supa.storage
    .from('blog-images')
    .upload(path, bytes, { contentType: mime, upsert: true });
  if (upErr) throw new Error(`storage upload failed: ${upErr.message}`);
  const { data: pub } = supa.storage.from('blog-images').getPublicUrl(path);
  return pub?.publicUrl ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style = 'professional' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating image with prompt:', prompt);

    // Enhance prompt based on style
    const enhancedPrompt = style === 'professional' 
      ? `Professional, high-quality ${prompt}. Clean, modern design suitable for a business blog article. Sharp details, good lighting.`
      : prompt;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Image generated successfully');

    // Host the generated image so the caller stores a URL, not a data URI.
    // On any hosting failure, fall back to the data URI so generation never hard-fails.
    let hostedUrl = imageUrl;
    try {
      const supa = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      const url = await hostImage(supa, imageUrl, `generated/${crypto.randomUUID()}`);
      if (url) hostedUrl = url;
    } catch (hostErr) {
      console.error('Image hosting failed, returning data URI:', hostErr);
    }

    return new Response(
      JSON.stringify({
        imageUrl: hostedUrl,
        prompt: enhancedPrompt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-blog-image:', error);
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
