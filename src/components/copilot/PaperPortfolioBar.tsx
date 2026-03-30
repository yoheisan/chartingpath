import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Square, RotateCcw, Wallet, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { useLivePrices } from '@/hooks/useLivePrices';
import { isForexSymbol, calcForexPnl, priceToPips } from '@/utils/forexUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PaperPortfolioBarProps {
  userId?: string;
}

export function PaperPortfolioBar({ userId }: PaperPortfolioBarProps) {
  const { t } = useTranslation();
  const { portfolio, openTrades, closedTrades, loading, flattenAll, resetPortfolio, winRate } = usePaperTrading(userId);
  const { connection } = useBrokerConnection(userId);
  const isLive = connection?.is_live === true;

  const [flattenModalOpen, setFlattenModalOpen] = useState(false);
  const [flattening, setFlattening] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Live prices for open trades (always called, symbols may be empty)
  const openSymbols = useMemo(() => openTrades.map(t => t.symbol), [openTrades]);
  const livePrices = useLivePrices(openSymbols);

  // Flatten preview calculations
  const flattenPreview = useMemo(() => {
    let totalPnl = 0;
    let totalR = 0;
    const missingPriceSymbols: string[] = [];

    for (const trade of openTrades) {
      const liveData = livePrices[trade.symbol];
      if (!liveData) {
        missingPriceSymbols.push(trade.symbol);
        continue;
      }

      const exitPrice = liveData.price;
      const entryPrice = trade.entry_price ?? 0;
      const isShort = trade.trade_type === 'short' || trade.trade_type === 'sell';
      const forex = isForexSymbol(trade.symbol);

      let pnl = 0;
      if (forex) {
        const lotSize = (trade as any).forex_lot_size ?? 0.01;
        const priceMove = isShort ? (entryPrice - exitPrice) : (exitPrice - entryPrice);
        pnl = calcForexPnl(trade.symbol, priceMove, lotSize);
      } else {
        const qty = (trade as any).quantity ?? 1;
        pnl = isShort
          ? (entryPrice - exitPrice) * qty
          : (exitPrice - entryPrice) * qty;
      }

      const sl = trade.stop_loss ?? entryPrice;
      const riskPerUnit = Math.abs(entryPrice - sl);
      const outcomeR = riskPerUnit > 0
        ? (isShort ? (entryPrice - exitPrice) : (exitPrice - entryPrice)) / riskPerUnit
        : 0;

      totalPnl += pnl;
      totalR += outcomeR;
    }

    return {
      count: openTrades.length,
      totalPnl,
      totalR,
      missingPriceSymbols,
      priced: openTrades.length - missingPriceSymbols.length,
    };
  }, [openTrades, livePrices]);

  if (!userId || loading) return null;

  const totalPnl = portfolio?.total_pnl ?? 0;
  const balance = portfolio?.current_balance ?? 100000;

  const handleFlattenAll = async () => {
    setFlattening(true);
    try {
      await flattenAll();
      setFlattenModalOpen(false);
    } catch {
      // handled in hook
    } finally {
      setFlattening(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetPortfolio();
      setResetModalOpen(false);
    } catch {
      // handled in hook
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <div className="border-b border-border/40 px-3 py-2 space-y-1.5">
        {/* Balance row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              {t('paperTrading.balance', 'Balance')}
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums text-foreground">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* P&L + Win Rate row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-sm text-muted-foreground">{t('paperTrading.pnl', 'P&L')}</span>
            <span className={cn(
              'text-sm font-bold tabular-nums',
              totalPnl > 0 ? 'text-green-500' : totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">{t('paperTrading.winRate', 'WR')}</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {closedTrades.length > 0 ? `${winRate.toFixed(0)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Kill switch buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-sm px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  disabled={openTrades.length === 0}
                  onClick={() => setFlattenModalOpen(true)}
                >
                  <Square className="h-3 w-3 mr-1" />
                  {t('paperTrading.flattenAll', 'Flatten All')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{t('paperTrading.flattenAllDesc', 'Close all open paper trades at market price')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-sm px-2 text-muted-foreground hover:text-foreground"
                  disabled={isLive}
                  onClick={() => setResetModalOpen(true)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t('paperTrading.resetCapital', 'Reset')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {isLive
                    ? t('paperTrading.resetDisabledLive', 'Cannot reset while live trading is active')
                    : t('paperTrading.resetCapitalDesc', 'Clear all trades and reset balance to $100,000')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Flatten All Dialog */}
      <Dialog open={flattenModalOpen} onOpenChange={setFlattenModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('paperTrading.flattenAllTitle', 'Flatten all positions?')}</DialogTitle>
          </DialogHeader>

          {/* Estimated impact summary */}
          <div className="rounded-lg border border-border/30 bg-muted/20 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Positions to close</span>
              <span className="font-mono font-medium text-foreground">{flattenPreview.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated total P&L</span>
              <span className={cn(
                'font-mono font-medium',
                flattenPreview.totalPnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'
              )}>
                {flattenPreview.totalPnl >= 0 ? '+' : ''}${flattenPreview.totalPnl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated total R</span>
              <span className={cn(
                'font-mono font-medium',
                flattenPreview.totalR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'
              )}>
                {flattenPreview.totalR >= 0 ? '+' : ''}{flattenPreview.totalR.toFixed(1)}R
              </span>
            </div>

            {flattenPreview.missingPriceSymbols.length > 0 && (
              <div className="flex items-start gap-2 mt-1 rounded-md bg-amber-500/10 border border-amber-500/20 p-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-amber-400 font-medium">
                    Live price unavailable for {flattenPreview.missingPriceSymbols.length} position{flattenPreview.missingPriceSymbols.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-amber-400/70 mt-0.5 font-mono">
                    {flattenPreview.missingPriceSymbols.join(', ')}
                  </p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/60 text-right pt-1">
              Estimated — based on last known prices
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setFlattenModalOpen(false)} className="flex-1">{t('paperTrading.cancel', 'Cancel')}</Button>
            <Button onClick={handleFlattenAll} disabled={flattening} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {flattening ? t('paperTrading.flattening', 'Flattening…') : t('paperTrading.flattenAll', 'Flatten All')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Capital Dialog */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('paperTrading.resetCapitalTitle', 'Reset paper capital?')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('paperTrading.resetCapitalDesc', 'This will delete all trade history and reset your balance to $100,000.')}</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetModalOpen(false)} className="flex-1">{t('paperTrading.cancel', 'Cancel')}</Button>
            <Button onClick={handleReset} disabled={resetting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {resetting ? t('paperTrading.resetting', 'Resetting…') : t('paperTrading.resetCapital', 'Reset')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
