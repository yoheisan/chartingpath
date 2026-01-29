// AI-Guided User Journey Analytics Service
// Provides comprehensive user flow analysis, critical path detection, and AI-powered recommendations

import { supabase } from '@/integrations/supabase/client';

// ============= TYPE DEFINITIONS =============

export interface JourneyNode {
  id: string;
  name: string;
  displayName: string;
  count: number;
  category: 'acquisition' | 'activation' | 'engagement' | 'monetization' | 'retention';
  isRequired: boolean;
  avgTimeFromPrevious?: number; // in minutes
  dropOffRate?: number;
}

export interface JourneyEdge {
  source: string;
  target: string;
  count: number;
  conversionRate: number;
  avgTimeMinutes: number;
  isCriticalPath: boolean;
  isBottleneck: boolean;
}

export interface JourneyFlow {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  criticalPath: string[];
  totalSessions: number;
  uniqueUsers: number;
}

export interface BrokenPath {
  stepFrom: string;
  stepTo: string;
  expectedConversion: number;
  actualConversion: number;
  dropOffCount: number;
  severity: 'critical' | 'warning' | 'info';
  potentialRevenueLoss: number;
  suggestedFix: string;
}

export interface ConversionFunnel {
  stage: string;
  displayName: string;
  count: number;
  rate: number;
  dropOff: number;
  avgTimeToNext: number | null;
  benchmarkRate: number;
  performance: 'above' | 'at' | 'below';
}

export interface AIInsight {
  id: string;
  category: 'critical' | 'improvement' | 'opportunity' | 'positive';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priorityScore: number; // 1-100
  suggestedActions: string[];
  affectedMetric: string;
  potentialLift: string;
  dataPoints: Record<string, number | string>;
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  avgLTV: number;
  conversionRate: number;
  characteristics: string[];
}

