import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, BarChart3, Brain, Clock, Layers, TrendingUp, HelpCircle } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface StyleStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const approaches = [
  {
    id: 'trend-following',
    label: 'Trend Following',
    desc: 'Follow market momentum and direction',
    icon: TrendingUp,
    characteristics: ['Momentum-based', 'Directional bias', 'Good for trending markets'],
    explanation: 'Identifies and follows the prevailing market direction, entering positions that align with the trend. Works best in strong directional markets and typically uses moving averages, trend lines, or momentum indicators.'
  },
  {
    id: 'mean-reversion',
    label: 'Mean Reversion', 
    desc: 'Buy low, sell high when prices deviate',
    icon: BarChart3,
    characteristics: ['Counter-trend', 'Statistical edge', 'Good for ranging markets'],
    explanation: 'Assumes prices will return to their average over time. Buys when prices are oversold and sells when overbought. Most effective in sideways or ranging markets with clear support/resistance levels.'
  },
  {
    id: 'breakout',
    label: 'Breakout Trading',
    desc: 'Trade significant price movements',
    icon: Zap,
    characteristics: ['Volatility-based', 'Event-driven', 'Captures large moves'],
    explanation: 'Enters positions when price breaks through key levels like support/resistance. Aims to capture the initial momentum of a new trend or significant price movement, often triggered by news or technical levels.'
  },
  {
    id: 'arbitrage',
    label: 'Arbitrage/Pairs',
    desc: 'Exploit price differences', 
    icon: BarChart3,
    characteristics: ['Market-neutral', 'Low-risk', 'Statistical edge'],
    explanation: 'Takes advantage of price differences between related instruments or markets. Includes pairs trading, statistical arbitrage, and correlation strategies. Typically market-neutral with lower risk but requires sophisticated analysis.'
  },
  {
    id: 'multi-strategy',
    label: 'Multi-Strategy',
    desc: 'Combine multiple approaches',
    icon: Layers,
    characteristics: ['Diversified', 'Adaptive', 'Complex management'],
    explanation: 'Uses multiple trading approaches simultaneously to diversify risk and capture different market opportunities. Requires advanced portfolio management and the ability to adapt strategies based on market conditions.'
  }
];

const complexities = [
  { id: 'simple', label: 'Simple', desc: '1-3 conditions', level: 'Beginner-friendly' },
  { id: 'moderate', label: 'Moderate', desc: '4-6 conditions', level: 'Some experience needed' },
  { id: 'complex', label: 'Complex', desc: '7+ conditions', level: 'Advanced traders' },
  { id: 'adaptive', label: 'Adaptive', desc: 'AI-driven', level: 'Pro/Elite only' },
];

export const StyleStep: React.FC<StyleStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.style || {
    approach: '',
    complexity: ''
  };

  const handleAnswerChange = (field: string, value: string) => {
    const newAnswers = {
      ...currentAnswers,
      [field]: value
    };
    onAnswersChange('style', newAnswers);
  };

  const isAdaptiveAvailable = ['pro', 'pro_plus', 'elite'].includes(subscriptionPlan?.toLowerCase() || '');
  const isComplete = currentAnswers.approach && currentAnswers.complexity;

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            What's Your Trading Approach?
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Your approach defines core entry/exit logic. <strong>Trend Following</strong> rides momentum with moving averages, 
                  <strong>Mean Reversion</strong> buys oversold/sells overbought conditions, <strong>Breakout</strong> trades volatility expansions, 
                  <strong>Arbitrage/Pairs</strong> exploits price differences between related assets, <strong>Multi-Strategy</strong> combines multiple approaches for diversification.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approaches.map((approach) => {
              const Icon = approach.icon;
              const isSelected = currentAnswers.approach === approach.id;
              
              return (
                <Card 
                  key={approach.id} 
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleAnswerChange('approach', approach.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{approach.label}</h4>
                          {isSelected && <Badge variant="default">Selected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{approach.desc}</p>
                        <div className="flex flex-wrap gap-1">
                          {approach.characteristics.map((char, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Strategy Complexity
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Complexity affects number of conditions and decision logic. <strong>Simple</strong> uses 1-3 basic indicators for clear signals, 
                  <strong>Moderate</strong> combines 4-6 indicators with basic filters, <strong>Complex</strong> uses 7+ indicators with advanced logic, 
                  <strong>Adaptive</strong> employs AI-driven dynamic parameter adjustment.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {complexities.map((complexity) => {
              const isDisabled = complexity.id === 'adaptive' && !isAdaptiveAvailable;
              
              return (
                <Button
                  key={complexity.id}
                  variant={currentAnswers.complexity === complexity.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center text-center"
                  onClick={() => !isDisabled && handleAnswerChange('complexity', complexity.id)}
                  disabled={isDisabled}
                >
                  <span className="font-medium">{complexity.label}</span>
                  <span className="text-xs text-muted-foreground mb-1">{complexity.desc}</span>
                  <Badge 
                    variant={isDisabled ? "secondary" : "outline"} 
                    className="text-xs"
                  >
                    {complexity.level}
                  </Badge>
                  {isDisabled && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Upgrade Required
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Brain className="w-4 h-4" />
              <span className="font-medium">Trading Style Defined!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {approaches.find(a => a.id === currentAnswers.approach)?.label} strategy with{' '}
              {complexities.find(c => c.id === currentAnswers.complexity)?.label.toLowerCase()} complexity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
};