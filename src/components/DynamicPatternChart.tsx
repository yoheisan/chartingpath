import { useEffect, useRef } from "react";
import { PatternCalculator } from "@/utils/PatternCalculator";

interface DynamicPatternChartProps {
  patternType: string;
  className?: string;
  width?: number;
  height?: number;
}

export const DynamicPatternChart = ({ 
  patternType, 
  className = "",
  width = 800,
  height = 400
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

    // Clear canvas
    ctx.fillStyle = "hsl(var(--background))";
    ctx.fillRect(0, 0, width, height);

    try {
      // Get pattern data
      const patternData = PatternCalculator.getPatternData(patternType);
      if (!patternData || !patternData.candles || patternData.candles.length === 0) {
        console.error("No pattern data generated for:", patternType);
        return;
      }

      const data = patternData.candles;
      const padding = 60;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      // Calculate price range
      const prices = data.flatMap(d => [d.high, d.low]);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const priceRange = maxPrice - minPrice;

      // Helper function to convert price to Y coordinate
      const priceToY = (price: number) => {
        return padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      };

      // Helper function to convert index to X coordinate
      const indexToX = (index: number) => {
        return padding + (index / (data.length - 1)) * chartWidth;
      };

      // Draw grid
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (i / 5) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Draw candlesticks
      data.forEach((candle, index) => {
        const x = indexToX(index);
        const candleWidth = chartWidth / data.length * 0.6;

        const openY = priceToY(candle.open);
        const closeY = priceToY(candle.close);
        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);

        const isGreen = candle.close >= candle.open;
        
        // Draw wick
        ctx.strokeStyle = isGreen ? "hsl(var(--success))" : "hsl(var(--destructive))";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw body
        ctx.fillStyle = isGreen ? "hsl(var(--success))" : "hsl(var(--destructive))";
        const bodyY = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY) || 1;
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
      });

      // Draw pattern annotations if available
      if (patternData.annotations) {
        patternData.annotations.forEach((annotation) => {
          if (annotation.points && annotation.points.length > 1) {
            ctx.strokeStyle = annotation.color || "hsl(var(--primary))";
            ctx.lineWidth = 2;
            ctx.setLineDash(annotation.style === "dashed" ? [5, 5] : []);
            ctx.beginPath();
            annotation.points.forEach((point, idx) => {
              const x = indexToX(point.x);
              const y = priceToY(point.y);
              if (idx === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      // Draw axes
      ctx.strokeStyle = "hsl(var(--foreground))";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

    } catch (error) {
      console.error("Error generating pattern:", error);
    }
  }, [patternType, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};
