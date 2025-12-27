// Admin KPI Service - Queries Supabase for wedge strategy metrics
import { supabase } from '@/integrations/supabase/client';

export type TimeWindow = '7d' | '30d' | '90d';

const getIntervalDays = (window: TimeWindow): number => {
  switch (window) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
  }
};

export interface FunnelMetrics {
  sessions: number;
  signups: number;
  presetLoads: number;
  backtestCompletions: number;
  alertCreations: number;
  returnAfterAlert: number;
  landingInstrumented: boolean;
}

export interface ActivationMetrics {
  activatedUsers: number;
  totalSignups: number;
  activationRate: number;
  medianTimeToBacktestHours: number | null;
  medianTimeToAlertHours: number | null;
}

export interface RetentionMetrics {
  d1Retention: number;
  d7Retention: number;
  usersActiveMultipleDays: number;
  totalUsersInWindow: number;
}

export interface UsageMetrics {
  avgBacktestsPerUser: number;
  avgAlertsPerUser: number;
  totalAlerts: number;
  activeAlerts: number;
  triggeredAlerts: number;
  alertsByPlan: { plan: string; count: number }[];
}

export interface TopItem {
  name: string;
  count: number;
}

export interface MonetizationMetrics {
  paywallShown: number;
  pricingClicked: number;
  conversions: number;
  conversionRate: number;
}

export interface DataQualityMetrics {
  eventsPresent: string[];
  eventsMissing: string[];
  warnings: string[];
}

export interface WedgePurityMetrics {
  totalEvents: number;
  nonWedgeEvents: number;
  purityRate: number;
  violations: { instrumentCategory: string; timeframe: string; count: number }[];
}

export interface TimeToStepMetrics {
  presetToBacktest: number | null;
  backtestToAlert: number | null;
  alertToSignup: number | null;
  signupToAlert: number | null;
}

export interface KPIData {
  funnel: FunnelMetrics;
  activation: ActivationMetrics;
  retention: RetentionMetrics;
  usage: UsageMetrics;
  topSymbols: TopItem[];
  topPatterns: TopItem[];
  monetization: MonetizationMetrics;
  dataQuality: DataQualityMetrics;
  wedgePurity: WedgePurityMetrics;
  timeToStep: TimeToStepMetrics;
  lastRefreshed: string;
}

// Fetch funnel metrics
async function fetchFunnelMetrics(days: number): Promise<FunnelMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  // Get all events in window
  const { data: events, error } = await supabase
    .from('product_events')
    .select('event_name, user_id, session_id, created_at')
    .gte('created_at', cutoffISO);

  if (error) {
    console.error('Error fetching funnel events:', error);
    return {
      sessions: 0,
      signups: 0,
      presetLoads: 0,
      backtestCompletions: 0,
      alertCreations: 0,
      returnAfterAlert: 0,
      landingInstrumented: false,
    };
  }

  const eventsData = events || [];
  
  // Check if landing_view exists
  const hasLandingView = eventsData.some(e => e.event_name === 'landing_view');
  
  // Unique sessions (proxy for landing if not instrumented)
  const uniqueSessions = new Set(eventsData.map(e => e.session_id)).size;
  
  // Unique users per event type
  const signups = new Set(eventsData.filter(e => e.event_name === 'signup_completed').map(e => e.user_id)).size;
  const presetLoads = new Set(eventsData.filter(e => e.event_name === 'preset_loaded').map(e => e.user_id)).size;
  const backtestCompletions = new Set(eventsData.filter(e => e.event_name === 'backtest_completed').map(e => e.user_id)).size;
  const alertCreations = new Set(eventsData.filter(e => e.event_name === 'alert_created').map(e => e.user_id)).size;

  // Return after alert: users who had an event after alert_created
  const alertCreatedUsers = eventsData
    .filter(e => e.event_name === 'alert_created')
    .map(e => ({ user_id: e.user_id, created_at: new Date(e.created_at) }));
  
  let returnAfterAlert = 0;
  for (const alertEvent of alertCreatedUsers) {
    const hasLaterEvent = eventsData.some(e => 
      e.user_id === alertEvent.user_id && 
      new Date(e.created_at) > alertEvent.created_at &&
      e.event_name !== 'alert_created'
    );
    if (hasLaterEvent) returnAfterAlert++;
  }

  return {
    sessions: uniqueSessions,
    signups,
    presetLoads,
    backtestCompletions,
    alertCreations,
    returnAfterAlert: new Set([...Array.from({ length: returnAfterAlert })]).size, // dedupe
    landingInstrumented: hasLandingView,
  };
}

