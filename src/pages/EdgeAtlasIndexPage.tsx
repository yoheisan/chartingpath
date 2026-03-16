import { Link } from "react-router-dom";
import { Trophy, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { ALL_PATTERN_IDS, PATTERN_DISPLAY_NAMES } from "@/hooks/useScreenerCaps";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const BULLISH_PATTERNS = new Set([
  "donchian-breakout-long",
  "double-bottom",
  "ascending-triangle",
  "inverse-head-and-shoulders",
  "falling-wedge",
  "bull-flag",
  "cup-and-handle",
  "triple-bottom",
]);

const EdgeAtlasIndexPage = () => {
  const { t } = useTranslation();
  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <PageMeta
        title="Best Chart Patterns by Win Rate — Backtested Rankings | ChartingPath"
        description="Ranked chart patterns by annualised return and win rate. Real backtest data from 320,000+ historical trades across forex, crypto, stocks and commodities."
        canonicalPath="/edge-atlas"
      />
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-amber-500/15">
          <Trophy className="h-6 w-6 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold">{t('edgeAtlas.indexTitle')}</h1>
      </div>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        {t('edgeAtlas.indexDescription')}
      </p>

      {/* Pattern grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_PATTERN_IDS.map((id) => {
          const isBullish = BULLISH_PATTERNS.has(id);
          return (
            <Link key={id} to={`/patterns/${id}/statistics`}>
              <Card className="group hover:border-primary/40 transition-colors h-full">
                <CardHeader className="flex flex-row items-start gap-3 pb-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                      {PATTERN_DISPLAY_NAMES[id] || id}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${isBullish ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {isBullish ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {isBullish ? t('edgeAtlas.bullish') : t('edgeAtlas.bearish')}
                      </Badge>
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default EdgeAtlasIndexPage;
