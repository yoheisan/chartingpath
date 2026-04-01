import { create } from 'zustand';

export interface VisiblePattern {
  id: string;
  type: string;
  direction: string;
  neckline?: number;
  target?: number;
  stop?: number;
  rr_ratio?: number;
}

export interface OpenPosition {
  id: string;
  symbol: string;
  pattern: string;
  pnl_r: number;
  direction: string;
  entry_price?: number;
  current_price?: number;
  stop_price?: number;
  target_price?: number;
}

export interface ActiveFilter {
  key: string;
  value: string;
}

export interface PendingAlert {
  id: string;
  symbol: string;
  alert_type: string;
  pattern_type?: string;
  direction?: string;
}

export interface UserPlan {
  id: string;
  preferred_patterns?: string[];
  asset_classes?: string[];
  max_open_positions?: number;
  trend_direction?: string;
}

export interface PatternStat {
  pattern_type: string;
  win_rate: number;
  avg_r: number;
  total_trades: number;
}

export type UserAction =
  | 'idle'
  | 'zoomed'
  | 'clicked_pattern'
  | 'applied_filter'
  | 'opened_trade'
  | 'scrolled'
  | 'typing';

export interface CopilotContextState {
  // Core page context
  route: string;
  pageType: 'chart' | 'dashboard' | 'screener' | 'paper-trading' | 'other';
  symbol: string | null;
  timeframe: string | null;
  articleSlug: string | null;

  // Chart-specific
  visiblePatterns: VisiblePattern[];
  currentPrice: number | null;

  // Screener-specific
  activeFilters: ActiveFilter[];
  selectedSymbol: string | null;

  // User activity tracking
  timeOnCurrentPage: number;
  lastUserAction: UserAction;
  lastUserActionAt: Date;
  isTyping: boolean;

  // Portfolio state
  openPositions: OpenPosition[];
  pendingAlerts: PendingAlert[];

  // User config
  userPlan: UserPlan | null;
  userPatternStats: PatternStat[];

  // Interruption tracking
  lastInterruptionAt: Date | null;
  filterApplyCount: number;
  lastFilterKey: string | null;

  // Actions
  setRoute: (route: string, pageType: CopilotContextState['pageType']) => void;
  setSymbol: (symbol: string | null) => void;
  setTimeframe: (timeframe: string | null) => void;
  setArticleSlug: (slug: string | null) => void;
  setVisiblePatterns: (patterns: VisiblePattern[]) => void;
  setCurrentPrice: (price: number | null) => void;
  setActiveFilters: (filters: ActiveFilter[]) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setLastUserAction: (action: UserAction) => void;
  setIsTyping: (typing: boolean) => void;
  setOpenPositions: (positions: OpenPosition[]) => void;
  setPendingAlerts: (alerts: PendingAlert[]) => void;
  setUserPlan: (plan: UserPlan | null) => void;
  setUserPatternStats: (stats: PatternStat[]) => void;
  incrementTimeOnPage: () => void;
  recordInterruption: () => void;
  incrementFilterApply: (filterKey: string) => void;
  resetFilterApplyCount: () => void;
}

export const useCopilotContextStore = create<CopilotContextState>((set) => ({
  route: '/',
  pageType: 'other',
  symbol: null,
  timeframe: null,
  articleSlug: null,
  visiblePatterns: [],
  currentPrice: null,
  activeFilters: [],
  selectedSymbol: null,
  timeOnCurrentPage: 0,
  lastUserAction: 'idle',
  lastUserActionAt: new Date(),
  isTyping: false,
  openPositions: [],
  pendingAlerts: [],
  userPlan: null,
  userPatternStats: [],
  lastInterruptionAt: null,
  filterApplyCount: 0,
  lastFilterKey: null,

  setRoute: (route, pageType) =>
    set({ route, pageType, timeOnCurrentPage: 0, filterApplyCount: 0, lastFilterKey: null }),

  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setArticleSlug: (slug) => set({ articleSlug: slug }),
  setVisiblePatterns: (patterns) => set({ visiblePatterns: patterns }),
  setCurrentPrice: (price) => set({ currentPrice: price }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  setLastUserAction: (action) =>
    set({ lastUserAction: action, lastUserActionAt: new Date() }),

  setIsTyping: (typing) => set({ isTyping: typing }),
  setOpenPositions: (positions) => set({ openPositions: positions }),
  setPendingAlerts: (alerts) => set({ pendingAlerts: alerts }),
  setUserPlan: (plan) => set({ userPlan: plan }),
  setUserPatternStats: (stats) => set({ userPatternStats: stats }),

  incrementTimeOnPage: () =>
    set((s) => ({ timeOnCurrentPage: s.timeOnCurrentPage + 30 })),

  recordInterruption: () => set({ lastInterruptionAt: new Date() }),

  incrementFilterApply: (filterKey) =>
    set((s) => ({
      filterApplyCount: s.lastFilterKey === filterKey ? s.filterApplyCount + 1 : 1,
      lastFilterKey: filterKey,
    })),

  resetFilterApplyCount: () => set({ filterApplyCount: 0, lastFilterKey: null }),
}));

/**
 * Build a system prompt from the live context store state.
 */
export function buildLiveContextPrompt(state: CopilotContextState): string {
  const lines: string[] = [
    'Current context:',
    `- Page: ${state.route} (${state.pageType})`,
  ];

  if (state.symbol) lines.push(`- Symbol: ${state.symbol}${state.currentPrice ? ` @ ${state.currentPrice}` : ''}`);
  if (state.timeframe) lines.push(`- Timeframe: ${state.timeframe}`);
  if (state.articleSlug) lines.push(`- User is reading: ${state.articleSlug}`);
  if (state.visiblePatterns.length > 0) {
    lines.push(`- Visible patterns: ${JSON.stringify(state.visiblePatterns)}`);
  }

  lines.push(`- User idle for: ${state.timeOnCurrentPage}s`);
  lines.push(`- Last action: ${state.lastUserAction}`);

  if (state.openPositions.length > 0) {
    lines.push(`- Open positions: ${JSON.stringify(state.openPositions.map(p => ({ symbol: p.symbol, pattern: p.pattern, pnl_r: p.pnl_r, direction: p.direction })))}`);
  }

  if (state.pendingAlerts.length > 0) {
    lines.push(`- Pending alerts: ${state.pendingAlerts.length}`);
  }

  if (state.userPlan) {
    lines.push(`- Plan: ${JSON.stringify(state.userPlan)}`);
  }

  if (state.userPatternStats.length > 0) {
    lines.push(`- Pattern stats: ${JSON.stringify(state.userPatternStats)}`);
  }

  if (state.activeFilters.length > 0) {
    lines.push(`- Active filters: ${JSON.stringify(state.activeFilters)}`);
  }

  return lines.join('\n');
}
