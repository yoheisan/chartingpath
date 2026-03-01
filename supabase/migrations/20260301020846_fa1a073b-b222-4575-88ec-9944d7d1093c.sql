UPDATE learning_article_translations 
SET content = REPLACE(
  REPLACE(content, '## Pattern Quality System', '## パターン品質システム'),
  '## Trading Terminology', '## トレーディング用語'
),
updated_at = now()
WHERE id = 'd7a42a99-a895-42d2-b1b0-5451c52abcff';