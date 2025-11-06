-- Fix RLS policies for blog_posts to allow admins to view all posts
DROP POLICY IF EXISTS "Admins can manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

-- Create comprehensive admin policy
CREATE POLICY "Admins have full access to blog posts"
ON blog_posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Keep public read access for published posts
CREATE POLICY "Public can view published posts"
ON blog_posts
FOR SELECT
TO anon, authenticated
USING (status = 'published'::content_status);