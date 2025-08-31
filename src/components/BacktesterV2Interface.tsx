import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Zap, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Layers,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  Info,
  PieChart,
  Briefcase
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PairTradingConfig } from './PairTradingBuilder';
import { BasketManager, BasketConfig } from './BasketManager';
import { PortfolioManager, PortfolioConfig } from './PortfolioManager';

interface V2BacktestParams {
  // Basic Parameters
  strategy: string;
  instrument: string;
  timeframe: string;
  fromDate: string;
  toDate: string;
  
  // Advanced V2 Parameters
  dataGranularity: 'tick' | 'second' | 'minute' | 'hour';
  executionModel: 'instant' | 'realistic' | 'pessimistic';
  slippageModel: 'fixed' | 'dynamic' | 'market_impact';
  
  // Portfolio Parameters
  portfolioMode: 'single' | 'pair' | 'basket' | 'portfolio';
  rebalanceFrequency: 'trade' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  portfolioWeights: number[];
  
  // Basket/Portfolio Configuration
  selectedBasketId?: string;
  selectedPortfolioId?: string;
  
  // Risk Management
  portfolioLevelStops: boolean;
  correlationLimit: number;
  sectorLimit: number;
  maxDrawdownStop: number;
  
  // Advanced Features
  enableHedging: boolean;
  dynamicSizing: boolean;
  marketRegimeDetection: boolean;
  transactionCosts: {
    commission: number;
    spread: number;
    marketImpact: number;
    borrowCost: number;
  };
}

interface BacktesterV2InterfaceProps {
  onRunBacktest: (params: V2BacktestParams) => void;
  isRunning: boolean;
  initialMode?: 'single' | 'pair' | 'basket' | 'portfolio';
  pairTradingConfig?: PairTradingConfig;
}

