import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { PatternCalculator } from "@/utils/PatternCalculator";
import { PatternDetailsSection } from "@/components/PatternDetailsSection";

interface PatternConfig {
  name: string;
  type: "reversal" | "continuation" | "candlestick";
  description: string;
}

const PATTERNS: Record<string, PatternConfig> = {
  // Reversal Patterns
  "head-shoulders": {
    name: "Head and Shoulders",
    type: "reversal",
    description: "Classic bearish reversal with three peaks - left shoulder, head (highest), right shoulder. Volume decreases at right shoulder."
  },
  "inverted-head-shoulders": {
    name: "Inverted Head and Shoulders",
    type: "reversal",
    description: "Classic bullish reversal with three troughs - left shoulder, head (lowest), right shoulder. Neckline break confirms upward momentum."
  },
  "double-top": {
    name: "Double Top",
    type: "reversal",
    description: "Bearish reversal pattern with two equal peaks. Volume divergence at second peak confirms weakness."
  },
  "double-bottom": {
    name: "Double Bottom",
    type: "reversal",
    description: "Bullish reversal pattern with two equal troughs. Volume expansion on breakout confirms strength."
  },
  "triple-top": {
    name: "Triple Top",
    type: "reversal",
    description: "Strong bearish reversal with three equal peaks. More reliable than double top with higher volume requirements."
  },
  "triple-bottom": {
    name: "Triple Bottom",
    type: "reversal",
    description: "Strong bullish reversal with three equal troughs. More reliable than double bottom with volume confirmation needed."
  },
  "bump-run-reversal": {
    name: "Bump-and-Run Reversal",
    type: "reversal",
    description: "Three-phase reversal pattern with trend acceleration followed by sharp reversal and trend continuation."
  },
  "island-reversal": {
    name: "Island Reversal",
    type: "reversal",
    description: "Gap-based reversal pattern isolated from main trend by exhaustion and breakaway gaps."
  },

  // Continuation Patterns
  "ascending-triangle": {
    name: "Ascending Triangle",
    type: "continuation",
    description: "Bullish continuation with horizontal resistance and ascending support. Volume decreases during consolidation."
  },
  "descending-triangle": {
    name: "Descending Triangle",
    type: "continuation", 
    description: "Bearish continuation with horizontal support and descending resistance. Volume decreases during consolidation."
  },
  "symmetrical-triangle": {
    name: "Symmetrical Triangle",
    type: "continuation",
    description: "Neutral triangle with converging trend lines. Breakout direction determines trend continuation."
  },
  "bull-flag": {
    name: "Bull Flag",
    type: "continuation",
    description: "Brief consolidation in strong uptrend with parallel support and resistance lines sloping downward."
  },
  "bear-flag": {
    name: "Bear Flag",
    type: "continuation",
    description: "Brief consolidation in strong downtrend with parallel support and resistance lines sloping upward."
  },
  "pennant": {
    name: "Pennant",
    type: "continuation",
    description: "Small symmetrical triangle after strong move. Similar to flag but triangular shape with converging lines."
  },
  "cup-handle": {
    name: "Cup with Handle",
    type: "continuation",
    description: "Bullish continuation resembling a cup with rounded bottom followed by small downward handle."
  },
  "rectangle": {
    name: "Rectangle",
    type: "continuation",
    description: "Price consolidation between horizontal support and resistance levels forming a rectangular box pattern."
  },
  "rising-wedge": {
    name: "Rising Wedge",
    type: "reversal",
    description: "Bearish reversal pattern with converging upward sloping trendlines showing weakening momentum."
  },
  "falling-wedge": {
    name: "Falling Wedge", 
    type: "reversal",
    description: "Bullish reversal pattern with converging downward sloping trendlines indicating exhaustion of selling pressure."
  },

  // Candlestick Patterns
  "hammer": {
    name: "Hammer",
    type: "candlestick",
    description: "Bullish reversal candlestick with long lower shadow (2-3x body size) and small body at upper range."
  },
  "hanging-man": {
    name: "Hanging Man",
    type: "candlestick",
    description: "Bearish reversal candlestick with long lower shadow appearing at top of uptrend."
  },
  "shooting-star": {
    name: "Shooting Star",
    type: "candlestick", 
    description: "Bearish reversal candlestick with long upper shadow and small body at lower range."
  },
  "doji": {
    name: "Doji",
    type: "candlestick",
    description: "Indecision candlestick with equal or nearly equal open and close prices. Shows market uncertainty."
  },
  "bullish-harami": {
    name: "Bullish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bearish candle. Potential bullish reversal signal."
  },
  "bearish-harami": {
    name: "Bearish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bullish candle. Potential bearish reversal signal."
  },
  "bullish-engulfing": {
    name: "Bullish Engulfing",
    type: "candlestick",
    description: "Large bullish candle completely engulfing previous bearish candle. Strong reversal signal."
  },
  "bearish-engulfing": {
    name: "Bearish Engulfing",
    type: "candlestick",
    description: "Large bearish candle completely engulfing previous bullish candle. Strong reversal signal."
  },
  "spinning-top": {
    name: "Spinning Top",
    type: "candlestick",
    description: "Small body with long upper and lower shadows indicating indecision and potential reversal."
  }
};

