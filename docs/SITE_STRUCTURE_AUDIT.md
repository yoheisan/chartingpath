# Site Structure Audit

> Last updated: 2026-03-17

## Route Inventory

All routes from `src/App.tsx`. Redirects omitted — only final destinations listed.

### Public Pages (no auth)

| Route | Component | Sitemap | Priority |
|---|---|---|---|
| `/` | `Index` | ✅ | 1.0 |
| `/about` | `About` | ✅ | 0.5 |
| `/learn` | `BlogV2` | ✅ | 0.9 |
| `/blog/:slug` | `DynamicArticle` | ✅ (dynamic) | 0.7 |
| `/community` | `CommunityFeed` | ✅ | 0.7 |
| `/patterns/live` | `LivePatternsPage` | ✅ | 0.9 |
| `/tools/agent-scoring` | `AgentScoring` | ✅ | 0.8 |
| `/chart-patterns/library` | `PatternLibraryPage` | ✅ | 0.8 |
| `/chart-patterns/generator` | `PatternGenerator` | ✅ | 0.7 |
| `/chart-patterns/strategies` | `TradingStrategiesPage` | ✅ | 0.7 |
| `/chart-patterns/quiz` | `PatternQuizPage` | ✅ | 0.7 |
| `/quiz/pattern-identification` | `PatternIdentificationQuizPage` | ✅ | 0.6 |
| `/quiz/trading-knowledge` | `TradingKnowledgeQuizPage` | ✅ | 0.6 |
| `/quiz/stock-market` | `StockMarketQuiz` | ✅ | 0.6 |
| `/quiz/forex` | `ForexQuiz` | ✅ | 0.6 |
| `/quiz/crypto` | `CryptoQuiz` | ✅ | 0.6 |
| `/quiz/commodities` | `CommoditiesQuiz` | ✅ | 0.6 |
| `/tools/pip-calculator` | `PipCalculator` | ✅ | 0.7 |
| `/tools/risk-calculator` | `RiskCalculator` | ✅ | 0.7 |
| `/tools/market-breadth` | `MarketBreadthReport` | ✅ | 0.7 |
| `/tools/economic-calendar` | `EconomicCalendar` | ✅ | 0.7 |
| `/tools/paper-trading` | `PaperTradingPage` | ✅ | 0.6 |
| `/projects/pattern-lab/new` | `PatternLabWizard` | ✅ | 0.8 |
| `/projects/pattern-lab/audit` | `PatternAuditPage` | ✅ | 0.7 |
| `/projects/pricing` | `ProjectsPricing` | ✅ | 0.6 |
| `/edge-atlas` | `EdgeAtlasIndexPage` | ✅ | 0.8 |
| `/edge-atlas/:patternId` | `EdgeAtlasPatternPage` | ❌ (dynamic) | — |
| `/patterns/:patternId/statistics` | `PatternStatisticsPage` | ✅ (dynamic) | 0.8 |
| `/patterns/:patternId/:instrument/statistics` | `InstrumentPatternStatsPage` | ✅ (dynamic) | 0.6 |
| `/patterns/stats` | `PatternStatsIndexPage` | ✅ | 0.9 |
| `/patterns/stats/:slug/:asset/:tf` | `ProgrammaticPatternStatsPage` | ✅ (375+ pages) | 0.8 |
| `/instruments/:symbol` | `InstrumentPage` | ✅ (dynamic) | 0.6 |
| `/features/trading-copilot` | `TradingCopilotFeature` | ✅ | 0.6 |
| `/strategy/:strategyId` | `StrategyDetail` | ❌ (dynamic) | — |
| `/share/:token` | `SharedBacktest` | ❌ (user-gen) | — |
| `/s/:token` | `SharedPattern` | ❌ (user-gen) | — |
| `/faq` | `FAQ` | ✅ | 0.5 |
| `/support` | `SupportPage` | ✅ | 0.5 |
| `/terms` | `Terms` | ✅ | 0.3 |
| `/privacy` | `Privacy` | ✅ | 0.3 |

