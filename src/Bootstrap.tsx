import { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthShell from "./AuthShell";
import { redirectToCanonicalOriginIfNeeded, getCanonicalAppOrigin } from "@/utils/canonicalOrigin";

const FullApp = lazy(() => import("./App"));

export default function Bootstrap() {
  const location = useLocation();
  const path = location.pathname;
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Ensure the entire app runs on a single, canonical preview origin.
  // This prevents "logged in here, logged out there" when users open different preview domains.
  useEffect(() => {
    // Check if we need to redirect BEFORE attempting it
    const canonical = getCanonicalAppOrigin();
    if (canonical !== window.location.origin) {
      // Show loading state to prevent "Not found" flash
      setIsRedirecting(true);
      redirectToCanonicalOriginIfNeeded();
    }
  }, [location.pathname, location.search, location.hash]);

  // Show loading state while redirecting to canonical origin
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Redirecting…</div>
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
