import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';

interface TradeBlotterProps {
  trades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (tradeId: string) => void;
}

const DEMO_TRADES: CopilotTrade[] = [
  { id: 'demo-1', symbol: 'AAPL', trade_type: 'long', entry_price: 198.45, exit_price: null, quantity: 10, pnl: null, outcome_r: 0.8, status: 'open', stop_loss: 195.00, take_profit: 205.00, created_at: new Date(Date.now() - 45 * 60000).toISOString(), closed_at: null, close_reason: null, attribution: 'ai_approved', source: 'screener', gate_result: 'pass', setup_type: 'Breakout', copilot_reasoning: null, outcome: null, user_action: null },
  { id: 'demo-2', symbol: 'MSFT', trade_type: 'short', entry_price: 420.10, exit_price: null, quantity: 5, pnl: null, outcome_r: -0.3, status: 'open', stop_loss: 425.00, take_profit: 410.00, created_at: new Date(Date.now() - 22 * 60000).toISOString(), closed_at: null, close_reason: null, attribution: 'human_overwrite', source: 'manual', gate_result: 'override', setup_type: 'Reversal', copilot_reasoning: null, outcome: null, user_action: null },
  { id: 'demo-3', symbol: 'TSLA', trade_type: 'long', entry_price: 245.30, exit_price: null, quantity: 8, pnl: null, outcome_r: 1.2, status: 'open', stop_loss: 240.00, take_profit: 260.00, created_at: new Date(Date.now() - 12 * 60000).toISOString(), closed_at: null, close_reason: null, attribution: 'ai_approved', source: 'screener', gate_result: 'pass', setup_type: 'Bull Flag', copilot_reasoning: null, outcome: null, user_action: null },
];

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

const formatDuration = (createdAt: string) => {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const TradeBlotter = ({ trades, selectedTradeId, onSelectTrade }: TradeBlotterProps) => {
  const [expanded, setExpanded] = useState(true);
  const displayTrades = trades.length > 0 ? trades : DEMO_TRADES;
  const isDemo = trades.length === 0;

  const totalR = displayTrades.reduce((s, t) => s + (t.outcome_r ?? 0), 0);

  return (
    <div className="border-t border-border/40 flex flex-col bg-card/30">
      {/* Collapse strip */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-1.5 hover:bg-secondary/40 transition-colors shrink-0"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Active Trades
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
            {displayTrades.length}
          </Badge>
          {isDemo && (
            <span className="text-[10px] text-muted-foreground">(preview)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-semibold ${totalR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            Day {formatR(totalR)}
          </span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col min-h-0">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_90px_80px_70px_70px_80px] gap-2 px-4 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
            <span>Symbol</span>
            <span>Side</span>
            <span>Pattern</span>
            <span>Entry</span>
            <span>Stop</span>
            <span>Target</span>
            <span className="text-right">P&L</span>
          </div>

          {/* Trade rows */}
          <ScrollArea className="max-h-[160px]">
            {displayTrades.map((trade) => {
              const isSelected = trade.id === selectedTradeId;
              const pnlR = trade.outcome_r ?? 0;
              const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
              const isPositive = pnlR >= 0;

              return (
                <button
                  key={trade.id}
                  onClick={() => onSelectTrade(trade.id)}
                  className={`w-full grid grid-cols-[1fr_80px_90px_80px_70px_70px_80px] gap-2 px-4 py-1.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-accent/40'
                      : 'hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isLong ? (
                      <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold text-foreground">{trade.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDuration(trade.created_at)}</span>
                  </div>
                  <span className={`text-xs font-mono ${isLong ? 'text-green-500' : 'text-red-500'}`}>
                    {isLong ? 'Long' : 'Short'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {trade.setup_type ?? '—'}
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    ${trade.entry_price?.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-red-400">
                    {trade.stop_loss ? `$${trade.stop_loss.toFixed(0)}` : '—'}
                  </span>
                  <span className="text-xs font-mono text-green-400">
                    {trade.take_profit ? `$${trade.take_profit.toFixed(0)}` : '—'}
                  </span>
                  <span className={`text-xs font-mono font-semibold text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {formatR(pnlR)}
                  </span>
                </button>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default TradeBlotter;