export interface TrafficSource {
  source: string;
  sessions: number;
  signups: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface LoopCompletionMetrics {
  overall: {
    completedCount: number;
    totalUsers: number;
    rate: number;
    target: number;
  };
  byTier: {
    free: { rate: number; target: number; onTarget: boolean };
    paid: { rate: number; target: number; onTarget: boolean };
  };
  byStage: {
    discover: { completed: number; percentage: number };
    research: { completed: number; percentage: number };
    execute: { completed: number; percentage: number };
    automate: { completed: number; percentage: number };
  };
  avgTimeToComplete: number; // hours
  medianTimeToComplete: number; // hours
}

export interface JourneyAnalytics {
  flow: JourneyFlow;
  brokenPaths: BrokenPath[];
  conversionFunnel: ConversionFunnel[];
  aiInsights: AIInsight[];
  userSegments: UserSegment[];
  trafficSources: TrafficSource[];
  loopCompletion: LoopCompletionMetrics;
  healthScore: number; // 0-100
  lastUpdated: string;
}

// ============= EVENT DEFINITIONS =============

// Journey stages aligned with user flow: Discover → Research → Execute → Automate
const JOURNEY_STAGES = {
  // Stage 1: DISCOVER (Screener)
  session_start: { displayName: 'Session Started', category: 'acquisition' as const, stage: 'discover', isRequired: false },
  landing_view: { displayName: 'Landing Viewed', category: 'acquisition' as const, stage: 'discover', isRequired: false },
  screener_view: { displayName: 'Screener Viewed', category: 'acquisition' as const, stage: 'discover', isRequired: true },
  pattern_clicked: { displayName: 'Pattern Clicked', category: 'activation' as const, stage: 'discover', isRequired: true },
  
  // Stage 2: RESEARCH (Pattern Lab / History)
  signup_completed: { displayName: 'Signed Up', category: 'activation' as const, stage: 'research', isRequired: true },
  pattern_lab_started: { displayName: 'Pattern Lab Started', category: 'activation' as const, stage: 'research', isRequired: false },
  preset_loaded: { displayName: 'Loaded Preset', category: 'activation' as const, stage: 'research', isRequired: true },
  backtest_started: { displayName: 'Started Backtest', category: 'activation' as const, stage: 'research', isRequired: false },
  backtest_completed: { displayName: 'Completed Backtest', category: 'activation' as const, stage: 'research', isRequired: true },
  result_summary_viewed: { displayName: 'Viewed Results', category: 'engagement' as const, stage: 'research', isRequired: false },
  
  // Stage 3: EXECUTE (TradingView / Alerts)
  tradingview_opened: { displayName: 'Opened TradingView', category: 'engagement' as const, stage: 'execute', isRequired: false },
  alert_created: { displayName: 'Created Alert', category: 'engagement' as const, stage: 'execute', isRequired: true },
  share_created: { displayName: 'Shared Result', category: 'engagement' as const, stage: 'execute', isRequired: false },
  
  // Stage 4: AUTOMATE (Scripts)
  scripts_page_viewed: { displayName: 'Scripts Page Viewed', category: 'engagement' as const, stage: 'automate', isRequired: false },
  pine_generated: { displayName: 'Generated Pine Script', category: 'engagement' as const, stage: 'automate', isRequired: true },
  pine_copied: { displayName: 'Copied Pine Script', category: 'engagement' as const, stage: 'automate', isRequired: false },
  pine_downloaded: { displayName: 'Downloaded Script', category: 'engagement' as const, stage: 'automate', isRequired: false },
  
  // Monetization (spans all stages)
  paywall_shown: { displayName: 'Paywall Shown', category: 'monetization' as const, stage: 'monetization', isRequired: false },
  pricing_viewed: { displayName: 'Viewed Pricing', category: 'monetization' as const, stage: 'monetization', isRequired: false },
  pricing_clicked: { displayName: 'Clicked Pricing', category: 'monetization' as const, stage: 'monetization', isRequired: false },
  checkout_started: { displayName: 'Started Checkout', category: 'monetization' as const, stage: 'monetization', isRequired: true },
  checkout_completed: { displayName: 'Completed Checkout', category: 'monetization' as const, stage: 'monetization', isRequired: false },
  paid_started: { displayName: 'Subscription Active', category: 'monetization' as const, stage: 'monetization', isRequired: true },
};

// Expected conversion benchmarks aligned with the 4-stage journey
const CONVERSION_BENCHMARKS: Record<string, number> = {
  // Discover stage
  'landing_view->screener_view': 65,
  'screener_view->pattern_clicked': 40,
  'pattern_clicked->signup_completed': 15,
  
  // Research stage
  'signup_completed->preset_loaded': 45,
  'preset_loaded->backtest_completed': 65,
  'backtest_completed->result_summary_viewed': 80,
  
  // Execute stage
  'result_summary_viewed->tradingview_opened': 35,
  'result_summary_viewed->alert_created': 25,
  'backtest_completed->alert_created': 25,
  
  // Automate stage
  'alert_created->scripts_page_viewed': 20,
  'scripts_page_viewed->pine_generated': 50,
  'pine_generated->pine_copied': 75,
  
  // Monetization
  'alert_created->paywall_shown': 40,
  'paywall_shown->pricing_clicked': 30,
  'pricing_clicked->checkout_started': 20,
  'checkout_started->paid_started': 70,
};

// ============= FETCH FUNCTIONS =============

async function fetchAllEvents(days: number): Promise<Array<{
  event_name: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
  event_props: Record<string, unknown> | null;
}>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const { data, error } = await supabase
    .from('product_events')
    .select('event_name, user_id, session_id, created_at, event_props')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  
  // Cast event_props to the expected type
  return (data || []).map(event => ({
    ...event,
    event_props: event.event_props as Record<string, unknown> | null,
  }));
}

// ============= ANALYSIS FUNCTIONS =============

