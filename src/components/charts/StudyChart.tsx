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
import { FormationOverlayData, buildZonePoints, snapFormationToChartTimes, findNearestCandleTime } from '@/utils/formationOverlay';
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
import { CardCaptureButton } from '@/components/capture/CardCaptureButton';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { cn } from '@/lib/utils';
import {
  HistoricalPatternOverlay,
  PatternOverlayToggles,
  DEFAULT_PATTERN_OVERLAY_TOGGLES,
  loadPatternOverlayToggles,
  savePatternOverlayToggles,
  renderPatternPriceLines,
  generatePatternMarkers,
  drawPatternZones,
  PATTERN_OVERLAY_COLORS,
} from './PatternOverlayRenderer';
import { PatternOverlayTogglePanel } from './PatternOverlayTogglePanel';
import { deriveFormationOverlay } from '@/utils/formationOverlay';

export interface IndicatorSettings {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  bollingerBands: boolean;
  vwap: boolean;
  rsi: boolean;
  macd: boolean;
}

const DEFAULT_INDICATORS: IndicatorSettings = {
  ema20: false,
  ema50: true,
  ema200: true,
  bollingerBands: false,
  vwap: false,
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

type TimeLike = Time | string | number | { year: number; month: number; day: number };

function toUnixTimeKey(time: TimeLike): number | null {
  if (typeof time === 'number') {
    return Number.isFinite(time) ? time : null;
  }

  if (typeof time === 'string') {
    const parsed = Date.parse(time.includes('T') ? time : `${time}T00:00:00Z`);
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
  }

  if (time && typeof time === 'object' && 'year' in time && 'month' in time && 'day' in time) {
    const ts = Date.UTC(time.year, time.month - 1, time.day);
    return Number.isFinite(ts) ? Math.floor(ts / 1000) : null;
  }

  return null;
}

function sanitizeSeriesData<T extends { time: Time }>(data: T[]): T[] {
  const byTime = new Map<number, T>();

  for (const point of data) {
    const timeKey = toUnixTimeKey(point.time as TimeLike);
    if (timeKey == null) continue;

    // Keep the latest point for duplicated timestamps.
    byTime.set(timeKey, point);
  }

  return [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, value]) => value);
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
  /** Formation overlays (zigzag, trendlines) to render on the chart */
  formationOverlays?: FormationOverlayData[];
  /** Historical pattern occurrences to render as overlays with toggleable layers */
  historicalPatterns?: HistoricalPatternOverlay[];
  /** Number of recent bars to show initially instead of fitting all content. Enables focused zoom. */
  initialVisibleBars?: number;
}

