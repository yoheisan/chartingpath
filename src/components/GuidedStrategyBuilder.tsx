import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { ObjectivesStep } from './guided-strategy/ObjectivesStep';
import { MarketStep } from './guided-strategy/MarketStep';
import { RiskToleranceStep } from './guided-strategy/RiskToleranceStep';
import { RewardStep } from './guided-strategy/RewardStep';
import { StyleStep } from './guided-strategy/StyleStep';
import { ToolsStep } from './guided-strategy/ToolsStep';
import { ConstraintsStep } from './guided-strategy/ConstraintsStep';
import { StrategyProposal } from './guided-strategy/StrategyProposal';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface GuidedStrategyAnswers {
  objectives: {
    primaryGoal: string;
    timeCommitment: string;
  };
  market: {
    timeframes: string[];
  };
  riskTolerance: {
    maxDrawdown: number;
    positionSize: number;
    riskPerTrade: number;
  };
  reward: {
    targetReturn: number;
    winRate: number;
    riskRewardRatio: number;
  };
  style: {
    approach: string;
    frequency: string;
    complexity: string;
  };
  tools: {
    indicators: string[];
    patterns: string[];
    filters: string[];
  };
  constraints: {
    tradingHours: string[];
    marketConditions: string[];
    excludedPeriods: string[];
  };
}

const steps = [
  { id: 'objectives', title: 'Objectives', description: 'Define your trading goals' },
  { id: 'market', title: 'Market', description: 'Choose your markets' },
  { id: 'risk-tolerance', title: 'Risk Tolerance', description: 'Set risk parameters' },
  { id: 'reward', title: 'Reward', description: 'Define profit targets' },
  { id: 'style', title: 'Style', description: 'Trading approach' },
  { id: 'tools', title: 'Tools', description: 'Technical analysis' },
  { id: 'constraints', title: 'Constraints', description: 'Trading rules' },
  { id: 'proposal', title: 'Proposal', description: 'Strategy summary' },
];

interface GuidedStrategyBuilderProps {
  onSaveStrategy?: (strategy: any) => void;
  onBacktest?: (strategy: any) => void;
}

export const GuidedStrategyBuilder: React.FC<GuidedStrategyBuilderProps> = ({
  onSaveStrategy,
  onBacktest
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<GuidedStrategyAnswers>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { hasFeatureAccess, subscriptionPlan } = useUserProfile();

  const updateAnswers = (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => {
    setAnswers(prev => ({
      ...prev,
      [stepKey]: stepAnswers
    }));
    
    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
  };

  const canProceed = () => {
    return completedSteps.has(currentStep);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
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

    switch (currentStep) {
      case 0:
        return <ObjectivesStep {...stepProps} />;
      case 1:
        return <MarketStep {...stepProps} />;
      case 2:
        return <RiskToleranceStep {...stepProps} />;
      case 3:
        return <RewardStep {...stepProps} />;
      case 4:
        return <StyleStep {...stepProps} />;
      case 5:
        return <ToolsStep {...stepProps} />;
      case 6:
        return <ConstraintsStep {...stepProps} />;
      case 7:
        return (
          <StrategyProposal 
            answers={answers as GuidedStrategyAnswers}
            onSaveStrategy={onSaveStrategy}
            onBacktest={onBacktest}
            subscriptionPlan={subscriptionPlan}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg">Guided Strategy Builder</CardTitle>
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
                disabled={!canProceed()}
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