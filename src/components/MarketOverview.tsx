import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const MAJOR_PAIRS = [
  { symbol: 'EUR/USD', price: 1.0842, change: 0.0023 },
  { symbol: 'GBP/USD', price: 1.2745, change: -0.0012 },
  { symbol: 'USD/JPY', price: 149.45, change: 0.34 },
  { symbol: 'USD/CHF', price: 0.8876, change: -0.0008 },
];

export const MarketOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Market Overview
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MAJOR_PAIRS.map((pair) => {
            const isPositive = pair.change >= 0;
            const changePercent = (pair.change / pair.price) * 100;
            
            return (
              <div key={pair.symbol} className="p-3 border rounded-lg">
                <div className="font-semibold text-sm mb-1">{pair.symbol}</div>
                <div className="font-mono text-lg">{pair.price.toFixed(4)}</div>
                <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-primary mt-1" />
            <div>
              <p className="text-sm font-semibold text-primary">Market Alert</p>
              <p className="text-xs text-muted-foreground">
                USD showing strength across major pairs. Consider dollar-based trades.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};