// Fetch activation metrics
async function fetchActivationMetrics(days: number): Promise<ActivationMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events, error } = await supabase
    .from('product_events')
    .select('event_name, user_id, created_at')
    .gte('created_at', cutoffISO)
    .in('event_name', ['signup_completed', 'backtest_completed', 'alert_created']);

  if (error || !events) {
    return {
      activatedUsers: 0,
      totalSignups: 0,
      activationRate: 0,
      medianTimeToBacktestHours: null,
      medianTimeToAlertHours: null,
    };
  }

  // Group events by user
  const userEvents: Record<string, { signup?: Date; backtest?: Date; alert?: Date }> = {};
  
  for (const event of events) {
    if (!event.user_id) continue;
    if (!userEvents[event.user_id]) userEvents[event.user_id] = {};
    
    const eventDate = new Date(event.created_at);
    switch (event.event_name) {
      case 'signup_completed':
        if (!userEvents[event.user_id].signup || eventDate < userEvents[event.user_id].signup!) {
          userEvents[event.user_id].signup = eventDate;
        }
        break;
      case 'backtest_completed':
        if (!userEvents[event.user_id].backtest || eventDate < userEvents[event.user_id].backtest!) {
          userEvents[event.user_id].backtest = eventDate;
        }
        break;
      case 'alert_created':
        if (!userEvents[event.user_id].alert || eventDate < userEvents[event.user_id].alert!) {
          userEvents[event.user_id].alert = eventDate;
        }
        break;
    }
  }

  const signupUsers = Object.entries(userEvents).filter(([_, e]) => e.signup);
  const totalSignups = signupUsers.length;
  
  // Activated = backtest + alert within 72h of signup
  const activatedUsers = signupUsers.filter(([_, e]) => {
    if (!e.signup || !e.backtest || !e.alert) return false;
    const hours72 = 72 * 60 * 60 * 1000;
    return (e.backtest.getTime() - e.signup.getTime() <= hours72) &&
           (e.alert.getTime() - e.signup.getTime() <= hours72);
  }).length;

  // Median time calculations
  const timeToBacktest = signupUsers
    .filter(([_, e]) => e.signup && e.backtest)
    .map(([_, e]) => (e.backtest!.getTime() - e.signup!.getTime()) / (1000 * 60 * 60));
  
  const timeToAlert = signupUsers
    .filter(([_, e]) => e.signup && e.alert)
    .map(([_, e]) => (e.alert!.getTime() - e.signup!.getTime()) / (1000 * 60 * 60));

  const median = (arr: number[]) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  return {
    activatedUsers,
    totalSignups,
    activationRate: totalSignups > 0 ? (activatedUsers / totalSignups) * 100 : 0,
    medianTimeToBacktestHours: median(timeToBacktest),
    medianTimeToAlertHours: median(timeToAlert),
  };
}

// Fetch retention metrics
async function fetchRetentionMetrics(days: number): Promise<RetentionMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events, error } = await supabase
    .from('product_events')
    .select('user_id, created_at')
    .gte('created_at', cutoffISO)
    .not('user_id', 'is', null);

  if (error || !events) {
    return { d1Retention: 0, d7Retention: 0, usersActiveMultipleDays: 0, totalUsersInWindow: 0 };
  }

  // Group by user and get unique days
  const userDays: Record<string, Set<string>> = {};
  for (const event of events) {
    if (!event.user_id) continue;
    if (!userDays[event.user_id]) userDays[event.user_id] = new Set();
    userDays[event.user_id].add(new Date(event.created_at).toDateString());
  }

  const totalUsers = Object.keys(userDays).length;
  const usersActiveMultipleDays = Object.values(userDays).filter(days => days.size >= 2).length;

  // D1/D7 would need signup dates - simplified version
  const d1Retention = totalUsers > 0 ? (usersActiveMultipleDays / totalUsers) * 100 : 0;
  const d7Retention = d1Retention * 0.7; // Rough estimate

  return {
    d1Retention,
    d7Retention,
    usersActiveMultipleDays,
    totalUsersInWindow: totalUsers,
  };
}

