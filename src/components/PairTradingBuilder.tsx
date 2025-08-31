import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, BarChart3, Target, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export interface PairTradingConfig {
  symbolA: string;
  symbolB: string;
  pairType: 'mean_reversion' | 'arbitrage' | 'cointegration';
  lookbackPeriod: number;
  zScoreEntry: number;
  zScoreExit: number;
  betaNeutral: boolean;
  maxLeverage: number;
  borrowCost: number;
  timeframe: string;
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    maxHoldingPeriod: number;
  };
}

interface PairTradingBuilderProps {
  onConfigChange: (config: PairTradingConfig) => void;
  onBacktest: (config: PairTradingConfig) => void;
}

// Popular pairs for different asset classes
const POPULAR_PAIRS = {
  'FX Majors': [
    { symbolA: 'EURUSD', symbolB: 'GBPUSD', correlation: 0.85 },
    { symbolA: 'AUDUSD', symbolB: 'NZDUSD', correlation: 0.92 },
    { symbolA: 'USDJPY', symbolB: 'USDCHF', correlation: -0.78 }
  ],
  'Commodities': [
    { symbolA: 'XOM', symbolB: 'USO', correlation: 0.73 },
    { symbolA: 'GLD', symbolB: 'SLV', correlation: 0.68 },
    { symbolA: 'DBA', symbolB: 'CORN', correlation: 0.81 }
  ],
  'Tech Stocks': [
    { symbolA: 'AAPL', symbolB: 'MSFT', correlation: 0.64 },
    { symbolA: 'GOOGL', symbolB: 'META', correlation: 0.71 },
    { symbolA: 'TSLA', symbolB: 'NVDA', correlation: 0.59 }
  ],
  'Sector ETFs': [
    { symbolA: 'XLF', symbolB: 'XLK', correlation: 0.42 },
    { symbolA: 'XLE', symbolB: 'XLU', correlation: -0.31 },
    { symbolA: 'XLV', symbolB: 'XLY', correlation: 0.38 }
  ]
};

const PAIR_STRATEGIES = [
  {
    type: 'mean_reversion',
    name: 'Mean Reversion',
    description: 'Trade when price spread deviates significantly from historical mean',
    riskLevel: 'Medium',
    timeHorizon: 'Short to Medium',
    bestFor: 'Cointegrated pairs with stable relationship'
  },
  {
    type: 'arbitrage',
    name: 'Statistical Arbitrage',
    description: 'Exploit temporary pricing inefficiencies between related assets',
    riskLevel: 'Low to Medium',
    timeHorizon: 'Very Short',
    bestFor: 'Highly correlated instruments with minimal fundamental divergence'
  },
  {
    type: 'cointegration',
    name: 'Cointegration Trading',
    description: 'Long-term equilibrium relationship trading with error correction',
    riskLevel: 'Medium to High',
    timeHorizon: 'Medium to Long',
    bestFor: 'Fundamentally linked assets with proven long-term relationship'
  }
];

