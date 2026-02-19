// Pre-render edge function for AI crawler discoverability
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://home.anamechimarketing.com";

// Organization schema for all pages
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ANAMECHI Marketing",
  url: SITE_URL,
  logo: `${SITE_URL}/anamechi-logo.svg`,
  description: "Digital marketing agency empowering coaches and consultants through AI Engine Optimization, marketing automation, and AI systems.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "101 Lindenwood Dr STE 225",
    addressLocality: "Malvern",
    addressRegion: "PA",
    postalCode: "19355",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 40.0362,
    longitude: -75.5138,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Service",
    email: "info@anamechimarketing.com",
    telephone: "+1-866-752-7370",
    availableLanguage: "English",
  },
  founder: {
    "@type": "Person",
    name: "Dr. Deanna Romulus",
    jobTitle: "Founder & CEO",
  },
  sameAs: [
    "https://www.linkedin.com/in/deannaromulus",
    "https://x.com/anamechi",
    "https://www.youtube.com/@ANAMECHI",
  ],
  knowsAbout: [
    "AI Engine Optimization",
    "Marketing Automation",
    "CRM Implementation",
    "Brand Strategy",
    "Digital Marketing",
    "AI Content Systems",
  ],
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ANAMECHI Marketing",
  image: `${SITE_URL}/anamechi-logo.svg`,
  url: SITE_URL,
  telephone: "+1-866-752-7370",
  email: "info@anamechimarketing.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "101 Lindenwood Dr STE 225",
    addressLocality: "Malvern",
    addressRegion: "PA",
    postalCode: "19355",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 40.0362,
    longitude: -75.5138,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  priceRange: "$$",
  areaServed: {
    "@type": "State",
    name: "Pennsylvania",
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let html: string;
    let statusCode = 200;

    // Generate page-specific content
    if (path === "/" || path === "") {
      html = await generateHomePage();
    } else if (path === "/about") {
      html = await generateAboutPage();
    } else if (path === "/services") {
      html = await generateServicesPage(supabase);
    } else if (path === "/blog") {
      html = await generateBlogListPage(supabase);
    } else if (path.startsWith("/blog/")) {
      const slug = path.replace("/blog/", "");
      const articleHtml = await generateBlogArticlePage(supabase, slug);
      if (articleHtml) {
        html = articleHtml;
      } else {
        statusCode = 404;
        html = generate404Page();
      }
    } else if (path === "/faq") {
      html = await generateFAQPage(supabase);
    } else if (path === "/contact") {
      html = await generateContactPage();
    } else {
      statusCode = 404;
      html = generate404Page();
    }

    console.log(`Pre-rendered page: ${path}`);

    return new Response(html, {
      status: statusCode,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Pre-render error:", error);
    return new Response(generate500Page(), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
});

function generateBaseHTML(
  title: string,
  description: string,
  canonical: string,
  content: string,
  schemas: any[] = []
): string {
  const allSchemas = [organizationSchema, localBusinessSchema, ...schemas];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ANAMECHI Marketing</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${SITE_URL}${canonical}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title} | ANAMECHI Marketing">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}${canonical}">
  <meta property="og:image" content="${SITE_URL}/assets/og-image.png">
  <meta property="og:site_name" content="ANAMECHI Marketing">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@anamechi">
  <meta name="twitter:title" content="${title} | ANAMECHI Marketing">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${SITE_URL}/assets/og-image.png">
  
  <!-- Structured Data -->
  ${allSchemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join("\n  ")}
</head>
<body>
  <main class="main-content" role="main">
    ${content}
  </main>
  
  <!-- This is a pre-rendered page for AI crawlers. The full interactive version is available at ${SITE_URL}${canonical} -->
</body>
</html>`;
}

async function generateHomePage(): Promise<string> {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    name: "ANAMECHI Marketing",
    description: "AI Engine Optimization and Digital Marketing for Service Businesses",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={query}`,
      "query-input": "required name=query",
    },
  };

  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: SITE_URL,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".main-content", "h1", ".hero-summary"],
    },
  };

  const content = `
    <header class="hero-section">
      <h1>Get Your Brand Cited by AI Models & Search Engines</h1>
      <p class="hero-summary">Position your service business as a trusted authority that ChatGPT, Gemini, Perplexity, and Google recommend in answers and overviews.</p>
    </header>
    
    <section class="services-overview">
      <h2>Strategic Marketing That AI Models Trust</h2>
      <p>We combine AI Engine Optimization, traditional SEO, and marketing automation to make your brand the go-to authority in your space.</p>
      
      <article class="service-item">
        <h3>AI Engine Optimization (AEO)</h3>
        <p>Get your brand cited by ChatGPT, Gemini, Perplexity, and other AI models with structured content that LLMs love.</p>
      </article>
      
      <article class="service-item">
        <h3>SEO & Content Strategy</h3>
        <p>Rank in search engines and AI overviews with EEAT-focused content, schema markup, and technical optimization.</p>
      </article>
      
      <article class="service-item">
        <h3>Marketing Automation</h3>
        <p>Scale your operations with GoHighLevel CRMs, workflow automation, and attribution systems that drive results.</p>
      </article>
      
      <article class="service-item">
        <h3>Brand Visibility</h3>
        <p>Build authority through strategic content, digital PR, and community engagement that establishes you as the expert.</p>
      </article>
    </section>
    
    <section class="benefits">
      <h2>Why Service Businesses Choose ANAMECHI</h2>
      <ul>
        <li>Featured in AI chat responses and answer boxes</li>
        <li>Structured data implementation across all pages</li>
        <li>EEAT-focused content that builds authority</li>
        <li>Technical SEO and performance optimization</li>
        <li>Regular content audits and freshness updates</li>
        <li>Full-funnel marketing automation</li>
      </ul>
    </section>
    
    <section class="cta">
      <h2>Ready to Become an AI-Citable Authority?</h2>
      <p>Let's build a marketing strategy that gets your brand recommended by AI models and search engines.</p>
      <a href="/contact">Schedule a Consultation</a>
    </section>
  `;

  return generateBaseHTML(
    "AI Engine Optimization & Digital Marketing for Service Businesses",
    "Position your brand as an AI-citable authority. Get recommended by ChatGPT, Gemini, and search engines with AEO-optimized content and strategic marketing automation.",
    "/",
    content,
    [websiteSchema, speakableSchema]
  );
}

