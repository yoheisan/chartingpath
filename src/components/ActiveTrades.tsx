import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  status: 'open' | 'closed' | 'cancelled';
  pnl?: number;
  created_at: string;
}

interface ActiveTradesProps {
  trades: Trade[];
  onCloseTrade: (tradeId: string, exitPrice: number) => void;
}

export const ActiveTrades = ({ trades, onCloseTrade }: ActiveTradesProps) => {
  const handleCloseTrade = (tradeId: string) => {
    // Mock current price - in production this would be real market data
    const mockExitPrice = Math.random() * 2 + 0.8;
    onCloseTrade(tradeId, mockExitPrice);
  };

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Trades</CardTitle>
          <CardDescription>No open positions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Your active trades will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Trades</CardTitle>
        <CardDescription>{trades.length} open position{trades.length !== 1 ? 's' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.map((trade) => {
            // Mock current price for P&L calculation
            const currentPrice = Math.random() * 2 + 0.8;
            const unrealizedPnl = trade.trade_type === 'buy' 
              ? (currentPrice - trade.entry_price) * trade.quantity
              : (trade.entry_price - currentPrice) * trade.quantity;
            const isProfit = unrealizedPnl >= 0;

            return (
              <div key={trade.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}>
                      {trade.trade_type.toUpperCase()}
                    </Badge>
                    <span className="font-semibold">{trade.symbol}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCloseTrade(trade.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <div className="font-medium">{trade.quantity}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entry Price:</span>
                    <div className="font-medium">{trade.entry_price.toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Price:</span>
                    <div className="font-medium">{currentPrice.toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unrealized P&L:</span>
                    <div className={`font-medium flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isProfit ? '+' : ''}${unrealizedPnl.toFixed(2)}
                    </div>
                  </div>
                </div>

                {(trade.stop_loss || trade.take_profit) && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {trade.stop_loss && (
                        <div>
                          <span className="text-muted-foreground">Stop Loss:</span>
                          <div className="text-red-600 font-medium">{trade.stop_loss.toFixed(4)}</div>
                        </div>
                      )}
                      {trade.take_profit && (
                        <div>
                          <span className="text-muted-foreground">Take Profit:</span>
                          <div className="text-green-600 font-medium">{trade.take_profit.toFixed(4)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};