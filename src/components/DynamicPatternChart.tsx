import { useEffect, useRef } from "react";
import { PatternCalculator } from "@/utils/PatternCalculator";

interface DynamicPatternChartProps {
  patternType: string;
  className?: string;
  width?: number;
  height?: number;
  showTitle?: boolean;
}

const PATTERN_TYPES: Record<string, { name: string; type: "reversal" | "continuation" | "candlestick" }> = {
  // Reversal Patterns
  "head-shoulders": { name: "Head and Shoulders", type: "reversal" },
  "head-and-shoulders": { name: "Head and Shoulders", type: "reversal" },
  "inverted-head-shoulders": { name: "Inverted Head and Shoulders", type: "reversal" },
  "inverse-head-shoulders": { name: "Inverted Head and Shoulders", type: "reversal" },
  "double-top": { name: "Double Top", type: "reversal" },
  "double-bottom": { name: "Double Bottom", type: "reversal" },
  "triple-top": { name: "Triple Top", type: "reversal" },
  "triple-bottom": { name: "Triple Bottom", type: "reversal" },
  "bump-run-reversal": { name: "Bump-and-Run Reversal", type: "reversal" },
  "island-reversal": { name: "Island Reversal", type: "reversal" },
  "rising-wedge": { name: "Rising Wedge", type: "reversal" },
  "falling-wedge": { name: "Falling Wedge", type: "reversal" },
  
  // Continuation Patterns
  "ascending-triangle": { name: "Ascending Triangle", type: "continuation" },
  "descending-triangle": { name: "Descending Triangle", type: "continuation" },
  "symmetrical-triangle": { name: "Symmetrical Triangle", type: "continuation" },
  "bull-flag": { name: "Bull Flag", type: "continuation" },
  "bear-flag": { name: "Bear Flag", type: "continuation" },
  "pennant": { name: "Pennant", type: "continuation" },
  "cup-handle": { name: "Cup with Handle", type: "continuation" },
  "cup-and-handle": { name: "Cup with Handle", type: "continuation" },
  "rectangle": { name: "Rectangle", type: "continuation" },
  
  // Candlestick Patterns
  "hammer": { name: "Hammer", type: "candlestick" },
  "hanging-man": { name: "Hanging Man", type: "candlestick" },
  "shooting-star": { name: "Shooting Star", type: "candlestick" },
  "doji": { name: "Doji", type: "candlestick" },
  "standard-doji": { name: "Standard Doji", type: "candlestick" },
  "dragonfly-doji": { name: "Dragonfly Doji", type: "candlestick" },
  "gravestone-doji": { name: "Gravestone Doji", type: "candlestick" },
  "long-legged-doji": { name: "Long-Legged Doji", type: "candlestick" },
  "four-price-doji": { name: "Four-Price Doji", type: "candlestick" },
  "bullish-harami": { name: "Bullish Harami", type: "candlestick" },
  "bearish-harami": { name: "Bearish Harami", type: "candlestick" },
  "bullish-engulfing": { name: "Bullish Engulfing", type: "candlestick" },
  "bearish-engulfing": { name: "Bearish Engulfing", type: "candlestick" },
  "spinning-top": { name: "Spinning Top", type: "candlestick" },
  "morning-star": { name: "Morning Star", type: "candlestick" },
  "evening-star": { name: "Evening Star", type: "candlestick" },
  "three-white-soldiers": { name: "Three White Soldiers", type: "candlestick" },
  "three-black-crows": { name: "Three Black Crows", type: "candlestick" },
  "piercing-line": { name: "Piercing Line", type: "candlestick" },
  "dark-cloud-cover": { name: "Dark Cloud Cover", type: "candlestick" },
  "tweezer-top": { name: "Tweezer Top", type: "candlestick" },
  "tweezer-bottom": { name: "Tweezer Bottom", type: "candlestick" },
  "kicker-bullish": { name: "Bullish Kicker", type: "candlestick" },
  "kicker-bearish": { name: "Bearish Kicker", type: "candlestick" },
  "marubozu-bullish": { name: "Bullish Marubozu", type: "candlestick" },
  "marubozu-bearish": { name: "Bearish Marubozu", type: "candlestick" },
  "abandoned-baby-bullish": { name: "Abandoned Baby Bullish", type: "candlestick" },
  "abandoned-baby-bearish": { name: "Abandoned Baby Bearish", type: "candlestick" },
};

