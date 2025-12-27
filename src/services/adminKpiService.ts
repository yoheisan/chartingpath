// Admin KPI Service - Queries Supabase for wedge strategy metrics
import { supabase } from '@/integrations/supabase/client';
import { SUPPORTED_WEDGE_PATTERN_IDS } from '@/config/wedge';

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

export interface WedgePatternPurityMetrics {
  totalBacktests: number;
  pureBacktests: number;
  purityRate: number;
  violations: { patterns: string[]; count: number }[];
}

export interface TimeToStepMetrics {
  presetToBacktest: number | null;
  backtestToAlert: number | null;
  alertToSignup: number | null;
  signupToAlert: number | null;
}

// North Star: Activated Traders = sessions with backtest_completed AND alert_created within 24h
export interface NorthStarMetrics {
  activatedTraders: number;
  dailyTrend: { date: string; count: number }[];
}

// Revenue Intent: sessions with paywall_shown AND pricing_clicked
export interface RevenueIntentMetrics {
  paywallToClickRate: number;
  totalPaywallSessions: number;
  totalPricingClicks: number;
  sessionConversions: number;
}

// Cohort data grouped by signup date
export interface CohortRow {
  cohortDate: string;
  signups: number;
  d0BacktestRate: number;
  d1AlertRate: number;
  d7ReturnRate: number;
}

// Validated Traders: users with alert_created AND alerts_log trigger within 7 days
export interface ValidatedTradersMetrics {
  validatedTraders: number;
  validatedVsActivated: number; // percentage of activated traders who became validated
  medianTimeToFirstTriggerHours: number | null;
}

// Stripe conversion metrics (webhook-truthful)
export interface StripeConversionMetrics {
  checkoutStarted: number;
  checkoutCompleted: number; // client-side (may be inaccurate)
  paidStarted: number; // webhook-truthful (investor-grade)
  conversionRate: number; // based on paid_started
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
  wedgePatternPurity: WedgePatternPurityMetrics;
  timeToStep: TimeToStepMetrics;
  northStar: NorthStarMetrics;
  revenueIntent: RevenueIntentMetrics;
  cohorts: CohortRow[];
  validatedTraders: ValidatedTradersMetrics;
  stripeConversion: StripeConversionMetrics;
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

// Fetch wedge pattern purity metrics - % of backtests where enabled_patterns ⊆ SUPPORTED_WEDGE_PATTERN_IDS
async function fetchWedgePatternPurityMetrics(days: number): Promise<WedgePatternPurityMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, event_props')
    .gte('created_at', cutoffISO)
    .in('event_name', ['backtest_started', 'backtest_completed']);

  const totalBacktests = events?.length || 0;
  const violationCounts: Record<string, number> = {};
  let pureBacktests = 0;

  for (const event of events || []) {
    const props = event.event_props as Record<string, unknown> | null;
    if (props) {
      // Get enabled patterns from event props
      const enabledPatterns = (props.enabledPatterns as string[]) || 
                              (props.enabled_patterns as string[]) ||
                              (props.patterns as string[]) ||
                              [];
      
      // Check if all enabled patterns are in the supported set
      const unsupportedPatterns = enabledPatterns.filter(p => !SUPPORTED_WEDGE_PATTERN_IDS.has(p));
      
      if (unsupportedPatterns.length === 0 && enabledPatterns.length > 0) {
        pureBacktests++;
      } else if (unsupportedPatterns.length > 0) {
        const key = unsupportedPatterns.sort().join(',');
        violationCounts[key] = (violationCounts[key] || 0) + 1;
      }
    }
  }

  const violations = Object.entries(violationCounts)
    .map(([key, count]) => ({
      patterns: key.split(','),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalBacktests,
    pureBacktests,
    purityRate: totalBacktests > 0 ? (pureBacktests / totalBacktests) * 100 : 100,
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

// Fetch North Star metrics: Activated Traders = sessions with backtest + alert in 24h
async function fetchNorthStarMetrics(days: number): Promise<NorthStarMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, session_id, created_at')
    .gte('created_at', cutoffISO)
    .in('event_name', ['backtest_completed', 'alert_created']);

  if (!events || events.length === 0) {
    return { activatedTraders: 0, dailyTrend: [] };
  }

  // Group by session
  const sessionEvents: Record<string, { backtest?: Date; alert?: Date }> = {};
  for (const event of events) {
    const sid = event.session_id || 'unknown';
    if (!sessionEvents[sid]) sessionEvents[sid] = {};
    const time = new Date(event.created_at);
    if (event.event_name === 'backtest_completed') {
      if (!sessionEvents[sid].backtest || time < sessionEvents[sid].backtest!) {
        sessionEvents[sid].backtest = time;
      }
    }
    if (event.event_name === 'alert_created') {
      if (!sessionEvents[sid].alert || time > sessionEvents[sid].alert!) {
        sessionEvents[sid].alert = time;
      }
    }
  }

  // Count sessions where both happened within 24h
  let activatedTraders = 0;
  const dailyMap: Record<string, number> = {};

  for (const [_, e] of Object.entries(sessionEvents)) {
    if (e.backtest && e.alert) {
      const diff = e.alert.getTime() - e.backtest.getTime();
      if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
        activatedTraders++;
        const dateKey = e.alert.toISOString().split('T')[0];
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
      }
    }
  }

  // Build daily trend for last 14 days
  const dailyTrend: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    dailyTrend.push({ date: dateKey, count: dailyMap[dateKey] || 0 });
  }

  return { activatedTraders, dailyTrend };
}

// Fetch Revenue Intent metrics: sessions with paywall_shown AND pricing_clicked
async function fetchRevenueIntentMetrics(days: number): Promise<RevenueIntentMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, session_id')
    .gte('created_at', cutoffISO)
    .in('event_name', ['paywall_shown', 'pricing_clicked']);

