import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, RotateCcw, Info } from "lucide-react";
import { useState, lazy, Suspense, memo } from "react";
import { Link } from "react-router-dom";
import { PatternDetailModal } from "@/components/PatternDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

// Lazy load the chart component for performance
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
  successRate: number;
  chartKey?: string; // Key for DynamicPatternChart
}

const PATTERN_LIBRARY: Pattern[] = [
  // Reversal Patterns
  {
    name: "Head and Shoulders",
    type: "reversal",
    description: "Most reliable bearish reversal pattern with three peaks",
    difficulty: "Intermediate",
    successRate: 89,
    chartKey: "head-shoulders"
  },
  {
    name: "Inverted Head and Shoulders",
    type: "reversal",
    description: "Bullish reversal pattern with three troughs - mirror of Head and Shoulders",
    difficulty: "Intermediate",
    successRate: 85,
    chartKey: "inverted-head-shoulders"
  },
  {
    name: "Double Top",
    type: "reversal", 
    description: "Bearish reversal with two peaks at same level",
    difficulty: "Beginner",
    successRate: 78,
    chartKey: "double-top"
  },
  {
    name: "Double Bottom",
    type: "reversal",
    description: "Bullish reversal with two troughs at same level", 
    difficulty: "Beginner",
    successRate: 79,
    chartKey: "double-bottom"
  },
  {
    name: "Triple Top",
    type: "reversal",
    description: "Strong bearish reversal with three equal peaks",
    difficulty: "Advanced",
    successRate: 83,
    chartKey: "triple-top"
  },
  {
    name: "Triple Bottom", 
    type: "reversal",
    description: "Strong bullish reversal with three equal troughs",
    difficulty: "Advanced",
    successRate: 81,
    chartKey: "triple-bottom"
  },
  {
    name: "Bump-and-Run Reversal",
    type: "reversal",
    description: "Three-phase reversal pattern with trend acceleration",
    difficulty: "Advanced",
    successRate: 64,
    chartKey: "bump-run-reversal"
  },
  {
    name: "Island Reversal",
    type: "reversal",
    description: "Gap-based reversal pattern isolated from main trend",
    difficulty: "Advanced",
    successRate: 59,
    chartKey: "island-reversal"
  },
  // Breakout Patterns
  {
    name: "Donchian Breakout (Long)",
    type: "continuation",
    description: "Bullish breakout above the 20-period high Donchian channel",
    difficulty: "Beginner",
    successRate: 55,
    chartKey: "donchian-breakout-long"
  },
  {
    name: "Donchian Breakout (Short)",
    type: "continuation",
    description: "Bearish breakdown below the 20-period low Donchian channel",
    difficulty: "Beginner",
    successRate: 55,
    chartKey: "donchian-breakout-short"
  },

  // Continuation Patterns
  {
    name: "Ascending Triangle",
    type: "continuation",
    description: "Bullish continuation with horizontal resistance",
    difficulty: "Beginner",
    successRate: 73,
    chartKey: "ascending-triangle"
  },
  {
    name: "Descending Triangle", 
    type: "continuation",
    description: "Bearish continuation with horizontal support",
    difficulty: "Beginner",
    successRate: 64,
    chartKey: "descending-triangle"
  },
  {
    name: "Symmetrical Triangle",
    type: "continuation", 
    description: "Neutral triangle with converging trend lines",
    difficulty: "Intermediate",
    successRate: 75,
    chartKey: "symmetrical-triangle"
  },
  {
    name: "Bull Flag",
    type: "continuation",
    description: "Brief consolidation in strong uptrend",
    difficulty: "Beginner",
    successRate: 86,
    chartKey: "bull-flag"
  },
  {
    name: "Bear Flag",
    type: "continuation",
    description: "Brief consolidation in strong downtrend", 
    difficulty: "Beginner",
    successRate: 82,
    chartKey: "bear-flag"
  },
  {
    name: "Pennant",
    type: "continuation",
    description: "Small symmetrical triangle after strong move",
    difficulty: "Intermediate",
    successRate: 76,
    chartKey: "symmetrical-triangle"
  },
  {
    name: "Cup with Handle",
    type: "continuation",
    description: "Bullish continuation resembling a cup",
    difficulty: "Intermediate",
    successRate: 65,
    chartKey: "cup-handle"
  },
  {
    name: "Rectangle",
    type: "continuation",
    description: "Consolidation between horizontal support and resistance",
    difficulty: "Beginner",
    successRate: 67,
    chartKey: "rectangle"
  },
  {
    name: "Rising Wedge",
    type: "reversal",
    description: "Bearish reversal with converging upward sloping trendlines",
    difficulty: "Intermediate",
    successRate: 68,
    chartKey: "rising-wedge"
  },
  {
    name: "Falling Wedge",
    type: "reversal", 
    description: "Bullish reversal with converging downward sloping trendlines",
    difficulty: "Intermediate",
    successRate: 72,
    chartKey: "falling-wedge"
  },

  // Candlestick Patterns
  {
    name: "Hammer",
    type: "candlestick",
    description: "Bullish reversal with long lower shadow",
    difficulty: "Beginner",
    successRate: 60,
    chartKey: "hammer"
  },
  {
    name: "Hanging Man",
    type: "candlestick", 
    description: "Bearish reversal with long lower shadow",
    difficulty: "Beginner",
    successRate: 59,
    chartKey: "hanging-man"
  },
  {
    name: "Shooting Star",
    type: "candlestick",
    description: "Bearish reversal with long upper shadow",
    difficulty: "Beginner",
    successRate: 62,
    chartKey: "shooting-star"
  },
  {
    name: "Doji",
    type: "candlestick",
    description: "Indecision candle with equal open/close",
    difficulty: "Beginner",
    successRate: 52,
    chartKey: "doji"
  },
  {
    name: "Bullish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bearish candle",
    difficulty: "Intermediate",
    successRate: 63,
    chartKey: "bullish-harami"
  },
  {
    name: "Bearish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bullish candle", 
    difficulty: "Intermediate",
    successRate: 61,
    chartKey: "bearish-harami"
  },
  {
    name: "Bullish Engulfing",
    type: "candlestick",
    description: "Large bullish candle engulfing previous bearish candle",
    difficulty: "Beginner",
    successRate: 63,
    chartKey: "bullish-engulfing"
  },
  {
    name: "Bearish Engulfing", 
    type: "candlestick",
    description: "Large bearish candle engulfing previous bullish candle",
    difficulty: "Beginner",
    successRate: 79,
    chartKey: "bearish-engulfing"
  },
  {
    name: "Spinning Top",
    type: "candlestick",
    description: "Small body with long shadows indicating indecision",
    difficulty: "Beginner",
    successRate: 45,
    chartKey: "spinning-top"
  }
];