function buildJourneyFlow(events: Array<{
  event_name: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
}>): JourneyFlow {
  // Count events by type
  const eventCounts: Record<string, number> = {};
  const uniqueUsers = new Set<string>();
  const uniqueSessions = new Set<string>();
  
  for (const event of events) {
    eventCounts[event.event_name] = (eventCounts[event.event_name] || 0) + 1;
    if (event.user_id) uniqueUsers.add(event.user_id);
    uniqueSessions.add(event.session_id);
  }
  
  // Build nodes
  const nodes: JourneyNode[] = Object.entries(JOURNEY_STAGES).map(([id, config]) => ({
    id,
    name: id,
    displayName: config.displayName,
    count: eventCounts[id] || 0,
    category: config.category,
    isRequired: config.isRequired,
  })).filter(node => node.count > 0);
  
  // Build edges - track user transitions
  const userJourneys: Record<string, Array<{ event: string; time: Date }>> = {};
  
  for (const event of events) {
    const key = event.user_id || event.session_id;
    if (!userJourneys[key]) userJourneys[key] = [];
    userJourneys[key].push({ event: event.event_name, time: new Date(event.created_at) });
  }
  
  // Calculate transitions
  const transitionCounts: Record<string, { count: number; totalTime: number }> = {};
  
  for (const journey of Object.values(userJourneys)) {
    // Sort by time
    journey.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    for (let i = 0; i < journey.length - 1; i++) {
      const key = `${journey[i].event}->${journey[i + 1].event}`;
      if (!transitionCounts[key]) transitionCounts[key] = { count: 0, totalTime: 0 };
      transitionCounts[key].count++;
      transitionCounts[key].totalTime += (journey[i + 1].time.getTime() - journey[i].time.getTime()) / 60000; // minutes
    }
  }
  
  // Build edges
  const edges: JourneyEdge[] = [];
  const criticalPathEvents = ['signup_completed', 'preset_loaded', 'backtest_completed', 'alert_created', 'checkout_started', 'paid_started'];
  
  for (const [key, data] of Object.entries(transitionCounts)) {
    const [source, target] = key.split('->');
    const sourceCount = eventCounts[source] || 1;
    const conversionRate = (data.count / sourceCount) * 100;
    
    const isCriticalPath = criticalPathEvents.includes(source) && criticalPathEvents.includes(target);
    const benchmark = CONVERSION_BENCHMARKS[key] || 50;
    const isBottleneck = conversionRate < benchmark * 0.7;
    
    edges.push({
      source,
      target,
      count: data.count,
      conversionRate,
      avgTimeMinutes: data.totalTime / data.count,
      isCriticalPath,
      isBottleneck,
    });
  }
  
  return {
    nodes,
    edges,
    criticalPath: criticalPathEvents.filter(e => eventCounts[e] > 0),
    totalSessions: uniqueSessions.size,
    uniqueUsers: uniqueUsers.size,
  };
}

