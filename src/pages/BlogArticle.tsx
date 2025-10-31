import { useParams, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, CheckCircle2 } from "lucide-react";

const BlogArticle = () => {
  const { slug } = useParams();

  // Sample article data - in production, fetch from CMS/database
  const article = {
    slug: "aeo-guide-2025",
    title: "The Complete Guide to AI Engine Optimization (AEO) in 2025",
    excerpt: "Learn how to position your brand for AI citation across ChatGPT, Gemini, Perplexity, and other LLMs with our comprehensive AEO guide.",
    content: `
AI Engine Optimization (AEO) is the practice of optimizing your content and online presence to be discovered, understood, and cited by Large Language Models (LLMs) and AI-powered answer engines like ChatGPT, Google Gemini, Perplexity, Microsoft Copilot, and others.

## Why AEO Matters in 2025

The way people search for information has fundamentally changed. Instead of clicking through search results, users increasingly ask AI models directly and receive synthesized answers. If your brand isn't optimized for AI citation, you're missing out on a massive opportunity to establish authority.

## Core AEO Principles

### 1. Answer-First Content Structure

AI models prefer content that provides direct, immediate answers. Start every piece of content with a clear 2-3 sentence answer to the primary question, then expand with supporting details, evidence, and examples.

### 2. Structured Data Implementation

Implement comprehensive JSON-LD schemas including:
- Organization schema for brand recognition
- Article schema with author and reviewedBy properties
- FAQPage schema for question-answer content
- Breadcrumb schema for site navigation
- Citation properties linking to authoritative sources

### 3. EEAT Authority Signals

Experience, Expertise, Authoritativeness, and Trust (EEAT) are critical factors in AI citation decisions:
- Author credentials and bios with verifiable expertise
- Case studies with specific metrics and outcomes
- Citations to primary sources and research
- Regular content updates with timestamps
- Third-party validation through reviews and mentions

### 4. Citation Hygiene

Maintain clean citation practices:
- Link to authoritative primary sources
- Use descriptive anchor text
- Keep source lists current
- Include publication and update dates
- Verify all factual claims

## Implementation Checklist

### Technical Foundation
- ✅ Enable AI bot crawlers in robots.txt
- ✅ Implement server-side rendering or static generation
- ✅ Create XML sitemaps with lastmod dates
- ✅ Set up IndexNow for instant indexing
- ✅ Add canonical URLs to all pages
- ✅ Optimize Core Web Vitals performance

### Content Optimization
- ✅ Structure content with clear H1-H3 hierarchy
- ✅ Start with direct answers before elaboration
- ✅ Use bullet lists and numbered steps
- ✅ Include data tables and comparison matrices
- ✅ Add "TL;DR" summaries for key sections
- ✅ Embed relevant examples and case studies

### Schema Markup
- ✅ Global Organization schema
- ✅ WebSite with SearchAction
- ✅ Breadcrumbs on all inner pages
- ✅ Article schema with author and reviewedBy
- ✅ FAQPage for question-based content
- ✅ Citation arrays linking sources

### Authority Building
- ✅ Publish author credentials and bios
- ✅ Create case studies with metrics
- ✅ Establish expert reviewer network
- ✅ Pursue digital PR and backlinks
- ✅ Engage in community Q&A platforms
- ✅ Update content quarterly

## Measuring AEO Success

Track these key metrics:
1. **AI Citations**: Monitor brand mentions in ChatGPT, Gemini, Perplexity responses
2. **Featured Snippets**: Track Google featured snippet wins
3. **AI Overview Presence**: Monitor appearance in Google AI Overviews
4. **Organic Traffic**: Measure overall search visibility
5. **Backlink Quality**: Track authoritative domain links

## Next Steps

Start your AEO journey by auditing your current content against the principles outlined in this guide. Focus on your top 20 pages first, implementing structured data and optimizing for answer-first formatting.

Remember: AEO is an ongoing practice, not a one-time project. Regular updates, fresh content, and citation hygiene are essential for maintaining AI visibility.
    `,
    category: "AEO Strategy",
    publishedDate: "2025-10-30",
    modifiedDate: "2025-10-30",
    readTime: "12 min read",
    author: {
      name: "Dr. Deanna Romulus",
      role: "Founder, Visionary Strategist",
      bio: "Dr. Deanna Romulus is the founder of ANAMECHI Marketing and a leading expert in AI Engine Optimization (AEO)."
    },
    reviewedBy: "Ambrose — Chat QA Lead"
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "datePublished": article.publishedDate,
    "dateModified": article.modifiedDate,
    "author": {
      "@type": "Person",
      "name": article.author.name
    },
    "reviewedBy": {
      "@type": "Person",
      "name": article.reviewedBy
    },
    "publisher": {
      "@type": "Organization",
      "name": "ANAMECHI Marketing",
      "logo": {
        "@type": "ImageObject",
        "url": "https://anamechi.com/assets/logo.png"
      }
    },
    "mainEntityOfPage": `https://anamechi.com/blog/${article.slug}/`,
    "citation": [
      "https://developers.google.com/search/docs/appearance/structured-data",
      "https://moz.com/learn/seo"
    ]
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://anamechi.com/blog/" },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://anamechi.com/blog/${article.slug}/` }
    ]
  };

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt}
        canonical={`/blog/${article.slug}`}
        type="article"
        article={{
          publishedTime: article.publishedDate,
          modifiedTime: article.modifiedDate,
          author: article.author.name
        }}
        structuredData={[articleSchema, breadcrumbsSchema]}
      />

      <article className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[
          { name: "Blog", href: "/blog" },
          { name: article.title, href: `/blog/${article.slug}` }
        ]} />

        {/* Article Header */}
        <div className="mx-auto max-w-4xl mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">
            {article.category}
          </Badge>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            {article.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {article.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                Published: {new Date(article.publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>{article.readTime}</span>
            </div>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{article.author.name}</span>
            </div>
            {article.reviewedBy && (
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                <span>Reviewed by {article.reviewedBy}</span>
              </div>
            )}
          </div>

          <Separator className="my-8" />
        </div>

        {/* Article Content */}
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-3xl font-bold text-foreground mt-12 mb-6">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              } else if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-2xl font-semibold text-foreground mt-8 mb-4">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              } else if (paragraph.startsWith('- ✅')) {
                const items = paragraph.split('\n').filter(line => line.trim());
                return (
                  <ul key={index} className="space-y-2 my-6">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="mr-2 h-5 w-5 shrink-0 text-success mt-1" />
                        <span className="text-foreground">{item.replace('- ✅ ', '')}</span>
                      </li>
                    ))}
                  </ul>
                );
              } else {
                return (
                  <p key={index} className="text-foreground leading-relaxed mb-6">
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>

          <Separator className="my-12" />

          {/* Author Bio */}
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
                  {article.author.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {article.author.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {article.author.role}
                  </p>
                  <p className="text-foreground">
                    {article.author.bio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="mt-12 border-border bg-gradient-primary">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Ready to Implement AEO?
              </h3>
              <p className="text-primary-foreground/90 mb-6">
                Let's optimize your content for AI citation and search engine visibility.
              </p>
              <Link 
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Schedule a Consultation
              </Link>
            </CardContent>
          </Card>
        </div>
      </article>
    </>
  );
};

export default BlogArticle;
