import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, Lock } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useTranslation } from "react-i18next";

interface AuthGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
}

export function AuthGateDialog({ open, onOpenChange, featureLabel }: AuthGateDialogProps) {
  const { t } = useTranslation();
  const redirectPath = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.pathname + window.location.search) 
    : '/';

  const label = featureLabel || t('authGate.thisFeature', 'this feature');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{t('authGate.signInToContinue', 'Sign in to continue')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('authGate.createAccountOrSignIn', 'Create a free account or sign in to access {{feature}}.', { feature: label })}
          </DialogDescription>
        </DialogHeader>
        
        {/* Benefits list */}
        <div className="space-y-2 my-3 text-sm">
          {[
            t('authGate.benefit1', '3 backtests/day'),
            t('authGate.benefit2', 'Live screener access'),
            t('authGate.benefit3', 'Pattern alerts'),
            t('authGate.benefit4', 'Edge Atlas rankings'),
          ].map((b) => (
            <div key={b} className="flex items-center gap-2 text-muted-foreground">
              <span className="text-green-500">✓</span> {b}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {/* Google sign-in - primary CTA */}
          <GoogleSignInButton />

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('authGate.or', 'or')}</span>
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link to={`/auth?redirect=${redirectPath}`} onClick={() => onOpenChange(false)}>
              <LogIn className="h-4 w-4 mr-2" />
              {t('authGate.signIn', 'Sign In')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to={`/auth?redirect=${redirectPath}&mode=register`} onClick={() => onOpenChange(false)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('authGate.createFreeAccount', 'Create Free Account')}
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('authGate.noCreditCard', 'No credit card required · Free forever tier')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
