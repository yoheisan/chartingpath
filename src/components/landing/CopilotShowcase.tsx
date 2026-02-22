import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Database, Eye, Code2, Brain, Link2,
  ArrowRight, Bot, User, TrendingUp, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

const moatFeatures = [
  {
    icon: Activity,
    title: "Live Market Access",
    description: "Scans 8,500+ instruments for active pattern setups in real-time.",
    cantDo: "ChatGPT would say: \"I don't have access to real-time market data.\"",
    color: "text-amber-500",
  },
  {
    icon: Database,
    title: "320K+ Backtested Trades",
    description: "Answers \"what actually works?\" with real win rates from our Edge Atlas.",
    cantDo: "ChatGPT guesses: \"Generally 60-70% according to textbooks.\"",
    color: "text-violet-500",
  },
  {
    icon: Eye,
    title: "Chart Context Analysis",
    description: "Reads your chart indicators, S/R levels, RSI, MACD directly — no screenshots.",
    cantDo: "ChatGPT can only OCR blurry screenshots, losing precision.",
    color: "text-emerald-500",
  },
  {
    icon: Code2,
    title: "One-Click Pine Script",
    description: "Generates symbol-specific, context-aware Pine Script and MQL code.",
    cantDo: "ChatGPT produces generic templates without market context.",
    color: "text-cyan-500",
  },
  {
    icon: Brain,
    title: "Self-Improving AI",
    description: "Learns from real trading outcomes to auto-correct its analysis rules.",
    cantDo: "ChatGPT is a static model — it can't learn from your market.",
    color: "text-pink-500",
  },
  {
    icon: Link2,
    title: "Action Bridging",
    description: "Every response links to Pattern Lab, Edge Atlas, Alerts, and Scripts.",
    cantDo: "No external AI can link into ChartingPath's tools.",
    color: "text-blue-500",
  },
];

const demoMessages = [
  {
    role: "user" as const,
    content: "What bull flag setups are active on crypto right now?",
  },
  {
    role: "assistant" as const,
    content: null, // We render a custom table
  },
];

const demoResults = [
  { symbol: "BTC/USD", quality: "A", direction: "Bullish", entry: "67,420", sl: "65,800", tp: "71,200", rr: "2.3" },
  { symbol: "ETH/USD", quality: "B+", direction: "Bullish", entry: "3,580", sl: "3,440", tp: "3,860", rr: "2.0" },
  { symbol: "SOL/USD", quality: "A-", direction: "Bullish", entry: "148.50", sl: "142.00", tp: "162.00", rr: "2.1" },
];

export const CopilotShowcase = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            AI Copilot
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Use Our Copilot Instead of ChatGPT?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Six capabilities that are <strong className="text-foreground">impossible to replicate</strong> by pasting a chart into ChatGPT or Gemini.
          </p>
        </div>

        {/* 6-Card Moat Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {moatFeatures.map((feature) => (
            <Card key={feature.title} className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <p className="text-xs text-muted-foreground/70 italic border-t border-border/50 pt-3">
                  {feature.cantDo}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Conversation */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">See it in action</h3>
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Chat header */}
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Trading Copilot</span>
              <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
            </div>

            {/* User message */}
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="p-1.5 rounded-full bg-muted h-fit">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2.5 text-sm max-w-[85%]">
                  {demoMessages[0].content}
                </div>
              </div>

              {/* Copilot response */}
              <div className="flex gap-3">
                <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Found <strong className="text-foreground">3 bull flag setups</strong> on crypto (4H timeframe):
                  </p>
                  {/* Results table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Symbol</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Grade</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Entry</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">SL</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">TP</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">R:R</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demoResults.map((r) => (
                          <tr key={r.symbol} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">{r.symbol}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs font-mono">{r.quality}</Badge>
                            </td>
                            <td className="px-3 py-2 font-mono">{r.entry}</td>
                            <td className="px-3 py-2 font-mono text-destructive">{r.sl}</td>
                            <td className="px-3 py-2 font-mono text-emerald-500">{r.tp}</td>
                            <td className="px-3 py-2 font-mono">{r.rr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                      <TrendingUp className="h-3 w-3" /> Validate in Pattern Lab
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                      <Code2 className="h-3 w-3" /> Export Pine Script
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footnote */}
            <div className="px-4 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground text-center italic">
                💬 ChatGPT would say: "I don't have access to real-time market data."
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8 space-y-3">
            <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Link to="/features/trading-copilot">
                Learn More About the Copilot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Or press <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs font-mono">⌘K</kbd> to try it now
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CopilotShowcase;
