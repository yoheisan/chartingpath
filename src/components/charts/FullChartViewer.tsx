import { useEffect, useRef } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink
} from 'lucide-react';
import { SetupWithVisuals } from '@/types/VisualSpec';
import { DISCLAIMERS } from '@/constants/disclaimers';
import { getTradingViewUrl } from '@/utils/tradingViewLinks';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !setup || !open) return;

    const { bars, visualSpec } = setup;
    if (!bars || bars.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#0f0f0f' : '#ffffff';
    const textColor = isDark ? '#a1a1a1' : '#666666';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 350,
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

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const chartData: CandlestickData[] = bars.map(bar => ({
      time: (new Date(bar.t).getTime() / 1000) as Time,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    }));

    candleSeries.setData(chartData);

    visualSpec.overlays.forEach(overlay => {
      if (overlay.type === 'hline') {
        const color = 
          overlay.style === 'primary' ? '#3b82f6' :
          overlay.style === 'destructive' ? '#ef4444' :
          overlay.style === 'positive' ? '#22c55e' :
          '#888888';
        
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

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({
          width: entries[0].contentRect.width,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [setup, open]);

  if (!setup) return null;

  const { tradePlan, direction, patternName, instrument, visualSpec, quality } = setup;
  const isLong = direction === 'long';
  const decimals = tradePlan.priceRounding?.priceDecimals || 2;
  const formatPrice = (price: number) => price.toFixed(Math.min(decimals, 6));
  const doNotTradeConditions = getDoNotTradeConditions(setup.patternId, direction);
  
  // Determine instrument category for TradingView link
  const getInstrumentCategory = (symbol: string): 'crypto' | 'stocks' | 'forex' | 'commodities' => {
    const upper = symbol.toUpperCase();
    // Yahoo-format crypto (e.g., BTC-USD, ETH-USD)
    const cryptoBases = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'LTC', 'ATOM', 'UNI', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI', 'SEI', 'BNB', 'SHIB', 'TRX', 'TON'];
    if (cryptoBases.some(base => upper.startsWith(base + '-') || upper.startsWith(base + 'USD'))) return 'crypto';
    if (upper.endsWith('USDT') || upper.endsWith('BTC')) return 'crypto';
    // Forex pairs (6 chars like EURUSD)
    if (upper.length === 6 && upper.includes('USD')) return 'forex';
    return 'stocks';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLong ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {isLong ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">{instrument}</DialogTitle>
                <p className="text-sm text-muted-foreground">{patternName} • {visualSpec.timeframe.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className={`${
                  quality.grade === 'A' 
                    ? 'border-green-500/50 text-green-500' 
                    : quality.grade === 'B'
                      ? 'border-yellow-500/50 text-yellow-500'
                      : 'border-muted-foreground/50'
                }`}
              >
                {typeof quality.score === 'number' ? `${quality.score.toFixed(1)}/10` : `Grade ${quality.grade || quality.score}`}
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
            <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-border/50" />
            
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
                asChild
              >
                <a 
                  href={getTradingViewUrl(instrument, getInstrumentCategory(instrument), visualSpec.timeframe)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
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
                  {quality.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-muted-foreground">{reason}</span>
                    </li>
                  ))}
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
      </DialogContent>
    </Dialog>
  );
}
