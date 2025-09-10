import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Shield, DollarSign, HelpCircle } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface RiskToleranceStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

export const RiskToleranceStep: React.FC<RiskToleranceStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.riskTolerance || {
    maxDrawdown: 10,
    riskPerTrade: 2
  };

  const handleAnswerChange = (field: string, value: number[]) => {
    const newAnswers = {
      ...currentAnswers,
      [field]: value[0]
    };
    onAnswersChange('riskTolerance', newAnswers);
  };

  const getRiskLevel = (drawdown: number) => {
    if (drawdown <= 5) return { level: 'Conservative', color: 'text-green-600', icon: Shield };
    if (drawdown <= 15) return { level: 'Moderate', color: 'text-yellow-600', icon: AlertTriangle };
    return { level: 'Aggressive', color: 'text-red-600', icon: AlertTriangle };
  };


  const riskLevel = getRiskLevel(currentAnswers.maxDrawdown);
  const RiskIcon = riskLevel.icon;

  const isComplete = true; // All have default values

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Tolerance Settings
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Risk settings control position sizing and loss limits. <strong>Max Drawdown</strong> sets portfolio stop-loss, 
                    <strong>Position Size</strong> determines capital per trade, <strong>Risk Per Trade</strong> limits single trade exposure. 
                    Conservative settings prioritize capital preservation, aggressive settings target higher returns with more risk.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-8">
          {/* Max Drawdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Maximum Drawdown</Label>
              <div className="flex items-center gap-2">
                <RiskIcon className={`w-4 h-4 ${riskLevel.color}`} />
                <span className={`font-medium ${riskLevel.color}`}>
                  {currentAnswers.maxDrawdown}% - {riskLevel.level}
                </span>
              </div>
            </div>
            <Slider
              value={[currentAnswers.maxDrawdown]}
              onValueChange={(value) => handleAnswerChange('maxDrawdown', value)}
              max={30}
              min={2}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              The maximum portfolio loss you're comfortable with before stopping trading.
            </p>
          </div>

          {/* Risk Per Trade */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Risk Per Trade</Label>
              <span className="font-medium">
                {currentAnswers.riskPerTrade}% of account
              </span>
            </div>
            <Slider
              value={[currentAnswers.riskPerTrade]}
              onValueChange={(value) => handleAnswerChange('riskPerTrade', value)}
              max={5}
              min={0.25}
              step={0.25}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Maximum percentage of your account to risk on a single trade.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Risk Profile Summary
              </h4>
              <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <p>• Max Portfolio Loss: {currentAnswers.maxDrawdown}% ({riskLevel.level})</p>
                <p>• Risk Per Trade: {currentAnswers.riskPerTrade}% of account</p>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                These settings will be used to calculate position sizes and stop losses in your strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Risk Settings Configured!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your risk tolerance has been set to {riskLevel.level.toLowerCase()} level.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
};