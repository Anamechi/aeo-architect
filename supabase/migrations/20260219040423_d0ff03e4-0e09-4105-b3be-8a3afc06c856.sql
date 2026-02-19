UPDATE blog_posts
SET reading_time = ceil(array_length(regexp_split_to_array(content, '\s+'), 1) / 238.0)
WHERE status = 'published' AND content IS NOT NULL AND (reading_time IS NULL OR reading_time = 0);