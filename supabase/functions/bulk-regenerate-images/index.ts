import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Upload a base64 data-URI image to the public blog-images Storage bucket and
// return its public URL, so the database never stores a multi-megabyte data URI.
// If the input is already an http(s) URL it is returned unchanged (idempotent).
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
    const { postIds, brandStyle = 'anamechi' } = await req.json();
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      throw new Error('postIds array is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const results = [];

    // Process each post
    for (const postId of postIds) {
      try {
        console.log(`Processing post: ${postId}`);

        // Fetch post details
        const { data: post, error: fetchError } = await supabaseClient
          .from('blog_posts')
          .select('id, title, excerpt, category, funnel_stage')
          .eq('id', postId)
          .single();

        if (fetchError || !post) {
          console.error(`Post not found: ${postId}`);
          results.push({
            postId,
            success: false,
            error: 'Post not found'
          });
          continue;
        }

        // Create ANAMECHI brand-aligned prompt
        const brandPrompt = `Create a professional, editorial-style hero image for a business blog article titled "${post.title}". 

Style Requirements:
- Sleek, empowering, and contemporary aesthetic
- Warm, professional lighting with depth and dimension
- Human-centered imagery showing diverse professionals in action
- Clean composition with subtle gradients
- Purple and gold color undertones (hex #6B46C1 purple, #F59E0B gold)
- Editorial photography style with deep focus
- Premium business publication quality
- Modern, aspirational, and strategic feel
- Ratio: 16:9 landscape format
- Ultra high resolution, sharp details

The image should evoke: intelligence, vision, empowerment, cultural resonance, confidence, warmth, and strategic clarity.

Context: ${post.excerpt || post.category || 'Marketing and business automation'}`;

        console.log('Generating image with Nano Banana for:', post.title);

        // Generate image using Nano Banana (google/gemini-2.5-flash-image-preview)
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
                content: brandPrompt
              }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          
          if (response.status === 429) {
            results.push({
              postId,
              success: false,
              error: 'Rate limit exceeded'
            });
            continue;
          }
          if (response.status === 402) {
            results.push({
              postId,
              success: false,
              error: 'AI credits depleted'
            });
            continue;
          }
          
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error('No image generated for post:', postId);
          results.push({
            postId,
            success: false,
            error: 'No image generated'
          });
          continue;
        }

        console.log('Image generated successfully for:', post.title);

        // Host the image so the row stores a URL, not a data URI.
        // Fall back to the data URI only if hosting fails, so a rare upload
        // error never blocks the regeneration entirely.
        let hostedUrl = imageUrl;
        try {
          const url = await hostImage(supabaseClient, imageUrl, `post-${postId}`);
          if (url) hostedUrl = url;
        } catch (hostErr) {
          console.error('Image hosting failed for', postId, hostErr);
        }

        // Update post with new image
        const { error: updateError } = await supabaseClient
          .from('blog_posts')
          .update({
            featured_image_url: hostedUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId);

        if (updateError) {
          console.error('Failed to update post:', updateError);
          results.push({
            postId,
            title: post.title,
            success: false,
            error: 'Failed to update post'
          });
        } else {
          results.push({
            postId,
            title: post.title,
            success: true,
            imageUrl: hostedUrl
          });
        }

      } catch (error) {
        console.error(`Error processing post ${postId}:`, error);
        results.push({
          postId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in bulk-regenerate-images:', error);
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