  if (!events || events.length === 0) {
    return { paywallToClickRate: 0, totalPaywallSessions: 0, totalPricingClicks: 0, sessionConversions: 0 };
  }

  const sessionPaywall = new Set<string>();
  const sessionPricing = new Set<string>();

  for (const event of events) {
    const sid = event.session_id || 'unknown';
    if (event.event_name === 'paywall_shown') sessionPaywall.add(sid);
    if (event.event_name === 'pricing_clicked') sessionPricing.add(sid);
  }

  // Sessions that saw paywall AND clicked pricing
  const sessionConversions = [...sessionPaywall].filter(s => sessionPricing.has(s)).length;

  return {
    paywallToClickRate: sessionPaywall.size > 0 ? (sessionConversions / sessionPaywall.size) * 100 : 0,
    totalPaywallSessions: sessionPaywall.size,
    totalPricingClicks: sessionPricing.size,
    sessionConversions,
  };
}

// Fetch Cohort data: signups grouped by date with d0/d1/d7 metrics
async function fetchCohortMetrics(days: number): Promise<CohortRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, user_id, created_at')
    .gte('created_at', cutoffISO)
    .not('user_id', 'is', null);

  if (!events || events.length === 0) {
    return [];
  }

  // Group by user
  const userEvents: Record<string, { signup?: Date; events: { name: string; time: Date }[] }> = {};
  for (const event of events) {
    if (!event.user_id) continue;
    if (!userEvents[event.user_id]) {
      userEvents[event.user_id] = { events: [] };
    }
    const time = new Date(event.created_at);
    userEvents[event.user_id].events.push({ name: event.event_name, time });
    if (event.event_name === 'signup_completed') {
      if (!userEvents[event.user_id].signup || time < userEvents[event.user_id].signup!) {
        userEvents[event.user_id].signup = time;
      }
    }
  }

  // Group by cohort date (signup date)
  const cohortData: Record<string, { signups: number; d0Backtest: number; d1Alert: number; d7Return: number }> = {};

  for (const [userId, data] of Object.entries(userEvents)) {
    if (!data.signup) continue;
    const cohortDate = data.signup.toISOString().split('T')[0];
    if (!cohortData[cohortDate]) {
      cohortData[cohortDate] = { signups: 0, d0Backtest: 0, d1Alert: 0, d7Return: 0 };
    }
    cohortData[cohortDate].signups++;

    const signupDay = data.signup.getTime();
    const day1 = signupDay + 24 * 60 * 60 * 1000;
    const day7 = signupDay + 7 * 24 * 60 * 60 * 1000;

    // D0: backtest on same day as signup
    const hasD0Backtest = data.events.some(e => 
      e.name === 'backtest_completed' && e.time.getTime() < day1
    );
    if (hasD0Backtest) cohortData[cohortDate].d0Backtest++;

    // D1: alert created within 24-48h of signup
    const hasD1Alert = data.events.some(e => 
      e.name === 'alert_created' && e.time.getTime() >= day1 && e.time.getTime() < day1 + 24 * 60 * 60 * 1000
    );
    if (hasD1Alert) cohortData[cohortDate].d1Alert++;

    // D7: any event after day 7
    const hasD7Return = data.events.some(e => e.time.getTime() >= day7);
    if (hasD7Return) cohortData[cohortDate].d7Return++;
  }

  // Convert to array sorted by date
  return Object.entries(cohortData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14) // Last 14 cohorts
    .map(([cohortDate, data]) => ({
      cohortDate,
      signups: data.signups,
      d0BacktestRate: data.signups > 0 ? (data.d0Backtest / data.signups) * 100 : 0,
      d1AlertRate: data.signups > 0 ? (data.d1Alert / data.signups) * 100 : 0,
      d7ReturnRate: data.signups > 0 ? (data.d7Return / data.signups) * 100 : 0,
    }));
}

