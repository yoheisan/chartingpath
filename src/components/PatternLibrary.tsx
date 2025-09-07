import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, RotateCcw, Info } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PatternDetailModal } from "@/components/PatternDetailModal";

interface Pattern {
  name: string;
  type: "reversal" | "continuation" | "candlestick";
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  successRate: number;
}

const PATTERN_LIBRARY: Pattern[] = [
  // Reversal Patterns
  {
    name: "Head and Shoulders",
    type: "reversal",
    description: "Most reliable bearish reversal pattern with three peaks",
    difficulty: "Intermediate",
    successRate: 89
  },
  {
    name: "Inverted Head and Shoulders",
    type: "reversal",
    description: "Bullish reversal pattern with three troughs - mirror of Head and Shoulders",
    difficulty: "Intermediate",
    successRate: 85
  },
  {
    name: "Double Top",
    type: "reversal", 
    description: "Bearish reversal with two peaks at same level",
    difficulty: "Beginner",
    successRate: 78
  },
  {
    name: "Double Bottom",
    type: "reversal",
    description: "Bullish reversal with two troughs at same level", 
    difficulty: "Beginner",
    successRate: 79
  },
  {
    name: "Triple Top",
    type: "reversal",
    description: "Strong bearish reversal with three equal peaks",
    difficulty: "Advanced",
    successRate: 83
  },
  {
    name: "Triple Bottom", 
    type: "reversal",
    description: "Strong bullish reversal with three equal troughs",
    difficulty: "Advanced",
    successRate: 81
  },
  {
    name: "Bump-and-Run Reversal",
    type: "reversal",
    description: "Three-phase reversal pattern with trend acceleration",
    difficulty: "Advanced",
    successRate: 64
  },
  {
    name: "Island Reversal",
    type: "reversal",
    description: "Gap-based reversal pattern isolated from main trend",
    difficulty: "Advanced",
    successRate: 59
  },
  
  // Continuation Patterns
  {
    name: "Ascending Triangle",
    type: "continuation",
    description: "Bullish continuation with horizontal resistance",
    difficulty: "Beginner",
    successRate: 73
  },
  {
    name: "Descending Triangle", 
    type: "continuation",
    description: "Bearish continuation with horizontal support",
    difficulty: "Beginner",
    successRate: 64
  },
  {
    name: "Symmetrical Triangle",
    type: "continuation", 
    description: "Neutral triangle with converging trend lines",
    difficulty: "Intermediate",
    successRate: 75
  },
  {
    name: "Bull Flag",
    type: "continuation",
    description: "Brief consolidation in strong uptrend",
    difficulty: "Beginner",
    successRate: 86
  },
  {
    name: "Bear Flag",
    type: "continuation",
    description: "Brief consolidation in strong downtrend", 
    difficulty: "Beginner",
    successRate: 82
  },
  {
    name: "Pennant",
    type: "continuation",
    description: "Small symmetrical triangle after strong move",
    difficulty: "Intermediate",
    successRate: 76
  },
  {
    name: "Cup with Handle",
    type: "continuation",
    description: "Bullish continuation resembling a cup",
    difficulty: "Intermediate",
    successRate: 65
  },
  {
    name: "Rectangle",
    type: "continuation",
    description: "Consolidation between horizontal support and resistance",
    difficulty: "Beginner",
    successRate: 67
  },
  {
    name: "Rising Wedge",
    type: "reversal",
    description: "Bearish reversal with converging upward sloping trendlines",
    difficulty: "Intermediate",
    successRate: 68
  },
  {
    name: "Falling Wedge",
    type: "reversal", 
    description: "Bullish reversal with converging downward sloping trendlines",
    difficulty: "Intermediate",
    successRate: 72
  },

  // Candlestick Patterns
  {
    name: "Hammer",
    type: "candlestick",
    description: "Bullish reversal with long lower shadow",
    difficulty: "Beginner",
    successRate: 60
  },
  {
    name: "Hanging Man",
    type: "candlestick", 
    description: "Bearish reversal with long lower shadow",
    difficulty: "Beginner",
    successRate: 59
  },
  {
    name: "Shooting Star",
    type: "candlestick",
    description: "Bearish reversal with long upper shadow",
    difficulty: "Beginner",
    successRate: 62
  },
  {
    name: "Doji",
    type: "candlestick",
    description: "Indecision candle with equal open/close",
    difficulty: "Beginner",
    successRate: 52
  },
  {
    name: "Bullish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bearish candle",
    difficulty: "Intermediate",
    successRate: 63
  },
  {
    name: "Bearish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bullish candle", 
    difficulty: "Intermediate",
    successRate: 61
  },
  {
    name: "Bullish Engulfing",
    type: "candlestick",
    description: "Large bullish candle engulfing previous bearish candle",
    difficulty: "Beginner",
    successRate: 63
  },
  {
    name: "Bearish Engulfing", 
    type: "candlestick",
    description: "Large bearish candle engulfing previous bullish candle",
    difficulty: "Beginner",
    successRate: 79
  },
  {
    name: "Spinning Top",
    type: "candlestick",
    description: "Small body with long shadows indicating indecision",
    difficulty: "Beginner",
    successRate: 45
  }
];

export const PatternLibrary = () => {
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
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Pattern Library</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive collection of chart patterns based on Thomas Bulkowski's Encyclopedia of Chart Patterns.
            Each pattern includes detailed descriptions and difficulty ratings.
          </p>
        </div>

        {/* Success Rate Disclaimer Link */}
        <div className="flex justify-center">
          <Link 
            to="/faq" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-4"
          >
            <Info className="h-4 w-4" />
            Questions about pattern success rates? See our FAQ
          </Link>
        </div>

      {Object.entries(groupedPatterns).map(([type, patterns]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center gap-3">
            {getPatternIcon(type)}
            <h3 className="text-2xl font-semibold capitalize text-foreground">
              {type === "candlestick" ? "Candlestick" : type} Patterns
            </h3>
            <Badge variant="outline" className="text-sm">
              {patterns.length} patterns  
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map((pattern, index) => (
              <Card key={index} className="p-6 hover:bg-card/80 transition-colors border-border/50">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 
                      className="font-semibold text-foreground text-lg cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setSelectedPatternForDetails(getPatternKey(pattern.name))}
                    >
                      {pattern.name}
                    </h4>
                    <div className="flex gap-2">
                      <Badge 
                        variant={pattern.type === "reversal" ? "destructive" : pattern.type === "continuation" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {pattern.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {pattern.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                      <Badge className={`text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                        {pattern.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 bg-success/10 px-2 py-1 rounded-md">
                        <span className="text-sm font-semibold text-success">
                          {pattern.successRate}% Success Rate
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-success cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              The "success rate" in the pattern library is based on historical statistical analysis and backtesting data from Thomas Bulkowski's Encyclopedia of Chart Patterns. These percentages represent the historical likelihood of a pattern achieving its measured move target when correctly identified and traded.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setSelectedPatternForDetails(getPatternKey(pattern.name))}
                    >
                      Learn More
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