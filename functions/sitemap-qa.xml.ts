// Dynamic Q&A sitemap. Lists /faq plus every published Q&A page (/faq/:slug),
// which the edge prerender serves with QAPage structured data.

const SUPABASE_URL = "https://hjbylbjbxjotbijzrwma.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnlsYmpieGpvdGJpanpyd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzIxMTQsImV4cCI6MjA3NzQ0ODExNH0.Wr4LCkzteMzDgd-SUsFEoBtb3WHf--2kwMkYC66K56o";
const SITE = "https://anamechimarketing.com";

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const onRequest = async (): Promise<Response> => {
  let urls = `<url><loc>${SITE}/faq</loc><changefreq>weekly</changefreq></url>`;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/qa_articles?status=eq.published&select=slug,updated_at&order=created_at.desc&limit=1000`,
      { headers: { apikey: ANON, authorization: `Bearer ${ANON}` }, signal: AbortSignal.timeout(4500) },
    );
    if (res.ok) {
      const rows = (await res.json()) as any[];
      if (Array.isArray(rows)) {
        urls += rows
          .filter((r) => r.slug)
          .map(
            (r) =>
              `<url><loc>${SITE}/faq/${esc(r.slug)}</loc>${r.updated_at ? `<lastmod>${esc(String(r.updated_at).slice(0, 10))}</lastmod>` : ""}<changefreq>monthly</changefreq></url>`,
          )
          .join("");
      }
    }
  } catch {
    // On any failure, still return a valid sitemap with at least /faq.
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
