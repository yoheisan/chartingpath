import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { useOutcomeCount } from '@/hooks/useOutcomeCount';
import { buildPatternLabUrl, buildBacktestSeoUrl } from '@/utils/patternLabUrl';
import {
  STAT_PATTERNS,
  STAT_ASSET_CLASSES,
  PATTERN_NAMES,
  PATTERN_SVG_PATHS,
  ASSET_CLASS_LABELS,
} from '@/config/patternStatsConstants';

const SAMPLE_RUNS: Array<{
  pattern: string;
  symbol: string;
  timeframe: string;
  blurb: string;
}> = [
  { pattern: 'bull-flag', symbol: 'EURUSD=X', timeframe: '4h', blurb: 'Forex continuation setup' },
  { pattern: 'head-and-shoulders', symbol: 'BTC-USD', timeframe: '1d', blurb: 'Crypto reversal classic' },
  { pattern: 'cup-and-handle', symbol: 'AAPL', timeframe: '1d', blurb: 'Equity breakout' },
  { pattern: 'falling-wedge', symbol: 'GC=F', timeframe: '1d', blurb: 'Commodity bullish reversal' },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What is Pattern Lab?',
    a: 'Pattern Lab is a backtesting workspace where you pick a chart pattern, choose any tradable instrument and timeframe, and instantly see the historical edge of that setup using real market data.',
  },
  {
    q: 'Which patterns can I test?',
    a: 'All 15 core patterns including Bull Flag, Head & Shoulders, Double Top/Bottom, Ascending and Descending Triangles, Wedges, Cup & Handle, and Donchian Breakouts.',
  },
  {
    q: 'Which markets are supported?',
    a: 'Forex, crypto, US stocks, commodities, and indices. Pattern Lab pulls clean OHLC data from EODHD and Yahoo Finance with full DB caching.',
  },
  {
    q: 'Is Pattern Lab free?',
    a: 'You can run sample backtests and view aggregated edge statistics for free. Saving runs, alerts, and unlimited backtests are part of the paid tiers — see the pricing page for details.',
  },
  {
    q: 'How is the win rate calculated?',
    a: 'Every historical pattern occurrence is replayed against subsequent bars. Win rate is the percentage of occurrences that hit the measured-move take-profit before stopping out. Expectancy is reported in R-multiples.',
  },
  {
    q: 'Can I deploy a backtested setup as an alert?',
    a: 'Yes — once a setup shows positive expectancy across 20+ trades, the Copilot guardrails unlock a one-click deploy to live pattern alerts.',
  },
];

export default function PatternLabHub() {
  const { t } = useTranslation();
  const { formatted: outcomeCount } = useOutcomeCount();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <article className="min-h-screen bg-[#0f1117]">
      <PageMeta
        title="Pattern Lab — Backtest any chart pattern on real market data | ChartingPath"
        description={`Run instant historical backtests on 15 chart patterns across forex, crypto, stocks, commodities and indices. Built on ${outcomeCount}+ recorded pattern occurrences.`}
        canonicalPath="/pattern-lab"
        jsonLd={faqJsonLd}
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        {/* Hero */}
        <header className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium mb-5">
            <FlaskConical className="h-3.5 w-3.5" />
            {t('patternLab.hub.badge', 'Pattern Lab')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {t('patternLab.hub.heroTitle', 'Backtest any chart pattern on real market data')}
          </h1>
          <p className="text-lg text-muted-foreground mb-7 leading-relaxed">
            {t(
              'patternLab.hub.heroSubtitle',
              'Pick a pattern, pick a market, and instantly see its historical edge — win rate, expectancy, and R-multiple distribution from every occurrence we have recorded.',
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link to="/projects/pattern-lab/new">
                {t('patternLab.hub.ctaPrimary', 'Run a backtest')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/patterns/stats">
                {t('patternLab.hub.ctaSecondary', 'Browse pattern statistics')}
              </Link>
            </Button>
          </div>
        </header>

        {/* Sample runs */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('patternLab.hub.samplesTitle', 'Try a sample backtest')}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('patternLab.hub.samplesSubtitle', 'Each link opens Pattern Lab with the setup pre-filled — no signup required.')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_RUNS.map((s) => {
              const name = PATTERN_NAMES[s.pattern] || s.pattern;
              return (
                <Link
                  key={`${s.pattern}-${s.symbol}`}
                  to={buildPatternLabUrl({ pattern: s.pattern, instrument: s.symbol, timeframe: s.timeframe })}
                  className="block bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4 hover:border-orange-500/40 transition-colors group"
                >
                  <div className="text-xs text-muted-foreground mb-2">{s.blurb}</div>
                  <div className="font-semibold text-foreground mb-1 group-hover:text-orange-400 transition-colors">
                    {name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.symbol} · {s.timeframe}
                  </div>
                  <div className="inline-flex items-center text-xs text-orange-400 mt-3">
                    {t('patternLab.hub.openLab', 'Open in Lab')}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Browse by pattern × asset class */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('patternLab.hub.browseTitle', 'Browse backtests by pattern and market')}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('patternLab.hub.browseSubtitle', 'Aggregated win rates and expectancy for every pattern across each major asset class.')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STAT_PATTERNS.map((p) => {
              const name = PATTERN_NAMES[p] || p;
              const svgPath = PATTERN_SVG_PATHS[p];
              return (
                <div key={p} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {svgPath && (
                      <svg viewBox="0 0 200 100" className="w-14 h-8 shrink-0" aria-hidden>
                        <path d={svgPath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <h3 className="font-semibold text-foreground text-sm">{name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STAT_ASSET_CLASSES.map((ac) => (
                      <Link
                        key={ac}
                        to={buildBacktestSeoUrl(p, ac)}
                        className="text-xs px-2 py-1 rounded bg-[#0f1117] text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                      >
                        {ASSET_CLASS_LABELS[ac]}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('patternLab.hub.faqTitle', 'Frequently asked questions')}
          </h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4 group">
                <summary className="font-medium text-foreground cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}