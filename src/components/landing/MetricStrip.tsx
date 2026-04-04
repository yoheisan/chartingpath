import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Layers, Database, Clock, Target } from "lucide-react";
import { useOutcomeCount } from "@/hooks/useOutcomeCount";
import { useMetricStripStats } from "@/hooks/useMetricStripStats";

interface MetricProps {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
}

const AnimatedMetric = ({ value, suffix, label, icon: Icon }: MetricProps) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 px-6 py-3">
      <Icon className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
      <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
        {value === 0 && suffix === 'R' ? '—' : `${display.toLocaleString()}${suffix}`}
      </div>
      <div className="text-sm uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

export const MetricStrip = () => {
  const { t } = useTranslation();
  const { count: outcomeCount } = useOutcomeCount();
  const { data: stats } = useMetricStripStats();

  const metrics: MetricProps[] = [
    { value: stats?.instrumentCount ?? 800, suffix: "+", label: t("metrics.instruments", "Instruments"), icon: BarChart3 },
    { value: stats?.patternCount ?? 17, suffix: "", label: t("metrics.patterns", "Patterns"), icon: Layers },
    { value: outcomeCount ?? 460000, suffix: "+", label: t("metrics.trades", "Backtested Outcomes"), icon: Database },
    { value: 1, suffix: "h", label: t("metrics.refresh", "Live Data Refresh"), icon: Clock },
    { value: stats?.avgExpectancy ?? 0.4, suffix: "R", label: t("metrics.avgExpectancy", "Avg Expectancy (A-Grade)"), icon: Target },
  ];

  return (
    <div className="flex flex-wrap justify-center divide-x divide-border/30 py-2 animate-fade-in">
      {metrics.map((m) => (
        <AnimatedMetric key={m.label} {...m} />
      ))}
    </div>
  );
};

export default MetricStrip;
