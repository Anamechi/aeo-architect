// Bot-aware edge prerender for anamechimarketing.com
//
// WHY: the site is a client-rendered SPA. Robots.txt invites every AI engine
// (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended) and the
// sitemaps point them at every page, but the served HTML is a blank app shell
// with no page content. AI engines that do not run JavaScript read nothing.
//
// This Cloudflare Pages middleware runs at the edge on every request. It only
// ever acts for a KNOWN CRAWLER user agent on an HTML page route: it reads the
// published content from Supabase and returns real HTML with the page title,
// metadata, structured data, headings and body text.
//
// FAIL-OPEN BY CONSTRUCTION: real humans are never a known crawler UA, so the
// very first checks return context.next() and they get the exact same working
// SPA and assets as today. The Supabase read is never reached by a human. On
// ANY error, timeout, bad path, or empty result, the crawler branch also falls
// back to context.next() and receives today's shell (no worse than current).
// Nothing in this file can return a 500 to a visitor.

const SUPABASE_URL = "https://hjbylbjbxjotbijzrwma.supabase.co";
// Public anon/publishable key — already shipped in the client bundle and in
// DEPLOYMENT.md. It only reads content the anon role is allowed to read, which
// under the locked-down RLS is published posts, published Q&A, and active
// service packages. No elevated access.
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnlsYmpieGpvdGJpanpyd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzIxMTQsImV4cCI6MjA3NzQ0ODExNH0.Wr4LCkzteMzDgd-SUsFEoBtb3WHf--2kwMkYC66K56o";
const SITE = "https://anamechimarketing.com";

// Known search + AI crawler user agents. Kept broad on purpose: a human browser
// UA never matches these tokens.
const CRAWLER_RE =
  /(googlebot|google-extended|bingbot|slurp|duckduckbot|baiduspider|yandex|applebot|gptbot|chatgpt-user|oai-searchbot|perplexitybot|perplexity-user|claudebot|claude-web|anthropic-ai|ccbot|facebookexternalhit|facebot|twitterbot|linkedinbot|pinterest|whatsapp|telegrambot|discordbot|bytespider|amazonbot|crawler|spider)/i;

// Anything with a file extension, or a known static path, is served as-is.
const ASSET_RE = /\.(js|css|mjs|map|png|jpe?g|gif|svg|webp|avif|ico|txt|xml|json|mp4|webm|woff2?|ttf|otf|eot|pdf)$/i;

interface Ctx {
  request: Request;
  next: () => Promise<Response>;
}

export const onRequest = async (context: Ctx): Promise<Response> => {
  const { request, next } = context;
  try {
    if (request.method !== "GET") return next();

    const url = new URL(request.url);
    const path = url.pathname;

    if (
      path.startsWith("/admin") ||
      path.startsWith("/assets/") ||
      path.startsWith("/media/") ||
      path === "/robots.txt" ||
      path.startsWith("/sitemap") ||
      ASSET_RE.test(path)
    ) {
      return next();
    }

    const ua = request.headers.get("user-agent") || "";
    if (!CRAWLER_RE.test(ua)) return next();

    // From here down: a known crawler on an HTML route. Everything is wrapped so
    // any failure falls open to the SPA.
    const html = await renderPath(path);
    if (!html) return next();

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=3600",
        "x-prerender": "edge",
      },
    });
  } catch {
    return next();
  }
};

// ---------- data ----------

async function sb(query: string): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: ANON, authorization: `Bearer ${ANON}`, accept: "application/json" },
    signal: AbortSignal.timeout(4500),
  });
  if (!res.ok) return null;
  return res.json();
}

// ---------- routing ----------

async function renderPath(path: string): Promise<string | null> {
  if (path === "/" || path === "") return homePage();
  if (path === "/about") return aboutPage();
  if (path === "/services") return servicesPage();
  if (path === "/blog") return blogIndexPage();
  if (path.startsWith("/blog/")) return blogArticlePage(decodeURIComponent(path.slice("/blog/".length)));
  if (path === "/faq") return faqPage();
  return null; // unknown route -> fall open to the SPA
}