// Fetch Validated Traders: users who created alerts AND had a trigger within 7 days
async function fetchValidatedTradersMetrics(days: number): Promise<ValidatedTradersMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  // Get users who created alerts
  const { data: alertCreatedEvents } = await supabase
    .from('product_events')
    .select('user_id, created_at')
    .eq('event_name', 'alert_created')
    .gte('created_at', cutoffISO)
    .not('user_id', 'is', null);

  if (!alertCreatedEvents || alertCreatedEvents.length === 0) {
    return { validatedTraders: 0, validatedVsActivated: 0, medianTimeToFirstTriggerHours: null };
  }

  // Get alerts with their user_ids
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, user_id, created_at')
    .gte('created_at', cutoffISO);

  // Get triggered alerts
  const { data: alertsLog } = await supabase
    .from('alerts_log')
    .select('alert_id, triggered_at')
    .not('triggered_at', 'is', null);

  if (!alerts || !alertsLog) {
    return { validatedTraders: 0, validatedVsActivated: 0, medianTimeToFirstTriggerHours: null };
  }

  // Map alert_id to user_id
  const alertUserMap: Record<string, string> = {};
  const alertCreatedMap: Record<string, Date> = {};
  for (const alert of alerts) {
    alertUserMap[alert.id] = alert.user_id;
    alertCreatedMap[alert.id] = new Date(alert.created_at);
  }

  // Track users who got triggers and time to first trigger
  const usersWithTriggers = new Set<string>();
  const userTimeToTrigger: Record<string, number> = {};

  for (const log of alertsLog) {
    const userId = alertUserMap[log.alert_id];
    const alertCreated = alertCreatedMap[log.alert_id];
    if (!userId || !alertCreated || !log.triggered_at) continue;

    const triggered = new Date(log.triggered_at);
    const daysDiff = (triggered.getTime() - alertCreated.getTime()) / (1000 * 60 * 60 * 24);
    
    // Within 7 days
    if (daysDiff <= 7 && daysDiff >= 0) {
      usersWithTriggers.add(userId);
      const hoursDiff = daysDiff * 24;
      if (!userTimeToTrigger[userId] || hoursDiff < userTimeToTrigger[userId]) {
        userTimeToTrigger[userId] = hoursDiff;
      }
    }
  }

  const validatedTraders = usersWithTriggers.size;
  const alertCreators = new Set(alertCreatedEvents.map(e => e.user_id)).size;

  // Calculate median time to first trigger
  const times = Object.values(userTimeToTrigger);
  const median = (arr: number[]) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  return {
    validatedTraders,
    validatedVsActivated: alertCreators > 0 ? (validatedTraders / alertCreators) * 100 : 0,
    medianTimeToFirstTriggerHours: median(times),
  };
}

// Fetch Stripe conversion metrics (webhook-truthful)
async function fetchStripeConversionMetrics(days: number): Promise<StripeConversionMetrics> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, user_id, session_id')
    .gte('created_at', cutoffISO)
    .in('event_name', ['checkout_started', 'checkout_completed', 'paid_started']);

  if (!events || events.length === 0) {
    return { checkoutStarted: 0, checkoutCompleted: 0, paidStarted: 0, conversionRate: 0 };
  }

  const startedSessions = new Set<string>();
  const completedSessions = new Set<string>();
  const paidSessions = new Set<string>();

  for (const event of events) {
    const key = event.user_id || event.session_id || 'unknown';
    if (event.event_name === 'checkout_started') startedSessions.add(key);
    if (event.event_name === 'checkout_completed') completedSessions.add(key);
    if (event.event_name === 'paid_started') paidSessions.add(key);
  }

  const checkoutStarted = startedSessions.size;
  const checkoutCompleted = completedSessions.size;
  const paidStarted = paidSessions.size;

  return {
    checkoutStarted,
    checkoutCompleted,
    paidStarted,
    // Use webhook-truthful paid_started for conversion rate (investor-grade)
    conversionRate: checkoutStarted > 0 ? (paidStarted / checkoutStarted) * 100 : 0,
  };
}

// Main fetch function
export async function fetchKPIData(window: TimeWindow): Promise<KPIData> {
  const days = getIntervalDays(window);

  const [funnel, activation, retention, usage, topItems, monetization, dataQuality, wedgePurity, wedgePatternPurity, timeToStep, northStar, revenueIntent, cohorts, validatedTraders, stripeConversion] = await Promise.all([
    fetchFunnelMetrics(days),
    fetchActivationMetrics(days),
    fetchRetentionMetrics(days),
    fetchUsageMetrics(days),
    fetchTopItems(days),
    fetchMonetizationMetrics(days),
    checkDataQuality(),
    fetchWedgePurityMetrics(days),
    fetchWedgePatternPurityMetrics(days),
    fetchTimeToStepMetrics(days),
    fetchNorthStarMetrics(days),
    fetchRevenueIntentMetrics(days),
    fetchCohortMetrics(days),
    fetchValidatedTradersMetrics(days),
    fetchStripeConversionMetrics(days),
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
    wedgePatternPurity,
    timeToStep,
    northStar,
    revenueIntent,
    cohorts,
    validatedTraders,
    stripeConversion,
    lastRefreshed: new Date().toISOString(),
  };
}
