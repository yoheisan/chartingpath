import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Activity, History, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaperTrading, PaperTrade } from '@/hooks/usePaperTrading';
import { PositionsTab } from '@/components/paper-trading/PositionsTab';
import { HistoryTab } from '@/components/paper-trading/HistoryTab';
import { PerformanceTab } from '@/components/paper-trading/PerformanceTab';
import { OverrideDialog } from '@/components/paper-trading/OverrideDialog';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function PaperTradingPage() {
  const { user } = useAuth();
  const { portfolio, openTrades, closedTrades, loading, closingTradeId, handleCloseTrade, winRate } = usePaperTrading(user?.id);
  const [overrideTrade, setOverrideTrade] = useState<PaperTrade | null>(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const handleOverrideConfirm = async (trade: PaperTrade, reason: string, notes: string) => {
    setOverrideSubmitting(true);
    await handleCloseTrade(trade.id, trade.symbol, { reason, notes });
    setOverrideSubmitting(false);
    setOverrideTrade(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h1 className="text-xl font-bold">Paper Trading Dashboard</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Sign in to track your paper trades, measure performance, and compare your results against backtested patterns.
        </p>
        <Link to="/auth" className="text-sm text-primary font-medium hover:underline">Sign In →</Link>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Paper Trading
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track simulated trades and measure your edge</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Balance</div>
            <div className="text-lg font-bold tabular-nums">
              ${(portfolio?.current_balance ?? 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">P&L</div>
            <div className={cn('text-lg font-bold tabular-nums', totalPnl > 0 ? 'text-emerald-500' : totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Win Rate</div>
            <div className="text-lg font-bold tabular-nums">{closedTrades.length > 0 ? `${winRate.toFixed(0)}%` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="positions" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Positions ({openTrades.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            History ({closedTrades.length})
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Performance
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
    </div>
  );
}