// ---------- helpers ----------

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Only accept a real hosted URL for social/metadata images. Some content has
// featured_image_url stored as a multi-megabyte base64 data URI, which is
// useless as an og:image and would bloat the page; fall back to the brand card.
function imgUrl(u?: string): string {
  return u && /^https?:\/\//i.test(u) ? u : `${SITE}/media/og.jpg`;
}

const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "ANAMECHI Marketing",
  url: SITE,
  logo: `${SITE}/media/logo.png`,
  description:
    "Done-for-you AI and marketing systems for service businesses: AI Engine Optimization, marketing automation, and content strategy.",
  founder: { "@type": "Person", name: "Dr. Deanna Romulus", jobTitle: "Founder and CEO" },
  sameAs: [
    "https://www.linkedin.com/in/deannaromulusmba",
    "https://www.youtube.com/@ANAMECHIMarketing",
  ],
};

function breadcrumb(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function page(opts: {
  title: string;
  description: string;
  canonical: string;
  bodyHtml: string;
  schemas: any[];
  image?: string;
  ogType?: string;
}): string {
  const brand = " | ANAMECHI Marketing";
  const fullTitle = opts.title.includes(brand) ? opts.title : opts.title + brand;
  const img = opts.image || `${SITE}/media/og.jpg`;
  const schemas = [ORG, ...opts.schemas];
  const ld = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="canonical" href="${esc(opts.canonical)}">
<meta property="og:type" content="${esc(opts.ogType || "website")}">
<meta property="og:site_name" content="ANAMECHI Marketing">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${esc(opts.canonical)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(opts.description)}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="robots" content="index, follow">
${ld}
</head>
<body>
<header><a href="${SITE}/"><strong>ANAMECHI Marketing</strong></a>
<nav><a href="${SITE}/services">Services</a> <a href="${SITE}/about">About</a> <a href="${SITE}/blog">Blog</a> <a href="${SITE}/faq">FAQ</a></nav>
</header>
<main>
${opts.bodyHtml}
</main>
<footer><p>ANAMECHI Marketing. Done-for-you AI and marketing systems for service businesses. <a href="${SITE}/contact">Contact</a>.</p></footer>
</body>
</html>`;
}

// Minimal, robust Markdown to HTML. It converts the structural elements
// crawlers care about (headings, paragraphs, lists, links, bold, code) and
// degrades any unhandled syntax to readable text. Content is authored by the
// site owner, so it is trusted.
function mdToHtml(md: string): string {
  const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCode = false;
  const code: string[] = [];

  const inline = (t: string) =>
    esc(t)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt, href) => `<a href="${esc(href)}">${txt}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length && listType) {
      out.push(`<${listType}>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</${listType}>`);
      list = [];
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      if (inCode) {
        out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
        code.length = 0;
        inCode = false;
      } else {
        flushPara();
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      const level = Math.min(h[1].length + 1, 6); // bump so article h1 stays the title
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      continue;
    }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul) {
      flushPara();
      if (listType !== "ul") flushList();
      listType = "ul";
      list.push(ul[1]);
      continue;
    }
    if (ol) {
      flushPara();
      if (listType !== "ol") flushList();
      listType = "ol";
      list.push(ol[1]);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushList();
      para.push(line.replace(/^\s*>\s?/, ""));
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  if (inCode && code.length) out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
  flushPara();
  flushList();
  return out.join("\n");
}

// ---------- pages ----------

function homePage(): string {
  const canonical = `${SITE}/`;
  return page({
    title: "Done-For-You AI + Marketing Systems for Service Businesses",
    description:
      "ANAMECHI Marketing installs done-for-you AI and marketing systems for service businesses. AI Engine Optimization, marketing automation, and content strategy, built and run for you.",
    canonical,
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ANAMECHI Marketing",
        url: SITE,
      },
    ],
    bodyHtml: `
<h1>Done-for-you AI and marketing systems for service businesses</h1>
<p>We install the system. Then we run it. ANAMECHI Marketing builds and operates the AI and marketing infrastructure a service business needs to get found, get cited by AI engines, and turn attention into booked work.</p>
<h2>What we do</h2>
<ul>
<li><strong>AI Engine Optimization (AEO):</strong> get your brand cited by AI models like ChatGPT, Perplexity, and Google AI Overviews.</li>
<li><strong>Marketing automation:</strong> CRM, lead capture, and follow-up systems that run without you.</li>
<li><strong>Content strategy:</strong> authoritative content that ranks and gets referenced.</li>
</ul>
<p><a href="${SITE}/services">See our services</a> or <a href="${SITE}/contact">book a fit call</a>.</p>`,
  });
}

