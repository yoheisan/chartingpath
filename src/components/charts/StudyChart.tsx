import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  SeriesMarkerShape,
} from 'lightweight-charts';
import { CompressedBar } from '@/types/VisualSpec';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateVWAP,
  calculateRSI,
  calculateMACD,
} from '@/utils/chartIndicators';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2, RotateCcw, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChartAnalysisSummary } from '@/components/copilot/ChartAnalysisSummary';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getThemeColors, 
  CANDLE_COLORS, 
  VOLUME_COLORS, 
  VOLUME_SCALE_MARGINS, 
  getVolumeColor,
  INDICATOR_COLORS,
  normalizeBarsForConsistentColoring,
  calculateOptimalPriceMargins,
  calculatePricePrecision,
} from './chartConstants';
import { ChartAnalysisToolbar } from './ChartAnalysisToolbar';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { cn } from '@/lib/utils';

export interface IndicatorSettings {
  ema20: boolean;
  ema50: boolean;
  sma200: boolean;
  bollingerBands: boolean;
  vwap: boolean;
  rsi: boolean;
  macd: boolean;
}

const DEFAULT_INDICATORS: IndicatorSettings = {
  ema20: true,
  ema50: true,
  sma200: true,
  bollingerBands: true,
  vwap: true,
  rsi: false,
  macd: false,
};

// Persist settings in localStorage
const STORAGE_KEY = 'chartingpath_study_indicators';

function loadIndicatorSettings(): IndicatorSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_INDICATORS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_INDICATORS;
}

