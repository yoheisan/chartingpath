UPDATE learning_article_translations
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              content,
                              '- **Find A-quality patterns forming now** - 8,500以上のすべての銘柄から最適な設定をスキャン',
                              '- **今形成中のA品質パターンを検索** - 8,500以上のすべての銘柄から最適な設定をスキャン'
                            ),
                            '- **What''s moving in the markets?** - 主要指標のキーパターンを含むクイックマーケットパルス',
                            '- **市場で何が動いている？** - 主要指標のキーパターンを含むクイックマーケットパルス'
                          ),
                          '- **Generate a Pine Script strategy** - TradingView対応の自動化コードを作成',
                          '- **Pine Script戦略を生成** - TradingView対応の自動化コードを作成'
                        ),
                        '- **Teach me a chart pattern** - 実際の例を用いたインタラクティブなパターン教育',
                        '- **チャートパターンを教えて** - 実際の例を用いたインタラクティブなパターン教育'
                      ),
                      '- **Find bullish patterns** - ブルフラッグ、アセンディングトライアングルなどを検索',
                      '- **強気パターンを検索** - ブルフラッグ、アセンディングトライアングルなどを検索'
                    ),
                    '- **Get pattern statistics** - 過去の勝率とR:Rパフォーマンスデータ',
                    '- **パターン統計を取得** - 過去の勝率とR:Rパフォーマンスデータ'
                  ),
                  '- **Scan crypto patterns** - BTC、ETH、SOL、および主要なアルトコイン',
                  '- **暗号資産パターンをスキャン** - BTC、ETH、SOL、および主要なアルトコイン'
                ),
                '- **Create a pattern alert** - 特定の銘柄の特定のパターンに関する通知を設定',
                '- **パターンアラートを作成** - 特定の銘柄の特定のパターンに関する通知を設定'
              ),
              '- **Build custom Pine Script** - 自然言語からTradingView戦略コードを生成',
              '- **カスタムPine Scriptを構築** - 自然言語からTradingView戦略コードを生成'
            ),
            '| Dashboard | G D | ライブチャート付きのコマンドセンター |',
            '| ダッシュボード | G D | ライブチャート付きのコマンドセンター |'
          ),
          '| Pattern Screener | G S | ライブパターン検出 |',
          '| パターンスクリーナー | G S | ライブパターン検出 |'
        ),
        '| Pattern Lab | G L | リサーチ＆バックテスト環境 |',
        '| パターンラボ | G L | リサーチ＆バックテスト環境 |'
      ),
      '| My Alerts | G A | アラート管理 |',
      '| マイアラート | G A | アラート管理 |'
    ),
    '| My Scripts | G C | Pine Scriptライブラリ |',
    '| マイスクリプト | G C | Pine Scriptライブラリ |'
  ),
  '| Learning Center | G E | 教育＆チュートリアル |',
  '| ラーニングセンター | G E | 教育＆チュートリアル |'
)
WHERE language_code = 'ja' AND article_id = 'a45446a7-ef0f-42cb-b22d-c51f04d3bc91';