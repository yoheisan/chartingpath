import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCopilotContextStore } from '@/stores/copilotContextStore';
import type { CopilotContextState } from '@/stores/copilotContextStore';

type PageType = CopilotContextState['pageType'];

/**
 * Declarative route-to-pageType mapping.
 * Order matters — first match wins, so more specific prefixes go first.
 */
const ROUTE_MAP: [string, PageType][] = [
  // Core trading pages
  ['/members/chart', 'chart'],
  ['/chart', 'chart'],
  ['/members/dashboard', 'dashboard'],
  ['/tools/paper-trading', 'paper-trading'],
  ['/patterns/live', 'screener'],
  ['/screener', 'screener'],

  // Tools & analysis
  ['/tools/agent-scoring', 'agent-scoring'],
  ['/tools/calculator', 'calculator'],
  ['/calculators', 'calculator'],
  ['/projects/pattern-lab', 'pattern-lab'],
  ['/projects/runs', 'backtest-results'],
  ['/projects/pricing', 'pricing'],

  // Alerts & scripts
  ['/alerts', 'alerts'],
  ['/members/scripts', 'scripts'],
  ['/scripts', 'scripts'],

  // Content & learning
  ['/blog/', 'blog-article'],  // /blog/:slug → article
  ['/blog', 'learn'],          // /blog index
  ['/learn/', 'blog-article'], // legacy learn article paths
  ['/learn', 'learn'],         // /learn index

  // Community & support
  ['/community', 'community'],
  ['/faq', 'faq'],
  ['/support', 'support'],
  ['/edge-atlas', 'edge-atlas'],
  ['/chart-patterns/library', 'pattern-library'],

  // Account & settings
  ['/settings', 'settings'],
  ['/account', 'settings'],
  ['/members', 'dashboard'],

  // Legal
  ['/terms', 'terms'],
  ['/privacy', 'privacy'],

  // Copilot
  ['/copilot', 'copilot'],

  // Market
  ['/market-report', 'market-report'],
  ['/quiz', 'quiz'],
  ['/portfolio', 'portfolio'],

  // Pricing (catch /pricing redirect too)
  ['/pricing', 'pricing'],
];

function resolvePageType(pathname: string): PageType {
  for (const [prefix, type] of ROUTE_MAP) {
    if (pathname.startsWith(prefix)) return type;
  }
  return 'other';
}

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
    const pageType = resolvePageType(pathname);

    setRoute(pathname, pageType);

    // Chart-specific params
    if (pageType === 'chart') {
      setSymbol(search.get('symbol') || null);
      setTimeframe(search.get('timeframe') || null);
    } else {
      setSymbol(null);
      setTimeframe(null);
    }

    // Extract article slug for blog/learn article pages
    if (pageType === 'blog-article') {
      const segments = pathname.split('/').filter(Boolean);
      const slug = segments[segments.length - 1] || null;
      setArticleSlug(slug);
    } else {
      setArticleSlug(null);
    }

    prevPathRef.current = pathname;
  }, [location.pathname, location.search, setRoute, setSymbol, setTimeframe, setArticleSlug]);

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
