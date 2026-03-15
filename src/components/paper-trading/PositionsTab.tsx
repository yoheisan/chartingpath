import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, ArrowDownRight, LogOut, X, Clock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PaperTrade } from '@/hooks/usePaperTrading';
import { formatDistanceToNow } from 'date-fns';

interface PositionsTabProps {
  trades: PaperTrade[];
  closingTradeId: string | null;
  onCloseTrade: (tradeId: string, symbol: string) => void;
  onOverride: (trade: PaperTrade) => void;
  onSymbolSelect?: (symbol: string) => void;
}

function extractPattern(notes: string | null): string {
  const match = notes?.match(/\[pattern:([^\]]+)\]/);
  return match?.[1]?.replace(/_/g, ' ') ?? '';
}

function extractTimeframe(notes: string | null): string {
  const match = notes?.match(/\[timeframe:([^\]]+)\]/);
  return match?.[1] ?? '';
}

export function PositionsTab({ trades, closingTradeId, onCloseTrade, onOverride, onSymbolSelect }: PositionsTabProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (trades.length === 0) return;
    const symbols = [...new Set(trades.map(t => t.symbol))];

    const fetchPrices = async () => {
      const results: Record<string, number> = {};
      for (const sym of symbols) {
        const { data } = await supabase
          .from('live_pattern_detections')
          .select('current_price')
          .eq('instrument', sym)
          .order('detected_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.current_price) results[sym] = Number(data.current_price);
      }
      setPrices(results);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Wallet className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No open positions</p>
          <p className="text-xs text-muted-foreground mt-1">Paper trade any signal from the Screener to start tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {trades.map(trade => {
        const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
        const currentPrice = prices[trade.symbol];
        const isAuto = trade.notes?.includes('[auto-trade]');
        const pattern = extractPattern(trade.notes);
        const timeframe = extractTimeframe(trade.notes);

        // Unrealised P&L
        let unrealisedPnl = 0;
        let unrealisedR = 0;
        let progressPercent = 0;
        let progressTowardsTp = false;

        if (currentPrice) {
          const priceMove = isLong
            ? currentPrice - trade.entry_price
            : trade.entry_price - currentPrice;
          unrealisedPnl = priceMove * trade.quantity;

          const riskAmount = Math.abs(trade.entry_price - (trade.stop_loss ?? trade.entry_price));
          unrealisedR = riskAmount > 0 ? Math.round((priceMove / riskAmount) * 100) / 100 : 0;

          // Progress bar: 0% at entry, 100% at TP or SL
          if (trade.take_profit && trade.stop_loss) {
            const tpDistance = Math.abs(trade.take_profit - trade.entry_price);
            const slDistance = Math.abs(trade.entry_price - trade.stop_loss);

            if (priceMove >= 0) {
              progressPercent = tpDistance > 0 ? Math.min(100, (priceMove / tpDistance) * 100) : 0;
              progressTowardsTp = true;
            } else {
              progressPercent = slDistance > 0 ? Math.min(100, (Math.abs(priceMove) / slDistance) * 100) : 0;
              progressTowardsTp = false;
            }
          }
        }

        return (
          <div
            key={trade.id}
            className="rounded-lg border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSymbolSelect?.(trade.symbol)}
                  className="text-sm font-bold hover:text-primary transition-colors"
                >
                  {trade.symbol}
                </button>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-5 font-semibold',
                    isLong
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-500 border-red-500/30'
                  )}
                  variant="outline"
                >
                  {isLong ? <><ArrowUpRight className="h-3 w-3 mr-0.5" />Long</> : <><ArrowDownRight className="h-3 w-3 mr-0.5" />Short</>}
                </Badge>
                {isAuto && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-amber-500/50 text-amber-500">
                    Auto
                  </Badge>
                )}
              </div>
            </div>

            {/* Pattern + Timeframe */}
            {(pattern || timeframe) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {pattern && <span className="capitalize">{pattern}</span>}
                {pattern && timeframe && <span>·</span>}
                {timeframe && <span className="uppercase">{timeframe}</span>}
              </div>
            )}

            {/* Price Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry</span>
                <span className="font-mono tabular-nums">{trade.entry_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current</span>
                <span className="font-mono tabular-nums">{currentPrice?.toFixed(2) ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SL</span>
                <span className="font-mono tabular-nums text-red-400">{trade.stop_loss?.toFixed(2) ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TP</span>
                <span className="font-mono tabular-nums text-emerald-400">{trade.take_profit?.toFixed(2) ?? '—'}</span>
              </div>
            </div>

            {/* Progress Bar */}
            {currentPrice && trade.take_profit && trade.stop_loss && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>SL</span>
                  <span>Entry</span>
                  <span>TP</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'absolute h-full rounded-full transition-all',
                      progressTowardsTp ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'
                    )}
                    style={{
                      width: `${(progressPercent / 2)}%`,
                      ...(progressTowardsTp ? {} : { right: '50%', left: 'auto' }),
                    }}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground/40" />
                </div>
              </div>
            )}

            {/* Unrealised P&L */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unrealised P&L</span>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-bold tabular-nums', unrealisedPnl > 0 ? 'text-emerald-500' : unrealisedPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                  {unrealisedPnl >= 0 ? '+' : ''}{unrealisedPnl.toFixed(2)}$
                </span>
                <span className={cn('text-xs font-medium tabular-nums', unrealisedR > 0 ? 'text-emerald-500' : unrealisedR < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                  {unrealisedR >= 0 ? '+' : ''}{unrealisedR}R
                </span>
              </div>
            </div>

            {/* Time open */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Opened {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs flex-1"
                disabled={closingTradeId === trade.id}
                onClick={() => onCloseTrade(trade.id, trade.symbol)}
              >
                <LogOut className="h-3 w-3 mr-1" />
                Close Trade
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs flex-1"
                disabled={closingTradeId === trade.id}
                onClick={() => onOverride(trade)}
              >
                <X className="h-3 w-3 mr-1" />
                Pull Breaker 🔴
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
