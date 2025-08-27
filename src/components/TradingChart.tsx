import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradingChartProps {
  symbol: string;
}

export const TradingChart = ({ symbol }: TradingChartProps) => {
  // Mock price data - in production this would come from real market data
  const mockPrice = (Math.random() * 2 + 0.8).toFixed(4);
  const mockChange = (Math.random() - 0.5) * 0.02;
  const isPositive = mockChange >= 0;

  return (
    <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 rounded-lg border">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">{symbol}</h3>
        <div className="text-4xl font-mono font-bold">
          {mockPrice}
        </div>
        <div className={`flex items-center gap-2 justify-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="font-semibold">
            {isPositive ? '+' : ''}{(mockChange * 100).toFixed(2)}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time chart integration coming soon
        </p>
      </div>
    </div>
  );
};