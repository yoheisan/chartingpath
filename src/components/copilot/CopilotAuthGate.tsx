import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useTranslation } from "react-i18next";

interface CopilotAuthGateProps {
  messagesUsed: number;
  maxMessages: number;
}

export function CopilotAuthGate({ messagesUsed, maxMessages }: CopilotAuthGateProps) {
  const { t } = useTranslation();
  const redirectPath = typeof window !== 'undefined'
    ? encodeURIComponent(window.location.pathname + window.location.search)
    : '/';

  return (
    <div className="p-4 border-t bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex flex-col items-center gap-3 py-2">
         <div className="text-center space-y-2">
          <p className="text-sm font-medium">Ready to run your own plan?</p>
          <p className="text-xs text-muted-foreground">Sign up free to:</p>
          <ul className="text-xs text-muted-foreground text-left space-y-1 mx-auto max-w-[240px]">
            <li>✦ Build your trading plan in plain English</li>
            <li>✦ Paper-test it live — like MT4 backtesting but forward</li>
            <li>✦ Track what works before risking real money</li>
            <li>✦ Go live when you're confident</li>
          </ul>
        </div>

        <Button asChild className="w-full max-w-xs bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
          <Link to={`/auth?redirect=${redirectPath}&mode=register`}>
            Start free — build your plan →
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to={`/auth?redirect=${redirectPath}`} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