function identifyBrokenPaths(flow: JourneyFlow): BrokenPath[] {
  const brokenPaths: BrokenPath[] = [];
  
  // Define expected critical transitions aligned with 4-stage journey
  const criticalTransitions = [
    // Discover stage
    { from: 'landing_view', to: 'screener_view', expected: 65 },
    { from: 'screener_view', to: 'pattern_clicked', expected: 40 },
    { from: 'pattern_clicked', to: 'signup_completed', expected: 15 },
    
    // Research stage
    { from: 'signup_completed', to: 'preset_loaded', expected: 45 },
    { from: 'preset_loaded', to: 'backtest_completed', expected: 65 },
    
    // Execute stage
    { from: 'backtest_completed', to: 'alert_created', expected: 25 },
    { from: 'backtest_completed', to: 'tradingview_opened', expected: 35 },
    
    // Automate stage
    { from: 'alert_created', to: 'scripts_page_viewed', expected: 20 },
    { from: 'scripts_page_viewed', to: 'pine_generated', expected: 50 },
    
    // Monetization
    { from: 'paywall_shown', to: 'pricing_clicked', expected: 30 },
    { from: 'pricing_clicked', to: 'checkout_started', expected: 20 },
    { from: 'checkout_started', to: 'paid_started', expected: 70 },
  ];
  
  for (const transition of criticalTransitions) {
    const edge = flow.edges.find(e => e.source === transition.from && e.target === transition.to);
    const sourceNode = flow.nodes.find(n => n.id === transition.from);
    
    if (!sourceNode || sourceNode.count === 0) continue;
    
    const actualRate = edge?.conversionRate || 0;
    const dropOffCount = sourceNode.count - (edge?.count || 0);
    const severity = 
      actualRate < transition.expected * 0.5 ? 'critical' :
      actualRate < transition.expected * 0.8 ? 'warning' : 'info';
    
    // Estimate revenue loss (assuming $20 avg subscription value)
    const potentialConversions = sourceNode.count * (transition.expected / 100);
    const actualConversions = edge?.count || 0;
    const lostConversions = Math.max(0, potentialConversions - actualConversions);
    const potentialRevenueLoss = lostConversions * 20 * 0.1; // 10% would convert to paid
    
    brokenPaths.push({
      stepFrom: JOURNEY_STAGES[transition.from as keyof typeof JOURNEY_STAGES]?.displayName || transition.from,
      stepTo: JOURNEY_STAGES[transition.to as keyof typeof JOURNEY_STAGES]?.displayName || transition.to,
      expectedConversion: transition.expected,
      actualConversion: actualRate,
      dropOffCount,
      severity,
      potentialRevenueLoss,
      suggestedFix: generateSuggestedFix(transition.from, transition.to, actualRate, transition.expected),
    });
  }
  
  return brokenPaths.filter(p => p.severity !== 'info').sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function generateSuggestedFix(from: string, to: string, actual: number, expected: number): string {
  const fixes: Record<string, string> = {
    // Discover stage
    'landing_view->screener_view': 'Make screener more prominent on landing. Add visual preview of active patterns above the fold.',
    'screener_view->pattern_clicked': 'Improve pattern card design. Add visual thumbnails and clearer signal strength indicators.',
    'pattern_clicked->signup_completed': 'Reduce friction in signup. Consider social login and highlight the value of creating an account.',
    
    // Research stage
    'signup_completed->preset_loaded': 'Add onboarding flow highlighting Pattern Lab. Consider auto-suggesting first analysis.',
    'preset_loaded->backtest_completed': 'Reduce friction in backtest setup. Pre-fill common parameters and add loading feedback.',
    
    // Execute stage
    'backtest_completed->alert_created': 'Make alert creation more prominent on results page. Add "Create Alert" CTA with 1-click action.',
    'backtest_completed->tradingview_opened': 'Make TradingView link more visible. Add educational content about analyzing in TradingView.',
    
    // Automate stage
    'alert_created->scripts_page_viewed': 'Add Scripts CTA in alert confirmation. Highlight automation benefits for repeat trades.',
    'scripts_page_viewed->pine_generated': 'Simplify script generation. Show preview and explain what the script does before generation.',
    
    // Monetization
    'paywall_shown->pricing_clicked': 'Improve paywall messaging. Highlight specific benefits user will get with upgrade.',
    'pricing_clicked->checkout_started': 'Simplify pricing page. Reduce options, add social proof and money-back guarantee.',
    'checkout_started->paid_started': 'Optimize checkout flow. Reduce form fields, add trust signals, ensure fast loading.',
  };
  
  return fixes[`${from}->${to}`] || 'Analyze user feedback and session recordings to identify friction points.';
}

function buildConversionFunnel(flow: JourneyFlow): ConversionFunnel[] {
  // Funnel aligned with 4-stage journey: Discover → Research → Execute → Automate
  const stages = [
    // Discover
    { id: 'landing_view', displayName: '1. Landing', benchmarkRate: 100 },
    { id: 'screener_view', displayName: '2. Screener', benchmarkRate: 65 },
    { id: 'pattern_clicked', displayName: '3. Pattern Detail', benchmarkRate: 40 },
    { id: 'signup_completed', displayName: '4. Signup', benchmarkRate: 15 },
    
    // Research  
    { id: 'backtest_completed', displayName: '5. Research Complete', benchmarkRate: 45 },
    
    // Execute
    { id: 'alert_created', displayName: '6. Alert/Execute', benchmarkRate: 25 },
    
    // Automate
    { id: 'pine_generated', displayName: '7. Script Generated', benchmarkRate: 15 },
    
    // Monetization
    { id: 'paid_started', displayName: '8. Paid Subscriber', benchmarkRate: 10 },
  ];
  
  const funnel: ConversionFunnel[] = [];
  let previousCount = flow.totalSessions;
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const node = flow.nodes.find(n => n.id === stage.id);
    const count = node?.count || (i === 0 ? flow.totalSessions : 0);
    const rate = previousCount > 0 ? (count / previousCount) * 100 : 0;
    const dropOff = previousCount - count;
    
    // Calculate avg time to next stage
    const nextStage = stages[i + 1];
    let avgTimeToNext: number | null = null;
    if (nextStage) {
      const edge = flow.edges.find(e => e.source === stage.id && e.target === nextStage.id);
      avgTimeToNext = edge?.avgTimeMinutes || null;
    }
    
    const performance = 
      rate >= stage.benchmarkRate * 1.1 ? 'above' :
      rate >= stage.benchmarkRate * 0.9 ? 'at' : 'below';
    
    funnel.push({
      stage: stage.id,
      displayName: stage.displayName,
      count,
      rate: i === 0 ? 100 : rate,
      dropOff,
      avgTimeToNext,
      benchmarkRate: stage.benchmarkRate,
      performance,
    });
    
    previousCount = count;
  }
  
  return funnel;
}

