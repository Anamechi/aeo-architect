-- Create master_prompts table
CREATE TABLE IF NOT EXISTS public.master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('blog', 'qa', 'image', 'diagram', 'faq')),
  prompt_text TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add RLS policies for master_prompts
ALTER TABLE public.master_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage master prompts"
  ON public.master_prompts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_master_prompts_updated_at
  BEFORE UPDATE ON public.master_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update blog_posts table to add missing fields
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
  ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0;

-- Create generated_diagrams table
CREATE TABLE IF NOT EXISTS public.generated_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  mermaid_code TEXT NOT NULL,
  svg_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  used_in_posts UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Add RLS for diagrams
ALTER TABLE public.generated_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diagrams"
  ON public.generated_diagrams
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));