import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCopilotContextStore } from '@/stores/copilotContextStore';
import type { CopilotContextState } from '@/stores/copilotContextStore';

/**
 * Syncs route changes and time-on-page into the CopilotContextStore.
 * Mount this once at root level (e.g., in Layout or App).
 */
export function useCopilotStoreSync() {
  const location = useLocation();
  const setRoute = useCopilotContextStore(s => s.setRoute);
  const setSymbol = useCopilotContextStore(s => s.setSymbol);
  const setTimeframe = useCopilotContextStore(s => s.setTimeframe);
  const setArticleSlug = useCopilotContextStore(s => s.setArticleSlug);
  const incrementTimeOnPage = useCopilotContextStore(s => s.incrementTimeOnPage);
  const setLastUserAction = useCopilotContextStore(s => s.setLastUserAction);
  const prevPathRef = useRef(location.pathname);

  // Route change → update store
  useEffect(() => {
    const pathname = location.pathname;
    const search = new URLSearchParams(location.search);

    let pageType: CopilotContextState['pageType'] = 'other';
    if (pathname.startsWith('/chart') || pathname.startsWith('/members/chart')) {
      pageType = 'chart';
    } else if (pathname.startsWith('/members/dashboard')) {
      pageType = 'dashboard';
    } else if (pathname.startsWith('/tools/paper-trading')) {
      pageType = 'paper-trading';
    } else if (pathname.startsWith('/patterns/live') || pathname.startsWith('/screener')) {
      pageType = 'screener';
    }

    setRoute(pathname, pageType);

    // Chart-specific params
    if (pageType === 'chart') {
      setSymbol(search.get('symbol') || null);
      setTimeframe(search.get('timeframe') || null);
    } else {
      setSymbol(null);
      setTimeframe(null);
    }

    // Extract article slug for blog/learn pages
    if (pathname.startsWith('/blog/') || pathname.startsWith('/learn/')) {
      const segments = pathname.split('/').filter(Boolean);
      const slug = segments[segments.length - 1] || null;
      setArticleSlug(slug);
    } else {
      setArticleSlug(null);
    }

    prevPathRef.current = pathname;
  }, [location.pathname, location.search, setRoute, setSymbol, setTimeframe]);

  // Time-on-page increment every 30s
  useEffect(() => {
    const timer = setInterval(incrementTimeOnPage, 30_000);
    return () => clearInterval(timer);
  }, [incrementTimeOnPage]);

  // Idle detection — mark idle after 60s of no significant interaction
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setLastUserAction('idle');
      }, 60_000);
    };

    const onScroll = () => {
      setLastUserAction('scrolled');
      resetIdle();
    };

    const onClick = () => {
      resetIdle();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    resetIdle();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onClick);
    };
  }, [setLastUserAction]);
}
