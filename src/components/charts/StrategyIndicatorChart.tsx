/**
 * StrategyIndicatorChart - Professional chart with technical indicators
 * 
 * Designed for embedding in strategy articles to visualize concepts like:
 * - MACD crossovers and divergence
 * - RSI overbought/oversold levels
 * - Moving average crossovers (Golden/Death cross)
 * - Bollinger Band squeezes and breakouts
 * 
 * Uses lightweight-charts with a separate indicator pane below price chart.
 */

import { useEffect, useRef, memo, useState } from 'react';
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ISeriesApi,
} from 'lightweight-charts';
import { CompressedBar } from '@/types/VisualSpec';
import {
  calculateEMA,
  calculateSMA,
  calculateMACD,
  calculateRSI,
  calculateBollingerBands,
  calculateDonchianChannels,
  calculateIchimoku,
  calculateStochastic,
  calculateWilliamsR,
  calculateCCI,
  calculateADX,
  calculateATR,
  calculateOBV,
  calculateMFI,
  calculateROC,
  calculateParabolicSAR,
} from '@/utils/chartIndicators';
import {
  getThemeColors,
  CANDLE_COLORS,
  VOLUME_COLORS,
  normalizeBarsForConsistentColoring,
  calculateOptimalPriceMargins,
  getVolumeColor,
} from './chartConstants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export type IndicatorType = 'macd' | 'rsi' | 'ema-crossover' | 'bollinger' | 'sma-crossover' | 'donchian' | 'ichimoku' | 'stochastic' | 'williams-r' | 'cci' | 'adx' | 'atr' | 'obv' | 'mfi' | 'roc' | 'parabolic-sar' | 'pivot-points';

export interface StrategyIndicatorChartProps {
  bars: CompressedBar[];
  indicator: IndicatorType;
  title?: string;
  description?: string;
  height?: number;
  showVolume?: boolean;
  annotations?: ChartAnnotation[];
}

export interface ChartAnnotation {
  time: string; // ISO timestamp
  type: 'buy' | 'sell' | 'signal';
  label: string;
  price?: number;
}

// Indicator-specific colors
const INDICATOR_CHART_COLORS = {
  macdLine: '#3b82f6',      // Blue
  signalLine: '#f97316',    // Orange
  histogramUp: 'rgba(34, 197, 94, 0.7)',
  histogramDown: 'rgba(239, 68, 68, 0.7)',
  rsiLine: '#8b5cf6',       // Purple
  rsiOverbought: 'rgba(239, 68, 68, 0.3)',
  rsiOversold: 'rgba(34, 197, 94, 0.3)',
  emaFast: '#f97316',       // Orange (12/20 period)
  emaSlow: '#3b82f6',       // Blue (26/50 period)
  sma50: '#3b82f6',
  sma200: '#8b5cf6',
  bollingerBand: 'rgba(156, 163, 175, 0.5)',
  bollingerMiddle: 'rgba(156, 163, 175, 0.8)',
  donchianUpper: '#22c55e',    // Green - breakout above
  donchianLower: '#ef4444',    // Red - breakout below
  donchianMiddle: '#3b82f6',   // Blue - middle line
  // Ichimoku Cloud colors
  tenkanSen: '#3b82f6',        // Blue - Conversion Line
  kijunSen: '#ef4444',         // Red - Base Line
  senkouSpanA: 'rgba(34, 197, 94, 0.4)',  // Green - Leading Span A
  senkouSpanB: 'rgba(239, 68, 68, 0.4)',  // Red - Leading Span B
  chikouSpan: '#a855f7',       // Purple - Lagging Span
  cloudBullish: 'rgba(34, 197, 94, 0.15)',
  cloudBearish: 'rgba(239, 68, 68, 0.15)',
  // New indicator colors
  stochasticK: '#3b82f6',      // Blue
  stochasticD: '#f97316',      // Orange
  williamsR: '#8b5cf6',        // Purple
  cci: '#06b6d4',              // Cyan
  adxLine: '#8b5cf6',          // Purple
  plusDI: '#22c55e',           // Green
  minusDI: '#ef4444',          // Red
  atr: '#f97316',              // Orange
  obv: '#3b82f6',              // Blue
  mfi: '#8b5cf6',              // Purple
  roc: '#06b6d4',              // Cyan
  sarBullish: '#22c55e',       // Green
  sarBearish: '#ef4444',       // Red
};

