import type { AgentWeights } from '../../engine/backtester-v2/agents/types';

export interface ScoringUpdatePayload {
  weights?: AgentWeights;
  takeCutoff?: number;
  watchCutoff?: number;
  assetClassFilter?: string;
  timeframeFilter?: string;
  subFilters?: Record<string, any>;
  presetId?: string;
  presetName?: string;
  originatedAt: number;
  diff?: {
    weights?: Partial<AgentWeights>;
    cutoffs?: { take?: number; watch?: number };
  };
  description?: string;
}

export interface NavigatePayload {
  path: string;
  label: string;
  pendingAction?: boolean;
}

export function dispatchScoringUpdate(payload: ScoringUpdatePayload) {
  window.dispatchEvent(
    new CustomEvent('copilot:scoring-update', { detail: payload })
  );
}

export function dispatchRunBacktest() {
  window.dispatchEvent(new CustomEvent('copilot:run-backtest'));
}

export function dispatchNavigate(payload: NavigatePayload) {
  window.dispatchEvent(
    new CustomEvent('copilot:navigate', { detail: payload })
  );
}

export function registerPanel(name: string) {
  if (!(window as any).__copilotPanels) (window as any).__copilotPanels = {};
  (window as any).__copilotPanels[name] = true;
}

export function unregisterPanel(name: string) {
  if ((window as any).__copilotPanels) (window as any).__copilotPanels[name] = false;
}

export function isPanelMounted(name: string): boolean {
  return !!(window as any).__copilotPanels?.[name];
}

/** Tracks what the user is currently viewing so the Copilot can be context-aware */
export interface ViewContext {
  /** Which page/module the user is on */
  page: 'screener' | 'agent-scoring' | 'ticker-study' | 'pattern-lab' | 'dashboard' | 'other';
  /** The instrument the user is focused on (e.g. AAPL, BTC-USD) */
  instrument?: string;
  /** The pattern being viewed */
  patternName?: string;
  patternId?: string;
  /** Timeframe in view */
  timeframe?: string;
  /** Trade direction */
  direction?: string;
  /** Quality grade if available */
  grade?: string;
  /** Agent scoring verdict if on that page */
  verdict?: string;
  /** Composite score */
  compositeScore?: number;
  /** Detection DB id */
  detectionId?: string;
  /** Timestamp of when context was set */
  updatedAt: number;
}

const VIEW_CONTEXT_KEY = '__copilotViewContext';

export function setViewContext(ctx: Omit<ViewContext, 'updatedAt'>) {
  (window as any)[VIEW_CONTEXT_KEY] = { ...ctx, updatedAt: Date.now() };
}

export function getViewContext(): ViewContext | null {
  const ctx = (window as any)[VIEW_CONTEXT_KEY] as ViewContext | undefined;
  if (!ctx) return null;
  // Expire after 10 minutes of staleness
  if (Date.now() - ctx.updatedAt > 10 * 60 * 1000) return null;
  return ctx;
}

export function clearViewContext() {
  (window as any)[VIEW_CONTEXT_KEY] = null;
}

export function buildDiffSummary(diff: ScoringUpdatePayload['diff']): string {
  const parts: string[] = [];
  if (diff?.weights) {
    Object.entries(diff.weights).forEach(([key, val]) => {
      if (val !== undefined) parts.push(`${key} →${val}`);
    });
  }
  if (diff?.cutoffs?.take !== undefined) parts.push(`Take cutoff →${diff.cutoffs.take}`);
  if (diff?.cutoffs?.watch !== undefined) parts.push(`Watch cutoff →${diff.cutoffs.watch}`);
  return parts.join('  ·  ');
}