async function generateAboutPage(): Promise<string> {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Dr. Deanna Romulus",
    jobTitle: "Founder & Visionary Strategist",
    affiliation: {
      "@type": "Organization",
      name: "ANAMECHI Marketing",
    },
    knowsAbout: [
      "AI Engine Optimization",
      "Marketing Automation",
      "Business Strategy",
      "Digital Marketing",
      "CRM Systems",
      "Brand Development",
    ],
    sameAs: [
      "https://www.linkedin.com/in/deannaromulus",
      "https://x.com/anamechi",
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
    ],
  };

  const content = `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li>About</li>
      </ol>
    </nav>
    
    <header>
      <h1>About ANAMECHI Marketing</h1>
      <p class="summary">Empowering entrepreneurs to automate smarter, market confidently, and scale with systems — not stress.</p>
    </header>
    
    <section class="founder">
      <h2>Meet Dr. Deanna Romulus</h2>
      <p>Dr. Deanna Romulus is a Visionary Strategist and Empowerment Architect who helps service businesses build sustainable, automated marketing systems. With expertise in AI Engine Optimization, marketing automation, and brand strategy, she positions entrepreneurs as trusted authorities in their fields.</p>
      <p>As the founder of ANAMECHI Marketing, Dr. Romulus combines deep technical expertise with strategic vision to help coaches, consultants, and service providers get cited by AI models and featured in search results.</p>
    </section>
    
    <section class="methodology">
      <h2>The ANAMECHI Methodology</h2>
      <article>
        <h3>1. Research & Discovery</h3>
        <p>We analyze your market, competitors, and current digital presence to identify opportunities for AI citation and authority building.</p>
      </article>
      <article>
        <h3>2. Strategy & Implementation</h3>
        <p>We create EEAT-focused content, implement structured data, and build automation systems that work around the clock.</p>
      </article>
      <article>
        <h3>3. Optimization & Growth</h3>
        <p>Continuous monitoring, testing, and refinement to maximize your visibility in AI responses and search results.</p>
      </article>
    </section>
    
    <section class="expertise">
      <h2>Core Expertise</h2>
      <ul>
        <li><strong>AI Engine Optimization</strong> - Optimizing for ChatGPT, Gemini, Perplexity citations</li>
        <li><strong>Marketing Automation</strong> - GoHighLevel, workflow design, CRM implementation</li>
        <li><strong>SEO & Content Strategy</strong> - Technical SEO, EEAT content, schema markup</li>
        <li><strong>Brand Authority Building</strong> - Digital PR, thought leadership, community engagement</li>
      </ul>
    </section>
  `;

  return generateBaseHTML(
    "About ANAMECHI Marketing - Our Mission & Team",
    "Learn about ANAMECHI Marketing and our mission to help service businesses become AI-citable authorities through strategic marketing and automation.",
    "/about",
    content,
    [personSchema, breadcrumbSchema]
  );
}

