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
    const { postIds } = await req.json();
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      throw new Error('postIds array is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const results = [];

    // Process each post
    for (const postId of postIds) {
      try {
        console.log(`Generating alt text for post: ${postId}`);

        // Fetch post details
        const { data: post, error: fetchError } = await supabaseClient
          .from('blog_posts')
          .select('id, title, excerpt, content, category, funnel_stage, featured_image_url, schema_data')
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

        // Skip if no image
        if (!post.featured_image_url) {
          console.log(`No featured image for post: ${post.title}`);
          results.push({
            postId,
            title: post.title,
            success: false,
            error: 'No featured image'
          });
          continue;
        }

        // Create system prompt for alt text generation
        const systemPrompt = `You are an SEO expert specializing in image accessibility and alt text optimization.

Generate a concise, descriptive alt text for a blog post's featured image.

ALT TEXT REQUIREMENTS:
- Length: 80-125 characters (strict limit)
- Include primary keyword naturally
- Describe what's visually in the image
- Focus on content relevance, not generic descriptions
- Use active voice and specific details
- NO marketing fluff or promotional language
- NO "image of" or "picture of" prefixes
- SEO-optimized but human-readable

Return ONLY the alt text, nothing else.`;

        const userPrompt = `Blog Post Context:
Title: ${post.title}
Category: ${post.category || 'Marketing'}
Funnel Stage: ${post.funnel_stage || 'TOFU'}
Excerpt: ${post.excerpt || post.content.substring(0, 300)}

Generate SEO-optimized alt text for the featured image that:
1. Describes the visual content
2. Includes relevant keywords from the title
3. Aligns with the post's topic and purpose
4. Follows accessibility best practices
5. Stays within 80-125 characters`;

        console.log('Generating alt text with AI...');

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
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 100,
            temperature: 0.7
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          
          if (response.status === 429) {
            results.push({
              postId,
              title: post.title,
              success: false,
              error: 'Rate limit exceeded'
            });
            continue;
          }
          if (response.status === 402) {
            results.push({
              postId,
              title: post.title,
              success: false,
              error: 'AI credits depleted'
            });
            continue;
          }
          
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        let altText = data.choices?.[0]?.message?.content?.trim();

        if (!altText) {
          console.error('No alt text generated for post:', postId);
          results.push({
            postId,
            title: post.title,
            success: false,
            error: 'No alt text generated'
          });
          continue;
        }

        // Clean up alt text (remove quotes if present)
        altText = altText.replace(/^["']|["']$/g, '');

        // Truncate if too long
        if (altText.length > 125) {
          altText = altText.substring(0, 122) + '...';
        }

        console.log('Generated alt text:', altText);

        // Store in schema_data for now (we'll add alt_text column later if needed)
        const currentSchemaData = post.schema_data || {};
        const updatedSchemaData = {
          ...currentSchemaData,
          image_alt_text: altText
        };

        // Update post
        const { error: updateError } = await supabaseClient
          .from('blog_posts')
          .update({
            schema_data: updatedSchemaData,
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
            altText,
            length: altText.length
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
    console.error('Error in generate-image-alt-text:', error);
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
