ns of work to lift Pattern Lab discoverability and engagement. All three ship together but are independent enough to land in sequence.

## 1. Pattern Lab marketing hub at `/pattern-lab`

A new public landing page distinct from the `/new` wizard. Purpose: convert search/social traffic into wizard starts.

Content blocks:
- Hero: "Backtest any chart pattern on real market data" + CTA into `/projects/pattern-lab/new`
- "How it works" — 3 steps (pick pattern → pick asset/timeframe → see historical edge)
- Sample run gallery — 3–4 pre-rendered backtests (e.g. Bull Flag on EURUSD 4h, Head & Shoulders on BTCUSD 1d) pulled from `historical_pattern_occurrences` / existing stats, each linking into a pre-filled wizard URL via `buildPatternLabUrl`
- "What you can test" — grid of the 17 supported patterns linking to their stats pages
- FAQ block (5–6 Qs) for FAQPage JSON-LD

PageMeta: title, description, canonical, CollectionPage JSON-LD listing the programmatic pages below.

## 2. Programmatic "Backtest [pattern] on [asset]" pages

New route: `/backtest/:patternId/:assetClass` (e.g. `/backtest/bull-flag/forex`).
Total surface: 15 patterns × 5 asset classes = **75 pages** (mirrors the existing 375 `/patterns/stats/...` pattern but at pattern×asset granularity, not pattern×asset×timeframe — keeps it manageable and avoids thin-content penalty).

Each page renders:
- H1: "Backtest the [Pattern] on [Asset class]"
- Pulled stats from `pattern_stats_pooled_mv` or equivalent (win rate, expectancy, sample size) — reuses existing enrichment chain (Exact > Global > Bayesian per memory)
- Top 3 instrument×timeframe combos as a table, each linking to existing `/patterns/:patternId/:instrument/statistics`
- Embedded sample chart snippet (reuse existing pattern visualization)
- CTA: "Run your own backtest on [asset]" → `/projects/pattern-lab/new?pattern=...&assetClass=...`
- Educational copy block sourced from existing pattern library content (no new copywriting required — pulled dynamically)
- FAQPage JSON-LD + BreadcrumbList

If a pattern×asset combo has <10 historical trades, render a "limited data" state and noindex that specific page (avoid thin-content).

## 3. Cross-linking + sitemap

- **Edge Atlas pattern pages** (`/edge-atlas/:patternId`): add a "Backtest this pattern" card linking to `/backtest/:patternId/forex` (or the highest-sample asset class for that pattern).
- **Programmatic stats pages** (`/patterns/stats/:slug/:asset/:tf`): add a sidebar/footer CTA into the matching `/backtest/:slug/:asset` page.
- **Pattern library cards**: add secondary "Backtest →" link beneath each pattern.
- **Sitemap edge function** (`supabase/functions/sitemap/index.ts`): add `/pattern-lab` (priority 0.9) and loop-emit the 75 `/backtest/...` URLs (priority 0.7). Filter to combos with ≥10 trades.
- **Internal nav**: add "Pattern Lab" entry to desktop nav alongside Screener/Edge Atlas (per the Desktop Nav memory's priority structure).

## Technical notes

- Routing: lazy-load both new pages in `src/App.tsx`; add to `APP_SCAN_ROUTES` in `src/utils/appRoutes.ts` and to the site structure audit doc.
- Data: no new tables. All stats reuse `pattern_stats_pooled_mv`, `instrument_pattern_stats_mv`, and `historical_pattern_occurrences`.
- URL builder: extend `src/utils/patternLabUrl.ts` with `buildBacktestSeoUrl({patternId, assetClass})`.
- i18n: every new UI string goes through `t('namespace.key', 'Fallback')` per Core memory.
- PageMeta JSON-LD: hub gets `CollectionPage`, each backtest page gets `Article` + `FAQPage` + `BreadcrumbList`.
- Sitemap query: add `select pattern_id, asset_class, sum(total_trades)` aggregation, filter `having sum >= 10`.

## Out of scope

- No new backend tables, edge functions, or cron jobs.
- No changes to the wizard itself — only routing into it with pre-filled URL params.
- No paid-tier gating changes; hub and SEO pages are fully public.
- No social og:image generation (can be added later if engagement justifies).

## Sequencing

1. Hub page + nav entry + sitemap update (ships value immediately, indexable in days)
2. Programmatic `/backtest/...` route + 75 pages
3. Cross-link injection on Edge Atlas / stats / pattern library
4. Site structure audit doc refresh

## Expected impact (honest)

- Indexing: ~75 new long-tail URLs targeting "backtest [pattern] [asset]" queries. Search Console typically picks these up in 1–2 weeks; meaningful traffic in 4–8 weeks if content quality holds.
- Engagement: cross-linking from existing higher-traffic pages (Edge Atlas, stats) should drive a much faster lift than waiting on SEO — likely the dominant near-term effect.
- Risk: thin content on low-sample combos. The ≥10-trade gate + noindex on sparse pages mitigates this.