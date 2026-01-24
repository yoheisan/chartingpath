import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthShell from "./AuthShell";
import { redirectToCanonicalOriginIfNeeded, getCanonicalAppOrigin } from "@/utils/canonicalOrigin";
import { Button } from "@/components/ui/button";

const FullApp = lazy(() => import("./App"));

export default function Bootstrap() {
  const location = useLocation();
  const path = location.pathname;
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showRedirectHelp, setShowRedirectHelp] = useState(false);

  const canonicalTarget = useMemo(() => {
    const canonical = getCanonicalAppOrigin();
    return `${canonical}${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, [location.pathname, location.search, location.hash]);

  // Ensure the entire app runs on a single, canonical preview origin.
  // This prevents "logged in here, logged out there" when users open different preview domains.
  useEffect(() => {
    const canonical = getCanonicalAppOrigin();
    const needsRedirect = canonical !== window.location.origin;
    
    if (!needsRedirect) {
      setIsRedirecting(false);
      setShowRedirectHelp(false);
      return;
    }
    
    // Check if we should skip redirect (auth callbacks)
    const url = new URL(window.location.href);
    const hasAuthCallbackParams =
      url.searchParams.has("code") ||
      url.searchParams.get("type") === "recovery" ||
      url.hash.includes("access_token=") ||
      url.hash.includes("type=recovery");
    
    if (hasAuthCallbackParams) {
      // Don't redirect during auth callbacks, proceed with app
      setIsRedirecting(false);
      setShowRedirectHelp(false);
      return;
    }
    
    // Actually redirecting - set state and redirect
    setIsRedirecting(true);
    setShowRedirectHelp(false);

    // If the browser blocks navigation (extensions, strict settings), don't leave the user stuck forever.
    const helpTimer = window.setTimeout(() => setShowRedirectHelp(true), 2500);
    redirectToCanonicalOriginIfNeeded();

    return () => {
      window.clearTimeout(helpTimer);
    };
  }, [location.pathname, location.search, location.hash]);

  // Show loading state while redirecting to canonical origin
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md px-6 text-center">
          <div className="text-muted-foreground">Redirecting…</div>
          {showRedirectHelp ? (
            <div className="mt-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              <p>
                If this screen doesn’t go away, your browser likely blocked the navigation. Open the canonical
                preview URL directly:
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild>
                  <a href={canonicalTarget}>Open canonical preview</a>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload
                </Button>
              </div>
              <p className="mt-3 text-xs">
                Tip: ad-blockers, privacy extensions, and strict tracking protection can block cross-origin
                redirects in previews.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const isAuthRoute = path.startsWith("/auth") || path.startsWith("/admin/login");

  if (isAuthRoute) {
    return <AuthShell />;
  }

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background text-muted-foreground">Loading…</div>}
    >
      <FullApp />
    </Suspense>
  );
}
