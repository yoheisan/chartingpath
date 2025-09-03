import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Play, 
  Settings, 
  Save, 
  Crown, 
  Lock,
  TrendingUp,
  Target,
  Shield,
  BarChart3,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';
import { PerformanceSnapshot } from '../PerformanceSnapshot';
import { BacktestData } from '../PerformanceSnapshot';
import { toast } from 'sonner';

interface StrategyProposalProps {
  answers: GuidedStrategyAnswers;
  onSaveStrategy?: (strategy: any) => void;
  onBacktest?: (strategy: any) => void;
  subscriptionPlan: string;
}

export const StrategyProposal: React.FC<StrategyProposalProps> = ({
  answers,
  onSaveStrategy,
  onBacktest,
  subscriptionPlan
}) => {
  const [backtestResults, setBacktestResults] = useState<BacktestData | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const generateStrategyName = () => {
    const approach = answers.style?.approach?.replace('-', ' ') || 'Custom';
    const market = answers.market?.assetClass || 'Multi-Asset';
    const timeframe = answers.market?.timeframes?.[0] || '1h';
    
    return `${approach} ${market} ${timeframe}`.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const generateStrategyDescription = () => {
    const { objectives, market, style, riskTolerance, reward } = answers;
    
    return `A ${style?.approach?.replace('-', ' ')} strategy targeting ${reward?.targetReturn}% annual returns with ${reward?.winRate}% win rate. 
    Trades ${market?.assetClass} markets with ${riskTolerance?.maxDrawdown}% max drawdown tolerance. 
    Designed for ${objectives?.tradingExperience} traders seeking ${objectives?.primaryGoal?.replace('_', ' ')}.`;
  };

  const canBacktest = () => {
    const plan = subscriptionPlan?.toLowerCase();
    return ['starter', 'pro', 'pro_plus', 'elite'].includes(plan);
  };

  const canExport = () => {
    const plan = subscriptionPlan?.toLowerCase();
    return ['pro', 'pro_plus', 'elite'].includes(plan);
  };

  const canSave = () => {
    const plan = subscriptionPlan?.toLowerCase();
    return plan !== 'free';
  };

  const handleBacktest = async () => {
    if (!canBacktest()) {
      toast.error('Backtesting requires Starter plan or higher');
      return;
    }

    setIsBacktesting(true);
    
    // Simulate backtest - replace with actual backtest logic
    setTimeout(() => {
      const mockResults: BacktestData = {
        winRate: Math.max(45, Math.min(75, answers.reward?.winRate + (Math.random() - 0.5) * 20)),
        riskReward: Math.max(1.2, Math.min(3.5, answers.reward?.riskRewardRatio + (Math.random() - 0.5) * 0.8)),
        testPeriod: subscriptionPlan?.toLowerCase() === 'starter' ? '1Y' : '3Y',
        totalTrades: Math.floor(150 + Math.random() * 300),
        maxDrawdown: Math.max(5, Math.min(25, answers.riskTolerance?.maxDrawdown + (Math.random() - 0.5) * 8)),
        instrument: answers.market?.instruments?.[0] || 'Multi-Asset',
        timeframe: answers.market?.timeframes?.[0] || '1h'
      };
      
      setBacktestResults(mockResults);
      setIsBacktesting(false);
      toast.success('Backtest completed successfully');
    }, 3000);
  };

  const handleSaveStrategy = () => {
    if (!canSave()) {
      toast.error('Saving strategies requires paid plan');
      return;
    }

    const strategy = {
      name: generateStrategyName(),
      description: generateStrategyDescription(),
      answers,
      backtestResults,
      createdAt: new Date().toISOString(),
      type: 'guided-strategy'
    };

    onSaveStrategy?.(strategy);
    toast.success('Strategy saved to vault');
  };

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Strategy Proposal: {generateStrategyName()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {generateStrategyDescription()}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Target className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-sm font-medium">Target Return</div>
              <div className="text-lg font-bold text-blue-600">{answers.reward?.targetReturn}%</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <div className="text-sm font-medium">Win Rate</div>
              <div className="text-lg font-bold text-green-600">{answers.reward?.winRate}%</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Shield className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <div className="text-sm font-medium">Max Drawdown</div>
              <div className="text-lg font-bold text-orange-600">{answers.riskTolerance?.maxDrawdown}%</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <BarChart3 className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <div className="text-sm font-medium">Risk/Reward</div>
              <div className="text-lg font-bold text-purple-600">1:{answers.reward?.riskRewardRatio}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Details */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Specification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Objectives
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Goal: {answers.objectives?.primaryGoal?.replace('_', ' ')}</li>
                <li>• Experience: {answers.objectives?.tradingExperience}</li>
                <li>• Time: {answers.objectives?.timeCommitment}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Markets
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Asset: {answers.market?.assetClass}</li>
                <li>• Instruments: {answers.market?.instruments?.slice(0, 3).join(', ')}{answers.market?.instruments?.length > 3 ? '...' : ''}</li>
                <li>• Timeframes: {answers.market?.timeframes?.join(', ')}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Style
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Approach: {answers.style?.approach?.replace('-', ' ')}</li>
                <li>• Frequency: {answers.style?.frequency}</li>
                <li>• Complexity: {answers.style?.complexity}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tools & Constraints
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Indicators: {answers.tools?.indicators?.length || 0} selected</li>
                <li>• Patterns: {answers.tools?.patterns?.length || 0} selected</li>
                <li>• Constraints: {(answers.constraints?.tradingHours?.length || 0) + (answers.constraints?.excludedPeriods?.length || 0)} rules</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleBacktest}
              disabled={!canBacktest() || isBacktesting}
              className="flex-1 min-w-[200px]"
              size="lg"
            >
              {isBacktesting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                  {!canBacktest() && <Lock className="w-3 w-3 ml-1" />}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveStrategy}
              disabled={!canSave()}
              className="flex-1 min-w-[200px]"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save to Vault
              {!canSave() && <Lock className="w-3 w-3 ml-1" />}
            </Button>
            
            <Button
              variant="outline"
              disabled={!canExport()}
              className="flex-1 min-w-[200px]"
              size="lg"
            >
              <Settings className="w-4 h-4 mr-2" />
              Export Strategy
              {!canExport() && <Lock className="w-3 w-3 ml-1" />}
            </Button>
          </div>
          
          {/* Tier Limitations */}
          {subscriptionPlan?.toLowerCase() === 'free' && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Free Plan Limitations</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Upgrade to access backtesting, strategy saving, and export features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backtest Results */}
      {backtestResults && (
        <PerformanceSnapshot 
          backtestData={backtestResults}
          showFullDisclaimer={true}
        />
      )}

      {/* Compliance Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-2">Important Trading Disclaimer</p>
              <p>
                This strategy proposal is for educational purposes only and does not constitute financial advice. 
                Past performance does not guarantee future results. All trading involves substantial risk of loss. 
                Please test thoroughly with paper trading before risking real capital.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};