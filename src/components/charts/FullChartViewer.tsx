import { useEffect, useRef, useState } from 'react';
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
  Copy,
  Bell,
  FileCode,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  CheckCircle2,
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
} from 'lucide-react';
import { SetupWithVisuals } from '@/types/VisualSpec';
import { DISCLAIMERS } from '@/constants/disclaimers';
import { getTradingViewUrl } from '@/utils/tradingViewLinks';
import { HistoricalOccurrencesList } from './HistoricalOccurrencesList';
import { toast } from 'sonner';
import { InstrumentLogo } from './InstrumentLogo';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { PatternQualityBadge } from '@/components/charts/PatternQualityBadge';
import { FullChartPlaybackView } from './FullChartPlaybackView';
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
  sma200: boolean;
  bollingerBands: boolean;
  vwap: boolean;
}

const DEFAULT_INDICATORS: IndicatorSettings = {
  ema20: true,
  ema50: true,
  sma200: true,
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
  onCopyPlan: () => void;
  onCreateAlert: () => void;
  onExportPine?: () => void;
  onSaveToVault?: () => void;
  isCreatingAlert: boolean;
  isSavingToVault?: boolean;
  selectedRR?: number; // User-selected R:R for trade planning
}

// Do Not Trade conditions based on pattern and market structure
const getDoNotTradeConditions = (patternId: string, direction: 'long' | 'short'): string[] => {
  const commonConditions = [
    'Major economic news within next 4 hours',
    'Weekend gap risk (Friday close)',
    'Low liquidity session (holidays)',
  ];
  
  const patternConditions: Record<string, string[]> = {
    rising_wedge: [
      'Strong bullish momentum with no divergence',
      'Price above 20 EMA with increasing volume',
    ],
    falling_wedge: [
      'Strong bearish momentum with no divergence',
      'Price below 20 EMA with increasing volume',
    ],
    ascending_triangle: [
      'Resistance level already broken and retested',
      'Volume declining on breakout attempt',
    ],
    descending_triangle: [
      'Support level already broken and retested',
      'Bullish divergence on momentum indicators',
    ],
    head_shoulders: [
      'Right shoulder higher than left',
      'Volume pattern not confirming breakdown',
    ],
    double_top: [
      'Second top significantly lower than first',
      'Strong support holding after second test',
    ],
    double_bottom: [
      'Second bottom significantly higher than first',
      'Strong resistance holding after second test',
    ],
  };
  
  const directionConditions = direction === 'long'
    ? ['Strong bearish trend on higher timeframe']
    : ['Strong bullish trend on higher timeframe'];
  
  return [
    ...commonConditions,
    ...(patternConditions[patternId] || []),
    ...directionConditions,
  ];
};

