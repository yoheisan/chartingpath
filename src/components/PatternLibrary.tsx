import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { useState } from "react";
import { PatternDetailModal } from "@/components/PatternDetailModal";

interface Pattern {
  name: string;
  type: "reversal" | "continuation" | "candlestick";
  description: string;
  accuracy: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const PATTERN_LIBRARY: Pattern[] = [
  // Reversal Patterns
  {
    name: "Head and Shoulders",
    type: "reversal",
    description: "Most reliable bearish reversal pattern with three peaks",
    accuracy: "85%",
    difficulty: "Intermediate"
  },
  {
    name: "Inverted Head and Shoulders",
    type: "reversal",
    description: "Bullish reversal pattern with three troughs - mirror of Head and Shoulders",
    accuracy: "85%",
    difficulty: "Intermediate"
  },
  {
    name: "Double Top",
    type: "reversal", 
    description: "Bearish reversal with two peaks at same level",
    accuracy: "78%",
    difficulty: "Beginner"
  },
  {
    name: "Double Bottom",
    type: "reversal",
    description: "Bullish reversal with two troughs at same level", 
    accuracy: "78%",
    difficulty: "Beginner"
  },
  {
    name: "Triple Top",
    type: "reversal",
    description: "Strong bearish reversal with three equal peaks",
    accuracy: "80%",
    difficulty: "Advanced"
  },
  {
    name: "Triple Bottom", 
    type: "reversal",
    description: "Strong bullish reversal with three equal troughs",
    accuracy: "80%",
    difficulty: "Advanced"
  },
  {
    name: "Bump-and-Run Reversal",
    type: "reversal",
    description: "Three-phase reversal pattern with trend acceleration",
    accuracy: "72%", 
    difficulty: "Advanced"
  },
  {
    name: "Island Reversal",
    type: "reversal",
    description: "Gap-based reversal pattern isolated from main trend",
    accuracy: "75%",
    difficulty: "Advanced"
  },
  
  // Continuation Patterns
  {
    name: "Ascending Triangle",
    type: "continuation",
    description: "Bullish continuation with horizontal resistance",
    accuracy: "83%",
    difficulty: "Beginner"
  },
  {
    name: "Descending Triangle", 
    type: "continuation",
    description: "Bearish continuation with horizontal support",
    accuracy: "83%",
    difficulty: "Beginner"
  },
  {
    name: "Symmetrical Triangle",
    type: "continuation", 
    description: "Neutral triangle with converging trend lines",
    accuracy: "76%",
    difficulty: "Intermediate"
  },
  {
    name: "Bull Flag",
    type: "continuation",
    description: "Brief consolidation in strong uptrend",
    accuracy: "81%",
    difficulty: "Beginner"
  },
  {
    name: "Bear Flag",
    type: "continuation",
    description: "Brief consolidation in strong downtrend", 
    accuracy: "81%",
    difficulty: "Beginner"
  },
  {
    name: "Pennant",
    type: "continuation",
    description: "Small symmetrical triangle after strong move",
    accuracy: "78%",
    difficulty: "Intermediate"
  },
  {
    name: "Cup with Handle",
    type: "continuation",
    description: "Bullish continuation resembling a cup",
    accuracy: "79%",
    difficulty: "Intermediate"
  },
  {
    name: "Rectangle",
    type: "continuation",
    description: "Consolidation between horizontal support and resistance",
    accuracy: "86%",
    difficulty: "Beginner"
  },
  {
    name: "Rising Wedge",
    type: "reversal",
    description: "Bearish reversal with converging upward sloping trendlines",
    accuracy: "88%",
    difficulty: "Intermediate"
  },
  {
    name: "Falling Wedge",
    type: "reversal", 
    description: "Bullish reversal with converging downward sloping trendlines",
    accuracy: "88%",
    difficulty: "Intermediate"
  },

  // Candlestick Patterns
  {
    name: "Hammer",
    type: "candlestick",
    description: "Bullish reversal with long lower shadow",
    accuracy: "70%",
    difficulty: "Beginner"
  },
  {
    name: "Hanging Man",
    type: "candlestick", 
    description: "Bearish reversal with long lower shadow",
    accuracy: "68%",
    difficulty: "Beginner"
  },
  {
    name: "Shooting Star",
    type: "candlestick",
    description: "Bearish reversal with long upper shadow",
    accuracy: "72%",
    difficulty: "Beginner"
  },
  {
    name: "Doji",
    type: "candlestick",
    description: "Indecision candle with equal open/close",
    accuracy: "65%",
    difficulty: "Beginner"
  },
  {
    name: "Bullish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bearish candle",
    accuracy: "69%",
    difficulty: "Intermediate"
  },
  {
    name: "Bearish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bullish candle", 
    accuracy: "69%",
    difficulty: "Intermediate"
  },
  {
    name: "Bullish Engulfing",
    type: "candlestick",
    description: "Large bullish candle engulfing previous bearish candle",
    accuracy: "73%",
    difficulty: "Beginner"
  },
  {
    name: "Bearish Engulfing", 
    type: "candlestick",
    description: "Large bearish candle engulfing previous bullish candle",
    accuracy: "73%",
    difficulty: "Beginner"
  },
  {
    name: "Spinning Top",
    type: "candlestick",
    description: "Small body with long shadows indicating indecision",
    accuracy: "62%",
    difficulty: "Beginner"
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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Pattern Library</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Comprehensive collection of chart patterns based on Thomas Bulkowski's Encyclopedia of Chart Patterns.
          Each pattern includes accuracy statistics and difficulty ratings.
        </p>
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
                      <div className="text-center">
                        <div className="text-sm font-medium text-foreground">{pattern.accuracy}</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <Badge className={`text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                          {pattern.difficulty}
                        </Badge>
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