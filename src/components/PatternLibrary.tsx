import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, RotateCcw, Info, ArrowRight, Database } from "lucide-react";
import { useState, lazy, Suspense, memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { PatternDetailModal } from "@/components/PatternDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { usePatternLibraryStats, type PatternLibraryStat } from "@/hooks/usePatternLibraryStats";
import { CANDLESTICK_PATTERNS } from "@/hooks/usePatternDetailStats";

const DynamicPatternChart = lazy(() => 
  import('@/components/DynamicPatternChart').then(mod => ({ default: mod.DynamicPatternChart }))
);

const ChartThumbnailSkeleton = memo(() => (
  <div className="h-32 bg-muted/30 flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
));
ChartThumbnailSkeleton.displayName = 'ChartThumbnailSkeleton';

interface Pattern {
  name: string;
  type: "reversal" | "continuation" | "candlestick";
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  chartKey?: string;
}

const PATTERN_LIBRARY: Pattern[] = [
  { name: "Head and Shoulders", type: "reversal", description: "Most reliable bearish reversal pattern with three peaks", difficulty: "Intermediate", chartKey: "head-shoulders" },
  { name: "Inverted Head and Shoulders", type: "reversal", description: "Bullish reversal pattern with three troughs - mirror of Head and Shoulders", difficulty: "Intermediate", chartKey: "inverted-head-shoulders" },
  { name: "Double Top", type: "reversal", description: "Bearish reversal with two peaks at same level", difficulty: "Beginner", chartKey: "double-top" },
  { name: "Double Bottom", type: "reversal", description: "Bullish reversal with two troughs at same level", difficulty: "Beginner", chartKey: "double-bottom" },
  { name: "Triple Top", type: "reversal", description: "Strong bearish reversal with three equal peaks", difficulty: "Advanced", chartKey: "triple-top" },
  { name: "Triple Bottom", type: "reversal", description: "Strong bullish reversal with three equal troughs", difficulty: "Advanced", chartKey: "triple-bottom" },
  { name: "Bump-and-Run Reversal", type: "reversal", description: "Three-phase reversal pattern with trend acceleration", difficulty: "Advanced", chartKey: "bump-run-reversal" },
  { name: "Island Reversal", type: "reversal", description: "Gap-based reversal pattern isolated from main trend", difficulty: "Advanced", chartKey: "island-reversal" },
  { name: "Donchian Breakout (Long)", type: "continuation", description: "Bullish breakout above the 20-period high Donchian channel", difficulty: "Beginner", chartKey: "donchian-breakout-long" },
  { name: "Donchian Breakout (Short)", type: "continuation", description: "Bearish breakdown below the 20-period low Donchian channel", difficulty: "Beginner", chartKey: "donchian-breakout-short" },
  { name: "Ascending Triangle", type: "continuation", description: "Bullish continuation with horizontal resistance", difficulty: "Beginner", chartKey: "ascending-triangle" },
  { name: "Descending Triangle", type: "continuation", description: "Bearish continuation with horizontal support", difficulty: "Beginner", chartKey: "descending-triangle" },
  { name: "Symmetrical Triangle", type: "continuation", description: "Neutral triangle with converging trend lines", difficulty: "Intermediate", chartKey: "symmetrical-triangle" },
  { name: "Bull Flag", type: "continuation", description: "Brief consolidation in strong uptrend", difficulty: "Beginner", chartKey: "bull-flag" },
  { name: "Bear Flag", type: "continuation", description: "Brief consolidation in strong downtrend", difficulty: "Beginner", chartKey: "bear-flag" },
  { name: "Pennant", type: "continuation", description: "Small symmetrical triangle after strong move", difficulty: "Intermediate", chartKey: "symmetrical-triangle" },
  { name: "Cup with Handle", type: "continuation", description: "Bullish continuation resembling a cup", difficulty: "Intermediate", chartKey: "cup-handle" },
  { name: "Rectangle", type: "continuation", description: "Consolidation between horizontal support and resistance", difficulty: "Beginner", chartKey: "rectangle" },
  { name: "Rising Wedge", type: "reversal", description: "Bearish reversal with converging upward sloping trendlines", difficulty: "Intermediate", chartKey: "rising-wedge" },
  { name: "Falling Wedge", type: "reversal", description: "Bullish reversal with converging downward sloping trendlines", difficulty: "Intermediate", chartKey: "falling-wedge" },
  { name: "Hammer", type: "candlestick", description: "Bullish reversal with long lower shadow", difficulty: "Beginner", chartKey: "hammer" },
  { name: "Hanging Man", type: "candlestick", description: "Bearish reversal with long lower shadow", difficulty: "Beginner", chartKey: "hanging-man" },
  { name: "Shooting Star", type: "candlestick", description: "Bearish reversal with long upper shadow", difficulty: "Beginner", chartKey: "shooting-star" },
  { name: "Doji", type: "candlestick", description: "Indecision candle with equal open/close", difficulty: "Beginner", chartKey: "doji" },
  { name: "Bullish Harami", type: "candlestick", description: "Small candle inside previous large bearish candle", difficulty: "Intermediate", chartKey: "bullish-harami" },
  { name: "Bearish Harami", type: "candlestick", description: "Small candle inside previous large bullish candle", difficulty: "Intermediate", chartKey: "bearish-harami" },
  { name: "Bullish Engulfing", type: "candlestick", description: "Large bullish candle engulfing previous bearish candle", difficulty: "Beginner", chartKey: "bullish-engulfing" },
  { name: "Bearish Engulfing", type: "candlestick", description: "Large bearish candle engulfing previous bullish candle", difficulty: "Beginner", chartKey: "bearish-engulfing" },
  { name: "Spinning Top", type: "candlestick", description: "Small body with long shadows indicating indecision", difficulty: "Beginner", chartKey: "spinning-top" },
];

function PatternDataBadge({ stat }: { stat: PatternLibraryStat | undefined }) {
  if (!stat) return null;

  const hasEnoughData = stat.total_detections >= 10;

  if (!hasEnoughData) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <Database className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground italic">
          Accumulating data — {stat.total_detections} detection{stat.total_detections !== 1 ? 's' : ''} so far
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-0.5">
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary font-semibold">
          ChartingPath data
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] mt-1">
        <div>
          <span className="font-semibold text-foreground">{stat.win_rate}%</span>
          <span className="text-muted-foreground ml-1">win rate</span>
          <div className="text-muted-foreground/70">(n={stat.total_detections.toLocaleString()})</div>
        </div>
        <div>
          <span className="text-muted-foreground">Best TF:</span>
          <div className="font-medium text-foreground">{stat.best_timeframe}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Best:</span>
          <div className="font-medium text-foreground truncate">{stat.best_instrument}</div>
        </div>
      </div>
    </div>
  );
}