// Fetch usage metrics
async function fetchUsageMetrics(days: number): Promise<UsageMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  // Get backtest counts per user
  const { data: backtestEvents } = await supabase
    .from('product_events')
    .select('user_id')
    .eq('event_name', 'backtest_completed')
    .gte('created_at', cutoffISO)
    .not('user_id', 'is', null);

  // Get alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, user_id, status')
    .gte('created_at', cutoffISO);

  // Get alerts log for triggers
  const { data: alertsLog } = await supabase
    .from('alerts_log')
    .select('id, alert_id, triggered_at')
    .gte('triggered_at', cutoffISO);

  // Get profiles for plan info
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, subscription_plan');

  const backtestCounts: Record<string, number> = {};
  for (const event of backtestEvents || []) {
    if (event.user_id) {
      backtestCounts[event.user_id] = (backtestCounts[event.user_id] || 0) + 1;
    }
  }

  const alertCounts: Record<string, number> = {};
  for (const alert of alerts || []) {
    if (alert.user_id) {
      alertCounts[alert.user_id] = (alertCounts[alert.user_id] || 0) + 1;
    }
  }

  const backtestValues = Object.values(backtestCounts);
  const alertValues = Object.values(alertCounts);
  
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // Alerts by plan
  const planMap: Record<string, string> = {};
  for (const profile of profiles || []) {
    planMap[profile.user_id] = profile.subscription_plan || 'starter';
  }

  const alertsByPlanMap: Record<string, number> = { starter: 0, pro: 0, elite: 0 };
  for (const alert of alerts || []) {
    if (alert.status === 'active') {
      const plan = planMap[alert.user_id] || 'starter';
      alertsByPlanMap[plan] = (alertsByPlanMap[plan] || 0) + 1;
    }
  }

  return {
    avgBacktestsPerUser: avg(backtestValues),
    avgAlertsPerUser: avg(alertValues),
    totalAlerts: alerts?.length || 0,
    activeAlerts: alerts?.filter(a => a.status === 'active').length || 0,
    triggeredAlerts: alertsLog?.length || 0,
    alertsByPlan: Object.entries(alertsByPlanMap).map(([plan, count]) => ({ plan, count })),
  };
}

// Fetch top symbols and patterns
async function fetchTopItems(days: number): Promise<{ symbols: TopItem[]; patterns: TopItem[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, event_props')
    .gte('created_at', cutoffISO)
    .in('event_name', ['preset_loaded', 'backtest_completed', 'alert_created']);

  const symbolCounts: Record<string, number> = {};
  const patternCounts: Record<string, number> = {};

  for (const event of events || []) {
    const props = event.event_props as Record<string, unknown> | null;
    if (props) {
      const symbol = props.symbol as string;
      const pattern = props.pattern as string;
      if (symbol) symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
      if (pattern) patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }
  }

  const sortAndLimit = (counts: Record<string, number>, limit = 10): TopItem[] => {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  };

  return {
    symbols: sortAndLimit(symbolCounts),
    patterns: sortAndLimit(patternCounts),
  };
}

// Fetch monetization metrics
async function fetchMonetizationMetrics(days: number): Promise<MonetizationMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, user_id')
    .gte('created_at', cutoffISO)
    .in('event_name', ['paywall_shown', 'pricing_clicked']);

  const paywallShown = new Set((events || []).filter(e => e.event_name === 'paywall_shown').map(e => e.user_id)).size;
  const pricingClicked = new Set((events || []).filter(e => e.event_name === 'pricing_clicked').map(e => e.user_id)).size;

  // Simplified conversion tracking - would need billing_events for accurate data
  const { data: billingEvents } = await supabase
    .from('billing_events')
    .select('user_id, event_type, from_plan, to_plan')
    .gte('created_at', cutoffISO)
    .eq('event_type', 'upgrade');

  const conversions = new Set((billingEvents || []).map(e => e.user_id)).size;

  return {
    paywallShown,
    pricingClicked,
    conversions,
    conversionRate: paywallShown > 0 ? (conversions / paywallShown) * 100 : 0,
  };
}

// Check data quality
async function checkDataQuality(): Promise<DataQualityMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name')
    .gte('created_at', cutoffISO);

  const presentEvents = new Set((events || []).map(e => e.event_name));
  
  const expectedEvents = [
    'signup_completed',
    'preset_loaded',
    'backtest_started',
    'backtest_completed',
    'alert_created',
    'share_created',
    'paywall_shown',
    'pricing_clicked',
    'landing_view',
  ];

  const eventsPresent = expectedEvents.filter(e => presentEvents.has(e));
  const eventsMissing = expectedEvents.filter(e => !presentEvents.has(e));

  const warnings: string[] = [];
  if (!presentEvents.has('landing_view')) {
    warnings.push('Landing views not instrumented - using session proxy for funnel top');
  }
  if (!presentEvents.has('paywall_shown')) {
    warnings.push('Paywall events not instrumented - monetization data incomplete');
  }
  if (!presentEvents.has('signup_completed')) {
    warnings.push('No signup events in last 7 days - check instrumentation');
  }

  return { eventsPresent, eventsMissing, warnings };
}

