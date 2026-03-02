import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const DISMISS_KEY = 'dashboard_auth_nudge_dismissed';

export function DashboardAuthNudge() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  const redirectPath = encodeURIComponent('/members/dashboard');

  return (
    <div className="relative flex items-center justify-center gap-2 px-4 h-8 bg-muted/30 border-b border-border/30 text-xs shrink-0">
      <LogIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">
        {t('authNudge.signInMessage')}
      </span>
      <GoogleSignInButton size="sm" className="h-6 text-xs px-2" />
      <Button asChild size="sm" variant="secondary" className="h-6 text-xs px-2">
        <Link to={`/auth?redirect=${redirectPath}`}>{t('authNudge.emailSignIn')}</Link>
      </Button>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground/50" />
      </button>
    </div>
  );
}
