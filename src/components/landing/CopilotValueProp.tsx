import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, RefreshCw, MessageSquareText, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { useTradingCopilotContext } from "@/components/copilot";

const differentiators = [
  {
    icon: Database,
    label: "Outcome-aware analysis",
    text: "Ask about any live pattern and Copilot surfaces historical win rates, average R-multiple, and best/worst conditions for that exact setup — from our own data.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: RefreshCw,
    label: "Gets smarter over time",
    text: "Every paper trade you run feeds the outcome database. Copilot's analysis improves as the dataset grows — it's the only trading AI with a feedback loop built in.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: MessageSquareText,
    label: "Plain language trade plans",
    text: "No jargon. Copilot explains the setup, suggests entry, stop, and target levels, and tells you what conditions would invalidate the trade.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
];

export function CopilotValueProp() {
  const copilot = useTradingCopilotContext();

  return (
    <section className="py-24 px-4 md:px-6 lg:px-8 border-t border-border/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
            ChartingPath Copilot
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
            An AI trading assistant built on outcome data — not just indicators
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Every other AI trading tool reads RSI and MACD. ChartingPath Copilot reasons from 63,000+ real pattern outcomes to give you analysis grounded in what actually happened — not what the textbooks say should happen.
          </p>
        </div>

        {/* 3 Differentiator Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {differentiators.map((d) => (
            <Card key={d.label} className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className={`inline-flex p-2.5 rounded-xl ${d.bg}`}>
                  <d.icon className={`h-6 w-6 ${d.color}`} />
                </div>
                <h3 className="text-lg font-semibold">{d.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA + Note */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8"
            onClick={() => {
              trackEvent("landing.cta_click", { button: "copilot_value_prop" });
              copilot.open();
            }}
          >
            <Bot className="h-5 w-5" />
            Try Copilot
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link
              to="/features/trading-copilot"
              onClick={() => trackEvent("landing.cta_click", { button: "copilot_learn_more" })}
            >
              Learn more
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Copilot is available on Pro and above. Paper trading simulation only — not financial advice.
        </p>
      </div>
    </section>
  );
}

export default CopilotValueProp;
