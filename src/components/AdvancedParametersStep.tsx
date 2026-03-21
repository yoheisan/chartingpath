import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { Settings, TrendingUp, Activity, Target, HelpCircle } from 'lucide-react';

/** Pro-reference documentation for each parameter */
const PARAM_DOCS: Record<string, { summary: string; reasoning: string; reference: string }> = {
  risk_r: {
    summary: 'Percentage of account equity risked per trade.',
    reasoning: 'The Kelly Criterion suggests optimal sizing is edge/odds, but practitioners use fractional Kelly (¼–½) to reduce drawdown variance. Institutional desks typically cap single-trade risk at 0.5–2% of NAV. Academic work by Ralph Vince ("The Mathematics of Money Management") demonstrates that risk >3% dramatically increases ruin probability even with positive expectancy.',
    reference: 'Vince, R. (1992). The Mathematics of Money Management; Tharp, V. (2006). Trade Your Way to Financial Freedom.'
  },
  tp_rr: {
    summary: 'Take-profit expressed as a multiple of risk (R:R ratio).',
    reasoning: 'Bulkowski\'s "Encyclopedia of Chart Patterns" (3rd ed.) shows median pattern moves of 1.5–3.0× the pattern height. A minimum 2:1 R:R is standard because it allows profitability at just 34% win rate. Higher ratios (3:1+) suit trend-following systems but reduce fill probability. The optimal ratio depends on your strategy\'s historical win rate — use the backtest results to calibrate.',
    reference: 'Bulkowski, T. (2021). Encyclopedia of Chart Patterns, 3rd Ed.; Elder, A. (1993). Trading for a Living.'
  },
  max_trades_day: {
    summary: 'Maximum number of new entries allowed per session/day.',
    reasoning: 'Trade frequency caps prevent overtrading during high-volatility regimes (e.g., NFP, FOMC). Research by Barber & Odean (2000, "Trading Is Hazardous to Your Wealth") shows that excessive trading erodes returns via commission drag and adverse selection. Institutional algos typically limit to 3–8 trades/day depending on strategy frequency class.',
    reference: 'Barber, B. & Odean, T. (2000). Trading Is Hazardous to Your Wealth. Journal of Finance.'
  },
  trade_start: {
    summary: 'Session start time in HHMM format (server time).',
    reasoning: 'Market microstructure research shows that the first 30–60 minutes of a session exhibit wider spreads, higher volatility, and frequent gap fills. Institutional traders often avoid the open, entering after 09:30–10:00 ET for US equities or the London open (08:00 GMT) for FX. Aligning session windows with your market\'s liquid hours reduces slippage and false signals.',
    reference: 'Hasbrouck, J. (2007). Empirical Market Microstructure; Aldridge, I. (2013). High-Frequency Trading.'
  },
  trade_end: {
    summary: 'Session end time in HHMM format (server time).',
    reasoning: 'Liquidity thins significantly in the final 30–60 minutes before close, increasing fill risk. Many institutional desks enforce a "no new entries" cutoff 30–60 minutes before market close to avoid overnight gap risk. For 24h markets (crypto, FX), this parameter defines your active trading window to match your monitoring capacity.',
    reference: 'Hasbrouck, J. (2007). Empirical Market Microstructure.'
  },
  use_long: {
    summary: 'Enable long (buy) entries.',
    reasoning: 'Directional filtering is critical in trend-following systems. In confirmed downtrends (e.g., price below 200 EMA, ADX trending down), disabling longs reduces whipsaw losses. Bulkowski\'s data shows that bullish pattern failure rates increase 15–25% in bear markets. Conversely, mean-reversion systems may want both directions enabled.',
    reference: 'Bulkowski, T. (2021). Encyclopedia of Chart Patterns, 3rd Ed.'
  },
  use_short: {
    summary: 'Enable short (sell) entries.',
    reasoning: 'Short-selling carries asymmetric risk (unlimited loss potential) and higher costs (borrowing fees, uptick rules). Many retail accounts restrict shorting. Even when available, short entries in bull markets have statistically lower success rates. Disable if trading instruments without short capability (some ETFs, spot crypto on certain exchanges).',
    reference: 'Asness, C. et al. (2004). Short-Selling. Institutional Investor.'
  },
  atr_mult: {
    summary: 'ATR multiplier for dynamic stop-loss placement.',
    reasoning: 'Wilder\'s ATR (Average True Range) measures realized volatility over N periods. A 2.0× multiplier means the stop sits 2 standard-deviations-equivalent from entry, filtering normal noise while catching genuine reversals. Keltner Channels use 1.5×, while Chandelier Exits default to 3.0×. Lower values (1.0–1.5) suit scalping; higher values (2.5–4.0) suit swing/position trading. Institutional quant desks typically use 1.5–2.5× depending on asset volatility regime.',
    reference: 'Wilder, J.W. (1978). New Concepts in Technical Trading Systems; Kaufman, P. (2013). Trading Systems and Methods, 5th Ed.'
  }
};

