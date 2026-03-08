import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DISMISSED_KEY = 'guest_nudge_dismissed';

export function GuestSignupNudge() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (isAuthLoading || isAuthenticated || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-card border-t border-border flex items-center justify-between px-4 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
        <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground truncate">
          You're on a guest preview — Create your free account to save results and get alerts.
        </span>
      </div>
      <Button asChild size="sm" className="shrink-0 ml-3 h-7 text-xs">
        <Link to="/auth?mode=signup">Sign Up Free</Link>
      </Button>
    </div>
  );
}
