-- Fix English source tables too
UPDATE learning_articles
SET content = REPLACE(
  REPLACE(
    content,
    'Account Size | 1% Risk | 2% Risk |
|--------------|---------|---------|',
    '| Account Size | 1% Risk | 2% Risk |
|--------------|---------|---------|'
  ),
  'Risk:Reward | Win Rate Needed to Break Even |
|-------------|------------------------------|',
  '| Risk:Reward | Win Rate Needed to Break Even |
|-------------|------------------------------|'
)
WHERE id = 'c222ee62-2db7-4cb0-bd56-5515de9536c3';

-- Fix Japanese second table too
UPDATE learning_article_translations
SET content = REPLACE(
  content,
  'リスク:リワード | 損益分岐点に必要な勝率 |
|-------------|------------------------------|',
  '| リスク:リワード | 損益分岐点に必要な勝率 |
|-------------|------------------------------|'
)
WHERE language_code = 'ja' AND article_id = 'c222ee62-2db7-4cb0-bd56-5515de9536c3';