import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Layers, Database, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
        {display.toLocaleString()}{suffix}
      </div>
      <div className="text-sm uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

export const MetricStrip = () => {
  const { t } = useTranslation();
  const [tickerCount, setTickerCount] = useState(800);

  useEffect(() => {
    const fetch = async () => {
      const { count } = await supabase
        .from('instruments')
        .select('symbol', { count: 'exact', head: true })
        .eq('is_active', true);
      if (count != null) setTickerCount(count);
    };
    fetch();
  }, []);

  const metrics: MetricProps[] = [
    { value: tickerCount, suffix: "+", label: t("metrics.instruments", "Instruments Scanned Every Hour"), icon: BarChart3 },
    { value: 17, suffix: "", label: t("metrics.patterns", "Pattern Types Detected"), icon: Layers },
    { value: 320000, suffix: "+", label: t("metrics.trades", "Trades Backtested For You"), icon: Database },
    { value: 1, suffix: "h", label: t("metrics.refresh", "Live Data Refresh"), icon: Clock },
    { value: 62, suffix: "%", label: t("metrics.avgWinRate", "Avg Win Rate — Grade A Signals"), icon: Target },
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
