import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Shield, DollarSign, HelpCircle, Banknote, TrendingUp } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface RiskToleranceStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const majorCurrencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

export const RiskToleranceStep: React.FC<RiskToleranceStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.risk || {
    maxDrawdown: null, // Start as disabled
    riskPerTrade: null, // Start as disabled
    leverage: 10
  };

  // Track toggle states
  const [useMaxDrawdown, setUseMaxDrawdown] = useState(!!(currentAnswers.maxDrawdown));
  const [useRiskPerTrade, setUseRiskPerTrade] = useState(!!(currentAnswers.riskPerTrade));

  const handleAnswerChange = (field: string, value: number[]) => {
    const newAnswers = {
      ...currentAnswers,
      [field]: value[0]
    };
    onAnswersChange('risk', newAnswers);
  };

  const selectedCurrency = { symbol: '$' };
  
  const formatAmount = (amount: number) => {
    return `${selectedCurrency.symbol}${amount.toLocaleString()}`;
  };

  const getRiskLevel = (drawdown: number | null) => {
    if (!drawdown) return { level: 'No Limit', color: 'text-red-600', icon: AlertTriangle };
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
              Risk Management Settings
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
          {/* Leverage */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">
                Leverage (1:{currentAnswers.leverage || 1})
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    The amount of leverage you want to use. Higher leverage increases both potential profits and losses.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={currentAnswers.leverage || 1}
              onChange={(e) => 
                onAnswersChange('risk', {
                  ...currentAnswers,
                  leverage: parseFloat(e.target.value) || 1
                })
              }
              min={1}
              max={3000}
              step={1}
              className="text-lg font-medium"
            />
            <p className="text-sm text-muted-foreground">
              Enter leverage ratio (1 = no leverage, up to 3000 for maximum leverage)
            </p>
          </div>

          {/* Max Drawdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Maximum Drawdown Protection</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      When enabled, strategy will halt trading if this loss level is reached to protect your capital.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={useMaxDrawdown}
                  onCheckedChange={(checked) => {
                    setUseMaxDrawdown(checked);
                    const newAnswers = {
                      ...currentAnswers,
                      maxDrawdown: checked ? 10 : null
                    };
                    onAnswersChange('risk', newAnswers);
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {useMaxDrawdown ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            {useMaxDrawdown && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Drawdown Limit</span>
                  <div className="flex items-center gap-2">
                    <RiskIcon className={`w-4 h-4 ${riskLevel.color}`} />
                    <span className={`font-medium ${riskLevel.color}`}>
                      {currentAnswers.maxDrawdown}%
                    </span>
                  </div>
                </div>
                <Slider
                  value={[currentAnswers.maxDrawdown || 10]}
                  onValueChange={(value) => handleAnswerChange('maxDrawdown', value)}
                  max={30}
                  min={2}
                  step={1}
                  className="w-full"
                />
              </>
            )}
            
            <p className="text-sm text-muted-foreground">
              {useMaxDrawdown 
                ? 'Strategy will halt when this loss level is reached'
                : 'Strategy will run to completion regardless of losses'
              }
            </p>
          </div>

          {/* Risk Per Trade */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Risk Per Trade Control</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      When enabled, limits each trade to a percentage of your account. When disabled, uses full available capital.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={useRiskPerTrade}
                  onCheckedChange={(checked) => {
                    setUseRiskPerTrade(checked);
                    const newAnswers = {
                      ...currentAnswers,
                      riskPerTrade: checked ? 2 : null
                    };
                    onAnswersChange('risk', newAnswers);
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {useRiskPerTrade ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            {useRiskPerTrade && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk Percentage</span>
                  <span className="font-medium">
                    {currentAnswers.riskPerTrade}% of account
                  </span>
                </div>
                <Slider
                  value={[currentAnswers.riskPerTrade || 2]}
                  onValueChange={(value) => handleAnswerChange('riskPerTrade', value)}
                  max={5}
                  min={0.25}
                  step={0.25}
                  className="w-full"
                />
              </>
            )}
            
            <p className="text-sm text-muted-foreground">
              {useRiskPerTrade 
                ? 'Limits each trade to specified percentage of account'
                : 'Will use full available capital for each trade'
              }
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
                <p>• Leverage: 1:{currentAnswers.leverage || 10}</p>
                <p>• Max Drawdown: {useMaxDrawdown ? `${currentAnswers.maxDrawdown}% - ${riskLevel.level}` : 'No Limit - Strategy runs to completion'}</p>
                <p>• Risk Per Trade: {useRiskPerTrade ? `${currentAnswers.riskPerTrade}% of account` : 'Full Capital Mode'}</p>
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
              Your risk tolerance has been set.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
};