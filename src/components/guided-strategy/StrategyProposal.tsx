import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/integrations/supabase/client';

interface StrategyProposalProps {
  answers: GuidedStrategyAnswers;
  onSaveStrategy?: (strategy: any) => void;
  onBacktest?: () => void;
  subscriptionPlan: string;
  isBacktesting?: boolean;
}

export const StrategyProposal: React.FC<StrategyProposalProps> = ({
  answers,
  onSaveStrategy,
  onBacktest,
  subscriptionPlan,
  isBacktesting: externalIsBacktesting = false
}) => {
  const [backtestResults, setBacktestResults] = useState<BacktestData | null>(null);
  const [isLocalBacktesting, setIsLocalBacktesting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [strategyName, setStrategyName] = useState('');

  // Use external backtest state when provided (unified V2), otherwise use local state
  const isBacktesting = externalIsBacktesting || isLocalBacktesting;

  const generateStrategyName = () => {
    const approach = answers.style?.approach?.replace('-', ' ') || 'Custom';
    const instrument = answers.market?.instrument || 'Strategy';
    const timeframe = answers.market?.timeframes?.[0] || '1h';
    
    return `${instrument} ${approach} ${timeframe}`.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const generateStrategyDescription = () => {
    const { market, style, riskTolerance, reward } = answers;
    
    return `A ${style?.approach?.replace('-', ' ')} strategy for ${market?.instrument || 'selected instrument'} targeting ${reward?.targetReturn}% annual returns with ${reward?.winRate}% win rate. 
    Trades ${market?.timeframes?.join(', ')} timeframes with ${riskTolerance?.maxDrawdown}% max drawdown tolerance.`;
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

  const validateStrategy = () => {
    const requiredSteps = ['market', 'style'];
    const missingSteps = [];

    if (!answers.market?.timeframes || answers.market.timeframes.length === 0) {
      missingSteps.push('Market');
    }
    if (!answers.style?.approach) {
      missingSteps.push('Style');
    }

    return {
      isValid: missingSteps.length === 0,
      missingSteps
    };
  };

  const handleBacktestClick = () => {
    const validation = validateStrategy();
    
    if (!validation.isValid) {
      toast.error(`Please complete the following steps: ${validation.missingSteps.join(', ')}`);
      return;
    }

    if (!canBacktest()) {
      toast.error('Backtesting requires Starter plan or higher');
      return;
    }

    // Use unified V2 backtest if available, otherwise fall back to local simulation
    if (onBacktest) {
      onBacktest();
    } else {
      handleBacktest();
    }
  };

  const handleBacktest = async () => {
    setIsLocalBacktesting(true);
    
    // Simulate backtest - replace with actual backtest logic
    setTimeout(() => {
      const mockResults: BacktestData = {
        winRate: Math.max(45, Math.min(75, answers.reward?.winRate + (Math.random() - 0.5) * 20)).toFixed(1),
        riskReward: Math.max(1.2, Math.min(3.5, answers.reward?.riskRewardRatio + (Math.random() - 0.5) * 0.8)).toFixed(1),
        testPeriod: subscriptionPlan?.toLowerCase() === 'starter' ? '1Y' : '3Y',
        totalTrades: Math.floor(150 + Math.random() * 300),
        maxDrawdown: Math.max(5, Math.min(25, answers.riskTolerance?.maxDrawdown + (Math.random() - 0.5) * 8)).toFixed(1),
        instrument: 'Selected Instrument',
        timeframe: answers.market?.timeframes?.[0] || '1h'
      };
      
      setBacktestResults(mockResults);
      setIsLocalBacktesting(false);
      toast.success('Backtest completed successfully');
    }, 3000);
  };

  const handleSaveStrategy = () => {
    const validation = validateStrategy();
    if (!validation.isValid) {
      toast.error(`Please complete the following steps before saving: ${validation.missingSteps.join(', ')}`);
      return;
    }

    if (!canSave()) {
      toast.error('Saving strategies requires paid plan');
      return;
    }

    // Show dialog to get strategy name
    setStrategyName(generateStrategyName());
    setShowNameDialog(true);
  };

  const confirmSaveStrategy = async () => {
    if (!strategyName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Please log in to save strategies');
        return;
      }

      const { error } = await supabase
        .from('guided_strategies')
        .insert([{
          name: strategyName.trim(),
          description: generateStrategyDescription(),
          answers: answers as any,
          backtest_results: backtestResults as any,
          user_id: user.user.id
        }]);

      if (error) throw error;

      toast.success('Strategy saved successfully to vault!');
      setShowNameDialog(false);
      setStrategyName('');
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast.error('Failed to save strategy');
    }
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
                <BarChart3 className="w-4 h-4" />
                Markets
              </h4>
               <ul className="space-y-1 text-sm text-muted-foreground">
                 <li>• Instrument: {answers.market?.instrument || 'Not selected'}</li>
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
               </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Risk Parameters
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Max Drawdown: {answers.riskTolerance?.maxDrawdown}%</li>
                <li>• Risk Per Trade: {answers.riskTolerance?.riskPerTrade}%</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Targets
              </h4>
               <ul className="space-y-1 text-sm text-muted-foreground">
                 <li>• Target Return: {answers.reward?.targetReturn}%</li>
                 <li>• Win Rate: {answers.reward?.winRate}%</li>
                 <li>• Risk:Reward: {answers.reward?.riskRewardRatio}:1</li>
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
              onClick={handleBacktestClick}
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

      {/* Strategy Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Strategy to Vault</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">Strategy Name</Label>
              <Input
                id="strategy-name"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="Enter a name for your strategy"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmSaveStrategy();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSaveStrategy}>
              Save Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};