const BacktesterV2Interface: React.FC<BacktesterV2InterfaceProps> = ({
  onRunBacktest,
  isRunning,
  initialMode = 'single',
  pairTradingConfig
}) => {
  const { hasFeatureAccess } = useUserProfile();
  
  // State for basket and portfolio management
  const [baskets, setBaskets] = useState<BasketConfig[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioConfig[]>([]);
  
  const [params, setParams] = useState<V2BacktestParams>({
    strategy: '',
    instrument: pairTradingConfig ? `${pairTradingConfig.symbolA}/${pairTradingConfig.symbolB}` : 'EURUSD',
    timeframe: pairTradingConfig?.timeframe || '1H',
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    dataGranularity: 'minute',
    executionModel: 'realistic',
    slippageModel: 'dynamic',
    portfolioMode: initialMode,
    rebalanceFrequency: 'trade',
    portfolioWeights: [100],
    selectedBasketId: undefined,
    selectedPortfolioId: undefined,
    portfolioLevelStops: true,
    correlationLimit: 0.8,
    sectorLimit: 30,
    maxDrawdownStop: 20,
    enableHedging: false,
    dynamicSizing: true,
    marketRegimeDetection: true,
    transactionCosts: {
      commission: 0.1,
      spread: 0.05,
      marketImpact: 0.02,
      borrowCost: pairTradingConfig?.borrowCost * 100 || 0.5
    }
  });

  const updateParams = (updates: Partial<V2BacktestParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  };

  const instruments = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
    'SPY', 'QQQ', 'IWM', 'TLT', 'GLD', 'AAPL', 'TSLA'
  ];

  const strategies = [
    'Mean Reversion Pro',
    'Momentum Breakout V2',
    'Pair Trading Algorithm',
    'Multi-Asset Rotation',
    'Volatility Arbitrage',
    'Cross-Asset Momentum'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Backtester V2 Interface
            <Badge className="bg-gradient-to-r from-primary to-accent text-white">
              Advanced Engine
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Setup</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="baskets">Baskets</TabsTrigger>
          <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Parameters */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Strategy</Label>
                  <Select value={params.strategy} onValueChange={(value) => updateParams({ strategy: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((strategy) => (
                        <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Instrument/Asset</Label>
                  <Select value={params.instrument} onValueChange={(value) => updateParams({ instrument: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((instrument) => (
                        <SelectItem key={instrument} value={instrument}>{instrument}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select value={params.timeframe} onValueChange={(value) => updateParams({ timeframe: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1M">1 Minute</SelectItem>
                      <SelectItem value="5M">5 Minutes</SelectItem>
                      <SelectItem value="15M">15 Minutes</SelectItem>
                      <SelectItem value="1H">1 Hour</SelectItem>
                      <SelectItem value="4H">4 Hours</SelectItem>
                      <SelectItem value="1D">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Data Granularity
                    {hasFeatureAccess('tick_data') && <Badge variant="secondary" className="text-xs">Elite</Badge>}
                  </Label>
                  <Select 
                    value={params.dataGranularity} 
                    onValueChange={(value: 'tick' | 'second' | 'minute' | 'hour') => updateParams({ dataGranularity: value })}
                    disabled={!hasFeatureAccess('tick_data') && params.dataGranularity === 'tick'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Minute-level</SelectItem>
                      <SelectItem value="second">Second-level</SelectItem>
                      {hasFeatureAccess('tick_data') && <SelectItem value="tick">Tick-level (Elite)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={params.fromDate}
                    onChange={(e) => updateParams({ fromDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={params.toDate}
                    onChange={(e) => updateParams({ toDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Parameters */}
        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Execution Modeling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Execution Model</Label>
                  <Select 
                    value={params.executionModel} 
                    onValueChange={(value: 'instant' | 'realistic' | 'pessimistic') => updateParams({ executionModel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant (Optimistic)</SelectItem>
                      <SelectItem value="realistic">Realistic Delays</SelectItem>
                      <SelectItem value="pessimistic">Pessimistic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Slippage Model</Label>
                  <Select 
                    value={params.slippageModel} 
                    onValueChange={(value: 'fixed' | 'dynamic' | 'market_impact') => updateParams({ slippageModel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Slippage</SelectItem>
                      <SelectItem value="dynamic">Dynamic (Volatility)</SelectItem>
                      <SelectItem value="market_impact">Market Impact Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Enable Hedging
                    <Switch 
                      checked={params.enableHedging}
                      onCheckedChange={(checked) => updateParams({ enableHedging: checked })}
                    />
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Transaction Costs
                </h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Commission (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[params.transactionCosts.commission]}
                        onValueChange={([value]) => updateParams({ 
                          transactionCosts: { ...params.transactionCosts, commission: value }
                        })}
                        max={1}
                        min={0}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>{params.transactionCosts.commission}%</span>
                        <span>1%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Spread Impact (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[params.transactionCosts.spread]}
                        onValueChange={([value]) => updateParams({ 
                          transactionCosts: { ...params.transactionCosts, spread: value }
                        })}
                        max={0.5}
                        min={0}
                        step={0.005}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>{params.transactionCosts.spread}%</span>
                        <span>0.5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Market Impact (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[params.transactionCosts.marketImpact]}
                        onValueChange={([value]) => updateParams({ 
                          transactionCosts: { ...params.transactionCosts, marketImpact: value }
                        })}
                        max={0.2}
                        min={0}
                        step={0.001}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>{params.transactionCosts.marketImpact}%</span>
                        <span>0.2%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Borrow Cost (Annual %)</Label>
                    <div className="px-3">
                      <Slider
                        value={[params.transactionCosts.borrowCost]}
                        onValueChange={([value]) => updateParams({ 
                          transactionCosts: { ...params.transactionCosts, borrowCost: value }
                        })}
                        max={10}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>{params.transactionCosts.borrowCost}%</span>
                        <span>10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Parameters */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Portfolio Configuration
                {!hasFeatureAccess('basket_trading') && (
                  <Badge variant="outline" className="text-xs">Pro+ Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Portfolio Mode</Label>
                    <Select 
                    value={params.portfolioMode} 
                    onValueChange={(value: 'single' | 'pair' | 'basket' | 'portfolio') => updateParams({ portfolioMode: value })}
                    disabled={!hasFeatureAccess('pair_trading') && params.portfolioMode !== 'single'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Asset</SelectItem>
                      {hasFeatureAccess('pair_trading') && <SelectItem value="pair">Pair Trading</SelectItem>}
                      {hasFeatureAccess('basket_trading') && <SelectItem value="basket">Single Basket</SelectItem>}
                      {hasFeatureAccess('basket_trading') && <SelectItem value="portfolio">Multi-Basket Portfolio</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rebalance Frequency</Label>
                  <Select 
                    value={params.rebalanceFrequency} 
                    onValueChange={(value: 'trade' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => updateParams({ rebalanceFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trade">Per Trade</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Portfolio Risk Controls</h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Max Correlation Limit</Label>
                    <div className="px-3">
                      <Slider
                        value={[params.correlationLimit]}
                        onValueChange={([value]) => updateParams({ correlationLimit: value })}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span>{params.correlationLimit}</span>
                        <span>1</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Max Drawdown Stop (%)</Label>
                    <div className="px-3">
                      <Slider
                        value={[params.maxDrawdownStop]}
                        onValueChange={([value]) => updateParams({ maxDrawdownStop: value })}
                        max={50}
                        min={5}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>5%</span>
                        <span>{params.maxDrawdownStop}%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Portfolio-Level Stops</Label>
                  <Switch 
                    checked={params.portfolioLevelStops}
                    onCheckedChange={(checked) => updateParams({ portfolioLevelStops: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Baskets Management */}
        <TabsContent value="baskets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Basket Management
                {!hasFeatureAccess('basket_trading') && (
                  <Badge variant="outline" className="text-xs">Pro+ Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasFeatureAccess('basket_trading') ? (
                <BasketManager 
                  baskets={baskets}
                  onBasketsChange={setBaskets}
                />
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Basket management requires Pro+ subscription
                  </p>
                  <Button variant="outline">Upgrade to Pro+</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basket Selection for Backtesting */}
          {hasFeatureAccess('basket_trading') && baskets.length > 0 && params.portfolioMode === 'basket' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Basket for Backtest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Basket</Label>
                  <Select 
                    value={params.selectedBasketId || ''} 
                    onValueChange={(value) => updateParams({ selectedBasketId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a basket" />
                    </SelectTrigger>
                    <SelectContent>
                      {baskets.map((basket) => (
                        <SelectItem key={basket.id} value={basket.id}>
                          {basket.name} ({basket.assets.length} assets)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Portfolios Management */}
        <TabsContent value="portfolios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Portfolio Management
                {!hasFeatureAccess('basket_trading') && (
                  <Badge variant="outline" className="text-xs">Pro+ Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasFeatureAccess('basket_trading') ? (
                <PortfolioManager 
                  portfolios={portfolios}
                  availableBaskets={baskets}
                  onPortfoliosChange={setPortfolios}
                />
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Portfolio management requires Pro+ subscription
                  </p>
                  <Button variant="outline">Upgrade to Pro+</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Selection for Backtesting */}
          {hasFeatureAccess('basket_trading') && portfolios.length > 0 && params.portfolioMode === 'portfolio' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Portfolio for Backtest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Portfolio</Label>
                  <Select 
                    value={params.selectedPortfolioId || ''} 
                    onValueChange={(value) => updateParams({ selectedPortfolioId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name} ({portfolio.allocations.length} baskets)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced Features */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dynamic Position Sizing</Label>
                      <p className="text-xs text-muted-foreground">Adjust size based on volatility</p>
                    </div>
                    <Switch 
                      checked={params.dynamicSizing}
                      onCheckedChange={(checked) => updateParams({ dynamicSizing: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Market Regime Detection</Label>
                      <p className="text-xs text-muted-foreground">Adapt to market conditions</p>
                    </div>
                    <Switch 
                      checked={params.marketRegimeDetection}
                      onCheckedChange={(checked) => updateParams({ marketRegimeDetection: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">V2 Engine Benefits</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                          <li>• Realistic execution modeling</li>
                          <li>• Advanced risk metrics</li>
                          <li>• Portfolio-level analysis</li>
                          <li>• Enhanced cost modeling</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Ready to run V2 backtest</p>
              <p className="text-sm text-muted-foreground">
                Enhanced simulation with {params.dataGranularity}-level data and {params.executionModel} execution
              </p>
            </div>
            
            <Button 
              onClick={() => onRunBacktest(params)}
              disabled={isRunning || !params.strategy}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                  Running V2 Engine...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run V2 Backtest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { BacktesterV2Interface };