function aboutPage(): string {
  const canonical = `${SITE}/about`;
  return page({
    title: "About ANAMECHI Marketing - AI Engine Optimization Experts",
    description:
      "Meet Dr. Deanna Romulus and ANAMECHI Marketing. We help service businesses become visible and citable to AI engines through done-for-you AI and marketing systems.",
    canonical,
    schemas: [
      breadcrumb([
        { name: "Home", url: `${SITE}/` },
        { name: "About", url: canonical },
      ]),
    ],
    bodyHtml: `
<h1>About ANAMECHI Marketing</h1>
<p>ANAMECHI Marketing is a done-for-you AI and marketing agency founded by Dr. Deanna Romulus, EdD, MBA. We help service businesses build predictable visibility and revenue through AI Engine Optimization, marketing automation, and content systems that we install and run.</p>
<h2>Our approach</h2>
<p>Structure before scale. We build the systems that make a business findable, citable by AI engines, and able to convert attention into booked work, then we operate them so the owner does not have to.</p>`,
  });
}

async function servicesPage(): Promise<string> {
  const canonical = `${SITE}/services`;
  const pkgs =
    (await sb("service_packages?status=eq.active&select=name,description,category&order=sort_order.asc")) || [];
  const items = Array.isArray(pkgs) ? pkgs : [];
  const list = items.length
    ? `<ul>${items
        .map((p: any) => `<li><strong>${esc(p.name)}</strong>${p.description ? `: ${esc(p.description)}` : ""}</li>`)
        .join("")}</ul>`
    : "";
  const serviceSchema = items.length
    ? [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: items.map((p: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "Service", name: p.name, description: p.description || undefined, provider: { "@id": `${SITE}/#organization` } },
          })),
        },
      ]
    : [];
  return page({
    title: "AI-Powered Marketing Services",
    description:
      "Done-for-you AI and marketing services for service businesses: AI Engine Optimization, marketing automation, CRM, and content strategy. Built and run for you by ANAMECHI Marketing.",
    canonical,
    schemas: [
      breadcrumb([
        { name: "Home", url: `${SITE}/` },
        { name: "Services", url: canonical },
      ]),
      ...serviceSchema,
    ],
    bodyHtml: `
<h1>AI-powered marketing services</h1>
<p>We install and operate the systems a service business needs to get found, get cited by AI engines, and convert attention into booked work.</p>
${list}
<p><a href="${SITE}/contact">Book a fit call</a> to see which system to build first.</p>`,
  });
}

