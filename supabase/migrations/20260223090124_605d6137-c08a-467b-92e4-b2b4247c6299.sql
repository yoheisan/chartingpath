
-- Add missing pattern name keys to translation_keys
INSERT INTO translation_keys (key, description, category) VALUES
  ('patternNames.Bump-and-Run Reversal', 'Pattern name', 'patternNames'),
  ('patternNames.Island Reversal', 'Pattern name', 'patternNames'),
  ('patternNames.Inverted Head and Shoulders', 'Pattern name', 'patternNames'),
  ('patternNames.Cup with Handle', 'Pattern name', 'patternNames'),
  ('patternNames.Rectangle', 'Pattern name', 'patternNames'),
  ('patternNames.Hammer', 'Pattern name', 'patternNames'),
  ('patternNames.Hanging Man', 'Pattern name', 'patternNames'),
  ('patternNames.Shooting Star', 'Pattern name', 'patternNames'),
  ('patternNames.Doji', 'Pattern name', 'patternNames'),
  ('patternNames.Bullish Harami', 'Pattern name', 'patternNames'),
  ('patternNames.Bearish Harami', 'Pattern name', 'patternNames'),
  ('patternNames.Bullish Engulfing', 'Pattern name', 'patternNames'),
  ('patternNames.Bearish Engulfing', 'Pattern name', 'patternNames'),
  ('patternNames.Spinning Top', 'Pattern name', 'patternNames'),
  ('patternNames.Head & Shoulders', 'Pattern name', 'patternNames'),
  ('patternNames.Inverse Head & Shoulders', 'Pattern name', 'patternNames'),
  ('patternNames.Donchian Breakout Long', 'Pattern name', 'patternNames'),
  ('patternNames.Donchian Breakout Short', 'Pattern name', 'patternNames')
ON CONFLICT ON CONSTRAINT translation_keys_key_key DO NOTHING;

-- Add Japanese translations for all missing pattern names
INSERT INTO translations (key, language_code, value, status, version) VALUES
  ('patternNames.Bump-and-Run Reversal', 'ja', 'バンプ・アンド・ラン・リバーサル', 'approved', 1),
  ('patternNames.Island Reversal', 'ja', 'アイランド・リバーサル', 'approved', 1),
  ('patternNames.Inverted Head and Shoulders', 'ja', '逆ヘッドアンドショルダー', 'approved', 1),
  ('patternNames.Cup with Handle', 'ja', 'カップ・ウィズ・ハンドル', 'approved', 1),
  ('patternNames.Rectangle', 'ja', 'レクタングル', 'approved', 1),
  ('patternNames.Hammer', 'ja', 'ハンマー', 'approved', 1),
  ('patternNames.Hanging Man', 'ja', '首吊り線', 'approved', 1),
  ('patternNames.Shooting Star', 'ja', '流れ星', 'approved', 1),
  ('patternNames.Doji', 'ja', '同時線', 'approved', 1),
  ('patternNames.Bullish Harami', 'ja', '強気のはらみ線', 'approved', 1),
  ('patternNames.Bearish Harami', 'ja', '弱気のはらみ線', 'approved', 1),
  ('patternNames.Bullish Engulfing', 'ja', '強気の包み線', 'approved', 1),
  ('patternNames.Bearish Engulfing', 'ja', '弱気の包み線', 'approved', 1),
  ('patternNames.Spinning Top', 'ja', 'コマ足', 'approved', 1),
  ('patternNames.Head & Shoulders', 'ja', 'ヘッドアンドショルダー', 'approved', 1),
  ('patternNames.Inverse Head & Shoulders', 'ja', '逆ヘッドアンドショルダー', 'approved', 1),
  ('patternNames.Donchian Breakout Long', 'ja', 'ドンチャンブレイクアウト（ロング）', 'approved', 1),
  ('patternNames.Donchian Breakout Short', 'ja', 'ドンチャンブレイクアウト（ショート）', 'approved', 1)
ON CONFLICT ON CONSTRAINT translations_key_language_code_version_key DO NOTHING;
