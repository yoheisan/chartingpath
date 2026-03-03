UPDATE educational_content_pieces
SET content = REPLACE(content, 'https://chartingpath.com/learn/', 'https://chartingpath.lovable.app/blog/')
WHERE content LIKE '%chartingpath.com/learn/%';