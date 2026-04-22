import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'cp_signup_nudge_dismissed';

export function SignupNudgeBanner() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user, isAuthLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const fromAuth = searchParams.get('from') === 'auth';

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true);
    } catch { /* ignore */ }
  }, []);

  const visible = fromAuth && !user && !isAuthLoading && !dismissed;

  useEffect(() => {
    if (visible) {
      trackEvent('signup_nudge.shown', { source: 'patterns_live_from_auth' });
    }
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
    trackEvent('signup_nudge.dismissed', { source: 'patterns_live_from_auth' });
  };

  const handleCta = (cta: 'signup' | 'pricing') => {
    trackEvent('signup_nudge.cta_click', { cta, source: 'patterns_live_from_auth' });
  };

  return (
    <div className="sticky top-0 z-40 border-b border-primary/30 bg-primary/10 backdrop-blur-sm">
      <div className="mx-auto flex w-full items-center gap-3 px-4 py-2.5 md:px-6 lg:px-8">
        <p className="flex-1 text-sm text-foreground">
          {t(
            'signupNudge.headline',
            'Browse free — sign up to save scans, set alerts, and track your edge.'
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" onClick={() => handleCta('signup')}>
            <Link to="/auth?redirect=/patterns/live">
              {t('signupNudge.signupCta', 'Sign up free')}
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" onClick={() => handleCta('pricing')}>
            <Link to="/pricing">
              {t('signupNudge.pricingCta', 'View pricing')}
            </Link>
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('signupNudge.dismiss', 'Dismiss')}
            className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupNudgeBanner;