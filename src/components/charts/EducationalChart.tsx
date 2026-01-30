import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

export interface ChartAnnotation {
  type: 'arrow' | 'callout' | 'zone' | 'line' | 'marker' | 'volume-highlight';
  fromIndex?: number;
  toIndex?: number;
  index?: number;
  price?: number;
  fromPrice?: number;
  toPrice?: number;
  label: string;
  description?: string;
  color?: string;
  style?: 'solid' | 'dashed';
  step?: number; // For progressive reveal
}

export interface ChartGuideStep {
  title: string;
  description: string;
  highlightIndices?: number[];
  annotations: ChartAnnotation[];
  focusArea?: { startIndex: number; endIndex: number };
}

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date?: string;
}

interface EducationalChartProps {
  candles: CandleData[];
  guideSteps?: ChartGuideStep[];
  annotations?: ChartAnnotation[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showVolume?: boolean;
  showVolumeContext?: boolean; // Show volume average line
  volumeAveragePeriod?: number;
  className?: string;
  autoPlay?: boolean;
  stepDuration?: number; // ms between auto-advance
}

export const EducationalChart = ({
  candles,
  guideSteps = [],
  annotations = [],
  title,
  subtitle,
  width = 1000,
  height = 600,
  showVolume = true,
  showVolumeContext = true,
  volumeAveragePeriod = 20,
  className,
  autoPlay = false,
  stepDuration = 4000,
}: EducationalChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const hasSteps = guideSteps.length > 0;
  const activeStep = hasSteps ? guideSteps[currentStep] : null;
  const activeAnnotations = activeStep?.annotations || annotations;

  // Auto-advance steps
  useEffect(() => {
    if (!isPlaying || !hasSteps) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % guideSteps.length);
    }, stepDuration);
    return () => clearInterval(timer);
  }, [isPlaying, hasSteps, guideSteps.length, stepDuration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Theme colors (dark mode optimized) - using unified chart colors
    // Green: #22c55e = hsl(142, 71%, 45%), Red: #ef4444 = hsl(0, 84%, 60%)
    const colors = {
      background: "hsl(223, 39%, 4%)",
      grid: "hsl(215, 15%, 20%)",
      text: "hsl(217, 10%, 65%)",
      textBright: "hsl(210, 40%, 98%)",
      bullish: "#22c55e",  // Unified green for up candles
      bearish: "#ef4444",  // Unified red for down candles
      volumeAvg: "hsl(45, 93%, 47%)",
      highlight: "hsla(217, 91%, 60%, 0.3)",
      arrow: "hsl(217, 91%, 60%)",
      callout: "hsl(280, 65%, 60%)",
      zone: "hsla(45, 93%, 47%, 0.15)",
    };

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Chart dimensions
    const padding = { top: 60, right: 80, bottom: showVolume ? 120 : 40, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const volumeHeight = showVolume ? 80 : 0;
    const chartHeight = height - padding.top - padding.bottom - volumeHeight - (showVolume ? 20 : 0);

    // Calculate price range
    const prices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = (maxPrice - minPrice) * 1.1;
    const adjustedMin = minPrice - priceRange * 0.05;
    const adjustedMax = maxPrice + priceRange * 0.05;

    const priceToY = (price: number) => {
      return padding.top + chartHeight - ((price - adjustedMin) / (adjustedMax - adjustedMin)) * chartHeight;
    };

    const indexToX = (index: number) => {
      return padding.left + ((index + 0.5) / candles.length) * chartWidth;
    };

    // Calculate volume average for context
    const volumeAverage: number[] = [];
    if (showVolumeContext) {
      for (let i = 0; i < candles.length; i++) {
        const start = Math.max(0, i - volumeAveragePeriod + 1);
        const subset = candles.slice(start, i + 1);
        const avg = subset.reduce((sum, c) => sum + c.volume, 0) / subset.length;
        volumeAverage.push(avg);
      }
    }

    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (i * chartWidth) / 10;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const y = padding.top + (i * chartHeight) / 6;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw focus area highlight if active step has one
    if (activeStep?.focusArea) {
      const { startIndex, endIndex } = activeStep.focusArea;
      const x1 = indexToX(startIndex) - 10;
      const x2 = indexToX(endIndex) + 10;
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(x1, padding.top, x2 - x1, chartHeight);
    }

    // Draw highlighted candles
    if (activeStep?.highlightIndices) {
      activeStep.highlightIndices.forEach((idx) => {
        const x = indexToX(idx);
        ctx.fillStyle = colors.highlight;
        ctx.fillRect(x - 15, padding.top, 30, chartHeight);
      });
    }

    // Draw candlesticks
    const candleWidth = Math.max(4, chartWidth / (candles.length * 1.8));
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      const yOpen = priceToY(candle.open);
      const yClose = priceToY(candle.close);
      const yHigh = priceToY(candle.high);
      const yLow = priceToY(candle.low);
      const isBullish = candle.close >= candle.open;

      // Wick
      ctx.strokeStyle = isBullish ? colors.bullish : colors.bearish;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = isBullish ? colors.bullish : colors.bearish;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw volume with context
    if (showVolume) {
      const volumeTop = height - padding.bottom;
      const maxVol = Math.max(...candles.map(c => c.volume));
      
      candles.forEach((candle, index) => {
        const x = indexToX(index);
        const volHeight = (candle.volume / maxVol) * volumeHeight;
        const isBullish = candle.close >= candle.open;

        // Highlight volume spikes (>150% of average)
        const avg = volumeAverage[index] || candle.volume;
        const isSpike = candle.volume > avg * 1.5;
        
        ctx.fillStyle = isSpike
          ? isBullish ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)"
          : isBullish ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)";
        ctx.fillRect(x - candleWidth / 2 * 0.7, volumeTop - volHeight, candleWidth * 0.7, volHeight);
      });

      // Draw volume average line
      if (showVolumeContext && volumeAverage.length > 0) {
        ctx.strokeStyle = colors.volumeAvg;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        volumeAverage.forEach((avg, idx) => {
          const x = indexToX(idx);
          const y = volumeTop - (avg / maxVol) * volumeHeight;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Volume average label
        ctx.fillStyle = colors.volumeAvg;
        ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${volumeAveragePeriod}-bar Avg Volume`, padding.left, volumeTop - volumeHeight - 5);
      }
    }

    // Draw annotations
    activeAnnotations.forEach((ann) => {
      const color = ann.color || colors.arrow;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.setLineDash(ann.style === 'dashed' ? [5, 5] : []);

      switch (ann.type) {
        case 'arrow': {
          if (ann.fromIndex === undefined || ann.toIndex === undefined) break;
          const fromX = indexToX(ann.fromIndex);
          const toX = indexToX(ann.toIndex);
          const fromY = ann.fromPrice !== undefined ? priceToY(ann.fromPrice) : priceToY(candles[ann.fromIndex].close);
          const toY = ann.toPrice !== undefined ? priceToY(ann.toPrice) : priceToY(candles[ann.toIndex].close);

          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(toY - fromY, toX - fromX);
          const headLen = 12;
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'callout': {
          if (ann.index === undefined || ann.price === undefined) break;
          const x = indexToX(ann.index);
          const y = priceToY(ann.price);

          // Circle marker
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Label box
          ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
          const metrics = ctx.measureText(ann.label);
          const boxWidth = metrics.width + 12;
          const boxHeight = 20;
          const boxX = x - boxWidth / 2;
          const boxY = y - 35;

          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
          ctx.fill();

          // Connector line
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y - 6);
          ctx.lineTo(x, boxY + boxHeight);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.fillText(ann.label, x, boxY + 14);
          break;
        }

        case 'zone': {
          if (ann.fromIndex === undefined || ann.toIndex === undefined) break;
          const x1 = indexToX(ann.fromIndex) - candleWidth;
          const x2 = indexToX(ann.toIndex) + candleWidth;
          const y1 = ann.fromPrice !== undefined ? priceToY(ann.fromPrice) : padding.top;
          const y2 = ann.toPrice !== undefined ? priceToY(ann.toPrice) : padding.top + chartHeight;

          ctx.fillStyle = colors.zone;
          ctx.fillRect(x1, Math.min(y1, y2), x2 - x1, Math.abs(y2 - y1));

          if (ann.label) {
            ctx.fillStyle = colors.textBright;
            ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(ann.label, (x1 + x2) / 2, Math.min(y1, y2) - 5);
          }
          break;
        }

        case 'line': {
          if (ann.fromIndex === undefined || ann.toIndex === undefined) break;
          const y = ann.price !== undefined ? priceToY(ann.price) : priceToY(candles[ann.fromIndex].close);
          const x1 = indexToX(ann.fromIndex);
          const x2 = indexToX(ann.toIndex);

          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();

          if (ann.label) {
            ctx.fillStyle = color;
            ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(ann.label, x2 + 8, y + 4);
          }
          break;
        }

        case 'volume-highlight': {
          if (ann.fromIndex === undefined || ann.toIndex === undefined) break;
          const volumeTop = height - padding.bottom;
          const maxVol = Math.max(...candles.map(c => c.volume));

          for (let i = ann.fromIndex; i <= ann.toIndex && i < candles.length; i++) {
            const x = indexToX(i);
            const volHeight = (candles[i].volume / maxVol) * volumeHeight;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - candleWidth / 2 * 0.7 - 2, volumeTop - volHeight - 2, candleWidth * 0.7 + 4, volHeight + 4);
          }

          if (ann.label) {
            const midX = indexToX(Math.floor((ann.fromIndex + ann.toIndex) / 2));
            ctx.fillStyle = color;
            ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(ann.label, midX, height - padding.bottom + 15);
          }
          break;
        }

        case 'marker': {
          if (ann.index === undefined || ann.price === undefined) break;
          const x = indexToX(ann.index);
          const y = priceToY(ann.price);

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
      }

      ctx.setLineDash([]);
    });

    // Draw title
    if (title) {
      ctx.fillStyle = colors.textBright;
      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(title, padding.left, 30);
    }
    if (subtitle) {
      ctx.fillStyle = colors.text;
      ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(subtitle, padding.left, 48);
    }

    // Price axis
    ctx.fillStyle = colors.text;
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const price = adjustedMin + (i / 6) * (adjustedMax - adjustedMin);
      const y = padding.top + chartHeight - (i * chartHeight) / 6;
      ctx.fillText(price.toFixed(2), padding.left - 8, y + 3);
    }

    // Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ChartingPath.com", padding.left, height - 10);

  }, [candles, activeAnnotations, activeStep, currentStep, width, height, showVolume, showVolumeContext, volumeAveragePeriod, title, subtitle]);

  const handlePrevStep = () => setCurrentStep((prev) => (prev - 1 + guideSteps.length) % guideSteps.length);
  const handleNextStep = () => setCurrentStep((prev) => (prev + 1) % guideSteps.length);
  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg"
        style={{ maxWidth: '100%' }}
      />

      {/* Step guide overlay */}
      {hasSteps && activeStep && (
        <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  Step {currentStep + 1} of {guideSteps.length}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1">{activeStep.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{activeStep.description}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevStep}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextStep}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {guideSteps.map((_, idx) => (
              <button
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentStep ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                onClick={() => setCurrentStep(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalChart;
