import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  topic: string;
  count: number;
  category?: string;
  funnelStage?: 'TOFU' | 'MOFU' | 'BOFU';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, count, category, funnelStage }: GenerateRequest = await req.json();
    
    if (!topic || !count || count < 1 || count > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Topic is required and count must be 1-20.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert FAQ generator for ANAMECHI Marketing, a digital marketing agency.
Generate FAQs that are:
- Clear, concise, and answer-first
- SEO-optimized with natural language
- Aligned with the specified funnel stage (TOFU = awareness, MOFU = consideration, BOFU = conversion)
- Professional yet approachable
- Focused on marketing automation, CRM, and digital marketing topics`;

    const userPrompt = `Generate ${count} frequently asked questions about "${topic}" for ${category || 'General'} category at the ${funnelStage || 'TOFU'} funnel stage.

Each FAQ should:
1. Have a question that real people would ask
2. Provide a detailed, helpful answer (150-300 words)
3. Include 2-4 relevant keywords
4. Be optimized for voice search (conversational)

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "What is...",
    "answer": "Detailed answer here...",
    "keywords": ["keyword1", "keyword2"]
  }
]`;

    // Call Lovable AI with structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_faqs',
              description: 'Generate a list of FAQ items',
              parameters: {
                type: 'object',
                properties: {
                  faqs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' },
                        keywords: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                      required: ['question', 'answer', 'keywords'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['faqs'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_faqs' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract FAQs from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No valid response from AI');
    }

    const parsedArgs = JSON.parse(toolCall.function.arguments);
    const generatedFaqs = parsedArgs.faqs || [];

    if (!Array.isArray(generatedFaqs) || generatedFaqs.length === 0) {
      throw new Error('Failed to generate FAQs');
    }

    // Format FAQs for database insertion
    const formattedFaqs = generatedFaqs.map((faq: any) => ({
      question: faq.question,
      answer: faq.answer,
      slug: faq.question.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      tags: faq.keywords || [],
      funnel_stage: funnelStage || 'TOFU',
      status: 'draft',
      meta_description: faq.answer.substring(0, 160)
    }));

    return new Response(
      JSON.stringify({ faqs: formattedFaqs }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error generating FAQs:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate FAQs' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
