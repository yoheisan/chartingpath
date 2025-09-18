import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Target, Award, HelpCircle } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';
import { RewardAnalysisValidator } from '../RewardAnalysisValidator';

interface RewardStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

export const RewardStep: React.FC<RewardStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.reward || {
    targetReturn: 20,
    winRate: 60,
    riskRewardRatio: 2
  };

  const handleAnswerChange = (field: string, value: number[]) => {
    const newAnswers = {
      ...currentAnswers,
      [field]: value[0]
    };
    onAnswersChange('reward', newAnswers);
  };

  const getReturnCategory = (returnRate: number) => {
    if (returnRate <= 15) return { category: 'Conservative', color: 'text-green-600' };
    if (returnRate <= 30) return { category: 'Moderate', color: 'text-blue-600' };
    if (returnRate <= 50) return { category: 'Aggressive', color: 'text-orange-600' };
    return { category: 'Very Aggressive', color: 'text-red-600' };
  };

  const getWinRateCategory = (winRate: number) => {
    if (winRate >= 70) return { category: 'High Accuracy', color: 'text-green-600' };
    if (winRate >= 55) return { category: 'Good Accuracy', color: 'text-blue-600' };
    if (winRate >= 45) return { category: 'Moderate Accuracy', color: 'text-yellow-600' };
    return { category: 'Low Accuracy', color: 'text-red-600' };
  };

  const getRRCategory = (rr: number) => {
    if (rr >= 3) return { category: 'Excellent', color: 'text-green-600' };
    if (rr >= 2) return { category: 'Good', color: 'text-blue-600' };
    if (rr >= 1.5) return { category: 'Fair', color: 'text-yellow-600' };
    return { category: 'Poor', color: 'text-red-600' };
  };

  const calculateProfitFactor = () => {
    const winRate = currentAnswers.winRate / 100;
    const riskReward = currentAnswers.riskRewardRatio;
    
    // Profit Factor = (Win Rate × Avg Win) / (Loss Rate × Avg Loss)
    // Assuming Avg Loss = 1, Avg Win = Risk-Reward Ratio
    return (winRate * riskReward) / ((1 - winRate) * 1);
  };

  const returnCategory = getReturnCategory(currentAnswers.targetReturn);
  const winRateCategory = getWinRateCategory(currentAnswers.winRate);
  const rrCategory = getRRCategory(currentAnswers.riskRewardRatio);

  const isComplete = true; // All have default values

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Reward Expectations
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Reward targets shape your strategy's aggressiveness and position sizing. <strong>Higher returns</strong> require larger risks and more volatile approaches. 
                    <strong>Win rate</strong> and <strong>risk-reward ratio</strong> must balance: high win rates typically mean smaller average profits per trade.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-8">
          {/* Target Return */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Annual Target Return</Label>
              <span className={`font-medium ${returnCategory.color}`}>
                {currentAnswers.targetReturn}% - {returnCategory.category}
              </span>
            </div>
            <Slider
              value={[currentAnswers.targetReturn]}
              onValueChange={(value) => handleAnswerChange('targetReturn', value)}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Your desired annual return percentage. Higher targets require higher risk.
            </p>
          </div>

          {/* Win Rate */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Target Win Rate</Label>
              <span className={`font-medium ${winRateCategory.color}`}>
                {currentAnswers.winRate}% - {winRateCategory.category}
              </span>
            </div>
            <Slider
              value={[currentAnswers.winRate]}
              onValueChange={(value) => handleAnswerChange('winRate', value)}
              max={85}
              min={30}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Percentage of trades you expect to be profitable. Higher win rates often mean smaller average wins.
            </p>
          </div>

          {/* Risk-Reward Ratio */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Risk-Reward Ratio</Label>
              <span className={`font-medium ${rrCategory.color}`}>
                1:{currentAnswers.riskRewardRatio} - {rrCategory.category}
              </span>
            </div>
            <Slider
              value={[currentAnswers.riskRewardRatio]}
              onValueChange={(value) => handleAnswerChange('riskRewardRatio', value)}
              max={5}
              min={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How much profit you target for each dollar of risk. Higher ratios allow for lower win rates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reward Analysis */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Reward Profile Analysis
              </h4>
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex justify-between">
                  <span>Expected Annual Return:</span>
                  <span className="font-medium">{currentAnswers.targetReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Win Rate:</span>
                  <span className="font-medium">{currentAnswers.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk-Reward Ratio:</span>
                  <span className="font-medium">1:{currentAnswers.riskRewardRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Profit Factor:</span>
                  <span className="font-medium">
                    {((currentAnswers.winRate / 100) * currentAnswers.riskRewardRatio / ((100 - currentAnswers.winRate) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                These targets will help design your strategy's entry and exit rules.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-4 h-4" />
              <span className="font-medium">Reward Targets Set!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Targeting {currentAnswers.targetReturn}% annual return with {currentAnswers.winRate}% win rate.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reward Analysis Validator */}
      {isComplete && (
        <RewardAnalysisValidator 
          targets={{
            expectedReturn: currentAnswers.targetReturn,
            winRate: currentAnswers.winRate,
            riskReward: currentAnswers.riskRewardRatio,
            profitFactor: calculateProfitFactor()
          }}
        />
      )}
    </div>
  </TooltipProvider>
);
};