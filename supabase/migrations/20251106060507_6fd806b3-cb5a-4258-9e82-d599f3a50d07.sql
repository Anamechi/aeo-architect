-- Create business_settings table to manage contact info, social links, and hours
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT 'ANAMECHI Marketing',
  email TEXT NOT NULL DEFAULT 'info@anamechimarketing.com',
  phone_toll_free TEXT NOT NULL DEFAULT '866-752-7370',
  phone_local TEXT NOT NULL DEFAULT '215-709-2159',
  address_street TEXT NOT NULL DEFAULT '101 Lindenwood Dr STE 225',
  address_city TEXT NOT NULL DEFAULT 'Malvern',
  address_state TEXT NOT NULL DEFAULT 'PA',
  address_zip TEXT NOT NULL DEFAULT '19355',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  hours_monday_friday TEXT NOT NULL DEFAULT '9:00 AM - 6:00 PM EST',
  hours_saturday TEXT NOT NULL DEFAULT '9:00 AM - 6:00 PM EST',
  hours_sunday TEXT NOT NULL DEFAULT 'Closed',
  linkedin_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view business settings
CREATE POLICY "Anyone can view business settings"
ON public.business_settings
FOR SELECT
USING (true);

-- Only admins can update business settings
CREATE POLICY "Admins can update business settings"
ON public.business_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert business settings
CREATE POLICY "Admins can insert business settings"
ON public.business_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default business settings
INSERT INTO public.business_settings (
  business_name,
  email,
  phone_toll_free,
  phone_local,
  address_street,
  address_city,
  address_state,
  address_zip,
  timezone,
  hours_monday_friday,
  hours_saturday,
  hours_sunday,
  linkedin_url,
  twitter_url,
  youtube_url
) VALUES (
  'ANAMECHI Marketing',
  'info@anamechimarketing.com',
  '866-752-7370',
  '215-709-2159',
  '101 Lindenwood Dr STE 225',
  'Malvern',
  'PA',
  '19355',
  'America/New_York',
  '9:00 AM - 6:00 PM EST',
  '9:00 AM - 6:00 PM EST',
  'Closed',
  'https://www.linkedin.com/company/anamechi-marketing',
  'https://twitter.com/anamechimarketing',
  'https://www.youtube.com/@ANAMECHI'
);