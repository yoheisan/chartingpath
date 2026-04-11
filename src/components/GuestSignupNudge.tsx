import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Lock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function GuestSignupNudge() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const redirectParam = encodeURIComponent(location.pathname + location.search);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAuthLoading || isAuthenticated || dismissed) return;
    const timer = setTimeout(() => setVisible(true), 30_000);
    return () => clearTimeout(timer);
  }, [isAuthLoading, isAuthenticated, dismissed]);

  if (isAuthLoading || isAuthenticated || dismissed || !visible) return null;

  return (
    <>
      {/* Desktop: floating card */}
      <Card className="hidden sm:flex fixed bottom-6 right-6 z-50 w-80 p-4 flex-col gap-3 shadow-lg border bg-card">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">
            {t('guestNudge.title', "You're browsing as a guest")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('guestNudge.description', 'Sign up free for alerts, Copilot, and full pattern access')}
        </p>
        <Button asChild size="sm" className="w-full">
          <Link to={`/auth?mode=signup&redirect=${redirectParam}`}>
            {t('auth.signUpFree', 'Sign Up Free')}
          </Link>
        </Button>
      </Card>

      {/* Mobile: bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-10 bg-card border-t border-border flex items-center justify-between px-4 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
          <Lock className="h-4 w-4 text-primary shrink-0" />
          <Link to="/patterns/live" className="text-primary hover:underline truncate font-medium text-sm">
            {t('guestNudge.actionMessage', 'Start here → See live pattern setups')}
          </Link>
        </div>
        <Button asChild size="sm" className="shrink-0 ml-3 h-7 text-xs">
          <Link to={`/auth?mode=signup&redirect=${redirectParam}`}>{t('auth.signUpFree', 'Sign Up Free')}</Link>
        </Button>
      </div>
    </>
  );
}