/**
 * StudyChart - Full-featured chart for study pages with toggleable indicators:
 * - Price ruler (right axis)
 * - Time series (bottom axis)
 * - EMA 20, EMA 50, EMA 200
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
  formationOverlays,
  historicalPatterns,
  initialVisibleBars,
}: StudyChartProps) => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const rsiSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const macdHistSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const syncingRangeRef = useRef(false);
  const syncingCrosshairRef = useRef(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicatorSettings);
  const [patternToggles, setPatternToggles] = useState<PatternOverlayToggles>(loadPatternOverlayToggles);
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(true);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const isMobile = useIsMobile();
  const isPanningRef = useRef(false);
  const panStartYRef = useRef(0);
  const panStartPriceRef = useRef<{ from: number; to: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const analysisLinesRef = useRef<any[]>([]);
  const patternLinesCleanupsRef = useRef<(() => void)[]>([]);
  const persistedVisibleRangeRef = useRef<{ from: Time; to: Time } | null>(null);
  const persistedVisibleLogicalRangeRef = useRef<{ from: number; to: number } | null>(null);
  const lastViewportKeyRef = useRef<string>('');

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

  // Reset persisted viewport when symbol/timeframe changes to avoid carrying stale pan offsets
  useEffect(() => {
    const viewportKey = `${symbol}:${timeframe}`;
    if (lastViewportKeyRef.current && lastViewportKeyRef.current !== viewportKey) {
      persistedVisibleLogicalRangeRef.current = null;
      persistedVisibleRangeRef.current = null;
    }
    lastViewportKeyRef.current = viewportKey;
  }, [symbol, timeframe]);

  const handleToggle = (key: keyof IndicatorSettings) => {
    setIndicators((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveIndicatorSettings(updated);
      return updated;
    });
  };

  const handlePatternToggle = useCallback((key: keyof PatternOverlayToggles) => {
    setPatternToggles((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePatternOverlayToggles(updated);
      return updated;
    });
  }, []);

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

    // Chart height - subtract space for oscillator panes
    const oscillatorCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
    const oscillatorHeight = oscillatorCount * 100;
    const measuredHeight = autoHeight
      ? Math.floor((containerRef.current.getBoundingClientRect().height || 0)) - oscillatorHeight
      : fixedHeight - oscillatorHeight;

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
        minimumWidth: 85,
      },
      timeScale: {
        visible: true,
        borderVisible: true,
        borderColor: theme.grid,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        rightBarStaysOnScroll: false,
        fixRightEdge: false,
        shiftVisibleRangeOnNewBar: true,
        allowShiftVisibleRangeOnWhitespaceReplacement: true,
        barSpacing: 12,
        minBarSpacing: 2,
      },
      localization: {
      },
      crosshair: {
        mode: 0,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
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
      // Extend autoscale to include trade plan price levels (Entry, SL, TP)
      // while preserving the base candle autoscale range for visible bars.
      ...(tradePlan ? {
        autoscaleInfoProvider: (baseImplementation) => {
          const baseInfo = baseImplementation();
          const prices = [tradePlan.entry, tradePlan.stopLoss, tradePlan.takeProfit].filter(Number.isFinite);

          if (prices.length === 0) return baseInfo;

          const minTrade = Math.min(...prices);
          const maxTrade = Math.max(...prices);

          if (!baseInfo?.priceRange) {
            return {
              priceRange: {
                minValue: minTrade,
                maxValue: maxTrade,
              },
            };
          }

          return {
            ...baseInfo,
            priceRange: {
              minValue: Math.min(baseInfo.priceRange.minValue, minTrade),
              maxValue: Math.max(baseInfo.priceRange.maxValue, maxTrade),
            },
          };
        },
      } : {}),
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

    const safeChartData = sanitizeSeriesData(chartData);
    candleSeries.setData(safeChartData);

    const normalizedBarByTime = new Map<number, (typeof normalizedBars)[number]>();
    for (const bar of normalizedBars) {
      const ts = Math.floor(new Date(bar.t).getTime() / 1000);
      if (Number.isFinite(ts)) {
        normalizedBarByTime.set(ts, bar);
      }
    }

    // Original (un-normalized) bar map for marker price snapping.
    // normalizeBarsForConsistentColoring inflates h/l via Math.max(bar.h, prevClose, bar.c),
    // which causes markers to float above/below visible candle extremes.
    const originalBarByTime = new Map<number, (typeof bars)[number]>();
    for (const bar of bars) {
      const ts = Math.floor(new Date(bar.t).getTime() / 1000);
      if (Number.isFinite(ts)) {
        originalBarByTime.set(ts, bar);
      }
    }

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

      const volumeData = safeChartData.map((d) => {
        const bar = bars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
        const isUp = bar ? bar.c >= bar.o : true;
        return {
          time: d.time,
          value: bar?.v || 0,
          color: getVolumeColor(isUp),
        };
      });

      volumeSeries.setData(sanitizeSeriesData(volumeData));
    }

    // === TECHNICAL INDICATORS (skip on shared/clean views) ===
    if (!hideAnalysisToolbar) {

    // EMA 20 (fast)
    if (indicators.ema20) {
      const ema20Data = calculateEMA(bars, 20);
      if (ema20Data.length > 0) {
        const ema20Series = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema20,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        });
        ema20Series.setData(sanitizeSeriesData(ema20Data.map((p) => ({ time: p.time as Time, value: p.value }))));
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
          autoscaleInfoProvider: () => null,
        });
        ema50Series.setData(sanitizeSeriesData(ema50Data.map((p) => ({ time: p.time as Time, value: p.value }))));
      }
    }

    // EMA 200 (trend)
    if (indicators.ema200) {
      const ema200Data = calculateEMA(bars, 200);
      if (ema200Data.length > 0) {
        const ema200Series = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema200,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        });
        ema200Series.setData(sanitizeSeriesData(ema200Data.map((p) => ({ time: p.time as Time, value: p.value }))));
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
          autoscaleInfoProvider: () => null,
        });
        bbUpperSeries.setData(sanitizeSeriesData(bbData.map((p) => ({ time: p.time as Time, value: p.upper }))));

        const bbLowerSeries = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bollingerBands,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        });
        bbLowerSeries.setData(sanitizeSeriesData(bbData.map((p) => ({ time: p.time as Time, value: p.lower }))));
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
          autoscaleInfoProvider: () => null,
        });
        vwapSeries.setData(sanitizeSeriesData(vwapData.map((p) => ({ time: p.time as Time, value: p.value }))));
      }
    }

    } // end !hideAnalysisToolbar

// findNearestCandleTime is now imported from @/utils/formationOverlay

    const shouldRenderStandaloneTradePlan = !!tradePlan && !(historicalPatterns && historicalPatterns.length > 0 && patternToggles.showPatterns);

    if (shouldRenderStandaloneTradePlan) {
      // Entry line — solid blue (matches X post SVG style)
      candleSeries.createPriceLine({
        price: tradePlan.entry,
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'ENTRY',
      });

      // Stop Loss line — dashed red
      candleSeries.createPriceLine({
        price: tradePlan.stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'SL',
      });

      // Take Profit line — dashed green
      candleSeries.createPriceLine({
        price: tradePlan.takeProfit,
        color: '#22c55e',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'TP',
      });

      // Standalone entry marker — skip if historical patterns will render their own
      // (historical patterns path draws canvas triangles at the correct entry price)

    }

    // Render external chart markers ONLY when historicalPatterns won't merge them later
    // (historicalPatterns path calls createSeriesMarkers which overwrites any previous call)
    const hasHistoricalOverlays = historicalPatterns && historicalPatterns.length > 0 && patternToggles.showPatterns;
    if (!hasHistoricalOverlays && chartMarkers && chartMarkers.length > 0 && safeChartData.length > 0) {
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

    // === FORMATION OVERLAYS (auto-detected patterns) ===
    if (formationOverlays && formationOverlays.length > 0) {
      for (const rawFormation of formationOverlays) {
        const formation = snapFormationToChartTimes(rawFormation, safeChartData);
        if (formation.zigzag.length >= 2) {
          const zigzagSeries = chart.addSeries(LineSeries, {
            color: 'rgba(0, 200, 255, 0.85)',
            lineWidth: 2,
            lineStyle: 0,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            autoscaleInfoProvider: () => null,
          });
          zigzagSeries.setData(sanitizeSeriesData(formation.zigzag as Array<{ time: Time; value: number }>));
        }

        if (formation.upperTrend.length >= 2) {
          const upperSeries = chart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.6)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            autoscaleInfoProvider: () => null,
          });
          upperSeries.setData(sanitizeSeriesData(formation.upperTrend as Array<{ time: Time; value: number }>));
        }

        if (formation.lowerTrend.length >= 2) {
          const lowerSeries = chart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.6)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            autoscaleInfoProvider: () => null,
          });
          lowerSeries.setData(sanitizeSeriesData(formation.lowerTrend as Array<{ time: Time; value: number }>));
        }

        // Shaded formation zone (canvas overlay)
        // Skip standalone canvas handler when historical patterns are present —
        // the unified drawHistoricalPatternOverlay will handle formation zones + triangles
        if (formation.hasZone && !hasHistoricalOverlays) {
          const zonePoints = buildZonePoints(formation.upperTrend, formation.lowerTrend);
          if (zonePoints.length >= 2) {
            const drawZone = () => {
              const canvas = canvasOverlayRef.current;
              if (!canvas || !chartRef.current) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              const chartEl = containerRef.current;
              if (!chartEl) return;
              const rect = chartEl.getBoundingClientRect();
              const dpr = window.devicePixelRatio || 1;
              canvas.width = Math.floor(rect.width) * dpr;
              canvas.height = Math.floor(rect.height) * dpr;
              canvas.style.width = `${Math.floor(rect.width)}px`;
              canvas.style.height = `${Math.floor(rect.height)}px`;
              ctx.scale(dpr, dpr);
              ctx.clearRect(0, 0, rect.width, rect.height);

              const ts = chartRef.current.timeScale();
              const series = candleSeriesRef.current;
              if (!series) return;

              const pixelPoints: { x: number; upper: number; lower: number }[] = [];
              for (const pt of zonePoints) {
                try {
                  const x = ts.timeToCoordinate(pt.time as unknown as Time);
                  const yUp = (series as any).priceToCoordinate(pt.upper);
                  const yLo = (series as any).priceToCoordinate(pt.lower);
                  if (x != null && yUp != null && yLo != null &&
                      Number.isFinite(x) && Number.isFinite(yUp) && Number.isFinite(yLo)) {
                    pixelPoints.push({ x, upper: yUp, lower: yLo });
                  }
                } catch { /* coordinate conversion may fail */ }
              }

              if (pixelPoints.length < 2) return;
              ctx.moveTo(pixelPoints[0].x, pixelPoints[0].upper);
              for (let i = 1; i < pixelPoints.length; i++) {
                ctx.lineTo(pixelPoints[i].x, pixelPoints[i].upper);
              }
              for (let i = pixelPoints.length - 1; i >= 0; i--) {
                ctx.lineTo(pixelPoints[i].x, pixelPoints[i].lower);
              }
              ctx.closePath();
              ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(0, 200, 255, 0.25)';
              ctx.lineWidth = 1;
              ctx.stroke();
            };

            // Draw TP/SL shaded zones on the same canvas (matches X post SVG)
            const drawTradePlanZones = () => {
              if (!shouldRenderStandaloneTradePlan || !candleSeriesRef.current || !chartRef.current) return;
              const canvas = canvasOverlayRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              const series = candleSeriesRef.current;
              const chartEl = containerRef.current;
              if (!chartEl) return;
              const rect = chartEl.getBoundingClientRect();

              const entryY = (series as any).priceToCoordinate(tradePlan.entry);
              const tpY = (series as any).priceToCoordinate(tradePlan.takeProfit);
              const slY = (series as any).priceToCoordinate(tradePlan.stopLoss);
              if (entryY == null || tpY == null || slY == null) return;

              // TP zone (green)
              ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
              ctx.fillRect(0, Math.min(entryY, tpY), rect.width, Math.abs(tpY - entryY));
              // SL zone (red)
              ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
              ctx.fillRect(0, Math.min(entryY, slY), rect.width, Math.abs(slY - entryY));
            };

            const drawAll = () => {
              drawZone();
              drawTradePlanZones();
            };

            // Draw with delay to ensure chart coordinates are ready
            setTimeout(() => {
              requestAnimationFrame(drawAll);
            }, 200);
            chart.timeScale().subscribeVisibleLogicalRangeChange(drawAll);
          }
        }
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

    // === HISTORICAL PATTERN OVERLAYS ===
    // Clean up previous pattern line cleanups
    patternLinesCleanupsRef.current.forEach(cleanup => cleanup());
    patternLinesCleanupsRef.current = [];

    if (historicalPatterns && historicalPatterns.length > 0 && patternToggles.showPatterns) {
      // Render price lines (Entry/SL/TP) for the CURRENT pattern ONLY
      const isResolvedOutcome = (outcome?: string | null) =>
        ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'].includes(String(outcome || '').toLowerCase());
      const sortedPatterns = [...historicalPatterns].sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
      const activePattern = sortedPatterns.find(p => p.isActive && p.status !== 'expired');
      const latestUnresolvedPattern = sortedPatterns.find(p => !isResolvedOutcome(p.outcome));
      const currentPattern = activePattern || latestUnresolvedPattern || sortedPatterns[0];

      // Per-level distance guard: suppress individual distant levels instead of all-or-nothing.
      // This prevents Y-axis distortion while still rendering close levels.
      const levelDistances = (() => {
        if (!currentPattern || safeChartData.length === 0) return { entry: false, sl: false, tp: false, any: false, zonesOk: false };
        const latestClose = Number(safeChartData[safeChartData.length - 1]?.close);
        const entry = Number(currentPattern.entryPrice);
        const sl = Number(currentPattern.stopLossPrice);
        const tp = Number(currentPattern.takeProfitPrice);
        if (!Number.isFinite(latestClose) || latestClose <= 0) return { entry: false, sl: false, tp: false, any: false, zonesOk: false };

        const pctDist = (price: number) => Number.isFinite(price) && price > 0 
          ? Math.abs((price - latestClose) / latestClose) * 100 : Infinity;

        // Tighter per-level thresholds: entry 20%, SL/TP 25%
        const entryOk = pctDist(entry) <= 20;
        const slOk = pctDist(sl) <= 25;
        const tpOk = pctDist(tp) <= 25;

        // Zone/marker sync guard: suppress overlays when entry hasn't been reached.
        // For LONG: entry > currentPrice means trade hasn't triggered yet.
        // For SHORT: entry < currentPrice means trade hasn't triggered yet.
        const isLong = currentPattern.direction === 'long' || currentPattern.direction === 'bullish';
        const entryReached = isLong ? latestClose >= entry * 0.998 : latestClose <= entry * 1.002;
        // Also suppress if entry is clearly too far from current price
        const entryTooFar = pctDist(entry) > 3;
        const zonesOk = entryOk && slOk && tpOk && (entryReached || !entryTooFar);

        return {
          entry: entryOk,
          sl: slOk,
          tp: tpOk,
          any: entryOk || slOk || tpOk,
          zonesOk,
          entryTriggered: entryReached,
        };
      })();
      const hasRenderableTradeLevels = levelDistances.any;
      
      // Suppress trade plan rendering for resolved patterns (SL/TP already hit)
      const currentPatternResolved = currentPattern ? isResolvedOutcome(currentPattern.outcome) : false;

      if (currentPattern && hasRenderableTradeLevels && !currentPatternResolved) {
        const isLong = currentPattern.direction === 'long' || currentPattern.direction === 'bullish';
        const dirLabel = isLong ? '▲ LONG' : '▼ SHORT';
        
        // Render Entry line only if within range
        if (patternToggles.showEntry && levelDistances.entry) {
          candleSeries.createPriceLine({
            price: currentPattern.entryPrice,
            color: '#3b82f6',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `ENTRY ${dirLabel}`,
          });
        }
        // Render SL/TP lines individually based on proximity
        if (patternToggles.showStopLoss && levelDistances.sl) {
          const slLine = candleSeries.createPriceLine({
            price: currentPattern.stopLossPrice,
            color: PATTERN_OVERLAY_COLORS.stopLoss,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'SL',
          });
          patternLinesCleanupsRef.current.push(() => { try { candleSeries.removePriceLine(slLine); } catch {} });
        }
        if (patternToggles.showTakeProfit && levelDistances.tp) {
          const tpLine = candleSeries.createPriceLine({
            price: currentPattern.takeProfitPrice,
            color: PATTERN_OVERLAY_COLORS.takeProfit,
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'TP',
          });
          patternLinesCleanupsRef.current.push(() => { try { candleSeries.removePriceLine(tpLine); } catch {} });
        }
      }

      // === PIVOT-BASED STRUCTURAL MARKERS (matching FullChartViewer / Study Chart) ===
      // Collect canvas triangle markers for Entry and Breakout Level
      const canvasTriangleMarkers: Array<{
        time: number;
        price: number;
        direction: 'up' | 'down';
        color: string;
        label?: string;
      }> = [];

      // Parse current pattern's pivots for structural markers
      if (currentPattern && currentPattern.pivots && currentPattern.pivots.length > 0 && patternToggles.showLabels) {
        const patternBars = currentPattern.bars && currentPattern.bars.length > 0 ? currentPattern.bars : bars;

        currentPattern.pivots.forEach((pivot) => {
          // Skip "Entry" pivot — we render it separately as a canvas triangle below
          if ((pivot.label || '').toLowerCase().includes('entry')) return;

          const isBreakout = (pivot.label || '').toLowerCase().includes('breakout') || (pivot.label || '').toLowerCase().includes('breakdown');
          const isBreakdown = (pivot.label || '').toLowerCase().includes('breakdown');

          let t = Math.floor(new Date(pivot.timestamp).getTime() / 1000);
          if (Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < patternBars.length) {
            const altT = Math.floor(new Date(patternBars[pivot.index].t).getTime() / 1000);
            // Prefer index-based time if available
            t = altT || t;
          }

          if (isBreakout) {
            const pointUp = !isBreakdown;
            // Anchor breakout/breakdown marker to the nearest actual chart candle
            let anchorTime = t;
            const targetTs = currentPattern.detectedAt
              ? Math.floor(new Date(currentPattern.detectedAt).getTime() / 1000)
              : (currentPattern.bars && currentPattern.bars.length > 0)
                ? Math.floor(new Date(currentPattern.bars[currentPattern.bars.length - 1].t).getTime() / 1000)
                : t;
            // Find nearest candle in chart data
            anchorTime = findNearestCandleTime(safeChartData, targetTs);
            // Snap price to the candle's extreme (high for up, low for down) so the marker touches the candle
            const anchorBar = originalBarByTime.get(anchorTime) ?? normalizedBarByTime.get(anchorTime);
            const snappedPrice = anchorBar
              ? (pointUp ? anchorBar.h : anchorBar.l)
              : pivot.price;
            canvasTriangleMarkers.push({
              time: anchorTime,
              price: snappedPrice,
              direction: pointUp ? 'up' : 'down',
              color: '#f97316',
              label: pivot.label || (isBreakdown ? 'Breakdown Level' : 'Breakout Level'),
            });
          }
        });
      }

      // Entry Point → canvas triangle at the pattern's detection/signal bar (not the last bar)
      if (currentPattern && hasRenderableTradeLevels && levelDistances.entryTriggered && !currentPatternResolved && safeChartData.length > 0) {
        const isLong = currentPattern.direction === 'long' || currentPattern.direction === 'bullish';

        // Determine target timestamp for the entry marker
        const detectedTs = currentPattern.detectedAt ? Math.floor(new Date(currentPattern.detectedAt).getTime() / 1000) : null;
        const lastPatternBarTs = (currentPattern.bars && currentPattern.bars.length > 0)
          ? Math.floor(new Date(currentPattern.bars[currentPattern.bars.length - 1].t).getTime() / 1000)
          : null;
        const targetTs = detectedTs || lastPatternBarTs || (safeChartData[safeChartData.length - 1].time as number);

        // Snap to nearest actual chart candle (prevents floating markers)
        const anchorTime = findNearestCandleTime(safeChartData, targetTs);

        // Keep entry marker vertically synced with ENTRY line (not candle extremum)
        const anchorBar = originalBarByTime.get(anchorTime) ?? normalizedBarByTime.get(anchorTime) ?? normalizedBars[normalizedBars.length - 1];
        const entryMarkerPrice = Number(currentPattern.entryPrice);
        const fallbackPrice = isLong ? (anchorBar?.l ?? currentPattern.entryPrice) : (anchorBar?.h ?? currentPattern.entryPrice);
        const markerPrice = Number.isFinite(entryMarkerPrice) && entryMarkerPrice > 0 ? entryMarkerPrice : fallbackPrice;

        canvasTriangleMarkers.push({
          time: anchorTime,
          price: markerPrice,
          direction: isLong ? 'up' : 'down',
          color: '#3b82f6',
          label: '',
        });
      }

      // Render pattern markers for OTHER patterns (not the current one — it uses canvas triangles)
      // UNLESS the current pattern has no canvas triangles, in which case include it as a native marker fallback
      const hasCanvasTrianglesForCurrent = canvasTriangleMarkers.length > 0;
      const patternsForMarkers = currentPattern && hasCanvasTrianglesForCurrent
        ? historicalPatterns.filter(p => p.id !== currentPattern.id)
        : historicalPatterns;
      const patternMarkerData = generatePatternMarkers(patternsForMarkers, bars, patternToggles);

      // Merge native markers (no directionMarkers — Entry is now a canvas triangle)
      const allMarkers = [
        ...(chartMarkers || []).filter(m => m.time).map(m => ({
          time: (typeof m.time === 'string' ? m.time.split('T')[0] : String(m.time)) as Time,
          position: m.position,
          color: m.color,
          shape: m.shape as SeriesMarkerShape,
          text: m.text,
        })),
        ...patternMarkerData,
      ].sort((a, b) => {
        const ta = typeof a.time === 'string' ? a.time : String(a.time);
        const tb = typeof b.time === 'string' ? b.time : String(b.time);
        return ta.localeCompare(tb);
      });

      // Deduplicate by time+text+shape
      const seenMarkers = new Set<string>();
      const dedupedMarkers = allMarkers.filter(m => {
        const key = `${m.time}|${m.text}|${m.shape}`;
        if (seenMarkers.has(key)) return false;
        seenMarkers.add(key);
        return true;
      });

      if (dedupedMarkers.length > 0) {
        try {
          createSeriesMarkers(candleSeries, dedupedMarkers);
        } catch { /* ignore marker errors */ }
      }

      // Render zigzag polylines for patterns with pivots
      if (patternToggles.showZigzag) {
        for (const pattern of historicalPatterns) {
          if (!pattern.pivots || pattern.pivots.length < 2) continue;
          const patternBars = pattern.bars && pattern.bars.length > 0 ? pattern.bars : bars;
          let formation = deriveFormationOverlay(pattern.pivots, patternBars, pattern.patternId);
          if (formation) formation = snapFormationToChartTimes(formation, safeChartData);
          if (formation && formation.zigzag.length >= 2) {
            const zigzagSeries = chart.addSeries(LineSeries, {
              color: PATTERN_OVERLAY_COLORS.zigzag,
              lineWidth: 2,
              lineStyle: 0,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              autoscaleInfoProvider: () => null,
            });
            zigzagSeries.setData(sanitizeSeriesData(formation.zigzag as Array<{ time: Time; value: number }>));
          }
        }
      }

      // Helper: draw filled triangle markers on canvas (matching FullChartViewer / Study Chart)
      const drawCanvasTriangles = (ctx: CanvasRenderingContext2D) => {
        if (canvasTriangleMarkers.length === 0 || !chartRef.current || !candleSeriesRef.current) return;
        const ts = chartRef.current.timeScale();
        canvasTriangleMarkers.forEach((marker) => {
          try {
            const x = (ts as any).timeToCoordinate?.(marker.time);
            const y = (candleSeriesRef.current as any).priceToCoordinate?.(marker.price);
            if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) return;

            const size = 10;
            ctx.beginPath();
            if (marker.direction === 'up') {
              ctx.moveTo(x, y - size * 0.2);
              ctx.lineTo(x - size * 0.7, y + size);
              ctx.lineTo(x + size * 0.7, y + size);
            } else {
              ctx.moveTo(x, y + size * 0.2);
              ctx.lineTo(x - size * 0.7, y - size);
              ctx.lineTo(x + size * 0.7, y - size);
            }
            ctx.closePath();
            ctx.fillStyle = marker.color;
            ctx.fill();

            if (marker.label) {
              ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = marker.color;
              const labelY = marker.direction === 'up' ? y + size + 14 : y - size - 6;
              ctx.fillText(marker.label, x, labelY);
            }
          } catch { /* ignore */ }
        });
      };

      // Draw trade zones + canvas triangles on canvas overlay
      const shouldDrawZones = !currentPatternResolved && patternToggles.showTradeZones && currentPattern && hasRenderableTradeLevels && levelDistances.entry && levelDistances.zonesOk;
      const shouldDrawTriangles = canvasTriangleMarkers.length > 0;

      if (shouldDrawZones || shouldDrawTriangles) {
        const drawHistoricalPatternOverlay = () => {
          const canvas = canvasOverlayRef.current;
          if (!canvas || !chartRef.current || !candleSeriesRef.current) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const chartEl = containerRef.current;
          if (!chartEl) return;
          const rect = chartEl.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;

          // Full canvas clear + re-init to avoid stale drawings
          canvas.width = Math.floor(rect.width) * dpr;
          canvas.height = Math.floor(rect.height) * dpr;
          canvas.style.width = `${Math.floor(rect.width)}px`;
          canvas.style.height = `${Math.floor(rect.height)}px`;
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, rect.width, rect.height);

          // Re-draw formation zone if present (since we cleared the canvas)
           if (formationOverlays && formationOverlays.length > 0) {
            for (const rawFormation of formationOverlays) {
              const formation = snapFormationToChartTimes(rawFormation, safeChartData);
              if (formation.hasZone) {
                const zonePoints = buildZonePoints(formation.upperTrend, formation.lowerTrend);
                if (zonePoints.length >= 2) {
                  const ts = chartRef.current!.timeScale();
                  const series = candleSeriesRef.current;
                  if (series) {
                    const pixelPoints: { x: number; upper: number; lower: number }[] = [];
                    for (const pt of zonePoints) {
                      try {
                        const x = ts.timeToCoordinate(pt.time as unknown as Time);
                        const yUp = (series as any).priceToCoordinate(pt.upper);
                        const yLo = (series as any).priceToCoordinate(pt.lower);
                        if (x != null && yUp != null && yLo != null &&
                            Number.isFinite(x) && Number.isFinite(yUp) && Number.isFinite(yLo)) {
                          pixelPoints.push({ x, upper: yUp, lower: yLo });
                        }
                      } catch {}
                    }
                    if (pixelPoints.length >= 2) {
                      ctx.beginPath();
                      ctx.moveTo(pixelPoints[0].x, pixelPoints[0].upper);
                      for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].upper);
                      for (let i = pixelPoints.length - 1; i >= 0; i--) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].lower);
                      ctx.closePath();
                      ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
                      ctx.fill();
                      ctx.strokeStyle = 'rgba(0, 200, 255, 0.25)';
                      ctx.lineWidth = 1;
                      ctx.stroke();
                    }
                  }
                }
              }
            }
          }

          // TP/SL shaded zones — only draw zones for levels within proximity
          if (shouldDrawZones) {
            const zonesToggles = {
              ...patternToggles,
              showStopLoss: patternToggles.showStopLoss && levelDistances.sl,
              showTakeProfit: patternToggles.showTakeProfit && levelDistances.tp,
            };
            drawPatternZones(
              ctx, chartRef.current, candleSeriesRef.current,
              [currentPattern!], zonesToggles,
              rect.width, rect.height
            );
          }

          // Canvas triangle markers (Entry, Breakout Level)
          if (shouldDrawTriangles) {
            drawCanvasTriangles(ctx);
          }
        };

        setTimeout(() => requestAnimationFrame(drawHistoricalPatternOverlay), 250);
        chart.timeScale().subscribeVisibleLogicalRangeChange(drawHistoricalPatternOverlay);
      }
    }

    // === RSI as separate chart (skip on shared/clean views) ===
    if (!hideAnalysisToolbar && indicators.rsi && rsiContainerRef.current) {
      if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; }
      const rsiData = calculateRSI(bars, 14);
      if (rsiData.length > 0) {
        const mainWidth = containerRef.current?.clientWidth || rsiContainerRef.current.clientWidth;
        const rsiChart = createChart(rsiContainerRef.current, {
          width: mainWidth,
          height: 100,
          layout: { background: { color: theme.background }, textColor: theme.text },
          grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
          rightPriceScale: { visible: true, borderColor: theme.grid, minimumWidth: 85 },
          timeScale: { visible: false, rightOffset: 0 },
          crosshair: { mode: 0 },
        });
        rsiChartRef.current = rsiChart;
        const rsiSeries = rsiChart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.rsi, lineWidth: 1, priceLineVisible: false, lastValueVisible: true,
          priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
        });
        rsiSeries.setData(sanitizeSeriesData(rsiData.map(p => ({ time: p.time as Time, value: p.value }))));
        rsiSeriesRef.current = rsiSeries;
        rsiSeries.createPriceLine({ price: 70, color: 'rgba(239,68,68,0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' });
        rsiSeries.createPriceLine({ price: 30, color: 'rgba(34,197,94,0.3)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' });
        rsiSeries.createPriceLine({ price: 50, color: 'rgba(156,163,175,0.2)', lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: '' });
        rsiChart.timeScale().fitContent();
      }
    }

    // === MACD as separate chart (skip on shared/clean views) ===
    if (!hideAnalysisToolbar && indicators.macd && macdContainerRef.current) {
      if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; }
      const macdData = calculateMACD(bars, 12, 26, 9);
      if (macdData.length > 0) {
        const mainWidthMacd = containerRef.current?.clientWidth || macdContainerRef.current.clientWidth;
        const macdChart = createChart(macdContainerRef.current, {
          width: mainWidthMacd,
          height: 100,
          layout: { background: { color: theme.background }, textColor: theme.text },
          grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
          rightPriceScale: { visible: true, borderColor: theme.grid, minimumWidth: 85 },
          timeScale: { visible: false, rightOffset: 0 },
          crosshair: { mode: 0 },
        });
        macdChartRef.current = macdChart;

        const macdHistSeries = macdChart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false });
        macdHistSeries.setData(sanitizeSeriesData(macdData.map(p => ({
          time: p.time as Time, value: p.histogram,
          color: p.histogram >= 0 ? INDICATOR_COLORS.macdHistogramUp : INDICATOR_COLORS.macdHistogramDown,
        }))));
        macdHistSeriesRef.current = macdHistSeries;

        const macdLineSeries = macdChart.addSeries(LineSeries, { color: INDICATOR_COLORS.macdLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        macdLineSeries.setData(sanitizeSeriesData(macdData.map(p => ({ time: p.time as Time, value: p.macd }))));

        const macdSignalSeries = macdChart.addSeries(LineSeries, { color: INDICATOR_COLORS.macdSignal, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        macdSignalSeries.setData(sanitizeSeriesData(macdData.map(p => ({ time: p.time as Time, value: p.signal }))));

        macdHistSeries.createPriceLine({ price: 0, color: 'rgba(156,163,175,0.2)', lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: '' });
        macdChart.timeScale().fitContent();
      }
    }

    // Sync time scales from MAIN chart only using logical range.
    // This preserves right-side whitespace and prevents snap-back to the latest bar.
    // Also re-enable autoScale on every horizontal scroll so the Y-axis always
    // adjusts to center the visible bars' price range smoothly.
    const linkedCharts = [rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];
    chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
      if (syncingRangeRef.current || !logicalRange) return;
      persistedVisibleLogicalRangeRef.current = logicalRange;

      const timeRange = chart.timeScale().getVisibleRange();
      if (timeRange) persistedVisibleRangeRef.current = timeRange;

      // Re-enable autoScale so the price axis dynamically adjusts to visible bars
      // (it gets disabled when the user manually drags the price axis)
      try {
        chart.priceScale('right').applyOptions({ autoScale: true });
      } catch { /* ignore */ }

      syncingRangeRef.current = true;
      linkedCharts.forEach((dst) => {
        try {
          dst.timeScale().setVisibleLogicalRange(logicalRange);
        } catch {
          // Ignore if range is out of bounds for this chart
        }
      });
      syncingRangeRef.current = false;
    });

    // Sync crosshairs using official pattern: pass actual data point values
    const allCharts = [chart, rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];
    const chartSeriesMap = new Map<IChartApi, ReturnType<IChartApi['addSeries']>>();
    chartSeriesMap.set(chart, candleSeries);
    if (rsiChartRef.current && rsiSeriesRef.current) chartSeriesMap.set(rsiChartRef.current, rsiSeriesRef.current);
    if (macdChartRef.current && macdHistSeriesRef.current) chartSeriesMap.set(macdChartRef.current, macdHistSeriesRef.current);

    // Draw TP/SL shaded zones even without formation overlays
    // Apply same zone sync guard: suppress zones when entry hasn't been reached
    const standaloneTradePlanZonesOk = (() => {
      if (!tradePlan || safeChartData.length === 0) return false;
      const latestClose = Number(safeChartData[safeChartData.length - 1]?.close);
      if (!Number.isFinite(latestClose) || latestClose <= 0) return false;
      const entry = tradePlan.entry;
      const pctFromEntry = Math.abs((entry - latestClose) / latestClose) * 100;
      if (pctFromEntry > 3) return false; // Entry too far — zones would be misleading
      return true;
    })();

    if (tradePlan && standaloneTradePlanZonesOk && !hasHistoricalOverlays && (!formationOverlays || formationOverlays.length === 0 || !formationOverlays.some(f => f.hasZone))) {
      const drawStandaloneTradePlanZones = () => {
        const canvas = canvasOverlayRef.current;
        if (!canvas || !chartRef.current || !candleSeriesRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const chartEl = containerRef.current;
        if (!chartEl) return;
        const rect = chartEl.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(rect.width) * dpr;
        canvas.height = Math.floor(rect.height) * dpr;
        canvas.style.width = `${Math.floor(rect.width)}px`;
        canvas.style.height = `${Math.floor(rect.height)}px`;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);

        const series = candleSeriesRef.current;
        const entryY = (series as any).priceToCoordinate(tradePlan.entry);
        const tpY = (series as any).priceToCoordinate(tradePlan.takeProfit);
        const slY = (series as any).priceToCoordinate(tradePlan.stopLoss);
        if (entryY == null || tpY == null || slY == null) return;

        ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
        ctx.fillRect(0, Math.min(entryY, tpY), rect.width, Math.abs(tpY - entryY));
        ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
        ctx.fillRect(0, Math.min(entryY, slY), rect.width, Math.abs(slY - entryY));
      };

      setTimeout(() => requestAnimationFrame(drawStandaloneTradePlanZones), 200);
      chart.timeScale().subscribeVisibleLogicalRangeChange(drawStandaloneTradePlanZones);
    }

    allCharts.forEach((src) => {
      src.subscribeCrosshairMove((param) => {
        if (syncingCrosshairRef.current) return;
        syncingCrosshairRef.current = true;
        allCharts.forEach((dst) => {
          const dstSeries = chartSeriesMap.get(dst);
          if (dst !== src && dstSeries) {
            if (param.time) {
              // Pass NaN as price to show only the vertical crosshair line
              // We cannot look up dst series data from src chart's param.seriesData
              dst.setCrosshairPosition(NaN, param.time, dstSeries);
            } else {
              dst.clearCrosshairPosition();
            }
          }
        });
        syncingCrosshairRef.current = false;
      });
    });

    // Preserve user's manually dragged range across chart re-renders (TradingView-like behavior)
    const totalBars = safeChartData.length;
    const persistedLogical = persistedVisibleLogicalRangeRef.current;
    const persistedTimeRange = persistedVisibleRangeRef.current;
    const maxRightPaddingBars = 30;

    const shouldFitAllVisibleBars = !!initialVisibleBars && totalBars > 0 && initialVisibleBars >= totalBars;

    if (shouldFitAllVisibleBars) {
      // Playback mode / fit-all mode: always keep first + last visible candles in frame.
      const to = totalBars + 2;
      chart.timeScale().setVisibleLogicalRange({ from: 0, to });
    } else if (persistedLogical && totalBars > 0) {
      const rawWidth = Math.max(10, persistedLogical.to - persistedLogical.from);
      const clampedTo = Math.min(persistedLogical.to, totalBars + maxRightPaddingBars);
      const clampedFrom = clampedTo - rawWidth;
      const latestBarInsideViewport = clampedTo >= totalBars - 1;

      // Guard against stale/overly-wide persisted ranges that cause candles to sit far left
      // with excessive whitespace on the right.
      const maxReasonableWidth = Math.max(
        (initialVisibleBars || 80) * 2,
        Math.min(totalBars + maxRightPaddingBars, 260)
      );
      const hasReasonableWidth = rawWidth <= maxReasonableWidth;

      if (latestBarInsideViewport && hasReasonableWidth) {
        chart.timeScale().setVisibleLogicalRange({ from: clampedFrom, to: clampedTo });
      } else {
        // Fallback to focused default when persisted range is stale for this dataset
        const visibleCount = Math.min(totalBars, initialVisibleBars || 80);
        const to = totalBars + 2;
        const from = Math.max(0, to - visibleCount);
        chart.timeScale().setVisibleLogicalRange({ from, to });
      }
    } else if (persistedTimeRange) {
      chart.timeScale().setVisibleRange(persistedTimeRange);
    } else if (initialVisibleBars && totalBars > 0) {
      // Zoom to recent N bars — latest bar anchored near the right edge
      const visibleCount = Math.min(totalBars, initialVisibleBars);
      const from = totalBars - visibleCount;
      // Minimal right margin (2 bars) so latest candle isn't flush against the edge
      const to = totalBars + 2;
      chart.timeScale().setVisibleLogicalRange({ from, to });
    } else {
      // Few bars — fit all content and scroll latest bar to right edge
      chart.timeScale().fitContent();
      chart.timeScale().scrollToRealTime();
    }
    
    // Force-sync oscillator charts to the main chart's visible range.
    // This overrides their independent fitContent() ranges to match the main chart,
    // ensuring all charts show the same time window despite different data lengths.
    const syncInitialRange = () => {
      try {
        const mainRange = chart.timeScale().getVisibleRange();
        if (mainRange) {
          if (rsiChartRef.current) {
            try { rsiChartRef.current.timeScale().setVisibleRange(mainRange); } catch {}
          }
          if (macdChartRef.current) {
            try { macdChartRef.current.timeScale().setVisibleRange(mainRange); } catch {}
          }
        }
      } catch { /* ignore */ }
    };
    // Multiple passes: the first one fires right after paint, then progressively later
    // to catch any async rendering delays
    const initialSyncTimer = setTimeout(syncInitialRange, 0);
    const initialSyncTimer2 = setTimeout(syncInitialRange, 100);
    const initialSyncTimer3 = setTimeout(syncInitialRange, 300);

    // Sync price scale widths: read actual rendered widths, then force all to the widest.
    // minimumWidth is only a floor — if labels exceed it, the scale grows.
    // We must read after render, find the max, then re-apply.
    const syncPriceScaleWidths = () => {
      // Guard: skip if main chart was already destroyed by a re-render
      if (!chartRef.current) return;
      const charts = [chartRef.current, rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];
      if (charts.length <= 1) return;
      const widths = charts.map((c) => {
        try { return c.priceScale('right').width(); } catch { return 0; }
      });
      const maxW = Math.max(...widths, 60);
      console.log('[StudyChart] Price scale widths:', widths, '→ forcing all to', maxW);
      charts.forEach((c) => {
        try { c.priceScale('right').applyOptions({ minimumWidth: maxW }); } catch { /* chart disposed */ }
      });
    };
    // Multiple passes: labels may not stabilize immediately
    const syncTimer1 = setTimeout(syncPriceScaleWidths, 50);
    const syncTimer2 = setTimeout(syncPriceScaleWidths, 200);
    const syncTimer3 = setTimeout(syncPriceScaleWidths, 500);

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      try {
        const nextWidth = Math.floor(entry.contentRect.width);
        const nextHeight = Math.floor(entry.contentRect.height);

        chartRef.current.applyOptions({
          width: nextWidth,
          ...(autoHeight
            ? { height: Math.max(nextHeight || initialHeight, 250) }
            : {}),
        });
        // Resize oscillator charts to the SAME width as main chart
        rsiChartRef.current?.applyOptions({ width: nextWidth });
        macdChartRef.current?.applyOptions({ width: nextWidth });
        // Keep current user-selected horizontal range on resize (do not auto-fit)
        if (persistedVisibleLogicalRangeRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(persistedVisibleLogicalRangeRef.current);
        } else if (persistedVisibleRangeRef.current) {
          chartRef.current.timeScale().setVisibleRange(persistedVisibleRangeRef.current);
        }
        // Delay sync so labels re-render at new width first
        setTimeout(syncPriceScaleWidths, 100);
      } catch {
        // Chart may have been disposed during resize
      }
    });

    resizeObserver.observe(containerRef.current);

    // Space+drag vertical panning handlers
    // Uses scaleMargins manipulation since lightweight-charts v5 PriceScale
    // does not expose getVisibleRange/setVisibleRange.
    const container = containerRef.current;
    const marginsRef = { top: 0.05, bottom: 0.05 };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        container.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        if (!isPanningRef.current) container.style.cursor = '';
      }
    };
    // Reset space state when window loses focus
    const handleBlur = () => {
      spaceHeldRef.current = false;
      if (isPanningRef.current) {
        isPanningRef.current = false;
        container.style.cursor = '';
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (spaceHeldRef.current || e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        panStartYRef.current = e.clientY;
        // Read current margins
        try {
          const opts = chartRef.current?.priceScale('right').options();
          if (opts?.scaleMargins) {
            marginsRef.top = opts.scaleMargins.top;
            marginsRef.bottom = opts.scaleMargins.bottom;
          }
        } catch {}
        container.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current || !chartRef.current) return;
      try {
        const deltaY = e.clientY - panStartYRef.current;
        panStartYRef.current = e.clientY;
        const containerHeight = containerRef.current?.clientHeight || 500;
        // Convert pixel delta to margin delta (fraction of chart height)
        const marginDelta = deltaY / containerHeight;
        // Shift both margins: moving mouse down increases top margin, decreases bottom
        marginsRef.top = Math.max(0, Math.min(0.9, marginsRef.top + marginDelta));
        marginsRef.bottom = Math.max(0, Math.min(0.9, marginsRef.bottom - marginDelta));
        chartRef.current.priceScale('right').applyOptions({
          autoScale: true,
          scaleMargins: { top: marginsRef.top, bottom: marginsRef.bottom },
        });
      } catch {
        // Chart may have been disposed
      }
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        container.style.cursor = spaceHeldRef.current ? 'grab' : '';
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Two-finger vertical panning for mobile
    // When the user places two fingers and drags vertically, shift the
    // price axis up/down using the same scaleMargins technique as Space+drag.
    let twoFingerPanActive = false;
    let twoFingerStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        twoFingerPanActive = true;
        twoFingerStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        // Read current margins
        try {
          const opts = chartRef.current?.priceScale('right').options();
          if (opts?.scaleMargins) {
            marginsRef.top = opts.scaleMargins.top;
            marginsRef.bottom = opts.scaleMargins.bottom;
          }
        } catch {}
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!twoFingerPanActive || e.touches.length !== 2 || !chartRef.current) return;
      e.preventDefault(); // prevent page scroll while two-finger panning
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaY = currentY - twoFingerStartY;
      twoFingerStartY = currentY;
      const containerHeight = containerRef.current?.clientHeight || 500;
      const marginDelta = deltaY / containerHeight;
      marginsRef.top = Math.max(0, Math.min(0.9, marginsRef.top + marginDelta));
      marginsRef.bottom = Math.max(0, Math.min(0.9, marginsRef.bottom - marginDelta));
      try {
        chartRef.current.priceScale('right').applyOptions({
          autoScale: true,
          scaleMargins: { top: marginsRef.top, bottom: marginsRef.bottom },
        });
      } catch {}
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (twoFingerPanActive && e.touches.length < 2) {
        twoFingerPanActive = false;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      try {
        const logicalRange = chart.timeScale().getVisibleLogicalRange();
        if (logicalRange) persistedVisibleLogicalRangeRef.current = logicalRange;
        const range = chart.timeScale().getVisibleRange();
        if (range) persistedVisibleRangeRef.current = range;
      } catch {
        // ignore
      }
      clearTimeout(syncTimer1);
      clearTimeout(syncTimer2);
      clearTimeout(syncTimer3);
      clearTimeout(initialSyncTimer);
      clearTimeout(initialSyncTimer2);
      clearTimeout(initialSyncTimer3);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; }
      if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; }
    };
  }, [bars, fixedHeight, autoHeight, indicators.ema20, indicators.ema50, indicators.ema200, indicators.bollingerBands, indicators.vwap, indicators.rsi, indicators.macd, i18n.language, tradePlan, chartMarkers, historicalPatterns, patternToggles]);


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
    <div ref={chartWrapperRef} className={cn('flex flex-col overflow-hidden border border-border/50 rounded', autoHeight && 'h-full')}>
      <div className="relative flex-1 min-h-[150px]">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
      />
      {/* Canvas overlay for formation zone shading */}
      <canvas
        ref={canvasOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
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
            analysisLinesRef.current.forEach(line => {
              try { candleSeriesRef.current?.removePriceLine(line); } catch {}
            });
            analysisLinesRef.current = [];
          }}
          chartContainerRef={chartWrapperRef}
          symbol={symbol}
          timeframe={timeframe}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30"
        />
      )}

      {/* Indicator Legend - only show active ones */}
      <div className="absolute top-10 left-2 flex flex-wrap gap-1.5 text-sm pointer-events-none">
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
        {indicators.ema200 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-purple-500">
            EMA 200
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
        <div className="absolute top-2 right-2 flex flex-col gap-1 text-sm pointer-events-none">
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
      {!hideAnalysisToolbar && (
      <div className="hidden md:flex absolute bottom-2 left-2 items-center gap-1 text-sm text-muted-foreground/70 pointer-events-none">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 pointer-events-auto cursor-help">
                <kbd className="px-1 py-0.5 bg-muted/50 border border-border/50 rounded text-sm font-mono">Shift</kbd>
                <span>+ drag to pan</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              Hold <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-sm font-mono mx-0.5">Shift</kbd> + left-click drag to move the chart up/down. Or use middle-mouse drag.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      )}

      {/* Reset Button */}
      {!hideAnalysisToolbar && (
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
      )}
      {!hideAnalysisToolbar && (
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
        {/* Pattern Overlay Toggles */}
        {historicalPatterns && historicalPatterns.length > 0 && (
          <PatternOverlayTogglePanel
            toggles={patternToggles}
            onToggle={handlePatternToggle}
            patternCount={historicalPatterns.length}
          />
        )}
        {/* Indicator Toggles */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 bg-background/90 border-border/50 hover:bg-background"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">{t('chartToolbar.indicators')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-3 bg-popover border border-border shadow-lg z-50" 
            align="start"
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
                  <Label htmlFor="ema200" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    EMA 200
                  </Label>
                  <Switch
                    id="ema200"
                    checked={indicators.ema200}
                    onCheckedChange={() => handleToggle('ema200')}
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
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
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
                <p className="text-sm text-muted-foreground">
                  {activeIndicators.length} of {Object.keys(indicators).length} indicators active
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      )}
      </div>

      {/* RSI Oscillator Pane */}
      {indicators.rsi && (
        <div
          ref={rsiContainerRef}
          className="w-full border-t border-border/30"
          style={{ height: 100 }}
        />
      )}

      {/* MACD Oscillator Pane */}
      {indicators.macd && (
        <div
          ref={macdContainerRef}
          className="w-full border-t border-border/30"
          style={{ height: 100 }}
        />
      )}
    </div>


      {/* Analysis Result Dialog - Desktop only */}
      {!isMobile && (
        <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <div data-capture-target className="space-y-4 bg-background p-4 rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-base">{t('chartAnalysisDialog.title')}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-3">
                {analysis.analysisResult && (
                  <ChartAnalysisSummary analysis={analysis.analysisResult} />
                )}
              </ScrollArea>
              <div className="flex items-center justify-between pt-2 border-t">
                <CardCaptureButton label={t('chartAnalysisDialog.title')} />
                <div className="flex gap-2">
                  {onSendToCopilot && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setShowAnalysisDialog(false);
                      analysis.sendToCopilot();
                    }}>
                      {t('chartAnalysisDialog.askCopilot')}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setShowAnalysisDialog(false)}>
                    {t('chartAnalysisDialog.close')}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

StudyChart.displayName = 'StudyChart';

export default StudyChart;
