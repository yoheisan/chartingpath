import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Layers, Database, Clock, Timer } from "lucide-react";
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
    <div ref={ref} className="flex items-center gap-2 px-4 py-2">
      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
      <div className="text-center">
        <div className="text-lg font-bold text-foreground">
          {display.toLocaleString()}{suffix}
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">{label}</div>
      </div>
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

  const metrics: (MetricProps & { decimals?: number })[] = [
    { value: tickerCount, suffix: "+", label: t("metrics.instruments", "Instruments Scanned"), icon: BarChart3 },
    { value: 17, suffix: "", label: t("metrics.patterns", "Pattern Types"), icon: Layers },
    { value: 320000, suffix: "+", label: t("metrics.trades", "Historical Trades"), icon: Database },
    { value: 1, suffix: "h", label: t("metrics.refresh", "Refresh Cycle"), icon: Clock },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
      {metrics.map((m) => (
        <AnimatedMetric key={m.label} {...m} />
      ))}
    </div>
  );
};

export default MetricStrip;
