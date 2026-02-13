import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that provides an auth gate for CTA actions.
 * Instead of redirecting, it opens a dialog prompting sign in/register.
 * 
 * Usage:
 *   const { requireAuth, AuthGateDialogComponent } = useAuthGate("Set Alert");
 *   
 *   <Button onClick={() => requireAuth(() => doAction())}>Set Alert</Button>
 *   {AuthGateDialogComponent}
 */
export function useAuthGate(featureLabel?: string) {
  const { user, isAuthLoading } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthLoading) return;
      if (user) {
        action();
      } else {
        setShowDialog(true);
      }
    },
    [user, isAuthLoading]
  );

  return {
    isAuthenticated: !!user,
    isAuthLoading,
    user,
    showAuthDialog: showDialog,
    setShowAuthDialog: setShowDialog,
    requireAuth,
    featureLabel: featureLabel || "this feature",
  };
}
