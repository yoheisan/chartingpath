import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, Lock } from "lucide-react";

interface AuthGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
}

export function AuthGateDialog({ open, onOpenChange, featureLabel = "this feature" }: AuthGateDialogProps) {
  const redirectPath = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.pathname + window.location.search) 
    : '/';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Sign in to continue</DialogTitle>
          <DialogDescription className="text-center">
            Create a free account or sign in to access {featureLabel}.
          </DialogDescription>
        </DialogHeader>
        
        {/* Benefits list */}
        <div className="space-y-2 my-3 text-sm">
          {["3 backtests/day", "Live screener access", "Pattern alerts", "Edge Atlas rankings"].map((b) => (
            <div key={b} className="flex items-center gap-2 text-muted-foreground">
              <span className="text-green-500">✓</span> {b}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link to={`/auth?redirect=${redirectPath}`} onClick={() => onOpenChange(false)}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to={`/auth?redirect=${redirectPath}&mode=register`} onClick={() => onOpenChange(false)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Free Account
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          No credit card required · Free forever tier
        </p>
      </DialogContent>
    </Dialog>
  );
}
