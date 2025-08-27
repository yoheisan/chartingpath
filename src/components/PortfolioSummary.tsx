import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface PortfolioSummaryProps {
  balance: number;
  totalPnl: number;
  activeTrades: number;
  initialBalance: number;
}

export const PortfolioSummary = ({ 
  balance, 
  totalPnl, 
  activeTrades, 
  initialBalance 
}: PortfolioSummaryProps) => {
  const returnPercentage = (totalPnl / initialBalance) * 100;
  const isPositive = totalPnl >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Starting: ${initialBalance.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {returnPercentage.toFixed(2)}% return
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeTrades}</div>
          <p className="text-xs text-muted-foreground">Open positions</p>
        </CardContent>
      </Card>
    </div>
  );
};