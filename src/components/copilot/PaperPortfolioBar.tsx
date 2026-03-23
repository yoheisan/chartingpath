import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Square, RotateCcw, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
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
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('paperTrading.flattenAllTitle', 'Flatten all positions?')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('paperTrading.flattenAllDesc', 'This will close all open paper trades at the current market price.')}</p>
          <div className="flex gap-2 pt-2">
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
