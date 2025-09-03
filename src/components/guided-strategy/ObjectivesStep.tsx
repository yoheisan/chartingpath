import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, TrendingUp, User } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface ObjectivesStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const primaryGoals = [
  { id: 'income', label: 'Generate Income', desc: 'Consistent regular profits', icon: TrendingUp },
  { id: 'growth', label: 'Capital Growth', desc: 'Long-term wealth building', icon: Target },
  { id: 'learning', label: 'Learn & Practice', desc: 'Educational focus', icon: User },
  { id: 'diversification', label: 'Portfolio Diversification', desc: 'Risk spreading', icon: Target },
];

const experienceLevels = [
  { id: 'beginner', label: 'Beginner', desc: 'New to trading' },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years experience' },
  { id: 'advanced', label: 'Advanced', desc: '3+ years experience' },
  { id: 'expert', label: 'Expert', desc: 'Professional level' },
];

const timeCommitments = [
  { id: 'minimal', label: 'Minimal', desc: '< 1 hour/day' },
  { id: 'moderate', label: 'Moderate', desc: '1-3 hours/day' },
  { id: 'substantial', label: 'Substantial', desc: '3-6 hours/day' },
  { id: 'fulltime', label: 'Full-time', desc: '6+ hours/day' },
];

export const ObjectivesStep: React.FC<ObjectivesStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.objectives || {
    primaryGoal: '',
    tradingExperience: '',
    timeCommitment: ''
  };

  const handleAnswerChange = (field: string, value: string) => {
    const newAnswers = {
      ...currentAnswers,
      [field]: value
    };
    onAnswersChange('objectives', newAnswers);
  };

  const isComplete = currentAnswers.primaryGoal && currentAnswers.tradingExperience && currentAnswers.timeCommitment;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            What's Your Primary Trading Goal?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryGoals.map((goal) => {
              const Icon = goal.icon;
              return (
                <Button
                  key={goal.id}
                  variant={currentAnswers.primaryGoal === goal.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start text-left"
                  onClick={() => handleAnswerChange('primaryGoal', goal.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{goal.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{goal.desc}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            What's Your Trading Experience?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {experienceLevels.map((level) => (
              <Button
                key={level.id}
                variant={currentAnswers.tradingExperience === level.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center text-center"
                onClick={() => handleAnswerChange('tradingExperience', level.id)}
              >
                <span className="font-medium mb-1">{level.label}</span>
                <span className="text-xs text-muted-foreground">{level.desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            How Much Time Can You Dedicate?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeCommitments.map((time) => (
              <Button
                key={time.id}
                variant={currentAnswers.timeCommitment === time.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center text-center"
                onClick={() => handleAnswerChange('timeCommitment', time.id)}
              >
                <span className="font-medium mb-1">{time.label}</span>
                <span className="text-xs text-muted-foreground">{time.desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-4 h-4" />
              <span className="font-medium">Step Complete!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your objectives have been recorded. Click Next to continue.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};