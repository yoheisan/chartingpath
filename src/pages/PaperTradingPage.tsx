import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Activity, History, BarChart3, Square, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaperTrading, PaperTrade } from '@/hooks/usePaperTrading';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { PositionsTab } from '@/components/paper-trading/PositionsTab';
import { HistoryTab } from '@/components/paper-trading/HistoryTab';
import { PerformanceTab } from '@/components/paper-trading/PerformanceTab';
import { OverrideDialog } from '@/components/paper-trading/OverrideDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PaperTradingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { portfolio, openTrades, closedTrades, loading, closingTradeId, handleCloseTrade, flattenAll, resetPortfolio, winRate } = usePaperTrading(user?.id);
  const { connection } = useBrokerConnection(user?.id);
  const isLive = connection?.is_live === true;
  const [overrideTrade, setOverrideTrade] = useState<PaperTrade | null>(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [flattenModalOpen, setFlattenModalOpen] = useState(false);
  const [flattening, setFlattening] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleOverrideConfirm = async (trade: PaperTrade, reason: string, notes: string) => {
    setOverrideSubmitting(true);
    await handleCloseTrade(trade.id, trade.symbol, { reason, notes });
    setOverrideSubmitting(false);
    setOverrideTrade(null);
  };

  const handleFlattenAll = async () => {
    setFlattening(true);
    try {
      await flattenAll();
      setFlattenModalOpen(false);
    } catch {
      // error handled in hook
    } finally {
      setFlattening(false);
    }
  };

  const handleResetPortfolio = async () => {
    setResetting(true);
    try {
      await resetPortfolio();
      setResetModalOpen(false);
    } catch {
      // error handled in hook
    } finally {
      setResetting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h1 className="text-xl font-bold">{t('paperTrading.signInTitle')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('paperTrading.signInDesc')}
        </p>
        <Link to="/auth" className="text-sm text-primary font-medium hover:underline">{t('paperTrading.signIn')}</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const totalPnl = portfolio?.total_pnl ?? 0;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t('paperTrading.pageTitle')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('paperTrading.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div className="flex items-center gap-2 mr-4">
            <Button
              variant="outline"
              size="sm"
              className="text-sm border-red-500/30 text-red-400 hover:bg-red-500/10"
              disabled={openTrades.length === 0}
              onClick={() => setFlattenModalOpen(true)}
            >
              <Square className="h-3.5 w-3.5 mr-1.5" />
              {t('paperTrading.flattenAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              disabled={isLive}
              title={isLive ? t('paperTrading.resetDisabledLive') : ''}
              onClick={() => setResetModalOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {t('paperTrading.resetCapital')}
            </Button>
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">{t('paperTrading.balance')}</div>
            <div className="text-lg font-bold tabular-nums">
              ${(portfolio?.current_balance ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">{t('paperTrading.pnl')}</div>
            <div className={cn('text-lg font-bold tabular-nums', totalPnl > 0 ? 'text-emerald-500' : totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">{t('paperTrading.winRate')}</div>
            <div className="text-lg font-bold tabular-nums">{closedTrades.length > 0 ? `${winRate.toFixed(0)}%` : '—'}</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="positions">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="positions" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            {t('paperTrading.positions')} ({openTrades.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            {t('paperTrading.history')} ({closedTrades.length})
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('paperTrading.performance')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-4">
          <PositionsTab
            trades={openTrades}
            closingTradeId={closingTradeId}
            onCloseTrade={handleCloseTrade}
            onOverride={setOverrideTrade}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab trades={closedTrades} />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <PerformanceTab closedTrades={closedTrades} portfolio={portfolio} userId={user.id} />
        </TabsContent>
      </Tabs>

      <OverrideDialog
        open={!!overrideTrade}
        onOpenChange={(open) => { if (!open) setOverrideTrade(null); }}
        trade={overrideTrade}
        onConfirm={handleOverrideConfirm}
        submitting={overrideSubmitting}
      />

      {/* Flatten All Dialog */}
      <Dialog open={flattenModalOpen} onOpenChange={setFlattenModalOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('paperTrading.flattenAllTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('paperTrading.flattenAllDesc')}</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setFlattenModalOpen(false)} className="flex-1">{t('paperTrading.cancel')}</Button>
            <Button onClick={handleFlattenAll} disabled={flattening} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {flattening ? t('paperTrading.flattening') : t('paperTrading.flattenAll')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Capital Dialog */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('paperTrading.resetCapitalTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('paperTrading.resetCapitalDesc')}</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetModalOpen(false)} className="flex-1">{t('paperTrading.cancel')}</Button>
            <Button onClick={handleResetPortfolio} disabled={resetting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {resetting ? t('paperTrading.resetting') : t('paperTrading.resetCapital')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
