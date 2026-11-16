// Q&A sitemap. robots.txt and sitemap.xml reference this URL but no static
// file existed (it 404'd). Today the 88 published Q&As are consolidated on the
// single /faq page, which the edge prerender serves in full with FAQPage
// structured data, so this points crawlers there. If standalone per-answer
// pages are added later, enumerate their URLs here.

const SITE = "https://anamechimarketing.com";

export const onRequest = async (): Promise<Response> => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/faq</loc><changefreq>weekly</changefreq></url></urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
