import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  RefreshCw, Users, AlertTriangle, TrendingUp, TrendingDown,
  Globe, Search, Eye, MousePointerClick, ArrowDown, ArrowUp,
  Lightbulb, BarChart3, Zap, BookOpen, Bell, Mail, Brain,
  FileText, LayoutDashboard, Bot,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfDay, isSameDay, parseISO } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyBucket {
  date: string;
  sessions: number;
  pageViews: number;
  signups: number;
}

interface FunnelStep {
  label: string;
  count: number;
  pct: number;
}

interface ScrollSection {
  section: string;
  views: number;
  pctOfHero: number;
}

interface ContentItem {
  path: string;
  views: number;
  avgDuration: number;
}

interface Insight {
  type: "critical" | "warning" | "positive" | "info";
  title: string;
  detail: string;
}

interface CopilotQuestion {
  question: string;
  helpful: boolean | null;
}

interface ReportData {
  // KPIs
  totalVisitors: number;
  totalPageViews: number;
  newSignups: number;
  pagesPerSession: number;
  avgSessionDurationSec: number;
  bounceRate: number;

  // Daily trend
  dailyTrend: DailyBucket[];

  // Funnel
  authFunnel: FunnelStep[];

  // Landing
  landingScrollDepth: ScrollSection[];
  landingCtaClicks: { button: string; count: number; ctr: number }[];
  heroCtrPct: number;

  // Content
  topPages: { path: string; views: number }[];
  topContent: ContentItem[];
  topSearches: { query: string; count: number }[];

  // Feature adoption
  featureUsage: { feature: string; users: number }[];

  // Copilot
  copilotQuestions: number;
  copilotHelpful: number;
  copilotUnhelpful: number;
  copilotSatisfactionPct: number;
  topCopilotTopics: { topic: string; count: number }[];
  copilotSampleQuestions: CopilotQuestion[];

  // System health
  alertsTriggered: number;
  emailsSent: number;
  emailFailures: number;

  // Traffic
  trafficSources: { source: string; count: number }[];

  // Auto insights
  insights: Insight[];

  // Engagement extras
  backtestRuns: number;
  communityMessages: number;
  totalEvents: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DailyReportPanel() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [daysBack, setDaysBack] = useState("7");
  const [showNarrative, setShowNarrative] = useState(true);
  const [showBots, setShowBots] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const days = parseInt(daysBack);
    const since = subDays(new Date(), days).toISOString();

