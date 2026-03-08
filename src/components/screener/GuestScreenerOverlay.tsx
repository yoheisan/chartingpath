import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GuestScreenerOverlayProps {
  totalCount: number;
  visibleCount: number;
}

export function GuestScreenerOverlay({ totalCount, visibleCount }: GuestScreenerOverlayProps) {
  return (
    <div className="relative">
      {/* Gradient blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background backdrop-blur-[2px] z-10" />
      
      {/* CTA card centered in overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center px-6 py-8 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-sm shadow-2xl max-w-md mx-4">
          <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground mb-2">
            You're viewing {visibleCount} of {totalCount} live signals.
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Create a free account to unlock all results, backtests, and alerts.
          </p>
          <Button asChild size="lg" className="px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Link to="/auth?mode=signup">
              Unlock Free Access
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Spacer to maintain layout */}
      <div className="h-[300px]" />
    </div>
  );
}
