-- Remove AI-generated images from non-pattern quiz questions
-- This keeps chart pattern images (visual_recognition category) intact
UPDATE quiz_questions
SET 
  image_url = NULL,
  image_metadata = NULL
WHERE 
  image_url IS NOT NULL 
  AND image_url LIKE '%quiz-images%'
  AND category != 'visual_recognition';