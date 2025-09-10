import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Zap, 
  Crown, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Layers,
  ArrowUpRight,
  Settings,
  BarChart3,
  Download,
  PlayCircle,
  StopCircle,
  Activity,
  DollarSign,
  Target,
  Timer,
  Brain
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBacktesterV2Usage } from '@/hooks/useBacktesterV2Usage';
import BacktestParametersPanel, { BacktestParams } from './BacktestParametersPanel';
import { getStrategyTemplate, getStrategyDescription, getStrategyRiskProfile } from '@/utils/StrategyTemplates';

interface BacktesterV2EngineProps {
  selectedStrategy: string;
  params: BacktestParams;
  onRunV2Backtest: () => void;
  isRunning: boolean;
  strategyAnswers?: any;
  isStrategyComplete?: boolean;
  onBacktestComplete?: () => void;
}

const BacktesterV2Engine: React.FC<BacktesterV2EngineProps> = ({
  selectedStrategy,
  params,
  onRunV2Backtest,
  isRunning,
  strategyAnswers,
  isStrategyComplete = false,
  onBacktestComplete
}) => {
  const { hasFeatureAccess, subscriptionPlan } = useUserProfile();
  const { 
    currentUsage, 
    quota, 
    hasUnlimited, 
    canRunBacktest, 
    usagePercentage 
  } = useBacktesterV2Usage();

  const [activeTab, setActiveTab] = useState('parameters');
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [backtestParams, setBacktestParams] = useState<BacktestParams>(params);

  // Update progress when backtesting completes
  React.useEffect(() => {
    if (!isRunning && progress > 0 && progress < 100) {
      setProgress(100);
      setCurrentPhase('Completed');
      onBacktestComplete?.();
    }
  }, [isRunning, progress, onBacktestComplete]);

  const hasV2Access = hasFeatureAccess('backtester_v2');
  const hasPairTrading = hasFeatureAccess('pair_trading');
  const hasBasketTrading = hasFeatureAccess('basket_trading');
  const hasTickData = hasFeatureAccess('tick_data');

  const isElite = subscriptionPlan?.toLowerCase() === 'elite';

  const handleUpgrade = () => {
    window.open('/pricing', '_blank');
  };

  // Mock strategies for the parameters panel
  const mockStrategies = [
    { id: '1', name: selectedStrategy, category: 'Custom', description: 'Custom strategy' }
  ];

  const handleParamsChange = (newParams: BacktestParams) => {
    setBacktestParams(newParams);
  };

  // Get strategy template based on approach
  const getApproachTemplate = () => {
    if (!strategyAnswers?.style?.approach) return null;
    return getStrategyTemplate(strategyAnswers.style.approach, strategyAnswers);
  };

  // Check if all required parameters are filled
  const areParametersComplete = () => {
    return !!(
      backtestParams.instrument &&
      backtestParams.timeframe &&
      backtestParams.initialCapital > 0 &&
      backtestParams.positionSize > 0 &&
      backtestParams.fromDate &&
      backtestParams.toDate &&
      isStrategyComplete &&
      strategyAnswers?.style?.approach
    );
  };

  const handleRunBacktest = async () => {
    if (!areParametersComplete()) {
      toast.error('Please complete all required parameters first');
      return;
    }
    
    setActiveTab('progress');
    
    // Simulate backtest phases for UI feedback
    const phases = [
      { name: 'Initializing V2 Engine', duration: 500 },
      { name: 'Loading Historical Data', duration: 1000 },
      { name: 'Validating Strategy Logic', duration: 500 },
      { name: 'Running Simulation', duration: 2000 },
      { name: 'Calculating Metrics', duration: 500 },
      { name: 'Generating Report', duration: 500 }
    ];

    let currentProgress = 0;
    const progressStep = 100 / phases.length;

    // Run phases with progress updates
    for (const phase of phases) {
      setCurrentPhase(phase.name);
      await new Promise(resolve => setTimeout(resolve, phase.duration));
      currentProgress += progressStep;
      setProgress(Math.min(currentProgress, 95)); // Stop at 95% until real backtest completes
    }

    setCurrentPhase('Running V2 Backtest...');
    
    // Now trigger the actual V2 backtest
    onRunV2Backtest();
  };

  const getUpgradeMessage = () => {
    if (isElite) return null; // Elite always allowed
    if (!hasV2Access) {
      return "Upgrade to Starter to access Backtester V2";
    }
    if (!canRunBacktest && !hasUnlimited) {
      return `Daily limit reached (${currentUsage}/${quota}). Upgrade to Pro+ for unlimited runs`;
    }
    return null;
  };

  const getStrategyTypeRestriction = () => {
    const strategyName = selectedStrategy.toLowerCase();
    
    if (strategyName.includes('pair') || strategyName.includes('spread')) {
      if (!hasPairTrading) {
        return "This pair trading strategy requires Pro plan or higher";
      }
    }
    
    if (strategyName.includes('basket') || strategyName.includes('portfolio')) {
      if (!hasBasketTrading) {
        return "This basket strategy requires Pro+ plan or higher";
      }
    }
    
    return null;
  };

  const strategyRestriction = getStrategyTypeRestriction();
  const upgradeMessage = getUpgradeMessage();
  const canExecute = ((isElite || (hasV2Access && canRunBacktest)) && !strategyRestriction);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Backtester V2 Engine</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Advanced backtesting with realistic execution modeling
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-accent/10">
              V2.0 Advanced
            </Badge>
            <Crown className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Plan Status & Usage */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-medium">{subscriptionPlan.toUpperCase()} Plan</span>
            </div>
            {!hasV2Access && (
              <Button variant="outline" size="sm" onClick={handleUpgrade}>
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>

          {/* Usage Tracking for non-unlimited plans */}
          {hasV2Access && !hasUnlimited && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Daily V2 Usage</span>
                <span className="font-medium">{currentUsage}/{quota} runs</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {usagePercentage > 80 && (
                <div className="flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Approaching daily limit</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Interface Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parameters" className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="engine" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Engine
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="mt-6">
            <div className="space-y-4">
              {/* Strategy Connection Status */}
              <Card className={`border ${isStrategyComplete ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isStrategyComplete ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <div>
                      <div className="font-medium">
                        {isStrategyComplete ? 'Strategy Connected' : 'Strategy Incomplete'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isStrategyComplete 
                          ? 'Parameters automatically synced from Strategy Builder'
                          : 'Complete strategy building to auto-populate parameters'
                        }
                      </div>
                    </div>
                  </div>
                  {strategyAnswers && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Market:</span>
                        <span className="ml-2 font-medium">
                          {strategyAnswers.market?.instrument || 'Not selected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="ml-2 font-medium">
                          {strategyAnswers.market?.timeframes?.[0] || 'Not selected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capital:</span>
                        <span className="ml-2 font-medium">
                          ${strategyAnswers.riskTolerance?.accountPrinciple?.toLocaleString() || 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk/Trade:</span>
                        <span className="ml-2 font-medium">
                          {strategyAnswers.riskTolerance?.riskPerTrade || 'Not set'}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <BacktestParametersPanel
                selectedStrategy={selectedStrategy}
                onStrategyChange={() => {}} // Strategy is pre-selected from builder
                params={backtestParams}
                onParamsChange={handleParamsChange}
                strategies={mockStrategies}
              />

              {/* Run Backtest Button */}
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Ready to Execute</div>
                      <div className="text-sm text-muted-foreground">
                        {areParametersComplete() 
                          ? 'All parameters configured. Ready to run backtest.'
                          : 'Complete all parameters to enable backtesting.'
                        }
                      </div>
                    </div>
                    {canExecute ? (
                      <Button 
                        onClick={handleRunBacktest}
                        disabled={isRunning || !areParametersComplete()}
                        size="lg"
                        className="min-w-[140px]"
                      >
                        {isRunning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                            Running...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Run Backtest
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleUpgrade}
                        variant="outline"
                        size="lg"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    )}
                  </div>

                  {/* Parameter Completion Status */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${backtestParams.instrument ? 'text-green-600' : 'text-orange-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${backtestParams.instrument ? 'bg-green-500' : 'bg-orange-500'}`} />
                      Instrument: {backtestParams.instrument ? '✓' : 'Required'}
                    </div>
                    <div className={`flex items-center gap-1 ${backtestParams.timeframe ? 'text-green-600' : 'text-orange-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${backtestParams.timeframe ? 'bg-green-500' : 'bg-orange-500'}`} />
                      Timeframe: {backtestParams.timeframe ? '✓' : 'Required'}
                    </div>
                    <div className={`flex items-center gap-1 ${backtestParams.initialCapital > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${backtestParams.initialCapital > 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                      Capital: {backtestParams.initialCapital > 0 ? '✓' : 'Required'}
                    </div>
                    <div className={`flex items-center gap-1 ${isStrategyComplete ? 'text-green-600' : 'text-orange-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${isStrategyComplete ? 'bg-green-500' : 'bg-orange-500'}`} />
                      Strategy: {isStrategyComplete ? '✓' : 'Complete in Builder'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engine Features Tab */}
          <TabsContent value="engine" className="mt-6">
            <div className="space-y-4">
              {/* Strategy Information */}
              {strategyAnswers?.style?.approach && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Selected Strategy: {getApproachTemplate()?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {getStrategyDescription(strategyAnswers.style.approach)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 p-3 bg-background/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Risk Level</div>
                        <div className="font-medium">{getStrategyRiskProfile(strategyAnswers.style.approach).risk}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Time Horizon</div>
                        <div className="font-medium">{getStrategyRiskProfile(strategyAnswers.style.approach).timeHorizon}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Best Market</div>
                        <div className="font-medium">{getStrategyRiskProfile(strategyAnswers.style.approach).marketCondition}</div>
                      </div>
                    </div>

                    {/* Strategy Parameters Preview */}
                    <div>
                      <h4 className="font-medium mb-2">Strategy Parameters</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(getApproachTemplate()?.parameters || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between p-2 bg-background/30 rounded">
                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">V2 Engine Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Feature Matrix */}
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Single Asset Strategies</span>
                      </div>
                      {hasV2Access ? (
                        <Badge variant="secondary" className="text-xs">✓ Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Starter+</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Pair Trading Strategies</span>
                      </div>
                      {hasPairTrading ? (
                        <Badge variant="secondary" className="text-xs">✓ Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pro+</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-500" />
                        <span>Portfolio/Basket Strategies</span>
                      </div>
                      {hasBasketTrading ? (
                        <Badge variant="secondary" className="text-xs">✓ Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pro++</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span>Tick-level Data & Analysis</span>
                      </div>
                      {hasTickData ? (
                        <Badge variant="secondary" className="text-xs">✓ Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pro++</Badge>
                      )}
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium text-primary mb-3">V2 Engine Specifications</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">• Execution Model:</span>
                        <span className="ml-2">Realistic slippage & commission</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">• Data Quality:</span>
                        <span className="ml-2">Institutional-grade feeds</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">• Risk Metrics:</span>
                        <span className="ml-2">Advanced portfolio analytics</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">• Performance:</span>
                        <span className="ml-2">Sub-second execution</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">• Market Impact:</span>
                        <span className="ml-2">Dynamic spread modeling</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">• Optimization:</span>
                        <span className="ml-2">Multi-objective algorithms</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Backtest Execution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="text-center text-sm text-muted-foreground">
                    {currentPhase}
                  </div>
                </div>

                {/* Live Metrics During Execution */}
                {isRunning && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Bars Processed</div>
                      <div className="text-lg font-bold text-primary">
                        {Math.round((progress / 100) * 8760)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Signals Generated</div>
                      <div className="text-lg font-bold text-green-600">
                        {Math.round((progress / 100) * 142)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Est. Completion</div>
                      <div className="text-lg font-bold text-orange-600">
                        {Math.max(0, Math.round((100 - progress) * 0.1))}s
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  {canExecute ? (
                    <Button 
                      onClick={handleRunBacktest}
                      disabled={isRunning || !selectedStrategy}
                      className="flex-1"
                      size="lg"
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                          Running V2 Engine...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Run V2 Backtest
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex-1 space-y-3">
                      {(upgradeMessage || strategyRestriction) && (
                        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-warning mb-1">Access Restricted</p>
                              <p className="text-muted-foreground">
                                {strategyRestriction || upgradeMessage}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleUpgrade}
                        variant="outline" 
                        className="w-full"
                        size="lg"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        View Pricing Plans
                      </Button>
                    </div>
                  )}

                  {isRunning && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="ml-3"
                      onClick={() => {
                        setProgress(0);
                        setCurrentPhase('');
                      }}
                    >
                      <StopCircle className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Run a backtest to see detailed results and analytics</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Net P&L: --</div>
                      <div>Win Rate: --</div>
                      <div>Sharpe Ratio: --</div>
                      <div>Max Drawdown: --</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Trade Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Total Trades: --</div>
                      <div>Avg Win: --</div>
                      <div>Avg Loss: --</div>
                      <div>Profit Factor: --</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Results
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-3 w-3 mr-1" />
                      CSV Report
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-3 w-3 mr-1" />
                      PDF Analysis
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-3 w-3 mr-1" />
                      JSON Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BacktesterV2Engine;