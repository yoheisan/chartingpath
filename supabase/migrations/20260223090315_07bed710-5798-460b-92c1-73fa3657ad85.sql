
INSERT INTO translation_keys (key, description, category) VALUES
  ('patternNames.Wedge', 'Pattern name', 'patternNames'),
  ('patternNames.Triangle', 'Pattern name', 'patternNames'),
  ('patternNames.Flag', 'Pattern name', 'patternNames')
ON CONFLICT ON CONSTRAINT translation_keys_key_key DO NOTHING;

INSERT INTO translations (key, language_code, value, status, version) VALUES
  ('patternNames.Wedge', 'ja', 'ウェッジ', 'approved', 1),
  ('patternNames.Triangle', 'ja', 'トライアングル', 'approved', 1),
  ('patternNames.Flag', 'ja', 'フラッグ', 'approved', 1)
ON CONFLICT ON CONSTRAINT translations_key_language_code_version_key DO NOTHING;
