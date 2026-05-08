-- Insert keys first
INSERT INTO translation_keys (key, category)
SELECT v.key, v.category
FROM (VALUES
('edgeAtlas.inYourPlan','edgeAtlas'),
('common.loading','common'),
('patternScreenerTable.headerTitle','patternScreenerTable'),
('patternScreenerTable.scanningInstruments','patternScreenerTable'),
('common.openInTradingView','common'),
('copilot.dismissTooltip','copilot'),
('copilot.openAria','copilot'),
('copilot.helpful','copilot'),
('copilot.notHelpful','copilot'),
('copilot.reportIssue','copilot'),
('copilot.scrollDown','copilot')
) AS v(key, category)
WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.key = v.key);

-- Insert translations
INSERT INTO translations (key, language_code, value, status)
SELECT v.key, v.lang, v.val, v.st
FROM (VALUES
('edgeAtlas.inYourPlan','en','In your plan','approved'),
('edgeAtlas.inYourPlan','ja','プランに含まれています','auto_translated'),
('common.loading','en','Loading...','approved'),
('common.loading','ja','読み込み中...','auto_translated'),
('patternScreenerTable.headerTitle','en','Active Pattern Screener','approved'),
('patternScreenerTable.headerTitle','ja','アクティブパターンスクリーナー','auto_translated'),
('patternScreenerTable.scanningInstruments','en','Scanning {{count}} instruments...','approved'),
('patternScreenerTable.scanningInstruments','ja','{{count}}銘柄をスキャン中...','auto_translated'),
('common.openInTradingView','en','Open in TradingView','approved'),
('common.openInTradingView','ja','TradingViewで開く','auto_translated'),
('copilot.dismissTooltip','en','Dismiss tooltip','approved'),
('copilot.dismissTooltip','ja','ヒントを閉じる','auto_translated'),
('copilot.openAria','en','Open AI Trading Copilot','approved'),
('copilot.openAria','ja','AIトレーディングCopilotを開く','auto_translated'),
('copilot.helpful','en','Helpful','approved'),
('copilot.helpful','ja','役に立った','auto_translated'),
('copilot.notHelpful','en','Not helpful','approved'),
('copilot.notHelpful','ja','役に立たなかった','auto_translated'),
('copilot.reportIssue','en','Report issue','approved'),
('copilot.reportIssue','ja','問題を報告','auto_translated'),
('copilot.scrollDown','en','Scroll down','approved'),
('copilot.scrollDown','ja','下にスクロール','auto_translated')
) AS v(key, lang, val, st)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t WHERE t.key = v.key AND t.language_code = v.lang
);