import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { citations } = await req.json();
    
    if (!Array.isArray(citations) || citations.length === 0) {
      return new Response(
        JSON.stringify({ results: [], summary: { valid: 0, broken: 0, slow: 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${citations.length} citations...`);

    const results = await Promise.all(
      citations.map(async (citation: { url: string; title: string }) => {
        try {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(citation.url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BlogCitationValidator/1.0)'
            }
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;

          const status = response.ok ? 'valid' : 'broken';
          const statusCode = response.status;

          console.log(`${citation.url}: ${statusCode} (${responseTime}ms)`);

          return {
            url: citation.url,
            title: citation.title,
            status,
            statusCode,
            responseTime,
            message: response.ok 
              ? `Valid (${responseTime}ms)` 
              : `HTTP ${statusCode}`
          };
        } catch (error) {
          console.error(`Failed to validate ${citation.url}:`, error);
          
          if (error instanceof Error && error.name === 'AbortError') {
            return {
              url: citation.url,
              title: citation.title,
              status: 'timeout',
              statusCode: 0,
              responseTime: 10000,
              message: 'Request timeout (>10s)'
            };
          }

          return {
            url: citation.url,
            title: citation.title,
            status: 'error',
            statusCode: 0,
            responseTime: 0,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const summary = {
      valid: results.filter(r => r.status === 'valid').length,
      broken: results.filter(r => r.status === 'broken').length,
      slow: results.filter(r => r.responseTime > 5000).length,
      timeout: results.filter(r => r.status === 'timeout').length,
      error: results.filter(r => r.status === 'error').length
    };

    console.log('Validation summary:', summary);

    // Store validation results in citations table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const result of results) {
      if (result.statusCode > 0) {
        await supabaseClient
          .from('citations')
          .upsert({
            url: result.url,
            title: result.title,
            status: result.status === 'valid' ? 'valid' : 'broken',
            authority_score: result.status === 'valid' ? 75 : 0,
            last_checked: new Date().toISOString()
          }, {
            onConflict: 'url'
          });
      }
    }

    return new Response(
      JSON.stringify({ results, summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validate-citations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
        summary: { valid: 0, broken: 0, slow: 0 }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
