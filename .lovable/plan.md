

# AI-Native Website Architecture Upgrade

## Overview

This plan upgrades the existing ANAMECHI Marketing admin system into a fully structured AI-native platform with cluster-based content generation, multi-language translation, automated citation discovery, and comprehensive SEO auditing. All changes are additive -- existing URLs, pages, and functionality remain intact.

## Current State

The project already has:
- Master Prompts page (basic CRUD on `master_prompts` table)
- AI Tools registry (CRUD on `ai_tools` table)
- Blog Generator with basic cluster generation (no Group ID, no language support)
- QA Generator (manual CRUD, no auto-generation from articles)
- Citation Health checker (validates existing citations)
- Blog Audit system (scoring, optimization)
- SEO Settings page (static display)

What is missing:
- Unified Master Prompt settings panel with all enforcement rules
- Group ID tracking across clusters
- Translation system with hreflang
- Auto QA generation per article
- AI-powered citation discovery
- Image health checking and duplicate prevention
- Spell-check and tone enforcement in audit
- Domain standardization enforcement

---

## Phase 1: Database Schema Changes

### New Tables

**`content_clusters`** -- Groups articles by topic cluster with a unique Group ID.

| Column | Type | Notes |
|--------|------|-------|
| id (PK) | uuid | Auto-generated Group ID |
| topic | text | Cluster topic |
| primary_keyword | text | Target keyword |
| target_audience | text | Audience description |
| status | text | draft / generating / complete / error |
| language | text | Default: 'en' |
| created_at | timestamptz | |
| created_by | uuid | |
| article_count | integer | Default: 6 |
| progress | jsonb | Tracks generation status per article |

**`site_settings`** -- Singleton table for Master Prompt and global settings.

| Column | Type | Notes |
|--------|------|-------|
| id (PK) | uuid | Single row |
| master_prompt | text | Full Master Prompt text |
| brand_voice | text | Brand voice rules |
| target_audience_rules | text | Audience rules |
| mission_statement | text | |
| eeat_authority_block | text | EEAT template |
| speakable_rules | text | 40-60 word summary rules |
| faq_rules | text | 80-120 word FAQ rules |
| canonical_domain | text | e.g. home.anamechimarketing.com |
| enforce_hreflang | boolean | Default: true |
| supported_languages | jsonb | Default: ["en"] |
| spelling_enforcement | boolean | Default: true |
| anti_hallucination_rules | text | |
| updated_at | timestamptz | |
| updated_by | uuid | |

### Table Modifications

**`blog_posts`** -- Add columns:

| Column | Type | Notes |
|--------|------|-------|
| group_id | uuid | FK to content_clusters.id, nullable |
| language | text | Default: 'en' |
| translated_from | uuid | FK to blog_posts.id (source article) |
| hreflang | text | e.g. 'en', 'es', 'fr' |
| image_alt_text | text | Language-specific alt text |
| image_caption | text | Language-specific caption |
| spell_checked | boolean | Default: false |
| tone_validated | boolean | Default: false |

**`qa_articles`** -- Add columns:

| Column | Type | Notes |
|--------|------|-------|
| group_id | uuid | FK to content_clusters.id, nullable |
| language | text | Default: 'en' |
| translated_from | uuid | FK to qa_articles.id |
| hreflang | text | |
| source_blog_id | uuid | FK to blog_posts.id (parent article) |

RLS policies: Admin-only for `content_clusters` and `site_settings` (with public SELECT on `site_settings`).

---

## Phase 2: Settings System (Master Prompt Panel)

### New Page: `/admin/settings`

Replace the separate SEO Settings and Business Settings with a unified Settings page containing tabs:

1. **Master Prompt Tab** -- Full-text editor for the Master Prompt with structured sub-fields (brand voice, audience rules, mission, EEAT block, speakable rules, FAQ rules, anti-hallucination logic)
2. **Domain & Canonical Tab** -- Set canonical domain, enforce www/non-www, hreflang configuration, supported languages
3. **Enforcement Rules Tab** -- Toggle spell-check enforcement, professional tone validation, markdown formatting requirements, JSON-LD schema requirements

Data stored in `site_settings` table (singleton row, upsert on save).

### Edge Function Update: `generate-blog-content`

Modify to:
1. Fetch the Master Prompt from `site_settings` before generating
2. Inject brand voice, EEAT block, speakable rules, FAQ rules into system prompt
3. Enforce word count (1500-2000), markdown formatting, anti-hallucination instructions
4. Include group_id in generated metadata

---

## Phase 3: AI Tools Registry Page Enhancement

### Update: `/admin/ai-tools`

Add pre-seeded tool entries for the integrated tools:

| Tool | Category | Status |
|------|----------|--------|
| Lovable AI (Gemini) | Image Generation | Active |
| Perplexity (via connector) | Research API | Pending Setup |
| Internal Linking Engine | SEO | Active |
| Citation Engine | SEO | Active |
| Blog Audit Tool | Quality | Active |
| Image Health Checker | Media | Active (new) |
| Broken Link Checker | SEO | Active |
| Spell-Check Engine | Quality | Active (new) |
| Schema Validator | SEO | Active |

Each entry links to the relevant admin page or shows integration status.

---

## Phase 4: Cluster Control Center

### New Page: `/admin/clusters`

UI Components:
- **Create Cluster** button opens a dialog with fields: Topic, Primary Keyword, Target Audience
- **Cluster List** showing all clusters with status badges (generating / complete / error)
- **Cluster Detail View** showing all 6 articles in the cluster with their status, language variants, and QAs

### Cluster Generation Flow:

```text
User clicks "Create Cluster"
    |
    v
Save cluster record to content_clusters (status: generating)
    |
    v
Generate 6 articles sequentially (3 TOFU, 2 MOFU, 1 BOFU):
  For each article:
    1. Fetch Master Prompt from site_settings
    2. Call generate-blog-content with Master Prompt injected
    3. Generate featured image via generate-blog-image
    4. Generate alt text + caption
    5. Auto-generate 4 QAs per article
    6. Save blog_post with group_id set
    7. Save qa_articles with group_id + source_blog_id
    8. Update cluster progress
    |
    v
Mark cluster complete
```

### Edge Function: `generate-cluster` (new)

Handles full cluster generation with:
- Master Prompt injection
- Progress tracking via cluster record
- 3-second delay between articles to avoid rate limiting
- Error recovery (partial cluster completion)
- Auto-assigns unique Group ID to all articles + QAs

---

## Phase 5: Translation System

### New Page Section: Translation controls on Cluster Detail and Blog Edit pages

UI:
- "Translate" button on each article/cluster
- Language selector dropdown (one language at a time)
- Progress indicator during translation
- Translation preserves: schema, group_id, internal links, citations

### Edge Function: `translate-content` (new)

Accepts: `{ blogPostId, targetLanguage }`

Process:
1. Fetch source article content, title, meta description, excerpt, alt text, caption
2. Fetch Master Prompt for translation rules
3. Call AI gateway to translate (preserving markdown structure, schema references)
4. Create new blog_post record with:
   - Same group_id
   - `translated_from` = source article ID
   - `language` = target language code
   - `hreflang` = target language code
   - Translated slug (language-prefixed)
5. Translate associated QAs with same group_id linkage
6. Update sitemap and prerender function to include hreflang alternates

---

## Phase 6: QA Generator Enhancement

### Update: `/admin/qa-generator` and cluster generation

Auto-generate 4 contextual QAs per article:
- Edge function `generate-article-qas` (new) accepts `{ blogPostId }`
- Reads article content, generates 4 question-answer pairs
- Each QA: 80-120 words answer, FAQ schema applied
- Saved to `qa_articles` with `source_blog_id` and `group_id`
- Translation applies to QAs when parent article is translated

---

## Phase 7: Citation Engine

### New Edge Function: `discover-citations` (new)

Accepts: `{ blogPostId }` or `{ content }`

Process:
1. Analyze article content for citation opportunities (claims, statistics, definitions)
2. Use AI to identify 5-8 high-authority, non-competitor sources
3. Prioritize English + Spanish language sources
4. Return suggested citations with:
   - URL, title, relevance score, authority indicator
   - Suggested anchor text and insertion point
5. Admin can accept/reject each suggestion
6. Accepted citations saved to blog_post.citations JSONB

### UI: Citation Discovery panel in Blog Editor

- "Discover Citations" button
- List of suggested citations with accept/reject
- "Apply to All Translations" checkbox

---

## Phase 8: Image System Enhancement

### Updates to existing image generation:

1. **Image Health Checker** -- New section in `/admin/images` or dedicated page:
   - Scan all blog posts for missing/broken images
   - Check image dimensions and format
   - Detect duplicate images across posts
   - Report missing alt text or captions

2. **Duplicate Prevention** -- Before generating, check existing images for similar prompts
3. **Queue System** -- For bulk image generation, process one at a time with 5-second delays
4. **Language-Specific Metadata** -- Alt text and caption stored per-language in blog_post record

### Edge Function Update: `generate-blog-image`

Add:
- Duplicate check against existing generated_images
- Return alt text and caption alongside image URL
- JSON-LD ImageObject schema generation

---

## Phase 9: SEO Audit System Enhancement