async function blogIndexPage(): Promise<string> {
  const canonical = `${SITE}/blog`;
  const posts =
    (await sb(
      "blog_posts?status=eq.published&select=title,slug,excerpt,published_at&order=published_at.desc.nullslast&limit=50",
    )) || [];
  const items = Array.isArray(posts) ? posts : [];
  const list = items
    .map(
      (p: any) =>
        `<article><h2><a href="${SITE}/blog/${esc(p.slug)}">${esc(p.title)}</a></h2>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ""}</article>`,
    )
    .join("\n");
  return page({
    title: "AEO & Digital Marketing Blog - Expert Insights & Strategies",
    description:
      "Learn AI Engine Optimization, SEO, content strategy, and marketing automation for service businesses. Expert insights from ANAMECHI Marketing.",
    canonical,
    schemas: [
      breadcrumb([
        { name: "Home", url: `${SITE}/` },
        { name: "Blog", url: canonical },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        url: canonical,
        name: "ANAMECHI Marketing Blog",
        blogPost: items.map((p: any) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE}/blog/${p.slug}`,
          datePublished: p.published_at || undefined,
        })),
      },
    ],
    bodyHtml: `
<h1>ANAMECHI Marketing blog</h1>
<p>AI Engine Optimization, SEO, content strategy, and marketing automation for service businesses.</p>
${list || "<p>New articles are published regularly.</p>"}`,
  });
}

async function blogArticlePage(slug: string): Promise<string | null> {
  if (!slug) return null;
  const rows = await sb(
    `blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,excerpt,meta_description,content,featured_image_url,image_alt_text,published_at,updated_at,reading_time,category,author:author_id(name,title,bio)&limit=1`,
  );
  const post = Array.isArray(rows) && rows.length ? rows[0] : null;
  if (!post) return null; // unknown/unpublished slug -> fall open
  const canonical = `${SITE}/blog/${slug}`;
  const author = post.author?.name || "Dr. Deanna Romulus";
  const desc = post.meta_description || post.excerpt || `${post.title} from ANAMECHI Marketing.`;
  const img = imgUrl(post.featured_image_url);
  return page({
    title: post.title,
    description: desc,
    canonical,
    image: img,
    ogType: "article",
    schemas: [
      breadcrumb([
        { name: "Home", url: `${SITE}/` },
        { name: "Blog", url: `${SITE}/blog` },
        { name: post.title, url: canonical },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: desc,
        image: /^https?:\/\//i.test(post.featured_image_url || "") ? post.featured_image_url : undefined,
        datePublished: post.published_at || undefined,
        dateModified: post.updated_at || post.published_at || undefined,
        author: { "@type": "Person", name: author },
        publisher: { "@id": `${SITE}/#organization` },
        mainEntityOfPage: canonical,
      },
    ],
    bodyHtml: `
<article>
<h1>${esc(post.title)}</h1>
${post.excerpt ? `<p><em>${esc(post.excerpt)}</em></p>` : ""}
<p>By ${esc(author)}${post.published_at ? ` on ${esc(new Date(post.published_at).toISOString().slice(0, 10))}` : ""}${post.reading_time ? ` &middot; ${esc(post.reading_time)} min read` : ""}</p>
<div>${mdToHtml(post.content || "")}</div>
</article>`,
  });
}

async function faqPage(): Promise<string> {
  const canonical = `${SITE}/faq`;
  const rows =
    (await sb(
      "qa_articles?status=eq.published&select=question,answer&order=created_at.desc&limit=100",
    )) || [];
  const items = Array.isArray(rows) ? rows : [];
  const body = items
    .map((q: any) => `<section><h2>${esc(q.question)}</h2><div>${mdToHtml(q.answer || "")}</div></section>`)
    .join("\n");
  const faqSchema = items.length
    ? [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((q: any) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: { "@type": "Answer", text: String(q.answer || "").slice(0, 1200) },
          })),
        },
      ]
    : [];
  return page({
    title: "Frequently Asked Questions",
    description:
      "Answers about AI Engine Optimization, marketing automation, content strategy, and working with ANAMECHI Marketing.",
    canonical,
    schemas: [
      breadcrumb([
        { name: "Home", url: `${SITE}/` },
        { name: "FAQ", url: canonical },
      ]),
      ...faqSchema,
    ],
    bodyHtml: `
<h1>Frequently asked questions</h1>
${body || "<p>Answers are published regularly.</p>"}`,
  });
}
