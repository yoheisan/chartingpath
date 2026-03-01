UPDATE learning_article_translations 
SET content = REPLACE(
  REPLACE(content, 
    '- [Chart Types Explained](/blog/chart-types-explained) - すべてのチャートビューのビジュアルガイド', 
    '- [チャートタイプ解説](/blog/chart-types-explained) - すべてのチャートビューのビジュアルガイド'),
  '- [Platform FAQ](/blog/platform-faq) - よくある質問とその回答',
  '- [プラットフォームFAQ](/blog/platform-faq) - よくある質問とその回答'
),
updated_at = now()
WHERE id = 'd7a42a99-a895-42d2-b1b0-5451c52abcff';