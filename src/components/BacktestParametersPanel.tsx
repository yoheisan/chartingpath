import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  DollarSign, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Plus
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface BacktestParametersPanelProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  params: BacktestParams;
  onParamsChange: (params: BacktestParams) => void;
  strategies: Strategy[];
  isGuidedBuilder?: boolean; // true = guided builder (30 days limit), false = advanced engine (custom periods)
}

export interface BacktestParams {
  instrument: string;
  timeframe: string;
  period: string;
  fromDate: string;
  toDate: string;
  initialCapital: number;
  positionSizingType: string;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  orderType: string;
  commission: number;
  slippage: number;
}

const POPULAR_INSTRUMENTS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'XAUUSD', 'XAGUSD', 'SPX500', 'NAS100', 'US30', 'GER30', 'UK100'
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1H', label: '1 Hour' },
  { value: '4H', label: '4 Hours' },
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' }
];

const BACKTEST_PERIODS = [
  { value: 'custom', label: 'Custom Range' },
  { value: '1M', label: 'Last 1 Month' },
  { value: '3M', label: 'Last 3 Months' },
  { value: '6M', label: 'Last 6 Months' },
  { value: '1Y', label: 'Last 1 Year' },
  { value: '2Y', label: 'Last 2 Years' },
  { value: '3Y', label: 'Last 3 Years' },
  { value: '5Y', label: 'Last 5 Years' }
];

const BacktestParametersPanel: React.FC<BacktestParametersPanelProps> = ({
  selectedStrategy,
  onStrategyChange,
  params,
  onParamsChange,
  strategies
}) => {
  const updateParam = (key: keyof BacktestParams, value: any) => {
    onParamsChange({ ...params, [key]: value });
  };

  const calculateDateRange = (period: string) => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    let fromDate: string;

    switch (period) {
      case '1M':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];
        break;
      case '3M':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().split('T')[0];
        break;
      case '6M':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().split('T')[0];
        break;
      case '1Y':
        fromDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      case '2Y':
        fromDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      case '3Y':
        fromDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      case '5Y':
        fromDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      default:
        return; // Custom range - don't update dates
    }

    updateParam('fromDate', fromDate);
    updateParam('toDate', toDate);
  };

  const handlePeriodChange = (value: string) => {
    updateParam('period', value);
    calculateDateRange(value);
  };

  const validateSettings = () => {
    const warnings = [];
    
    if (!selectedStrategy) warnings.push("No strategy selected");
    if (params.stopLoss && params.stopLoss <= 0) warnings.push("Stop loss must be > 0");
    if (params.takeProfit && params.takeProfit <= 0) warnings.push("Take profit must be > 0");
    if (params.positionSize <= 0) warnings.push("Position size must be > 0");
    if (new Date(params.fromDate) >= new Date(params.toDate)) warnings.push("Invalid date range");
    
    return warnings;
  };

  const warnings = validateSettings();

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategy & Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="strategy">Strategy</Label>
            <Select value={selectedStrategy} onValueChange={onStrategyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.slice(0, 20).map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.name}>
                    {strategy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="instrument">Instrument</Label>
              <Select value={params.instrument} onValueChange={(value) => updateParam('instrument', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_INSTRUMENTS.map((instrument) => (
                    <SelectItem key={instrument} value={instrument}>
                      {instrument}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={params.timeframe} onValueChange={(value) => updateParam('timeframe', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="period">Backtest Period</Label>
            <Select value={params.period} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKTEST_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {params.period !== 'custom' && params.fromDate && params.toDate && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Period: {params.fromDate} to {params.toDate}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                type="date"
                value={params.fromDate}
                onChange={(e) => updateParam('fromDate', e.target.value)}
                disabled={params.period !== 'custom'}
              />
            </div>

            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                type="date"
                value={params.toDate}
                onChange={(e) => updateParam('toDate', e.target.value)}
                disabled={params.period !== 'custom'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital & Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Capital & Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="initialCapital">Initial Capital ($)</Label>
            <Input
              type="number"
              value={params.initialCapital}
              onChange={(e) => updateParam('initialCapital', Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="positionSizingType">Position Sizing</Label>
            <Select 
              value={params.positionSizingType} 
              onValueChange={(value) => updateParam('positionSizingType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage of Capital</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="positionSize">
              Position Size ({params.positionSizingType === 'percentage' ? '%' : '$'})
            </Label>
            <Input
              type="number"
              step="0.1"
              value={params.positionSize}
              onChange={(e) => updateParam('positionSize', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stopLoss">Stop Loss (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={params.stopLoss || ''}
                onChange={(e) => updateParam('stopLoss', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="takeProfit">Take Profit (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={params.takeProfit || ''}
                onChange={(e) => updateParam('takeProfit', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="orderType">Order Type</Label>
            <Select value={params.orderType} onValueChange={(value) => updateParam('orderType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market Order</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="commission">Commission (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={params.commission}
                onChange={(e) => updateParam('commission', Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="slippage">Slippage (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={params.slippage}
                onChange={(e) => updateParam('slippage', Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-warning mb-2">Validation Warnings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BacktestParametersPanel;