async function generateServicesPage(supabase: any): Promise<string> {
  const { data: packages } = await supabase
    .from("service_packages")
    .select("*")
    .eq("status", "active")
    .order("sort_order");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
    ],
  };

  const servicesContent = (packages || [])
    .map(
      (pkg: any) => `
      <article class="service-package">
        <h3>${pkg.name}</h3>
        <p>${pkg.description || ""}</p>
        ${pkg.features ? `<ul>${(pkg.features as string[]).map((f: string) => `<li>${f}</li>`).join("")}</ul>` : ""}
      </article>
    `
    )
    .join("");

  const content = `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li>Services</li>
      </ol>
    </nav>
    
    <header>
      <h1>Marketing Services for Service Businesses</h1>
      <p class="summary">Strategic marketing packages designed to make your brand an AI-citable authority and automate your growth.</p>
    </header>
    
    <section class="services-list">
      <h2>Our Core Services</h2>
      ${servicesContent || `
        <article class="service-package">
          <h3>AI Engine Optimization (AEO)</h3>
          <p>Get your brand cited by ChatGPT, Gemini, Perplexity, and other AI models with structured content optimization.</p>
        </article>
        <article class="service-package">
          <h3>Marketing Automation</h3>
          <p>Scale your operations with CRM setup, workflow automation, and lead nurturing systems.</p>
        </article>
        <article class="service-package">
          <h3>Content Strategy</h3>
          <p>EEAT-focused content that builds authority and ranks in search engines and AI overviews.</p>
        </article>
      `}
    </section>
    
    <section class="cta">
      <h2>Ready to Get Started?</h2>
      <p>Schedule a consultation to discuss your marketing needs and learn how we can help you become an AI-citable authority.</p>
      <a href="/contact">Book a Consultation</a>
    </section>
  `;

  return generateBaseHTML(
    "Marketing Services - AEO, Automation & Content Strategy",
    "Explore our marketing services including AI Engine Optimization, marketing automation, CRM setup, and content strategy for service businesses.",
    "/services",
    content,
    [breadcrumbSchema]
  );
}

async function generateBlogListPage(supabase: any): Promise<string> {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, published_at, category")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ],
  };

  const postsContent = (posts || [])
    .map(
      (post: any) => `
      <article class="blog-post-preview">
        <h3><a href="/blog/${post.slug}">${post.title}</a></h3>
        <p>${post.excerpt || ""}</p>
        <time datetime="${post.published_at}">${new Date(post.published_at).toLocaleDateString()}</time>
      </article>
    `
    )
    .join("");

  const content = `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li>Blog</li>
      </ol>
    </nav>
    
    <header>
      <h1>Marketing Insights & Strategy Blog</h1>
      <p class="summary">Expert articles on AI Engine Optimization, marketing automation, SEO, and building authority as a service business.</p>
    </header>
    
    <section class="blog-posts">
      ${postsContent || "<p>New content coming soon. Check back for expert marketing insights.</p>"}
    </section>
  `;

  return generateBaseHTML(
    "Marketing Blog - AEO, SEO & Automation Insights",
    "Read expert articles on AI Engine Optimization, marketing automation, SEO strategy, and how service businesses can become AI-citable authorities.",
    "/blog",
    content,
    [breadcrumbSchema]
  );
}

async function generateBlogArticlePage(supabase: any, slug: string): Promise<string | null> {
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*, authors:author_id(name, title, bio)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.meta_description,
    author: {
      "@type": "Person",
      name: post.authors?.name || "Dr. Deanna Romulus",
    },
    publisher: {
      "@type": "Organization",
      name: "ANAMECHI Marketing",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/anamechi-logo.svg`,
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
    image: post.featured_image_url || `${SITE_URL}/assets/og-image.png`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
    ],
  };

  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: `${SITE_URL}/blog/${slug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".article-content", "h1", ".article-summary"],
    },
  };

  const content = `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/blog">Blog</a></li>
        <li>${post.title}</li>
      </ol>
    </nav>
    
    <article class="blog-article">
      <header>
        <h1>${post.title}</h1>
        <p class="article-summary">${post.excerpt || ""}</p>
        <div class="article-meta">
          <span class="author">By ${post.authors?.name || "Dr. Deanna Romulus"}</span>
          <time datetime="${post.published_at}">${new Date(post.published_at).toLocaleDateString()}</time>
          ${post.reading_time ? `<span class="reading-time">${post.reading_time} min read</span>` : ""}
        </div>
      </header>
      
      <div class="article-content">
        ${post.content || ""}
      </div>
      
      ${post.authors ? `
        <footer class="author-bio">
          <h3>About the Author</h3>
          <p><strong>${post.authors.name}</strong>${post.authors.title ? `, ${post.authors.title}` : ""}</p>
          <p>${post.authors.bio || ""}</p>
        </footer>
      ` : ""}
    </article>
  `;

  return generateBaseHTML(
    post.title,
    post.meta_description || post.excerpt || `Read ${post.title} on ANAMECHI Marketing Blog`,
    `/blog/${slug}`,
    content,
    [articleSchema, breadcrumbSchema, speakableSchema]
  );
}