export const PairTradingBuilder: React.FC<PairTradingBuilderProps> = ({
  onConfigChange,
  onBacktest
}) => {
  const { hasFeatureAccess } = useUserProfile();
  
  const [config, setConfig] = useState<PairTradingConfig>({
    symbolA: '',
    symbolB: '',
    pairType: 'mean_reversion',
    lookbackPeriod: 60,
    zScoreEntry: 2.0,
    zScoreExit: 0.5,
    betaNeutral: true,
    maxLeverage: 2.0,
    borrowCost: 0.03,
    timeframe: '1d',
    riskManagement: {
      stopLoss: 3.0,
      takeProfit: 1.5,
      maxHoldingPeriod: 30
    }
  });

  const [selectedPairCategory, setSelectedPairCategory] = useState<string>('');

  const updateConfig = (updates: Partial<PairTradingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const selectPair = (symbolA: string, symbolB: string) => {
    updateConfig({ symbolA, symbolB });
  };

  const handleBacktest = () => {
    if (!config.symbolA || !config.symbolB) {
      toast.error("Please select both instruments for the pair");
      return;
    }
    
    if (!hasFeatureAccess('backtester_v2')) {
      toast.error("Pair trading backtesting requires Pro+ subscription");
      return;
    }

    onBacktest(config);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Strategy Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pair Trading Strategy
            </CardTitle>
            <CardDescription>
              Build statistical arbitrage and mean reversion strategies using two correlated instruments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {PAIR_STRATEGIES.map((strategy) => (
                <Card
                  key={strategy.type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    config.pairType === strategy.type
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'border-muted'
                  }`}
                  onClick={() => updateConfig({ pairType: strategy.type as any })}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm">{strategy.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {strategy.description}
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Risk:</span>
                        <Badge variant="outline" className="text-xs py-0">
                          {strategy.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Horizon:</span>
                        <span className="text-muted-foreground">{strategy.timeHorizon}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instrument Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Asset Pair Selection
            </CardTitle>
            <CardDescription>
              Choose two correlated instruments or select from popular trading pairs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Popular Pairs */}
            <div>
              <Label className="text-sm font-medium">Popular Pairs by Category</Label>
              <div className="mt-2 space-y-3">
                {Object.entries(POPULAR_PAIRS).map(([category, pairs]) => (
                  <div key={category}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPairCategory(
                        selectedPairCategory === category ? '' : category
                      )}
                      className="mb-2"
                    >
                      {category}
                      <Badge variant="secondary" className="ml-2">
                        {pairs.length}
                      </Badge>
                    </Button>
                    
                    {selectedPairCategory === category && (
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 ml-4">
                        {pairs.map((pair) => (
                          <Card
                            key={`${pair.symbolA}-${pair.symbolB}`}
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              config.symbolA === pair.symbolA && config.symbolB === pair.symbolB
                                ? 'ring-1 ring-primary bg-muted/30'
                                : ''
                            }`}
                            onClick={() => selectPair(pair.symbolA, pair.symbolB)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{pair.symbolA}</span>
                                  <span className="text-muted-foreground">vs</span>
                                  <span className="font-medium text-sm">{pair.symbolB}</span>
                                </div>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge 
                                      variant={pair.correlation > 0.7 ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      ρ={pair.correlation}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Historical correlation coefficient</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Manual Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="symbolA">Primary Instrument (Symbol A)</Label>
                <Input
                  id="symbolA"
                  value={config.symbolA}
                  onChange={(e) => updateConfig({ symbolA: e.target.value.toUpperCase() })}
                  placeholder="EURUSD, AAPL, XOM..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbolB">Secondary Instrument (Symbol B)</Label>
                <Input
                  id="symbolB"
                  value={config.symbolB}
                  onChange={(e) => updateConfig({ symbolB: e.target.value.toUpperCase() })}
                  placeholder="GBPUSD, MSFT, USO..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategy Parameters
            </CardTitle>
            <CardDescription>
              Configure statistical thresholds and position sizing rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistical Parameters */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Statistical Thresholds</h4>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Lookback Period (Days)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.lookbackPeriod]}
                      onValueChange={([value]) => updateConfig({ lookbackPeriod: value })}
                      min={20}
                      max={252}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>20</span>
                      <span className="font-medium">{config.lookbackPeriod}</span>
                      <span>252</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Z-Score Entry Threshold</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.zScoreEntry]}
                      onValueChange={([value]) => updateConfig({ zScoreEntry: value })}
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1.0</span>
                      <span className="font-medium">{config.zScoreEntry.toFixed(1)}</span>
                      <span>3.0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Z-Score Exit Threshold</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.zScoreExit]}
                      onValueChange={([value]) => updateConfig({ zScoreExit: value })}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1</span>
                      <span className="font-medium">{config.zScoreExit.toFixed(1)}</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Position Sizing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Position Sizing & Risk</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Beta-Neutral Sizing</Label>
                    <p className="text-xs text-muted-foreground">
                      Adjust position sizes based on historical beta
                    </p>
                  </div>
                  <Switch
                    checked={config.betaNeutral}
                    onCheckedChange={(checked) => updateConfig({ betaNeutral: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Maximum Leverage</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total position value as multiple of account equity</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[config.maxLeverage]}
                      onValueChange={([value]) => updateConfig({ maxLeverage: value })}
                      min={1.0}
                      max={5.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1.0x</span>
                      <span className="font-medium">{config.maxLeverage.toFixed(1)}x</span>
                      <span>5.0x</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Borrow Cost (Annual %)</Label>
                  <Input
                    type="number"
                    value={config.borrowCost * 100}
                    onChange={(e) => updateConfig({ borrowCost: parseFloat(e.target.value) / 100 })}
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select
                    value={config.timeframe}
                    onValueChange={(value) => updateConfig({ timeframe: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">Daily</SelectItem>
                      <SelectItem value="1w">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Risk Management */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Risk Management</h4>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Stop Loss (Z-Score)</Label>
                  <Input
                    type="number"
                    value={config.riskManagement.stopLoss}
                    onChange={(e) => updateConfig({
                      riskManagement: {
                        ...config.riskManagement,
                        stopLoss: parseFloat(e.target.value)
                      }
                    })}
                    min="2"
                    max="5"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Take Profit (Z-Score)</Label>
                  <Input
                    type="number"
                    value={config.riskManagement.takeProfit}
                    onChange={(e) => updateConfig({
                      riskManagement: {
                        ...config.riskManagement,
                        takeProfit: parseFloat(e.target.value)
                      }
                    })}
                    min="0.5"
                    max="2"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Holding Period (Days)</Label>
                  <Input
                    type="number"
                    value={config.riskManagement.maxHoldingPeriod}
                    onChange={(e) => updateConfig({
                      riskManagement: {
                        ...config.riskManagement,
                        maxHoldingPeriod: parseInt(e.target.value)
                      }
                    })}
                    min="1"
                    max="90"
                    step="1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleBacktest}
            disabled={!config.symbolA || !config.symbolB}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Run Backtest
          </Button>
          
          {!hasFeatureAccess('backtester_v2') && (
            <Card className="flex-1">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pair trading requires Pro+ subscription
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};