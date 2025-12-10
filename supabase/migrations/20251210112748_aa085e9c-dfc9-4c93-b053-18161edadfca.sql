-- Create internal link tracking table for AEO compliance
CREATE TABLE public.internal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  source_page text, -- For non-blog pages like /about, /services
  target_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  target_url text NOT NULL,
  anchor_text text,
  link_type text DEFAULT 'internal', -- internal, external, cluster
  funnel_direction text, -- up, down, across
  created_at timestamp with time zone DEFAULT now(),
  last_verified timestamp with time zone DEFAULT now(),
  is_valid boolean DEFAULT true
);

-- Create page health scores table for Points Checker
CREATE TABLE public.page_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url text NOT NULL UNIQUE,
  page_type text DEFAULT 'static', -- static, blog, faq
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  
  -- Schema scores
  has_organization_schema boolean DEFAULT false,
  has_breadcrumb_schema boolean DEFAULT false,
  has_article_schema boolean DEFAULT false,
  has_faq_schema boolean DEFAULT false,
  has_speakable_schema boolean DEFAULT false,
  has_author_schema boolean DEFAULT false,
  
  -- SEO scores
  has_title boolean DEFAULT false,
  has_meta_description boolean DEFAULT false,
  has_canonical boolean DEFAULT false,
  has_og_tags boolean DEFAULT false,
  
  -- Content scores
  has_eeat_block boolean DEFAULT false,
  has_internal_links boolean DEFAULT false,
  internal_link_count integer DEFAULT 0,
  
  -- Cluster info
  funnel_stage text,
  cluster_category text,
  
  -- Overall scores
  schema_score integer DEFAULT 0,
  seo_score integer DEFAULT 0,
  linking_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  status text DEFAULT 'red', -- green, yellow, red
  
  last_scanned timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_health_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for internal_links
CREATE POLICY "Admins can manage internal links"
ON public.internal_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view internal links"
ON public.internal_links
FOR SELECT
USING (true);

-- RLS policies for page_health_scores
CREATE POLICY "Admins can manage page health scores"
ON public.page_health_scores
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view page health scores"
ON public.page_health_scores
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_internal_links_source ON public.internal_links(source_post_id);
CREATE INDEX idx_internal_links_target ON public.internal_links(target_post_id);
CREATE INDEX idx_page_health_url ON public.page_health_scores(page_url);
CREATE INDEX idx_page_health_status ON public.page_health_scores(status);

-- Update trigger for page_health_scores
CREATE TRIGGER update_page_health_scores_updated_at
BEFORE UPDATE ON public.page_health_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();