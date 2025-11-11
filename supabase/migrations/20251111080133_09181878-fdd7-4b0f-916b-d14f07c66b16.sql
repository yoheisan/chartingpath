-- Fix foreign key constraint to allow deleting scheduled posts
-- Drop the existing foreign key constraint
ALTER TABLE public.post_history 
DROP CONSTRAINT IF EXISTS post_history_scheduled_post_id_fkey;

-- Recreate with CASCADE delete so post history is removed when scheduled post is deleted
ALTER TABLE public.post_history
ADD CONSTRAINT post_history_scheduled_post_id_fkey 
FOREIGN KEY (scheduled_post_id) 
REFERENCES public.scheduled_posts(id) 
ON DELETE CASCADE;