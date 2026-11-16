import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  image?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  structuredData?: any[];
}

const SITE_URL = "https://anamechimarketing.com";
const BRAND_SUFFIX = " | ANAMECHI Marketing";
const DEFAULT_IMAGE = "https://anamechimarketing.com/media/og.jpg";

/**
 * Imperative, library-free head manager.
 *
 * react-helmet-async is a no-op in this production build (verified in both
 * `vite preview` and on the live site: zero data-rh tags, static shell title
 * on every route). Rather than depend on a frozen library that silently fails
 * after minification, we set the document head directly in an effect. We UPDATE
 * the tags the static index.html already ships (title, description, canonical,
 * og:*, twitter:*) in place, so a sub-page never carries a duplicate or a
 * conflicting homepage value. Per-page JSON-LD is injected and cleaned up by a
 * data attribute so the site-wide JSON-LD in index.html is left untouched.
 *
 * This only controls what a real browser and JS-rendering engines (Google) see.
 * No-JS AI crawlers (ChatGPT, Perplexity, ClaudeBot) are served real per-page
 * HTML by the edge prerender, independently of this component.
 */

function upsertMeta(selectorAttr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${selectorAttr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(selectorAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export const SEO = ({
  title,
  description,
  canonical,
  type = "website",
  image = DEFAULT_IMAGE,
  article,
  structuredData = [],
}: SEOProps) => {
  const { pathname } = useLocation();

  const sdKey = JSON.stringify(structuredData);
  const articleKey = JSON.stringify(article ?? null);

  useEffect(() => {
    const fullTitle = title.includes(BRAND_SUFFIX) ? title : `${title}${BRAND_SUFFIX}`;
    const canonicalUrl = `${SITE_URL}${canonical ?? pathname}`;

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertLink("canonical", canonicalUrl);

    // Open Graph
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image);

    // Twitter Card
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    // Article meta (only present them when this is an article)
    if (article?.publishedTime) upsertMeta("property", "article:published_time", article.publishedTime);
    if (article?.modifiedTime) upsertMeta("property", "article:modified_time", article.modifiedTime);
    if (article?.author) upsertMeta("property", "article:author", article.author);

    // Per-page JSON-LD. Remove any this component previously added, then inject
    // the current set. The site-wide JSON-LD in index.html has no data-seo-jsonld
    // attribute, so it is never touched.
    const injected: HTMLScriptElement[] = [];
    document.head.querySelectorAll("script[data-seo-jsonld]").forEach((s) => s.remove());
    structuredData.forEach((data) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo-jsonld", "");
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
      injected.push(s);
    });

    return () => {
      injected.forEach((s) => s.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, type, image, pathname, sdKey, articleKey]);

  return null;
};
