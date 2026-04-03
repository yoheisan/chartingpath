import { Link } from 'react-router-dom';
import { Radar, Database, Sparkles, Play, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Radar,
    headline: 'Live pattern detection across 20+ instruments',
    description:
      "ChartingPath scans FX majors and US equities in real time, detecting 15+ classical patterns as they form. Get alerted the moment a head & shoulders or triangle completes — before the breakout.",
    link: '/patterns/live',
  },
  {
    icon: Database,
    headline: 'The only pattern outcome database of its kind',
    description:
      "Every pattern we detect gets tracked through to its SL or TP. We accumulate real win rates by pattern type, timeframe, and instrument — data that doesn't exist anywhere else.",
    link: '/projects/pattern-lab/new',
  },
  {
    icon: Sparkles,
    headline: 'An AI trading assistant that learns from outcomes',
    description:
      "ChartingPath Copilot doesn't just read indicators — it reasons from 63K+ real pattern outcomes to give you context-aware trade analysis. The more patterns tracked, the smarter it gets.",
    link: '/copilot',
  },
  {
    icon: Play,
    headline: 'Simulate trades. Build the outcome record.',
    description:
      "Paper trade any detected pattern with one click. Every simulated trade feeds the outcome database — your trading improves and the platform's signal accuracy grows with it.",
    link: '/paper-trading',
  },
] as const;

export function FeatureBlocks() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map((feat) => (
            <div
              key={feat.headline}
              className="rounded-xl border border-border/40 bg-card/50 p-8 flex flex-col gap-4 transition-colors hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground leading-snug">
                {feat.headline}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
              <Link
                to={feat.link}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-auto"
              >
                Learn more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
