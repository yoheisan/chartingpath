import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Layers, Database, Clock, ShieldCheck } from "lucide-react";
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
  const visible = useRef(false);

  // Re-runs whenever `value` changes. The previous version latched on the very
  // first intersection, so a metric that arrived after the strip scrolled into
  // view stayed frozen at 0.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const run = () => {
      const duration = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    if (visible.current) {
      run();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible.current) {
          visible.current = true;
          run();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 px-6 py-3">
      <Icon className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
      <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
        {display.toLocaleString()}{suffix}
      </div>
      <div className="text-sm uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

export const MetricStrip = () => {
  const { t } = useTranslation();
  const { data: stats } = useMetricStripStats();

  // Hard guard: no partial strips. If any figure is missing or zero we render
  // nothing. Showing "0 labelled outcomes" on a statistics site is worse than
  // showing no strip at all.
  if (
    !stats ||
    !stats.instrumentCount ||
    !stats.patternCount ||
    !stats.validResolvedOutcomes ||
    !stats.validatedCells
  ) {
    return null;
  }

  const metrics: MetricProps[] = [
    { value: stats.instrumentCount, suffix: "", label: t("metrics.instruments", "Instruments"), icon: BarChart3 },
    { value: stats.patternCount, suffix: "", label: t("metrics.patterns", "Patterns"), icon: Layers },
    { value: stats.validResolvedOutcomes, suffix: "", label: t("metrics.trades", "Resolved Outcomes"), icon: Database },
    { value: 1, suffix: "h", label: t("metrics.refresh", "Live Data Refresh"), icon: Clock },
    // Deliberately NOT an "A-grade expectancy" headline: grade A measures
    // -0.105R over 48 occurrences and the grade ordering is inverted, so any
    // A-grade claim would be indefensible.
    { value: stats.validatedCells, suffix: "", label: t("metrics.validatedCells", "Combinations With Validated Edge"), icon: ShieldCheck },
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
