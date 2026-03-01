UPDATE learning_article_translations 
SET content = REPLACE(
  REPLACE(content,
    E'- **Command Center** パターンビューワー\n- **Historical pattern analysis** (過去のパターン分析)',
    E'- **コマンドセンター**パターンビューワー\n- **過去のパターン分析**'),
  '- **Purple pattern zone** (紫色のパターンゾーン)', '- **紫色のパターンゾーン**'
),
updated_at = now()
WHERE id = 'c9dd3de2-ef53-408d-9d9b-560744baa3df';