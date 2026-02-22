import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import {
  Bot, ArrowRight, Activity, Database, Eye, Code2, Brain, Link2,
  Search, Bell, FileCode, FlaskConical, CheckCircle, X
} from "lucide-react";
import { Link } from "react-router-dom";


// Moat features — expanded for the feature page
const moatFeatures = [
  {
    icon: Activity,
    title: "Live Pattern Database",
    description: "The Copilot calls search_patterns to scan 8,500+ instruments across stocks, forex, crypto, and commodities for active pattern setups — in real-time, on closed candles.",
    whyCant: "ChatGPT has no live market data access. It cannot scan instruments or detect patterns.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Database,
    title: "320K+ Backtested Edge Atlas",
    description: "Ask \"what actually works?\" and get real statistics from our proprietary dataset of 320,000+ historically validated pattern trades with win rates, expectancy, and R-multiples.",
    whyCant: "No public AI has access to this proprietary dataset. Generic AI can only cite textbook estimates.",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Eye,
    title: "Chart Context Analysis",
    description: "Send your actual chart directly from the platform — indicators, support/resistance levels, RSI, MACD, ATR are all read with full precision. No screenshots needed.",
    whyCant: "ChatGPT can only OCR uploaded screenshots, losing indicator precision and context.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Code2,
    title: "One-Click Pine Script & MQL",
    description: "The Copilot generates ready-to-use trading scripts with the exact pattern, symbol, timeframe, and entry/exit levels pre-filled from your current analysis context.",
    whyCant: "ChatGPT generates generic templates without your specific market context or parameters.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Brain,
    title: "Self-Improving Rules",
    description: "copilot_learned_rules auto-patches known errors at runtime — correcting unit conversions, improving pattern recommendations, and adapting to market regime changes without code deploys.",
    whyCant: "ChatGPT is a static model. It cannot learn from market outcomes or correct domain-specific errors.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Link2,
    title: "Action Bridging",
    description: "Every response includes deep links to Pattern Lab validation, Edge Atlas stats, alert creation, and script export — turning insights into executable actions in one click.",
    whyCant: "No external AI can link into ChartingPath's integrated tool ecosystem.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

// Side-by-side comparison challenges
const challenges = [
  {
    prompt: "Show me bull flags on crypto right now",
    copilot: {
      type: "table",
      summary: "Found 3 bull flag setups on crypto (4H, closed candles):",
      rows: [
        { symbol: "BTC/USD", grade: "A", rr: "2.3" },
        { symbol: "ETH/USD", grade: "B+", rr: "2.0" },
        { symbol: "SOL/USD", grade: "A-", rr: "2.1" },
      ],
      hasActions: true,
    },
    generic: "I don't have access to real-time market data. I can explain what bull flags look like...",
  },
  {
    prompt: "What's the win rate of ascending triangles on stocks?",
    copilot: {
      type: "stats",
      summary: "Based on 12,847 validated ascending triangle trades on stocks:",
      stats: [
        { label: "Win Rate (2:1 R:R)", value: "62.4%" },
        { label: "Avg Expectancy", value: "0.38R" },
        { label: "Best Timeframe", value: "4H" },
      ],
      hasActions: true,
    },
    generic: "Ascending triangles generally have a success rate of 60-70% according to Thomas Bulkowski's research...",
  },
  {
    prompt: "Generate a Pine Script for this AAPL head & shoulders setup",
    copilot: {
      type: "code",
      summary: "Here's a Pine Script for AAPL Head & Shoulders (4H, entry: $185.40, SL: $188.20, TP: $179.80):",
      code: '//@version=5\nstrategy("AAPL H&S", overlay=true)\n// Entry: 185.40 | SL: 188.20 | TP: 179.80\n// ... 47 more lines with position sizing',
      hasActions: true,
    },
    generic: "Here's a basic head and shoulders Pine Script template:\n//@version=5\n// Generic template without specific levels...",
  },
];

// Workflow loop steps
const workflowSteps = [
  { icon: Search, label: "Discover", description: "Find live pattern setups", color: "text-amber-500" },
  { icon: FlaskConical, label: "Research", description: "Validate with backtested data", color: "text-violet-500" },
  { icon: Bell, label: "Execute", description: "Set alerts & act on signals", color: "text-emerald-500" },
  { icon: FileCode, label: "Automate", description: "Export scripts for your platform", color: "text-cyan-500" },
];

const TradingCopilotFeature = () => {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative py-20 md:py-28 px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 40% 30%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 60% 70%, hsl(var(--accent)) 0%, transparent 50%)',
            }}
          />
          <div className="relative container mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 text-sm">
              <Bot className="h-4 w-4" />
              AI Trading Copilot
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Only AI That Can Actually{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Trade-Research
              </span>{" "}
              For You
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Not a generic chatbot. A purpose-built AI with live market access, proprietary data, and direct integration with your trading tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8 py-6 text-lg">
                <Bot className="h-5 w-5" />
                Try the Copilot
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <a href="#challenge">
                  See the Comparison
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* "Try This With ChatGPT" Challenge */}
        <section id="challenge" className="py-20 px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Try This With ChatGPT
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Same prompt. Very different results. Here's what happens when you ask a real trading question.
              </p>
            </div>

            <div className="space-y-10">
              {challenges.map((challenge, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="px-5 py-3 bg-muted/50 border-b">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground">Prompt:</span>{" "}
                      "{challenge.prompt}"
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    {/* ChartingPath side */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">ChartingPath Copilot</span>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.copilot.summary}</p>

                      {challenge.copilot.type === "table" && (
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b bg-muted/50">
                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Symbol</th>
                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Grade</th>
                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">R:R</th>
                            </tr></thead>
                            <tbody>
                              {challenge.copilot.rows?.map((r) => (
                                <tr key={r.symbol} className="border-b last:border-0">
                                  <td className="px-3 py-1.5 font-medium">{r.symbol}</td>
                                  <td className="px-3 py-1.5"><Badge variant="outline" className="text-xs font-mono">{r.grade}</Badge></td>
                                  <td className="px-3 py-1.5 font-mono">{r.rr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {challenge.copilot.type === "stats" && (
                        <div className="grid grid-cols-3 gap-2">
                          {challenge.copilot.stats?.map((s) => (
                            <div key={s.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
                              <p className="text-lg font-bold">{s.value}</p>
                              <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {challenge.copilot.type === "code" && (
                        <div className="rounded-lg bg-muted p-3 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                          {challenge.copilot.code}
                        </div>
                      )}

                      {challenge.copilot.hasActions && (
                        <div className="flex gap-2 pt-1">
                          <Badge variant="secondary" className="text-[10px]">↗ Open in Pattern Lab</Badge>
                          <Badge variant="secondary" className="text-[10px]">↗ Create Alert</Badge>
                        </div>
                      )}
                    </div>

                    {/* Generic AI side */}
                    <div className="p-5 space-y-3 bg-muted/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">Generic AI Chat</span>
                        <X className="h-3.5 w-3.5 text-destructive ml-auto" />
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        {challenge.generic}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 6 Moat Cards — expanded */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Irreplaceable Moat
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Six capabilities that are impossible to replicate by pasting a chart into ChatGPT, Gemini, or any generic AI.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moatFeatures.map((feature) => (
                <Card key={feature.title} className="group hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className={`inline-flex p-2.5 rounded-xl ${feature.bgColor}`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs text-destructive/70 flex items-start gap-1.5">
                        <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{feature.whyCant}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Built Into Your Workflow */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built Into Your Workflow
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
              The Copilot sits at the center of the Discover → Research → Execute → Automate loop, bridging every step with AI-powered analysis.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {workflowSteps.map((step, i) => (
                <div key={step.label} className="relative">
                  <Card className="text-center">
                    <CardContent className="p-5 space-y-2">
                      <step.icon className={`h-8 w-8 mx-auto ${step.color}`} />
                      <p className="font-semibold">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {i < workflowSteps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 z-10" />
                  )}
                </div>
              ))}
            </div>

            {/* Central copilot badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Copilot connects every step</span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to try it?</h2>
            <p className="text-muted-foreground mb-8">
              Press <kbd className="px-1.5 py-0.5 rounded border bg-muted text-sm font-mono">⌘K</kbd> anywhere in the platform to open the Copilot.
            </p>
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8 py-6 text-lg" asChild>
              <Link to="/">
                <Bot className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 px-6 border-t">
          <div className="container mx-auto max-w-4xl">
            <DisclaimerBanner variant="compact" />
          </div>
        </section>
      </div>
    );
};

export default TradingCopilotFeature;
