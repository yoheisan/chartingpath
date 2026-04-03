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
  | 'create_alert_clicked'
  | 'checkout_started'
  | 'checkout_completed'
  | 'tradingview_opened'
  | 'result_summary_viewed'
  | 'low_sample_warning_shown'
  | 'share_clicked'
  | 'shared_backtest_viewed'
  | 'shared_backtest_run_clicked'
  | 'shared_backtest_alert_clicked'
  | 'shared_backtest_converted'
  | 'paid_started'
  | 'pattern_validation_failed'
  | 'unsupported_pattern_ui_filtered'
  | 'project_run_started'
  | 'project_run_succeeded'
  | 'project_run_failed'
  | 'trade_plan_copied'
  | 'thumbnail_opened'
  | 'pine_generated'
  | 'pine_copied'
  | 'pine_downloaded'
  | 'pricing_viewed'
  | 'upgrade_clicked'
  // Landing page events
  | 'landing_cta_setup_finder'
  | 'landing_cta_create_alert'
  | 'landing_actioncard_clicked'
  | 'landing_presets_view_all'
  | 'landing_pricing_view'
  | 'pattern_shared'
  | 'shared_pattern_viewed'
  | 'pattern_lab.validate_verdict'
  | 'pattern_lab.promote_to_automate'
  | 'upgrade_banner_shown'
  | 'upgrade_banner_clicked'
  | 'upgrade_banner_dismissed'
  | 'shared_to_auth_click'
  | 'landing_view'
  | 'pricing_start_free'
  | 'pricing_start_lite'
  | 'pricing_start_pro'
  | 'email_lead_captured'
  | 'deploy_as_alert_clicked';

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

export interface CheckoutStartedProps {
  plan: string;
  billing_cycle: 'monthly' | 'annual';
  source?: string;
}

export interface CheckoutCompletedProps {
  plan: string;
  billing_cycle: 'monthly' | 'annual';
  amount_cents?: number;
}

export interface TradingViewOpenedProps {
  symbol: string;
  context: 'backtest' | 'alert';
}

type EventProps = 
  | PresetLoadedProps 
  | BacktestStartedProps 
  | BacktestCompletedProps 
  | AlertCreatedProps 
  | ShareCreatedProps
  | PaywallShownProps
  | PricingClickedProps
  | CheckoutStartedProps
  | CheckoutCompletedProps
  | TradingViewOpenedProps
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

export const trackCheckoutStarted = (props: CheckoutStartedProps) =>
  track('checkout_started', props);

export const trackCheckoutCompleted = (props: CheckoutCompletedProps) =>
  track('checkout_completed', props);

export const trackTradingViewOpened = (props: TradingViewOpenedProps) =>
  track('tradingview_opened', props);
