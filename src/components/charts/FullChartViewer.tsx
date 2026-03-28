import { useEffect, useRef, useState, useMemo } from 'react';
import { buildPatternLabUrl } from '@/utils/patternLabUrl';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
  ISeriesApi,
} from 'lightweight-charts';
import {
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVWAP,
} from '@/utils/chartIndicators';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bell,
  FileCode,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Loader2,
  AlertTriangle,
  Clock,
  Bookmark,
  ExternalLink,
  X,
  History,
  Settings2,
  RotateCcw,
  Play,
  Share2,
} from 'lucide-react';
import { SetupWithVisuals } from '@/types/VisualSpec';
import { translatePatternName } from '@/utils/translatePatternName';
import { DISCLAIMERS } from '@/constants/disclaimers';
import { getTradingViewUrl, getInstrumentCategory as getInstrumentCategoryUtil } from '@/utils/tradingViewLinks';
import { useAuthGate } from '@/hooks/useAuthGate';
import { AuthGateDialog } from '@/components/AuthGateDialog';
import { HistoricalOccurrencesList } from './HistoricalOccurrencesList';
import { toast } from 'sonner';
import { InstrumentLogo } from './InstrumentLogo';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { PatternQualityBadge } from '@/components/charts/PatternQualityBadge';
import { FullChartPlaybackView } from './FullChartPlaybackView';
import { useSharePattern } from '@/hooks/useSharePattern';
import { deriveFormationOverlay, snapFormationToChartTimes, buildZonePoints, findNearestCandleTime } from '@/utils/formationOverlay';
import { renderNeckline, renderZigZagSeries } from './PatternOverlayRenderer';
import { isResolvedOutcome } from '@/utils/deriveLiveOutcome';
import { translateQualityReason } from '@/utils/translateQualityReason';
import { 
  getThemeColors, 
  CANDLE_COLORS, 
  VOLUME_COLORS, 
  VOLUME_SCALE_MARGINS, 
  getVolumeColor,
  getOverlayColor,
  INDICATOR_COLORS,
  PIVOT_COLORS,
  normalizeBarsForConsistentColoring,
  calculateOptimalPriceMargins,
  calculatePricePrecision,
} from './chartConstants';

// Indicator settings interface
export interface IndicatorSettings {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  bollingerBands: boolean;
  vwap: boolean;
}

const DEFAULT_INDICATORS: IndicatorSettings = {
  ema20: true,
  ema50: true,
  ema200: true,
  bollingerBands: true,
  vwap: true,
};

// Persist settings in localStorage
const STORAGE_KEY = 'chartingpath_fullchart_indicators';

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

// findNearestCandleTime is now imported from @/utils/formationOverlay

function saveIndicatorSettings(settings: IndicatorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

/** Run Backtest CTA - drives users to Pattern Lab for deeper research */

interface FullChartViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup: SetupWithVisuals | null;
  loading?: boolean;
  onCreateAlert: () => void;
  onExportPine?: () => void;
  onSaveToVault?: () => void;
  isCreatingAlert: boolean;
  isSavingToVault?: boolean;
  selectedRR?: number; // User-selected R:R for trade planning
}

// Do Not Trade conditions — keyed for i18n
const DO_NOT_TRADE_KEYS = {
  common: [
    'majorEconomicNews',
    'weekendGapRisk',
    'lowLiquiditySession',
  ],
  patterns: {
    rising_wedge: ['strongBullishMomentum', 'priceAbove20EMA'],
    falling_wedge: ['strongBearishMomentum', 'priceBelow20EMA'],
    ascending_triangle: ['resistanceBroken', 'volumeDecliningBreakout'],
    descending_triangle: ['supportBroken', 'bullishDivergence'],
    head_shoulders: ['rightShoulderHigher', 'volumeNotConfirming'],
    double_top: ['secondTopLower', 'strongSupportHolding'],
    double_bottom: ['secondBottomHigher', 'strongResistanceHolding'],
  } as Record<string, string[]>,
  direction: {
    long: ['strongBearishHigherTF'],
    short: ['strongBullishHigherTF'],
  },
};

const getDoNotTradeKeys = (patternId: string, direction: 'long' | 'short'): string[] => {
  return [
    ...DO_NOT_TRADE_KEYS.common,
    ...(DO_NOT_TRADE_KEYS.patterns[patternId] || []),
    ...DO_NOT_TRADE_KEYS.direction[direction],
  ];
};

