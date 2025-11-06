-- Add excerpt field to blog_posts table
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS excerpt TEXT;