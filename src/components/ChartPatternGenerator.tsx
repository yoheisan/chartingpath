import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PatternConfig {
  name: string;
  type: "reversal" | "continuation" | "candlestick";
  description: string;
  data: CandlestickData[];
}

const PATTERNS: Record<string, PatternConfig> = {
  "head-shoulders": {
    name: "Head and Shoulders",
    type: "reversal",
    description: "A bearish reversal pattern with three peaks, the middle being the highest",
    data: [
      { open: 100, high: 105, low: 98, close: 102, volume: 1000 },
      { open: 102, high: 108, low: 100, close: 106, volume: 1200 },
      { open: 106, high: 112, low: 104, close: 110, volume: 1400 }, // Left shoulder
      { open: 110, high: 115, low: 108, close: 113, volume: 1100 },
      { open: 113, high: 122, low: 111, close: 118, volume: 1800 }, // Head
      { open: 118, high: 120, low: 115, close: 116, volume: 1300 },
      { open: 116, high: 118, low: 112, close: 114, volume: 1500 },
      { open: 114, high: 117, low: 110, close: 112, volume: 1200 }, // Right shoulder
      { open: 112, high: 114, low: 108, close: 109, volume: 1600 },
      { open: 109, high: 111, low: 105, close: 107, volume: 1700 }, // Breakdown
    ]
  },
  "double-top": {
    name: "Double Top",
    type: "reversal",
    description: "A bearish reversal pattern with two peaks at approximately the same level",
    data: [
      { open: 100, high: 105, low: 98, close: 103, volume: 1000 },
      { open: 103, high: 110, low: 101, close: 108, volume: 1400 },
      { open: 108, high: 115, low: 106, close: 112, volume: 1600 }, // First peak
      { open: 112, high: 114, low: 108, close: 110, volume: 1200 },
      { open: 110, high: 112, low: 105, close: 107, volume: 1300 }, // Valley
      { open: 107, high: 111, low: 105, close: 109, volume: 1100 },
      { open: 109, high: 115, low: 107, close: 113, volume: 1500 }, // Second peak
      { open: 113, high: 114, low: 109, close: 111, volume: 1300 },
      { open: 111, high: 113, low: 106, close: 108, volume: 1700 }, // Breakdown
      { open: 108, high: 110, low: 104, close: 105, volume: 1800 },
    ]
  },
  "ascending-triangle": {
    name: "Ascending Triangle",
    type: "continuation",
    description: "A bullish continuation pattern with horizontal resistance and rising support",
    data: [
      { open: 95, high: 100, low: 93, close: 98, volume: 1000 },
      { open: 98, high: 105, low: 96, close: 103, volume: 1200 },
      { open: 103, high: 105, low: 101, close: 104, volume: 1100 }, // First resistance test
      { open: 104, high: 106, low: 102, close: 103, volume: 900 },
      { open: 103, high: 105, low: 103, close: 104, volume: 1000 }, // Second test
      { open: 104, high: 105, low: 103, close: 104, volume: 800 },
      { open: 104, high: 105, low: 104, close: 105, volume: 1100 }, // Third test
      { open: 105, high: 108, low: 104, close: 107, volume: 1500 }, // Breakout
      { open: 107, high: 110, low: 106, close: 109, volume: 2000 },
      { open: 109, high: 112, low: 108, close: 111, volume: 1800 },
    ]
  },
  "hammer": {
    name: "Hammer",
    type: "candlestick",
    description: "A bullish reversal candlestick with a long lower shadow and small body",
    data: [
      { open: 110, high: 112, low: 108, close: 109, volume: 1000 },
      { open: 109, high: 110, low: 106, close: 107, volume: 1200 },
      { open: 107, high: 108, low: 104, close: 105, volume: 1400 },
      { open: 105, high: 106, low: 102, close: 103, volume: 1600 },
      { open: 103, high: 104, low: 96, close: 102, volume: 2000 }, // Hammer
      { open: 102, high: 106, low: 101, close: 105, volume: 1500 },
      { open: 105, high: 108, low: 104, close: 107, volume: 1300 },
      { open: 107, high: 110, low: 106, close: 109, volume: 1200 },
    ]
  },
  "doji": {
    name: "Doji",
    type: "candlestick",
    description: "A reversal signal where open and close prices are nearly equal",
    data: [
      { open: 105, high: 108, low: 103, close: 107, volume: 1000 },
      { open: 107, high: 109, low: 105, close: 108, volume: 1100 },
      { open: 108, high: 110, low: 106, close: 109, volume: 1200 },
      { open: 109, high: 111, low: 107, close: 110, volume: 1300 },
      { open: 110, high: 112, low: 108, close: 110, volume: 1500 }, // Doji
      { open: 110, high: 111, low: 107, close: 108, volume: 1400 },
      { open: 108, high: 110, low: 105, close: 106, volume: 1600 },
      { open: 106, high: 108, low: 103, close: 104, volume: 1700 },
    ]
  },
  "cup-handle": {
    name: "Cup with Handle",
    type: "continuation",
    description: "A bullish continuation pattern resembling a cup with a handle",
    data: [
      { open: 120, high: 122, low: 118, close: 121, volume: 1000 },
      { open: 121, high: 123, low: 115, close: 117, volume: 1200 }, // Start of cup
      { open: 117, high: 119, low: 110, close: 112, volume: 1400 },
      { open: 112, high: 115, low: 108, close: 110, volume: 1600 }, // Bottom of cup
      { open: 110, high: 114, low: 109, close: 113, volume: 1300 },
      { open: 113, high: 118, low: 112, close: 116, volume: 1200 },
      { open: 116, high: 121, low: 115, close: 120, volume: 1100 }, // Cup formation complete
      { open: 120, high: 121, low: 117, close: 118, volume: 900 }, // Handle start
      { open: 118, high: 119, low: 116, close: 117, volume: 800 }, // Handle
      { open: 117, high: 124, low: 116, close: 123, volume: 1800 }, // Breakout
    ]
  },
  "double-bottom": {
    name: "Double Bottom",
    type: "reversal",
    description: "A bullish reversal pattern with two troughs at approximately the same level",
    data: [
      { open: 120, high: 122, low: 118, close: 119, volume: 1000 },
      { open: 119, high: 120, low: 114, close: 115, volume: 1400 },
      { open: 115, high: 117, low: 110, close: 112, volume: 1600 }, // First bottom
      { open: 112, high: 116, low: 111, close: 115, volume: 1200 },
      { open: 115, high: 119, low: 114, close: 118, volume: 1100 }, // Peak
      { open: 118, high: 119, low: 115, close: 116, volume: 1300 },
      { open: 116, high: 117, low: 110, close: 111, volume: 1500 }, // Second bottom
      { open: 111, high: 114, low: 110, close: 113, volume: 1300 },
      { open: 113, high: 118, low: 112, close: 117, volume: 1700 }, // Breakout
      { open: 117, high: 122, low: 116, close: 121, volume: 1800 },
    ]
  },
  "triple-top": {
    name: "Triple Top",
    type: "reversal", 
    description: "A bearish reversal pattern with three peaks at approximately the same level",
    data: [
      { open: 100, high: 105, low: 98, close: 103, volume: 1000 },
      { open: 103, high: 115, low: 101, close: 113, volume: 1400 }, // First peak
      { open: 113, high: 115, low: 108, close: 110, volume: 1200 },
      { open: 110, high: 112, low: 106, close: 108, volume: 1300 }, // First valley
      { open: 108, high: 115, low: 107, close: 114, volume: 1500 }, // Second peak
      { open: 114, high: 115, low: 109, close: 111, volume: 1300 },
      { open: 111, high: 113, low: 107, close: 109, volume: 1200 }, // Second valley
      { open: 109, high: 115, low: 108, close: 114, volume: 1400 }, // Third peak
      { open: 114, high: 115, low: 111, close: 112, volume: 1300 },
      { open: 112, high: 114, low: 106, close: 107, volume: 1700 }, // Breakdown
    ]
  },
  "bull-flag": {
    name: "Bull Flag",
    type: "continuation",
    description: "A brief consolidation in a strong uptrend before continuation",
    data: [
      { open: 95, high: 98, low: 94, close: 97, volume: 1000 },
      { open: 97, high: 102, low: 96, close: 101, volume: 1500 }, // Flag pole start
      { open: 101, high: 107, low: 100, close: 106, volume: 2000 },
      { open: 106, high: 112, low: 105, close: 111, volume: 2500 }, // Flag pole end
      { open: 111, high: 112, low: 108, close: 109, volume: 800 }, // Flag consolidation
      { open: 109, high: 110, low: 107, close: 108, volume: 700 },
      { open: 108, high: 109, low: 106, close: 107, volume: 600 },
      { open: 107, high: 108, low: 105, close: 106, volume: 650 }, // End of flag
      { open: 106, high: 112, low: 105, close: 111, volume: 1800 }, // Breakout
      { open: 111, high: 116, low: 110, close: 115, volume: 2000 },
    ]
  },
  "shooting-star": {
    name: "Shooting Star", 
    type: "candlestick",
    description: "A bearish reversal candlestick with a long upper shadow and small body",
    data: [
      { open: 102, high: 105, low: 101, close: 104, volume: 1000 },
      { open: 104, high: 107, low: 103, close: 106, volume: 1200 },
      { open: 106, high: 109, low: 105, close: 108, volume: 1400 },
      { open: 108, high: 111, low: 107, close: 110, volume: 1600 },
      { open: 110, high: 118, low: 109, close: 111, volume: 2000 }, // Shooting star
      { open: 111, high: 112, low: 107, close: 108, volume: 1500 },
      { open: 108, high: 109, low: 105, close: 106, volume: 1300 },
      { open: 106, high: 107, low: 103, close: 104, volume: 1200 },
    ]
  },
  "engulfing-bullish": {
    name: "Bullish Engulfing",
    type: "candlestick",
    description: "A bullish reversal where a large bullish candle engulfs the previous bearish candle",
    data: [
      { open: 108, high: 110, low: 106, close: 107, volume: 1000 },
      { open: 107, high: 108, low: 104, close: 105, volume: 1200 },
      { open: 105, high: 106, low: 102, close: 103, volume: 1400 },
      { open: 103, high: 104, low: 101, close: 102, volume: 1300 }, // Bearish candle
      { open: 101, high: 106, low: 100, close: 105, volume: 1800 }, // Bullish engulfing
      { open: 105, high: 108, low: 104, close: 107, volume: 1500 },
      { open: 107, high: 110, low: 106, close: 109, volume: 1300 },
      { open: 109, high: 112, low: 108, close: 111, volume: 1200 },
    ]
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

    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;

    // Clear canvas with dark background
    ctx.fillStyle = "hsl(223, 39%, 4%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
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
    const prices = currentPattern.data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding_price = priceRange * 0.1;

    // Draw candlesticks
    const candleWidth = chartWidth / (currentPattern.data.length * 1.5);
    
    currentPattern.data.forEach((candle, index) => {
      const x = chartLeft + (index + 0.5) * (chartWidth / currentPattern.data.length);
      
      // Normalize prices to canvas coordinates
      const yOpen = chartTop + chartHeight - ((candle.open - minPrice + padding_price) / (priceRange + 2 * padding_price)) * chartHeight;
      const yClose = chartTop + chartHeight - ((candle.close - minPrice + padding_price) / (priceRange + 2 * padding_price)) * chartHeight;
      const yHigh = chartTop + chartHeight - ((candle.high - minPrice + padding_price) / (priceRange + 2 * padding_price)) * chartHeight;
      const yLow = chartTop + chartHeight - ((candle.low - minPrice + padding_price) / (priceRange + 2 * padding_price)) * chartHeight;

      const isBullish = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isBullish ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = isBullish ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);
      
      if (bodyHeight < 2) {
        // Doji - draw a line
        ctx.strokeStyle = "hsl(210, 40%, 98%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth/2 * 0.8, yOpen);
        ctx.lineTo(x + candleWidth/2 * 0.8, yOpen);
        ctx.stroke();
      } else {
        ctx.fillRect(x - candleWidth/2 * 0.8, bodyTop, candleWidth * 0.8, bodyHeight);
      }
    });

    // Draw axes labels
    ctx.fillStyle = "hsl(217, 10%, 65%)";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    
    // Price labels
    for (let i = 0; i <= 8; i++) {
      const price = minPrice + (i / 8) * priceRange;
      const y = chartTop + chartHeight - (i * chartHeight) / 8;
      ctx.fillText(price.toFixed(2), chartLeft - 10, y + 4);
    }

    // Title
    ctx.fillStyle = "hsl(210, 40%, 98%)";
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(currentPattern.name, chartLeft, chartTop - 20);
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
          <Select value={selectedPattern} onValueChange={setSelectedPattern}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a pattern" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PATTERNS).map(([key, pattern]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={pattern.type === "reversal" ? "destructive" : pattern.type === "continuation" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {pattern.type}
                    </Badge>
                    {pattern.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={downloadChart} className="bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90">
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
    </div>
  );
};