import { useTranslation } from 'react-i18next';
import { Wallet, ArrowRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface PaperTradingPanelProps {
  userId?: string;
  onSymbolSelect?: (symbol: string) => void;
}

export function PaperTradingPanel({ userId, onSymbolSelect }: PaperTradingPanelProps) {
  const { t } = useTranslation();
  const { portfolio, openTrades, closedTrades, loading, winRate } = usePaperTrading(userId);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground text-sm gap-2">
        <Wallet className="h-8 w-8 opacity-40" />
        <p>Sign in to track paper trades</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  const totalPnl = portfolio?.total_pnl ?? 0;
  const balance = portfolio?.current_balance ?? 100000;

  return (
    <div className="p-3 space-y-4">
      {/* Portfolio Summary */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Balance</span>
          <span className="text-sm font-bold tabular-nums">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total P&L</span>
          <span className={cn('text-sm font-bold tabular-nums', totalPnl > 0 ? 'text-emerald-500' : totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Win Rate</span>
          <span className="text-sm font-bold tabular-nums">{closedTrades.length > 0 ? `${winRate.toFixed(0)}%` : '—'}</span>
        </div>
      </div>

      {/* Open Positions Summary */}
      <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium flex items-center gap-1">
            <Activity className="h-3 w-3 text-primary" />
            Open Positions
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 h-4">{openTrades.length}</Badge>
        </div>
        {openTrades.slice(0, 3).map(trade => {
          const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
          return (
            <button
              key={trade.id}
              onClick={() => onSymbolSelect?.(trade.symbol)}
              className="w-full flex items-center justify-between text-xs py-0.5 hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-1">
                {isLong ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className="font-medium">{trade.symbol}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">{trade.entry_price.toFixed(2)}</span>
            </button>
          );
        })}
        {openTrades.length > 3 && (
          <p className="text-[10px] text-muted-foreground text-center">+{openTrades.length - 3} more</p>
        )}
      </div>

      {/* View Full Dashboard Link */}
      <Link
        to="/tools/paper-trading"
        className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-primary/30 bg-primary/5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        View Full Dashboard
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
