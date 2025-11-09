
-- Add recurrence_pattern column to scheduled_posts
ALTER TABLE scheduled_posts 
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

-- Copy data from recurrence_rule to recurrence_pattern if it exists
UPDATE scheduled_posts 
SET recurrence_pattern = recurrence_rule 
WHERE recurrence_rule IS NOT NULL;