function generateAIInsights(
  flow: JourneyFlow,
  brokenPaths: BrokenPath[],
  funnel: ConversionFunnel[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Critical: Identify biggest drop-off points
  const criticalDropOffs = brokenPaths.filter(p => p.severity === 'critical');
  for (const dropOff of criticalDropOffs) {
    insights.push({
      id: `critical-${dropOff.stepFrom}-${dropOff.stepTo}`,
      category: 'critical',
      title: `Critical Drop-off: ${dropOff.stepFrom} → ${dropOff.stepTo}`,
      description: `Only ${dropOff.actualConversion.toFixed(1)}% of users transition from ${dropOff.stepFrom} to ${dropOff.stepTo}, compared to the ${dropOff.expectedConversion}% benchmark. This represents ${dropOff.dropOffCount} lost users.`,
      impact: 'high',
      effort: 'medium',
      priorityScore: 95 - (dropOff.actualConversion / dropOff.expectedConversion) * 30,
      suggestedActions: [dropOff.suggestedFix],
      affectedMetric: 'Conversion Rate',
      potentialLift: `+${((dropOff.expectedConversion - dropOff.actualConversion) * 0.5).toFixed(1)}% conversion`,
      dataPoints: {
        actualRate: dropOff.actualConversion,
        expectedRate: dropOff.expectedConversion,
        droppedUsers: dropOff.dropOffCount,
      },
    });
  }
  
  // Improvement: Time-based optimizations
  const slowTransitions = flow.edges.filter(e => e.avgTimeMinutes > 60 && e.isCriticalPath);
  for (const transition of slowTransitions) {
    insights.push({
      id: `slow-${transition.source}-${transition.target}`,
      category: 'improvement',
      title: `Slow Transition: ${JOURNEY_STAGES[transition.source as keyof typeof JOURNEY_STAGES]?.displayName || transition.source}`,
      description: `Users take ${(transition.avgTimeMinutes / 60).toFixed(1)} hours on average to move to the next step. Faster transitions correlate with higher conversion.`,
      impact: 'medium',
      effort: 'low',
      priorityScore: 70,
      suggestedActions: [
        'Add email/push reminders for incomplete journeys',
        'Simplify the transition with clearer CTAs',
        'Consider reducing friction or required inputs',
      ],
      affectedMetric: 'Time to Conversion',
      potentialLift: '-50% time to convert',
      dataPoints: {
        avgMinutes: transition.avgTimeMinutes,
        transitionCount: transition.count,
      },
    });
  }
  
  // Opportunity: High-performing segments
  const highPerformers = funnel.filter(s => s.performance === 'above');
  if (highPerformers.length > 0) {
    insights.push({
      id: 'opportunity-high-performers',
      category: 'opportunity',
      title: 'Above-Benchmark Performance Detected',
      description: `${highPerformers.map(s => s.displayName).join(', ')} stages are performing above benchmark. Analyze what's working and replicate.`,
      impact: 'medium',
      effort: 'low',
      priorityScore: 60,
      suggestedActions: [
        'Document current best practices for these stages',
        'Apply learnings to underperforming stages',
        'Consider A/B testing to isolate success factors',
      ],
      affectedMetric: 'Overall Funnel Health',
      potentialLift: '+10-20% in underperforming stages',
      dataPoints: {
        stagesAboveBenchmark: highPerformers.length,
      },
    });
  }
  
  // Positive: Healthy metrics
  const healthyPaths = brokenPaths.filter(p => p.actualConversion >= p.expectedConversion * 0.9);
  if (healthyPaths.length >= 3) {
    insights.push({
      id: 'positive-healthy-funnel',
      category: 'positive',
      title: 'Core Funnel Health is Strong',
      description: `${healthyPaths.length} critical path segments are performing at or above benchmark. Focus on optimizing the remaining weak points.`,
      impact: 'low',
      effort: 'low',
      priorityScore: 40,
      suggestedActions: ['Continue monitoring these segments', 'Document what makes them successful'],
      affectedMetric: 'Funnel Health',
      potentialLift: 'Maintain current performance',
      dataPoints: {
        healthySegments: healthyPaths.length,
      },
    });
  }
  
  // Sort by priority score
  return insights.sort((a, b) => b.priorityScore - a.priorityScore);
}

function segmentUsers(events: Array<{
  event_name: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
}>): UserSegment[] {
  const userEvents: Record<string, Set<string>> = {};
  
  for (const event of events) {
    const key = event.user_id || event.session_id;
    if (!userEvents[key]) userEvents[key] = new Set();
    userEvents[key].add(event.event_name);
  }
  
  const segments: UserSegment[] = [
    {
      id: 'full-journey',
      name: 'Full Journey Completed',
      description: 'Completed all 4 stages: Discover → Research → Execute → Automate',
      count: 0,
      percentage: 0,
      avgLTV: 360,
      conversionRate: 40,
      characteristics: ['Used scripts', 'Created alerts', 'High engagement'],
    },
    {
      id: 'executors',
      name: 'Executors',
      description: 'Reached Execute stage (created alerts or opened TradingView)',
      count: 0,
      percentage: 0,
      avgLTV: 120,
      conversionRate: 20,
      characteristics: ['Created alerts', 'Active trading intent'],
    },
    {
      id: 'researchers',
      name: 'Researchers',
      description: 'Completed Research stage (ran backtests)',
      count: 0,
      percentage: 0,
      avgLTV: 60,
      conversionRate: 8,
      characteristics: ['Completed backtests', 'Viewed results'],
    },
    {
      id: 'discoverers',
      name: 'Discoverers',
      description: 'Engaged with Discover stage (viewed screener, clicked patterns)',
      count: 0,
      percentage: 0,
      avgLTV: 15,
      conversionRate: 2,
      characteristics: ['Browsed screener', 'Viewed patterns'],
    },
    {
      id: 'bounced',
      name: 'Bounced',
      description: 'Session started but didn\'t engage with journey',
      count: 0,
      percentage: 0,
      avgLTV: 0,
      conversionRate: 0,
      characteristics: ['Quick exit', 'No pattern interaction'],
    },
  ];
  
  const totalUsers = Object.keys(userEvents).length;
  
  for (const events of Object.values(userEvents)) {
    // Full Journey: Has script + alert
    if (events.has('pine_generated') || events.has('pine_copied')) {
      segments[0].count++;
    } 
    // Executors: Has alert or TradingView
    else if (events.has('alert_created') || events.has('tradingview_opened')) {
      segments[1].count++;
    } 
    // Researchers: Has backtest
    else if (events.has('backtest_completed') || events.has('result_summary_viewed')) {
      segments[2].count++;
    } 
    // Discoverers: Has screener or pattern interaction
    else if (events.has('screener_view') || events.has('pattern_clicked') || events.has('signup_completed')) {
      segments[3].count++;
    } 
    // Bounced
    else {
      segments[4].count++;
    }
  }
  
  for (const segment of segments) {
    segment.percentage = totalUsers > 0 ? (segment.count / totalUsers) * 100 : 0;
  }
  
  return segments;
}

function analyzeTrafficSources(events: Array<{
  event_name: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
  event_props: Record<string, unknown> | null;
}>): TrafficSource[] {
  // Group by session and extract source from props
  const sessionData: Record<string, {
    source: string;
    hasSignup: boolean;
    hasPaid: boolean;
    events: number;
    firstEvent: Date;
    lastEvent: Date;
  }> = {};
  
  for (const event of events) {
    const source = (event.event_props?.source as string) || 
                   (event.event_props?.utm_source as string) || 
                   'direct';
    
    if (!sessionData[event.session_id]) {
      sessionData[event.session_id] = {
        source,
        hasSignup: false,
        hasPaid: false,
        events: 0,
        firstEvent: new Date(event.created_at),
        lastEvent: new Date(event.created_at),
      };
    }
    
    sessionData[event.session_id].events++;
    sessionData[event.session_id].lastEvent = new Date(event.created_at);
    
    if (event.event_name === 'signup_completed') sessionData[event.session_id].hasSignup = true;
    if (event.event_name === 'paid_started') sessionData[event.session_id].hasPaid = true;
  }
  
  // Aggregate by source
  const sourceStats: Record<string, {
    sessions: number;
    signups: number;
    conversions: number;
    totalDuration: number;
    bounces: number;
  }> = {};
  
  for (const session of Object.values(sessionData)) {
    if (!sourceStats[session.source]) {
      sourceStats[session.source] = { sessions: 0, signups: 0, conversions: 0, totalDuration: 0, bounces: 0 };
    }
    
    sourceStats[session.source].sessions++;
    if (session.hasSignup) sourceStats[session.source].signups++;
    if (session.hasPaid) sourceStats[session.source].conversions++;
    sourceStats[session.source].totalDuration += (session.lastEvent.getTime() - session.firstEvent.getTime()) / 60000;
    if (session.events <= 1) sourceStats[session.source].bounces++;
  }
  
  return Object.entries(sourceStats).map(([source, stats]) => ({
    source,
    sessions: stats.sessions,
    signups: stats.signups,
    conversions: stats.conversions,
    conversionRate: stats.sessions > 0 ? (stats.conversions / stats.sessions) * 100 : 0,
    avgSessionDuration: stats.sessions > 0 ? stats.totalDuration / stats.sessions : 0,
    bounceRate: stats.sessions > 0 ? (stats.bounces / stats.sessions) * 100 : 0,
  })).sort((a, b) => b.sessions - a.sessions);
}

function calculateHealthScore(
  funnel: ConversionFunnel[],
  brokenPaths: BrokenPath[]
): number {
  let score = 100;
  
  // Deduct for critical broken paths
  const criticalCount = brokenPaths.filter(p => p.severity === 'critical').length;
  score -= criticalCount * 15;
  
  // Deduct for warning paths
  const warningCount = brokenPaths.filter(p => p.severity === 'warning').length;
  score -= warningCount * 5;
  
  // Bonus for above-benchmark performance
  const aboveBenchmark = funnel.filter(s => s.performance === 'above').length;
  score += aboveBenchmark * 3;
  
  return Math.max(0, Math.min(100, score));
}

// ============= LOOP COMPLETION RATE =============

/**
 * Calculate Loop Completion Rate - the core business KPI
 * 
 * A "completed loop" means a user has touched all 4 stages within 7 days:
 * 1. Discover: screener_view OR pattern_clicked
 * 2. Research: backtest_completed OR result_summary_viewed
 * 3. Execute: tradingview_opened OR alert_created
 * 4. Automate: pine_generated OR pine_copied
 */
function calculateLoopCompletion(events: Array<{
  event_name: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
}>): LoopCompletionMetrics {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  
  // Stage event mappings (aligned with BUSINESS_MODEL.stages)
  const stageEvents = {
    discover: new Set(['screener_view', 'pattern_clicked']),
    research: new Set(['backtest_completed', 'result_summary_viewed']),
    execute: new Set(['tradingview_opened', 'alert_created']),
    automate: new Set(['pine_generated', 'pine_copied']),
  };
  
  // Group events by user
  const userJourneys: Record<string, Array<{ event: string; time: Date }>> = {};
  
  for (const event of events) {
    const key = event.user_id || event.session_id;
    if (!userJourneys[key]) userJourneys[key] = [];
    userJourneys[key].push({ event: event.event_name, time: new Date(event.created_at) });
  }
  
  // Analyze each user's journey
  let completedLoops = 0;
  const completionTimes: number[] = [];
  const stageCompletion = {
    discover: 0,
    research: 0,
    execute: 0,
    automate: 0,
  };
  
  // Track free vs paid (we'll use paid_started event to distinguish)
  let freeCompleted = 0;
  let freeTotal = 0;
  let paidCompleted = 0;
  let paidTotal = 0;
  
  for (const [, journey] of Object.entries(userJourneys)) {
    journey.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    const isPaid = journey.some(e => e.event === 'paid_started');
    if (isPaid) paidTotal++; else freeTotal++;
    
    // Find first occurrence of each stage
    const stageFirstOccurrence: Record<string, Date | null> = {
      discover: null,
      research: null,
      execute: null,
      automate: null,
    };
    
    for (const entry of journey) {
      for (const [stage, eventSet] of Object.entries(stageEvents)) {
        if (eventSet.has(entry.event) && !stageFirstOccurrence[stage]) {
          stageFirstOccurrence[stage] = entry.time;
        }
      }
    }
    
    // Check which stages were completed
    const stagesCompleted = Object.entries(stageFirstOccurrence).filter(([, time]) => time !== null);
    
    for (const [stage] of stagesCompleted) {
      stageCompletion[stage as keyof typeof stageCompletion]++;
    }
    
    // Check if full loop completed within 7 days
    const allStagesCompleted = stagesCompleted.length === 4;
    if (allStagesCompleted) {
      const times = Object.values(stageFirstOccurrence).filter((t): t is Date => t !== null);
      const firstTime = Math.min(...times.map(t => t.getTime()));
      const lastTime = Math.max(...times.map(t => t.getTime()));
      const duration = lastTime - firstTime;
      
      if (duration <= SEVEN_DAYS_MS) {
        completedLoops++;
        completionTimes.push(duration / (60 * 60 * 1000)); // hours
        
        if (isPaid) paidCompleted++; else freeCompleted++;
      }
    }
  }
  
  const totalUsers = Object.keys(userJourneys).length;
  const overallRate = totalUsers > 0 ? completedLoops / totalUsers : 0;
  
  // Calculate avg and median completion times
  const avgTime = completionTimes.length > 0 
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
    : 0;
  
  const sortedTimes = [...completionTimes].sort((a, b) => a - b);
  const medianTime = sortedTimes.length > 0 
    ? sortedTimes[Math.floor(sortedTimes.length / 2)] 
    : 0;
  
  // Targets from business model
  const FREE_TARGET = 0.15;
  const PAID_TARGET = 0.40;
  
  const freeRate = freeTotal > 0 ? freeCompleted / freeTotal : 0;
  const paidRate = paidTotal > 0 ? paidCompleted / paidTotal : 0;
  
  return {
    overall: {
      completedCount: completedLoops,
      totalUsers,
      rate: overallRate,
      target: FREE_TARGET, // Use free target as overall baseline
    },
    byTier: {
      free: {
        rate: freeRate,
        target: FREE_TARGET,
        onTarget: freeRate >= FREE_TARGET,
      },
      paid: {
        rate: paidRate,
        target: PAID_TARGET,
        onTarget: paidRate >= PAID_TARGET,
      },
    },
    byStage: {
      discover: {
        completed: stageCompletion.discover,
        percentage: totalUsers > 0 ? (stageCompletion.discover / totalUsers) * 100 : 0,
      },
      research: {
        completed: stageCompletion.research,
        percentage: totalUsers > 0 ? (stageCompletion.research / totalUsers) * 100 : 0,
      },
      execute: {
        completed: stageCompletion.execute,
        percentage: totalUsers > 0 ? (stageCompletion.execute / totalUsers) * 100 : 0,
      },
      automate: {
        completed: stageCompletion.automate,
        percentage: totalUsers > 0 ? (stageCompletion.automate / totalUsers) * 100 : 0,
      },
    },
    avgTimeToComplete: avgTime,
    medianTimeToComplete: medianTime,
  };
}

// ============= MAIN EXPORT =============

export async function fetchJourneyAnalytics(days: number = 30): Promise<JourneyAnalytics> {
  const events = await fetchAllEvents(days);
  
  const flow = buildJourneyFlow(events);
  const brokenPaths = identifyBrokenPaths(flow);
  const conversionFunnel = buildConversionFunnel(flow);
  const aiInsights = generateAIInsights(flow, brokenPaths, conversionFunnel);
  const userSegments = segmentUsers(events);
  const trafficSources = analyzeTrafficSources(events);
  const loopCompletion = calculateLoopCompletion(events);
  const healthScore = calculateHealthScore(conversionFunnel, brokenPaths);
  
  return {
    flow,
    brokenPaths,
    conversionFunnel,
    aiInsights,
    userSegments,
    trafficSources,
    loopCompletion,
    healthScore,
    lastUpdated: new Date().toISOString(),
  };
}
