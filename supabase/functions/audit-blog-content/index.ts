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
    const { postId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch the blog post
    const { data: post, error: fetchError } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Audit criteria
    const systemPrompt = `You are the Content Quality Auditor for ANAMECHI Marketing. Analyze the following blog post against these standards:

1. Visual & Readability: Short paragraphs (2-4 lines), proper headers, white space
2. Structure: Engaging intro, logical flow, FAQ/takeaways, strong CTA
3. Brand Voice: Intelligent, visionary, empowering, culturally resonant
4. SEO/AEO: Meta description, semantic keywords, internal/external links, EEAT
5. Technical: Grammar, 1500-2000 words, readability ≤9, alt text for images
6. Spell-Check: Flag any spelling errors found in the content
7. Professional Tone: Flag any informal, unprofessional, or overly casual language
8. Group ID: Check if the article belongs to a content cluster
9. Citations: Check for at least 3 authoritative citations
10. Hreflang: Check if hreflang is set for translated content

Return a JSON object with:
{
  "overallScore": 0-100,
  "issues": [{"category": "Visual/Structure/Voice/SEO/Technical/Spelling/Tone", "severity": "critical/major/minor", "description": "..."}],
  "hasImage": boolean,
  "imageQuality": "missing/poor/good/excellent",
  "wordCount": number,
  "readabilityGrade": number,
  "missingElements": ["meta_description", "internal_links", "citations", "group_id", "hreflang", etc],
  "needsRewrite": boolean,
  "suggestedImprovements": ["..."],
  "spellingErrors": ["..."],
  "toneIssues": ["..."],
  "spellChecked": boolean,
  "toneValidated": boolean
}`;

    const userPrompt = `
Title: ${post.title}
Excerpt: ${post.excerpt || 'N/A'}
Content: ${post.content}
Meta Description: ${post.meta_description || 'N/A'}
Featured Image: ${post.featured_image_url ? 'Yes' : 'No'}
Funnel Stage: ${post.funnel_stage || 'N/A'}
Category: ${post.category || 'N/A'}
Group ID: ${post.group_id || 'MISSING'}
Language: ${post.language || 'en'}
Hreflang: ${post.hreflang || 'N/A'}
Image Alt Text: ${post.image_alt_text || 'MISSING'}
`;

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
        tools: [{
          type: "function",
          function: {
            name: "audit_blog_post",
            description: "Return blog post audit results",
            parameters: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      severity: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                hasImage: { type: "boolean" },
                imageQuality: { type: "string" },
                wordCount: { type: "number" },
                readabilityGrade: { type: "number" },
                missingElements: { type: "array", items: { type: "string" } },
                needsRewrite: { type: "boolean" },
                suggestedImprovements: { type: "array", items: { type: "string" } },
                spellingErrors: { type: "array", items: { type: "string" } },
                toneIssues: { type: "array", items: { type: "string" } },
                spellChecked: { type: "boolean" },
                toneValidated: { type: "boolean" },
              },
              required: ["overallScore", "issues", "hasImage", "needsRewrite"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "audit_blog_post" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const auditResults = JSON.parse(
      data.choices[0].message.tool_calls[0].function.arguments
    );

    return new Response(
      JSON.stringify({
        postId: post.id,
        title: post.title,
        status: post.status,
        audit: auditResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in audit-blog-content:', error);
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
