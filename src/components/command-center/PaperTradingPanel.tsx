import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface PaperPortfolio {
  id: string;
  current_balance: number;
  initial_balance: number;
  total_pnl: number;
}

interface PaperTrade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  status: string;
  stop_loss: number | null;
  take_profit: number | null;
  notes: string | null;
  created_at: string;
  closed_at: string | null;
}

interface PaperTradingPanelProps {
  userId?: string;
  onSymbolSelect?: (symbol: string) => void;
}

export function PaperTradingPanel({ userId, onSymbolSelect }: PaperTradingPanelProps) {
  const { t } = useTranslation();
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [portfolioRes, tradesRes] = await Promise.all([
          supabase
            .from('paper_portfolios')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('paper_trades')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);

        if (portfolioRes.data) setPortfolio(portfolioRes.data);
        if (tradesRes.data) {
          setOpenTrades(tradesRes.data.filter((t) => t.status === 'open'));
          setClosedTrades(tradesRes.data.filter((t) => t.status === 'closed'));
        }
      } catch (err) {
        console.error('[PaperTrading] fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel('paper-trades-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'paper_trades', filter: `user_id=eq.${userId}` },
        () => { fetchData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'paper_portfolios', filter: `user_id=eq.${userId}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

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

  const isAutoTrade = (notes: string | null) => notes?.includes('[auto-trade]');

  const pnlColor = (pnl: number | null) => {
    if (pnl == null || pnl === 0) return 'text-muted-foreground';
    return pnl > 0 ? 'text-emerald-500' : 'text-red-500';
  };

  const winCount = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(0) : '—';

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Portfolio Summary */}
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-0.5">Balance <InfoTooltip term="balance" size="h-3 w-3" /></span>
              <span className="text-sm font-semibold tabular-nums">
                ${(portfolio?.current_balance ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-0.5">Total P&L <InfoTooltip term="totalPnl" size="h-3 w-3" /></span>
              <span className={cn('text-sm font-semibold tabular-nums', pnlColor(portfolio?.total_pnl ?? 0))}>
                {(portfolio?.total_pnl ?? 0) >= 0 ? '+' : ''}
                ${(portfolio?.total_pnl ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-0.5">Win Rate <InfoTooltip term="winRate" size="h-3 w-3" /></span>
              <span className="text-sm font-semibold tabular-nums">{winRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Open Positions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 px-0.5">
            Open Positions ({openTrades.length})
          </h4>
          {openTrades.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 px-0.5">No open positions</p>
          ) : (
            <div className="space-y-1.5">
              {openTrades.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => onSymbolSelect?.(trade.symbol)}
                  className="w-full text-left rounded-md border border-border/50 bg-card p-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{trade.symbol}</span>
                      <Badge variant={trade.trade_type === 'long' ? 'default' : 'destructive'} className="text-xs px-1.5 py-0 h-4">
                        {trade.trade_type === 'long' ? (
                          <><ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />Long</>
                        ) : (
                          <><ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />Short</>
                        )}
                      </Badge>
                      {isAutoTrade(trade.notes) && (
                        <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-amber-500/50 text-amber-500">
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>Entry: {trade.entry_price.toFixed(2)}</span>
                    <span>Qty: {trade.quantity}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Closed Trades */}
        <Accordion type="single" collapsible>
          <AccordionItem value="closed" className="border-none">
            <AccordionTrigger className="py-1.5 px-0.5 text-xs font-medium text-muted-foreground hover:no-underline">
              Closed Trades ({closedTrades.length})
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              {closedTrades.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 px-0.5 pb-2">No closed trades yet</p>
              ) : (
                <div className="space-y-1.5">
                  {closedTrades.slice(0, 20).map((trade) => (
                    <button
                      key={trade.id}
                      onClick={() => onSymbolSelect?.(trade.symbol)}
                      className="w-full text-left rounded-md border border-border/50 bg-card p-2 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{trade.symbol}</span>
                          <Badge variant={trade.trade_type === 'long' ? 'default' : 'destructive'} className="text-xs px-1.5 py-0 h-4">
                            {trade.trade_type === 'long' ? 'L' : 'S'}
                          </Badge>
                          {isAutoTrade(trade.notes) && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-amber-500/50 text-amber-500">
                              Auto
                            </Badge>
                          )}
                        </div>
                        <span className={cn('text-xs font-semibold tabular-nums', pnlColor(trade.pnl))}>
                          {(trade.pnl ?? 0) >= 0 ? '+' : ''}${(trade.pnl ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>{trade.entry_price.toFixed(2)} → {trade.exit_price?.toFixed(2) ?? '—'}</span>
                        <span>{trade.closed_at ? new Date(trade.closed_at).toLocaleDateString() : ''}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Empty state hint */}
        {openTrades.length === 0 && closedTrades.length === 0 && (
          <div className="text-xs text-muted-foreground/60 text-center pt-2 space-y-1">
            <p>No paper trades yet.</p>
            <p>Enable auto paper trading on your alerts to start tracking trades automatically.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
