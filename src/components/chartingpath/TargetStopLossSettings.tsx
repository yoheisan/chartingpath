import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TargetStopLossSettingsProps {
  targetGainPercent: number;
  stopLossPercent: number;
  positionSizing: {
    method: 'fixed_percent' | 'fixed_amount' | 'risk_based';
    riskPerTrade: number;
    maxPositions: number;
  };
  onChange: (data: any) => void;
}

export const TargetStopLossSettings: React.FC<TargetStopLossSettingsProps> = ({
  targetGainPercent,
  stopLossPercent,
  positionSizing,
  onChange
}) => {
  const riskRewardRatio = targetGainPercent / stopLossPercent;

  return (
    <div className="space-y-6">
      {/* Profit Target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Profit Target
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Target Gain %</Label>
              <span className="text-sm font-medium text-primary">{targetGainPercent.toFixed(2)}%</span>
            </div>
            <Slider
              value={[targetGainPercent]}
              onValueChange={(value) => onChange({ targetGainPercent: value[0], stopLossPercent, positionSizing })}
              min={0.5}
              max={20}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5%</span>
              <span>20%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Enter exact value (%)</Label>
            <Input
              type="number"
              value={targetGainPercent}
              onChange={(e) => onChange({ targetGainPercent: parseFloat(e.target.value) || 0, stopLossPercent, positionSizing })}
              min={0.1}
              max={100}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stop Loss */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Stop Loss
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Stop Loss %</Label>
              <span className="text-sm font-medium text-destructive">{stopLossPercent.toFixed(2)}%</span>
            </div>
            <Slider
              value={[stopLossPercent]}
              onValueChange={(value) => onChange({ targetGainPercent, stopLossPercent: value[0], positionSizing })}
              min={0.25}
              max={10}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.25%</span>
              <span>10%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Enter exact value (%)</Label>
            <Input
              type="number"
              value={stopLossPercent}
              onChange={(e) => onChange({ targetGainPercent, stopLossPercent: parseFloat(e.target.value) || 0, positionSizing })}
              min={0.1}
              max={50}
              step={0.05}
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk:Reward Analysis */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk:Reward Ratio</span>
              <span className="text-2xl font-bold text-primary">
                1:{riskRewardRatio.toFixed(2)}
              </span>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {riskRewardRatio >= 2 
                  ? '✓ Excellent risk:reward ratio for profitable trading' 
                  : riskRewardRatio >= 1.5 
                  ? '✓ Good risk:reward ratio' 
                  : '⚠ Consider increasing target or decreasing stop loss for better R:R'}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Position Sizing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Position Sizing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sizing Method</Label>
            <Select
              value={positionSizing.method}
              onValueChange={(value: any) => onChange({ 
                targetGainPercent, 
                stopLossPercent, 
                positionSizing: { ...positionSizing, method: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk_based">Risk-Based (% of Account)</SelectItem>
                <SelectItem value="fixed_percent">Fixed % of Account</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Risk Per Trade (%)</Label>
              <span className="text-sm font-medium">{positionSizing.riskPerTrade}%</span>
            </div>
            <Slider
              value={[positionSizing.riskPerTrade]}
              onValueChange={(value) => onChange({ 
                targetGainPercent, 
                stopLossPercent, 
                positionSizing: { ...positionSizing, riskPerTrade: value[0] }
              })}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Max Concurrent Positions</Label>
            <Input
              type="number"
              value={positionSizing.maxPositions}
              onChange={(e) => onChange({ 
                targetGainPercent, 
                stopLossPercent, 
                positionSizing: { ...positionSizing, maxPositions: parseInt(e.target.value) || 1 }
              })}
              min={1}
              max={10}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
