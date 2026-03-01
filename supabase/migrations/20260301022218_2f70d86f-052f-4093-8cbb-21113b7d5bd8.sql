UPDATE learning_article_translations
SET content = REPLACE(
  content,
  '口座規模 | 1％リスク | 2％リスク |
|--------------|---------|---------|',
  '| 口座規模 | 1％リスク | 2％リスク |
|--------------|---------|---------|'
)
WHERE language_code = 'ja' AND article_id = 'c222ee62-2db7-4cb0-bd56-5515de9536c3';