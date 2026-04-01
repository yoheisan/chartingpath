import { useEffect, useRef, useCallback } from 'react';
import { useCopilotContextStore } from '@/stores/copilotContextStore';

const MIN_INTERRUPTION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface InterruptionEvent {
  type: 'pattern_confirmed' | 'position_near_target' | 'user_idle_with_pattern' | 'repeated_filter';
  message: string;
}

interface UseInterruptionsOptions {
  enabled: boolean;
  onInterrupt: (event: InterruptionEvent) => void;
}

/**
 * Subscribes to the CopilotContextStore and evaluates interruption conditions.
 * Fires at most once per 10 minutes. Never fires while user is typing or during onboarding.
 */
export function useCopilotInterruptions({ enabled, onInterrupt }: UseInterruptionsOptions) {
  const onInterruptRef = useRef(onInterrupt);
  onInterruptRef.current = onInterrupt;

  const lastFiredRef = useRef<number>(0);

  const canInterrupt = useCallback((): boolean => {
    const state = useCopilotContextStore.getState();
    if (!enabled) return false;
    if (state.isTyping) return false;
    if (Date.now() - lastFiredRef.current < MIN_INTERRUPTION_INTERVAL_MS) return false;
    if (state.lastInterruptionAt && Date.now() - state.lastInterruptionAt.getTime() < MIN_INTERRUPTION_INTERVAL_MS) return false;
    return true;
  }, [enabled]);

  const fire = useCallback((event: InterruptionEvent) => {
    if (!canInterrupt()) return;
    lastFiredRef.current = Date.now();
    useCopilotContextStore.getState().recordInterruption();
    onInterruptRef.current(event);
  }, [canInterrupt]);

  // 1. Pattern confirmed on current symbol matching plan
  useEffect(() => {
    if (!enabled) return;
    const unsub = useCopilotContextStore.subscribe((state, prev) => {
      if (state.visiblePatterns.length > prev.visiblePatterns.length && state.pageType === 'chart' && state.symbol) {
        const newPatterns = state.visiblePatterns.filter(
          p => !prev.visiblePatterns.some(pp => pp.id === p.id)
        );
        if (newPatterns.length > 0 && state.userPlan?.preferred_patterns) {
          const matchingNew = newPatterns.find(p =>
            state.userPlan!.preferred_patterns!.some(
              pp => p.type.toLowerCase().includes(pp.toLowerCase())
            )
          );
          if (matchingNew) {
            fire({
              type: 'pattern_confirmed',
              message: `Just confirmed: **${matchingNew.type}** (${matchingNew.direction}) on **${state.symbol}**. Want me to open it?`,
            });
          }
        }
      }
    });
    return unsub;
  }, [enabled, fire]);

  // 2. Open position near TP/SL
  useEffect(() => {
    if (!enabled) return;
    const unsub = useCopilotContextStore.subscribe((state) => {
      if (state.openPositions.length === 0) return;
      for (const pos of state.openPositions) {
        if (!pos.current_price || !pos.target_price) continue;
        const distToTP = Math.abs(pos.current_price - pos.target_price) / pos.target_price;
        if (distToTP < 0.05 && distToTP > 0) {
          fire({
            type: 'position_near_target',
            message: `**${pos.symbol}** is ${(distToTP * 100).toFixed(1)}% from TP. Current P&L: ${pos.pnl_r > 0 ? '+' : ''}${pos.pnl_r.toFixed(1)}R.`,
          });
          break; // one at a time
        }
      }
    });
    return unsub;
  }, [enabled, fire]);

  // 3. Idle on chart with unacted pattern (every 30s via time-on-page increment)
  useEffect(() => {
    if (!enabled) return;
    const unsub = useCopilotContextStore.subscribe((state, prev) => {
      if (
        state.timeOnCurrentPage > 180 &&
        state.timeOnCurrentPage !== prev.timeOnCurrentPage &&
        state.pageType === 'chart' &&
        state.visiblePatterns.length > 0 &&
        state.lastUserAction === 'idle'
      ) {
        const topPattern = state.visiblePatterns[0];
        const stat = state.userPatternStats.find(s =>
          topPattern.type.toLowerCase().includes(s.pattern_type.toLowerCase())
        );
        fire({
          type: 'user_idle_with_pattern',
          message: `Still watching **${state.symbol}**? Your **${topPattern.type}** win rate is ${stat ? stat.win_rate + '%' : 'unknown'}. Want me to set a breakout alert instead?`,
        });
      }
    });
    return unsub;
  }, [enabled, fire]);

  // 4. Repeated filter application on screener
  useEffect(() => {
    if (!enabled) return;
    const unsub = useCopilotContextStore.subscribe((state, prev) => {
      if (
        state.filterApplyCount >= 3 &&
        state.filterApplyCount !== prev.filterApplyCount &&
        state.pageType === 'screener'
      ) {
        fire({
          type: 'repeated_filter',
          message: `You keep filtering for **${state.lastFilterKey}**. Want me to save this as a watchlist?`,
        });
      }
    });
    return unsub;
  }, [enabled, fire]);
}
