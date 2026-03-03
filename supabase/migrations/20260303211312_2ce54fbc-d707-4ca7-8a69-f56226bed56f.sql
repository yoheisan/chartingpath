-- Fix domain in content body
UPDATE educational_content_pieces
SET content = REPLACE(content, 'https://chartingpath.lovable.app/blog/', 'https://chartingpath.com/blog/'),
    link_back_url = REPLACE(link_back_url, 'https://chartingpath.lovable.app/blog/', 'https://chartingpath.com/blog/')
WHERE is_active = true AND (content LIKE '%chartingpath.lovable.app%' OR link_back_url LIKE '%chartingpath.lovable.app%');