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
