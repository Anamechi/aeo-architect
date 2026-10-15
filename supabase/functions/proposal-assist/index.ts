import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cleans up rough notes or a short bio into clear prose for a client proposal.
// Gemini via the OpenAI-compatible endpoint, key server-side. Returns plain text.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, kind } = await req.json();
    if (!text || !String(text).trim()) {
      return new Response(JSON.stringify({ error: "No text provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const target =
      kind === "bio"
        ? "a short, confident professional bio of two or three sentences, in the first person"
        : "clear, organized notes that summarize what the client said and what they need";

    const systemPrompt =
      `You clean up rough text into ${target}. ` +
      "Keep every fact the writer gave you and invent nothing. " +
      "Write in plain, professional language. Do not use dashes as punctuation. Do not use contractions. " +
      "Return only the cleaned text, with no preamble and no quotation marks.";

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: String(text).slice(0, 8000) },
          ],
          temperature: 0.3,
        }),
      },
    );

    if (!resp.ok) {
      const detail = await resp.text();
      throw new Error(`LLM request failed: ${resp.status} ${detail}`);
    }

    const completion = await resp.json();
    const cleaned: string = (completion?.choices?.[0]?.message?.content ?? "").trim();
    return new Response(JSON.stringify({ text: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
