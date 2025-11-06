-- Create affiliate clicks tracking table
CREATE TABLE public.affiliate_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name text NOT NULL,
  tool_url text NOT NULL,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  referrer text,
  converted boolean DEFAULT false,
  converted_at timestamp with time zone,
  notes text
);

-- Enable RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Admins can view all clicks
CREATE POLICY "Admins can view affiliate clicks"
ON public.affiliate_clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert clicks (for tracking)
CREATE POLICY "Anyone can track clicks"
ON public.affiliate_clicks
FOR INSERT
WITH CHECK (true);

-- Admins can update clicks (for marking conversions)
CREATE POLICY "Admins can update clicks"
ON public.affiliate_clicks
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_affiliate_clicks_tool_name ON public.affiliate_clicks(tool_name);
CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at DESC);