import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3, 
  AlertTriangle,
  Info,
  Brain,
  Zap,
  PieChart,
  Calendar,
  Calculator,
  CheckCircle,
  Settings,
  Play
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarketRegime {
  name: string;
  description: string;
  expectedSharpe: number;
  typicalDrawdown: number;
  volatility: number;
  conditions: string[];
}

interface RiskBudget {
  totalPortfolioRisk: number;
  strategyAllocation: number;
  maxDrawdown: number;
  riskPerTrade: number;
  correlationAdjustment: number;
}

interface ProfessionalTargets {
  sharpeRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  expectedReturn: number;
}

const MARKET_REGIMES: MarketRegime[] = [
  {
    name: "Bull Market",
    description: "Rising prices, low volatility, strong fundamentals",
    expectedSharpe: 1.2,
    typicalDrawdown: 8,
    volatility: 12,
    conditions: ["Low VIX", "Rising GDP", "Low Interest Rates"]
  },
  {
    name: "Bear Market", 
    description: "Falling prices, high volatility, economic stress",
    expectedSharpe: 0.6,
    typicalDrawdown: 25,
    volatility: 28,
    conditions: ["High VIX", "Recession Risk", "Rising Rates"]
  },
  {
    name: "Sideways Market",
    description: "Range-bound, moderate volatility, uncertainty",
    expectedSharpe: 0.8,
    typicalDrawdown: 15,
    volatility: 18,
    conditions: ["Moderate VIX", "Mixed Signals", "Consolidation"]
  },
  {
    name: "Crisis Period",
    description: "Extreme volatility, flight to safety, correlations spike",
    expectedSharpe: -0.2,
    typicalDrawdown: 40,
    volatility: 45,
    conditions: ["VIX > 30", "Credit Spreads Wide", "Liquidity Crunch"]
  }
];

const STRATEGY_BENCHMARKS = {
  'trend-following': { sharpe: 0.9, maxDD: 12, winRate: 45 },
  'mean-reversion': { sharpe: 1.1, maxDD: 8, winRate: 65 },
  'breakout': { sharpe: 0.7, maxDD: 18, winRate: 38 },
  'arbitrage': { sharpe: 1.5, maxDD: 5, winRate: 75 }
};

