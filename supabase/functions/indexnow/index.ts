import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://home.anamechimarketing.com";
const INDEXNOW_KEY = "anamechi-indexnow-key-2024";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Return the key file content
    if (action === "key") {
      return new Response(INDEXNOW_KEY, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain",
        },
      });
    }

    // Submit URLs to IndexNow
    if (req.method === "POST") {
      const body = await req.json();
      const urls = body.urls || [];

      if (urls.length === 0) {
        return new Response(
          JSON.stringify({ error: "No URLs provided" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Submit to multiple search engines
      const engines = [
        "https://api.indexnow.org/indexnow",
        "https://www.bing.com/indexnow",
        "https://yandex.com/indexnow",
      ];

      const results = await Promise.allSettled(
        engines.map(async (engine) => {
          const response = await fetch(engine, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              host: "home.anamechimarketing.com",
              key: INDEXNOW_KEY,
              keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
              urlList: urls.map((u: string) => 
                u.startsWith("http") ? u : `${SITE_URL}${u}`
              ),
            }),
          });
          
          return {
            engine,
            status: response.status,
            ok: response.ok,
          };
        })
      );

      console.log("IndexNow submission results:", results);

      return new Response(
        JSON.stringify({
          success: true,
          submitted: urls.length,
          results: results.map((r) => 
            r.status === "fulfilled" ? r.value : { error: r.reason }
          ),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default: return instructions
    return new Response(
      JSON.stringify({
        message: "IndexNow API",
        endpoints: {
          "GET ?action=key": "Get the IndexNow verification key",
          "POST": "Submit URLs for indexing. Body: { urls: ['/path1', '/path2'] }",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("IndexNow error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process IndexNow request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
