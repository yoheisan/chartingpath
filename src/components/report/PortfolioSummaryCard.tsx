import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Target, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PaperPortfolio, PaperTrade } from "@/hooks/usePaperTrading";

interface PortfolioSummaryCardProps {
  portfolio: PaperPortfolio | null;
  openTrades: PaperTrade[];
  closedTrades: PaperTrade[];
  winRate: number;
  loading: boolean;
}

const PortfolioSummaryCard = ({
  portfolio,
  openTrades,
  closedTrades,
  winRate,
  loading,
}: PortfolioSummaryCardProps) => {
  const { t } = useTranslation();

  if (loading || !portfolio) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayPnl = closedTrades
    .filter((trade) => trade.closed_at && new Date(trade.closed_at) >= todayStart)
    .reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);

  const totalPnl = portfolio.total_pnl ?? 0;
  const balance = portfolio.current_balance ?? 0;
  const pnlPercent = portfolio.initial_balance > 0
    ? ((totalPnl / portfolio.initial_balance) * 100)
    : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/10 mb-6">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{t("portfolioSummary.title")}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Account Balance */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("portfolioSummary.accountBalance")}
            </p>
            <p className="text-xl font-bold">{formatCurrency(balance)}</p>
          </div>

          {/* Total P&L */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("portfolioSummary.totalPnl")}
            </p>
            <div className="flex items-center gap-1.5">
              {totalPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(totalPnl)}
              </p>
              <span className={`text-xs ${totalPnl >= 0 ? "text-green-500/70" : "text-red-500/70"}`}>
                ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Today's P&L */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("portfolioSummary.todayPnl")}
            </p>
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className={`text-xl font-bold ${todayPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {todayPnl === 0 ? "$0.00" : formatCurrency(todayPnl)}
              </p>
            </div>
          </div>

          {/* Open Positions */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("portfolioSummary.openPositions")}
            </p>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xl font-bold">{openTrades.length}</p>
            </div>
          </div>

          {/* Win Rate */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("portfolioSummary.winRate")}
            </p>
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-xl font-bold">{winRate.toFixed(1)}%</p>
              <span className="text-xs text-muted-foreground">
                ({closedTrades.length} {t("portfolioSummary.trades")})
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummaryCard;
