/**
 * Auto-generated scannable routes derived from App.tsx router configuration.
 * 
 * This is the single source of truth for routes the string extractor should crawl.
 * When adding new pages to App.tsx, add them here too (or they'll be missed by the scanner).
 * 
 * Routes are categorised so the scanner can prioritise public pages (no auth needed)
 * and optionally include auth-gated pages when the operator is logged in.
 */

export interface ScanRoute {
  path: string;
  /** If true the route requires authentication to render real content */
  authRequired: boolean;
  /** If true the route requires admin role */
  adminOnly: boolean;
  /** Brief label for progress UI */
  label: string;
}

export const APP_SCAN_ROUTES: ScanRoute[] = [
  // ── Public pages ────────────────────────────────────────
  { path: '/', authRequired: false, adminOnly: false, label: 'Home' },
  { path: '/about', authRequired: false, adminOnly: false, label: 'About' },
  { path: '/tools/pip-calculator', authRequired: false, adminOnly: false, label: 'Pip Calculator' },
  { path: '/tools/risk-calculator', authRequired: false, adminOnly: false, label: 'Risk Calculator' },
  { path: '/tools/market-breadth', authRequired: false, adminOnly: false, label: 'Market Breadth' },
  { path: '/tools/economic-calendar', authRequired: false, adminOnly: false, label: 'Economic Calendar' },
  { path: '/tools/agent-scoring', authRequired: false, adminOnly: false, label: 'Agent Scoring' },
  { path: '/chart-patterns/generator', authRequired: false, adminOnly: false, label: 'Pattern Generator' },
  { path: '/chart-patterns/library', authRequired: false, adminOnly: false, label: 'Pattern Library' },
  { path: '/patterns/live', authRequired: false, adminOnly: false, label: 'Live Patterns' },
  { path: '/chart-patterns/strategies', authRequired: false, adminOnly: false, label: 'Trading Strategies' },
  { path: '/chart-patterns/quiz', authRequired: false, adminOnly: false, label: 'Pattern Quiz' },
  { path: '/quiz/pattern-identification', authRequired: false, adminOnly: false, label: 'Pattern ID Quiz' },
  { path: '/quiz/trading-knowledge', authRequired: false, adminOnly: false, label: 'Trading Knowledge Quiz' },
  { path: '/quiz/stock-market', authRequired: false, adminOnly: false, label: 'Stock Market Quiz' },
  { path: '/quiz/forex', authRequired: false, adminOnly: false, label: 'Forex Quiz' },
  { path: '/quiz/crypto', authRequired: false, adminOnly: false, label: 'Crypto Quiz' },
  { path: '/quiz/commodities', authRequired: false, adminOnly: false, label: 'Commodities Quiz' },
  { path: '/learn', authRequired: false, adminOnly: false, label: 'Learn / Blog' },
  { path: '/community', authRequired: false, adminOnly: false, label: 'Community' },
  { path: '/projects/pricing', authRequired: false, adminOnly: false, label: 'Projects Pricing' },
  { path: '/projects/pattern-lab/new', authRequired: false, adminOnly: false, label: 'Pattern Lab' },
  { path: '/projects/pattern-lab/audit', authRequired: false, adminOnly: false, label: 'Pattern Audit' },
  { path: '/faq', authRequired: false, adminOnly: false, label: 'FAQ' },
  { path: '/support', authRequired: false, adminOnly: false, label: 'Support' },
  { path: '/terms', authRequired: false, adminOnly: false, label: 'Terms' },
  { path: '/privacy', authRequired: false, adminOnly: false, label: 'Privacy' },

  // ── Auth-gated member pages ─────────────────────────────
  { path: '/members/dashboard', authRequired: true, adminOnly: false, label: 'Member Dashboard' },
  { path: '/members/scripts', authRequired: true, adminOnly: false, label: 'Member Scripts' },
  { path: '/members/downloads', authRequired: true, adminOnly: false, label: 'Member Downloads' },
  { path: '/members/alerts', authRequired: true, adminOnly: false, label: 'Member Alerts' },
  { path: '/members/account', authRequired: true, adminOnly: false, label: 'Member Account' },
  { path: '/elite', authRequired: true, adminOnly: false, label: 'Elite Dashboard' },

  // ── Admin pages ─────────────────────────────────────────
  { path: '/admin/dashboard', authRequired: true, adminOnly: true, label: 'Admin Dashboard' },
  { path: '/admin/content', authRequired: true, adminOnly: true, label: 'Admin Content' },
  { path: '/admin/kpi', authRequired: true, adminOnly: true, label: 'Admin KPI' },
  { path: '/admin/translation-management', authRequired: true, adminOnly: true, label: 'Translation Mgmt' },
  { path: '/admin/cron-monitor', authRequired: true, adminOnly: true, label: 'Cron Monitor' },
  { path: '/admin/social-cms', authRequired: true, adminOnly: true, label: 'Social CMS' },
  { path: '/admin/pattern-health', authRequired: true, adminOnly: true, label: 'Pattern Health' },
  { path: '/admin/journey-analytics', authRequired: true, adminOnly: true, label: 'Journey Analytics' },
  { path: '/admin/outcome-analytics', authRequired: true, adminOnly: true, label: 'Outcome Analytics' },
];

/** Get only public (no-auth) routes */
export function getPublicRoutes(): ScanRoute[] {
  return APP_SCAN_ROUTES.filter(r => !r.authRequired);
}

/** Get all routes the current operator can access */
export function getRoutesForRole(isAdmin: boolean): ScanRoute[] {
  if (isAdmin) return APP_SCAN_ROUTES;
  return APP_SCAN_ROUTES.filter(r => !r.adminOnly);
}
