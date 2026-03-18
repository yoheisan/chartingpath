import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Lock, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

interface GuestScreenerOverlayProps {
  totalCount: number;
  visibleCount: number;
}

export function GuestScreenerOverlay({ totalCount, visibleCount }: GuestScreenerOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="relative -mt-48 z-10 pointer-events-none">
      {/* Gradient fade from transparent to card background */}
      <div className="h-24 bg-gradient-to-b from-transparent to-card" />

      {/* CTA card */}
      <div className="bg-card pb-6 flex justify-center pointer-events-auto">
        <div className="text-center px-6 py-6 rounded-xl border border-primary/30 bg-card shadow-2xl max-w-md mx-4">
          <Lock className="h-7 w-7 text-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground mb-1">
            {t('guestScreenerOverlay.seeingSignals', { visible: visibleCount, total: totalCount })}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {t('guestScreenerOverlay.unlockMessage')}
          </p>

          {/* Google Sign-In for 1-click conversion */}
          <div className="mb-3">
            <GoogleSignInButton className="w-full" />
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {t('guestScreenerOverlay.orContinueWith', 'or continue with')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              <Link to="/auth?mode=signup&context=screener">
                {t('guestScreenerOverlay.createFreeAccount')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/auth?mode=login">
                <LogIn className="h-4 w-4" />
                {t('guestScreenerOverlay.signIn')}
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {t('guestScreenerOverlay.noCreditCard')}
          </p>
        </div>
      </div>
    </div>
  );
}
