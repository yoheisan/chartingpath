import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MousePointerClick, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ButtonClick {
  button: string;
  count: number;
  uniqueSessions: number;
}

interface LandingStats {
  totalPageViews: number;
  totalClicks: number;
  uniqueClickers: number;
  ctr: number; // click-through rate: clickers / page views
  buttonBreakdown: ButtonClick[];
}

const BUTTON_LABELS: Record<string, string> = {
  hero_open_screener: '🔍 Hero → Open Screener',
  hero_create_alert: '🔔 Hero → Create Alert',
  edge_atlas_pattern: '🏆 Edge Atlas → Pattern Detail',
  edge_atlas_find_signals: '⚡ Edge Atlas → Find Signals',
  edge_atlas_validate: '🧪 Edge Atlas → Validate',
  screener_teaser_view_all: '📊 Screener Teaser → View All',
  action_card_dashboard: '📈 Action Card → Dashboard',
  action_card_screener: '🔍 Action Card → Screener',
  action_card_pattern_lab: '🧪 Action Card → Pattern Lab',
  action_card_alerts: '🔔 Action Card → Alerts',
  action_card_scripts: '📜 Action Card → Scripts',
  action_card_learn: '📚 Action Card → Learn',
  copilot_learn_more: '🤖 Copilot → Learn More',
  how_it_works_step_1: '1️⃣ How It Works → Discover',
  how_it_works_step_2: '2️⃣ How It Works → Research',
  how_it_works_step_3: '3️⃣ How It Works → Execute',
  how_it_works_step_4: '4️⃣ How It Works → Automate',
  pricing_teaser_see_full: '💰 Pricing → See Full',
};

interface Props {
  days: number;
}

export function LandingEngagementCard({ days }: Props) {
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [days]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      // Fetch landing page views
      const { data: pageViews } = await supabase
        .from('analytics_events')
        .select('session_id')
        .eq('event_name', 'page.view')
        .gte('ts', cutoff.toISOString())
        .filter('properties->>path', 'eq', '/');

      // Fetch landing CTA clicks
      const { data: clicks } = await supabase
        .from('analytics_events')
        .select('session_id, properties')
        .eq('event_name', 'landing.cta_click')
        .gte('ts', cutoff.toISOString());

      const totalPageViews = new Set((pageViews || []).map(r => r.session_id)).size;
      const uniqueClickers = new Set((clicks || []).map(r => r.session_id)).size;

      // Group by button
      const buttonMap = new Map<string, { count: number; sessions: Set<string> }>();
      for (const click of (clicks || [])) {
        const props = click.properties as Record<string, unknown> | null;
        const button = (props?.button as string) || 'unknown';
        if (!buttonMap.has(button)) {
          buttonMap.set(button, { count: 0, sessions: new Set() });
        }
        const entry = buttonMap.get(button)!;
        entry.count++;
        if (click.session_id) entry.sessions.add(click.session_id);
      }

      const buttonBreakdown: ButtonClick[] = [...buttonMap.entries()]
        .map(([button, data]) => ({
          button,
          count: data.count,
          uniqueSessions: data.sessions.size,
        }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalPageViews,
        totalClicks: (clicks || []).length,
        uniqueClickers,
        ctr: totalPageViews > 0 ? (uniqueClickers / totalPageViews) * 100 : 0,
        buttonBreakdown,
      });
    } catch (err) {
      console.error('Landing engagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.buttonBreakdown.map(b => b.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-primary" />
          Landing Page Engagement
        </CardTitle>
        <CardDescription>
          Which buttons visitors click on the homepage — last {days} days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{stats.totalPageViews}</p>
            <p className="text-sm text-muted-foreground">Landing Views</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <MousePointerClick className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{stats.totalClicks}</p>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{stats.uniqueClickers}</p>
            <p className="text-sm text-muted-foreground">Unique Clickers</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${stats.ctr >= 30 ? 'bg-green-500/10' : stats.ctr >= 15 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
            <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className={`text-xl font-bold ${stats.ctr >= 30 ? 'text-green-500' : stats.ctr >= 15 ? 'text-amber-500' : 'text-red-500'}`}>
              {stats.ctr.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">CTR</p>
          </div>
        </div>

        {/* Button breakdown */}
        {stats.buttonBreakdown.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No landing page clicks recorded yet. Data will appear once visitors interact with the homepage.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Click Breakdown</p>
            {stats.buttonBreakdown.map((item) => {
              const pct = (item.count / maxCount) * 100;
              const label = BUTTON_LABELS[item.button] || item.button;
              return (
                <div key={item.button} className="group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate max-w-[60%]">{label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {item.count}
                      </Badge>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {item.uniqueSessions} sess
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight */}
        {stats.buttonBreakdown.length > 0 && (
          <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
            <p>
              <strong>Top CTA:</strong> {BUTTON_LABELS[stats.buttonBreakdown[0]?.button] || stats.buttonBreakdown[0]?.button} ({stats.buttonBreakdown[0]?.count} clicks)
            </p>
            {stats.ctr < 15 && (
              <p className="text-amber-500">
                ⚠️ Low CTR ({stats.ctr.toFixed(1)}%) — visitors view but don't click. Consider making CTAs more prominent or above the fold.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
