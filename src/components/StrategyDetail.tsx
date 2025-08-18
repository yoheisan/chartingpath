import { useParams, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { tradingStrategies, Strategy } from "@/utils/TradingStrategiesData";

interface IndicatorData {
  macd?: number[];
  signal?: number[];
  histogram?: number[];
  rsi?: number[];
  williams?: number[];
  bb_upper?: number[];
  bb_lower?: number[];
  bb_middle?: number[];
  ema20?: number[];
  ema50?: number[];
  ema200?: number[];
  volume_ma?: number[];
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface EntryExitSignal {
  type: "entry" | "exit" | "stop_loss" | "take_profit";
  x: number;
  price: number;
  label: string;
  color: string;
}

export const StrategyDetail = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const strategy = tradingStrategies.find(s => s.id === parseInt(strategyId || "0"));
  
  if (!strategy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Strategy Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested trading strategy could not be found.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Generate realistic chart data with indicators
  const generateChartData = (strategy: Strategy): { candles: CandleData[], indicators: IndicatorData, signals: EntryExitSignal[] } => {
    const candles: CandleData[] = [];
    const indicators: IndicatorData = {};
    const signals: EntryExitSignal[] = [];
    
    // Generate 60 candles for the chart
    let basePrice = 150 + Math.random() * 50;
    let trend = Math.random() > 0.5 ? 1 : -1; // Random initial trend
    
    for (let i = 0; i < 60; i++) {
      const volatility = 0.02 + Math.random() * 0.03;
      const change = (Math.random() - 0.5) * volatility * basePrice + trend * 0.003 * basePrice;
      
      const open = i === 0 ? basePrice : candles[i-1].close;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
      const volume = 50000 + Math.random() * 100000;
      
      candles.push({
        open,
        high, 
        low,
        close,
        volume,
        timestamp: Date.now() - (60 - i) * 3600000 // Hourly intervals
      });
      
      // Occasionally change trend
      if (Math.random() < 0.1) {
        trend *= -1;
      }
    }

    // Generate indicators based on strategy type
    if (strategy.indicators.some(ind => ind.includes("MACD")) || strategy.category === "MACD") {
      // Create realistic MACD with proper crossovers
      const ema12: number[] = [];
      const ema26: number[] = [];
      let ema12Value = candles[0].close;
      let ema26Value = candles[0].close;
      
      for (let i = 0; i < candles.length; i++) {
        ema12Value = ema12Value + (2 / 13) * (candles[i].close - ema12Value);
        ema26Value = ema26Value + (2 / 27) * (candles[i].close - ema26Value);
        ema12.push(ema12Value);
        ema26.push(ema26Value);
      }
      
      indicators.macd = ema12.map((val, i) => (val - ema26[i]) * 0.5); // Scale for visibility
      
      // Signal line (EMA of MACD)
      indicators.signal = [];
      let signalValue = indicators.macd[0];
      for (let i = 0; i < indicators.macd.length; i++) {
        signalValue = signalValue + (2 / 10) * (indicators.macd[i] - signalValue);
        indicators.signal.push(signalValue);
      }
      
      indicators.histogram = indicators.macd.map((val, i) => val - indicators.signal![i]);
    }
    
    if (strategy.indicators.some(ind => ind.includes("RSI")) || strategy.category === "RSI") {
      indicators.rsi = candles.map((_, i) => 50 + Math.sin(i * 0.15) * 25 + Math.random() * 10);
    }
    
    // Williams %R indicator (-100 to 0)
    if (strategy.indicators.some(ind => ind.includes("Williams %R")) || strategy.category === "Williams %R") {
      const period = 14;
      indicators.williams = candles.map((_, i) => {
        const start = Math.max(0, i - period + 1);
        const slice = candles.slice(start, i + 1);
        const highestHigh = Math.max(...slice.map(c => c.high));
        const lowestLow = Math.min(...slice.map(c => c.low));
        const range = highestHigh - lowestLow;
        const value = range === 0 ? -50 : -100 * (highestHigh - candles[i].close) / range;
        return value;
      });
    }
    
    if (strategy.indicators.some(ind => ind.includes("Bollinger"))) {
      const sma = candles.map((_, i) => {
        const start = Math.max(0, i - 19);
        const sum = candles.slice(start, i + 1).reduce((acc, c) => acc + c.close, 0);
        return sum / (i - start + 1);
      });
      
      indicators.bb_middle = sma;
      indicators.bb_upper = sma.map((val, i) => val + (candles[i].high - candles[i].low) * 2);
      indicators.bb_lower = sma.map((val, i) => val - (candles[i].high - candles[i].low) * 2);
    }
    
// EMA calculators
const ema = (period: number) => {
  const out: number[] = [];
  let val = candles[0].close;
  const k = 2 / (period + 1);
  for (let i = 0; i < candles.length; i++) {
    val = val + k * (candles[i].close - val);
    out.push(val);
  }
  return out;
};

if (strategy.indicators.includes("EMA 20")) {
  indicators.ema20 = ema(20);
}
if (strategy.indicators.includes("EMA 50")) {
  indicators.ema50 = ema(50);
}
if (strategy.indicators.includes("EMA 200")) {
  indicators.ema200 = ema(200);
}
    
    if (strategy.indicators.includes("Volume")) {
      indicators.volume_ma = candles.map((_, i) => {
        const start = Math.max(0, i - 9);
        const sum = candles.slice(start, i + 1).reduce((acc, c) => acc + c.volume, 0);
        return sum / (i - start + 1);
      });
    }

// Generate entry/exit signals based on strategy logic
let inPosition = false;
for (let i = 15; i < candles.length - 5; i++) {
  if (strategy.category === "MACD" && indicators.macd && indicators.signal) {
    // MACD crossover signals – pair entries/exits to reflect indicator
    const prevMacd = indicators.macd[i - 1];
    const currMacd = indicators.macd[i];
    const prevSignal = indicators.signal[i - 1];
    const currSignal = indicators.signal[i];

    const crossUp = prevMacd <= prevSignal && currMacd > currSignal;
    const crossDown = prevMacd >= prevSignal && currMacd < currSignal;

    if (!inPosition && crossUp) {
      signals.push({
        type: "entry",
        x: i,
        price: candles[i].low - (candles[i].high - candles[i].low) * 0.1,
        label: "BUY",
        color: "#22c55e",
      });
      inPosition = true;
    } else if (inPosition && crossDown) {
      signals.push({
        type: "exit",
        x: i,
        price: candles[i].high + (candles[i].high - candles[i].low) * 0.1,
        label: "SELL",
        color: "#ef4444",
      });
      inPosition = false;
    }
  } else if (strategy.category === "RSI" && indicators.rsi) {
    // RSI oversold/overbought – ensure proper pairing
    const prevRsi = indicators.rsi[i - 1];
    const currRsi = indicators.rsi[i];

    if (!inPosition && prevRsi < 30 && currRsi >= 30) {
      signals.push({
        type: "entry",
        x: i,
        price: candles[i].low - (candles[i].high - candles[i].low) * 0.1,
        label: "BUY",
        color: "#22c55e",
      });
      inPosition = true;
    } else if (inPosition && prevRsi > 70 && currRsi <= 70) {
      signals.push({
        type: "exit",
        x: i,
        price: candles[i].high + (candles[i].high - candles[i].low) * 0.1,
        label: "SELL",
        color: "#ef4444",
      });
      inPosition = false;
    }
  } else if (strategy.category === "Williams %R" && indicators.williams) {
    // Williams %R Overbought/Oversold signals
    const prevWR = indicators.williams[i - 1];
    const currWR = indicators.williams[i];
    const bullish = candles[i].close > candles[i].open;
    const bearish = candles[i].close < candles[i].open;

    if (!inPosition && prevWR <= -80 && currWR > -80 && bullish) {
      signals.push({ type: "entry", x: i, price: candles[i].low - (candles[i].high - candles[i].low) * 0.1, label: "BUY", color: "#22c55e" });
      inPosition = true;
    } else if (inPosition && prevWR >= -20 && currWR < -20 && bearish) {
      signals.push({ type: "exit", x: i, price: candles[i].high + (candles[i].high - candles[i].low) * 0.1, label: "SELL", color: "#ef4444" });
      inPosition = false;
    }
  } else if (
    strategy.category === "Bollinger Bands" &&
    indicators.bb_upper &&
    indicators.bb_lower &&
    indicators.bb_middle
  ) {
    // Bollinger mean reversion – pair signals
    const prevClose = candles[i - 1].close;
    const currClose = candles[i].close;
    const bbUpper = indicators.bb_upper[i];
    const bbLower = indicators.bb_lower[i];

    if (!inPosition && candles[i].low <= bbLower && currClose > prevClose && currClose > bbLower) {
      signals.push({
        type: "entry",
        x: i,
        price: candles[i].low - (candles[i].high - candles[i].low) * 0.1,
        label: "BUY",
        color: "#22c55e",
      });
      inPosition = true;
    } else if (inPosition && candles[i].high >= bbUpper && currClose < prevClose && currClose < bbUpper) {
      signals.push({
        type: "exit",
        x: i,
        price: candles[i].high + (candles[i].high - candles[i].low) * 0.1,
        label: "SELL",
        color: "#ef4444",
      });
      inPosition = false;
    }
  } else if (
    strategy.category === "Moving Averages" ||
    (strategy.indicators.includes("EMA 20") && strategy.indicators.includes("EMA 50"))
  ) {
    // EMA crossovers – support 20/50 and 50/200
    if (indicators.ema20 && indicators.ema50) {
      const prevFast = indicators.ema20[i - 1];
      const currFast = indicators.ema20[i];
      const prevSlow = indicators.ema50[i - 1];
      const currSlow = indicators.ema50[i];

      const crossUp = prevFast <= prevSlow && currFast > currSlow;
      const crossDown = prevFast >= prevSlow && currFast < currSlow;

      if (!inPosition && crossUp) {
        signals.push({ type: "entry", x: i, price: candles[i].low - (candles[i].high - candles[i].low) * 0.1, label: "BUY", color: "#22c55e" });
        inPosition = true;
      } else if (inPosition && crossDown) {
        signals.push({ type: "exit", x: i, price: candles[i].high + (candles[i].high - candles[i].low) * 0.1, label: "SELL", color: "#ef4444" });
        inPosition = false;
      }
    } else if (indicators.ema50 && indicators.ema200) {
      const prevFast = indicators.ema50[i - 1];
      const currFast = indicators.ema50[i];
      const prevSlow = indicators.ema200[i - 1]!;
      const currSlow = indicators.ema200[i]!;

      const crossUp = prevFast <= prevSlow && currFast > currSlow;
      const crossDown = prevFast >= prevSlow && currFast < currSlow;

      if (!inPosition && crossUp) {
        signals.push({ type: "entry", x: i, price: candles[i].low - (candles[i].high - candles[i].low) * 0.1, label: "BUY", color: "#22c55e" });
        inPosition = true;
      } else if (inPosition && crossDown) {
        signals.push({ type: "exit", x: i, price: candles[i].high + (candles[i].high - candles[i].low) * 0.1, label: "SELL", color: "#ef4444" });
        inPosition = false;
      }
    }
  }
}

    // Ensure signals are in entry-exit pairs
    if (inPosition) {
      for (let j = signals.length - 1; j >= 0; j--) {
        if (signals[j].type === "entry") { signals.splice(j, 1); break; }
      }
    }

    return { candles, indicators, signals };
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { candles, indicators, signals } = generateChartData(strategy);

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Clear canvas with dark background
    ctx.fillStyle = "hsl(223, 39%, 4%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 80;
    const chartWidth = canvas.width - padding * 2;
    const priceChartHeight = 400;
    const indicatorChartHeight = 150;
    const volumeChartHeight = 100;
    const chartLeft = padding;
    const priceChartTop = padding;
    const indicatorChartTop = priceChartTop + priceChartHeight + 40;
    const volumeChartTop = indicatorChartTop + indicatorChartHeight + 40;

    // Price range for main chart
    const prices = candles.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    const adjustedMinPrice = minPrice - pricePadding;
    const adjustedMaxPrice = maxPrice + pricePadding;
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

    // Helper functions
    const priceToY = (price: number) => {
      return priceChartTop + priceChartHeight - ((price - adjustedMinPrice) / adjustedPriceRange) * priceChartHeight;
    };

    const indexToX = (index: number) => {
      return chartLeft + (index + 0.5) * (chartWidth / candles.length);
    };

    // Draw main price chart grid
    ctx.strokeStyle = "hsl(215, 15%, 20%)";
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = chartLeft + (i * chartWidth) / 10;
      ctx.beginPath();
      ctx.moveTo(x, priceChartTop);
      ctx.lineTo(x, priceChartTop + priceChartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = priceChartTop + (i * priceChartHeight) / 8;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(8, chartWidth / (candles.length * 1.5));
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      
      const yOpen = priceToY(candle.open);
      const yClose = priceToY(candle.close);
      const yHigh = priceToY(candle.high);
      const yLow = priceToY(candle.low);

      const isBullish = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isBullish ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = isBullish ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);
      
      if (bodyHeight < 3) {
        // Doji
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

    // Draw indicators on main chart
    if (indicators.ema20) {
      ctx.strokeStyle = "hsl(45, 93%, 47%)"; // Orange
      ctx.lineWidth = 2;
      ctx.beginPath();
      indicators.ema20.forEach((value, index) => {
        const x = indexToX(index);
        const y = priceToY(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

if (indicators.ema50) {
  ctx.strokeStyle = "hsl(280, 80%, 60%)"; // Purple
  ctx.lineWidth = 2;
  ctx.beginPath();
  indicators.ema50.forEach((value, index) => {
    const x = indexToX(index);
    const y = priceToY(value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

if (indicators.ema200) {
  ctx.strokeStyle = "hsl(160, 70%, 50%)"; // Teal
  ctx.lineWidth = 2;
  ctx.beginPath();
  indicators.ema200.forEach((value, index) => {
    const x = indexToX(index);
    const y = priceToY(value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

    if (indicators.bb_upper && indicators.bb_lower && indicators.bb_middle) {
      // Bollinger Bands
      ctx.strokeStyle = "hsl(200, 80%, 60%)"; // Blue
      ctx.lineWidth = 1;
      
      // Upper band
      ctx.beginPath();
      indicators.bb_upper.forEach((value, index) => {
        const x = indexToX(index);
        const y = priceToY(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Lower band
      ctx.beginPath();
      indicators.bb_lower.forEach((value, index) => {
        const x = indexToX(index);
        const y = priceToY(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Middle band
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      indicators.bb_middle.forEach((value, index) => {
        const x = indexToX(index);
        const y = priceToY(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw entry/exit signals
    signals.forEach(signal => {
      const x = indexToX(signal.x);
      const y = priceToY(signal.price);
      
      // Draw arrow
      ctx.fillStyle = signal.color;
      ctx.strokeStyle = signal.color;
      ctx.lineWidth = 2;
      
      if (signal.type === "entry") {
        // Up arrow
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y + 15);
        ctx.lineTo(x + 8, y + 15);
        ctx.closePath();
        ctx.fill();
      } else {
        // Down arrow
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y - 15);
        ctx.lineTo(x + 8, y - 15);
        ctx.closePath();
        ctx.fill();
      }
      
      // Draw label
      ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.fillText(signal.label, x, signal.type === "entry" ? y + 28 : y - 25);
    });

    // Draw indicator panel (MACD/RSI)
    if (indicators.macd || indicators.rsi || indicators.williams) {
      // Draw indicator panel background
      ctx.fillStyle = "hsl(223, 39%, 6%)";
      ctx.fillRect(chartLeft, indicatorChartTop, chartWidth, indicatorChartHeight);
      
      // Draw indicator grid
      ctx.strokeStyle = "hsl(215, 15%, 15%)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = indicatorChartTop + (i * indicatorChartHeight) / 4;
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartLeft + chartWidth, y);
        ctx.stroke();
      }

      if (indicators.macd && indicators.signal && indicators.histogram) {
        // MACD
        const macdValues = [...indicators.macd, ...indicators.signal];
        const macdMin = Math.min(...macdValues);
        const macdMax = Math.max(...macdValues);
        const macdRange = macdMax - macdMin;
        const macdPadding = macdRange * 0.1;
        const adjustedMacdMin = macdMin - macdPadding;
        const adjustedMacdMax = macdMax + macdPadding;
        const adjustedMacdRange = adjustedMacdMax - adjustedMacdMin;

        const macdToY = (value: number) => {
          return indicatorChartTop + indicatorChartHeight - ((value - adjustedMacdMin) / adjustedMacdRange) * indicatorChartHeight;
        };

        // MACD histogram
        ctx.fillStyle = "hsl(215, 70%, 60%)";
        indicators.histogram.forEach((value, index) => {
          const x = indexToX(index);
          const zeroY = macdToY(0);
          const valueY = macdToY(value);
          const height = Math.abs(valueY - zeroY);
          
          if (value > 0) {
            ctx.fillRect(x - candleWidth/3, valueY, candleWidth * 0.6, height);
          } else {
            ctx.fillRect(x - candleWidth/3, zeroY, candleWidth * 0.6, height);
          }
        });

        // MACD line
        ctx.strokeStyle = "hsl(200, 80%, 60%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        indicators.macd.forEach((value, index) => {
          const x = indexToX(index);
          const y = macdToY(value);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Signal line
        ctx.strokeStyle = "hsl(0, 80%, 60%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        indicators.signal.forEach((value, index) => {
          const x = indexToX(index);
          const y = macdToY(value);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Zero line
        ctx.strokeStyle = "hsl(210, 40%, 50%)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const zeroY = macdToY(0);
        ctx.beginPath();
        ctx.moveTo(chartLeft, zeroY);
        ctx.lineTo(chartLeft + chartWidth, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (indicators.rsi) {
        // RSI
        const rsiToY = (value: number) => {
          return indicatorChartTop + indicatorChartHeight - (value / 100) * indicatorChartHeight;
        };

        // RSI overbought/oversold lines
        ctx.strokeStyle = "hsl(0, 60%, 50%)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        // 70 line
        const overboughtY = rsiToY(70);
        ctx.beginPath();
        ctx.moveTo(chartLeft, overboughtY);
        ctx.lineTo(chartLeft + chartWidth, overboughtY);
        ctx.stroke();
        
        // 30 line
        const oversoldY = rsiToY(30);
        ctx.beginPath();
        ctx.moveTo(chartLeft, oversoldY);
        ctx.lineTo(chartLeft + chartWidth, oversoldY);
        ctx.stroke();
        
        ctx.setLineDash([]);

        // RSI line
        ctx.strokeStyle = "hsl(280, 80%, 60%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        indicators.rsi.forEach((value, index) => {
          const x = indexToX(index);
          const y = rsiToY(value);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (indicators.williams) {
        // Williams %R
        const wrToY = (value: number) => {
          // Map -100..0 to 0..100 scale
          return indicatorChartTop + indicatorChartHeight - ((value + 100) / 100) * indicatorChartHeight;
        };

        // Overbought (-20) and Oversold (-80) lines
        ctx.strokeStyle = "hsl(0, 60%, 50%)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        const overboughtY2 = wrToY(-20);
        ctx.beginPath();
        ctx.moveTo(chartLeft, overboughtY2);
        ctx.lineTo(chartLeft + chartWidth, overboughtY2);
        ctx.stroke();

        const oversoldY2 = wrToY(-80);
        ctx.beginPath();
        ctx.moveTo(chartLeft, oversoldY2);
        ctx.lineTo(chartLeft + chartWidth, oversoldY2);
        ctx.stroke();

        ctx.setLineDash([]);

        // %R line
        ctx.strokeStyle = "hsl(280, 80%, 60%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        indicators.williams.forEach((value, index) => {
          const x = indexToX(index);
          const y = wrToY(value);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }

    // Draw volume panel
    ctx.fillStyle = "hsl(223, 39%, 6%)";
    ctx.fillRect(chartLeft, volumeChartTop, chartWidth, volumeChartHeight);
    
    const maxVolume = Math.max(...candles.map(c => c.volume));
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      const volumeBarHeight = (candle.volume / maxVolume) * volumeChartHeight;
      const isBullish = candle.close > candle.open;
      
      ctx.fillStyle = isBullish ? "hsl(142, 76%, 36%, 0.6)" : "hsl(0, 84%, 60%, 0.6)";
      ctx.fillRect(x - candleWidth/2 * 0.6, volumeChartTop + volumeChartHeight - volumeBarHeight, 
                   candleWidth * 0.6, volumeBarHeight);
    });

    // Draw volume MA if available
    if (indicators.volume_ma) {
      ctx.strokeStyle = "hsl(45, 93%, 47%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      indicators.volume_ma.forEach((value, index) => {
        const x = indexToX(index);
        const y = volumeChartTop + volumeChartHeight - (value / maxVolume) * volumeChartHeight;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw axes labels
    ctx.fillStyle = "hsl(217, 10%, 65%)";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    
    // Price labels
    for (let i = 0; i <= 8; i++) {
      const price = adjustedMinPrice + (i / 8) * adjustedPriceRange;
      const y = priceChartTop + priceChartHeight - (i * priceChartHeight) / 8;
      ctx.fillText(price.toFixed(2), chartLeft - 10, y + 4);
    }

    // Chart title
    ctx.fillStyle = "hsl(210, 40%, 98%)";
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(strategy.name, chartLeft, priceChartTop - 40);

    // Subtitle with indicators
    ctx.fillStyle = "hsl(217, 10%, 65%)";  
    ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`Indicators: ${strategy.indicators.join(", ")}`, chartLeft, priceChartTop - 20);

    // Legend
    let legendY = priceChartTop + 20;
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    let legendX = chartLeft + chartWidth - 200;
    
if (indicators.ema20) {
  ctx.fillStyle = "hsl(45, 93%, 47%)";
  ctx.fillText("● EMA 20", legendX, legendY);
  legendY += 20;
}

if (indicators.ema50) {
  ctx.fillStyle = "hsl(280, 80%, 60%)";
  ctx.fillText("● EMA 50", legendX, legendY);
  legendY += 20;
}

if (indicators.ema200) {
  ctx.fillStyle = "hsl(160, 70%, 50%)";
  ctx.fillText("● EMA 200", legendX, legendY);
}
  };

  useEffect(() => {
    drawChart();
  }, [strategy]);

  const downloadChart = async () => {
    if (!containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: "hsl(223, 39%, 4%)",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `${strategy.name.toLowerCase().replace(/\s+/g, '-')}-strategy.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success(`${strategy.name} strategy chart downloaded successfully!`);
    } catch (error) {
      toast.error("Failed to download strategy chart");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-600/20 text-green-400 border-green-600/30";
      case "Intermediate": return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
      case "Advanced": return "bg-orange-600/20 text-orange-400 border-orange-600/30";
      case "Expert": return "bg-red-600/20 text-red-400 border-red-600/30";
      default: return "bg-gray-600/20 text-gray-400 border-gray-600/30";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Strategies
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{strategy.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className={getDifficultyColor(strategy.difficulty)}>
                  {strategy.difficulty}
                </Badge>
                <Badge variant="outline">{strategy.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-bullish" />
                  R:R {strategy.riskReward}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-bearish" />
                  {strategy.successRate} Win Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div ref={containerRef} className="space-y-6">
          <Card>
            <CardHeader>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  className="border border-border rounded-lg w-full"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Strategy Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{strategy.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Indicators Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.indicators.map((indicator, index) => (
                      <Badge key={index} variant="outline">{indicator}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recommended Timeframes</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.timeframes.map((timeframe, index) => (
                      <Badge key={index} variant="secondary">{timeframe}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entry & Exit Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-bullish">Entry Conditions</h4>
                  <p className="text-muted-foreground">{strategy.entry}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-bearish">Exit Conditions</h4>
                  <p className="text-muted-foreground">{strategy.exit}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <h4 className="font-semibold mb-1">Risk:Reward</h4>
                    <p className="text-2xl font-bold text-bullish">{strategy.riskReward}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Success Rate</h4>
                    <p className="text-2xl font-bold text-primary">{strategy.successRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};