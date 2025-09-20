import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PineScriptEngine } from './PineScriptEngine';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { Settings, TrendingUp, Activity, Target } from 'lucide-react';

interface AdvancedParametersStepProps {
  answers: GuidedStrategyAnswers;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
}

export const AdvancedParametersStep: React.FC<AdvancedParametersStepProps> = ({
  answers,
  onAnswersChange,
}) => {
  const approach = answers.style?.approach || 'trend-following';
  const strategyParams = PineScriptEngine.getStrategyParameters({ answers });
  
  const currentParams = answers.parameters || {};

  const updateParameter = (paramName: string, value: number) => {
    const newParams = {
      ...currentParams,
      [paramName]: value
    };
    onAnswersChange('parameters' as keyof GuidedStrategyAnswers, newParams);
  };

  const renderParameterControl = (paramName: string, config: any, category: string) => {
    const currentValue = currentParams[paramName] ?? config.default;
    
    return (
      <div key={paramName} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => updateParameter(paramName, parseFloat(e.target.value) || config.default)}
              className="w-20 h-8 text-sm"
              min={config.min}
              max={config.max}
              step={config.step}
            />
            <Badge variant="outline" className="text-xs">
              {config.min}-{config.max}
            </Badge>
          </div>
        </div>
        
        {config.min !== undefined && config.max !== undefined && (
          <Slider
            value={[currentValue]}
            onValueChange={(values) => updateParameter(paramName, values[0])}
            min={config.min}
            max={config.max}
            step={config.step || 0.1}
            className="w-full"
          />
        )}
        
        <p className="text-xs text-muted-foreground">
          Default: {config.default} | Current: {currentValue}
        </p>
      </div>
    );
  };

  const getParametersByCategory = () => {
    const categories = {
      'Risk Management': ['risk_r', 'tp_rr', 'max_trades_day'],
      'Session Settings': ['trade_start', 'trade_end', 'use_long', 'use_short'],
      'Technical Indicators': []
    };

    // Add approach-specific parameters
    switch (approach) {
      case 'trend-following':
        categories['Technical Indicators'] = ['fast_len', 'slow_len', 'rsi_len', 'rsi_buy', 'rsi_sell', 'atr_len', 'atr_mult'];
        break;
      case 'mean-reversion':
        categories['Technical Indicators'] = ['bb_len', 'bb_dev', 'rsi_len', 'rsi_buy', 'rsi_sell', 'atr_len', 'atr_mult'];
        break;
      case 'breakout':
        categories['Technical Indicators'] = ['bb_len', 'bb_dev', 'vol_mult', 'atr_len', 'atr_mult', 'lookback'];
        break;
      case 'arbitrage':
        categories['Technical Indicators'] = ['corr_len', 'zscore_len', 'zscore_entry', 'zscore_exit', 'atr_len', 'atr_mult'];
        break;
    }

    return categories;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Risk Management': return <Target className="w-4 h-4" />;
      case 'Session Settings': return <Settings className="w-4 h-4" />;
      case 'Technical Indicators': return <Activity className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const categories = getParametersByCategory();

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Parameters
            <Badge variant="secondary" className="ml-2">
              {approach.replace('-', ' ').toUpperCase()}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Fine-tune your strategy's technical indicators and risk management parameters. 
            These settings will be embedded in your exported Pine Script and MetaTrader code.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {Object.entries(categories).map(([categoryName, paramNames]) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {getCategoryIcon(categoryName)}
                {categoryName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {paramNames.map((paramName) => {
                const config = strategyParams[paramName];
                if (!config) return null;

                // Handle boolean parameters differently
                if (typeof config.default === 'boolean') {
                  return (
                    <div key={paramName} className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentParams[paramName] ?? config.default}
                    onChange={(e) => updateParameter(paramName, e.target.checked ? 1 : 0)}
                    className="rounded border-gray-300"
                  />
                        <Badge variant="outline" className="text-xs">
                          {currentParams[paramName] ?? config.default ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  );
                }

                return renderParameterControl(paramName, config, categoryName);
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold mt-0.5">
              i
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Parameter Guidelines</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Technical Indicators:</strong> Lower values = more sensitive, higher values = smoother</li>
                <li>• <strong>Risk Management:</strong> Risk per trade should typically be 1-3% of account</li>
                <li>• <strong>Session Settings:</strong> Use HHMM format (e.g., 800 for 8:00 AM, 1630 for 4:30 PM)</li>
                <li>• <strong>Take Profit:</strong> Risk-reward ratio (e.g., 2.0 means 2x risk as profit target)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};