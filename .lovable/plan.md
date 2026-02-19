

# AI Citation Readiness: Fix All Critical Gaps

## Overview

Your site scores roughly 65-70/100 for AI citation readiness. This plan fixes the critical gaps to push you toward 90+. The work falls into 6 areas.

---

## 1. Deploy Prerender, Sitemap, and IndexNow Edge Functions

**Problem:** These three edge functions return 404 -- they exist in code but aren't deployed. AI crawlers (GPTBot, PerplexityBot, ClaudeBot) see an empty React shell with no content.

**Fix:** Deploy all three functions. This is the single highest-impact fix -- without it, AI engines literally cannot read your content.

---

## 2. Fix BlogArticle.tsx Canonical Domain

**Problem:** The Article schema and Breadcrumb schema in `BlogArticle.tsx` hardcode `anamechimarketing.com` instead of `home.anamechimarketing.com`. This creates domain authority split.

**Fix:** Replace all 4 occurrences of `https://anamechimarketing.com` with `https://home.anamechimarketing.com` in the inline schemas (lines 121, 124, 140-142).

---

## 3. Add Speakable + LocalBusiness Schema to Home Page

**Problem:** `Home.tsx` only includes Organization and WebSite schemas. Missing Speakable (voice assistant extraction) and LocalBusiness (local search/citation).

**Fix:** Import `generateSpeakableSchema` and `generateLocalBusinessSchema` from `@/utils/schemas` and add them to the `structuredData` array in the SEO component.

---

## 4. Fix Services Page Canonical

**Problem:** `Services.tsx` SEO component is missing the `canonical` prop, so no canonical tag is rendered.

**Fix:** Add `canonical="/services"` to the SEO component props.

---

## 5. Fix reading_time on All Published Posts

**Problem:** All 18 published blog posts have `reading_time = 0`, which signals low-quality content to AI engines.

**Fix:** Write a SQL update that calculates reading time from word count: `ceil(array_length(regexp_split_to_array(content, '\s+'), 1) / 238.0)` (238 wpm average). This runs as a one-time data fix.

---

## 6. Run Citation Discovery on Published Posts

**Problem:** All 18 published posts have zero citations. E-E-A-T requires backing claims with authoritative sources.

**Fix:** After credits are available, invoke the `discover-citations` edge function for each published post and store results in the `citations` JSONB field. This step depends on having AI credits available.

---

## Technical Details

### Files Modified
| File | Change |
|------|--------|
| `src/pages/BlogArticle.tsx` | Fix 4 hardcoded domain references to `home.anamechimarketing.com` |
| `src/pages/Home.tsx` | Add imports for `generateSpeakableSchema`, `generateLocalBusinessSchema`; add to structuredData array |
| `src/pages/Services.tsx` | Add `canonical="/services"` prop to SEO component |

### Edge Functions Deployed
- `prerender` -- static HTML for AI crawlers
- `sitemap` -- dynamic XML sitemaps
- `indexnow` -- instant URL submission

### Database Update
```text
UPDATE blog_posts
SET reading_time = ceil(array_length(regexp_split_to_array(content, '\s+'), 1) / 238.0)
WHERE status = 'published' AND (reading_time IS NULL OR reading_time = 0);
```

### Impact Estimate
- Current score: ~65-70/100
- After this plan: ~88-92/100
- Remaining gap: citations (requires AI credits)

