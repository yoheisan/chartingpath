import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StalenessPrice } from './StalenessPrice';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useMemo } from 'react';
import { StalenessPrice } from './StalenessPrice';

interface ActiveTradesStripProps {
  trades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (tradeId: string) => void;
  onCloseTrade?: (tradeId: string) => void;
}

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);
const formatPnl = (v: number) => (v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`);

const ActiveTradesStrip = ({ trades, selectedTradeId, onSelectTrade, onCloseTrade }: ActiveTradesStripProps) => {
  const symbols = useMemo(() => trades.filter(t => t.status === 'open').map(t => t.symbol), [trades]);
  const livePrices = useLivePrices(symbols);
  const isEmpty = trades.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-border/40">
        <span className="text-sm font-semibold text-foreground px-1">Active Trades</span>
        <p className="text-xs text-muted-foreground px-1 py-2">No active trades. Copilot is scanning for setups…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-border/40">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-foreground">Active Trades</span>
        <Badge variant="outline" className="text-sm px-1.5 py-0 h-5 font-mono">
          {trades.length}
        </Badge>
      </div>

      <ScrollArea className="max-h-[200px]">
        <div className="flex flex-col gap-1">
          {trades.map((trade) => {
            const isSelected = trade.id === selectedTradeId;
            const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
            const isOpen = trade.status === 'open';
            const priceData = isOpen ? livePrices[trade.symbol] : null;
            const currentPrice = isOpen ? priceData?.price : trade.exit_price;
            const pnlR = trade.outcome_r ?? 0;

            let dollarPnl: number | null = null;
            if (isOpen && currentPrice && trade.entry_price && trade.quantity) {
              dollarPnl = isLong
                ? (currentPrice - trade.entry_price) * trade.quantity
                : (trade.entry_price - currentPrice) * trade.quantity;
            } else if (!isOpen && trade.pnl != null) {
              dollarPnl = trade.pnl;
            }

            const displayPnl = dollarPnl ?? 0;
            const isPositive = isOpen ? displayPnl >= 0 : pnlR >= 0;

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
                  <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <span className="text-sm font-mono font-bold text-foreground truncate">{trade.symbol}</span>
                <span className="text-sm font-mono text-muted-foreground">${trade.entry_price?.toFixed(2)}</span>
                {isOpen && currentPrice && priceData && (
                  <>
                    <span className="text-sm font-mono text-muted-foreground">→</span>
                    <StalenessPrice
                      price={currentPrice}
                      lastConfirmedAt={priceData.lastConfirmedAt}
                      className="text-sm font-mono"
                    />
                  </>
                )}
                <span className={`ml-auto text-sm font-mono font-semibold shrink-0 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {dollarPnl != null ? formatPnl(dollarPnl) : formatR(pnlR)}
                </span>
                {onCloseTrade && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCloseTrade(trade.id); }}
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