export const PatternLibrary = () => {
  const { t } = useTranslation();
  const [selectedPatternForDetails, setSelectedPatternForDetails] = useState<string | null>(null);

  const getPatternIcon = (type: string) => {
    switch (type) {
      case "reversal":
        return <RotateCcw className="h-4 w-4" />;
      case "continuation":
        return <TrendingUp className="h-4 w-4" />;
      case "candlestick":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-bullish text-bullish-foreground";
      case "Intermediate": 
        return "bg-primary text-primary-foreground";
      case "Advanced":
        return "bg-bearish text-bearish-foreground";
      default:
        return "bg-muted text-muted-foreground";
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

        {/* Success Rate Disclaimer Link */}
        <div className="flex justify-center">
          <Link 
            to="/faq" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-4"
          >
            <Info className="h-4 w-4" />
            {t('patternLibrary.faqLink')}
          </Link>
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
            {patterns.map((pattern, index) => (
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
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                        {t(`patternLibrary.difficulty.${pattern.difficulty}`)}
                      </Badge>
                      {['Donchian Breakout (Long)', 'Double Bottom', 'Ascending Triangle', 'Bull Flag'].includes(pattern.name) && (
                        <Link to="/copilot" onClick={(e) => e.stopPropagation()}>
                          <Badge className="text-xs bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25 cursor-pointer">
                            In plan
                          </Badge>
                        </Link>
                      )}
                      <div className="flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-md">
                        <span className="text-xs font-semibold text-success">
                          {pattern.successRate}%
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-success cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              {t('patternLibrary.successRateTooltip')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
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
            ))}
          </div>
        </div>
      ))}

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

  // Helper function to convert pattern name to key
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