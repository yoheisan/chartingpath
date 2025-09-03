import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, BarChart3, Brain, Clock, Layers, TrendingUp } from 'lucide-react';
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
    desc: 'Follow market momentum', 
    icon: TrendingUp,
    characteristics: ['Momentum-based', 'Medium frequency', 'Good for trending markets']
  },
  { 
    id: 'mean-reversion', 
    label: 'Mean Reversion', 
    desc: 'Buy low, sell high', 
    icon: BarChart3,
    characteristics: ['Counter-trend', 'Higher frequency', 'Good for ranging markets']
  },
  { 
    id: 'breakout', 
    label: 'Breakout Trading', 
    desc: 'Trade significant moves', 
    icon: Zap,
    characteristics: ['Volatility-based', 'Medium frequency', 'Good for news events']
  },
  { 
    id: 'scalping', 
    label: 'Scalping', 
    desc: 'Quick small profits', 
    icon: Clock,
    characteristics: ['High frequency', 'Small targets', 'Requires focus']
  },
  { 
    id: 'multi-strategy', 
    label: 'Multi-Strategy', 
    desc: 'Combine approaches', 
    icon: Layers,
    characteristics: ['Diversified', 'Adaptive', 'Complex management']
  },
];

const frequencies = [
  { id: 'high', label: 'High Frequency', desc: '10+ trades/day', icon: Zap },
  { id: 'medium', label: 'Medium Frequency', desc: '2-10 trades/day', icon: BarChart3 },
  { id: 'low', label: 'Low Frequency', desc: '1-5 trades/week', icon: Clock },
  { id: 'position', label: 'Position Trading', desc: 'Long-term holds', icon: TrendingUp },
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
    frequency: '',
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
  const isComplete = currentAnswers.approach && currentAnswers.frequency && currentAnswers.complexity;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            What's Your Trading Approach?
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
            <Clock className="w-5 h-5" />
            Trading Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {frequencies.map((freq) => {
              const Icon = freq.icon;
              return (
                <Button
                  key={freq.id}
                  variant={currentAnswers.frequency === freq.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center text-center"
                  onClick={() => handleAnswerChange('frequency', freq.id)}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <span className="font-medium">{freq.label}</span>
                  <span className="text-xs text-muted-foreground">{freq.desc}</span>
                </Button>
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
              {approaches.find(a => a.id === currentAnswers.approach)?.label} approach with{' '}
              {frequencies.find(f => f.id === currentAnswers.frequency)?.label.toLowerCase()} trading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};