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
                    REPLACE(content,
                      '## Chart Controls Reference', '## チャート操作リファレンス'),
                      '| Action | Desktop | Mobile |', '| 操作 | デスクトップ | モバイル |'),
                      '| Zoom time axis | Scroll wheel | Pinch |', '| 時間軸ズーム | スクロールホイール | ピンチ |'),
                      '| Pan horizontally | Click + drag | Swipe |', '| 水平方向パン | クリック＋ドラッグ | スワイプ |'),
                      '| Pan vertically | Shift + drag | Two-finger drag |', '| 垂直方向パン | Shift＋ドラッグ | 二本指ドラッグ |'),
                      '| Adjust price scale | Drag right axis | Drag right edge |', '| 価格スケール調整 | 右軸をドラッグ | 右端をドラッグ |'),
                      '| Reset view | Click ↺ button | Tap ↺ button |', '| 表示リセット | ↺ボタンをクリック | ↺ボタンをタップ |'),
                  '## When to Use Each Chart', '## 各チャートの使い分け'),
                '## Related Guides', '## 関連ガイド'),
              '### Key Features', '### 主な機能'),
            '### Visual Elements', '### ビジュアル要素'),
updated_at = now()
WHERE id = 'c9dd3de2-ef53-408d-9d9b-560744baa3df';