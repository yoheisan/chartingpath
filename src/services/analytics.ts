// Lightweight analytics event capture for KPI tracking
// Tracks only the 6 key events for wedge strategy validation

import { supabase } from '@/integrations/supabase/client';

// Event types for type safety
export type AnalyticsEvent = 
  | 'signup_completed'
  | 'preset_loaded'
  | 'backtest_started'
  | 'backtest_completed'
  | 'alert_created'
  | 'share_created';

// Event properties types
export interface PresetLoadedProps {
  symbol: string;
  pattern: string;
  timeframe: string;
}

export interface BacktestStartedProps {
  symbol: string;
  pattern: string;
  timeframe: string;
}

export interface BacktestCompletedProps {
  symbol: string;
  pattern: string;
  timeframe: string;
  trades_count: number;
  sharpe: number | null;
  max_dd: number | null;
}

export interface AlertCreatedProps {
  symbol: string;
  pattern: string;
  timeframe: string;
  plan_tier: string;
}

export interface ShareCreatedProps {
  symbol: string;
  pattern: string;
  timeframe: string;
}

type EventProps = 
  | PresetLoadedProps 
  | BacktestStartedProps 
  | BacktestCompletedProps 
  | AlertCreatedProps 
  | ShareCreatedProps
  | Record<string, unknown>;

// Generate or get session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Track an analytics event
 * @param eventName - One of the 6 key events
 * @param props - Event-specific properties
 */
export const track = async (
  eventName: AnalyticsEvent,
  props: EventProps = {}
): Promise<void> => {
  try {
    // Get current user (may be null for anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    
    const sessionId = getSessionId();
    
    // Use raw SQL via rpc or direct insert with type bypass
    // Since product_events table was just created, types may not be regenerated yet
    const { error } = await supabase
      .from('product_events' as any)
      .insert({
        user_id: user?.id || null,
        session_id: sessionId,
        event_name: eventName,
        event_props: props,
      } as any);
    
    if (error) {
      // Silent fail - don't break UX for analytics
      console.warn('Analytics track error:', error.message);
    } else {
      console.log(`[Analytics] ${eventName}`, props);
    }
  } catch (error) {
    // Silent fail
    console.warn('Analytics track error:', error);
  }
};

// Convenience functions for each event type
export const trackSignupCompleted = () => track('signup_completed', {});

export const trackPresetLoaded = (props: PresetLoadedProps) => 
  track('preset_loaded', props);

export const trackBacktestStarted = (props: BacktestStartedProps) => 
  track('backtest_started', props);

export const trackBacktestCompleted = (props: BacktestCompletedProps) => 
  track('backtest_completed', props);

export const trackAlertCreated = (props: AlertCreatedProps) => 
  track('alert_created', props);

export const trackShareCreated = (props: ShareCreatedProps) => 
  track('share_created', props);
