import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { MarketStep } from './guided-strategy/MarketStep';
import { RiskToleranceStep } from './guided-strategy/RiskToleranceStep';  
import { StyleStep } from './guided-strategy/StyleStep';
import { StrategyProposal } from './guided-strategy/StrategyProposal';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface GuidedStrategyAnswers {
  market?: {
    instrumentCategory?: string;
    instrument: string;
    timeframes: string[];
    tradingHours: string;
  };
  risk?: {
    tolerance: string;
    maxDrawdown: number;
    riskPerTrade: number;
    leverage: number;
  };
  style?: {
    approach: string;
    timeHorizon: string;
    complexity: string;
  };
}

const steps = [
  { id: 'market', title: 'Market Selection', description: 'Choose your trading market' },
  { id: 'risk', title: 'Risk Management', description: 'Set risk parameters' },
  { id: 'style', title: 'Trading Style', description: 'Define your approach' },
];

export interface GuidedStrategyBuilderProps {
  onSaveStrategy?: (strategy: any) => void;
  onAnswersChange?: (answers: GuidedStrategyAnswers) => void;
  onBacktest?: () => void;
  initialStrategy?: any;
  onStrategyLoad?: () => void;
  isBacktesting?: boolean;
}

export const GuidedStrategyBuilder: React.FC<GuidedStrategyBuilderProps> = ({
  onSaveStrategy,
  onAnswersChange,
  onBacktest,
  initialStrategy,
  onStrategyLoad,
  isBacktesting = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<GuidedStrategyAnswers>({
    market: { 
      instrumentCategory: 'forex',
      instrument: 'EUR/USD', 
      timeframes: ['1h'], 
      tradingHours: 'london-ny' 
    },
    risk: { tolerance: 'moderate', maxDrawdown: 10, riskPerTrade: 2, leverage: 10 },
    style: { approach: 'trend-following', timeHorizon: 'intraday', complexity: 'intermediate' },
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
      if (initialStrategy.answers?.risk) completed.add(1);
      if (initialStrategy.answers?.style) completed.add(2);
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

  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 0: // market
        return !!answers.market?.instrument && !!answers.market?.timeframes?.length && !!answers.market?.tradingHours;
      case 1: // risk
        return !!answers.risk?.tolerance && !!answers.risk?.maxDrawdown !== undefined && !!answers.risk?.riskPerTrade !== undefined && !!answers.risk?.leverage;
      case 2: // style
        return !!answers.style?.approach && !!answers.style?.timeHorizon && !!answers.style?.complexity;
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
      answers,
      onAnswersChange: updateAnswers,
      subscriptionPlan: 'premium'
    };

    switch (currentStep) {
      case 0:
        return <MarketStep {...stepProps} />;
      case 1:
        return <RiskToleranceStep {...stepProps} />;
      case 2:
        return <StyleStep {...stepProps} />;
      case 3:
        return <StrategyProposal {...stepProps} onSaveStrategy={onSaveStrategy} onBacktest={onBacktest} />;
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
            <CardTitle className="text-lg">AI Strategy Builder</CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
        <div className="flex items-center justify-center space-x-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {currentStep < steps.length ? (
          <div className="text-center mt-4">
            <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
          </div>
        ) : (
          <div className="text-center mt-4">
            <h2 className="text-xl font-semibold">Strategy Configuration</h2>
            <p className="text-muted-foreground">Review and generate your strategy</p>
          </div>
        )}
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px] pb-20">
        {renderStep()}
      </div>

      {/* Sticky Navigation at Bottom */}
      {currentStep < steps.length && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-between items-center">
              {currentStep < steps.length ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  
                  {currentStep < steps.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!isCurrentStepComplete()}
                      className="flex items-center gap-2"
                      size="default"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!isCurrentStepComplete()}
                      className="flex items-center gap-2"
                      size="default"
                    >
                      Generate Strategy
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="w-full text-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Settings
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};