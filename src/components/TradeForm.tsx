import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calculator } from 'lucide-react';

interface TradeFormProps {
  symbol: string;
  onTrade: (trade: {
    symbol: string;
    type: 'buy' | 'sell';
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => void;
  loading: boolean;
  availableBalance: number;
}

export const TradeForm = ({ symbol, onTrade, loading, availableBalance }: TradeFormProps) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('0.01');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // Mock current price
  const currentPrice = Math.random() * 2 + 0.8;
  const estimatedCost = parseFloat(quantity || '0') * currentPrice;

  const handleSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) return;
    if (estimatedCost > availableBalance) return;

    onTrade({
      symbol,
      type: tradeType,
      quantity: parseFloat(quantity),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    });

    // Reset form
    setQuantity('0.01');
    setStopLoss('');
    setTakeProfit('');
  };

  const isValidTrade = quantity && parseFloat(quantity) > 0 && estimatedCost <= availableBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Place Trade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Symbol and Price */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">{symbol}</span>
            <Badge variant="outline">Live</Badge>
          </div>
          <div className="text-2xl font-mono font-bold">
            {currentPrice.toFixed(4)}
          </div>
        </div>

        {/* Trade Type */}
        <div>
          <Label>Trade Type</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant={tradeType === 'buy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTradeType('buy')}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Buy
            </Button>
            <Button
              variant={tradeType === 'sell' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTradeType('sell')}
              className="flex-1"
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              Sell
            </Button>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor="quantity">Quantity (lots)</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.01"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Estimated cost: ${estimatedCost.toFixed(2)}
          </p>
        </div>

        {/* Risk Management */}
        <div className="space-y-3">
          <Label>Risk Management (Optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                step="0.0001"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Stop Loss"
              />
            </div>
            <div>
              <Input
                type="number"
                step="0.0001"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Take Profit"
              />
            </div>
          </div>
        </div>

        {/* Available Balance */}
        <div className="p-3 bg-secondary/20 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available Balance:</span>
            <span className="font-semibold">${availableBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!isValidTrade || loading}
          className="w-full"
          variant={tradeType === 'buy' ? 'default' : 'secondary'}
        >
          {loading ? 'Executing...' : `${tradeType.toUpperCase()} ${symbol}`}
        </Button>

        {estimatedCost > availableBalance && (
          <p className="text-sm text-red-600">
            Insufficient balance for this trade
          </p>
        )}
      </CardContent>
    </Card>
  );
};