interface AdvancedParametersStepProps {
  answers: GuidedStrategyAnswers;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
}

export const AdvancedParametersStep: React.FC<AdvancedParametersStepProps> = ({
  answers,
  onAnswersChange,
}) => {
  const getParametersFromIndicators = () => {
    const baseParams = {
      risk_r: { default: 2.0, min: 0.1, max: 10.0, step: 0.1 },
      tp_rr: { default: 2.0, min: 0.5, max: 10.0, step: 0.1 },
      max_trades_day: { default: 5, min: 0, max: 100, step: 1 },
      trade_start: { default: 0, min: 0, max: 2359, step: 1 },
      trade_end: { default: 2359, min: 0, max: 2359, step: 1 },
      use_long: { default: true },
      use_short: { default: true }
    };
    const atrParams = {
      atr_mult: { default: 2.0, min: 0.5, max: 5.0, step: 0.1 }
    };
    return { ...baseParams, ...atrParams };
  };

  const strategyParams = getParametersFromIndicators();
  const currentParams = answers.parameters || {};

  const updateParameter = (paramName: string, value: number) => {
    const newParams = { ...currentParams, [paramName]: value };
    onAnswersChange('parameters' as keyof GuidedStrategyAnswers, newParams);
  };

  const ParamTooltip: React.FC<{ paramName: string }> = ({ paramName }) => {
    const doc = PARAM_DOCS[paramName];
    if (!doc) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-sm space-y-2 p-3">
          <p className="text-xs font-medium">{doc.summary}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{doc.reasoning}</p>
          <p className="text-sm text-muted-foreground/70 italic border-t border-border pt-1.5">{doc.reference}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderParameterControl = (paramName: string, config: any) => {
    const currentValue = currentParams[paramName] ?? config.default;
    return (
      <div key={paramName} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">
              {paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
            <ParamTooltip paramName={paramName} />
          </div>
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

  const categories: Record<string, string[]> = {
    'Risk Management': ['risk_r', 'tp_rr', 'max_trades_day'],
    'Session Settings': ['trade_start', 'trade_end', 'use_long', 'use_short'],
    'Technical Indicators': ['atr_mult']
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Risk Management': return <Target className="w-4 h-4" />;
      case 'Session Settings': return <Settings className="w-4 h-4" />;
      case 'Technical Indicators': return <Activity className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced Parameters
              <Badge variant="secondary" className="ml-2">Professional Builder</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fine-tune your strategy parameters. Hover the <HelpCircle className="w-3 h-3 inline" /> icon on each parameter for institutional-grade documentation and academic references.
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

                  if (typeof config.default === 'boolean') {
                    return (
                      <div key={paramName} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-sm font-medium">
                            {paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                          <ParamTooltip paramName={paramName} />
                        </div>
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

                  return renderParameterControl(paramName, config);
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
    </TooltipProvider>
  );
};
