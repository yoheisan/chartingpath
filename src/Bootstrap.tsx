import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AuthShell from "./AuthShell";
import { redirectToCanonicalOriginIfNeeded } from "@/utils/canonicalOrigin";

const FullApp = lazy(() => import("./App"));

export default function Bootstrap() {
  const location = useLocation();
  const path = location.pathname;

  // Ensure the entire app runs on a single, canonical preview origin.
  // This prevents “logged in here, logged out there” when users open different preview domains.
  useEffect(() => {
    redirectToCanonicalOriginIfNeeded();
  }, [location.pathname, location.search, location.hash]);

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

