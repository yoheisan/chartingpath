-- Fix double-pipe in both JA tables
UPDATE learning_article_translations
SET content = REPLACE(
  REPLACE(
    content,
    '| | 口座規模 | 1％リスク | 2％リスク |',
    '| 口座規模 | 1％リスク | 2％リスク |'
  ),
  '| | リスク:リワード | 損益分岐点に必要な勝率 |',
  '| リスク:リワード | 損益分岐点に必要な勝率 |'
)
WHERE language_code = 'ja' AND article_id = 'c222ee62-2db7-4cb0-bd56-5515de9536c3';

-- Fix English too
UPDATE learning_articles
SET content = REPLACE(
  REPLACE(
    content,
    '| | Account Size | 1% Risk | 2% Risk |',
    '| Account Size | 1% Risk | 2% Risk |'
  ),
  '| | Risk:Reward | Win Rate Needed to Break Even |',
  '| Risk:Reward | Win Rate Needed to Break Even |'
)
WHERE id = 'c222ee62-2db7-4cb0-bd56-5515de9536c3';