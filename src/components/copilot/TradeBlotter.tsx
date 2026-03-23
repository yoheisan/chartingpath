import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';

interface TradeBlotterProps {
  trades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (tradeId: string) => void;
}

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

const formatDuration = (createdAt: string) => {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const TradeBlotter = ({ trades, selectedTradeId, onSelectTrade }: TradeBlotterProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const totalR = trades.reduce((s, tr) => s + (tr.outcome_r ?? 0), 0);

  return (
    <div className="border-t border-border/40 flex flex-col bg-card/30">
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
        <div className="flex flex-col min-h-0">
          <div className="grid grid-cols-[1fr_80px_100px_90px_80px_80px_80px] gap-2 px-4 py-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
            <span>{t('copilotPage.symbol')}</span>
            <span>{t('copilotPage.side')}</span>
            <span>{t('copilotPage.pattern')}</span>
            <span>{t('copilotPage.entry')}</span>
            <span>{t('copilotPage.stop')}</span>
            <span>{t('copilotPage.target')}</span>
            <span className="text-right">{t('copilotPage.pnl')}</span>
          </div>

          {trades.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground text-center">
              {t('copilotPage.noActiveTrades')}
            </div>
          ) : (
            <ScrollArea className="max-h-[160px]">
              {trades.map((trade) => {
                const isSelected = trade.id === selectedTradeId;
                const pnlR = trade.outcome_r ?? 0;
                const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
                const isPositive = pnlR >= 0;

                return (
                  <button
                    key={trade.id}
                    onClick={() => onSelectTrade(trade.id)}
                    className={`w-full grid grid-cols-[1fr_80px_100px_90px_80px_80px_80px] gap-2 px-4 py-1.5 text-left transition-colors ${
                      isSelected ? 'bg-accent/40' : 'hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isLong ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span className="text-sm font-mono font-bold text-foreground">{trade.symbol}</span>
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
                    <span className="text-sm font-mono text-red-400">
                      {trade.stop_loss ? `$${trade.stop_loss.toFixed(0)}` : '—'}
                    </span>
                    <span className="text-sm font-mono text-green-400">
                      {trade.take_profit ? `$${trade.take_profit.toFixed(0)}` : '—'}
                    </span>
                    <span className={`text-sm font-mono font-semibold text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {formatR(pnlR)}
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
