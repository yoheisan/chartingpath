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
  | 'share_created'
  | 'paywall_shown'
  | 'pricing_clicked'
  | 'one_click_backtest_used'
  | 'create_alert_clicked';

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
  backtest_id?: string;
}

export interface PaywallShownProps {
  context: string;
  current_plan?: string;
  limit_type?: string;
}

export interface PricingClickedProps {
  source: string;
  current_plan?: string;
}

type EventProps = 
  | PresetLoadedProps 
  | BacktestStartedProps 
  | BacktestCompletedProps 
  | AlertCreatedProps 
  | ShareCreatedProps
  | PaywallShownProps
  | PricingClickedProps
  | Record<string, unknown>;

// Generate or get session ID - singleton pattern to prevent duplicates
let cachedSessionId: string | null = null;

const getSessionId = (): string => {
  if (cachedSessionId) {
    return cachedSessionId;
  }
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  cachedSessionId = sessionId;
  return sessionId;
};

// Track which events have been fired to prevent duplicates
const firedEvents = new Set<string>();

const getEventKey = (eventName: AnalyticsEvent, props: EventProps): string => {
  // For events that should only fire once per session
  if (eventName === 'signup_completed') {
    return `${eventName}`;
  }
  // For events that should fire once per unique combination
  const propsKey = JSON.stringify(props);
  return `${eventName}_${propsKey}`;
};

/**
 * Track an analytics event
 * @param eventName - One of the 6 key events
 * @param props - Event-specific properties
 * @param allowDuplicate - Whether to allow duplicate events (default false for signup)
 */
export const track = async (
  eventName: AnalyticsEvent,
  props: EventProps = {},
  allowDuplicate: boolean = true
): Promise<void> => {
  try {
    // Prevent duplicate signup_completed events
    if (eventName === 'signup_completed' && !allowDuplicate) {
      const eventKey = getEventKey(eventName, props);
      if (firedEvents.has(eventKey)) {
        console.log(`[Analytics] Skipping duplicate: ${eventName}`);
        return;
      }
      firedEvents.add(eventKey);
    }

    // Get current user (may be null for anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    
    const sessionId = getSessionId();
    
    // Insert into product_events table
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

// Convenience functions for each event type with proper typing

export const trackSignupCompleted = () => track('signup_completed', {}, false);

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

export const trackPaywallShown = (props: PaywallShownProps) =>
  track('paywall_shown', props);

export const trackPricingClicked = (props: PricingClickedProps) =>
  track('pricing_clicked', props);