function saveIndicatorSettings(settings: IndicatorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

interface TradePlanOverlay {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  direction?: 'long' | 'short';
}

/** External marker to render on the chart */
export interface ChartMarker {
  time: string; // ISO date string
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
  text: string;
}

interface StudyChartProps {
  bars: CompressedBar[];
  symbol: string;
  height?: number;
  /** If true, the chart will fill its parent container height and resize dynamically. */
  autoHeight?: boolean;
  /** Optional trade plan to render Entry/SL/TP price lines */
  tradePlan?: TradePlanOverlay;
  /** Timeframe for analysis (e.g., '1d', '4h') */
  timeframe?: string;
  /** Callback when user wants to send chart context to copilot */
  onSendToCopilot?: (context: string, analysis: import('@/hooks/useChartAnalysis').ChartAnalysisResult) => void;
  /** Hide analysis toolbar */
  hideAnalysisToolbar?: boolean;
  /** External markers to render on the chart (e.g., historical pattern occurrences) */
  chartMarkers?: ChartMarker[];
}

/**
 * StudyChart - Full-featured chart for study pages with toggleable indicators:
 * - Price ruler (right axis)
 * - Time series (bottom axis)
 * - EMA 20, EMA 50, SMA 200
 * - Bollinger Bands
 * - VWAP
 */
const StudyChart = memo(({ 
  bars, 
  symbol, 
  height, 
  autoHeight = false, 
  tradePlan,
  timeframe = '1d',
  onSendToCopilot,
  hideAnalysisToolbar = false,
  chartMarkers,
}: StudyChartProps) => {
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const rsiSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const macdHistSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicatorSettings);
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(true);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const isMobile = useIsMobile();
  const isPanningRef = useRef(false);
  const panStartYRef = useRef(0);
  const panStartPriceRef = useRef<{ from: number; to: number } | null>(null);
  const analysisLinesRef = useRef<any[]>([]);

  const fixedHeight = height ?? 350;

  // Chart analysis hook
  const analysis = useChartAnalysis({
    symbol,
    timeframe,
    onAnalysisComplete: useCallback((result) => {
      if (!isMobile) {
        setShowAnalysisDialog(true);
      }
    }, [isMobile]),
    onSendToCopilot
  });

  // Update bars in analysis hook when bars change
  useEffect(() => {
    if (bars && bars.length > 0) {
      analysis.setBars(bars);
    }
  }, [bars, analysis.setBars]);

  const handleToggle = (key: keyof IndicatorSettings) => {
    setIndicators((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveIndicatorSettings(updated);
      return updated;
    });
  };

  // Reset chart to auto-scale and fit content
  const handleResetChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.priceScale('right').applyOptions({
        autoScale: true,
      });
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !bars || bars.length === 0) return;

    // Use unified theme colors
    const theme = getThemeColors();

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Calculate representative price for precision
    const validCloses = bars.map(b => b.c).filter(Number.isFinite);
    const representativePrice = validCloses.length > 0 
      ? validCloses[validCloses.length - 1] 
      : 100;
    const { precision, minMove } = calculatePricePrecision(representativePrice);

    // Map i18n language code to locale for chart
    const getChartLocale = (lang: string): string => {
      const localeMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        pt: 'pt-BR',
        fr: 'fr-FR',
        zh: 'zh-CN',
        de: 'de-DE',
        hi: 'hi-IN',
        id: 'id-ID',
        it: 'it-IT',
        ja: 'ja-JP',
        ru: 'ru-RU',
        ar: 'ar-SA',
        af: 'af-ZA',
        ko: 'ko-KR',
        tr: 'tr-TR',
      };
      return localeMap[lang] || 'en-US';
    };

    // Calculate oscillator space to subtract from main chart
    const oscCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
    const oscHeight = oscCount * 100;

    const measuredHeight = autoHeight
      ? Math.floor((containerRef.current.getBoundingClientRect().height || 0))
      : fixedHeight - oscHeight;

    const initialHeight = Math.max(measuredHeight || fixedHeight, 250);

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: initialHeight,
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
        mode: 0, // Allow manual vertical scaling
        minimumWidth: 80,
      },
      timeScale: {
        visible: true,
        borderVisible: true,
        borderColor: theme.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: getChartLocale(i18n.language),
      },
      crosshair: {
        mode: 0,
      },
    });

    chartRef.current = chart;

    // Use unified candlestick colors with dynamic price precision
    const candleSeries = chart.addSeries(CandlestickSeries, {
      ...CANDLE_COLORS,
      priceFormat: {
        type: 'price',
        precision,
        minMove,
      },
    });
    
    // Store reference for price lines
    candleSeriesRef.current = candleSeries;

    // Normalize bars for consistent day-to-day coloring (green = up, red = down)
    const normalizedBars = normalizeBarsForConsistentColoring(bars);

    // Transform bars to lightweight-charts format
    const chartData: CandlestickData[] = normalizedBars
      .map((bar) => {
        const ts = Math.floor(new Date(bar.t).getTime() / 1000);
        return {
          time: ts as Time,
          open: bar.o,
          high: bar.h,
          low: bar.l,
          close: bar.c,
        };
      })
      .filter(
        (d) =>
          Number.isFinite(d.time as number) &&
          Number.isFinite(d.open) &&
          Number.isFinite(d.high) &&
          Number.isFinite(d.low) &&
          Number.isFinite(d.close)
      );

    candleSeries.setData(chartData);

    // Add volume histogram if volume data is available
    const hasVolume = bars.some(bar => bar.v && bar.v > 0);
    if (hasVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: VOLUME_COLORS.default,
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: VOLUME_SCALE_MARGINS.standard,
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

    // === TECHNICAL INDICATORS ===

    // EMA 20 (fast)
    if (indicators.ema20) {
      const ema20Data = calculateEMA(bars, 20);
      if (ema20Data.length > 0) {
        const ema20Series = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema20,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema20Series.setData(ema20Data.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }

    // EMA 50 (slow)
    if (indicators.ema50) {
      const ema50Data = calculateEMA(bars, 50);
      if (ema50Data.length > 0) {
        const ema50Series = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema50,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema50Series.setData(ema50Data.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }

    // SMA 200 (trend)
    if (indicators.sma200) {
      const sma200Data = calculateSMA(bars, 200);
      if (sma200Data.length > 0) {
        const sma200Series = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.sma200,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        sma200Series.setData(sma200Data.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }

    // Bollinger Bands (20, 2)
    if (indicators.bollingerBands) {
      const bbData = calculateBollingerBands(bars, 20, 2);
      if (bbData.length > 0) {
        const bbUpperSeries = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bollingerBands,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbUpperSeries.setData(bbData.map((p) => ({ time: p.time as Time, value: p.upper })));

        const bbLowerSeries = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bollingerBands,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbLowerSeries.setData(bbData.map((p) => ({ time: p.time as Time, value: p.lower })));
      }
    }

    // VWAP
    if (indicators.vwap) {
      const vwapData = calculateVWAP(bars);
      if (vwapData.length > 0) {
        const vwapSeries = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.vwap,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        vwapSeries.setData(vwapData.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }


    if (tradePlan) {
      // Entry line (amber/primary)
      candleSeries.createPriceLine({
        price: tradePlan.entry,
        color: '#f59e0b', // Amber for entry
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'Entry',
      });

      // Stop Loss line (red/destructive)
      candleSeries.createPriceLine({
        price: tradePlan.stopLoss,
        color: '#ef4444', // Red for SL
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'SL',
      });

      // Take Profit line (green/positive)
      candleSeries.createPriceLine({
        price: tradePlan.takeProfit,
        color: '#22c55e', // Green for TP
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'TP',
      });

      // Add Entry marker on the last bar
      if (chartData.length > 0) {
        const lastBar = chartData[chartData.length - 1];
        const isLong = tradePlan.direction === 'long';
        const markerShape: SeriesMarkerShape = isLong ? 'arrowUp' : 'arrowDown';
        try {
          createSeriesMarkers(candleSeries, [{
            time: lastBar.time,
            position: isLong ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: markerShape,
            text: 'Entry',
          }]);
        } catch {
          // Ignore marker errors
        }
      }
    }

    // Render external chart markers (e.g., historical pattern occurrences)
    if (chartMarkers && chartMarkers.length > 0 && chartData.length > 0) {
      try {
        const validMarkers = chartMarkers
          .map(m => {
            const dateStr = m.time.split('T')[0];
            return {
              time: dateStr as Time,
              position: m.position,
              color: m.color,
              shape: m.shape as SeriesMarkerShape,
              text: m.text,
            };
          })
          .sort((a, b) => (a.time as string).localeCompare(b.time as string));

        if (validMarkers.length > 0) {
          createSeriesMarkers(candleSeries, validMarkers);
        }
      } catch {
        // Ignore marker errors
      }
    }

    // Calculate optimal price margins based on data volatility
    // Ensures charts never look "flat" regardless of actual price movement
    // Reserve bottom space for oscillator panes (RSI, MACD)
    const hasOverlays = !!tradePlan;
    const optimalMargins = calculateOptimalPriceMargins(bars, hasOverlays);
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: optimalMargins,
    });

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;

      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);

      chartRef.current.applyOptions({
        width: nextWidth,
        ...(autoHeight
          ? { height: Math.max(nextHeight || initialHeight, 250) }
          : {}),
      });
      // Re-fit content so data fills the visible area after resize
      chartRef.current.timeScale().fitContent();
    });

    resizeObserver.observe(containerRef.current);

    // Shift+drag vertical panning handlers
    const container = containerRef.current;
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.shiftKey || e.button === 1) { // Shift+left-click or middle-mouse
        e.preventDefault();
        isPanningRef.current = true;
        panStartYRef.current = e.clientY;
        const priceScale = chart.priceScale('right');
        // Get current visible price range by querying chart's visible range
        const visibleRange = chart.timeScale().getVisibleLogicalRange();
        if (visibleRange) {
          // Store approximate vertical range for panning
          panStartPriceRef.current = { from: 0, to: 0 };
        }
        container.style.cursor = 'ns-resize';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current && chartRef.current) {
        const deltaY = e.clientY - panStartYRef.current;
        // Disable auto-scale when manually panning
        chartRef.current.priceScale('right').applyOptions({
          autoScale: false,
        });
        panStartYRef.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartPriceRef.current = null;
        container.style.cursor = '';
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [bars, fixedHeight, autoHeight, indicators.ema20, indicators.ema50, indicators.sma200, indicators.bollingerBands, indicators.vwap, indicators.rsi, indicators.macd, i18n.language, tradePlan, chartMarkers]);

  // === RSI Chart (separate instance) ===
  useEffect(() => {
    if (!rsiContainerRef.current || !bars || bars.length === 0 || !indicators.rsi) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const theme = getThemeColors();

    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 100,
      layout: { background: { color: theme.background }, textColor: theme.text },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      rightPriceScale: { borderColor: theme.grid, scaleMargins: { top: 0.1, bottom: 0.1 }, minimumWidth: 80 },
      timeScale: { visible: false },
      crosshair: { mode: 0 },
    });

    rsiChartRef.current = rsiChart;

    const rsiData = calculateRSI(bars, 14);
    if (rsiData.length > 0) {
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: INDICATOR_COLORS.rsi,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
      });
      rsiSeries.setData(rsiData.map(p => ({ time: p.time as Time, value: p.value })));
      rsiSeriesRef.current = rsiSeries;

      // Reference lines
      rsiSeries.createPriceLine({ price: 70, color: 'rgba(239,68,68,0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' });
      rsiSeries.createPriceLine({ price: 30, color: 'rgba(34,197,94,0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' });
      rsiSeries.createPriceLine({ price: 50, color: 'rgba(156,163,175,0.2)', lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: '' });
    }

    rsiChart.timeScale().fitContent();

    // Initial sync: match main chart's visible range immediately
    if (chartRef.current) {
      const mainRange = chartRef.current.timeScale().getVisibleLogicalRange();
      if (mainRange) {
        rsiChart.timeScale().setVisibleLogicalRange(mainRange);
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: Math.floor(entries[0].contentRect.width) });
      }
    });
    resizeObserver.observe(rsiContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
    };
  }, [bars, indicators.rsi, i18n.language]);

  // === MACD Chart (separate instance) ===
  useEffect(() => {
    if (!macdContainerRef.current || !bars || bars.length === 0 || !indicators.macd) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const theme = getThemeColors();

    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: 100,
      layout: { background: { color: theme.background }, textColor: theme.text },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      rightPriceScale: { borderColor: theme.grid, scaleMargins: { top: 0.1, bottom: 0.1 }, minimumWidth: 80 },
      timeScale: { visible: false },
      crosshair: { mode: 0 },
    });

    macdChartRef.current = macdChart;

    const macdData = calculateMACD(bars, 12, 26, 9);
    if (macdData.length > 0) {
      const macdHistSeries = macdChart.addSeries(HistogramSeries, {
        priceLineVisible: false,
        lastValueVisible: false,
      });
      macdHistSeries.setData(macdData.map(p => ({
        time: p.time as Time,
        value: p.histogram,
        color: p.histogram >= 0 ? INDICATOR_COLORS.macdHistogramUp : INDICATOR_COLORS.macdHistogramDown,
      })));
      macdHistSeriesRef.current = macdHistSeries;

      const macdLineSeries = macdChart.addSeries(LineSeries, {
        color: INDICATOR_COLORS.macdLine,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      macdLineSeries.setData(macdData.map(p => ({ time: p.time as Time, value: p.macd })));

      const macdSignalSeries = macdChart.addSeries(LineSeries, {
        color: INDICATOR_COLORS.macdSignal,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      macdSignalSeries.setData(macdData.map(p => ({ time: p.time as Time, value: p.signal })));

      // Zero line
      macdHistSeries.createPriceLine({ price: 0, color: 'rgba(156,163,175,0.2)', lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: '' });
    }

    macdChart.timeScale().fitContent();

    // Initial sync: match main chart's visible range immediately
    if (chartRef.current) {
      const mainRange = chartRef.current.timeScale().getVisibleLogicalRange();
      if (mainRange) {
        macdChart.timeScale().setVisibleLogicalRange(mainRange);
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: Math.floor(entries[0].contentRect.width) });
      }
    });
    resizeObserver.observe(macdContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
    };
  }, [bars, indicators.macd, i18n.language]);

  // === Crosshair Sync across all panes ===
  useEffect(() => {
    const mainChart = chartRef.current;
    const rsiChart = rsiChartRef.current;
    const macdChart = macdChartRef.current;
    if (!mainChart) return;

    const syncingRangeRef = { current: false };
    const syncingCrosshairRef = { current: false };

    // === Time Scale (scroll/zoom) Sync — main chart is the source of truth ===
    const mainRangeHandler = (range: any) => {
      if (syncingRangeRef.current || !range) return;
      syncingRangeRef.current = true;
      try {
        if (rsiChart) rsiChart.timeScale().setVisibleLogicalRange(range);
        if (macdChart) macdChart.timeScale().setVisibleLogicalRange(range);
      } finally { syncingRangeRef.current = false; }
    };
    mainChart.timeScale().subscribeVisibleLogicalRangeChange(mainRangeHandler);

    // Also let oscillator scroll propagate back to main + siblings
    const rsiRangeHandler = rsiChart ? (range: any) => {
      if (syncingRangeRef.current || !range) return;
      syncingRangeRef.current = true;
      try {
        mainChart.timeScale().setVisibleLogicalRange(range);
        if (macdChart) macdChart.timeScale().setVisibleLogicalRange(range);
      } finally { syncingRangeRef.current = false; }
    } : undefined;
    if (rsiChart && rsiRangeHandler) rsiChart.timeScale().subscribeVisibleLogicalRangeChange(rsiRangeHandler);

    const macdRangeHandler = macdChart ? (range: any) => {
      if (syncingRangeRef.current || !range) return;
      syncingRangeRef.current = true;
      try {
        mainChart.timeScale().setVisibleLogicalRange(range);
        if (rsiChart) rsiChart.timeScale().setVisibleLogicalRange(range);
      } finally { syncingRangeRef.current = false; }
    } : undefined;
    if (macdChart && macdRangeHandler) macdChart.timeScale().subscribeVisibleLogicalRangeChange(macdRangeHandler);

    // === Crosshair Sync ===
    const getCrosshairDataPoint = (series: any, param: any) => {
      if (!param || !param.time || !param.seriesData) return null;
      const data = param.seriesData.get(series);
      if (!data) return null;
      return { time: param.time, value: (data as any).value ?? (data as any).close ?? 0 };
    };

    const mainCrosshairHandler = (param: any) => {
      if (syncingCrosshairRef.current) return;
      syncingCrosshairRef.current = true;
      try {
        const dp = getCrosshairDataPoint(candleSeriesRef.current, param);
        if (dp) {
          if (rsiChart && rsiSeriesRef.current) rsiChart.setCrosshairPosition(NaN, dp.time, rsiSeriesRef.current);
          if (macdChart && macdHistSeriesRef.current) macdChart.setCrosshairPosition(NaN, dp.time, macdHistSeriesRef.current);
        } else {
          rsiChart?.clearCrosshairPosition();
          macdChart?.clearCrosshairPosition();
        }
      } finally { syncingCrosshairRef.current = false; }
    };
    mainChart.subscribeCrosshairMove(mainCrosshairHandler);

    let rsiCrosshairHandler: ((param: any) => void) | undefined;
    if (rsiChart && rsiSeriesRef.current) {
      rsiCrosshairHandler = (param: any) => {
        if (syncingCrosshairRef.current) return;
        syncingCrosshairRef.current = true;
        try {
          const dp = getCrosshairDataPoint(rsiSeriesRef.current, param);
          if (dp) {
            if (candleSeriesRef.current) mainChart.setCrosshairPosition(NaN, dp.time, candleSeriesRef.current);
            if (macdChart && macdHistSeriesRef.current) macdChart.setCrosshairPosition(NaN, dp.time, macdHistSeriesRef.current);
          } else {
            mainChart.clearCrosshairPosition();
            macdChart?.clearCrosshairPosition();
          }
        } finally { syncingCrosshairRef.current = false; }
      };
      rsiChart.subscribeCrosshairMove(rsiCrosshairHandler);
    }

    let macdCrosshairHandler: ((param: any) => void) | undefined;
    if (macdChart && macdHistSeriesRef.current) {
      macdCrosshairHandler = (param: any) => {
        if (syncingCrosshairRef.current) return;
        syncingCrosshairRef.current = true;
        try {
          const dp = getCrosshairDataPoint(macdHistSeriesRef.current, param);
          if (dp) {
            if (candleSeriesRef.current) mainChart.setCrosshairPosition(NaN, dp.time, candleSeriesRef.current);
            if (rsiChart && rsiSeriesRef.current) rsiChart.setCrosshairPosition(NaN, dp.time, rsiSeriesRef.current);
          } else {
            mainChart.clearCrosshairPosition();
            rsiChart?.clearCrosshairPosition();
          }
        } finally { syncingCrosshairRef.current = false; }
      };
      macdChart.subscribeCrosshairMove(macdCrosshairHandler);
    }

    return () => {
      mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(mainRangeHandler);
      mainChart.unsubscribeCrosshairMove(mainCrosshairHandler);
      if (rsiChart) {
        if (rsiRangeHandler) rsiChart.timeScale().unsubscribeVisibleLogicalRangeChange(rsiRangeHandler);
        if (rsiCrosshairHandler) rsiChart.unsubscribeCrosshairMove(rsiCrosshairHandler);
      }
      if (macdChart) {
        if (macdRangeHandler) macdChart.timeScale().unsubscribeVisibleLogicalRangeChange(macdRangeHandler);
        if (macdCrosshairHandler) macdChart.unsubscribeCrosshairMove(macdCrosshairHandler);
      }
    };
  }, [bars, indicators.rsi, indicators.macd]);

  // Effect to draw/remove analysis overlay lines
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    
    // Remove existing lines first
    analysisLinesRef.current.forEach(line => {
      try { candleSeriesRef.current?.removePriceLine(line); } catch {}
    });
    analysisLinesRef.current = [];
    
    // Don't draw if overlay is off or no analysis
    if (!showAnalysisOverlay || !analysis.analysisResult) return;
    
    const result = analysis.analysisResult;
    const lines: any[] = [];
    
    // Support line (green, dashed)
    if (result.priceAnalysis.support > 0) {
      const supportLine = candleSeriesRef.current.createPriceLine({
        price: result.priceAnalysis.support,
        color: '#22c55e',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Support',
      });
      lines.push(supportLine);
    }
    
    // Resistance line (red, dashed)
    if (result.priceAnalysis.resistance > 0) {
      const resistanceLine = candleSeriesRef.current.createPriceLine({
        price: result.priceAnalysis.resistance,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Resistance',
      });
      lines.push(resistanceLine);
    }
    
    // Key levels from risk assessment
    if (result.riskAssessment.keyLevels) {
      result.riskAssessment.keyLevels.slice(0, 3).forEach((level, i) => {
        const levelLine = candleSeriesRef.current?.createPriceLine({
          price: level.level,
          color: level.type === 'support' ? '#22c55e80' : level.type === 'resistance' ? '#ef444480' : '#f59e0b80',
          lineWidth: 1,
          lineStyle: 3, // Dotted
          axisLabelVisible: false,
          title: '',
        });
        if (levelLine) lines.push(levelLine);
      });
    }
    
    // Best trading scenario entry/SL/TP
    const scenario = result.priceAnalysis.trend === 'bullish' 
      ? result.tradingScenarios.bullish 
      : result.tradingScenarios.bearish;
    
    if (scenario && scenario.entry > 0) {
      // Entry (amber)
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: scenario.entry,
        color: '#f59e0b',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'Entry',
      });
      lines.push(entryLine);
      
      // Stop Loss (red)
      if (scenario.stopLoss > 0) {
        const slLine = candleSeriesRef.current.createPriceLine({
          price: scenario.stopLoss,
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'SL',
        });
        lines.push(slLine);
      }
      
      // Take Profit (green)
      if (scenario.takeProfit > 0) {
        const tpLine = candleSeriesRef.current.createPriceLine({
          price: scenario.takeProfit,
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'TP',
        });
        lines.push(tpLine);
      }
    }
    
    analysisLinesRef.current = lines;
  }, [showAnalysisOverlay, analysis.analysisResult]);

  if (!bars || bars.length === 0) {
    return (
      <div
        className="w-full bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-sm"
        style={autoHeight ? undefined : { height: fixedHeight }}
      >
        No price data available
      </div>
    );
  }

  // Count active indicators for legend
  const activeIndicators = Object.entries(indicators).filter(([, v]) => v);

  const oscillatorCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
  const oscillatorHeight = oscillatorCount * 100; // 100px per oscillator pane

  return (
    <>
    <div className={cn('flex flex-col overflow-hidden', autoHeight && 'h-full')}>
      <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className={cn(
          'w-full h-full overflow-hidden border border-border/50',
          (indicators.rsi || indicators.macd) ? 'rounded-t' : 'rounded'
        )}
      />

      {/* Chart Analysis Toolbar */}
      {!hideAnalysisToolbar && onSendToCopilot && (
        <ChartAnalysisToolbar
          selectionMode={analysis.selectionMode}
          isAnalyzing={analysis.isAnalyzing}
          hasSelection={analysis.selectedBars.length > 0}
          hasAnalysis={!!analysis.analysisResult}
          showOverlay={showAnalysisOverlay}
          onToggleOverlay={setShowAnalysisOverlay}
          onStartRangeSelection={analysis.startRangeSelection}
          onSelectVisible={analysis.analyzeVisibleChart}
          onSelectPattern={analysis.selectPatternContext}
          onAnalyze={analysis.analyzeSelection}
          onSendToCopilot={analysis.sendToCopilot}
          onClear={() => {
            analysis.clearSelection();
            // Remove analysis lines when clearing
            analysisLinesRef.current.forEach(line => {
              try { candleSeriesRef.current?.removePriceLine(line); } catch {}
            });
            analysisLinesRef.current = [];
          }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30"
        />
      )}

      {/* Indicator Legend - only show active ones */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[10px] pointer-events-none">
        {indicators.ema20 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-orange-500">
            EMA 20
          </span>
        )}
        {indicators.ema50 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-blue-500">
            EMA 50
          </span>
        )}
        {indicators.sma200 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-purple-500">
            SMA 200
          </span>
        )}
        {indicators.bollingerBands && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-gray-400">
            BB(20,2)
          </span>
        )}
        {indicators.vwap && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-cyan-500">
            VWAP
          </span>
        )}
        {indicators.rsi && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-yellow-500">
            RSI(14)
          </span>
        )}
        {indicators.macd && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-blue-400">
            MACD
          </span>
        )}
      </div>

      {/* Analysis Overlay Legend */}
      {showAnalysisOverlay && analysis.analysisResult && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-emerald-500/30 text-emerald-500">
            Support / TP
          </span>
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-red-500/30 text-red-500">
            Resistance / SL
          </span>
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-amber-500/30 text-amber-500">
            Entry
          </span>
        </div>
      )}
      <div className="hidden md:flex absolute bottom-2 left-2 items-center gap-1 text-[10px] text-muted-foreground/70 pointer-events-none">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 pointer-events-auto cursor-help">
                <kbd className="px-1 py-0.5 bg-muted/50 border border-border/50 rounded text-[9px] font-mono">Shift</kbd>
                <span>+ drag to pan</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              Hold <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono mx-0.5">Shift</kbd> + left-click drag to move the chart up/down. Or use middle-mouse drag.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Reset Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-2 right-2 h-6 w-6 bg-background/90 border-border/50 hover:bg-background z-20"
              onClick={handleResetChart}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Reset chart (fit content &amp; auto-scale)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Settings Button */}
      <div className="absolute top-2 right-2 z-20">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 bg-background/90 border-border/50 hover:bg-background"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Indicators</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-3 bg-popover border border-border shadow-lg z-50" 
            align="end"
            sideOffset={4}
          >
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Toggle Indicators
              </p>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ema20" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    EMA 20
                  </Label>
                  <Switch
                    id="ema20"
                    checked={indicators.ema20}
                    onCheckedChange={() => handleToggle('ema20')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ema50" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    EMA 50
                  </Label>
                  <Switch
                    id="ema50"
                    checked={indicators.ema50}
                    onCheckedChange={() => handleToggle('ema50')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sma200" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    SMA 200
                  </Label>
                  <Switch
                    id="sma200"
                    checked={indicators.sma200}
                    onCheckedChange={() => handleToggle('sma200')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bb" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Bollinger Bands
                  </Label>
                  <Switch
                    id="bb"
                    checked={indicators.bollingerBands}
                    onCheckedChange={() => handleToggle('bollingerBands')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vwap" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    VWAP
                  </Label>
                  <Switch
                    id="vwap"
                    checked={indicators.vwap}
                    onCheckedChange={() => handleToggle('vwap')}
                  />
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
                    Oscillators
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="rsi" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    RSI (14)
                  </Label>
                  <Switch
                    id="rsi"
                    checked={indicators.rsi}
                    onCheckedChange={() => handleToggle('rsi')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="macd" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    MACD (12,26,9)
                  </Label>
                  <Switch
                    id="macd"
                    checked={indicators.macd}
                    onCheckedChange={() => handleToggle('macd')}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  {activeIndicators.length} of {Object.keys(indicators).length} indicators active
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      </div>

      {/* RSI Oscillator Pane */}
      {indicators.rsi && bars && bars.length > 0 && (
        <div className="relative flex-shrink-0">
          <div className="absolute top-1 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-yellow-500 pointer-events-none">
            RSI(14)
          </div>
          <div
            ref={rsiContainerRef}
            className="w-full border-x border-b border-border/50 overflow-hidden"
            style={{ height: 100 }}
          />
        </div>
      )}

      {/* MACD Oscillator Pane */}
      {indicators.macd && bars && bars.length > 0 && (
        <div className="relative flex-shrink-0">
          <div className="absolute top-1 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-blue-400 pointer-events-none">
            MACD(12,26,9)
          </div>
          <div
            ref={macdContainerRef}
            className="w-full border-x border-b border-border/50 rounded-b overflow-hidden"
            style={{ height: 100 }}
          />
        </div>
      )}
    </div>

      {/* Analysis Result Dialog - Desktop only */}
      {!isMobile && (
        <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-base">Chart Analysis</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-3">
              {analysis.analysisResult && (
                <ChartAnalysisSummary analysis={analysis.analysisResult} />
              )}
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-2 border-t">
              {onSendToCopilot && (
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAnalysisDialog(false);
                  analysis.sendToCopilot();
                }}>
                  Ask Copilot
                </Button>
              )}
              <Button size="sm" onClick={() => setShowAnalysisDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

StudyChart.displayName = 'StudyChart';

export default StudyChart;
