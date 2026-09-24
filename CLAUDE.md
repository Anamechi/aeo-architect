# aeo-architect — anamechimarketing.com

The live ANAMECHI Marketing website. Vite + React + TypeScript + shadcn, Supabase behind it, deployed by Cloudflare Pages. Originally a Lovable build, now code-owned: Lovable is being retired and `lovable-tagger` is dev-only.

**This is a LIVE production site. Every push to `main` deploys to the public internet in about one minute.**

## Deploy path, and it is automatic
Push to `main` → Cloudflare Pages rebuilds → live at anamechimarketing.com. There is no manual deploy step and no staging gate. Build command `npm ci && npm run build`, output `dist`, Node 18. Full settings in `DEPLOYMENT.md`.

Commit identity for this repo is Deanna Romulus <info@anamechimarketing.com>.

## Standing rules for any agent working here
1. **Confirm before you push.** A commit here is a publish. Commit freely, but ask before pushing to `main` unless she has already said to ship it.
2. **Never change a live URL.** Renaming a route, a redirect in `public/_redirects`, or a published path breaks links already in the wild, in QR codes, and in printed matter. Copy changes are free; URL changes are not.
3. **The content engine is live and publishes to the public site.** The Supabase edge functions under `supabase/functions/` generate blog posts, clusters, QA articles, citations and images. A DB publish gate (a BEFORE INSERT/UPDATE trigger on `blog_posts` and `qa_articles`) holds anything with dashes, contractions, the word "founders", a build-order leak, or a missing featured image. **Do not weaken or bypass that gate.** It is the IP firewall and the brand standard, enforced in the database on purpose.
4. **The master prompt lives in `site_settings.master_prompt`, not in the `master_prompts` table.** The generators read `site_settings`. That mismatch is what let the engine run on generic defaults and publish eighteen off-brand posts. Check which one you are editing.
5. **Supabase project is `hjbylbjbxjotbijzrwma`**, shared with the brain schema and other projects. Migrations here touch a shared database. Read the existing tables before changing anything.
6. **Secrets.** `DEPLOYMENT.md` contains a publishable Supabase key, which is fine. Never commit a service-role key, a GHL private integration token, or anything from `.env`.
7. Brand voice applies to every user-facing string. No dashes as punctuation, no contractions, "business owners" never "founders".

## Known state
`supabase/functions/generate-social-images/` is untracked and uncommitted. Decide whether it ships before touching adjacent functions.

## Cross-references
Site strategy, the AEO decisions, and the prerender gap live in the wiki at `~/Desktop/AI Website Builds/`. Offers, prices and positioning live in the brain. Do not restate any of them here.