export default function FullChartViewer({ 
  open, 
  onOpenChange, 
  setup,
  loading = false,
  onCreateAlert,
  onExportPine,
  onSaveToVault,
  isCreatingAlert,
  isSavingToVault = false,
  selectedRR = 2,
}: FullChartViewerProps) {
  const { t } = useTranslation();
  const fc = (key: string, opts?: Record<string, any>): string => t(`fullChart.${key}`, opts) as string;
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthGate(t('common.thisFeature', 'this feature'));
  const { sharePattern, sharing } = useSharePattern();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState<string | null>(null);
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicatorSettings);
  const indicatorsRef = useRef<IndicatorSettings>(indicators);
  const [chartVersion, setChartVersion] = useState(0);
  const [tradeLevelsSuppressed, setTradeLevelsSuppressed] = useState<{ suppressed: boolean; entryPrice?: number }>({ suppressed: false });
  const [forceShowLevels, setForceShowLevels] = useState(false);
  
  // Determine if playback is available (historical pattern with outcome data)
  // Compute entryBarIndex if not provided - default to 30 bars before end
  const computedEntryBarIndex = setup?.entryBarIndex ?? 
    (setup?.bars && setup?.barsToOutcome != null 
      ? Math.max(0, setup.bars.length - setup.barsToOutcome - 1)
      : undefined);
  
  const isHistoricalPattern = setup?.outcome != null || setup?.barsToOutcome != null;
  const canPlayback = isHistoricalPattern && setup?.barsToOutcome != null && computedEntryBarIndex != null;

  // Playback mode state - start with false, auto-enable via effect
  const [playbackEnabled, setPlaybackEnabled] = useState(false);
  
  // Auto-enable playback when opening a historical pattern with outcome data
  useEffect(() => {
    if (open && canPlayback) {
      setPlaybackEnabled(true);
    }
  }, [open, canPlayback]);
  
  // Vertical panning state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const priceRangeOnDragStart = useRef<{ from: number; to: number } | null>(null);
  
  // Keep ref in sync for use inside effects
  indicatorsRef.current = indicators;

  const handleToggle = (key: keyof IndicatorSettings) => {
    setIndicators((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveIndicatorSettings(updated);
      return updated;
    });
    // Increment version to trigger chart recreation
    setChartVersion(v => v + 1);
  };

  useEffect(() => {
    // Radix DialogContent is portaled and can mount a tick after `open` flips true.
    // Using a callback ref (containerEl state) ensures we initialize the chart once the DOM node exists.
    if (!containerEl || !setup || !open) return;

    console.debug('[FullChartViewer] effect', {
      open,
      loading,
      hasContainer: Boolean(containerEl),
      bars: Array.isArray(setup.bars) ? setup.bars.length : 0,
      chartVersion,
    });

    setChartError(null);

    if (loading) {
      console.debug('[FullChartViewer] waiting for chart details…');
      return;
    }

    const { bars, visualSpec } = setup;
    // Determine if trade plan should be suppressed (SL/TP already hit)
    const tradeResolved = isResolvedOutcome(setup.outcome);
    
    if (!bars || bars.length === 0) {
      console.warn('[FullChartViewer] no bars to render');
      return;
    }

    let cleanedUp = false;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;
    let overlayTimerId1: ReturnType<typeof setTimeout> | undefined;
    let overlayTimerId2: ReturnType<typeof setTimeout> | undefined;
    let overlayRafId1: number = 0;
    let overlayRafId2: number = 0;
    let attempts = 0;

    const initChart = () => {
      if (cleanedUp || !containerEl) return;

      const rect = containerEl.getBoundingClientRect();
      const containerWidth = Math.floor(rect.width);
      const containerHeight = Math.floor(rect.height);

      // Dialog open animation can briefly yield 0px size; retry next frame.
      if (containerWidth <= 0 || containerHeight <= 0) {
        attempts += 1;
        if (attempts > 120) {
          setChartError('Chart failed to render.');
          return;
        }
        rafId = window.requestAnimationFrame(initChart);
        return;
      }

      try {
        // Use unified theme colors
        const theme = getThemeColors();

        // Recreate chart each time we open/change setup to avoid stale/blank canvas.
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        const chart = createChart(containerEl, {
          width: containerWidth,
          height: Math.max(containerHeight, 350),
          layout: {
            background: { color: theme.background },
            textColor: theme.text,
          },
          grid: {
            vertLines: { color: theme.grid },
            horzLines: { color: theme.grid },
          },
          rightPriceScale: {
            borderColor: theme.grid,
            visible: true,
            // Enable user to drag/resize the price scale with mouse
            mode: 0, // Normal mode allows dragging to resize
            autoScale: true, // Default to auto, but user can override by dragging
          },
          timeScale: {
            borderColor: theme.grid,
            timeVisible: true,
            secondsVisible: false,
            visible: true,
          },
          crosshair: {
            mode: 0,
          },
          // Enable vertical scrolling/panning of the chart
          handleScroll: {
            vertTouchDrag: true,   // Allow touch vertical drag
            mouseWheel: true,      // Mouse wheel to zoom
            pressedMouseMove: true, // Drag to pan
          },
          handleScale: {
            axisPressedMouseMove: {
              price: true, // Allow dragging price axis to scale
              time: true,  // Allow dragging time axis to scale
            },
            mouseWheel: true,
            pinch: true,
          },
        });

        chartRef.current = chart;

        // Normalize bars for consistent day-to-day coloring (green = up, red = down)
        const normalizedBars = normalizeBarsForConsistentColoring(bars);

        // Calculate dynamic precision based on price magnitude (crucial for micro-cap assets like BONK)
        const representativePrice = normalizedBars.length > 0 ? normalizedBars[normalizedBars.length - 1].c : 1;
        const { precision, minMove } = calculatePricePrecision(representativePrice);

        // Collect trade plan prices for autoscale — skip if trade is resolved
        const tradePlanPrices: number[] = [];
        if (!tradeResolved && visualSpec?.overlays && Array.isArray(visualSpec.overlays)) {
          for (const ov of visualSpec.overlays) {
            if (ov.type === 'hline' && Number.isFinite(ov.price)) {
              tradePlanPrices.push(ov.price);
            }
          }
        }

        // Use unified candlestick colors with dynamic price format
        const candleSeries = chart.addSeries(CandlestickSeries, {
          ...CANDLE_COLORS,
          priceFormat: {
            type: 'price',
            precision: precision,
            minMove: minMove,
          },
          // Extend autoscale to include trade plan price levels (Entry, SL, TP)
          ...(tradePlanPrices.length > 0 ? {
            autoscaleInfoProvider: () => ({
              priceRange: {
                minValue: Math.min(...tradePlanPrices),
                maxValue: Math.max(...tradePlanPrices),
              },
            }),
          } : {}),
        });

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

        // Dedupe + sort timestamps to prevent "data must be asc ordered" crashes
        const seen = new Map<number, CandlestickData>();
        for (const d of chartData) seen.set(d.time as number, d);
        const safeChartData = [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
        candleSeries.setData(safeChartData);

        const normalizedBarByTime = new Map<number, (typeof normalizedBars)[number]>();
        for (const bar of normalizedBars) {
          const ts = Math.floor(new Date(bar.t).getTime() / 1000);
          if (Number.isFinite(ts)) {
            normalizedBarByTime.set(ts, bar);
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

          // Build set of significant volume bar timestamps for highlighting
          const sigVolSet = new Set<number>();
          if (visualSpec?.significantVolumeBars) {
            for (const ts of visualSpec.significantVolumeBars) {
              const sec = Math.floor(new Date(ts).getTime() / 1000);
              if (Number.isFinite(sec)) sigVolSet.add(sec);
            }
          }

          const volumeData = safeChartData.map((d) => {
            const bar = bars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
            const isUp = bar ? bar.c >= bar.o : true;
            const highlighted = sigVolSet.has(d.time as number);
            return {
              time: d.time,
              value: bar?.v || 0,
              color: getVolumeColor(isUp, highlighted),
            };
          });

          volumeSeries.setData(volumeData);
        }

        // === ADD TECHNICAL INDICATORS (conditional based on settings) ===
        const currentIndicators = indicatorsRef.current;
        
        // EMA 20 (fast)
        if (currentIndicators.ema20) {
          const ema20Data = calculateEMA(bars, 20);
          if (ema20Data.length > 0) {
            const ema20Series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.ema20,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            ema20Series.setData(ema20Data.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        // EMA 50 (slow)
        if (currentIndicators.ema50) {
          const ema50Data = calculateEMA(bars, 50);
          if (ema50Data.length > 0) {
            const ema50Series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.ema50,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            ema50Series.setData(ema50Data.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        // EMA 200 (trend)
        if (currentIndicators.ema200) {
          const ema200Data = calculateEMA(bars, 200);
          if (ema200Data.length > 0) {
            const ema200Series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.ema200,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            ema200Series.setData(ema200Data.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        // Bollinger Bands (20, 2)
        if (currentIndicators.bollingerBands) {
          const bbData = calculateBollingerBands(bars, 20, 2);
          if (bbData.length > 0) {
            const bbUpperSeries = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.bollingerBands,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            bbUpperSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.upper })));

            const bbLowerSeries = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.bollingerBands,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            bbLowerSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.lower })));
          }
        }

        // VWAP
        if (currentIndicators.vwap) {
          const vwapData = calculateVWAP(bars);
          if (vwapData.length > 0) {
            const vwapSeries = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.vwap,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            vwapSeries.setData(vwapData.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        // Pattern overlays — standardized prescriptive style:
        // Entry = solid blue, SL = dashed red, TP = dashed green
        // Track actual overlay prices to use for shaded zones (ensures alignment)
        // SUPPRESS all trade plan lines when the trade is resolved
        let overlayEntryPrice = tradeResolved ? undefined : tradePlan?.entry;
        let overlaySlPrice = tradeResolved ? undefined : tradePlan?.stopLoss;
        let overlayTpPrice = tradeResolved ? undefined : tradePlan?.takeProfit;

        // Distance guard: current price for proximity checks
        const latestClose = chartData.length > 0 ? Number((chartData[chartData.length - 1] as any).close) : null;
        const pctDist = (price: number | undefined) => {
          if (!price || !latestClose || !Number.isFinite(price) || !Number.isFinite(latestClose)) return Infinity;
          return Math.abs((price - latestClose) / latestClose) * 100;
        };

        if (!tradeResolved && visualSpec?.overlays && Array.isArray(visualSpec.overlays)) {
          // Candle-close guard: if detection bar hasn't closed, show muted entry only
          const barClosed = visualSpec.detectionBarClosed !== false; // treat missing as closed (historical data)

          if (!barClosed) {
            // Render a single muted "Awaiting confirmation" line at entry price
            const entryOverlay = visualSpec.overlays.find((o: any) =>
              o.type === 'hline' && (o.id === 'entry' || (o.label || '').toLowerCase().includes('entry'))
            );
            if (entryOverlay && entryOverlay.type === 'hline') {
              const dist = pctDist(entryOverlay.price);
              if (dist <= 20) {
                candleSeries.createPriceLine({
                  price: entryOverlay.price,
                  color: '#6b7280',
                  lineWidth: 1,
                  lineStyle: 2,
                  axisLabelVisible: true,
                  title: 'Awaiting confirmation',
                });
                overlayEntryPrice = entryOverlay.price;
              }
            }
          } else {
            visualSpec.overlays.forEach((overlay) => {
              if (overlay.type === 'hline') {
                const isEntry = overlay.id === 'entry' || (overlay.label || '').toLowerCase().includes('entry');
                const isSL = overlay.id === 'sl' || (overlay.label || '').toLowerCase().includes('stop') || (overlay.label || '').toLowerCase() === 'sl';
                const isTP = overlay.id === 'tp' || (overlay.label || '').toLowerCase().includes('target') || (overlay.label || '').toLowerCase() === 'tp';

                let color = getOverlayColor(overlay.style);
                let lineStyle = 2; // dashed by default
                let title = overlay.label || '';

                if (isEntry) {
                  color = '#3b82f6';
                  lineStyle = 0; // solid
                  title = 'ENTRY';
                  overlayEntryPrice = overlay.price;
                } else if (isSL) {
                  color = '#ef4444';
                  lineStyle = 2;
                  title = 'SL';
                  overlaySlPrice = overlay.price;
                } else if (isTP) {
                  color = '#22c55e';
                  lineStyle = 2;
                  title = 'TP';
                  overlayTpPrice = overlay.price;
                }

                // Distance guard: suppress lines too far from current price
                const dist = pctDist(overlay.price);
                const maxDist = isEntry ? 20 : 25;
                if (dist > maxDist && !forceShowLevels) return;

                candleSeries.createPriceLine({
                  price: overlay.price,
                  color,
                  lineWidth: 2,
                  lineStyle,
                  axisLabelVisible: true,
                  title,
                });
              }
            });
          }
        }

        // Suppress overlay prices entirely when entry is too far from current price
        // This prevents zones, triangles, and other derived visuals from rendering out of sync
        const entryTooFar = pctDist(overlayEntryPrice) > 20;
        if (entryTooFar && !forceShowLevels) {
          setTradeLevelsSuppressed({ suppressed: true, entryPrice: overlayEntryPrice });
          overlayEntryPrice = undefined;
          overlaySlPrice = undefined;
          overlayTpPrice = undefined;
        } else {
          setTradeLevelsSuppressed({ suppressed: false });
        }

        // Note: some pivots can carry a "signalTs" timestamp (intraday) while bars are daily (00:00:00Z).
        // Use findNearestCandleTime to snap pivots to the closest existing bar instead of dropping them.
        const allMarkers: Array<{
          time: Time;
          position: 'aboveBar' | 'belowBar' | 'inBar';
          color: string;
          shape: SeriesMarkerShape;
          text: string;
        }> = [];

        // Collect canvas triangle markers (drawn on overlay instead of native markers)
        const canvasTriangleMarkers: Array<{
          time: number;
          price: number;
          direction: 'up' | 'down';
          color: string;
          label?: string;
        }> = [];

        // Add pivot markers (skip "Entry" — redundant; "Breakout Level" → canvas triangle)
        if (visualSpec.pivots && visualSpec.pivots.length > 0) {
          const isLongPattern = setup.direction === 'long';
          visualSpec.pivots.forEach((pivot) => {
            if ((pivot.label || '').toLowerCase().includes('entry')) return;

            const isHigh = pivot.type === 'high';
            const isBreakout = (pivot.label || '').toLowerCase().includes('breakout') || (pivot.label || '').toLowerCase().includes('breakdown');
            const isBreakdown = (pivot.label || '').toLowerCase().includes('breakdown');

            // Resolve pivot time: prefer index-based, then snap to nearest candle
            let t = Math.floor(new Date(pivot.timestamp).getTime() / 1000);
            if (
              Number.isInteger(pivot.index) &&
              pivot.index >= 0 &&
              pivot.index < bars.length
            ) {
              const altT = Math.floor(new Date(bars[pivot.index].t).getTime() / 1000);
              if (altT) t = altT;
            }
            // Snap to nearest chart candle instead of dropping non-matching pivots
            t = findNearestCandleTime(safeChartData, t);

            if (isBreakout) {
              const pointUp = !isBreakdown;
              // Anchor breakout/breakdown marker to the detection candle (consistent with StudyChart)
              const targetTs = setup.signalTs
                ? Math.floor(new Date(setup.signalTs).getTime() / 1000)
                : (bars.length > 0)
                  ? Math.floor(new Date(bars[bars.length - 1].t).getTime() / 1000)
                  : t;
              const anchorTime = findNearestCandleTime(safeChartData, targetTs);
              // Snap price to the candle's extreme (high for up, low for down) so the marker touches the candle
              const brkBar = normalizedBarByTime.get(anchorTime);
              const snappedPrice = brkBar
                ? (pointUp ? brkBar.h : brkBar.l)
                : pivot.price;
              canvasTriangleMarkers.push({
                time: anchorTime,
                price: snappedPrice,
                direction: pointUp ? 'up' : 'down',
                color: '#f97316',
                label: pivot.label || (isBreakdown ? 'Breakdown Level' : 'Breakout Level'),
              });
            } else {
              allMarkers.push({
                time: t as Time,
                position: isHigh ? 'aboveBar' : 'belowBar',
                color: isHigh ? PIVOT_COLORS.high : PIVOT_COLORS.low,
                shape: isHigh ? 'arrowDown' : 'arrowUp',
                text: pivot.role || pivot.label || (isHigh ? 'H' : 'L'),
              });
            }
          });
        }

        // Entry Point → canvas triangle at the pattern's detection/signal bar (consistent with StudyChart)
        if (!tradeResolved && safeChartData.length > 0 && tradePlan?.entry) {
          const isLong = setup.direction === 'long';

          // Determine target timestamp for the entry marker
          const detectedTs = setup.signalTs ? Math.floor(new Date(setup.signalTs).getTime() / 1000) : null;
          const lastBarTs = bars.length > 0 ? Math.floor(new Date(bars[bars.length - 1].t).getTime() / 1000) : null;
          const targetTs = detectedTs || lastBarTs || (safeChartData[safeChartData.length - 1].time as number);

          // Snap to nearest actual chart candle (prevents floating markers)
          const anchorTime = findNearestCandleTime(safeChartData, targetTs);
          const anchorBar = normalizedBarByTime.get(anchorTime) ?? normalizedBars[normalizedBars.length - 1];

          canvasTriangleMarkers.push({
            time: anchorTime,
            price: isLong ? (anchorBar?.l ?? tradePlan.entry) : (anchorBar?.h ?? tradePlan.entry),
            direction: isLong ? 'up' : 'down',
            color: '#3b82f6',
            label: '',
          });
        }

        // Sort markers by time (required by lightweight-charts) and render
        allMarkers.sort((a, b) => (a.time as number) - (b.time as number));

        if (allMarkers.length > 0) {
          try {
            createSeriesMarkers(candleSeries, allMarkers);
          } catch (e) {
            // Never break the chart if markers fail; candles are the priority.
            console.warn('Failed to render markers:', e);
          }
        }

        // Helper: draw filled triangle markers on canvas
        const drawCanvasTriangles = (ctx: CanvasRenderingContext2D) => {
          if (canvasTriangleMarkers.length === 0 || !chartRef.current) return;
          const ts = chartRef.current.timeScale();
          canvasTriangleMarkers.forEach((marker) => {
            try {
              const x = (ts as any).timeToCoordinate?.(marker.time);
              const y = (candleSeries as any).priceToCoordinate?.(marker.price);
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

        // ─── Formation Overlay: ZigZag + Trendlines + Shaded Zone ───
        let formation = deriveFormationOverlay(
          visualSpec?.pivots,
          bars,
          visualSpec?.patternId
        );
        if (formation) formation = snapFormationToChartTimes(formation, safeChartData);

        if (formation && formation.zigzag.length >= 2) {
          // ZigZag polyline — uses segment-split styling for flags/H&S
          renderZigZagSeries(chart, formation);

          // Dedupe helper for trendlines
          const dedupeLineData = (data: typeof formation.zigzag) => {
            const m = new Map<number, typeof data[0]>();
            for (const d of data) m.set(d.time as number, d);
            return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
          };

          // Upper trendline (green, dashed)
          if (formation.upperTrend.length >= 2) {
            const upperSeries = chart.addSeries(LineSeries, {
              color: 'rgba(34, 197, 94, 0.6)',
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            upperSeries.setData(dedupeLineData(formation.upperTrend));
          }

          // Lower trendline (red, dashed)
          if (formation.lowerTrend.length >= 2) {
            const lowerSeries = chart.addSeries(LineSeries, {
              color: 'rgba(239, 68, 68, 0.6)',
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            lowerSeries.setData(dedupeLineData(formation.lowerTrend));
          }

          // Neckline for reversal patterns
          renderNeckline(chart, candleSeries, visualSpec?.pivots, visualSpec?.patternId, bars);

          // Combined canvas overlay: formation zone + TP/SL shaded zones
          const formationZonePoints = formation.hasZone ? buildZonePoints(formation.upperTrend, formation.lowerTrend) : [];

          const drawAllCanvasOverlays = () => {
            const canvas = canvasOverlayRef.current;
            if (!canvas || !chartRef.current) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = containerEl.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(rect.width) * dpr;
            canvas.height = Math.floor(rect.height) * dpr;
            canvas.style.width = `${Math.floor(rect.width)}px`;
            canvas.style.height = `${Math.floor(rect.height)}px`;
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, rect.width, rect.height);

            // 1) Formation zone (cyan polygon)
            if (formationZonePoints.length >= 2) {
              const ts = chartRef.current!.timeScale();
              const ps = chartRef.current!.priceScale('right');
              const pixelPoints: { x: number; upper: number; lower: number }[] = [];
              for (const pt of formationZonePoints) {
                try {
                  const x = (ts as any).timeToCoordinate?.(pt.time as any);
                  const yUp = (ps as any).priceToCoordinate?.(pt.upper);
                  const yLo = (ps as any).priceToCoordinate?.(pt.lower);
                  if (x != null && yUp != null && yLo != null &&
                      Number.isFinite(x) && Number.isFinite(yUp) && Number.isFinite(yLo)) {
                    pixelPoints.push({ x, upper: yUp, lower: yLo });
                  }
                } catch { /* coordinate conversion may fail */ }
              }
              if (pixelPoints.length >= 2) {
                ctx.beginPath();
                ctx.moveTo(pixelPoints[0].x, pixelPoints[0].upper);
                for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].upper);
                for (let i = pixelPoints.length - 1; i >= 0; i--) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].lower);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 200, 255, 0.06)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 200, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }

            // 2) TP/SL shaded zones — use overlay prices for exact alignment with dotted lines
            // Zone sync guard: suppress zones when entry is >3% from current price
            const latestBarClose = chartData.length > 0 ? Number((chartData[chartData.length - 1] as any).close) : null;
            const entryPctDist = latestBarClose && overlayEntryPrice 
              ? Math.abs((overlayEntryPrice - latestBarClose) / latestBarClose) * 100 : 0;
            const zonesInSync = entryPctDist <= 3;

            if (zonesInSync && overlayEntryPrice != null && overlayTpPrice != null && overlaySlPrice != null) {
              const entryY = (candleSeries as any).priceToCoordinate(overlayEntryPrice);
              const tpY = (candleSeries as any).priceToCoordinate(overlayTpPrice);
              const slY = (candleSeries as any).priceToCoordinate(overlaySlPrice);
              if (entryY != null && tpY != null && slY != null) {
                ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
                ctx.fillRect(0, Math.min(entryY, tpY), rect.width, Math.abs(tpY - entryY));
                ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
                ctx.fillRect(0, Math.min(entryY, slY), rect.width, Math.abs(slY - entryY));
              }
            }

            // 3) Triangle markers
            drawCanvasTriangles(ctx);
          };

          const overlayTimerId1 = setTimeout(() => {
            overlayRafId1 = requestAnimationFrame(drawAllCanvasOverlays);
          }, 200);
          chart.timeScale().subscribeVisibleLogicalRangeChange(drawAllCanvasOverlays);
        }

        // TP/SL shaded zones standalone + triangles (when no formation overlay exists)
        if (!(visualSpec?.pivots && visualSpec.pivots.length >= 2)) {
          const needsStandalone = (overlayEntryPrice != null && overlayTpPrice != null && overlaySlPrice != null) || canvasTriangleMarkers.length > 0;
          if (needsStandalone) {
            const drawStandaloneTradePlanZones = () => {
              const canvas = canvasOverlayRef.current;
              if (!canvas || !chartRef.current) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              const rect = containerEl.getBoundingClientRect();
              const dpr = window.devicePixelRatio || 1;
              canvas.width = Math.floor(rect.width) * dpr;
              canvas.height = Math.floor(rect.height) * dpr;
              canvas.style.width = `${Math.floor(rect.width)}px`;
              canvas.style.height = `${Math.floor(rect.height)}px`;
              ctx.scale(dpr, dpr);
              ctx.clearRect(0, 0, rect.width, rect.height);

              // Zone sync guard: suppress shaded zones when entry is >3% from price
              const sLatestClose = chartData.length > 0 ? Number((chartData[chartData.length - 1] as any).close) : null;
              const standaloneEntryDist = sLatestClose && overlayEntryPrice
                ? Math.abs((overlayEntryPrice - sLatestClose) / sLatestClose) * 100 : 0;
              if (standaloneEntryDist <= 3 && overlayEntryPrice != null && overlayTpPrice != null && overlaySlPrice != null) {
                const entryY = (candleSeries as any).priceToCoordinate(overlayEntryPrice);
                const tpY = (candleSeries as any).priceToCoordinate(overlayTpPrice);
                const slY = (candleSeries as any).priceToCoordinate(overlaySlPrice);
                if (entryY != null && tpY != null && slY != null) {
                  ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
                  ctx.fillRect(0, Math.min(entryY, tpY), rect.width, Math.abs(tpY - entryY));
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
                  ctx.fillRect(0, Math.min(entryY, slY), rect.width, Math.abs(slY - entryY));
                }
              }

              drawCanvasTriangles(ctx);
            };

            const overlayTimerId2 = setTimeout(() => {
              overlayRafId2 = requestAnimationFrame(drawStandaloneTradePlanZones);
            }, 200);
            chart.timeScale().subscribeVisibleLogicalRangeChange(drawStandaloneTradePlanZones);
          }
        }

        // Calculate optimal price margins based on data volatility
        // Ensures charts never look "flat" regardless of actual price movement
        const hasOverlays = visualSpec?.overlays && visualSpec.overlays.length > 0;
        const optimalMargins = calculateOptimalPriceMargins(bars, hasOverlays);
        chart.priceScale('right').applyOptions({
          autoScale: true,
          scaleMargins: optimalMargins,
        });

        // Show recent bars focused on the right edge instead of centering all data
        const totalBars = bars.length;
        const visibleBars = Math.min(totalBars, 120);
        const from = Math.max(0, totalBars - visibleBars);
        const to = totalBars + 2; // minimal right margin
        chart.timeScale().setVisibleLogicalRange({ from, to });

        resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry || !chartRef.current) return;
          chartRef.current.applyOptions({
            width: Math.floor(entry.contentRect.width),
            height: Math.max(Math.floor(entry.contentRect.height || 0), 350),
          });
        });

        resizeObserver.observe(containerEl);
      } catch (e) {
        console.error('FullChartViewer chart init failed:', e);
        setChartError('Chart failed to render.');
      }
    };

    // Start initialization on next frame to avoid 0px measurements
    rafId = window.requestAnimationFrame(initChart);

    return () => {
      cleanedUp = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (overlayTimerId1) clearTimeout(overlayTimerId1);
      if (overlayTimerId2) clearTimeout(overlayTimerId2);
      if (overlayRafId1) cancelAnimationFrame(overlayRafId1);
      if (overlayRafId2) cancelAnimationFrame(overlayRafId2);
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [setup, open, containerEl, loading, chartVersion, forceShowLevels]);

  // Reset chart to auto-scale and fit all content
  const handleResetChart = () => {
    if (!chartRef.current) return;
    
    // Re-enable auto-scale on price axis
    chartRef.current.priceScale('right').applyOptions({
      autoScale: true,
    });
    
    // Fit all data in view
    chartRef.current.timeScale().fitContent();
    
    toast.success('Chart reset to fit content');
  };

  // Vertical panning handlers - allows user to drag the chart up/down
  const handleChartMouseDown = (e: React.MouseEvent) => {
    // Only activate on middle mouse button or Shift+left click for vertical pan
    // This avoids interfering with normal chart interactions
    if (e.shiftKey || e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartY.current = e.clientY;
      
      // Capture current price range
      if (chartRef.current) {
        const mainSeries = (chartRef.current as any).seriesList?.[0];
        if (mainSeries) {
          try {
            const priceScale = chartRef.current.priceScale('right');
            // Disable auto-scale to allow manual panning
            priceScale.applyOptions({ autoScale: false });
          } catch {
            // Ignore errors
          }
        }
      }
    }
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartY.current === null || !chartRef.current || !containerEl) return;
    
    const deltaY = e.clientY - dragStartY.current;
    dragStartY.current = e.clientY;
    
    // Calculate price delta based on chart height and visible range
    const chartHeight = containerEl.clientHeight;
    if (chartHeight <= 0) return;
    
    try {
      const priceScale = chartRef.current.priceScale('right');
      const options = priceScale.options();
      const currentMargins = options.scaleMargins || { top: 0.1, bottom: 0.1 };
      
      // Adjust margins based on drag direction (inverted because screen Y is inverted)
      const marginDelta = deltaY / chartHeight * 0.3; // Sensitivity factor
      const newTop = Math.max(0, Math.min(0.9, currentMargins.top + marginDelta));
      const newBottom = Math.max(0, Math.min(0.9, currentMargins.bottom - marginDelta));
      
      priceScale.applyOptions({
        autoScale: false,
        scaleMargins: { top: newTop, bottom: newBottom },
      });
    } catch {
      // Ignore errors during pan
    }
  };

  const handleChartMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartY.current = null;
    }
  };

  const handleChartMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartY.current = null;
    }
  };
  if (!setup) return null;

  const hasBars = Array.isArray(setup.bars) && setup.bars.length > 0;

  const { tradePlan, direction, patternName, instrument, visualSpec, quality, currentPrice, changePercent } = setup as SetupWithVisuals & { currentPrice?: number; changePercent?: number | null };
  const translatedPatternName = translatePatternName(patternName);
  const isLong = direction === 'long';
  const decimals = tradePlan.priceRounding?.priceDecimals || 2;
  const formatPrice = (price: number) => price.toFixed(Math.min(decimals, 6));
  const doNotTradeConditionKeys = getDoNotTradeKeys(setup.patternId, direction);

  // Defensive: older artifacts may not include the full PatternQuality shape
  const qualityReasons: string[] = Array.isArray((quality as any)?.reasons) ? (quality as any).reasons : [];
  const qualityGrade: string | undefined =
    (quality as any)?.grade ?? (typeof (quality as any)?.score === 'string' ? (quality as any).score : undefined);

  const getInstrumentCategory = getInstrumentCategoryUtil;

  const instrumentCategory = getInstrumentCategory(instrument);
  const tradingViewUrl = getTradingViewUrl(instrument, instrumentCategory, visualSpec?.timeframe || '1d');
  const tradingViewAffiliateUrl = `${tradingViewUrl}&aff_id=3433`;

  const openExternal = async (url: string) => {
    // TradingView blocks iframe embedding. The Lovable preview is iframe-based,
    // so opening directly is often blocked; we instead show the link inline for copy.

    const isEmbeddedPreview = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const showLinkForCopy = async (reason: string) => {
      setExternalLink(url);

      try {
        await navigator.clipboard.writeText(url);
        toast.message(`${reason} Link copied.`);
      } catch {
        toast.message(`${reason} Link shown below to copy.`);
      }
    };

    if (isEmbeddedPreview) {
      await showLinkForCopy("TradingView can’t open inside the preview.");
      return;
    }

    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win) return;
    } catch {
      // ignore
    }

    await showLinkForCopy('Popup blocked.');
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InstrumentLogo instrument={instrument} size="lg" />
              <div className={`p-2 rounded-lg ${isLong ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {isLong ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  <Link 
                    to="/members/dashboard"
                    state={{ initialSymbol: instrument }}
                    className="hover:text-primary transition-colors hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {instrument}
                  </Link>
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground">{translatedPatternName} • {(visualSpec?.timeframe || '').toUpperCase()}</p>
                  {currentPrice != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-sm cursor-help border-b border-dashed border-muted-foreground/30">
                          {currentPrice.toLocaleString(undefined, { 
                            minimumFractionDigits: currentPrice < 10 ? 4 : 2,
                            maximumFractionDigits: currentPrice < 10 ? 4 : 2
                          })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{fc('previousSessionClose')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {changePercent != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`font-mono text-sm font-medium cursor-help border-b border-dashed border-muted-foreground/30 ${
                          changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{fc('changeVsPrior')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {typeof (quality as any)?.score === 'number' && typeof (quality as any)?.grade === 'string' ? (
                <PatternQualityBadge
                  quality={quality as any}
                  size="sm"
                  showTooltip={false}
                />
              ) : (
                <GradeBadge
                  grade={qualityGrade || (quality as any)?.score || 'C'}
                  variant="pill"
                  size="sm"
                  showTooltip={false}
                />
              )}
              <Badge variant={isLong ? 'default' : 'destructive'}>
                {isLong ? 'LONG' : 'SHORT'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Chart (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Playback Mode Toggle (only for historical patterns) */}
              {canPlayback && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Play className="h-3.5 w-3.5" />
                    <span>{fc('tradePlayback')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {playbackEnabled ? fc('interactiveReplay') : fc('staticView')}
                    </span>
                    <Switch
                      id="playback-toggle"
                      checked={playbackEnabled}
                      onCheckedChange={setPlaybackEnabled}
                    />
                  </div>
                </div>
              )}

              {/* Conditional Chart Rendering */}
              {playbackEnabled && canPlayback && computedEntryBarIndex != null ? (
                <FullChartPlaybackView
                  bars={setup.bars}
                  visualSpec={visualSpec}
                  direction={direction}
                  entryBarIndex={computedEntryBarIndex}
                  barsToOutcome={setup.barsToOutcome ?? null}
                  outcome={setup.outcome}
                  tradePlan={{
                    entry: tradePlan.entry,
                    stopLoss: tradePlan.stopLoss,
                    takeProfit: tradePlan.takeProfit,
                  }}
                  indicators={indicators}
                  height={420}
                />
              ) : (
                <>
                {tradeLevelsSuppressed.suppressed && tradeLevelsSuppressed.entryPrice != null && (
                  <div className="flex items-center justify-between px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-t">
                    <span>Trade levels outside view — detected entry at {tradeLevelsSuppressed.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    <button
                      className="ml-3 text-xs text-primary hover:underline font-medium"
                      onClick={() => {
                        setForceShowLevels(true);
                      }}
                    >
                      Show anyway
                    </button>
                  </div>
                )}
                <div 
                  className="relative"
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleChartMouseUp}
                  onMouseLeave={handleChartMouseLeave}
                >
                  <div
                    ref={setContainerEl}
                    className={`w-full h-[350px] lg:h-[420px] rounded-lg overflow-hidden border border-border/50 ${isDragging ? 'cursor-grabbing' : ''}`}
                  />
                  {/* Canvas overlay for formation zone shading */}
                  <canvas
                    ref={canvasOverlayRef}
                    className="absolute inset-0 pointer-events-none z-[5]"
                  />
                  
                  {/* Indicator Legend */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-sm pointer-events-none z-10">
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
                  </div>

                  {/* Chart Controls: Pan hint + Reset + Indicator Settings */}
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                    {/* Pan hint - shows only when not dragging */}
                    {!isDragging && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-muted-foreground bg-background/90 border border-border/40 px-2 py-1 rounded cursor-help hidden lg:inline-flex items-center gap-1.5">
                            <kbd className="px-1 py-0.5 text-sm bg-muted rounded font-mono">Shift</kbd>
                            <span>+ drag to pan</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px]">
                          <p className="text-xs">Hold <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-sm">Shift</kbd> + left-click drag to move the chart up/down. Or use middle-mouse drag.</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {isDragging && (
                      <span className="text-sm text-amber-500 bg-background/90 border border-amber-500/30 px-2 py-1 rounded inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Panning...
                      </span>
                    )}
                    {/* Reset Chart Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 bg-background/90 border-border/50 hover:bg-background"
                          onClick={handleResetChart}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{fc('resetView')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 bg-background/90 border-border/50 hover:bg-background"
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">{fc('indicators')}</span>
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
                              <Label htmlFor="fc-ema20" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                EMA 20
                              </Label>
                              <Switch
                                id="fc-ema20"
                                checked={indicators.ema20}
                                onCheckedChange={() => handleToggle('ema20')}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="fc-ema50" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                EMA 50
                              </Label>
                              <Switch
                                id="fc-ema50"
                                checked={indicators.ema50}
                                onCheckedChange={() => handleToggle('ema50')}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="fc-ema200" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                EMA 200
                              </Label>
                              <Switch
                                id="fc-ema200"
                                checked={indicators.ema200}
                                onCheckedChange={() => handleToggle('ema200')}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="fc-bb" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                {fc('bollingerBands')}
                              </Label>
                              <Switch
                                id="fc-bb"
                                checked={indicators.bollingerBands}
                                onCheckedChange={() => handleToggle('bollingerBands')}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="fc-vwap" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                VWAP
                              </Label>
                              <Switch
                                id="fc-vwap"
                                checked={indicators.vwap}
                                onCheckedChange={() => handleToggle('vwap')}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border/50">
                            <p className="text-sm text-muted-foreground">
                              {fc('indicatorsActive', { count: Object.values(indicators).filter(Boolean).length })}
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {chartError && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                      {chartError}
                    </div>
                  )}

                  {!chartError && (loading || !hasBars) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{loading ? fc('loadingChart') : fc('noChartData')}</span>
                    </div>
                  )}
                </div>
                </>
              )}
            
            {/* Trade Levels */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  {fc('entry')}
                </div>
                <p className="font-mono font-bold text-primary">{formatPrice(tradePlan.entry)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <ShieldAlert className="h-3 w-3" />
                  {fc('stopLoss')}
                </div>
                <p className="font-mono font-bold text-destructive">{formatPrice(tradePlan.stopLoss)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {fc('takeProfit')}
                </div>
                <p className="font-mono font-bold text-green-500">{formatPrice(tradePlan.takeProfit)}</p>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{fc('riskReward')}</div>
                <p className="font-mono font-bold">1:{tradePlan.rr.toFixed(2)}</p>
              </div>
            </div>

            {/* Historical Performance Stats */}
            {(setup as any).historicalPerformance && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{fc('winRate')}</div>
                  <p className={`font-mono font-bold ${
                    (setup as any).historicalPerformance.winRate >= 50 ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {(setup as any).historicalPerformance.winRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({fc('samples', { count: (setup as any).historicalPerformance.sampleSize })})
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{fc('avgRoi')}</div>
                  <p className={`font-mono font-bold ${
                    (setup as any).historicalPerformance.avgRMultiple >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(setup as any).historicalPerformance.avgRMultiple >= 0 ? '+' : ''}
                    {(setup as any).historicalPerformance.avgRMultiple.toFixed(2)}R
                  </p>
                  <p className="text-sm text-muted-foreground">{fc('perTrade')}</p>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{fc('avgDuration')}</div>
                  <p className="font-mono font-bold">
                    {(setup as any).historicalPerformance.avgDurationBars 
                      ? `${(setup as any).historicalPerformance.avgDurationBars} bars` 
                      : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">{fc('toOutcome')}</p>
                </div>
              </div>
            )}

            {/* Actions - Monetization CTAs */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => requireAuth(onCreateAlert)} disabled={isCreatingAlert} className="flex-1">
                {isCreatingAlert ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {fc('setAlert')}
              </Button>
              {onExportPine && (
                <Button variant="secondary" onClick={() => requireAuth(onExportPine)} className="flex-1">
                  <FileCode className="h-4 w-4 mr-2" />
                  {fc('generateScript')}
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => requireAuth(() => {
                  const gradeParam = qualityGrade || undefined;
                  window.location.href = buildPatternLabUrl({ instrument: setup.instrument, pattern: setup.patternId, timeframe: (setup as any).timeframe || '1D', mode: 'validate', grade: gradeParam });
                })}
              >
                <Play className="h-4 w-4 mr-2" />
                 {fc('runBacktest')}
              </Button>
            </div>
            <div className="flex gap-2">
              {onSaveToVault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveToVault}
                  disabled={isSavingToVault}
                  className="flex-1"
                >
                  {isSavingToVault ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4 mr-2" />
                  )}
                  {fc('saveToVault')}
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={sharing}
                    className="flex-1"
                  >
                    {sharing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                     {fc('share')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="center">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const dbId = setup?.dbId;
                        if (dbId) {
                          sharePattern(dbId, setup.instrument, setup.patternName || setup.patternId, 'twitter', {
                            entry: setup.tradePlan.entry,
                            stopLoss: setup.tradePlan.stopLoss,
                            takeProfit: setup.tradePlan.takeProfit,
                            rr: setup.tradePlan.rr,
                          }, setup.direction);
                        } else { toast.error('Cannot share this pattern'); }
                      }}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      {fc('postOnX')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const dbId = setup?.dbId;
                        if (dbId) {
                          sharePattern(dbId, setup.instrument, setup.patternName || setup.patternId, 'whatsapp', {
                            entry: setup.tradePlan.entry,
                            stopLoss: setup.tradePlan.stopLoss,
                            takeProfit: setup.tradePlan.takeProfit,
                            rr: setup.tradePlan.rr,
                          }, setup.direction);
                        } else { toast.error('Cannot share this pattern'); }
                      }}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </Button>
                    <Separator className="my-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const dbId = setup?.dbId;
                        if (dbId) {
                          sharePattern(dbId, setup.instrument, setup.patternName || setup.patternId, 'clipboard', {
                            entry: setup.tradePlan.entry,
                            stopLoss: setup.tradePlan.stopLoss,
                            takeProfit: setup.tradePlan.takeProfit,
                            rr: setup.tradePlan.rr,
                          }, setup.direction);
                        } else { toast.error('Cannot share this pattern'); }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {fc('copyLink')}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Right: Info Panel (1 col) */}
          <div className="space-y-4">
            {/* Quality Reasons */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {fc('qualityFactors')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs space-y-1.5">
                  {qualityReasons.length > 0 ? (
                    qualityReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-muted-foreground">{translateQualityReason(reason, t)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">{fc('noQualityFactors')}</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Do Not Trade */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {fc('doNotTradeIf')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs space-y-1.5">
                  {doNotTradeConditionKeys.slice(0, 5).map((key, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">✕</span>
                      <span className="text-muted-foreground">{fc(`doNotTrade.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Journey CTAs - Next Steps */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                   {fc('nextSteps')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Research History */}
                <a 
                  href={buildPatternLabUrl({ pattern: setup.patternId, instrument, grade: qualityGrade || undefined })}
                  className="block"
                >
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="p-1.5 rounded bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                      <History className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-medium">{fc('researchHistory')}</p>
                       <p className="text-sm text-muted-foreground truncate">{fc('backtestFor', { pattern: translatedPatternName })}</p>
                    </div>
                  </div>
                </a>


                {/* Get Script */}
                <a 
                  href="/members/scripts"
                  className="block"
                >
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="p-1.5 rounded bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                      <FileCode className="h-3.5 w-3.5 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-medium">{fc('automateWithScripts')}</p>
                       <p className="text-sm text-muted-foreground truncate">{fc('pineScriptExport')}</p>
                    </div>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-border/50">
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fc('signalTime')}</span>
                  <span className="font-mono">{new Date(setup.signalTs).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fc('timeStop')}
                  </span>
                  <span className="font-mono">{tradePlan.timeStopBars} bars</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fc('bracketEngine')}</span>
                  <span className="font-mono">v{tradePlan.bracketLevelsVersion}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fc('entryType')}</span>
                  <span className="capitalize">{tradePlan.entryType}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {DISCLAIMERS.SHORT}
          </p>
        </div>

        {/* Historical Pattern Occurrences List - filter by symbol for instrument-specific 5-year history */}
        <div className="mt-6">
          <HistoricalOccurrencesList
            patternId={setup.patternId}
            patternName={setup.patternName}
            symbol={setup.instrument}
            timeframe={visualSpec.timeframe}
            direction={direction}
            selectedRR={selectedRR}
            className="border-border/50"
          />
        </div>
      </DialogContent>
    </Dialog>
    <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="this feature" />
    </>
  );
}
