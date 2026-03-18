import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';

const MODAL_SHOWN_KEY = 'scroll_signup_modal_shown';
const SCROLL_THRESHOLD = 0.6;
const TIME_THRESHOLD_MS = 30_000;

export function ScrollSignupModal() {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) return;
    if (sessionStorage.getItem(MODAL_SHOWN_KEY)) return;

    const startTime = Date.now();
    let triggered = false;

    const handleScroll = () => {
      if (triggered) return;
      const scrollPct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      const timeElapsed = Date.now() - startTime;

      if (scrollPct >= SCROLL_THRESHOLD && timeElapsed >= TIME_THRESHOLD_MS) {
        triggered = true;
        sessionStorage.setItem(MODAL_SHOWN_KEY, '1');
        trackEvent('scroll_signup_modal.shown', { scroll_pct: Math.round(scrollPct * 100), time_ms: timeElapsed });
        setOpen(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, isAuthLoading]);

  if (isAuthLoading || isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('hero.midPageHeadline', 'See the data behind the pattern')}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          {t('hero.midPageSubtext', 'Free account. No credit card. Real backtest data from day one.')}
        </p>

        <div className="space-y-3">
          <GoogleSignInButton className="w-full" />

          <Button
            className="w-full"
            onClick={() => {
              trackEvent('scroll_signup_modal.cta_click', { button: 'create_account' });
              setOpen(false);
              navigate('/auth?mode=signup');
            }}
          >
            {t('hero.createFreeAccount', 'Create Free Account')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            {t('onboarding.skip', 'Skip')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