export default function FullChartViewer({ 
  open, 
  onOpenChange, 
  setup,
  loading = false,
  onCopyPlan,
  onCreateAlert,
  onExportPine,
  onSaveToVault,
  isCreatingAlert,
  isSavingToVault = false,
  selectedRR = 2,
}: FullChartViewerProps) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState<string | null>(null);
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicatorSettings);
  const indicatorsRef = useRef<IndicatorSettings>(indicators);
  const [chartVersion, setChartVersion] = useState(0);
  
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
    if (!bars || bars.length === 0) {
      console.warn('[FullChartViewer] no bars to render');
      return;
    }

    let cleanedUp = false;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;
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
            mode: 1,
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

        // Use unified candlestick colors with dynamic price format
        const candleSeries = chart.addSeries(CandlestickSeries, {
          ...CANDLE_COLORS,
          priceFormat: {
            type: 'price',
            precision: precision,
            minMove: minMove,
          },
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

        // SMA 200 (trend)
        if (currentIndicators.sma200) {
          const sma200Data = calculateSMA(bars, 200);
          if (sma200Data.length > 0) {
            const sma200Series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.sma200,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            sma200Series.setData(sma200Data.map(p => ({ time: p.time as Time, value: p.value })));
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

        // Pattern overlays (entry, SL, TP lines)
        if (visualSpec?.overlays && Array.isArray(visualSpec.overlays)) {
          visualSpec.overlays.forEach((overlay) => {
            if (overlay.type === 'hline') {
              candleSeries.createPriceLine({
                price: overlay.price,
                color: getOverlayColor(overlay.style),
                lineWidth: 2,
                lineStyle: overlay.id === 'entry' ? 0 : 2,
                axisLabelVisible: true,
                title: overlay.label,
              });
            }
          });
        }

        // Candle-level pivot confirmation markers
        // Note: some pivots can carry a "signalTs" timestamp (intraday) while bars are daily (00:00:00Z).
        // Lightweight-charts markers must reference an existing bar time, so we snap to the pivot index when needed.
        const timeSet = new Set<number>(chartData.map((d) => d.time as number));
        const allMarkers: Array<{
          time: Time;
          position: 'aboveBar' | 'belowBar' | 'inBar';
          color: string;
          shape: SeriesMarkerShape;
          text: string;
        }> = [];

        // Add pivot markers
        if (visualSpec.pivots && visualSpec.pivots.length > 0) {
          visualSpec.pivots.forEach((pivot) => {
            const isHigh = pivot.type === 'high';

            let t = Math.floor(new Date(pivot.timestamp).getTime() / 1000);

            if (
              !timeSet.has(t) &&
              Number.isInteger(pivot.index) &&
              pivot.index >= 0 &&
              pivot.index < bars.length
            ) {
              t = Math.floor(new Date(bars[pivot.index].t).getTime() / 1000);
            }

            if (!timeSet.has(t)) return;

            allMarkers.push({
              time: t as Time,
              position: isHigh ? 'aboveBar' : 'belowBar',
              color: isHigh ? PIVOT_COLORS.high : PIVOT_COLORS.low,
              shape: isHigh ? 'arrowDown' : 'arrowUp',
              text: pivot.label || (isHigh ? 'H' : 'L'),
            });
          });
        }

        // Add Entry Point marker on the last (signal) bar
        // This makes the entry point visually prominent on the chart
        if (chartData.length > 0 && tradePlan?.entry) {
          const lastBar = chartData[chartData.length - 1];
          const entryMarkerPosition = setup.direction === 'long' ? 'belowBar' : 'aboveBar';
          const entryMarkerShape: SeriesMarkerShape = setup.direction === 'long' ? 'arrowUp' : 'arrowDown';
          
          allMarkers.push({
            time: lastBar.time,
            position: entryMarkerPosition,
            color: '#f59e0b', // Amber/orange for entry - stands out from green/red
            shape: entryMarkerShape,
            text: 'Entry',
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
        // Calculate optimal price margins based on data volatility
        // Ensures charts never look "flat" regardless of actual price movement
        const hasOverlays = visualSpec?.overlays && visualSpec.overlays.length > 0;
        const optimalMargins = calculateOptimalPriceMargins(bars, hasOverlays);
        chart.priceScale('right').applyOptions({
          autoScale: true,
          scaleMargins: optimalMargins,
        });

        chart.timeScale().fitContent();

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
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [setup, open, containerEl, loading, chartVersion]);

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
  const isLong = direction === 'long';
  const decimals = tradePlan.priceRounding?.priceDecimals || 2;
  const formatPrice = (price: number) => price.toFixed(Math.min(decimals, 6));
  const doNotTradeConditions = getDoNotTradeConditions(setup.patternId, direction);

  // Defensive: older artifacts may not include the full PatternQuality shape
  const qualityReasons: string[] = Array.isArray((quality as any)?.reasons) ? (quality as any).reasons : [];
  const qualityGrade: string | undefined =
    (quality as any)?.grade ?? (typeof (quality as any)?.score === 'string' ? (quality as any).score : undefined);

  // Determine instrument category for TradingView link
  const getInstrumentCategory = (symbol: string): 'crypto' | 'stocks' | 'forex' | 'commodities' => {
    const upper = symbol.toUpperCase();
    // Yahoo-format commodities (e.g., GC=F, CL=F, SI=F)
    if (upper.endsWith('=F')) return 'commodities';
    // Yahoo-format forex (e.g., EURUSD=X)
    if (upper.endsWith('=X')) return 'forex';
    // Yahoo-format crypto (e.g., BTC-USD, ETH-USD)
    const cryptoBases = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'LTC', 'ATOM', 'UNI', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI', 'SEI', 'BNB', 'SHIB', 'TRX', 'TON'];
    if (cryptoBases.some(base => upper.startsWith(base + '-') || upper.startsWith(base + 'USD'))) return 'crypto';
    if (upper.endsWith('USDT') || upper.endsWith('BTC')) return 'crypto';
    // Forex pairs (6 chars like EURUSD)
    if (upper.length === 6 && upper.includes('USD')) return 'forex';
    return 'stocks';
  };

  const instrumentCategory = getInstrumentCategory(instrument);
  const tradingViewUrl = getTradingViewUrl(instrument, instrumentCategory, visualSpec.timeframe);
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
                    to={`/study/${encodeURIComponent(instrument)}`}
                    className="hover:text-primary transition-colors hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {instrument}
                  </Link>
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground">{patternName} • {visualSpec.timeframe.toUpperCase()}</p>
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
                        <p className="text-xs">Previous session close. Daily data only.</p>
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
                        <p className="text-xs">Change vs. prior session close. Intraday moves not shown.</p>
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
                    <span>Trade Playback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {playbackEnabled ? 'Interactive replay' : 'Static view'}
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
                  
                  {/* Indicator Legend */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[10px] pointer-events-none z-10">
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
                  </div>

                  {/* Chart Controls: Pan hint + Reset + Indicator Settings */}
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                    {/* Pan hint - shows only when not dragging */}
                    {!isDragging && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-muted-foreground bg-background/90 border border-border/40 px-2 py-1 rounded cursor-help hidden lg:inline-flex items-center gap-1.5">
                            <kbd className="px-1 py-0.5 text-[9px] bg-muted rounded font-mono">Shift</kbd>
                            <span>+ drag to pan</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px]">
                          <p className="text-xs">Hold <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-[10px]">Shift</kbd> + left-click drag to move the chart up/down. Or use middle-mouse drag.</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {isDragging && (
                      <span className="text-[10px] text-amber-500 bg-background/90 border border-amber-500/30 px-2 py-1 rounded inline-flex items-center gap-1">
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
                        <p className="text-xs">Reset view &amp; re-enable auto-scale</p>
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
                              <Label htmlFor="fc-sma200" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                SMA 200
                              </Label>
                              <Switch
                                id="fc-sma200"
                                checked={indicators.sma200}
                                onCheckedChange={() => handleToggle('sma200')}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="fc-bb" className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                Bollinger Bands
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
                            <p className="text-[10px] text-muted-foreground">
                              {Object.values(indicators).filter(Boolean).length} of 5 indicators active
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
                      <span>{loading ? 'Loading detailed chart…' : 'No chart data available for this setup.'}</span>
                    </div>
                  )}
                </div>
              )}
            
            {/* Trade Levels */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  Entry
                </div>
                <p className="font-mono font-bold text-primary">{formatPrice(tradePlan.entry)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <ShieldAlert className="h-3 w-3" />
                  Stop Loss
                </div>
                <p className="font-mono font-bold text-destructive">{formatPrice(tradePlan.stopLoss)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Take Profit
                </div>
                <p className="font-mono font-bold text-green-500">{formatPrice(tradePlan.takeProfit)}</p>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Risk:Reward</div>
                <p className="font-mono font-bold">1:{tradePlan.rr.toFixed(2)}</p>
              </div>
            </div>

            {/* Historical Performance Stats */}
            {(setup as any).historicalPerformance && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                  <p className={`font-mono font-bold ${
                    (setup as any).historicalPerformance.winRate >= 50 ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {(setup as any).historicalPerformance.winRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ({(setup as any).historicalPerformance.sampleSize} samples)
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Avg ROI</div>
                  <p className={`font-mono font-bold ${
                    (setup as any).historicalPerformance.avgRMultiple >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(setup as any).historicalPerformance.avgRMultiple >= 0 ? '+' : ''}
                    {(setup as any).historicalPerformance.avgRMultiple.toFixed(2)}R
                  </p>
                  <p className="text-[10px] text-muted-foreground">per trade</p>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Avg Duration</div>
                  <p className="font-mono font-bold">
                    {(setup as any).historicalPerformance.avgDurationBars 
                      ? `${(setup as any).historicalPerformance.avgDurationBars} bars` 
                      : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">to outcome</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <CopyPlanButton onCopy={onCopyPlan} />
              <Button onClick={onCreateAlert} disabled={isCreatingAlert} className="flex-1">
                {isCreatingAlert ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Create Alert
              </Button>
              {onSaveToVault && (
                <Button
                  variant="secondary"
                  onClick={onSaveToVault}
                  disabled={isSavingToVault}
                  className="flex-1"
                >
                  {isSavingToVault ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4 mr-2" />
                  )}
                  Save to Vault
                </Button>
              )}
              {onExportPine && (
                <Button variant="secondary" onClick={onExportPine}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Pine
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Open in TradingView"
                onClick={() => openExternal(tradingViewUrl)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {externalLink && (
              <Card className="border-border/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      TradingView link (copy & open in a new tab)
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Dismiss link"
                      onClick={() => setExternalLink(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={externalLink}
                      readOnly
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(externalLink);
                          toast.message('Link copied.');
                        } catch {
                          toast.message('Select the link and copy it.');
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy link</span>
                    </Button>
                  </div>

                  <a
                    className="text-xs text-muted-foreground underline"
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in new tab (may be blocked in preview)
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Info Panel (1 col) */}
          <div className="space-y-4">
            {/* Quality Reasons */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Quality Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs space-y-1.5">
                  {qualityReasons.length > 0 ? (
                    qualityReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No quality factors available for this setup.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Do Not Trade */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Do Not Trade If
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs space-y-1.5">
                  {doNotTradeConditions.slice(0, 5).map((condition, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">✕</span>
                      <span className="text-muted-foreground">{condition}</span>
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
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Research History */}
                <a 
                  href={`/projects/pattern-lab/new?pattern=${setup.patternId}&instrument=${encodeURIComponent(instrument)}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="p-1.5 rounded bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                      <History className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Research History</p>
                      <p className="text-[10px] text-muted-foreground truncate">5-year backtest for {patternName}</p>
                    </div>
                  </div>
                </a>

                {/* Open in TradingView */}
                <button
                  type="button"
                  onClick={() => openExternal(tradingViewAffiliateUrl)}
                  className="block w-full text-left"
                >
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="p-1.5 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Execute on TradingView</p>
                      <p className="text-[10px] text-muted-foreground truncate">Professional charts & trading</p>
                    </div>
                  </div>
                </button>

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
                      <p className="text-xs font-medium">Automate with Scripts</p>
                      <p className="text-[10px] text-muted-foreground truncate">Pine Script & MT4/MT5 export</p>
                    </div>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-border/50">
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signal Time</span>
                  <span className="font-mono">{new Date(setup.signalTs).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time Stop
                  </span>
                  <span className="font-mono">{tradePlan.timeStopBars} bars</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bracket Engine</span>
                  <span className="font-mono">v{tradePlan.bracketLevelsVersion}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry Type</span>
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
  );
}
