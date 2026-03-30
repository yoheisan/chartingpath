import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';
import { useNavigateToDashboard } from '@/hooks/useNavigateToDashboard';
import { useLivePrices } from '@/hooks/useLivePrices';

interface TradeBlotterProps {
  trades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (tradeId: string) => void;
}

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);
const formatPnl = (v: number) => (v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`);

const formatDuration = (createdAt: string) => {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const TradeBlotter = ({ trades, selectedTradeId, onSelectTrade }: TradeBlotterProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const goToSymbol = useNavigateToDashboard();

  const symbols = useMemo(() => trades.filter(t => t.status === 'open').map(t => t.symbol), [trades]);
  const livePrices = useLivePrices(symbols);

  const totalR = trades.reduce((s, tr) => s + (tr.outcome_r ?? 0), 0);

  return (
    <div className="border-t border-border/40 flex flex-col bg-card/30 h-full min-h-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-1.5 hover:bg-secondary/40 transition-colors shrink-0"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {t('copilotPage.activeTrades')}
          </span>
          <Badge variant="outline" className="text-sm px-1.5 py-0 h-5 font-mono">
            {trades.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono font-semibold ${totalR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {t('copilotPage.day')} {formatR(totalR)}
          </span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_100px_90px_80px_80px_90px_80px] gap-2 px-4 py-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
            <span>{t('copilotPage.symbol')}</span>
            <span>{t('copilotPage.side')}</span>
            <span>{t('copilotPage.pattern')}</span>
            <span>{t('copilotPage.entry')}</span>
            <span>Now</span>
            <span>{t('copilotPage.stop')}</span>
            <span>{t('copilotPage.target')}</span>
            <span className="text-right">{t('copilotPage.pnl')}</span>
          </div>

          {trades.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground text-center">
              {t('copilotPage.noActiveTrades')}
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              {trades.map((trade) => {
                const isSelected = trade.id === selectedTradeId;
                const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
                const isOpen = trade.status === 'open';
                const currentPrice = isOpen ? livePrices[trade.symbol] : trade.exit_price;
                const pnlR = trade.outcome_r ?? 0;

                // Calculate unrealized dollar P&L for open trades
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
                    className={`w-full grid grid-cols-[1fr_80px_100px_90px_80px_80px_90px_80px] gap-2 px-4 py-1.5 text-left transition-colors ${
                      isSelected ? 'bg-accent/40' : 'hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isLong ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span
                        className="text-sm font-mono font-bold text-foreground hover:text-primary hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToSymbol(trade.symbol, e, {
                            timeframe: trade.timeframe || undefined,
                            detectionId: trade.detection_id || undefined,
                          });
                        }}
                        title={t('copilotPage.viewOnDashboard', 'View on Dashboard')}
                      >
                        {trade.symbol}
                      </span>
                      <span className="text-sm text-muted-foreground">{formatDuration(trade.created_at)}</span>
                    </div>
                    <span className={`text-sm font-mono ${isLong ? 'text-green-500' : 'text-red-500'}`}>
                      {isLong ? t('copilotPage.long') : t('copilotPage.short')}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {trade.setup_type ?? '—'}
                    </span>
                    <span className="text-sm font-mono text-foreground">
                      ${trade.entry_price?.toFixed(2)}
                    </span>
                    <span className={`text-sm font-mono ${currentPrice ? (isPositive ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                      {currentPrice ? `$${currentPrice.toFixed(2)}` : '—'}
                    </span>
                    <span className="text-sm font-mono text-red-400">
                      {trade.stop_loss ? `$${trade.stop_loss.toFixed(0)}` : '—'}
                    </span>
                    <span className="text-sm font-mono text-green-400">
                      {trade.take_profit ? `$${trade.take_profit.toFixed(0)}` : '—'}
                    </span>
                    <span className={`text-sm font-mono font-semibold text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {dollarPnl != null ? formatPnl(dollarPnl) : formatR(pnlR)}
                    </span>
                  </button>
                );
              })}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeBlotter;
