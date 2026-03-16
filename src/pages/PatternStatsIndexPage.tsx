import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  STAT_PATTERNS,
  STAT_ASSET_CLASSES,
  STAT_TIMEFRAMES,
  PATTERN_NAMES,
  PATTERN_DESCRIPTIONS,
  PATTERN_SVG_PATHS,
  ASSET_CLASS_LABELS,
  TIMEFRAME_LABELS,
} from '@/config/patternStatsConstants';

export default function PatternStatsIndexPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeAsset, setActiveAsset] = useState<string>('all');

  const filtered = useMemo(() => {
    return STAT_PATTERNS.filter((p) => {
      const name = PATTERN_NAMES[p] || p;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search]);

  const assetTabs = [
    { key: 'all', label: t('patternStats.allPatterns') },
    ...STAT_ASSET_CLASSES.map((ac) => ({ key: ac, label: ASSET_CLASS_LABELS[ac] })),
  ];

  return (
    <article className="min-h-screen bg-[#0f1117]">
      <PageMeta
        title="Chart Pattern Statistics — Backtested Win Rates & Performance Data | ChartingPath"
        description="Comprehensive chart pattern backtest statistics across forex, crypto, stocks and commodities. Real win rates, expectancy data, and R:R ratios from 320,000+ historical trades."
        canonicalPath="/patterns/stats"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('patternStats.indexTitle')}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t('patternStats.indexSubtitle')}
          </p>
          <div className="h-0.5 w-20 bg-orange-500 mt-4" />
        </header>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('patternStats.searchPatterns')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1a1d27] border-[#2a2d3a]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {assetTabs.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={activeAsset === tab.key ? 'default' : 'outline'}
                className={activeAsset === tab.key ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                onClick={() => setActiveAsset(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Pattern Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patternSlug) => {
            const name = PATTERN_NAMES[patternSlug] || patternSlug;
            const desc = PATTERN_DESCRIPTIONS[patternSlug]?.substring(0, 120) + '...';
            const svgPath = PATTERN_SVG_PATHS[patternSlug];
            const assetClasses = activeAsset === 'all' ? STAT_ASSET_CLASSES : [activeAsset];

            return (
              <div key={patternSlug} className="bg-[#1a1d27] rounded-xl border border-[#2a2d3a] p-5 hover:border-orange-500/40 transition-colors">
                {/* Pattern SVG */}
                {svgPath && (
                  <div className="mb-3">
                    <svg viewBox="0 0 200 100" className="w-full h-16" aria-hidden>
                      <path d={svgPath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <h2 className="text-lg font-bold text-foreground mb-1">{name}</h2>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{desc}</p>

                {/* Asset class links */}
                <div className="space-y-1">
                  {(assetClasses as readonly string[]).map((ac) => (
                    <div key={ac} className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{ASSET_CLASS_LABELS[ac]}:</span>
                      {STAT_TIMEFRAMES.map((tf) => (
                        <Link
                          key={tf}
                          to={`/patterns/stats/${patternSlug}/${ac}/${tf}`}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#0f1117] text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                        >
                          {tf}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>

                <Link
                  to={`/patterns/stats/${patternSlug}/${(assetClasses as readonly string[])[0]}/${STAT_TIMEFRAMES[1]}`}
                  className="inline-flex items-center text-orange-400 text-sm mt-4 hover:underline"
                >
                  {t('patternStats.viewStatistics')} <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {t('patternStats.noMatchSearch')}
          </div>
        )}

        {/* SEO Footer Text */}
        <section className="mt-16 max-w-3xl">
          <h2 className="text-lg font-bold text-foreground mb-3">{t('patternStats.aboutTitle')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('patternStats.aboutText')}
          </p>
        </section>
      </div>
    </article>
  );
}
