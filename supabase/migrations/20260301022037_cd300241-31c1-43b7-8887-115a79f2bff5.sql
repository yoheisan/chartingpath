UPDATE learning_article_translations
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        content,
        '- [Platform Glossary](/blog/platform-glossary) - Official terminology reference',
        '- [プラットフォーム用語集](/blog/platform-glossary) - 公式用語リファレンス'
      ),
      '- [Chart Types Explained](/blog/chart-types-explained) - Understanding different chart views',
      '- [チャートタイプ解説](/blog/chart-types-explained) - さまざまなチャートビューの理解'
    ),
    '- [Platform FAQ](/blog/platform-faq) - Common questions answered',
    '- [プラットフォームFAQ](/blog/platform-faq) - よくある質問と回答'
  ),
  '平易な英語であなたの要望を記述してください:',
  '平易な言葉であなたの要望を記述してください：'
)
WHERE language_code = 'ja' AND article_id = 'a45446a7-ef0f-42cb-b22d-c51f04d3bc91';