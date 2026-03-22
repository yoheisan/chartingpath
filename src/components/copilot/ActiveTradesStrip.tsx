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

const DEMO_TRADES: CopilotTrade[] = [
  { id: 'demo-1', symbol: 'AAPL', trade_type: 'long', entry_price: 198.45, exit_price: null, quantity: 10, pnl: null, outcome_r: 0.8, status: 'open', stop_loss: 195.00, take_profit: 205.00, created_at: new Date().toISOString(), closed_at: null, close_reason: null, attribution: 'ai_approved', source: 'screener', gate_result: 'pass', setup_type: 'breakout', copilot_reasoning: null, outcome: null, user_action: null },
  { id: 'demo-2', symbol: 'MSFT', trade_type: 'short', entry_price: 420.10, exit_price: null, quantity: 5, pnl: null, outcome_r: -0.3, status: 'open', stop_loss: 425.00, take_profit: 410.00, created_at: new Date().toISOString(), closed_at: null, close_reason: null, attribution: 'human_overwrite', source: 'manual', gate_result: 'override', setup_type: 'reversal', copilot_reasoning: null, outcome: null, user_action: null },
  { id: 'demo-3', symbol: 'TSLA', trade_type: 'long', entry_price: 245.30, exit_price: null, quantity: 8, pnl: null, outcome_r: 1.2, status: 'open', stop_loss: 240.00, take_profit: 260.00, created_at: new Date().toISOString(), closed_at: null, close_reason: null, attribution: 'ai_approved', source: 'screener', gate_result: 'pass', setup_type: 'breakout', copilot_reasoning: null, outcome: null, user_action: null },
];

const ActiveTradesStrip = ({ trades, selectedTradeId, onSelectTrade, onCloseTrade }: ActiveTradesStripProps) => {
  const displayTrades = trades.length > 0 ? trades : DEMO_TRADES;
  const isDemo = trades.length === 0;

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
