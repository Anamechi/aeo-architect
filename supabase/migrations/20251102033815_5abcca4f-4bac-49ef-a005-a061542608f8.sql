-- Create service_packages table
CREATE TABLE public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  base_price NUMERIC,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  display_type TEXT DEFAULT 'custom' CHECK (display_type IN ('hidden', 'starting_at', 'range', 'custom')),
  cta_text TEXT DEFAULT 'Get Custom Quote',
  cta_link TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_addon BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_packages
CREATE POLICY "Anyone can view active packages"
  ON public.service_packages
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage packages"
  ON public.service_packages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create custom_quotes table
CREATE TABLE public.custom_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_business TEXT,
  client_revenue_range TEXT,
  package_id UUID REFERENCES public.service_packages(id),
  line_items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  notes TEXT,
  expiration_date TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.custom_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_quotes
CREATE POLICY "Admins can manage quotes"
  ON public.custom_quotes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create pricing_settings table
CREATE TABLE public.pricing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_pricing_publicly BOOLEAN DEFAULT false,
  default_display_type TEXT DEFAULT 'custom' CHECK (default_display_type IN ('hidden', 'starting_at', 'range', 'custom')),
  default_cta_text TEXT DEFAULT 'Get Custom Quote',
  pricing_philosophy TEXT,
  quote_request_enabled BOOLEAN DEFAULT true,
  quote_request_redirect_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_settings
CREATE POLICY "Anyone can view pricing settings"
  ON public.pricing_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pricing settings"
  ON public.pricing_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default pricing settings
INSERT INTO public.pricing_settings (show_pricing_publicly, pricing_philosophy)
VALUES (
  false,
  'We believe in accessible, results-driven pricing that scales with your business. Every investment is customized to your unique goals, challenges, and growth stage.'
);

-- Add triggers for updated_at
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_quotes_updated_at
  BEFORE UPDATE ON public.custom_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_settings_updated_at
  BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();