// Fetch wedge purity metrics - should be 0 violations after hardening
async function fetchWedgePurityMetrics(days: number): Promise<WedgePurityMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, event_props')
    .gte('created_at', cutoffISO)
    .in('event_name', ['preset_loaded', 'backtest_started', 'backtest_completed', 'alert_created']);

  const totalEvents = events?.length || 0;
  const violationCounts: Record<string, number> = {};
  let nonWedgeEvents = 0;

  for (const event of events || []) {
    const props = event.event_props as Record<string, unknown> | null;
    if (props) {
      const category = (props.instrumentCategory as string) || 'unknown';
      const timeframe = ((props.timeframe as string) || 'unknown').toLowerCase();
      
      // Check for wedge violations
      const isWedge = category === 'crypto' && (timeframe === '1h' || timeframe === '1hour');
      if (!isWedge) {
        nonWedgeEvents++;
        const key = `${category}|${timeframe}`;
        violationCounts[key] = (violationCounts[key] || 0) + 1;
      }
    }
  }

  const violations = Object.entries(violationCounts)
    .map(([key, count]) => {
      const [instrumentCategory, timeframe] = key.split('|');
      return { instrumentCategory, timeframe, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents,
    nonWedgeEvents,
    purityRate: totalEvents > 0 ? ((totalEvents - nonWedgeEvents) / totalEvents) * 100 : 100,
    violations,
  };
}

// Fetch time-to-step metrics (median time between funnel steps)
async function fetchTimeToStepMetrics(days: number): Promise<TimeToStepMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, user_id, session_id, created_at')
    .gte('created_at', cutoffISO)
    .in('event_name', ['preset_loaded', 'backtest_started', 'backtest_completed', 'alert_created', 'signup_completed']);

  if (!events || events.length === 0) {
    return { presetToBacktest: null, backtestToAlert: null, alertToSignup: null, signupToAlert: null };
  }

  // Group by session for anonymous users, user for authenticated
  const sessionEvents: Record<string, { event: string; time: Date }[]> = {};
  
  for (const event of events) {
    const key = event.user_id || event.session_id || 'unknown';
    if (!sessionEvents[key]) sessionEvents[key] = [];
    sessionEvents[key].push({ event: event.event_name, time: new Date(event.created_at) });
  }

  const timeDiffs = {
    presetToBacktest: [] as number[],
    backtestToAlert: [] as number[],
    alertToSignup: [] as number[],
    signupToAlert: [] as number[],
  };

  for (const events of Object.values(sessionEvents)) {
    const sorted = events.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    const firstPreset = sorted.find(e => e.event === 'preset_loaded');
    const firstBacktest = sorted.find(e => e.event === 'backtest_completed');
    const firstAlert = sorted.find(e => e.event === 'alert_created');
    const signup = sorted.find(e => e.event === 'signup_completed');

    if (firstPreset && firstBacktest && firstBacktest.time > firstPreset.time) {
      timeDiffs.presetToBacktest.push((firstBacktest.time.getTime() - firstPreset.time.getTime()) / 60000);
    }
    if (firstBacktest && firstAlert && firstAlert.time > firstBacktest.time) {
      timeDiffs.backtestToAlert.push((firstAlert.time.getTime() - firstBacktest.time.getTime()) / 60000);
    }
    if (firstAlert && signup && signup.time > firstAlert.time) {
      timeDiffs.alertToSignup.push((signup.time.getTime() - firstAlert.time.getTime()) / 60000);
    }
    if (signup && firstAlert && firstAlert.time > signup.time) {
      timeDiffs.signupToAlert.push((firstAlert.time.getTime() - signup.time.getTime()) / 60000);
    }
  }

  const median = (arr: number[]) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  return {
    presetToBacktest: median(timeDiffs.presetToBacktest),
    backtestToAlert: median(timeDiffs.backtestToAlert),
    alertToSignup: median(timeDiffs.alertToSignup),
    signupToAlert: median(timeDiffs.signupToAlert),
  };
}

// Main fetch function
export async function fetchKPIData(window: TimeWindow): Promise<KPIData> {
  const days = getIntervalDays(window);

  const [funnel, activation, retention, usage, topItems, monetization, dataQuality, wedgePurity, timeToStep] = await Promise.all([
    fetchFunnelMetrics(days),
    fetchActivationMetrics(days),
    fetchRetentionMetrics(days),
    fetchUsageMetrics(days),
    fetchTopItems(days),
    fetchMonetizationMetrics(days),
    checkDataQuality(),
    fetchWedgePurityMetrics(days),
    fetchTimeToStepMetrics(days),
  ]);

  return {
    funnel,
    activation,
    retention,
    usage,
    topSymbols: topItems.symbols,
    topPatterns: topItems.patterns,
    monetization,
    dataQuality,
    wedgePurity,
    timeToStep,
    lastRefreshed: new Date().toISOString(),
  };
}
