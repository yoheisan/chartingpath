import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';

interface ActiveTradesStripProps {
  trades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (tradeId: string) => void;
  onCloseTrade?: (tradeId: string) => void;
}

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

const ActiveTradesStrip = ({ trades, selectedTradeId, onSelectTrade, onCloseTrade }: ActiveTradesStripProps) => {
  if (trades.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-foreground">Active Trades</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
          {trades.length}
        </Badge>
      </div>

      <ScrollArea className="max-h-[200px]">
        <div className="flex flex-col gap-1">
          {trades.map((trade) => {
            const isSelected = trade.id === selectedTradeId;
            const pnlR = trade.outcome_r ?? 0;
            const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
            const isPositive = pnlR >= 0;

            return (
              <button
                key={trade.id}
                onClick={() => onSelectTrade(trade.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  isSelected
                    ? 'bg-accent/60 border border-accent'
                    : 'hover:bg-secondary/60 border border-transparent'
                }`}
              >
                {isLong ? (
                  <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />
                )}

                <span className="text-xs font-mono font-bold text-foreground truncate">
                  {trade.symbol}
                </span>

                <span className="text-[10px] font-mono text-muted-foreground">
                  ${trade.entry_price?.toFixed(2)}
                </span>

                <span className={`ml-auto text-xs font-mono font-semibold shrink-0 ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatR(pnlR)}
                </span>

                {onCloseTrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTrade(trade.id);
                    }}
                    className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Close trade"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActiveTradesStrip;
