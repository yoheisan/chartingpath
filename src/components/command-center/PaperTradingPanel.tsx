import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from 'sonner';

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
  close_reason: string | null;
  outcome_r: number | null;
  override_reason: string | null;
  override_notes: string | null;
  user_id: string;
}

interface PaperTradingPanelProps {
  userId?: string;
  onSymbolSelect?: (symbol: string) => void;
}

const OVERRIDE_REASONS = [
  'Market conditions changed',
  'News event risk',
  'Pattern invalidated',
  'Taking partial profit',
  'Risk management',
  'Changed my mind',
];

export function PaperTradingPanel({ userId, onSymbolSelect }: PaperTradingPanelProps) {
  const { t } = useTranslation();
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);

  // Override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideTrade, setOverrideTrade] = useState<PaperTrade | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

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
          setOpenTrades(tradesRes.data.filter((t: any) => t.status === 'open'));
          setClosedTrades(tradesRes.data.filter((t: any) => t.status === 'closed'));
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

  const handleCloseTrade = async (tradeId: string, symbol: string, overrideData?: { reason: string; notes: string }) => {
    setClosingTradeId(tradeId);
    try {
      // Get latest price from live_pattern_detections
      const { data: latest } = await supabase
        .from('live_pattern_detections')
        .select('current_price')
        .eq('instrument', symbol)
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const exitPrice = latest?.current_price ? Number(latest.current_price) : null;

      const { data: trade } = await supabase
        .from('paper_trades')
        .select('entry_price, quantity, trade_type, stop_loss, user_id')
        .eq('id', tradeId)
        .single();

      if (!trade || !exitPrice) {
        toast.error('Could not fetch current price');
        return;
      }

      const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
      const pnl = isLong
        ? (exitPrice - Number(trade.entry_price)) * Number(trade.quantity)
        : (Number(trade.entry_price) - exitPrice) * Number(trade.quantity);
      const riskAmount = Math.abs(Number(trade.entry_price) - Number(trade.stop_loss ?? trade.entry_price));
      const priceMove = isLong
        ? exitPrice - Number(trade.entry_price)
        : Number(trade.entry_price) - exitPrice;
      const outcomeR = riskAmount > 0 ? Math.round((priceMove / riskAmount) * 100) / 100 : 0;

      const updateData: Record<string, any> = {
        status: 'closed',
        exit_price: exitPrice,
        pnl: Math.round(pnl * 100) / 100,
        closed_at: new Date().toISOString(),
        close_reason: overrideData ? `Override: ${overrideData.reason}` : 'Manually closed by trader',
        outcome_r: outcomeR,
      };

      if (overrideData) {
        updateData.override_reason = overrideData.reason;
        updateData.override_notes = overrideData.notes || null;
      }

      await supabase.from('paper_trades').update(updateData).eq('id', tradeId);

      // Record signal action for overrides
      if (overrideData && userId) {
        await supabase.from('user_signal_actions').insert({
          user_id: userId,
          instrument: symbol,
          pattern_id: 'manual_close',
          timeframe: 'n/a',
          action: 'override',
          paper_trade_id: tradeId,
        });
      }

      toast.success(`Trade closed at ${exitPrice} | ${outcomeR > 0 ? '+' : ''}${outcomeR}R`);
    } catch (err) {
      console.error('[PaperTrading] close error', err);
      toast.error('Failed to close trade');
    } finally {
      setClosingTradeId(null);
    }
  };

  const handleOverrideConfirm = async () => {
    if (!overrideTrade || !selectedReason) return;
    setOverrideSubmitting(true);
    await handleCloseTrade(overrideTrade.id, overrideTrade.symbol, {
      reason: selectedReason,
      notes: overrideNotes,
    });
    setOverrideSubmitting(false);
    setOverrideDialogOpen(false);
    setOverrideTrade(null);
    setSelectedReason(null);
    setOverrideNotes('');
  };

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
    <>
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
                  <div
                    key={trade.id}
                    className="rounded-md border border-border/50 bg-card p-2"
                  >
                    <button
                      onClick={() => onSymbolSelect?.(trade.symbol)}
                      className="w-full text-left hover:bg-muted/40 transition-colors rounded-sm"
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
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs flex-1"
                        disabled={closingTradeId === trade.id}
                        onClick={() => handleCloseTrade(trade.id, trade.symbol)}
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 px-2 text-xs flex-1"
                        disabled={closingTradeId === trade.id}
                        onClick={() => {
                          setOverrideTrade(trade);
                          setOverrideDialogOpen(true);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Pull Breaker
                      </Button>
                    </div>
                  </div>
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
                            {trade.override_reason && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-red-500/50 text-red-500">
                                Override
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {trade.outcome_r != null && (
                              <span className={cn('text-xs font-medium tabular-nums', trade.outcome_r > 0 ? 'text-emerald-500' : trade.outcome_r < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                                {trade.outcome_r > 0 ? '+' : ''}{trade.outcome_r}R
                              </span>
                            )}
                            <span className={cn('text-xs font-semibold tabular-nums', pnlColor(trade.pnl))}>
                              {(trade.pnl ?? 0) >= 0 ? '+' : ''}${(trade.pnl ?? 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>{trade.entry_price.toFixed(2)} → {trade.exit_price?.toFixed(2) ?? '—'}</span>
                          <span>{trade.closed_at ? new Date(trade.closed_at).toLocaleDateString() : ''}</span>
                        </div>
                        {trade.close_reason && (
                          <div className="mt-1 text-[10px] text-muted-foreground/70 truncate">
                            {trade.close_reason}
                          </div>
                        )}
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
              <p>Enable auto paper trading on your alerts, or click "Paper Trade" on any screener signal.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pull Breaker — Close Trade Early</DialogTitle>
            <DialogDescription>
              Override the system and close this trade before SL/TP is hit.
            </DialogDescription>
          </DialogHeader>

          {overrideTrade && (
            <div className="space-y-4">
              {/* Trade details */}
              <div className="rounded-md bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol</span>
                  <span className="font-medium">{overrideTrade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direction</span>
                  <span className="font-medium capitalize">{overrideTrade.trade_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry</span>
                  <span className="font-medium tabular-nums">{overrideTrade.entry_price.toFixed(2)}</span>
                </div>
              </div>

              {/* Reason selection */}
              <div>
                <p className="text-sm font-medium mb-2">Why are you closing early?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {OVERRIDE_REASONS.map((reason) => (
                    <Button
                      key={reason}
                      size="sm"
                      variant={selectedReason === reason ? 'default' : 'outline'}
                      className="h-8 text-xs justify-start"
                      onClick={() => setSelectedReason(reason)}
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm font-medium mb-1.5">Notes (optional)</p>
                <Textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Any additional context..."
                  className="h-16 text-sm resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleOverrideConfirm}
              disabled={!selectedReason || overrideSubmitting}
            >
              {overrideSubmitting ? 'Closing...' : 'Confirm Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
