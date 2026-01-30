import { useEffect, useRef } from "react";
import { PatternCalculator } from "@/utils/PatternCalculator";

interface PatternChartDisplayProps {
  patternType: string;
  className?: string;
}

export const PatternChartDisplay = ({ patternType, className = "" }: PatternChartDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get accurate pattern data
    const patternData = PatternCalculator.getPatternData(patternType);
    const { candles, annotations } = patternData;

    // Set canvas size
    canvas.width = 1000;
    canvas.height = 600;

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

    // Draw annotations
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
          const textWidth = textMetrics.width;
          const textHeight = 14;
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(x - textWidth/2 - 4, y - 25 - textHeight/2, textWidth + 8, textHeight + 4);
          
          ctx.fillStyle = annotation.color;
          ctx.fillText(annotation.label, x, y - 20);
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
          ctx.fillStyle = annotation.color;
          ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = "left";
          const lastPoint = annotation.points[annotation.points.length - 1];
          ctx.fillText(annotation.label, indexToX(lastPoint.x) + 10, priceToY(lastPoint.y) - 5);
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
      
      // Unified volume colors: rgba(34, 197, 94, 0.6) and rgba(239, 68, 68, 0.6)
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

    // Title
    const patternNames: Record<string, string> = {
      "head-shoulders": "Head and Shoulders",
      "inverted-head-shoulders": "Inverted Head and Shoulders",
      "double-top": "Double Top",
      "double-bottom": "Double Bottom",
      "ascending-triangle": "Ascending Triangle",
      "descending-triangle": "Descending Triangle",
      "symmetrical-triangle": "Symmetrical Triangle",
      "rising-wedge": "Rising Wedge",
      "falling-wedge": "Falling Wedge",
      "bull-flag": "Bull Flag",
      "bear-flag": "Bear Flag",
      "pennant": "Pennant",
      "cup-handle": "Cup with Handle"
    };
    
    ctx.fillStyle = "hsl(210, 40%, 98%)";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(patternNames[patternType] || patternType, chartLeft, chartTop - 30);

    ctx.fillStyle = "hsl(217, 10%, 65%)";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Professional Trading Education", chartLeft, chartTop - 10);

    // Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("ChartingPath.com", chartLeft + 10, canvas.height - 15);
  }, [patternType]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-auto ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};
