
-- Phase 1: Create content_clusters table
CREATE TABLE public.content_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  primary_keyword text NOT NULL,
  target_audience text,
  status text NOT NULL DEFAULT 'draft',
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  article_count integer NOT NULL DEFAULT 6,
  progress jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.content_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clusters"
  ON public.content_clusters FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 1: Create site_settings table (singleton)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_prompt text,
  brand_voice text,
  target_audience_rules text,
  mission_statement text,
  eeat_authority_block text,
  speakable_rules text,
  faq_rules text,
  canonical_domain text DEFAULT 'home.anamechimarketing.com',
  enforce_hreflang boolean DEFAULT true,
  supported_languages jsonb DEFAULT '["en"]'::jsonb,
  spelling_enforcement boolean DEFAULT true,
  anti_hallucination_rules text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Seed a default row
INSERT INTO public.site_settings (
  master_prompt,
  brand_voice,
  mission_statement,
  eeat_authority_block,
  speakable_rules,
  faq_rules,
  anti_hallucination_rules
) VALUES (
  'You are the content generation engine for ANAMECHI Marketing, an AI-powered digital marketing agency founded by Dr. Deanna Romulus.',
  'Intelligent, grounded, relatable, instructive, empowering. Professional yet warm, like a trusted advisor.',
  'ANAMECHI Marketing exists to help entrepreneurs automate smarter, market confidently, and scale with systems — not stress.',
  'Dr. Deanna Romulus is the Founder & CEO of ANAMECHI Marketing, a Visionary Strategist and Empowerment Architect with expertise in marketing automation, CRM systems, brand strategy, and AI content systems.',
  'Speakable summaries must be 40-60 words, written in active voice, containing the primary keyword and a clear value proposition.',
  'FAQ answers must be 80-120 words, starting with a direct answer, using plain language at 8th-9th grade reading level.',
  'Never fabricate statistics, quotes, or sources. Always use verifiable claims. When uncertain, use hedging language like "typically" or "often".'
);

-- Phase 1: Add columns to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.content_clusters(id),
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS translated_from uuid REFERENCES public.blog_posts(id),
  ADD COLUMN IF NOT EXISTS hreflang text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS image_alt_text text,
  ADD COLUMN IF NOT EXISTS image_caption text,
  ADD COLUMN IF NOT EXISTS spell_checked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tone_validated boolean DEFAULT false;

-- Phase 1: Add columns to qa_articles
ALTER TABLE public.qa_articles
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.content_clusters(id),
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS translated_from uuid REFERENCES public.qa_articles(id),
  ADD COLUMN IF NOT EXISTS hreflang text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS source_blog_id uuid REFERENCES public.blog_posts(id);
