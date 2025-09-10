import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { MarketStep } from './guided-strategy/MarketStep';
import { RiskToleranceStep } from './guided-strategy/RiskToleranceStep';  
import { RewardStep } from './guided-strategy/RewardStep';
import { StyleStep } from './guided-strategy/StyleStep';
import { StrategyProposal } from './guided-strategy/StrategyProposal';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface GuidedStrategyAnswers {
  market: {
    instrumentCategory?: string;
    instrument?: string;
    timeframes: string[];
  };
  riskTolerance: {
    accountPrinciple: number;
    leverage: number;
    maxDrawdown: number;
    riskPerTrade: number;
  };
  reward: {
    targetReturn: number;
    winRate: number;
    riskRewardRatio: number;
  };
  style: {
    approach: string;
  };
}

const steps = [
  { id: 'market', title: 'Market', description: 'Choose your markets' },
  { id: 'risk-tolerance', title: 'Risk Tolerance', description: 'Set risk parameters' },
  { id: 'reward', title: 'Reward Profile', description: 'Define targets' },
  { id: 'style', title: 'Trading Style', description: 'Pick approach' },
  { id: 'proposal', title: 'Strategy Proposal', description: 'Review & save' }
];

export interface GuidedStrategyBuilderProps {
  onSaveStrategy?: (strategy: any) => void;
  onAnswersChange?: (answers: GuidedStrategyAnswers) => void;
  onBacktest?: (strategy: any) => void;
  initialStrategy?: any;
  onStrategyLoad?: () => void;
}

export const GuidedStrategyBuilder: React.FC<GuidedStrategyBuilderProps> = ({
  onSaveStrategy,
  onAnswersChange,
  onBacktest,
  initialStrategy,
  onStrategyLoad
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<GuidedStrategyAnswers>>(initialStrategy?.answers || {
    market: { instrumentCategory: '', instrument: '', timeframes: [] },
    riskTolerance: { accountPrinciple: 10000, leverage: 1, maxDrawdown: 10, riskPerTrade: 2 },
    reward: { targetReturn: 15, winRate: 65, riskRewardRatio: 2 },
    style: { approach: '' }
  });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { hasFeatureAccess, subscriptionPlan } = useUserProfile();

  // Load initial strategy if provided
  React.useEffect(() => {
    if (initialStrategy) {
      setAnswers(initialStrategy.answers || {});
      // Mark steps as completed based on loaded answers
      const completed = new Set<number>();
      if (initialStrategy.answers?.market) completed.add(0);
      if (initialStrategy.answers?.riskTolerance) completed.add(1);
      if (initialStrategy.answers?.reward) completed.add(2);
      if (initialStrategy.answers?.style) completed.add(3);
      setCompletedSteps(completed);
      onStrategyLoad?.();
    }
  }, [initialStrategy, onStrategyLoad]);

  const updateAnswers = (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => {
    setAnswers(prev => {
      const next = {
        ...prev,
        [stepKey]: stepAnswers
      };
      // Call onAnswersChange for live updates to parent state
      onAnswersChange?.(next as GuidedStrategyAnswers);
      return next;
    });
    
    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
  };

  const isCurrentStepComplete = () => {
    const step = steps[currentStep];
    if (!step) return false;
    
    switch (step.id) {
      case 'market':
        return answers.market?.instrumentCategory && 
               answers.market?.instrument && 
               answers.market?.timeframes && 
               answers.market.timeframes.length > 0;
      case 'risk-tolerance':
        return answers.riskTolerance?.accountPrinciple && answers.riskTolerance?.leverage && answers.riskTolerance?.maxDrawdown && answers.riskTolerance?.riskPerTrade;
      case 'reward':
        return answers.reward?.targetReturn && answers.reward?.winRate && answers.reward?.riskRewardRatio;
      case 'style':
        return !!answers.style?.approach;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && isCurrentStepComplete()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const stepProps = {
      answers: answers,
      onAnswersChange: updateAnswers,
      subscriptionPlan
    };

    switch (steps[currentStep]?.id) {
      case 'market':
        return <MarketStep {...stepProps} />;
      case 'risk-tolerance':
        return <RiskToleranceStep {...stepProps} />;
      case 'reward':
        return <RewardStep {...stepProps} />;
      case 'style':
        return <StyleStep {...stepProps} />;
      case 'proposal':
        return (
          <StrategyProposal 
            answers={answers as GuidedStrategyAnswers}
            onSaveStrategy={onSaveStrategy}
            onBacktest={onBacktest}
            subscriptionPlan={subscriptionPlan}
          />
        );
      default:
        return <div>Step not found</div>;
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg">AI Strategy Builder</CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                completedSteps.has(currentStep) 
                  ? 'bg-primary' 
                  : 'bg-muted border-2 border-primary'
              }`}>
                {completedSteps.has(currentStep) && (
                  <Check className="w-2 h-2 text-primary-foreground m-0.5" />
                )}
              </div>
              <span className="font-medium">{steps[currentStep].title}</span>
            </div>
            <span className="text-muted-foreground">
              {steps[currentStep].description}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      {currentStep < steps.length - 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!isCurrentStepComplete()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};