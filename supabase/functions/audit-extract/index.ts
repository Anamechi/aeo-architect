import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extracts business context and automatable workflows from an interview transcript.
// Returns JSON only. The caller merges this into empty fields; nothing the admin
// typed is ever overwritten here. Follows the generate-* functions: Gemini via the
// OpenAI-compatible endpoint, key read from the environment and never sent to the client.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || !String(text).trim()) {
      return new Response(JSON.stringify({ error: "No transcript text provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt =
      "You are helping an AI and marketing agency consultant prepare a business audit. " +
      "From the interview notes, extract the business context and the recurring workflows that could be automated. " +
      "Return ONLY valid JSON, no prose, no code fences. Use this exact shape: " +
      '{"fields":{"businessName":"","industry":"","contact":"","teamSize":"","goals":"","tools":"","constraints":""},' +
      '"workflows":[{"name":"","owner":"","freq":"","hours":0,"impact":3,"effort":3}]}. ' +
      "hours is estimated hours per month spent on the task. impact and effort are integers from 1 to 5. " +
      'Use an empty string for any field you cannot determine. Write in plain language with no dashes used as punctuation and no contractions.';

    const userPrompt = "INTERVIEW NOTES:\n" + String(text).slice(0, 12000);

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      },
    );

    if (!resp.ok) {
      const detail = await resp.text();
      throw new Error(`LLM request failed: ${resp.status} ${detail}`);
    }

    const completion = await resp.json();
    const raw: string = completion?.choices?.[0]?.message?.content ?? "";

    let data: unknown = null;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start >= 0 && end > start) {
        data = JSON.parse(raw.slice(start, end + 1));
      }
    } catch {
      data = null;
    }

    if (!data || typeof data !== "object") {
      return new Response(
        JSON.stringify({ error: "Could not read those notes. Try a cleaner transcript." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const obj = data as { fields?: Record<string, unknown>; workflows?: Array<Record<string, unknown>> };
    return new Response(
      JSON.stringify({ fields: obj.fields ?? {}, workflows: Array.isArray(obj.workflows) ? obj.workflows : [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
