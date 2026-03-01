import { Lock, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface CopilotAuthGateProps {
  messagesUsed: number;
  maxMessages: number;
}

export function CopilotAuthGate({ messagesUsed, maxMessages }: CopilotAuthGateProps) {
  const redirectPath = typeof window !== 'undefined'
    ? encodeURIComponent(window.location.pathname + window.location.search)
    : '/';

  return (
    <div className="p-4 border-t bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">You've used all {maxMessages} free messages</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sign in for unlimited access to the Trading Copilot
          </p>
        </div>
        
        {/* Google sign-in */}
        <div className="w-full max-w-xs">
          <GoogleSignInButton size="sm" className="w-full" />
        </div>

        <div className="relative w-full max-w-xs">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="flex gap-2 w-full max-w-xs">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/auth?redirect=${redirectPath}`}>
              <LogIn className="h-3.5 w-3.5 mr-1.5" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/auth?redirect=${redirectPath}&mode=register`}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Register
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
