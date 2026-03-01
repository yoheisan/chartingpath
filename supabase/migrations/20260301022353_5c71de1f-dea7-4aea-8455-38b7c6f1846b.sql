UPDATE learning_article_translations
SET content = regexp_replace(
  content,
  E'リスク:リワード \\| 損益分岐点に必要な勝率 \\|',
  E'| リスク:リワード | 損益分岐点に必要な勝率 |'
)
WHERE language_code = 'ja' AND article_id = 'c222ee62-2db7-4cb0-bd56-5515de9536c3'
AND content LIKE '%リスク:リワード | 損益%'
AND content NOT LIKE '%| リスク:リワード | 損益%';