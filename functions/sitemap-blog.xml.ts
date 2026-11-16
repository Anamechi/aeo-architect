// Dynamic blog sitemap. robots.txt and sitemap.xml reference this URL, but no
// static file existed, so it 404'd and crawlers had no index of the article
// URLs (which the edge prerender now serves). This lists every published post.

const SUPABASE_URL = "https://hjbylbjbxjotbijzrwma.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnlsYmpieGpvdGJpanpyd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzIxMTQsImV4cCI6MjA3NzQ0ODExNH0.Wr4LCkzteMzDgd-SUsFEoBtb3WHf--2kwMkYC66K56o";
const SITE = "https://anamechimarketing.com";

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const onRequest = async (): Promise<Response> => {
  let urls = `<url><loc>${SITE}/blog</loc><changefreq>daily</changefreq></url>`;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,updated_at,published_at&order=published_at.desc.nullslast&limit=500`,
      { headers: { apikey: ANON, authorization: `Bearer ${ANON}` }, signal: AbortSignal.timeout(4500) },
    );
    if (res.ok) {
      const rows = (await res.json()) as any[];
      if (Array.isArray(rows)) {
        urls += rows
          .filter((r) => r.slug)
          .map((r) => {
            const lm = r.updated_at || r.published_at;
            return `<url><loc>${SITE}/blog/${esc(r.slug)}</loc>${lm ? `<lastmod>${esc(String(lm).slice(0, 10))}</lastmod>` : ""}<changefreq>weekly</changefreq></url>`;
          })
          .join("");
      }
    }
  } catch {
    // On any failure, still return a valid sitemap with at least the blog index.
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
