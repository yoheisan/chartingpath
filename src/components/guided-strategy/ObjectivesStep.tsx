import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Clock, HelpCircle } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface ObjectivesStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}



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
    timeCommitment: ''
  };

  const handleAnswerChange = (field: string, value: string) => {
    const newAnswers = {
      ...currentAnswers,
      [field]: value
    };
    onAnswersChange('objectives', newAnswers);
  };

  const isComplete = currentAnswers.timeCommitment;

  return (
    <TooltipProvider>
      <div className="space-y-6">


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Trading Time Commitment
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Your time commitment determines strategy frequency and complexity. 
                    <strong> Minimal</strong> time suits position trading with weekly checks, 
                    <strong> Moderate</strong> allows swing trading with daily monitoring, 
                    <strong> Substantial</strong> enables intraday strategies, and 
                    <strong> Full-time</strong> supports high-frequency scalping approaches.
                  </p>
                </TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  );
};