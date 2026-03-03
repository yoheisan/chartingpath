UPDATE educational_content_pieces
SET link_back_url = REPLACE(link_back_url, 'https://chartingpath.com/learn/', 'https://chartingpath.lovable.app/blog/')
WHERE link_back_url LIKE '%chartingpath.com/learn/%';