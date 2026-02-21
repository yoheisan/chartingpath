import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackPageLeave } from '@/lib/analytics';

/**
 * Automatically tracks page views and time-on-page for every route change.
 * Drop this into your Layout component.
 */
export function usePageTracking() {
  const location = useLocation();
  const enteredAt = useRef(Date.now());
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const now = Date.now();

    // Track leave of previous page
    if (prevPath.current && prevPath.current !== location.pathname) {
      trackPageLeave(prevPath.current, now - enteredAt.current);
    }

    // Track view of new page
    const params: Record<string, string> = {};
    new URLSearchParams(location.search).forEach((v, k) => {
      // Exclude auth tokens from analytics
      if (!k.startsWith('__')) params[k] = v;
    });

    trackPageView(location.pathname, Object.keys(params).length > 0 ? params : undefined);

    enteredAt.current = now;
    prevPath.current = location.pathname;
  }, [location.pathname, location.search]);
}
