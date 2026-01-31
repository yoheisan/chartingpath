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
} from 'lightweight-charts';
import { CompressedBar } from '@/types/VisualSpec';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateVWAP,
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
import { Settings2, RotateCcw } from 'lucide-react';
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

interface StudyChartProps {
  bars: CompressedBar[];
  symbol: string;
  height?: number;
}

/**
 * StudyChart - Full-featured chart for study pages with toggleable indicators:
 * - Price ruler (right axis)
 * - Time series (bottom axis)
 * - EMA 20, EMA 50, SMA 200
 * - Bollinger Bands
 * - VWAP
 */
const StudyChart = memo(({ bars, symbol, height = 350 }: StudyChartProps) => {
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicatorSettings);
  const isPanningRef = useRef(false);
  const panStartYRef = useRef(0);
  const panStartPriceRef = useRef<{ from: number; to: number } | null>(null);

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

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
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
        mode: 1,
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

    // Calculate optimal price margins based on data volatility
    // Ensures charts never look "flat" regardless of actual price movement
    const optimalMargins = calculateOptimalPriceMargins(bars, false);
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: optimalMargins,
    });

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({
          width: entries[0].contentRect.width,
        });
      }
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
  }, [bars, height, indicators, i18n.language]);

  if (!bars || bars.length === 0) {
    return (
      <div
        className="w-full bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No price data available
      </div>
    );
  }

  // Count active indicators for legend
  const activeIndicators = Object.entries(indicators).filter(([, v]) => v);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded overflow-hidden border border-border/50"
        style={{ height }}
      />

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
      </div>

      {/* Pan Hint - Desktop only */}
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
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  {activeIndicators.length} of 5 indicators active
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});

StudyChart.displayName = 'StudyChart';

export default StudyChart;
