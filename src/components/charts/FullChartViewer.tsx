import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Bell, 
  FileCode,
  TrendingUp, 
  TrendingDown, 
  Target,
  ShieldAlert,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { CompressedBar, VisualSpec } from '@/types/VisualSpec';
import { SetupWithVisuals } from '@/types/VisualSpec';

interface FullChartViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup: SetupWithVisuals | null;
  onCopyPlan: () => void;
  onCreateAlert: () => void;
  onExportPine?: () => void;
  isCreatingAlert: boolean;
}

export default function FullChartViewer({ 
  open, 
  onOpenChange, 
  setup,
  onCopyPlan,
  onCreateAlert,
  onExportPine,
  isCreatingAlert
}: FullChartViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !setup || !open) return;

    const { bars, visualSpec, tradePlan } = setup;
    if (!bars || bars.length === 0) return;

    // Detect theme
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#0f0f0f' : '#ffffff';
    const textColor = isDark ? '#a1a1a1' : '#666666';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
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

    // Create candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Transform bars
    const chartData: CandlestickData[] = bars.map(bar => ({
      time: (new Date(bar.t).getTime() / 1000) as Time,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    }));

    candleSeries.setData(chartData);

    // Add overlays with labels
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
          lineStyle: overlay.id === 'entry' ? 0 : 2, // solid for entry, dashed for others
          axisLabelVisible: true,
          title: overlay.label,
        });
      }
    });

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
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

  const { tradePlan, direction, patternName, instrument, visualSpec } = setup;
  const isLong = direction === 'long';
  const decimals = tradePlan.priceRounding?.priceDecimals || 2;
  const formatPrice = (price: number) => price.toFixed(Math.min(decimals, 6));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
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
            <Badge variant={isLong ? 'default' : 'destructive'}>
              {isLong ? 'LONG' : 'SHORT'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Chart */}
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCopyPlan} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy Trade Plan
          </Button>
          <Button onClick={onCreateAlert} disabled={isCreatingAlert} className="flex-1">
            {isCreatingAlert ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Create Alert
          </Button>
          {onExportPine && (
            <Button variant="secondary" onClick={onExportPine} className="flex-1">
              <FileCode className="h-4 w-4 mr-2" />
              Export Pine
            </Button>
          )}
        </div>

        {/* Metadata footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Bracket Engine v{tradePlan.bracketLevelsVersion}</span>
          <span>Signal: {new Date(setup.signalTs).toLocaleString()}</span>
          <span>Time Stop: {tradePlan.timeStopBars} bars</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