export const ProfessionalStrategyWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRegime, setSelectedRegime] = useState<MarketRegime | null>(null);
  const [riskBudget, setRiskBudget] = useState<RiskBudget>({
    totalPortfolioRisk: 15,
    strategyAllocation: 25,
    maxDrawdown: 10,
    riskPerTrade: 1,
    correlationAdjustment: 0.8
  });
  const [professionalTargets, setProfessionalTargets] = useState<ProfessionalTargets>({
    sharpeRatio: 1.0,
    calmarRatio: 0.5,
    maxDrawdown: 10,
    winRate: 55,
    profitFactor: 1.5,
    expectedReturn: 12
  });
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');

  // Auto-calculate targets based on regime and risk budget
  useEffect(() => {
    if (selectedRegime) {
      const baseTargets = calculateProfessionalTargets();
      setProfessionalTargets(baseTargets);
    }
  }, [selectedRegime, riskBudget, selectedStrategy]);

  const calculateProfessionalTargets = (): ProfessionalTargets => {
    if (!selectedRegime) return professionalTargets;

    const benchmark = selectedStrategy ? STRATEGY_BENCHMARKS[selectedStrategy as keyof typeof STRATEGY_BENCHMARKS] : null;
    
    // Adjust for market regime
    const regimeAdjustment = selectedRegime.expectedSharpe / 1.0; // Base Sharpe of 1.0
    const volatilityAdjustment = 15 / selectedRegime.volatility; // Base vol of 15%
    
    // Calculate risk-adjusted targets
    const adjustedSharpe = benchmark ? benchmark.sharpe * regimeAdjustment : regimeAdjustment;
    const adjustedMaxDD = Math.min(riskBudget.maxDrawdown, selectedRegime.typicalDrawdown * 0.6);
    const calmarRatio = adjustedSharpe * (selectedRegime.volatility / adjustedMaxDD);
    
    return {
      sharpeRatio: Math.max(0.3, Math.min(2.0, adjustedSharpe)),
      calmarRatio: Math.max(0.2, Math.min(1.5, calmarRatio)),
      maxDrawdown: adjustedMaxDD,
      winRate: benchmark ? benchmark.winRate : 55,
      profitFactor: 1.2 + (adjustedSharpe * 0.3),
      expectedReturn: adjustedSharpe * selectedRegime.volatility * riskBudget.strategyAllocation / 100
    };
  };

  const calculateKellyPosition = () => {
    const winRate = professionalTargets.winRate / 100;
    const avgWin = professionalTargets.profitFactor * (1 - winRate) / winRate;
    const avgLoss = 1;
    const kelly = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    return Math.max(0, Math.min(0.25, kelly)) * 100; // Cap at 25%
  };

  const steps = [
    {
      id: 'regime',
      title: 'Market Regime Analysis',
      description: 'Identify current market conditions like professionals do'
    },
    {
      id: 'risk-budget', 
      title: 'Risk Budget Allocation',
      description: 'Set portfolio-level risk limits and allocations'
    },
    {
      id: 'targets',
      title: 'Performance Targets',
      description: 'Set realistic, data-driven performance expectations'
    },
    {
      id: 'optimization',
      title: 'Parameter Optimization',
      description: 'Fine-tune strategy parameters for robustness'
    }
  ];

  const renderRegimeAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Market Regime Identification</h3>
        <p className="text-muted-foreground">
          Professional traders adapt strategies to market conditions. Select the regime that best describes current markets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MARKET_REGIMES.map((regime) => (
          <Card 
            key={regime.name}
            className={`cursor-pointer transition-all ${
              selectedRegime?.name === regime.name 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedRegime(regime)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {regime.name}
                {selectedRegime?.name === regime.name && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {regime.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">Sharpe</div>
                  <div className="text-primary">{regime.expectedSharpe}</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">Max DD</div>
                  <div className="text-orange-600">{regime.typicalDrawdown}%</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">Vol</div>
                  <div className="text-blue-600">{regime.volatility}%</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Key Indicators:</div>
                {regime.conditions.map((condition, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs mr-1">
                    {condition}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRegime && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                  Regime Selected: {selectedRegime.name}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  This will automatically adjust your strategy parameters and performance targets 
                  to be realistic for current market conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRiskBudgeting = () => (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Professional Risk Budgeting</h3>
          <p className="text-muted-foreground">
            Institutional approach to risk allocation across your portfolio
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Portfolio Risk Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  Total Portfolio Risk Budget
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annual volatility limit for entire portfolio. Professionals typically use 10-20%.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <span className="ml-auto font-semibold">{riskBudget.totalPortfolioRisk}%</span>
              </div>
              <Slider
                value={[riskBudget.totalPortfolioRisk]}
                onValueChange={(value) => setRiskBudget({...riskBudget, totalPortfolioRisk: value[0]})}
                max={30}
                min={5}
                step={1}
              />
              <div className="text-xs text-muted-foreground">
                Conservative: 8-12% | Moderate: 12-18% | Aggressive: 18-25%
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  Strategy Risk Allocation
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>What percentage of your total risk budget should this strategy consume?</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <span className="ml-auto font-semibold">{riskBudget.strategyAllocation}%</span>
              </div>
              <Slider
                value={[riskBudget.strategyAllocation]}
                onValueChange={(value) => setRiskBudget({...riskBudget, strategyAllocation: value[0]})}
                max={100}
                min={5}
                step={5}
              />
              <div className="text-xs text-muted-foreground">
                Strategy Risk: {((riskBudget.totalPortfolioRisk * riskBudget.strategyAllocation) / 100).toFixed(1)}% of portfolio
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  Maximum Drawdown Limit
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum portfolio loss before stopping the strategy. Professional limit.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <span className="ml-auto font-semibold">{riskBudget.maxDrawdown}%</span>
              </div>
              <Slider
                value={[riskBudget.maxDrawdown]}
                onValueChange={(value) => setRiskBudget({...riskBudget, maxDrawdown: value[0]})}
                max={25}
                min={3}
                step={1}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  Risk Per Trade (Kelly-Adjusted)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Position size using Kelly Criterion. Auto-calculated based on win rate and profit factor.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <span className="ml-auto font-semibold text-green-600">
                  {calculateKellyPosition().toFixed(1)}% (Kelly Optimal)
                </span>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-700 dark:text-green-300">
                  Based on your performance targets, the Kelly Criterion suggests {calculateKellyPosition().toFixed(1)}% 
                  position sizing for optimal growth.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );

  const renderProfessionalTargets = () => (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Data-Driven Performance Targets</h3>
          <p className="text-muted-foreground">
            Professional metrics automatically calibrated for {selectedRegime?.name} conditions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Risk-Adjusted Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Sharpe Ratio Target
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Return per unit of risk. 1.0+ is good, 1.5+ is excellent.</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <Badge variant={professionalTargets.sharpeRatio >= 1.0 ? 'default' : 'secondary'}>
                    {professionalTargets.sharpeRatio.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Calmar Ratio
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Annual return divided by max drawdown. Higher is better.</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <Badge variant={professionalTargets.calmarRatio >= 0.5 ? 'default' : 'secondary'}>
                    {professionalTargets.calmarRatio.toFixed(2)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expected Annual Return</span>
                  <Badge variant="outline">
                    {professionalTargets.expectedReturn.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Trading Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Win Rate Target</span>
                  <Badge variant="outline">
                    {professionalTargets.winRate.toFixed(0)}%
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Profit Factor
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gross profit / Gross loss. 1.5+ indicates profitable strategy.</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <Badge variant={professionalTargets.profitFactor >= 1.3 ? 'default' : 'secondary'}>
                    {professionalTargets.profitFactor.toFixed(2)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Max Drawdown</span>
                  <Badge variant="destructive">
                    {professionalTargets.maxDrawdown.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedRegime && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Regime-Adjusted Targets for {selectedRegime.name}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    These targets are automatically calibrated based on historical performance 
                    in {selectedRegime.name.toLowerCase()} conditions. Expected volatility: {selectedRegime.volatility}%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: return selectedRegime !== null;
      case 1: return riskBudget.totalPortfolioRisk > 0;
      case 2: return professionalTargets.sharpeRatio > 0;
      case 3: return true; // Always allow final step
      default: return false;
    }
  };

  const canProceed = () => isStepComplete(currentStep);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Professional Strategy Development
        </h2>
        <p className="text-muted-foreground">
          Institutional-grade workflow simplified for individual traders
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep].title}
          </span>
        </div>
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{currentStep + 1}</span>
            </div>
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && renderRegimeAnalysis()}
          {currentStep === 1 && renderRiskBudgeting()}
          {currentStep === 2 && renderProfessionalTargets()}
          {currentStep === 3 && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Parameter Optimization</h3>
              <p className="text-muted-foreground mb-6">
                Advanced optimization features coming soon. Your targets are ready for backtesting.
              </p>
              <Button size="lg" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Professional Backtest
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={!canProceed() || currentStep === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
};