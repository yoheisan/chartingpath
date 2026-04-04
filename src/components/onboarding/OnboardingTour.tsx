import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OnboardingStep } from './OnboardingStep';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useAuth } from '@/contexts/AuthContext';
import { useOutcomeCount } from '@/hooks/useOutcomeCount';
import { Sparkles, Radar, FlaskConical, LayoutDashboard, Trophy } from 'lucide-react';

const STEPS = [
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    titleKey: 'onboarding.welcomeTitle',
    descKey: 'onboarding.welcomeDesc',
    titleFallback: 'Welcome to ChartingPath',
    descFallback: 'ChartingPath validates chart patterns against {{count}}+ historical outcomes so you can trade with real statistical edges — not guesswork.',
  },
  {
    icon: <Radar className="h-8 w-8 text-primary" />,
    titleKey: 'onboarding.screenerTitle',
    descKey: 'onboarding.screenerDesc',
    titleFallback: 'Live Pattern Screener',
    descFallback: 'Real-time signals across 1,200+ instruments. Each pattern is graded by quality and backed by historical win rates. Filter by asset class, timeframe, and grade.',
    route: '/patterns/live',
  },
  {
    icon: <FlaskConical className="h-8 w-8 text-primary" />,
    titleKey: 'onboarding.patternLabTitle',
    descKey: 'onboarding.patternLabDesc',
    titleFallback: 'Pattern Lab — Backtest Any Pattern',
    descFallback: 'Pick a pattern, choose a symbol, and see exactly how it performed over years of data. Sharpe ratio, profit factor, equity curve — all calculated instantly.',
    route: '/projects/pattern-lab/new?instrument=AAPL&pattern=double-bottom&timeframe=1d&mode=validate',
  },
  {
    icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    titleKey: 'onboarding.dashboardTitle',
    descKey: 'onboarding.dashboardDesc',
    titleFallback: 'Your Command Center',
    descFallback: 'Charts, watchlist, alerts, and paper trading — all in one screen. Click any signal from the screener to see it on your dashboard instantly.',
    route: '/members/dashboard',
  },
  {
    icon: <Trophy className="h-8 w-8 text-amber-500" />,
    titleKey: 'onboarding.edgeAtlasTitle',
    descKey: 'onboarding.edgeAtlasDesc',
    titleFallback: 'Edge Atlas — Find the Best Edges',
    descFallback: 'Discover which patterns perform best on which timeframes — ranked by annualized return. The data does the work so you trade smarter.',
    route: '/edge-atlas',
  },
];

export function OnboardingTour() {
  const { t } = useTranslation();
  const { formatted: outcomeCount } = useOutcomeCount();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { isCompleted, complete } = useOnboardingState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      complete();
      setOpen(false);
    }
  }, [step, complete]);

  const handleSkip = useCallback(() => {
    complete();
    setOpen(false);
  }, [complete]);

  const handleTryIt = useCallback(() => {
    const route = STEPS[step].route;
    if (route) {
      complete();
      setOpen(false);
      navigate(route);
    }
  }, [step, complete, navigate]);

  // Don't show if: still loading auth, already completed, or not authenticated
  if (isAuthLoading || isCompleted || !isAuthenticated) return null;

  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t(current.titleKey, { defaultValue: current.titleFallback })}
          </DialogTitle>
        </DialogHeader>
        <OnboardingStep
          icon={current.icon}
          title={t(current.titleKey, { defaultValue: current.titleFallback })}
          description={(t as any)(current.descKey, { defaultValue: current.descFallback, count: outcomeCount })}
          stepIndex={step}
          totalSteps={STEPS.length}
          action={
            current.route ? (
              <Button variant="link" size="sm" onClick={handleTryIt} className="text-primary">
                {t('onboarding.tryIt', { defaultValue: 'Try it now →' })}
              </Button>
            ) : undefined
          }
        />
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            {t('onboarding.skip', { defaultValue: 'Skip tour' })}
          </Button>
          <Button size="sm" onClick={handleNext}>
            {step < STEPS.length - 1
              ? t('onboarding.next', { defaultValue: 'Next' })
              : t('onboarding.getStarted', { defaultValue: "Let's go!" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