### Update: `/admin/blog/audit` (BlogAudit.tsx)

Add new audit checks:

| Check | Criteria | Score Impact |
|-------|----------|-------------|
| Word Count | 1500-2000 words | 10 pts |
| Schema Presence | Article + FAQ + Breadcrumb + Organization + Speakable | 15 pts |
| FAQ Schema | Min 4 QAs with proper schema | 10 pts |
| Internal Linking | Min 3 internal links | 10 pts |
| Canonical URL | Matches canonical domain | 5 pts |
| Hreflang | Present on translated content | 5 pts |
| Duplicate Risk | No duplicate titles/slugs across languages | 5 pts |
| Spell-Check | No flagged spelling errors | 10 pts |
| Professional Tone | No informal/unprofessional language | 10 pts |
| Group ID | Article belongs to a cluster | 5 pts |
| Image Health | Has image with alt text + caption | 10 pts |
| Citations | Min 3 citations | 5 pts |

### Edge Function Update: `audit-blog-content`

Add spell-check and tone validation to audit payload.

---

## Phase 10: Group ID Enforcement & Domain Standardization

### Group ID Enforcement:
- All cluster-generated content automatically gets group_id
- Standalone articles can be assigned to clusters retroactively
- Audit flags articles without group_id as "orphan content"
- Dashboard widget showing orphan content count

### Domain Standardization:
- `site_settings.canonical_domain` used everywhere
- Update `src/utils/schemas.ts` SITE_URL to read from settings (with fallback)
- Prerender function uses canonical domain from settings
- Sitemap function uses canonical domain from settings
- Redirect rules enforced in `_redirects` file

---

## New Admin Sidebar Navigation

```text
Dashboard
---
Content
  Clusters (NEW)
  Blog Posts
  Blog Audit
  QA Generator
  FAQ Manager
  FAQ Analytics
---
SEO & Quality
  Points Checker
  Citations
  Citation Health
  SEO Audit (enhanced)
---
Media
  Image Generator
  Image Health (NEW)
  Diagram Generator
---
AI Tools
  Tool Registry
  Master Prompts
---
Settings (consolidated)
  Master Prompt (NEW)
  Business Settings
  Pricing Settings
  Domain & Canonical (NEW)
```

---

## New Files Summary

| File | Type | Purpose |
|------|------|---------|
| `src/pages/admin/Clusters.tsx` | Page | Cluster Control Center |
| `src/pages/admin/ClusterDetail.tsx` | Page | View cluster articles + translations |
| `src/pages/admin/SiteSettings.tsx` | Page | Master Prompt + Domain settings |
| `src/pages/admin/ImageHealth.tsx` | Page | Image health checking |
| `supabase/functions/generate-cluster/index.ts` | Edge Function | Full cluster generation |
| `supabase/functions/translate-content/index.ts` | Edge Function | Article translation |
| `supabase/functions/generate-article-qas/index.ts` | Edge Function | Auto QA generation |
| `supabase/functions/discover-citations/index.ts` | Edge Function | AI citation discovery |

## Modified Files Summary

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes for Clusters, ClusterDetail, SiteSettings, ImageHealth |
| `src/components/admin/AdminSidebar.tsx` | Reorganize navigation with new pages |
| `supabase/functions/generate-blog-content/index.ts` | Inject Master Prompt from DB |
| `supabase/functions/audit-blog-content/index.ts` | Add spell-check + tone + new checks |
| `supabase/functions/generate-blog-image/index.ts` | Add duplicate check + alt text/caption |
| `supabase/config.toml` | Register new edge functions |
| `src/utils/schemas.ts` | Read canonical domain from settings |

## Database Migrations

1. Create `content_clusters` table with RLS
2. Create `site_settings` table with RLS + seed row
3. ALTER `blog_posts` to add group_id, language, translated_from, hreflang, image_alt_text, image_caption, spell_checked, tone_validated
4. ALTER `qa_articles` to add group_id, language, translated_from, hreflang, source_blog_id

---

## Implementation Order

Due to the size of this upgrade, it should be implemented in this sequence:

1. **Database migrations** (all schema changes first)
2. **Site Settings page** (Master Prompt -- needed by everything else)
3. **Update generate-blog-content** edge function (inject Master Prompt)
4. **Cluster Control Center** page + generate-cluster edge function
5. **QA auto-generation** edge function + UI integration
6. **Citation discovery** edge function + UI
7. **Translation system** edge function + UI
8. **Image health checker** page
9. **SEO audit enhancements**
10. **Sidebar reorganization** + routing updates
11. **Group ID enforcement** and domain standardization

Each phase builds on the previous one. The Master Prompt must be implemented first as all generation functions depend on it.

