import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Users, MousePointerClick, AlertTriangle, TrendingUp, Globe, ArrowRight, Mail, Search } from "lucide-react";
import { format, subDays } from "date-fns";

interface ReportData {
  totalVisitors: number;
  totalPageViews: number;
  uniqueSessions: number;
  topPages: { path: string; views: number }[];
  authFunnel: { views: number; submissions: number; abandonRate: number };
  topSearches: { query: string; count: number }[];
  alertsTriggered: number;
  emailsSent: number;
  emailFailures: number;
  copilotQuestions: number;
  copilotHelpful: number;
  copilotUnhelpful: number;
  topCopilotTopics: { topic: string; count: number }[];
  trafficSources: { source: string; count: number }[];
  newSignups: number;
  landingCtaClicks: { button: string; count: number }[];
}

export function DailyReportPanel() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [daysBack, setDaysBack] = useState("1");

  const fetchReport = async () => {
    setLoading(true);
    const days = parseInt(daysBack);
    const since = subDays(new Date(), days).toISOString();

    try {
      const [
        analyticsRes,
        searchRes,
        alertsRes,
        alertsLogRes,
        copilotRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from("analytics_events").select("event_name, properties, session_id").gte("ts", since),
        supabase.from("instrument_search_analytics").select("search_query").gte("created_at", since),
        supabase.from("alerts").select("id").gte("created_at", since),
        supabase.from("alerts_log").select("email_sent").gte("triggered_at", since),
        supabase.from("copilot_feedback").select("response_helpful, topics, question").gte("created_at", since),
        supabase.from("profiles").select("user_id").gte("created_at", since),
      ]);

      const events = analyticsRes.data || [];
      const searches = searchRes.data || [];
      const alerts = alertsRes.data || [];
      const alertLogs = alertsLogRes.data || [];
      const feedback = copilotRes.data || [];
      const newUsers = profilesRes.data || [];

      // Page views
      const pageViews = events.filter(e => e.event_name === "page.view");
      const sessions = new Set(events.map(e => e.session_id).filter(Boolean));

      // Top pages
      const pageCounts: Record<string, number> = {};
      pageViews.forEach(e => {
        const path = (e.properties as any)?.path || "unknown";
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, views]) => ({ path, views }));

      // Auth funnel
      const authViews = pageViews.filter(e => (e.properties as any)?.path === "/auth").length;
      const authSubmissions = events.filter(e => e.event_name === "auth.submit" || e.event_name === "auth.signup").length;
      const authAbandonRate = authViews > 0 ? Math.round(((authViews - authSubmissions) / authViews) * 100) : 0;

      // Top searches
      const searchCounts: Record<string, number> = {};
      searches.forEach(s => {
        const q = s.search_query?.toLowerCase().trim();
        if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
      });
      const topSearches = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      // Alerts & emails
      const emailsSent = alertLogs.filter(l => l.email_sent).length;
      const emailFailures = alertLogs.filter(l => !l.email_sent).length;

      // Copilot
      const copilotHelpful = feedback.filter(f => f.response_helpful === true).length;
      const copilotUnhelpful = feedback.filter(f => f.response_helpful === false).length;
      const topicCounts: Record<string, number> = {};
      feedback.forEach(f => {
        (f.topics as string[] || []).forEach(t => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      });
      const topCopilotTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }));

      // Landing CTA clicks
      const ctaEvents = events.filter(e => e.event_name === "landing.cta_click");
      const ctaCounts: Record<string, number> = {};
      ctaEvents.forEach(e => {
        const btn = (e.properties as any)?.button || "unknown";
        ctaCounts[btn] = (ctaCounts[btn] || 0) + 1;
      });
      const landingCtaClicks = Object.entries(ctaCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([button, count]) => ({ button, count }));

      // Traffic sources (referrers)
      const refCounts: Record<string, number> = {};
      pageViews.forEach(e => {
        const ref = (e.properties as any)?.referrer;
        if (ref && ref !== "null") {
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
        .slice(0, 8)
        .map(([source, count]) => ({ source, count }));

      setReport({
        totalVisitors: sessions.size,
        totalPageViews: pageViews.length,
        uniqueSessions: sessions.size,
        topPages,
        authFunnel: { views: authViews, submissions: authSubmissions, abandonRate: authAbandonRate },
        topSearches,
        alertsTriggered: alerts.length,
        emailsSent,
        emailFailures,
        copilotQuestions: feedback.length,
        copilotHelpful,
        copilotUnhelpful,
        topCopilotTopics,
        trafficSources,
        newSignups: newUsers.length,
        landingCtaClicks,
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
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (!report) return <p className="text-muted-foreground">Failed to load report.</p>;

  const reportDate = parseInt(daysBack) === 1
    ? format(subDays(new Date(), 1), "MMM d, yyyy")
    : `${format(subDays(new Date(), parseInt(daysBack)), "MMM d")} – ${format(new Date(), "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Analytics Report</h2>
          <p className="text-muted-foreground">{reportDate}</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Unique Visitors" value={report.totalVisitors} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Page Views" value={report.totalPageViews} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="New Signups" value={report.newSignups} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Copilot Questions" value={report.copilotQuestions} icon={<Search className="h-4 w-4" />} />
      </div>

      {/* Auth Funnel & System Health */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Auth Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Auth page views</span><span className="font-medium">{report.authFunnel.views}</span></div>
            <div className="flex justify-between"><span>Form submissions</span><span className="font-medium">{report.authFunnel.submissions}</span></div>
            <div className="flex justify-between">
              <span>Abandon rate</span>
              <Badge variant={report.authFunnel.abandonRate > 50 ? "destructive" : "secondary"}>
                {report.authFunnel.abandonRate}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              System Health
              {report.emailFailures > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Alerts triggered</span><span className="font-medium">{report.alertsTriggered}</span></div>
            <div className="flex justify-between">
              <span>Emails sent</span>
              <span className="font-medium">{report.emailsSent}</span>
            </div>
            <div className="flex justify-between">
              <span>Email failures</span>
              <Badge variant={report.emailFailures > 0 ? "destructive" : "secondary"}>
                {report.emailFailures}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages & Searches */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {report.topPages.map((p, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-muted-foreground truncate max-w-[200px]">{p.path}</span>
                  <span className="font-medium">{p.views}</span>
                </div>
              ))}
              {report.topPages.length === 0 && <p className="text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Instrument Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {report.topSearches.map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{s.query}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
              {report.topSearches.length === 0 && <p className="text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Performance & Copilot */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Landing CTA Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {report.landingCtaClicks.map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{c.button}</span>
                  <span className="font-medium">{c.count} clicks</span>
                </div>
              ))}
              {report.landingCtaClicks.length === 0 && <p className="text-muted-foreground">No CTA clicks tracked</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Copilot Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>👍 Helpful</span><span className="font-medium">{report.copilotHelpful}</span></div>
            <div className="flex justify-between"><span>👎 Unhelpful</span><span className="font-medium">{report.copilotUnhelpful}</span></div>
            {report.topCopilotTopics.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Top topics</p>
                <div className="flex flex-wrap gap-1">
                  {report.topCopilotTopics.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t.topic} ({t.count})</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      {report.trafficSources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