export const PatternLibrary = () => {
  const { t } = useTranslation();
  const [selectedPatternForDetails, setSelectedPatternForDetails] = useState<string | null>(null);
  const { data: statsData, isLoading: statsLoading } = usePatternLibraryStats();

  const statsMap = useMemo(() => {
    const map = new Map<string, PatternLibraryStat>();
    if (statsData) {
      for (const s of statsData) {
        map.set(s.pattern_name, s);
      }
    }
    return map;
  }, [statsData]);

  const getPatternIcon = (type: string) => {
    switch (type) {
      case "reversal": return <RotateCcw className="h-4 w-4" />;
      case "continuation": return <TrendingUp className="h-4 w-4" />;
      case "candlestick": return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-bullish text-bullish-foreground";
      case "Intermediate": return "bg-primary text-primary-foreground";
      case "Advanced": return "bg-bearish text-bearish-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const groupedPatterns = {
    reversal: PATTERN_LIBRARY.filter(p => p.type === "reversal"),
    continuation: PATTERN_LIBRARY.filter(p => p.type === "continuation"),
    candlestick: PATTERN_LIBRARY.filter(p => p.type === "candlestick")
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">

        {/* Data provenance header */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm text-foreground leading-relaxed">
            {t('patternLibrary2.dataProvenanceNote', "Win rates below are from ChartingPath's live detection engine — real outcomes from real pattern detections, not historical studies. Data grows daily.")}
          </p>
        </div>

      {Object.entries(groupedPatterns).map(([type, patterns]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center gap-3">
            {getPatternIcon(type)}
            <h3 className="text-2xl font-semibold capitalize text-foreground">
              {type === "reversal" ? t('patternLibrary.reversalPatterns') : type === "continuation" ? t('patternLibrary.continuationPatterns') : t('patternLibrary.candlestickPatterns')}
            </h3>
            <Badge variant="outline" className="text-sm">
              {t('patternLibrary.patternsCount', { count: patterns.length })}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map((pattern, index) => {
              const stat = statsMap.get(pattern.name);
              return (
                <Card 
                  key={index} 
                  className="overflow-hidden hover:border-primary/50 transition-colors border-border/50 cursor-pointer group"
                  onClick={() => setSelectedPatternForDetails(getPatternKey(pattern.name))}
                >
                  {/* Pattern Chart Thumbnail */}
                  <div className="relative h-36 bg-gradient-to-br from-muted/30 to-background overflow-hidden">
                    {pattern.chartKey && (
                      <Suspense fallback={<ChartThumbnailSkeleton />}>
                        <div className="absolute inset-0 scale-[0.35] origin-top-left" style={{ width: '285%', height: '285%' }}>
                          <DynamicPatternChart 
                            patternType={pattern.chartKey} 
                            width={400} 
                            height={280}
                            showTitle={false}
                          />
                        </div>
                      </Suspense>
                    )}
                    <Badge 
                      variant={pattern.type === "reversal" ? "destructive" : pattern.type === "continuation" ? "default" : "secondary"}
                      className="absolute top-2 right-2 text-xs z-10"
                    >
                      {t(`patternLibrary.types.${pattern.type}`)}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                        {t(`patternNames.${pattern.name}`, pattern.name)}
                      </h4>
                    </div>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                      {t(`patternLibrary.descriptions.${pattern.name}`, pattern.description)}
                    </p>

                    {/* ChartingPath data badge */}
                    {statsLoading ? (
                      <Skeleton className="h-16 w-full rounded-md" />
                    ) : (
                      <PatternDataBadge stat={stat} />
                    )}
                    
                    <div className="flex items-center justify-between pt-1">
                      <Badge className={`text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                        {t(`patternLibrary.difficulty.${pattern.difficulty}`)}
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {t('patternLibrary.learnMore')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom CTA */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-10 flex flex-col items-center text-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          Want to see these patterns on live charts right now?
        </h2>
        <Link to="/patterns/live">
          <Button size="lg" className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Open live scanner
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>

      {selectedPatternForDetails && (
        <PatternDetailModal
          isOpen={!!selectedPatternForDetails}
          onClose={() => setSelectedPatternForDetails(null)}
          patternKey={selectedPatternForDetails}
        />
      )}
      </div>
    </TooltipProvider>
  );

  function getPatternKey(patternName: string): string {
    const keyMap: Record<string, string> = {
      "Head and Shoulders": "head-shoulders",
      "Inverted Head and Shoulders": "inverted-head-shoulders",
      "Double Top": "double-top",
      "Double Bottom": "double-bottom",
      "Triple Top": "triple-top",
      "Triple Bottom": "triple-bottom",
      "Bump-and-Run Reversal": "bump-run-reversal",
      "Island Reversal": "island-reversal",
      "Ascending Triangle": "ascending-triangle",
      "Descending Triangle": "descending-triangle",
      "Symmetrical Triangle": "symmetrical-triangle",
      "Bull Flag": "bull-flag",
      "Bear Flag": "bear-flag",
      "Pennant": "pennant",
      "Cup with Handle": "cup-handle",
      "Hammer": "hammer",
      "Hanging Man": "hanging-man",
      "Shooting Star": "shooting-star",
      "Doji": "doji",
      "Bullish Harami": "bullish-harami",
      "Bearish Harami": "bearish-harami",
      "Bullish Engulfing": "bullish-engulfing",
      "Bearish Engulfing": "bearish-engulfing",
      "Spinning Top": "spinning-top"
    };
    return keyMap[patternName] || patternName.toLowerCase().replace(/\s+/g, '-');
  }
};
