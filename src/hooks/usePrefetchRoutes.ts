import { useEffect, useRef } from 'react';

/**
 * Prefetch member route chunks once the user is authenticated.
 * Uses requestIdleCallback (or setTimeout fallback) to avoid blocking the main thread.
 */
export function usePrefetchRoutes(isAuthenticated: boolean) {
  const prefetched = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || prefetched.current) return;
    prefetched.current = true;

    const memberRoutes = [
      () => import('@/pages/MemberDashboard'),
      () => import('@/pages/MemberAccount'),
      () => import('@/pages/MemberAlerts'),
      () => import('@/pages/MemberScripts'),
      () => import('@/pages/MemberDownloads'),
    ];

    const schedule = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

    // Stagger imports to avoid network contention
    memberRoutes.forEach((importFn, i) => {
      schedule(() => {
        importFn().catch(() => {
          // Silently fail — these are best-effort prefetches
        });
      });
    });
  }, [isAuthenticated]);
}
