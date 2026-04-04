import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Zap, FlaskConical, Bell } from 'lucide-react';
import { buildPatternLabUrl } from '@/utils/patternLabUrl';
import { useOutcomeCount } from '@/hooks/useOutcomeCount';

interface PatternStatsCTAProps {
  patternId: string;
  patternName: string;
  instrument?: string;
}

export function PatternStatsCTA({ patternId, patternName, instrument }: PatternStatsCTAProps) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const { formatted: outcomeCount } = useOutcomeCount();

  if (isAuthLoading) return null;

  if (!isAuthenticated) {
    return (
      <section className="relative rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 mb-10 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                {t('patternCTA.exclusiveData', 'Exclusive Data')}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
              {t('patternCTA.anonHeadline', "You're looking at data most traders never see.")}
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t('patternCTA.anonSubheadline', { defaultValue: '{{count}}+ backtested outcomes. Free account to unlock backtesting, alerts, and more.', count: outcomeCount })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-col gap-2.5 shrink-0">
            <Button asChild size="lg" className="gap-2 font-semibold text-sm sm:text-base h-11">
              <Link to={`/auth?mode=signup&context=stats&pattern=${patternId}`}>
                {t('patternCTA.signUpFree', 'Sign Up Free — No Credit Card')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2 text-xs h-8">
              <Link to={`/auth?mode=signup&context=stats&pattern=${patternId}`}>
                {t('auth.continueWithGoogle', 'Continue with Google')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Authenticated user — drive product usage
  const backtestUrl = buildPatternLabUrl({ pattern: patternId, instrument });

  return (
    <section className="rounded-2xl border border-border/40 bg-gradient-to-br from-accent/30 via-card/60 to-transparent p-6 sm:p-8 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              {t('patternCTA.takeAction', 'Take Action')}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
            {t('patternCTA.authHeadline', 'Backtest this exact setup on your own ticker.')}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('patternCTA.authSubheadline', 'Run it in Pattern Lab — see if {{pattern}} works on the instruments you actually trade.', { pattern: patternName })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-col gap-2.5 shrink-0">
          <Button asChild size="lg" className="gap-2 font-semibold text-sm sm:text-base h-11">
            <Link to={backtestUrl}>
              <FlaskConical className="h-4 w-4" />
              {t('patternCTA.backtestNow', 'Backtest {{pattern}} Now', { pattern: patternName })}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs h-8">
            <Link to={`/patterns/live?pattern=${patternId}`}>
              <Bell className="h-3.5 w-3.5" />
              {t('patternCTA.viewLiveSignals', 'View Live Signals')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