export const ChartPatternGenerator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>("head-shoulders");
  
  const currentPattern = PATTERNS[selectedPattern];

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get accurate pattern data
    const patternData = PatternCalculator.getPatternData(selectedPattern);
    const { candles, annotations, keyLevels } = patternData;

    // Set canvas size
    canvas.width = 1000;
    canvas.height = 600;

    // Clear canvas with dark background
    ctx.fillStyle = "hsl(223, 39%, 4%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 80;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2 - 100; // Leave space for volume
    const chartLeft = padding;
    const chartTop = padding;

    // Draw grid
    ctx.strokeStyle = "hsl(215, 15%, 20%)";
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = chartLeft + (i * chartWidth) / 10;
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartTop + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = chartTop + (i * chartHeight) / 8;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }

    // Calculate price range
    const prices = candles.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding_price = priceRange * 0.1;
    const adjustedMinPrice = minPrice - padding_price;
    const adjustedMaxPrice = maxPrice + padding_price;
    const adjustedRange = adjustedMaxPrice - adjustedMinPrice;

    // Helper function to convert price to Y coordinate
    const priceToY = (price: number) => {
      return chartTop + chartHeight - ((price - adjustedMinPrice) / adjustedRange) * chartHeight;
    };

    // Helper function to convert index to X coordinate
    const indexToX = (index: number) => {
      return chartLeft + (index + 0.5) * (chartWidth / candles.length);
    };

    // Helper: draw rounded rectangle (pill)
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      const r = Math.min(radius, height / 2, width / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + r, r);
      ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
      ctx.arcTo(x, y + height, x, y + height - r, r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    // Draw candlesticks
    const candleWidth = Math.max(8, chartWidth / (candles.length * 1.5));
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      
      const yOpen = priceToY(candle.open);
      const yClose = priceToY(candle.close);
      const yHigh = priceToY(candle.high);
      const yLow = priceToY(candle.low);

      const isBullish = candle.close > candle.open;
      
      // Draw wick - Unified chart colors: #22c55e (green) and #ef4444 (red)
      ctx.strokeStyle = isBullish ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444";
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);
      
      if (bodyHeight < 3) {
        // Doji - draw a line
        ctx.strokeStyle = "hsl(210, 40%, 98%)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth/2 * 0.8, yOpen);
        ctx.lineTo(x + candleWidth/2 * 0.8, yOpen);
        ctx.stroke();
      } else {
        ctx.fillRect(x - candleWidth/2 * 0.8, bodyTop, candleWidth * 0.8, bodyHeight);
      }
    });

    // Draw pattern annotations (trend lines, support/resistance, peaks)
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(annotation.style === 'dashed' ? [5, 5] : []);
      
      if (annotation.type === 'peak') {
        // Draw peak markers with circles and labels
        const point = annotation.points[0];
        const x = indexToX(point.x);
        const y = priceToY(point.y);
        
        // Draw circle marker
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw label with background
        if (annotation.label) {
          ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = "center";
          const textMetrics = ctx.measureText(annotation.label);
          const textWidth = textMetrics.width;
          const textHeight = 14;
          
          // Background rectangle
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(x - textWidth/2 - 4, y - 25 - textHeight/2, textWidth + 8, textHeight + 4);
          
          // Text
          ctx.fillStyle = annotation.color;
          ctx.fillText(annotation.label, x, y - 20);
        }
      } else if (annotation.points.length >= 2) {
        // Draw lines for other annotation types
        ctx.beginPath();
        const firstPoint = annotation.points[0];
        ctx.moveTo(indexToX(firstPoint.x), priceToY(firstPoint.y));
        
        for (let i = 1; i < annotation.points.length; i++) {
          const point = annotation.points[i];
          ctx.lineTo(indexToX(point.x), priceToY(point.y));
        }
        ctx.stroke();
        
        // Add label
        if (annotation.label) {
          ctx.fillStyle = annotation.color;
          ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = "left";
          const lastPoint = annotation.points[annotation.points.length - 1];
          ctx.fillText(annotation.label, indexToX(lastPoint.x) + 10, priceToY(lastPoint.y) - 5);
        }
      }
      
      ctx.setLineDash([]); // Reset line dash
    });

    // Draw volume histogram
    const volumeTop = chartTop + chartHeight + 20;
    const volumeHeight = 80;
    const maxVolume = Math.max(...candles.map(c => c.volume));
    
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      const isBullish = candle.close > candle.open;
      
      // Unified volume colors: rgba(34, 197, 94, 0.6) and rgba(239, 68, 68, 0.6)
      ctx.fillStyle = isBullish ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
      ctx.fillRect(x - candleWidth/2 * 0.6, volumeTop + volumeHeight - volumeBarHeight, 
                   candleWidth * 0.6, volumeBarHeight);
    });

    // Draw axes labels
    ctx.fillStyle = "hsl(217, 10%, 65%)";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    
    // Price labels
    for (let i = 0; i <= 8; i++) {
      const price = adjustedMinPrice + (i / 8) * adjustedRange;
      const y = chartTop + chartHeight - (i * chartHeight) / 8;
      ctx.fillText(price.toFixed(2), chartLeft - 10, y + 4);
    }

    // Volume label
    ctx.textAlign = "left";
    ctx.fillText("Volume", chartLeft, volumeTop - 5);

    // Key levels display
    if (keyLevels.entry || keyLevels.target || keyLevels.stopLoss) {
      ctx.fillStyle = "hsl(210, 40%, 98%)";
      ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      let labelY = chartTop + 20;
      
      if (keyLevels.entry) {
        ctx.fillText(`Entry: ${keyLevels.entry.toFixed(2)}`, chartLeft + chartWidth - 150, labelY);
        labelY += 15;
      }
      if (keyLevels.target) {
        ctx.fillStyle = "#22c55e"; // Unified green
        ctx.fillText(`Target: ${keyLevels.target.toFixed(2)}`, chartLeft + chartWidth - 150, labelY);
        labelY += 15;
      }
      if (keyLevels.stopLoss) {
        ctx.fillStyle = "#ef4444"; // Unified red
        ctx.fillText(`Stop Loss: ${keyLevels.stopLoss.toFixed(2)}`, chartLeft + chartWidth - 150, labelY);
      }
    }

    // Title and Pattern Type Badge
    ctx.fillStyle = "hsl(210, 40%, 98%)";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    
    // Measure title text for badge positioning
    const titleMetrics = ctx.measureText(currentPattern.name);
    ctx.fillText(currentPattern.name, chartLeft, chartTop - 30);

    // Pattern type badge
    const badgeText = currentPattern.type.toUpperCase();
    const badgeColor = currentPattern.type === "reversal" ? "#dc2626" : 
                      currentPattern.type === "continuation" ? "#3b82f6" : "#6b7280";
    
    // Measure badge text for proper sizing
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
    const badgeTextMetrics = ctx.measureText(badgeText);
    const badgeWidth = badgeTextMetrics.width + 16; // 8px padding on each side
    const badgeHeight = 22;
    const badgeX = chartLeft + titleMetrics.width + 15;
    const badgeY = chartTop - 42;
    
    // Draw badge background with rounded corners effect
    ctx.fillStyle = badgeColor;
    drawRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();
    // Draw badge text perfectly centered (nudged up 1px for optical centering)
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, badgeX + badgeWidth/2, badgeY + badgeHeight/2 - 2);
    
    // Reset text properties
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Subtitle
    ctx.fillStyle = "hsl(217, 10%, 65%)";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Professional Trading Education", chartLeft, chartTop - 10);

    // Watermark - ChartingPath.com branding
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("ChartingPath.com", chartLeft + 10, canvas.height - 15);
  };

  useEffect(() => {
    drawChart();
  }, [selectedPattern]);

  const downloadChart = async () => {
    if (!containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: "hsl(223, 39%, 4%)",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `${currentPattern.name.toLowerCase().replace(/\s+/g, '-')}-pattern.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success(`${currentPattern.name} pattern downloaded successfully!`);
    } catch (error) {
      toast.error("Failed to download chart pattern");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Chart Pattern Generator</h2>
          <p className="text-muted-foreground">Generate professional trading chart patterns for educational purposes</p>
        </div>
        
        <div className="flex gap-3">
          <div className="space-y-3 p-4 bg-card/50 border border-border/50 rounded-lg backdrop-blur-sm">
            <label className="text-lg font-semibold text-foreground flex items-center gap-2">
              📊 Select a chart pattern
            </label>
            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger className="w-[320px] h-12 text-base border-2 border-primary/20 hover:border-primary/40 focus:border-primary bg-background/90 backdrop-blur-sm">
                <SelectValue placeholder="Choose your pattern..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PATTERNS).map(([key, pattern]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={pattern.type === "reversal" ? "destructive" : pattern.type === "continuation" ? "default" : "secondary"}
                        className="text-sm leading-none h-5 px-2 py-0 rounded-full uppercase inline-flex items-center justify-center"
                      >
                        {pattern.type}
                      </Badge>
                      {pattern.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={downloadChart} className="hidden bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90">
            Download PNG
          </Button>
        </div>
      </div>

      <Card className="p-6" ref={containerRef}>
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-foreground">{currentPattern.name}</h3>
            <Badge 
              variant={currentPattern.type === "reversal" ? "destructive" : currentPattern.type === "continuation" ? "default" : "secondary"}
              className="h-6 px-3 py-0 rounded-full uppercase text-sm leading-[1] inline-flex items-center justify-center"
              style={{ paddingTop: '2px', paddingBottom: '4px' }}
            >
              {currentPattern.type}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{currentPattern.description}</p>
        </div>
        
        <div className="rounded-lg overflow-hidden bg-chart-background p-4">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-w-full"
            style={{ display: "block" }}
          />
        </div>
      </Card>

      {/* Pattern Details Section */}
      <PatternDetailsSection patternKey={selectedPattern} />
    </div>
  );
};