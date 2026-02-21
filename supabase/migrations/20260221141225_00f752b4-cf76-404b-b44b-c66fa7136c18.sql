-- Fix existing educational_content_pieces to have proper CTA links
-- Remove placeholder "[link to article]" and trailing "Learn more:", "Full guide:" etc.
-- Then append a real CTA with the link_back_url

UPDATE public.educational_content_pieces
SET content = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(content, '\[link to article\]', '', 'gi'),
        'Learn more:\s*$', '', 'i'
      ),
      'Full guide:\s*$', '', 'i'
    ),
    'Read more:\s*$', '', 'i'
  ),
  'More:\s*$', '', 'i'
)
WHERE content ILIKE '%[link to article]%'
   OR content ILIKE '%Learn more:%'
   OR content ILIKE '%Full guide:%';

-- Now append CTA based on piece_type
UPDATE public.educational_content_pieces
SET content = rtrim(content) || E'\n\n' || 
  CASE piece_type
    WHEN 'glossary' THEN 'Master the full concept 👉 ' || link_back_url
    WHEN 'key_learning' THEN 'Read the complete guide 👉 ' || link_back_url
    WHEN 'technique' THEN 'Step-by-step setup guide 👉 ' || link_back_url
    WHEN 'insight' THEN 'More insights like this 👉 ' || link_back_url
    ELSE 'Learn more 👉 ' || link_back_url
  END
WHERE content NOT LIKE '%chartingpath.com%';