### Auth-Gated Member Pages

| Route | Component |
|---|---|
| `/members/dashboard` | `MemberDashboard` |
| `/members/scripts` | `MemberScripts` |
| `/members/downloads` | `MemberDownloads` |
| `/members/alerts` | `MemberAlerts` |
| `/members/account` | `MemberAccount` |
| `/elite` | `EliteDashboard` |
| `/auth` | `Auth` |

### Admin Pages

| Route | Component |
|---|---|
| `/admin/dashboard` | `AdminDashboard` |
| `/admin/content` | `AdminContentManagement` |
| `/admin/kpi` | `AdminKPIDashboard` |
| `/admin/translation-management` | `TranslationManagement` |
| `/admin/journey-analytics` | `AIJourneyAnalytics` |
| `/admin/outcome-analytics` | `OutcomeAnalytics` |
| `/admin/pattern-health` | `PatternHealthMonitor` |
| `/admin/social-cms` | `SocialMediaCMS` |
| `/admin/cron-monitor` | `CronJobMonitor` |
| `/admin/login` | `AdminLogin` |

### Dev / Internal Pages (not in sitemap)

| Route | Component |
|---|---|
| `/email-preview` | `EmailPreview` |
| `/dev/pattern-preview` | `PatternVisualizationPreview` |

---

## Active Redirects

| From | To |
|---|---|
| `/tools/script-generator` | `/members/scripts` |
| `/study`, `/study/:symbol` | `/members/dashboard` |
| `/strategy-workspace`, `/ai-builder`, `/backtest`, `/strategy`, `/projects` | `/projects/pattern-lab/new` |
| `/projects/setup-finder/new`, `/projects/portfolio-sim/new` | `/projects/pattern-lab/new` |
| `/pricing` | `/projects/pricing` |
| `/members/trading` | `/members/dashboard` |
| `/admin` | `/admin/dashboard` |
| `/learn/<article>` (25 slugs) | `/blog/<article>` |

---

## Sitemap Coverage

**Edge function**: `supabase/functions/sitemap/index.ts`  
**URL**: `https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/sitemap`

| Category | Count | Source |
|---|---|---|
| Static routes | 50 | Hardcoded `STATIC_ROUTES` array |
| Pattern stats (global) | 15 | `PATTERN_IDS` × `/patterns/:id/statistics` |
| Programmatic SEO pages | 375 | 15 patterns × 5 asset classes × 5 timeframes |
| Instrument+pattern combos | Dynamic | `instrument_pattern_stats_mv` (≥10 trades) |
| Instrument pages | Dynamic | `instruments` table (`is_active = true`) |
| Blog articles | Dynamic | `learning_articles` (`status = published`) |

**Total estimated URLs**: 500–2,000+ depending on active instruments and articles.

---

## Key Architecture Notes

- **Blog URL prefix**: `/blog/:slug` (canonical). Legacy `/learn/:slug` routes 301-redirect.
- **Production domain**: `chartingpath.com` — all OG tags and sitemap URLs use this.
- **Route config files**: `src/lib/navigationRoutes.ts` (command palette), `src/utils/appRoutes.ts` (string extractor scanner).
- **Lazy loading**: All page components use `React.lazy()` with `<Suspense>` + `PageSkeleton` fallback.
- **Catch-all**: `*` → `NotFound` component.

---

## Discrepancies Fixed (2026-03-17)

| Issue | Fix |
|---|---|
| Sitemap had `/pattern-lab` (dead path) | Changed to `/projects/pattern-lab/new` |
| Sitemap had `/tools/edge-atlas` (dead path) | Changed to `/edge-atlas` |
| Sitemap had `/pricing` (redirects) | Changed to `/projects/pricing` |
| Sitemap article URLs used `/learn/:slug` | Changed to `/blog/:slug` |
| 30+ public routes missing from sitemap | Added all tools, quizzes, features, legal pages |
| `appRoutes.ts` references `/screener` | Actual route is `/patterns/live` — already correct in sitemap |