export const DynamicPatternChart = ({ 
  patternType, 
  className = "",
  width = 1000,
  height = 600,
  showTitle = true
}: DynamicPatternChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Get pattern data
    const patternData = PatternCalculator.getPatternData(patternType);
    if (!patternData || !patternData.candles || patternData.candles.length === 0) {
      console.error("No pattern data generated for:", patternType);
      return;
    }

    const { candles, annotations, keyLevels } = patternData;
    const currentPattern = PATTERN_TYPES[patternType] || { name: patternType, type: "continuation" };

    // Clear canvas with dark background
    ctx.fillStyle = "hsl(223, 39%, 4%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 80;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2 - 100;
    const chartLeft = padding;
    const chartTop = padding;

    // Draw grid
    ctx.strokeStyle = "hsl(215, 15%, 20%)";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 10; i++) {
      const x = chartLeft + (i * chartWidth) / 10;
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartTop + chartHeight);
      ctx.stroke();
    }

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

    const priceToY = (price: number) => {
      return chartTop + chartHeight - ((price - adjustedMinPrice) / adjustedRange) * chartHeight;
    };

    const indexToX = (index: number) => {
      return chartLeft + (index + 0.5) * (chartWidth / candles.length);
    };

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
      
      // Unified chart colors: #22c55e (green) and #ef4444 (red)
      ctx.strokeStyle = isBullish ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444";
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);
      
      if (bodyHeight < 3) {
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

    // Draw pattern annotations with label collision avoidance
    const placedLabels: { x: number; y: number; w: number; h: number }[] = [];
    
    const findNonOverlappingY = (cx: number, cy: number, labelW: number, labelH: number, preferDown = false): number => {
      const padding = 6;
      let bestY = cy;
      let attempts = 0;
      const direction = preferDown ? 1 : -1;
      while (attempts < 15) {
        const overlaps = placedLabels.some(placed => 
          Math.abs(cx - placed.x) < (labelW + placed.w) / 2 + padding &&
          Math.abs(bestY - placed.y) < (labelH + placed.h) / 2 + padding
        );
        if (!overlaps) break;
        bestY += direction * (labelH + padding);
        attempts++;
      }
      // Clamp within chart bounds
      bestY = Math.max(chartTop + labelH / 2, Math.min(chartTop + chartHeight - labelH / 2, bestY));
      placedLabels.push({ x: cx, y: bestY, w: labelW, h: labelH });
      return bestY;
    };

    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(annotation.style === 'dashed' ? [5, 5] : []);
      
      if (annotation.type === 'peak') {
        const point = annotation.points[0];
        const x = indexToX(point.x);
        const y = priceToY(point.y);
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        if (annotation.label) {
          ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = "center";
          const textMetrics = ctx.measureText(annotation.label);
          const textWidth = textMetrics.width + 8;
          const textHeight = 18;
          
          const labelY = findNonOverlappingY(x, y - 25, textWidth, textHeight);
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          drawRoundedRect(x - textWidth/2, labelY - textHeight/2, textWidth, textHeight, 4);
          ctx.fill();
          
          ctx.fillStyle = annotation.color;
          ctx.fillText(annotation.label, x, labelY + 4);
        }
      } else if (annotation.points.length >= 2) {
        ctx.beginPath();
        const firstPoint = annotation.points[0];
        ctx.moveTo(indexToX(firstPoint.x), priceToY(firstPoint.y));
        
        for (let i = 1; i < annotation.points.length; i++) {
          const point = annotation.points[i];
          ctx.lineTo(indexToX(point.x), priceToY(point.y));
        }
        ctx.stroke();
        
        if (annotation.label) {
          ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
          const lastPoint = annotation.points[annotation.points.length - 1];
          const lx = indexToX(lastPoint.x) + 10;
          const ly = priceToY(lastPoint.y) - 5;
          const tw = ctx.measureText(annotation.label).width + 8;
          const th = 16;
          
          const labelY = findNonOverlappingY(lx + tw/2, ly, tw, th);
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          drawRoundedRect(lx - 4, labelY - th/2, tw, th, 3);
          ctx.fill();
          
          ctx.fillStyle = annotation.color;
          ctx.textAlign = "left";
          ctx.fillText(annotation.label, lx, labelY + 4);
        }
      }
      
      ctx.setLineDash([]);
    });

    // Draw volume histogram
    const volumeTop = chartTop + chartHeight + 20;
    const volumeHeight = 80;
    const maxVolume = Math.max(...candles.map(c => c.volume));
    
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      const isBullish = candle.close > candle.open;
      
      ctx.fillStyle = isBullish ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
      ctx.fillRect(x - candleWidth/2 * 0.6, volumeTop + volumeHeight - volumeBarHeight, 
                   candleWidth * 0.6, volumeBarHeight);
    });

    // Draw axes labels
    ctx.fillStyle = "hsl(217, 10%, 65%)";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    
    for (let i = 0; i <= 8; i++) {
      const price = adjustedMinPrice + (i / 8) * adjustedRange;
      const y = chartTop + chartHeight - (i * chartHeight) / 8;
      ctx.fillText(price.toFixed(2), chartLeft - 10, y + 4);
    }

    ctx.textAlign = "left";
    ctx.fillText("Volume", chartLeft, volumeTop - 5);

    // Key levels display - positioned top-right with collision avoidance
    if (keyLevels.entry || keyLevels.target || keyLevels.stopLoss) {
      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "right";
      const levelX = chartLeft + chartWidth - 10;
      let levelY = chartTop + 18;
      const lineHeight = 18;
      
      const drawLevel = (label: string, value: number, color: string) => {
        const text = `${label}: ${value.toFixed(2)}`;
        const tw = ctx.measureText(text).width + 12;
        const th = 16;
        const adjustedY = findNonOverlappingY(levelX - tw / 2, levelY, tw, th);
        
        // Background pill
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        drawRoundedRect(levelX - tw, adjustedY - th / 2, tw, th, 4);
        ctx.fill();
        
        ctx.fillStyle = color;
        ctx.fillText(text, levelX - 4, adjustedY + 4);
        levelY = adjustedY + lineHeight;
      };
      
      if (keyLevels.entry) drawLevel("Entry", keyLevels.entry, "hsl(210, 40%, 98%)");
      if (keyLevels.target) drawLevel("Target", keyLevels.target, "#22c55e");
      if (keyLevels.stopLoss) drawLevel("Stop Loss", keyLevels.stopLoss, "#ef4444");
    }

    if (showTitle) {
      // Title and Pattern Type Badge
      ctx.fillStyle = "hsl(210, 40%, 98%)";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      
      const titleMetrics = ctx.measureText(currentPattern.name);
      ctx.fillText(currentPattern.name, chartLeft, chartTop - 30);

      // Pattern type badge
      const badgeText = currentPattern.type.toUpperCase();
      const badgeColor = currentPattern.type === "reversal" ? "#dc2626" : 
                        currentPattern.type === "continuation" ? "#3b82f6" : "#6b7280";
      
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
      const badgeTextMetrics = ctx.measureText(badgeText);
      const badgeWidth = badgeTextMetrics.width + 16;
      const badgeHeight = 22;
      const badgeX = chartLeft + titleMetrics.width + 15;
      const badgeY = chartTop - 42;
      
      ctx.fillStyle = badgeColor;
      drawRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();
      
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, badgeX + badgeWidth/2, badgeY + badgeHeight/2 - 2);
      
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      // Subtitle
      ctx.fillStyle = "hsl(217, 10%, 65%)";
      ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Professional Trading Education", chartLeft, chartTop - 10);

      // Watermark
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("ChartingPath.com", chartLeft + 10, canvas.height - 15);
    }
  }, [patternType, width, height, showTitle]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};