    try {
      // Paginate analytics_events to avoid the 1000-row default limit
      const fetchAllAnalytics = async () => {
        const allEvents: any[] = [];
        const PAGE_SIZE = 1000;
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from("analytics_events")
            .select("event_name, properties, session_id, ts")
            .gte("ts", since)
            .order("ts", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw error;
          allEvents.push(...(data || []));
          hasMore = (data?.length || 0) === PAGE_SIZE;
          from += PAGE_SIZE;
        }
        return allEvents;
      };

      const [
        analyticsEvents,
        searchRes,
        alertsRes,
        alertsLogRes,
        copilotRes,
        profilesRes,
        backtestRes,
        communityRes,
      ] = await Promise.all([
        fetchAllAnalytics(),
        supabase.from("instrument_search_analytics").select("search_query").gte("created_at", since),
        supabase.from("alerts").select("id").gte("created_at", since),
        supabase.from("alerts_log").select("email_sent").gte("triggered_at", since),
        supabase.from("copilot_feedback").select("response_helpful, topics, question").gte("created_at", since),
        supabase.from("profiles").select("user_id, created_at").gte("created_at", since),
        supabase.from("backtest_runs").select("id, user_id").gte("created_at", since),
        supabase.from("community_messages").select("id").gte("created_at", since),
      ]);

      const events = analyticsEvents || [];
      const searches = searchRes.data || [];
      const alerts = alertsRes.data || [];
      const alertLogs = alertsLogRes.data || [];
      const feedback = copilotRes.data || [];
      const newUsers = profilesRes.data || [];
      const backtestRuns = backtestRes.data || [];
      const communityMsgs = communityRes.data || [];

      const pageViews = events.filter(e => e.event_name === "page.view");
      const pageLeaves = events.filter(e => e.event_name === "page.leave");
      const allSessions = new Set(events.map(e => e.session_id).filter(Boolean));

      // ── Daily trend ──
      const dailyMap: Record<string, DailyBucket> = {};
      for (let d = 0; d < days; d++) {
        const date = format(subDays(new Date(), d), "yyyy-MM-dd");
        dailyMap[date] = { date, sessions: 0, pageViews: 0, signups: 0 };
      }
      const sessionDaySet: Record<string, Set<string>> = {};
      pageViews.forEach(e => {
        const day = e.ts?.substring(0, 10);
        if (day && dailyMap[day]) {
          dailyMap[day].pageViews++;
          if (e.session_id) {
            if (!sessionDaySet[day]) sessionDaySet[day] = new Set();
            sessionDaySet[day].add(e.session_id);
          }
        }
      });
      Object.entries(sessionDaySet).forEach(([day, s]) => {
        if (dailyMap[day]) dailyMap[day].sessions = s.size;
      });
      newUsers.forEach(u => {
        const day = u.created_at?.substring(0, 10);
        if (day && dailyMap[day]) dailyMap[day].signups++;
      });
      const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      // ── Session engagement ──
      const sessionPages: Record<string, number> = {};
      pageViews.forEach(e => {
        if (e.session_id) sessionPages[e.session_id] = (sessionPages[e.session_id] || 0) + 1;
      });
      const sessionCounts = Object.values(sessionPages);
      const pagesPerSession = sessionCounts.length > 0
        ? Math.round((sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length) * 10) / 10
        : 0;
      const bounceSessions = sessionCounts.filter(c => c <= 1).length;
      const bounceRate = sessionCounts.length > 0 ? Math.round((bounceSessions / sessionCounts.length) * 100) : 0;

      // Avg session duration from page.leave events
      const sessionDurations: Record<string, number> = {};
      pageLeaves.forEach(e => {
        const dur = (e.properties as any)?.duration_ms;
        if (e.session_id && dur) {
          sessionDurations[e.session_id] = (sessionDurations[e.session_id] || 0) + Number(dur);
        }
      });
      const durValues = Object.values(sessionDurations);
      const avgSessionDurationSec = durValues.length > 0
        ? Math.round(durValues.reduce((a, b) => a + b, 0) / durValues.length / 1000)
        : 0;

      // ── Auth funnel ──
      const authViews = pageViews.filter(e => (e.properties as any)?.path === "/auth").length;
      const authFormStarts = events.filter(e => e.event_name === "auth.form_start" || e.event_name === "auth_page.form_start").length;
      const authSubmissions = events.filter(e =>
        e.event_name === "auth.submit" || e.event_name === "auth.signup" || e.event_name === "auth_page.submitted"
      ).length;
      const authAbandon = events.filter(e => e.event_name === "auth.abandon" || e.event_name === "auth_page.abandoned").length;
      const authFunnel: FunnelStep[] = [
        { label: "Auth Page Views", count: authViews, pct: 100 },
        { label: "Form Started", count: authFormStarts, pct: authViews > 0 ? Math.round((authFormStarts / authViews) * 100) : 0 },
        { label: "Form Submitted", count: authSubmissions, pct: authViews > 0 ? Math.round((authSubmissions / authViews) * 100) : 0 },
        { label: "Abandoned", count: authAbandon, pct: authViews > 0 ? Math.round((authAbandon / authViews) * 100) : 0 },
      ];

      // ── Landing scroll depth ──
      const sectionEvents = events.filter(e => e.event_name === "landing.section_view");
      const sectionMap: Record<string, Set<string>> = {};
      sectionEvents.forEach(e => {
        const section = (e.properties as any)?.section || "unknown";
        if (!sectionMap[section]) sectionMap[section] = new Set();
        if (e.session_id) sectionMap[section].add(e.session_id);
      });
      const heroViews = sectionMap["hero"]?.size || Math.max(1, allSessions.size);
      const sectionOrder = ["hero", "how_it_works", "copilot_teaser", "screener_teaser", "edge_atlas", "action_cards", "pricing", "testimonials"];
      const landingScrollDepth: ScrollSection[] = sectionOrder
        .filter(s => sectionMap[s])
        .map(s => ({
          section: s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          views: sectionMap[s]?.size || 0,
          pctOfHero: Math.round(((sectionMap[s]?.size || 0) / heroViews) * 100),
        }));

      // ── Landing CTA ──
      const ctaEvents = events.filter(e => e.event_name === "landing.cta_click");
      const ctaCounts: Record<string, Set<string>> = {};
      ctaEvents.forEach(e => {
        const btn = (e.properties as any)?.button || "unknown";
        if (!ctaCounts[btn]) ctaCounts[btn] = new Set();
        if (e.session_id) ctaCounts[btn].add(e.session_id);
      });
      const landingCtaClicks = Object.entries(ctaCounts)
        .map(([button, sessions]) => ({
          button,
          count: sessions.size,
          ctr: heroViews > 0 ? Math.round((sessions.size / heroViews) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);
      const totalHeroClicks = landingCtaClicks
        .filter(c => c.button.toLowerCase().includes("hero"))
        .reduce((sum, c) => sum + c.count, 0);
      const heroCtrPct = heroViews > 0 ? Math.round((totalHeroClicks / heroViews) * 1000) / 10 : 0;

      // ── Top pages ──
      const pageCounts: Record<string, number> = {};
      pageViews.forEach(e => {
        const path = (e.properties as any)?.path || "unknown";
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([path, views]) => ({ path, views }));

      // ── Content performance (with avg time) ──
      const contentDurations: Record<string, number[]> = {};
      pageLeaves.forEach(e => {
        const path = (e.properties as any)?.path;
        const dur = (e.properties as any)?.duration_ms;
        if (path && dur) {
          if (!contentDurations[path]) contentDurations[path] = [];
          contentDurations[path].push(Number(dur));
        }
      });
      const topContent: ContentItem[] = Object.entries(pageCounts)
        .filter(([p]) => p.startsWith("/blog/") || p.startsWith("/edge-atlas/") || p.startsWith("/learn/"))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, views]) => {
          const durs = contentDurations[path] || [];
          const avg = durs.length > 0 ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length / 1000) : 0;
          return { path, views, avgDuration: avg };
        });

      // ── Top searches ──
      const searchCounts: Record<string, number> = {};
      searches.forEach(s => {
        const q = s.search_query?.toLowerCase().trim();
        if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
      });
      const topSearches = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      // ── Feature adoption ──
      const featureEvents: Record<string, Set<string>> = {};
      const featurePatterns: Record<string, string> = {
        "copilot.open": "Copilot",
        "pattern_lab.mode_select": "Pattern Lab",
        "script.generate": "Script Generator",
        "alert.create": "Alerts",
        "landing.cta_click": "Landing CTA",
      };
      events.forEach(e => {
        const feature = featurePatterns[e.event_name];
        if (feature && e.session_id) {
          if (!featureEvents[feature]) featureEvents[feature] = new Set();
          featureEvents[feature].add(e.session_id);
        }
      });
      if (backtestRuns.length > 0) {
        featureEvents["Backtester"] = new Set(backtestRuns.map(r => r.user_id).filter(Boolean));
      }
      const featureUsage = Object.entries(featureEvents)
        .map(([feature, sessions]) => ({ feature, users: sessions.size }))
        .sort((a, b) => b.users - a.users);

      // ── Copilot ──
      const copilotHelpful = feedback.filter(f => f.response_helpful === true).length;
      const copilotUnhelpful = feedback.filter(f => f.response_helpful === false).length;
      const ratedTotal = copilotHelpful + copilotUnhelpful;
      const copilotSatisfactionPct = ratedTotal > 0 ? Math.round((copilotHelpful / ratedTotal) * 100) : 0;
      const topicCounts: Record<string, number> = {};
      feedback.forEach(f => {
        (f.topics as string[] || []).forEach(t => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      });
      const topCopilotTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([topic, count]) => ({ topic, count }));

      // Sample copilot questions
      const copilotSampleQuestions: CopilotQuestion[] = feedback
        .filter(f => f.question)
        .slice(0, 10)
        .map(f => ({ question: f.question as string, helpful: f.response_helpful as boolean | null }));

      // ── System health ──
      const emailsSent = alertLogs.filter(l => l.email_sent).length;
      const emailFailures = alertLogs.filter(l => !l.email_sent).length;

      // ── Traffic sources ──
      const refCounts: Record<string, number> = {};
      pageViews.forEach(e => {
        const ref = (e.properties as any)?.referrer;
        if (ref && ref !== "null" && ref.length > 0) {
          try {
            const host = new URL(ref).hostname;
            refCounts[host] = (refCounts[host] || 0) + 1;
          } catch {
            refCounts[ref] = (refCounts[ref] || 0) + 1;
          }
        }
      });
      const trafficSources = Object.entries(refCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([source, count]) => ({ source, count }));

      // ── Auto insights ──
      const insights: Insight[] = [];

      // Auth issues
      const authDropOffPct = authViews > 0 ? Math.round(((authViews - authSubmissions) / authViews) * 100) : 0;
      if (authViews > 5 && authDropOffPct > 60) {
        insights.push({
          type: "critical",
          title: `Auth abandon rate: ${authDropOffPct}%`,
          detail: `${authViews} page views → only ${authSubmissions} submissions. Consider simplifying the sign-up flow or adding social login prominence.`,
        });
      }

      // Email failures
      if (emailFailures > 0 && emailsSent === 0) {
        insights.push({
          type: "critical",
          title: "Alert emails not sending",
          detail: `${alerts.length} alerts triggered but 0 emails sent (${emailFailures} failures). Check the send-alert-email edge function.`,
        });
      } else if (emailFailures > 0) {
        insights.push({
          type: "warning",
          title: `${emailFailures} email delivery failures`,
          detail: `${emailsSent} succeeded, ${emailFailures} failed. Check Resend API logs.`,
        });
      }

      // Hero CTA
      if (heroCtrPct < 5 && heroViews > 10) {
        insights.push({
          type: "warning",
          title: `Hero CTA: ${heroCtrPct}% CTR`,
          detail: `Only ${totalHeroClicks} hero clicks from ${heroViews} views. Consider stronger copy or visual emphasis.`,
        });
      }

      // Bounce rate
      if (bounceRate > 70 && allSessions.size > 10) {
        insights.push({
          type: "warning",
          title: `High bounce rate: ${bounceRate}%`,
          detail: `${bounceSessions} of ${sessionCounts.length} sessions viewed only 1 page. Improve landing engagement or add clearer navigation CTAs.`,
        });
      }

      // Scroll depth
      if (landingScrollDepth.length >= 3) {
        const thirdSection = landingScrollDepth[2];
        if (thirdSection.pctOfHero < 25) {
          insights.push({
            type: "warning",
            title: `${100 - thirdSection.pctOfHero}% drop-off by ${thirdSection.section}`,
            detail: `Most visitors don't scroll past "How It Works". Move high-converting elements higher.`,
          });
        }
      }

      // Signups
      if (newUsers.length === 0 && allSessions.size > 20) {
        insights.push({
          type: "critical",
          title: "Zero new sign-ups",
          detail: `${allSessions.size} sessions but no conversions. The auth flow or value prop may need work.`,
        });
      }

      // Content performing well
      if (topContent.length > 0 && topContent[0].views > 10) {
        insights.push({
          type: "positive",
          title: `Top content: ${topContent[0].path}`,
          detail: `${topContent[0].views} views with avg ${topContent[0].avgDuration}s read time. Consider adding stronger CTAs to this page.`,
        });
      }

      // Copilot quality
      if (copilotSatisfactionPct > 0 && copilotSatisfactionPct < 60 && ratedTotal > 3) {
        insights.push({
          type: "warning",
          title: `Copilot satisfaction: ${copilotSatisfactionPct}%`,
          detail: `${copilotUnhelpful} unhelpful ratings. Review negative feedback for content gaps.`,
        });
      } else if (copilotSatisfactionPct >= 80 && ratedTotal > 3) {
        insights.push({
          type: "positive",
          title: `Copilot satisfaction: ${copilotSatisfactionPct}%`,
          detail: `Strong approval rate from ${ratedTotal} rated interactions.`,
        });
      }

      // Feature adoption
      if (featureUsage.length > 0) {
        const topFeature = featureUsage[0];
        insights.push({
          type: "info",
          title: `Most used feature: ${topFeature.feature}`,
          detail: `${topFeature.users} unique users. ${featureUsage.length} features had engagement.`,
        });
      }

      setReport({
        totalVisitors: allSessions.size,
        totalPageViews: pageViews.length,
        newSignups: newUsers.length,
        pagesPerSession,
        avgSessionDurationSec,
        bounceRate,
        dailyTrend,
        authFunnel,
        landingScrollDepth,
        landingCtaClicks,
        heroCtrPct,
        topPages,
        topContent,
        topSearches,
        featureUsage,
        copilotQuestions: feedback.length,
        copilotHelpful,
        copilotUnhelpful,
        copilotSatisfactionPct,
        topCopilotTopics,
        copilotSampleQuestions,
        alertsTriggered: alerts.length,
        emailsSent,
        emailFailures,
        trafficSources,
        insights,
        backtestRuns: backtestRuns.length,
        communityMessages: communityMsgs.length,
        totalEvents: events.length,
      });
    } catch (err) {
      console.error("Failed to fetch daily report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [daysBack]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (!report) return <p className="text-muted-foreground">Failed to load report.</p>;

  const days = parseInt(daysBack);
  const reportDate = days === 1
    ? format(subDays(new Date(), 1), "MMM d, yyyy")
    : `${format(subDays(new Date(), days), "MMM d")} – ${format(new Date(), "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Report</h2>
          <p className="text-sm text-muted-foreground">{reportDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={daysBack} onValueChange={setDaysBack}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── View Toggle ── */}
      <Tabs value={showNarrative ? "narrative" : "dashboard"} onValueChange={(v) => setShowNarrative(v === "narrative")}>
        <TabsList>
          <TabsTrigger value="narrative" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Full Report
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Narrative Report ── */}
      {showNarrative && <NarrativeReport report={report} reportDate={reportDate} days={days} />}

      {!showNarrative && (<>

      {report.insights.length > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1 ${
                    insight.type === "critical" ? "bg-destructive/10 text-destructive" :
                    insight.type === "warning" ? "bg-yellow-500/10 text-yellow-600" :
                    insight.type === "positive" ? "bg-green-500/10 text-green-600" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {insight.type === "critical" ? <AlertTriangle className="h-3.5 w-3.5" /> :
                     insight.type === "warning" ? <AlertTriangle className="h-3.5 w-3.5" /> :
                     insight.type === "positive" ? <TrendingUp className="h-3.5 w-3.5" /> :
                     <Zap className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Sessions" value={report.totalVisitors} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Page Views" value={report.totalPageViews} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Sign-ups" value={report.newSignups} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Pages/Session" value={report.pagesPerSession} icon={<BarChart3 className="h-4 w-4" />} decimal />
        <MetricCard label="Avg Duration" value={report.avgSessionDurationSec} icon={<TrendingUp className="h-4 w-4" />} suffix="s" />
        <MetricCard label="Bounce Rate" value={report.bounceRate} icon={<ArrowDown className="h-4 w-4" />} suffix="%" bad={report.bounceRate > 70} />
      </div>

      {/* ── Daily Trend ── */}
      {report.dailyTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium border-b pb-1">
                <span>Date</span><span className="text-right">Sessions</span><span className="text-right">Page Views</span><span className="text-right">Sign-ups</span>
              </div>
              {report.dailyTrend.map((d, i) => {
                const prev = report.dailyTrend[i - 1];
                const sessChange = prev ? d.sessions - prev.sessions : 0;
                return (
                  <div key={d.date} className="grid grid-cols-4 text-sm py-1 border-b border-border/30">
                    <span className="text-muted-foreground">{format(parseISO(d.date), "MMM d (EEE)")}</span>
                    <span className="text-right font-medium flex items-center justify-end gap-1">
                      {d.sessions}
                      {sessChange !== 0 && (
                        <span className={`text-xs ${sessChange > 0 ? "text-green-500" : "text-destructive"}`}>
                          {sessChange > 0 ? "↑" : "↓"}{Math.abs(sessChange)}
                        </span>
                      )}
                    </span>
                    <span className="text-right font-medium">{d.pageViews}</span>
                    <span className="text-right font-medium">
                      {d.signups > 0 ? <Badge variant="default" className="text-xs">{d.signups}</Badge> : "0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Auth Funnel & Landing Scroll Depth ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Auth Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.authFunnel.map((step, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{step.label}</span>
                    <span className="font-medium">{step.count} <span className="text-muted-foreground text-xs">({step.pct}%)</span></span>
                  </div>
                  <Progress
                    value={step.pct}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Landing Page Scroll Depth</CardTitle>
          </CardHeader>
          <CardContent>
            {report.landingScrollDepth.length > 0 ? (
              <div className="space-y-3">
                {report.landingScrollDepth.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.section}</span>
                      <span className="font-medium">{s.views} <span className="text-muted-foreground text-xs">({s.pctOfHero}%)</span></span>
                    </div>
                    <Progress value={s.pctOfHero} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No scroll data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CTA Performance ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" /> Landing CTA Performance
            {report.heroCtrPct > 0 && (
              <Badge variant={report.heroCtrPct >= 5 ? "default" : "destructive"} className="text-xs ml-2">
                Hero CTR: {report.heroCtrPct}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.landingCtaClicks.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-2">
              {report.landingCtaClicks.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                  <span className="truncate max-w-[180px]">{c.button}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.count}</span>
                    <Badge variant={c.ctr >= 5 ? "default" : c.ctr >= 2 ? "secondary" : "outline"} className="text-xs">
                      {c.ctr}% CTR
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No CTA clicks tracked</p>
          )}
        </CardContent>
      </Card>

      {/* ── Top Pages & Content Performance ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm max-h-[300px] overflow-y-auto">
              {report.topPages.map((p, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-muted-foreground truncate max-w-[220px]">{p.path}</span>
                  <span className="font-medium">{p.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Content Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.topContent.length > 0 ? (
              <div className="space-y-1.5 text-sm max-h-[300px] overflow-y-auto">
                {report.topContent.map((c, i) => (
                  <div key={i} className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground truncate max-w-[180px]">{c.path}</span>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-medium">{c.views} views</span>
                      {c.avgDuration > 0 && (
                        <Badge variant="outline" className="text-xs">{c.avgDuration}s avg</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No content views</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Feature Adoption & Searches ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> Feature Adoption
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.featureUsage.length > 0 ? (
              <div className="space-y-2">
                {report.featureUsage.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{f.feature}</span>
                    <Badge variant="secondary">{f.users} users</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feature usage tracked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Top Instrument Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {report.topSearches.map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{s.query}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
              {report.topSearches.length === 0 && <p className="text-muted-foreground">No searches</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Copilot & System Health ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" /> Copilot Analytics
              {report.copilotSatisfactionPct > 0 && (
                <Badge variant={report.copilotSatisfactionPct >= 70 ? "default" : "destructive"} className="text-xs ml-auto">
                  {report.copilotSatisfactionPct}% satisfaction
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-muted/50">
                <p className="text-lg font-bold">{report.copilotQuestions}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="p-2 rounded bg-green-500/10">
                <p className="text-lg font-bold text-green-600">{report.copilotHelpful}</p>
                <p className="text-xs text-muted-foreground">Helpful</p>
              </div>
              <div className="p-2 rounded bg-destructive/10">
                <p className="text-lg font-bold text-destructive">{report.copilotUnhelpful}</p>
                <p className="text-xs text-muted-foreground">Unhelpful</p>
              </div>
            </div>
            {report.topCopilotTopics.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Top topics</p>
                <div className="flex flex-wrap gap-1">
                  {report.topCopilotTopics.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t.topic} ({t.count})</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> System Health
              {report.emailFailures > 0 && report.emailsSent === 0 && (
                <AlertTriangle className="h-4 w-4 text-destructive ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-muted/50">
                <p className="text-lg font-bold">{report.alertsTriggered}</p>
                <p className="text-xs text-muted-foreground">Alerts</p>
              </div>
              <div className="p-2 rounded bg-green-500/10">
                <p className="text-lg font-bold text-green-600">{report.emailsSent}</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
              <div className={`p-2 rounded ${report.emailFailures > 0 ? "bg-destructive/10" : "bg-muted/50"}`}>
                <p className={`text-lg font-bold ${report.emailFailures > 0 ? "text-destructive" : ""}`}>{report.emailFailures}</p>
                <p className="text-xs text-muted-foreground">Failures</p>
              </div>
            </div>
            {report.emailFailures > 0 && report.emailsSent === 0 && (
              <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                ⚠️ No emails delivered despite {report.alertsTriggered} alerts. Check send-alert-email function.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Traffic Sources ── */}
      {report.trafficSources.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              {report.trafficSources.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50">
                  <span className="truncate">{s.source}</span>
                  <span className="font-medium ml-2">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </>)}
    </div>
  );
}

// ─── Narrative Report ────────────────────────────────────────────────────────

function NarrativeReport({ report, reportDate, days }: { report: ReportData; reportDate: string; days: number }) {
  const peakDay = report.dailyTrend.reduce((max, d) => d.sessions > max.sessions ? d : max, report.dailyTrend[0]);
  const totalCtaClicks = report.landingCtaClicks.reduce((s, c) => s + c.count, 0);
  const authAbandonPct = report.authFunnel[0]?.count > 0
    ? Math.round(((report.authFunnel[0].count - (report.authFunnel[2]?.count || 0)) / report.authFunnel[0].count) * 100)
    : 0;

  const criticalIssues = report.insights.filter(i => i.type === "critical");
  const warnings = report.insights.filter(i => i.type === "warning");
  const positives = report.insights.filter(i => i.type === "positive");

  return (
    <Card>
      <CardContent className="pt-6 pb-6 prose prose-sm dark:prose-invert max-w-none">
        {/* Traffic Overview */}
        <h3 className="text-lg font-bold mb-3">📊 Traffic Overview ({reportDate})</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 font-medium">Day</th>
                <th className="text-right py-1.5 font-medium">Events</th>
                <th className="text-right py-1.5 font-medium">Sessions</th>
                <th className="text-right py-1.5 font-medium">Sign-ups</th>
              </tr>
            </thead>
            <tbody>
              {report.dailyTrend.map((d) => (
                <tr key={d.date} className="border-b border-border/30">
                  <td className="py-1.5">{format(parseISO(d.date), "MMM d")}</td>
                  <td className="text-right py-1.5">{d.pageViews}</td>
                  <td className="text-right py-1.5 font-medium">{d.sessions}</td>
                  <td className="text-right py-1.5">{d.signups > 0 ? <Badge variant="default" className="text-xs">{d.signups}</Badge> : "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          <strong>Trend:</strong> Sessions peaked on {peakDay ? format(parseISO(peakDay.date), "MMM d") : "N/A"} ({peakDay?.sessions || 0}).
          {report.newSignups === 0 && report.totalVisitors > 10
            ? ` Only ${report.newSignups} registered users, so all ${report.totalVisitors} sessions are anonymous visitors.`
            : ` ${report.newSignups} new sign-ups from ${report.totalVisitors} sessions.`
          }
          {` Bounce rate: ${report.bounceRate}%. Avg ${report.pagesPerSession} pages/session, ${report.avgSessionDurationSec}s avg duration.`}
        </p>

        {/* Critical Issues */}
        {criticalIssues.length > 0 && (
          <>
            <h3 className="text-lg font-bold mb-3">🚨 Critical Issues</h3>
            <ul className="space-y-2 mb-6 list-none pl-0">
              {criticalIssues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-destructive font-bold shrink-0">•</span>
                  <span><strong>{issue.title}</strong> — {issue.detail}</span>
                </li>
              ))}
              {report.backtestRuns === 0 && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-destructive font-bold shrink-0">•</span>
                  <span><strong>No backtest runs</strong> — Zero engagement with the backtester, suggesting visitors aren't discovering it or the auth wall blocks them.</span>
                </li>
              )}
              {report.communityMessages === 0 && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-destructive font-bold shrink-0">•</span>
                  <span><strong>No community messages</strong> — Zero community engagement in this period.</span>
                </li>
              )}
            </ul>
          </>
        )}

        {/* Landing Page Performance */}
        <h3 className="text-lg font-bold mb-3">🏠 Landing Page Performance</h3>
        
        {report.landingScrollDepth.length > 0 && (
          <>
            <p className="text-sm font-medium mb-2">Section scroll depth:</p>
            <ul className="space-y-1 mb-4 list-none pl-0">
              {report.landingScrollDepth.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-medium w-40">{s.section}:</span>
                  <span>{s.views} views</span>
                  <span className="text-muted-foreground">({s.pctOfHero}%)</span>
                  <span>{s.pctOfHero >= 70 ? "✅" : s.pctOfHero >= 25 ? "⚠️" : "🔴"}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {report.landingCtaClicks.length > 0 && (
          <>
            <p className="text-sm font-medium mb-2">CTA Clicks ({totalCtaClicks} total):</p>
            <ul className="space-y-1 mb-4 list-none pl-0">
              {report.landingCtaClicks.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-medium w-48">{c.button}:</span>
                  <span>{c.count} clicks</span>
                  <Badge variant={c.ctr >= 5 ? "default" : "outline"} className="text-xs">{c.ctr}% CTR</Badge>
                </li>
              ))}
            </ul>
          </>
        )}

        {report.heroCtrPct > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            <strong>Insight:</strong> Hero CTA at {report.heroCtrPct}% CTR.
            {report.landingScrollDepth.length >= 3 && report.landingScrollDepth[2].pctOfHero < 30
              ? ` Most visitors drop off before reaching ${report.landingScrollDepth[2].section} (${report.landingScrollDepth[2].pctOfHero}% retention).`
              : ""}
          </p>
        )}

        {/* Top Pages */}
        <h3 className="text-lg font-bold mb-3">📄 Top Pages Visited</h3>
        <ul className="space-y-1 mb-6 list-none pl-0">
          {report.topPages.slice(0, 10).map((p, i) => (
            <li key={i} className="flex items-center justify-between text-sm border-b border-border/30 py-1">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.path}</code>
              <span className="font-medium">{p.views} views</span>
            </li>
          ))}
        </ul>

        {/* Content Performance */}
        {report.topContent.length > 0 && (
          <>
            <h3 className="text-lg font-bold mb-3">📚 Content Performance</h3>
            <ul className="space-y-1 mb-6 list-none pl-0">
              {report.topContent.map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm border-b border-border/30 py-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.path}</code>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{c.views} views</span>
                    {c.avgDuration > 0 && <span className="text-muted-foreground">({c.avgDuration}s avg read)</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mb-6">
              <strong>Positive:</strong> Blog and educational content are getting organic traffic.
            </p>
          </>
        )}

        {/* Copilot */}
        <h3 className="text-lg font-bold mb-3">🤖 Copilot Usage</h3>
        <p className="text-sm mb-2">
          {report.copilotQuestions} questions asked.
          {report.copilotSatisfactionPct > 0 && ` Quality satisfaction: ${report.copilotSatisfactionPct}% (${report.copilotHelpful} helpful / ${report.copilotUnhelpful} unhelpful).`}
        </p>
        {report.copilotSampleQuestions.length > 0 && (
          <ul className="space-y-1 mb-4 list-none pl-0">
            {report.copilotSampleQuestions.slice(0, 5).map((q, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="shrink-0">{q.helpful === true ? "👍" : q.helpful === false ? "👎" : "💬"}</span>
                <span className="text-muted-foreground italic">"{q.question.substring(0, 120)}{q.question.length > 120 ? "..." : ""}"</span>
              </li>
            ))}
          </ul>
        )}
        {report.topCopilotTopics.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            <strong>Top topics:</strong> {report.topCopilotTopics.map(t => `${t.topic} (${t.count})`).join(", ")}
          </p>
        )}

        {/* System Health */}
        <h3 className="text-lg font-bold mb-3">⚙️ System Health</h3>
        <ul className="space-y-1 mb-6 list-none pl-0">
          <li className="text-sm">Alerts triggered: <strong>{report.alertsTriggered}</strong></li>
          <li className="text-sm">Emails sent: <strong>{report.emailsSent}</strong>{report.emailFailures > 0 && <Badge variant="destructive" className="ml-2 text-xs">{report.emailFailures} failures</Badge>}</li>
          <li className="text-sm">Backtest runs: <strong>{report.backtestRuns}</strong></li>
          <li className="text-sm">Community messages: <strong>{report.communityMessages}</strong></li>
        </ul>

        {/* Recommended Improvements */}
        {(criticalIssues.length > 0 || warnings.length > 0 || positives.length > 0) && (
          <>
            <h3 className="text-lg font-bold mb-3">🔧 Recommended Improvements</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 font-medium w-20">Priority</th>
                    <th className="text-left py-1.5 font-medium">Issue</th>
                    <th className="text-left py-1.5 font-medium">Suggested Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalIssues.map((issue, i) => (
                    <tr key={`c-${i}`} className="border-b border-border/30">
                      <td className="py-2"><Badge variant="destructive" className="text-xs">P0</Badge></td>
                      <td className="py-2 font-medium">{issue.title}</td>
                      <td className="py-2 text-muted-foreground">{issue.detail}</td>
                    </tr>
                  ))}
                  {warnings.map((issue, i) => (
                    <tr key={`w-${i}`} className="border-b border-border/30">
                      <td className="py-2"><Badge variant="secondary" className="text-xs">P1</Badge></td>
                      <td className="py-2 font-medium">{issue.title}</td>
                      <td className="py-2 text-muted-foreground">{issue.detail}</td>
                    </tr>
                  ))}
                  {positives.map((issue, i) => (
                    <tr key={`p-${i}`} className="border-b border-border/30">
                      <td className="py-2"><Badge variant="outline" className="text-xs">P2</Badge></td>
                      <td className="py-2 font-medium">{issue.title}</td>
                      <td className="py-2 text-muted-foreground">{issue.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Traffic Sources */}
        {report.trafficSources.length > 0 && (
          <>
            <h3 className="text-lg font-bold mt-6 mb-3">🌐 Traffic Sources</h3>
            <div className="flex flex-wrap gap-2">
              {report.trafficSources.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{s.source} ({s.count})</Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  suffix,
  decimal,
  bad,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
  decimal?: boolean;
  bad?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
          {icon}
          {label}
        </div>
        <p className={`text-xl font-bold ${bad ? "text-destructive" : ""}`}>
          {decimal ? value : value.toLocaleString()}{suffix || ""}
        </p>
      </CardContent>
    </Card>
  );
}
