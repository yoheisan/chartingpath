import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const DISMISS_KEY = 'dashboard_auth_nudge_dismissed';

export function DashboardAuthNudge() {
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
    <div className="relative flex items-center justify-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm shrink-0 flex-wrap">
      <LogIn className="h-4 w-4 text-primary shrink-0" />
      <span className="text-foreground/80">
        Sign in to save your watchlist, create alerts, and unlock playback.
      </span>
      <GoogleSignInButton size="sm" className="h-7 text-xs px-3" />
      <Button asChild size="sm" variant="default" className="h-7 text-xs px-3">
        <Link to={`/auth?redirect=${redirectPath}`}>Email Sign In</Link>
      </Button>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
