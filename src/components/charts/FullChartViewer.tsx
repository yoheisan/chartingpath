import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  createSeriesMarkers,
  SeriesMarkerShape,
} from 'lightweight-charts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { SetupWithVisuals } from '@/types/VisualSpec';
import { DISCLAIMERS } from '@/constants/disclaimers';
import { getTradingViewUrl } from '@/utils/tradingViewLinks';
import { HistoricalOccurrencesList } from './HistoricalOccurrencesList';
import { toast } from 'sonner';
import { InstrumentLogo } from './InstrumentLogo';

interface FullChartViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup: SetupWithVisuals | null;
  onCopyPlan: () => void;
  onCreateAlert: () => void;
  onExportPine?: () => void;
  onSaveToVault?: () => void;
  isCreatingAlert: boolean;
  isSavingToVault?: boolean;
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
  onCopyPlan,
  onCreateAlert,
  onExportPine,
  onSaveToVault,
  isCreatingAlert,
  isSavingToVault = false,
}: FullChartViewerProps) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState<string | null>(null);

  useEffect(() => {
    // Radix DialogContent is portaled and can mount a tick after `open` flips true.
    // Using a callback ref (containerEl state) ensures we initialize the chart once the DOM node exists.
    if (!containerEl || !setup || !open) return;

    setChartError(null);

    const { bars, visualSpec } = setup;
    if (!bars || bars.length === 0) return;

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
        const isDark = document.documentElement.classList.contains('dark');
        const bgColor = isDark ? '#0f0f0f' : '#ffffff';
        const textColor = isDark ? '#a1a1a1' : '#666666';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        // Recreate chart each time we open/change setup to avoid stale/blank canvas.
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        const chart = createChart(containerEl, {
          width: containerWidth,
          height: Math.max(containerHeight, 350),
          layout: {
            background: { color: bgColor },
            textColor,
          },
          grid: {
            vertLines: { color: gridColor },
            horzLines: { color: gridColor },
          },
          rightPriceScale: {
            borderColor: gridColor,
          },
          timeScale: {
            borderColor: gridColor,
            timeVisible: true,
            secondsVisible: false,
          },
          crosshair: {
            mode: 1,
          },
        });

        chartRef.current = chart;

        // Solid filled candlesticks - must set border colors same as body to prevent hollow appearance
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        });

        const chartData: CandlestickData[] = bars
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
          )
          .sort((a, b) => (a.time as number) - (b.time as number));

        candleSeries.setData(chartData);

        visualSpec.overlays.forEach((overlay) => {
          if (overlay.type === 'hline') {
            const color =
              overlay.style === 'primary'
                ? '#3b82f6'
                : overlay.style === 'destructive'
                  ? '#ef4444'
                  : overlay.style === 'positive'
                    ? '#22c55e'
                    : '#888888';

            candleSeries.createPriceLine({
              price: overlay.price,
              color,
              lineWidth: 2,
              lineStyle: overlay.id === 'entry' ? 0 : 2,
              axisLabelVisible: true,
              title: overlay.label,
            });
          }
        });

        // Candle-level pivot confirmation markers
        // Note: some pivots can carry a "signalTs" timestamp (intraday) while bars are daily (00:00:00Z).
        // Lightweight-charts markers must reference an existing bar time, so we snap to the pivot index when needed.
        const timeSet = new Set<number>(chartData.map((d) => d.time as number));

        if (visualSpec.pivots && visualSpec.pivots.length > 0) {
          const markers = visualSpec.pivots
            .map((pivot) => {
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

              if (!timeSet.has(t)) return null;

              return {
                time: t as Time,
                position: (isHigh ? 'aboveBar' : 'belowBar') as 'aboveBar' | 'belowBar',
                color: isHigh ? '#f97316' : '#8b5cf6',
                shape: (isHigh ? 'arrowDown' : 'arrowUp') as SeriesMarkerShape,
                text: pivot.label || (isHigh ? 'H' : 'L'),
              };
            })
            .filter((m): m is any => Boolean(m));

          markers.sort((a, b) => (a.time as number) - (b.time as number));

          try {
            createSeriesMarkers(candleSeries, markers);
          } catch (e) {
            // Never break the chart if markers fail; candles are the priority.
            console.warn('Failed to render pivot markers:', e);
          }
        }

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
  }, [setup, open, containerEl]);

  if (!setup) return null;

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
                <DialogTitle className="text-xl">{instrument}</DialogTitle>
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
              <Badge 
                variant="outline"
                className={`${
                  qualityGrade === 'A' 
                    ? 'border-green-500/50 text-green-500' 
                    : qualityGrade === 'B'
                      ? 'border-yellow-500/50 text-yellow-500'
                      : 'border-muted-foreground/50'
                }`}
              >
                {typeof (quality as any)?.score === 'number'
                  ? `${(quality as any).score.toFixed(1)}/10`
                  : `Grade ${qualityGrade || (quality as any)?.score || '-'}`}
              </Badge>
              <Badge variant={isLong ? 'default' : 'destructive'}>
                {isLong ? 'LONG' : 'SHORT'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Chart (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <div
                  ref={setContainerEl}
                  className="w-full h-[350px] lg:h-[420px] rounded-lg overflow-hidden border border-border/50"
                />
                {chartError && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                    {chartError}
                  </div>
                )}
              </div>
            
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
              <Button variant="outline" onClick={onCopyPlan} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Plan
              </Button>
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

            {/* TradingView Affiliate CTA */}
            <button
              type="button"
              onClick={() => openExternal(tradingViewAffiliateUrl)}
              className="block w-full text-left"
              aria-label="Analyze on TradingView"
            >
              <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Analyze on TradingView</p>
                      <p className="text-xs text-muted-foreground">Professional charts & tools</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </button>

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
            className="border-border/50"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