const StrategyIndicatorChart = memo(({
  bars,
  indicator,
  title,
  description,
  height = 400,
  showVolume = true,
  annotations = [],
}: StrategyIndicatorChartProps) => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const indicatorContainerRef = useRef<HTMLDivElement>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const indicatorChartRef = useRef<IChartApi | null>(null);
  const [currentSignal, setCurrentSignal] = useState<{ type: 'bullish' | 'bearish' | 'neutral'; text: string } | null>(null);

  // Calculate chart heights - Overlay-only indicators don't need separate pane
  const overlayOnlyIndicators = ['bollinger', 'donchian', 'ichimoku', 'parabolic-sar', 'pivot-points'];
  const separatePaneIndicators = ['macd', 'rsi', 'stochastic', 'williams-r', 'cci', 'adx', 'atr', 'obv', 'mfi', 'roc'];
  const isOverlayOnly = overlayOnlyIndicators.includes(indicator);
  const hasSeparatePane = separatePaneIndicators.includes(indicator);
  const mainHeight = isOverlayOnly ? height : Math.floor(height * 0.65);
  const indicatorHeight = hasSeparatePane ? Math.floor(height * 0.35) : 0;

  useEffect(() => {
    if (!mainContainerRef.current || !bars || bars.length === 0) return;

    const theme = getThemeColors();

    // Clean up existing charts
    if (mainChartRef.current) {
      mainChartRef.current.remove();
      mainChartRef.current = null;
    }
    if (indicatorChartRef.current) {
      indicatorChartRef.current.remove();
      indicatorChartRef.current = null;
    }

    // === MAIN PRICE CHART ===
    const mainChart = createChart(mainContainerRef.current, {
      width: mainContainerRef.current.clientWidth,
      height: mainHeight,
      layout: {
        background: { color: theme.background },
        textColor: theme.text,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: {
        visible: true,
        borderColor: theme.grid,
      },
      timeScale: {
        visible: isOverlayOnly, // Only show time on main if no indicator pane
        borderVisible: true,
        borderColor: theme.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    mainChartRef.current = mainChart;

    // Add candlesticks
    const candleSeries = mainChart.addSeries(CandlestickSeries, CANDLE_COLORS);
    const normalizedBars = normalizeBarsForConsistentColoring(bars);

    const chartData: CandlestickData[] = normalizedBars
      .map((bar) => ({
        time: Math.floor(new Date(bar.t).getTime() / 1000) as Time,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
      }))
      .filter((d) =>
        Number.isFinite(d.time as number) &&
        Number.isFinite(d.open) &&
        Number.isFinite(d.high) &&
        Number.isFinite(d.low) &&
        Number.isFinite(d.close)
      );

    candleSeries.setData(chartData);

    // Add volume if enabled
    if (showVolume) {
      const volumeSeries = mainChart.addSeries(HistogramSeries, {
        color: VOLUME_COLORS.default,
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      mainChart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        borderVisible: false,
      });

      const volumeData = chartData.map((d) => {
        const bar = bars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
        const isUp = bar ? bar.c >= bar.o : true;
        return {
          time: d.time,
          value: bar?.v || 0,
          color: getVolumeColor(isUp),
        };
      });

      volumeSeries.setData(volumeData);
    }

    // Add indicator-specific overlays on main chart
    if (indicator === 'ema-crossover' || indicator === 'sma-crossover') {
      const isSMA = indicator === 'sma-crossover';
      const fastPeriod = isSMA ? 50 : 12;
      const slowPeriod = isSMA ? 200 : 26;
      
      const fastData = isSMA ? calculateSMA(bars, fastPeriod) : calculateEMA(bars, fastPeriod);
      const slowData = isSMA ? calculateSMA(bars, slowPeriod) : calculateEMA(bars, slowPeriod);

      if (fastData.length > 0) {
        const fastSeries = mainChart.addSeries(LineSeries, {
          color: isSMA ? INDICATOR_CHART_COLORS.sma50 : INDICATOR_CHART_COLORS.emaFast,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        fastSeries.setData(fastData.map(p => ({ time: p.time as Time, value: p.value })));
      }

      if (slowData.length > 0) {
        const slowSeries = mainChart.addSeries(LineSeries, {
          color: isSMA ? INDICATOR_CHART_COLORS.sma200 : INDICATOR_CHART_COLORS.emaSlow,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        slowSeries.setData(slowData.map(p => ({ time: p.time as Time, value: p.value })));
      }

      // Detect crossover signal
      if (fastData.length > 1 && slowData.length > 1) {
        const lastFast = fastData[fastData.length - 1].value;
        const prevFast = fastData[fastData.length - 2].value;
        const lastSlow = slowData[slowData.length - 1].value;
        const prevSlow = slowData[slowData.length - 2].value;

        if (prevFast < prevSlow && lastFast > lastSlow) {
          setCurrentSignal({ type: 'bullish', text: isSMA ? 'Golden Cross' : 'Bullish EMA Crossover' });
        } else if (prevFast > prevSlow && lastFast < lastSlow) {
          setCurrentSignal({ type: 'bearish', text: isSMA ? 'Death Cross' : 'Bearish EMA Crossover' });
        } else if (lastFast > lastSlow) {
          setCurrentSignal({ type: 'bullish', text: 'Bullish Trend' });
        } else {
          setCurrentSignal({ type: 'bearish', text: 'Bearish Trend' });
        }
      }
    }

    if (indicator === 'bollinger') {
      const bbData = calculateBollingerBands(bars, 20, 2);
      
      if (bbData.length > 0) {
        // Upper band
        const upperSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.bollingerBand,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        upperSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.upper })));

        // Middle band (SMA 20)
        const middleSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.bollingerMiddle,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        middleSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.middle })));

        // Lower band
        const lowerSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.bollingerBand,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        lowerSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.lower })));

        // Detect squeeze/breakout
        const lastBB = bbData[bbData.length - 1];
        const lastClose = bars[bars.length - 1].c;
        const bandwidth = (lastBB.upper - lastBB.lower) / lastBB.middle;

        if (lastClose > lastBB.upper) {
          setCurrentSignal({ type: 'bullish', text: 'Breakout Above Upper Band' });
        } else if (lastClose < lastBB.lower) {
          setCurrentSignal({ type: 'bearish', text: 'Breakdown Below Lower Band' });
        } else if (bandwidth < 0.1) {
          setCurrentSignal({ type: 'neutral', text: 'Squeeze Forming' });
        }
      }
    }

    // === DONCHIAN CHANNELS (Turtle Trading) ===
    if (indicator === 'donchian') {
      const donchianData = calculateDonchianChannels(bars, 20);
      
      if (donchianData.length > 0) {
        // Upper channel (highest high)
        const upperSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.donchianUpper,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        upperSeries.setData(donchianData.map(p => ({ time: p.time as Time, value: p.upper })));

        // Middle line
        const middleSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.donchianMiddle,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        middleSeries.setData(donchianData.map(p => ({ time: p.time as Time, value: p.middle })));

        // Lower channel (lowest low)
        const lowerSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.donchianLower,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        lowerSeries.setData(donchianData.map(p => ({ time: p.time as Time, value: p.lower })));

        // Detect breakout signals (Turtle Trading entry rules)
        const lastDC = donchianData[donchianData.length - 1];
        const lastClose = bars[bars.length - 1].c;
        const prevClose = bars.length > 1 ? bars[bars.length - 2].c : lastClose;

        if (lastClose >= lastDC.upper && prevClose < donchianData[donchianData.length - 2]?.upper) {
          setCurrentSignal({ type: 'bullish', text: '20-Day High Breakout (Long Entry)' });
        } else if (lastClose <= lastDC.lower && prevClose > donchianData[donchianData.length - 2]?.lower) {
          setCurrentSignal({ type: 'bearish', text: '20-Day Low Breakout (Short Entry)' });
        } else if (lastClose > lastDC.middle) {
          setCurrentSignal({ type: 'bullish', text: 'Above Middle Line (Bullish Bias)' });
        } else {
          setCurrentSignal({ type: 'bearish', text: 'Below Middle Line (Bearish Bias)' });
        }
      }
    }

    // === ICHIMOKU CLOUD ===
    if (indicator === 'ichimoku') {
      const ichimokuData = calculateIchimoku(bars);
      
      if (ichimokuData.current.length > 0) {
        // Tenkan-sen (Conversion Line - fast, blue)
        const tenkanSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.tenkanSen,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        tenkanSeries.setData(ichimokuData.current.map(p => ({ time: p.time as Time, value: p.tenkan })));

        // Kijun-sen (Base Line - slow, red)
        const kijunSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.kijunSen,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        kijunSeries.setData(ichimokuData.current.map(p => ({ time: p.time as Time, value: p.kijun })));

        // Senkou Span A (Leading Span A - green tint)
        const senkouASeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.senkouSpanA,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        senkouASeries.setData(ichimokuData.cloud.map(p => ({ time: p.time as Time, value: p.senkouA })));

        // Senkou Span B (Leading Span B - red tint)
        const senkouBSeries = mainChart.addSeries(LineSeries, {
          color: INDICATOR_CHART_COLORS.senkouSpanB,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        senkouBSeries.setData(ichimokuData.cloud.map(p => ({ time: p.time as Time, value: p.senkouB })));

        // Chikou Span (Lagging Span - purple, displaced back 26 periods)
        // For display, we shift the time back
        const chikouData = ichimokuData.current.slice(26).map((p, i) => ({
          time: ichimokuData.current[i].time as Time,
          value: p.chikou,
        }));
        if (chikouData.length > 0) {
          const chikouSeries = mainChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.chikouSpan,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          chikouSeries.setData(chikouData);
        }

        // Detect Ichimoku signals
        const last = ichimokuData.current[ichimokuData.current.length - 1];
        const prev = ichimokuData.current[ichimokuData.current.length - 2];
        const lastClose = bars[bars.length - 1].c;
        
        // TK Cross (Tenkan crosses Kijun)
        if (prev && prev.tenkan < prev.kijun && last.tenkan > last.kijun) {
          setCurrentSignal({ type: 'bullish', text: 'Bullish TK Cross (Tenkan > Kijun)' });
        } else if (prev && prev.tenkan > prev.kijun && last.tenkan < last.kijun) {
          setCurrentSignal({ type: 'bearish', text: 'Bearish TK Cross (Tenkan < Kijun)' });
        } else if (lastClose > last.senkouA && lastClose > last.senkouB) {
          // Price above cloud
          if (last.senkouA > last.senkouB) {
            setCurrentSignal({ type: 'bullish', text: 'Price Above Bullish Cloud' });
          } else {
            setCurrentSignal({ type: 'bullish', text: 'Price Above Cloud (Bullish)' });
          }
        } else if (lastClose < last.senkouA && lastClose < last.senkouB) {
          // Price below cloud
          setCurrentSignal({ type: 'bearish', text: 'Price Below Cloud (Bearish)' });
        } else {
          // Price inside cloud
          setCurrentSignal({ type: 'neutral', text: 'Price Inside Cloud (Consolidation)' });
        }
      }
    }

    // === PARABOLIC SAR (overlay on main chart) ===
    if (indicator === 'parabolic-sar') {
      const sarData = calculateParabolicSAR(bars);
      
      if (sarData.length > 0) {
        // Plot SAR dots as a line series with small width
        const sarSeries = mainChart.addSeries(LineSeries, {
          lineWidth: 1,
          lineStyle: 3, // Dotted
          priceLineVisible: false,
          lastValueVisible: false,
        });
        
        // Color based on trend
        sarSeries.setData(sarData.map(p => ({
          time: p.time as Time,
          value: p.sar,
          color: p.isUptrend ? INDICATOR_CHART_COLORS.sarBullish : INDICATOR_CHART_COLORS.sarBearish,
        })));

        // Detect signal
        const last = sarData[sarData.length - 1];
        const prev = sarData.length > 1 ? sarData[sarData.length - 2] : null;
        
        if (prev && !prev.isUptrend && last.isUptrend) {
          setCurrentSignal({ type: 'bullish', text: 'SAR Flip to Bullish (Buy Signal)' });
        } else if (prev && prev.isUptrend && !last.isUptrend) {
          setCurrentSignal({ type: 'bearish', text: 'SAR Flip to Bearish (Sell Signal)' });
        } else if (last.isUptrend) {
          setCurrentSignal({ type: 'bullish', text: 'Uptrend Active (SAR Below Price)' });
        } else {
          setCurrentSignal({ type: 'bearish', text: 'Downtrend Active (SAR Above Price)' });
        }
      }
    }

    // Set optimal margins
    const optimalMargins = calculateOptimalPriceMargins(bars, true);
    mainChart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: optimalMargins,
    });

    mainChart.timeScale().fitContent();

    // === INDICATOR PANE (for oscillators and separate-pane indicators) ===
    if (indicatorContainerRef.current && hasSeparatePane) {
      const indicatorChart = createChart(indicatorContainerRef.current, {
        width: indicatorContainerRef.current.clientWidth,
        height: indicatorHeight,
        layout: {
          background: { color: theme.background },
          textColor: theme.text,
        },
        grid: {
          vertLines: { color: theme.grid },
          horzLines: { color: theme.grid },
        },
        rightPriceScale: {
          visible: true,
          borderColor: theme.grid,
        },
        timeScale: {
          visible: true,
          borderVisible: true,
          borderColor: theme.grid,
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 1,
        },
      });

      indicatorChartRef.current = indicatorChart;

      if (indicator === 'macd') {
        const macdData = calculateMACD(bars, 12, 26, 9);

        if (macdData.length > 0) {
          // MACD Histogram
          const histogramSeries = indicatorChart.addSeries(HistogramSeries, {
            priceFormat: { type: 'price', precision: 4 },
            priceLineVisible: false,
          });
          histogramSeries.setData(macdData.map(p => ({
            time: p.time as Time,
            value: p.histogram,
            color: p.histogram >= 0 ? INDICATOR_CHART_COLORS.histogramUp : INDICATOR_CHART_COLORS.histogramDown,
          })));

          // MACD Line
          const macdLineSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.macdLine,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          macdLineSeries.setData(macdData.map(p => ({ time: p.time as Time, value: p.macd })));

          // Signal Line
          const signalLineSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.signalLine,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          signalLineSeries.setData(macdData.map(p => ({ time: p.time as Time, value: p.signal })));

          // Detect crossover
          if (macdData.length > 1) {
            const last = macdData[macdData.length - 1];
            const prev = macdData[macdData.length - 2];

            if (prev.macd < prev.signal && last.macd > last.signal) {
              setCurrentSignal({ type: 'bullish', text: 'MACD Bullish Crossover' });
            } else if (prev.macd > prev.signal && last.macd < last.signal) {
              setCurrentSignal({ type: 'bearish', text: 'MACD Bearish Crossover' });
            } else if (last.histogram > 0 && last.histogram > prev.histogram) {
              setCurrentSignal({ type: 'bullish', text: 'MACD Momentum Building' });
            } else if (last.histogram < 0 && last.histogram < prev.histogram) {
              setCurrentSignal({ type: 'bearish', text: 'MACD Momentum Declining' });
            }
          }
        }
      }

      if (indicator === 'rsi') {
        const rsiData = calculateRSI(bars, 14);

        if (rsiData.length > 0) {
          // Overbought line (70)
          const overboughtSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          overboughtSeries.setData(rsiData.map(p => ({ time: p.time as Time, value: 70 })));

          // Oversold line (30)
          const oversoldSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          oversoldSeries.setData(rsiData.map(p => ({ time: p.time as Time, value: 30 })));

          // RSI Line
          const rsiSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.rsiLine,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          rsiSeries.setData(rsiData.map(p => ({ time: p.time as Time, value: p.value })));

          // Detect RSI levels
          const lastRSI = rsiData[rsiData.length - 1].value;
          if (lastRSI > 70) {
            setCurrentSignal({ type: 'bearish', text: `RSI Overbought (${lastRSI.toFixed(1)})` });
          } else if (lastRSI < 30) {
            setCurrentSignal({ type: 'bullish', text: `RSI Oversold (${lastRSI.toFixed(1)})` });
          } else if (lastRSI > 50) {
            setCurrentSignal({ type: 'bullish', text: `RSI Bullish (${lastRSI.toFixed(1)})` });
          } else {
            setCurrentSignal({ type: 'bearish', text: `RSI Bearish (${lastRSI.toFixed(1)})` });
          }
        }

        // Set RSI scale to 0-100
        indicatorChart.priceScale('right').applyOptions({
          autoScale: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });
      }

      // === STOCHASTIC OSCILLATOR ===
      if (indicator === 'stochastic') {
        const stochData = calculateStochastic(bars, 14, 3);
        
        if (stochData.length > 0) {
          // Overbought line (80)
          const overboughtSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          overboughtSeries.setData(stochData.map(p => ({ time: p.time as Time, value: 80 })));

          // Oversold line (20)
          const oversoldSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          oversoldSeries.setData(stochData.map(p => ({ time: p.time as Time, value: 20 })));

          // %K Line (fast)
          const kSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.stochasticK,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          kSeries.setData(stochData.map(p => ({ time: p.time as Time, value: p.k })));

          // %D Line (slow/signal)
          const dSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.stochasticD,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          dSeries.setData(stochData.map(p => ({ time: p.time as Time, value: p.d })));

          // Detect signals
          const last = stochData[stochData.length - 1];
          const prev = stochData.length > 1 ? stochData[stochData.length - 2] : null;
          
          if (prev && prev.k < prev.d && last.k > last.d && last.k < 20) {
            setCurrentSignal({ type: 'bullish', text: 'Bullish Crossover in Oversold Zone' });
          } else if (prev && prev.k > prev.d && last.k < last.d && last.k > 80) {
            setCurrentSignal({ type: 'bearish', text: 'Bearish Crossover in Overbought Zone' });
          } else if (last.k > 80) {
            setCurrentSignal({ type: 'bearish', text: `Overbought (%K: ${last.k.toFixed(1)})` });
          } else if (last.k < 20) {
            setCurrentSignal({ type: 'bullish', text: `Oversold (%K: ${last.k.toFixed(1)})` });
          }
        }

        indicatorChart.priceScale('right').applyOptions({
          autoScale: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });
      }

      // === WILLIAMS %R ===
      if (indicator === 'williams-r') {
        const williamsData = calculateWilliamsR(bars, 14);
        
        if (williamsData.length > 0) {
          // Overbought line (-20)
          const overboughtSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          overboughtSeries.setData(williamsData.map(p => ({ time: p.time as Time, value: -20 })));

          // Oversold line (-80)
          const oversoldSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          oversoldSeries.setData(williamsData.map(p => ({ time: p.time as Time, value: -80 })));

          // Williams %R Line
          const wrSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.williamsR,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          wrSeries.setData(williamsData.map(p => ({ time: p.time as Time, value: p.value })));

          const lastWR = williamsData[williamsData.length - 1].value;
          if (lastWR > -20) {
            setCurrentSignal({ type: 'bearish', text: `Overbought (%R: ${lastWR.toFixed(1)})` });
          } else if (lastWR < -80) {
            setCurrentSignal({ type: 'bullish', text: `Oversold (%R: ${lastWR.toFixed(1)})` });
          }
        }

        indicatorChart.priceScale('right').applyOptions({
          autoScale: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });
      }

      // === CCI (Commodity Channel Index) ===
      if (indicator === 'cci') {
        const cciData = calculateCCI(bars, 20);
        
        if (cciData.length > 0) {
          // +100 line
          const upperSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          upperSeries.setData(cciData.map(p => ({ time: p.time as Time, value: 100 })));

          // -100 line
          const lowerSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lowerSeries.setData(cciData.map(p => ({ time: p.time as Time, value: -100 })));

          // Zero line
          const zeroSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(156, 163, 175, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          zeroSeries.setData(cciData.map(p => ({ time: p.time as Time, value: 0 })));

          // CCI Line
          const cciSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.cci,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          cciSeries.setData(cciData.map(p => ({ time: p.time as Time, value: p.value })));

          const lastCCI = cciData[cciData.length - 1].value;
          if (lastCCI > 100) {
            setCurrentSignal({ type: 'bullish', text: `Strong Uptrend (CCI: ${lastCCI.toFixed(0)})` });
          } else if (lastCCI < -100) {
            setCurrentSignal({ type: 'bearish', text: `Strong Downtrend (CCI: ${lastCCI.toFixed(0)})` });
          } else if (lastCCI > 0) {
            setCurrentSignal({ type: 'bullish', text: `Bullish (CCI: ${lastCCI.toFixed(0)})` });
          } else {
            setCurrentSignal({ type: 'bearish', text: `Bearish (CCI: ${lastCCI.toFixed(0)})` });
          }
        }
      }

      // === ADX (Average Directional Index) ===
      if (indicator === 'adx') {
        const adxData = calculateADX(bars, 14);
        
        if (adxData.length > 0) {
          // Trend threshold line (25)
          const thresholdSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(156, 163, 175, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          thresholdSeries.setData(adxData.map(p => ({ time: p.time as Time, value: 25 })));

          // +DI Line
          const plusDISeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.plusDI,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          plusDISeries.setData(adxData.map(p => ({ time: p.time as Time, value: p.plusDI })));

          // -DI Line
          const minusDISeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.minusDI,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          minusDISeries.setData(adxData.map(p => ({ time: p.time as Time, value: p.minusDI })));

          // ADX Line
          const adxSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.adxLine,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          adxSeries.setData(adxData.map(p => ({ time: p.time as Time, value: p.adx })));

          const last = adxData[adxData.length - 1];
          if (last.adx > 25 && last.plusDI > last.minusDI) {
            setCurrentSignal({ type: 'bullish', text: `Strong Bullish Trend (ADX: ${last.adx.toFixed(0)})` });
          } else if (last.adx > 25 && last.minusDI > last.plusDI) {
            setCurrentSignal({ type: 'bearish', text: `Strong Bearish Trend (ADX: ${last.adx.toFixed(0)})` });
          } else {
            setCurrentSignal({ type: 'neutral', text: `Weak/No Trend (ADX: ${last.adx.toFixed(0)})` });
          }
        }
      }

      // === ATR (Average True Range) ===
      if (indicator === 'atr') {
        const atrData = calculateATR(bars, 14);
        
        if (atrData.length > 0) {
          const atrSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.atr,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          atrSeries.setData(atrData.map(p => ({ time: p.time as Time, value: p.value })));

          // Calculate ATR percentile for signal
          const recentATR = atrData.slice(-20);
          const avgATR = recentATR.reduce((sum, p) => sum + p.value, 0) / recentATR.length;
          const lastATR = atrData[atrData.length - 1].value;
          
          if (lastATR > avgATR * 1.5) {
            setCurrentSignal({ type: 'neutral', text: `High Volatility (ATR: ${lastATR.toFixed(2)})` });
          } else if (lastATR < avgATR * 0.5) {
            setCurrentSignal({ type: 'neutral', text: `Low Volatility - Squeeze (ATR: ${lastATR.toFixed(2)})` });
          } else {
            setCurrentSignal({ type: 'neutral', text: `Normal Volatility (ATR: ${lastATR.toFixed(2)})` });
          }
        }
      }

      // === OBV (On-Balance Volume) ===
      if (indicator === 'obv') {
        const obvData = calculateOBV(bars);
        
        if (obvData.length > 0) {
          const obvSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.obv,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          obvSeries.setData(obvData.map(p => ({ time: p.time as Time, value: p.value })));

          // Compare OBV trend to price trend
          const recentOBV = obvData.slice(-10);
          const obvTrend = recentOBV[recentOBV.length - 1].value > recentOBV[0].value;
          const recentBars = bars.slice(-10);
          const priceTrend = recentBars[recentBars.length - 1].c > recentBars[0].c;
          
          if (obvTrend && priceTrend) {
            setCurrentSignal({ type: 'bullish', text: 'OBV Confirms Uptrend' });
          } else if (!obvTrend && !priceTrend) {
            setCurrentSignal({ type: 'bearish', text: 'OBV Confirms Downtrend' });
          } else if (obvTrend && !priceTrend) {
            setCurrentSignal({ type: 'bullish', text: 'Bullish Divergence (OBV Rising, Price Falling)' });
          } else {
            setCurrentSignal({ type: 'bearish', text: 'Bearish Divergence (OBV Falling, Price Rising)' });
          }
        }
      }

      // === MFI (Money Flow Index) ===
      if (indicator === 'mfi') {
        const mfiData = calculateMFI(bars, 14);
        
        if (mfiData.length > 0) {
          // Overbought line (80)
          const overboughtSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          overboughtSeries.setData(mfiData.map(p => ({ time: p.time as Time, value: 80 })));

          // Oversold line (20)
          const oversoldSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          oversoldSeries.setData(mfiData.map(p => ({ time: p.time as Time, value: 20 })));

          // MFI Line
          const mfiSeries = indicatorChart.addSeries(LineSeries, {
            color: INDICATOR_CHART_COLORS.mfi,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          });
          mfiSeries.setData(mfiData.map(p => ({ time: p.time as Time, value: p.value })));

          const lastMFI = mfiData[mfiData.length - 1].value;
          if (lastMFI > 80) {
            setCurrentSignal({ type: 'bearish', text: `Overbought - Heavy Buying (MFI: ${lastMFI.toFixed(0)})` });
          } else if (lastMFI < 20) {
            setCurrentSignal({ type: 'bullish', text: `Oversold - Heavy Selling (MFI: ${lastMFI.toFixed(0)})` });
          } else if (lastMFI > 50) {
            setCurrentSignal({ type: 'bullish', text: `Buying Pressure (MFI: ${lastMFI.toFixed(0)})` });
          } else {
            setCurrentSignal({ type: 'bearish', text: `Selling Pressure (MFI: ${lastMFI.toFixed(0)})` });
          }
        }

        indicatorChart.priceScale('right').applyOptions({
          autoScale: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });
      }

      // === ROC (Rate of Change) ===
      if (indicator === 'roc') {
        const rocData = calculateROC(bars, 12);
        
        if (rocData.length > 0) {
          // Zero line
          const zeroSeries = indicatorChart.addSeries(LineSeries, {
            color: 'rgba(156, 163, 175, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          zeroSeries.setData(rocData.map(p => ({ time: p.time as Time, value: 0 })));

          // ROC as histogram
          const rocSeries = indicatorChart.addSeries(HistogramSeries, {
            priceFormat: { type: 'price', precision: 2 },
            priceLineVisible: false,
          });
          rocSeries.setData(rocData.map(p => ({
            time: p.time as Time,
            value: p.value,
            color: p.value >= 0 ? INDICATOR_CHART_COLORS.histogramUp : INDICATOR_CHART_COLORS.histogramDown,
          })));

          const lastROC = rocData[rocData.length - 1].value;
          const prevROC = rocData.length > 1 ? rocData[rocData.length - 2].value : 0;
          
          if (lastROC > 0 && lastROC > prevROC) {
            setCurrentSignal({ type: 'bullish', text: `Accelerating Momentum (ROC: ${lastROC.toFixed(1)}%)` });
          } else if (lastROC > 0) {
            setCurrentSignal({ type: 'bullish', text: `Positive Momentum (ROC: ${lastROC.toFixed(1)}%)` });
          } else if (lastROC < 0 && lastROC < prevROC) {
            setCurrentSignal({ type: 'bearish', text: `Accelerating Decline (ROC: ${lastROC.toFixed(1)}%)` });
          } else {
            setCurrentSignal({ type: 'bearish', text: `Negative Momentum (ROC: ${lastROC.toFixed(1)}%)` });
          }
        }
      }

      indicatorChart.timeScale().fitContent();

      // Sync time scales
      mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && indicatorChartRef.current) {
          indicatorChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });

      indicatorChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && mainChartRef.current) {
          mainChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width;
        if (mainChartRef.current) {
          mainChartRef.current.applyOptions({ width });
        }
        if (indicatorChartRef.current) {
          indicatorChartRef.current.applyOptions({ width });
        }
      }
    });

    resizeObserver.observe(mainContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mainChartRef.current) {
        mainChartRef.current.remove();
        mainChartRef.current = null;
      }
      if (indicatorChartRef.current) {
        indicatorChartRef.current.remove();
        indicatorChartRef.current = null;
      }
    };
  }, [bars, indicator, mainHeight, indicatorHeight, showVolume]);

  if (!bars || bars.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center text-muted-foreground py-12">
          <Activity className="h-5 w-5 mr-2" />
          No chart data available
        </CardContent>
      </Card>
    );
  }

  const getIndicatorLabel = () => {
    switch (indicator) {
      case 'macd': return 'MACD (12, 26, 9)';
      case 'rsi': return 'RSI (14)';
      case 'ema-crossover': return 'EMA Crossover (12/26)';
      case 'sma-crossover': return 'SMA Crossover (50/200)';
      case 'bollinger': return 'Bollinger Bands (20, 2)';
      case 'donchian': return 'Donchian Channels (20)';
      case 'ichimoku': return 'Ichimoku Cloud';
      case 'stochastic': return 'Stochastic Oscillator (14, 3)';
      case 'williams-r': return 'Williams %R (14)';
      case 'cci': return 'CCI (20)';
      case 'adx': return 'ADX (14)';
      case 'atr': return 'ATR (14)';
      case 'obv': return 'On-Balance Volume';
      case 'mfi': return 'Money Flow Index (14)';
      case 'roc': return 'Rate of Change (12)';
      case 'parabolic-sar': return 'Parabolic SAR';
      case 'pivot-points': return 'Pivot Points';
      default: return indicator;
    }
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LineChart className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{title || getIndicatorLabel()}</CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {currentSignal && (
            <Badge 
              variant={currentSignal.type === 'bullish' ? 'default' : currentSignal.type === 'bearish' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {currentSignal.type === 'bullish' ? (
                <TrendingUp className="h-3 w-3" />
              ) : currentSignal.type === 'bearish' ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Activity className="h-3 w-3" />
              )}
              {currentSignal.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Main price chart */}
        <div
          ref={mainContainerRef}
          className="w-full"
          style={{ height: mainHeight }}
        />
        
        {/* Indicator pane (for MACD/RSI) */}
        {(indicator === 'macd' || indicator === 'rsi') && (
          <>
            <div className="border-t border-border/30" />
            <div className="px-3 py-1 bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              {getIndicatorLabel()}
            </div>
            <div
              ref={indicatorContainerRef}
              className="w-full"
              style={{ height: indicatorHeight }}
            />
          </>
        )}

        {/* Legend for overlay indicators */}
        {(indicator === 'ema-crossover' || indicator === 'sma-crossover' || indicator === 'bollinger' || indicator === 'donchian') && (
          <div className="px-3 py-2 bg-muted/20 flex items-center gap-4 text-xs border-t border-border/30">
            {indicator === 'ema-crossover' && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-orange-500 rounded" />
                  EMA 12
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-500 rounded" />
                  EMA 26
                </span>
              </>
            )}
            {indicator === 'sma-crossover' && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-500 rounded" />
                  SMA 50
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-purple-500 rounded" />
                  SMA 200
                </span>
              </>
            )}
            {indicator === 'bollinger' && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-gray-400 rounded" />
                  Upper/Lower Band
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-gray-500 rounded" style={{ borderStyle: 'dashed' }} />
                  SMA 20 (Middle)
                </span>
              </>
            )}
            {indicator === 'donchian' && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-green-500 rounded" />
                  20-Day High
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-500 rounded" style={{ borderStyle: 'dashed' }} />
                  Middle
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-red-500 rounded" />
                  20-Day Low
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StrategyIndicatorChart.displayName = 'StrategyIndicatorChart';

export default StrategyIndicatorChart;
