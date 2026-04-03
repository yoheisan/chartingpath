import { useHomepageStats } from '@/hooks/useHomepageStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Globe, Trophy } from 'lucide-react';

export function HeroStatsBar() {
  const { data, isLoading } = useHomepageStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      icon: Activity,
      value: `${data.patterns_this_week.toLocaleString()} patterns detected this week`,
    },
    {
      icon: Globe,
      value: `${data.instruments_tracked.toLocaleString()} instruments tracked`,
    },
    {
      icon: Trophy,
      value: `Top pattern this week: ${data.top_pattern} on ${data.top_instrument} — ${data.top_win_rate}% win rate`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3"
        >
          <stat.icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm text-muted-foreground">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
