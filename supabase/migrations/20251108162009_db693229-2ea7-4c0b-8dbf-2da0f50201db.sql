-- Update quiz question image URLs to use /patterns/ instead of /src/assets/patterns/
UPDATE quiz_questions
SET image_url = REPLACE(image_url, '/src/assets/patterns/', '/patterns/')
WHERE image_url LIKE '/src/assets/patterns/%';