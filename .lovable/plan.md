

## Plan: Rewrite About page with TradingView origin story

### New narrative

Rewrite the headline and 5 body paragraphs to tell an enthusiastic, personal story:

**Headline**: "I was TradingView's first hire in Japan."

**p1**: The excitement of joining TradingView early — watching individual traders finally get access to institutional-grade charting tools. Growing the Japan user base from 50,000 to 200,000. The energy of being part of something that was genuinely democratizing trading.

**p2**: But working that close to traders every day, one question kept coming up: "I can see the pattern — but does it actually work?" TradingView gave traders the best charts in the world. But nobody was tracking what happened *after* a pattern formed.

**p3**: That question wouldn't leave. Does a head and shoulders on EUR/USD on the 4H chart actually break down? How often? With what risk-reward? No platform had the answer — not even TradingView.

**p4**: So I built ChartingPath. Every pattern detected, every outcome tracked — win or loss, how far it ran, how long it took. What started as a personal obsession is now the largest labeled dataset of chart pattern outcomes in existence.

**p5**: ChartingPath is solo-built, just like the early days at TradingView taught me — move fast, stay close to users, and let the data speak for itself.

**Founder block**: "Yohei Nishiyama" + new subtitle "Ex-TradingView Japan (first hire)"

### Files to edit

1. **`src/pages/About.tsx`** — update fallback strings for headline, p1–p5, founderName, add founderRole subtitle
2. **`src/i18n/locales/en.json`** — update `aboutPage2.headline`, `aboutPage2.p1`–`p5`, `aboutPage2.founderName`, add `aboutPage2.founderRole`

### No structural changes
Same page layout, same CTA, same footer line. Only text content changes.

