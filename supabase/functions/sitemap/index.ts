import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

const SITE_URL = "https://home.anamechimarketing.com";

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/services", priority: "0.9", changefreq: "monthly" },
  { path: "/blog", priority: "0.8", changefreq: "daily" },
  { path: "/faq", priority: "0.7", changefreq: "weekly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
  { path: "/ai-tools", priority: "0.6", changefreq: "weekly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "index";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let xmlContent: string;

    switch (type) {
      case "index":
        xmlContent = generateSitemapIndex();
        break;
      case "pages":
        xmlContent = generatePagesSitemap();
        break;
      case "blog":
        xmlContent = await generateBlogSitemap(supabase);
        break;
      case "qa":
        xmlContent = await generateQASitemap(supabase);
        break;
      default:
        xmlContent = generateSitemapIndex();
    }

    console.log(`Generated ${type} sitemap successfully`);

    return new Response(xmlContent, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate sitemap</error>`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      }
    );
  }
});

function generateSitemapIndex(): string {
  const today = new Date().toISOString().split("T")[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-qa.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generatePagesSitemap(): string {
  const today = new Date().toISOString().split("T")[0];
  
  const urls = staticPages.map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

async function generateBlogSitemap(supabase: any): Promise<string> {
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw error;
  }

  const urls = (posts || []).map((post: any) => {
    const lastmod = post.updated_at || post.published_at || new Date().toISOString();
    return `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

async function generateQASitemap(supabase: any): Promise<string> {
  const { data: faqs, error } = await supabase
    .from("qa_articles")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching QA articles:", error);
    throw error;
  }

  const urls = (faqs || []).map((faq: any) => {
    const lastmod = faq.updated_at || faq.published_at || new Date().toISOString();
    return `  <url>
    <loc>${SITE_URL}/faq/${faq.slug}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}
