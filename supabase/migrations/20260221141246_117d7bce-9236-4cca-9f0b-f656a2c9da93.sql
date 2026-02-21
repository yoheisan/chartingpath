-- Clean remaining placeholder variants from content body
UPDATE public.educational_content_pieces
SET content = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(content, '\[link\]', '', 'gi'),
        '\[ARTICLE LINK\]', '', 'gi'
      ),
      '\[link to article\]', '', 'gi'
    ),
    'Learn more:\s*\n', E'\n', 'gi'
  ),
  'Full guide here!\s*👇', 'Full guide 👇', 'gi'
)
WHERE content ILIKE '%[link%'
   OR content ILIKE '%[ARTICLE LINK]%';