async function generateFAQPage(supabase: any): Promise<string> {
  const { data: faqs } = await supabase
    .from("qa_articles")
    .select("question, answer")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqs || []).map((faq: any) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/faq` },
    ],
  };

  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: `${SITE_URL}/faq`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".main-content", "h1", ".faq-answer"],
    },
  };

  const faqsContent = (faqs || [])
    .map(
      (faq: any) => `
      <article class="faq-item">
        <h3 class="faq-question">${faq.question}</h3>
        <div class="faq-answer">${faq.answer}</div>
      </article>
    `
    )
    .join("");

  const content = `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li>FAQ</li>
      </ol>
    </nav>
    
    <header>
      <h1>Frequently Asked Questions</h1>
      <p class="summary">Everything you need to know about AI Engine Optimization, our services, and how we help service businesses build AI-citable authority.</p>
    </header>
    
    <section class="faq-list">
      ${faqsContent || "<p>Check back soon for frequently asked questions about our marketing services.</p>"}
    </section>
    
    <section class="cta">
      <h2>Still Have Questions?</h2>
      <p>Schedule a consultation to discuss your specific needs and learn how we can help you become an AI-citable authority.</p>
      <a href="/contact">Contact Us</a>
    </section>
  `;

  return generateBaseHTML(
    "Frequently Asked Questions - AEO & Digital Marketing",
    "Common questions about AI Engine Optimization (AEO), SEO, content strategy, GoHighLevel implementation, and our marketing services answered by experts.",
    "/faq",
    content,
    [faqSchema, breadcrumbSchema, speakableSchema]
  );
}

async function generateContactPage(): Promise<string> {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact ANAMECHI Marketing",
    description: "Get in touch with ANAMECHI Marketing for AI Engine Optimization and marketing services.",
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "ANAMECHI Marketing",
      email: "info@anamechimarketing.com",
      telephone: "+1-866-752-7370",
      address: {
        "@type": "PostalAddress",
        streetAddress: "101 Lindenwood Dr STE 225",
        addressLocality: "Malvern",
        addressRegion: "PA",
        postalCode: "19355",
        addressCountry: "US",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
    ],
  };

  const content = `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li>Contact</li>
      </ol>
    </nav>
    
    <header>
      <h1>Contact ANAMECHI Marketing</h1>
      <p class="summary">Ready to become an AI-citable authority? Let's talk about your marketing goals.</p>
    </header>
    
    <section class="contact-info">
      <h2>Get In Touch</h2>
      
      <article class="contact-method">
        <h3>Email</h3>
        <p><a href="mailto:info@anamechimarketing.com">info@anamechimarketing.com</a></p>
      </article>
      
      <article class="contact-method">
        <h3>Phone</h3>
        <p><a href="tel:+18667527370">+1-866-752-7370</a></p>
      </article>
      
      <article class="contact-method">
        <h3>Office</h3>
        <address>
          101 Lindenwood Dr STE 225<br>
          Malvern, PA 19355
        </address>
      </article>
      
      <article class="contact-method">
        <h3>Business Hours</h3>
        <p>Monday - Saturday: 9:00 AM - 6:00 PM EST<br>Sunday: Closed</p>
      </article>
    </section>
    
    <section class="cta">
      <h2>Schedule a Consultation</h2>
      <p>Book a free strategy call to discuss how we can help your service business become an AI-citable authority.</p>
    </section>
  `;

  return generateBaseHTML(
    "Contact Us - Get Started with AI Engine Optimization",
    "Contact ANAMECHI Marketing to discuss AI Engine Optimization, marketing automation, and how we can help your service business grow.",
    "/contact",
    content,
    [contactSchema, breadcrumbSchema]
  );
}

function generate404Page(): string {
  return generateBaseHTML(
    "Page Not Found",
    "The page you're looking for doesn't exist. Explore our marketing services and resources.",
    "/404",
    `
      <header>
        <h1>Page Not Found</h1>
        <p>Sorry, the page you're looking for doesn't exist.</p>
      </header>
      <section>
        <h2>Explore Our Resources</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/services">Our Services</a></li>
          <li><a href="/blog">Marketing Blog</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/contact">Contact Us</a></li>
        </ul>
      </section>
    `,
    []
  );
}

function generate500Page(): string {
  return generateBaseHTML(
    "Server Error",
    "Something went wrong. Please try again later.",
    "/500",
    `
      <header>
        <h1>Something Went Wrong</h1>
        <p>We're experiencing technical difficulties. Please try again later.</p>
      </header>
      <section>
        <p><a href="/">Return to Home</a></p>
      </section>
    `,
    []
  );
}
