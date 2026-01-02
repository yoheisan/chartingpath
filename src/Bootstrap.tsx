import { Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import AuthShell from "./AuthShell";

const FullApp = lazy(() => import("./App"));

export default function Bootstrap() {
  const location = useLocation();
  const path = location.pathname;

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
