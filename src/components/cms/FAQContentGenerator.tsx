import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  RefreshCw, Copy, Check, Camera, ExternalLink, Sparkles,
  BarChart3, Activity, Bot, FlaskConical, Bell, FileCode,
  Trophy, Database, BookOpen, GraduationCap, DollarSign,
  Calculator, Calendar, Info, HelpCircle, Globe
} from "lucide-react";

// ──────────────────────────────────────────────
// Centralized service registry – mirrors Navigation.tsx
// Update this list when the header menu changes, then hit "Refresh"
// ──────────────────────────────────────────────

interface ServiceDefinition {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  category: "core" | "tools" | "learning" | "company";
  shortDescription: string;
  faqs: { q: string; a: string }[];
  hashtags: string[];
}

const buildServiceRegistry = (): ServiceDefinition[] => [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/members/dashboard",
    icon: <BarChart3 className="h-4 w-4 text-blue-500" />,
    category: "core",
    shortDescription: "Your personal command center for all active signals, watchlist, and portfolio overview.",
    faqs: [
      { q: "What is the ChartingPath Dashboard?", a: "It's your personal command center — see all active pattern signals, track your watchlist, and monitor your portfolio performance in one glance. Start every trading day here." },
      { q: "Do I need a paid plan to use the Dashboard?", a: "The Dashboard is available on all plans. Free users get a streamlined view, while Pro & Elite unlock advanced widgets and deeper analytics." },
      { q: "Can I customise what I see on my Dashboard?", a: "Yes! Pin your favourite instruments, filter by asset class, and toggle between signal views. Your layout saves automatically." },
    ],
    hashtags: ["#TradingDashboard", "#ChartPatterns", "#ChartingPath"],
  },
  {
    id: "screener",
    name: "Screener",
    path: "/patterns/live",
    icon: <Activity className="h-4 w-4 text-amber-500" />,
    category: "core",
    shortDescription: "Real-time chart pattern detection across Stocks, Forex, Crypto & Indices.",
    faqs: [
      { q: "How does the ChartingPath Screener work?", a: "Our engine scans 1,400+ instruments across Stocks, Forex, Crypto & Indices every few hours. When a high-quality chart pattern forms, it appears instantly on your Screener feed." },
      { q: "What chart patterns does the Screener detect?", a: "We detect 20+ patterns including Head & Shoulders, Double Tops/Bottoms, Wedges, Flags, Triangles, and more — each validated with multi-layer quality scoring." },
      { q: "How fresh are the Screener signals?", a: "Signals refresh every 4-8 hours depending on timeframe. Each signal shows its last-confirmed timestamp so you always know how current it is." },
    ],
    hashtags: ["#PatternScreener", "#TechnicalAnalysis", "#LiveSignals"],
  },
  {
    id: "agent-scoring",
    name: "Agent Scoring",
    path: "/tools/agent-scoring",
    icon: <Bot className="h-4 w-4 text-amber-500" />,
    category: "core",
    shortDescription: "AI-powered trade scoring that rates every signal TAKE / WATCH / SKIP.",
    faqs: [
      { q: "What is Agent Scoring?", a: "Agent Scoring is our AI trade evaluator. Four specialized agents — Analyst (win rate & expectancy), Risk Manager (R:R, stop distance, Kelly Criterion), Timing (50% trend alignment + 50% economic calendar within 48h), and Portfolio (concentration & correlation) — independently score every signal. The weighted composite (0–100) determines a TAKE, WATCH, or SKIP verdict so you focus on the best setups." },
      { q: "How does the Timing Agent work?", a: "The Timing Agent blends two components 50/50: (1) Trend alignment — with_trend scores 0.85, neutral 0.55, counter_trend 0.30, based on MACD, EMA 50/200, RSI & ADX. (2) Economic calendar — starts at 1.0, then deducts −0.15 per high-impact event (FOMC, NFP, CPI) and −0.06 per medium-impact event within 48 hours, matched by currency to your instrument. Clear calendar + with-trend = highest timing score." },
      { q: "Can I adjust the scoring weights?", a: "Absolutely. Customise how much weight each agent (Analyst, Risk, Timing, Portfolio) gets — they auto-normalise to sum 100. Save multiple presets for different strategies. You can even ask the AI Copilot to adjust them for you!" },
      { q: "Can the AI Copilot change my Agent Scoring?", a: "Yes! Just tell the Copilot what you want — 'increase take rate by 5%' or 'make scoring more conservative'. It reads your settings, suggests changes, and applies them when you confirm." },
      { q: "Is Agent Scoring free to use?", a: "Yes! Anyone can score signals. Backtesting your custom weights requires a free account (50 credits included)." },
    ],
    hashtags: ["#AITrading", "#TradeScoring", "#AgentScoring"],
  },
  {
    id: "pattern-lab",
    name: "Pattern Lab",
    path: "/projects/pattern-lab/new",
    icon: <FlaskConical className="h-4 w-4 text-violet-500" />,
    category: "core",
    shortDescription: "Backtest any chart pattern strategy against years of historical data.",
    faqs: [
      { q: "What can I do in Pattern Lab?", a: "Pattern Lab lets you backtest any chart pattern strategy against real historical data. Pick a pattern, set your R:R, choose instruments, and see exactly how it would have performed — win rate, expectancy, equity curve and all." },
      { q: "How far back does the historical data go?", a: "Our database holds 5+ years of validated pattern occurrences across all supported asset classes, giving you statistically meaningful sample sizes." },
      { q: "Can I share my Pattern Lab results?", a: "Yes — generate a shareable link or export your backtest report. Great for trading communities and strategy discussions." },
    ],
    hashtags: ["#Backtesting", "#PatternLab", "#TradingStrategy"],
  },
  {
    id: "alerts",
    name: "Alerts",
    path: "/members/alerts",
    icon: <Bell className="h-4 w-4 text-emerald-500" />,
    category: "core",
    shortDescription: "Get notified the moment a pattern triggers on your watched instruments.",
    faqs: [
      { q: "How do ChartingPath Alerts work?", a: "Set alerts on specific patterns + instruments. When our engine detects a match, you get notified via email instantly — never miss a setup again." },
      { q: "How many alerts can I create?", a: "Pro users get 3 active alerts. Elite users get unlimited. Starter accounts can upgrade anytime to unlock alerts." },
      { q: "Can I set alerts for specific pattern types?", a: "Yes! Filter by pattern type, timeframe, and instrument. You control exactly what triggers a notification." },
    ],
    hashtags: ["#TradingAlerts", "#PatternAlerts", "#NeverMissATrade"],
  },
  {
    id: "scripts",
    name: "Scripts",
    path: "/members/scripts",
    icon: <FileCode className="h-4 w-4 text-cyan-500" />,
    category: "core",
    shortDescription: "Auto-generated Pine Script & MQL code for every detected pattern.",
    faqs: [
      { q: "What are ChartingPath Scripts?", a: "Every pattern signal comes with auto-generated Pine Script (TradingView) and MQL (MetaTrader) code. Copy-paste directly into your trading platform to automate entries." },
      { q: "Do I need coding knowledge?", a: "Not at all. Scripts are generated automatically with the correct entry, stop-loss, and take-profit levels pre-configured. Just copy and apply." },
      { q: "Which platforms are supported?", a: "Currently TradingView (Pine Script v5) and MetaTrader 4/5 (MQL4/MQL5). More platforms coming soon." },
    ],
    hashtags: ["#PineScript", "#MQL", "#TradingAutomation"],
  },
  {
    id: "edge-atlas",
    name: "Edge Atlas",
    path: "/edge-atlas",
    icon: <Trophy className="h-4 w-4 text-amber-500" />,
    category: "learning",
    shortDescription: "Discover which patterns have the highest statistical edge across markets.",
    faqs: [
      { q: "What is the Edge Atlas?", a: "Edge Atlas ranks every chart pattern by statistical edge — win rate, expectancy, and annualised return. It answers: 'Which pattern actually makes money on which timeframe?' Backed by thousands of historical trades." },
      { q: "How is the ranking calculated?", a: "We compute expectancy (R) × trades-per-year for each pattern/timeframe/asset combo. The result shows estimated annualised edge — a single number to compare setups." },
      { q: "Can I filter by asset class?", a: "Yes — filter by Stocks, Forex, Crypto, or Indices. Compare how the same pattern performs across different markets." },
    ],
    hashtags: ["#EdgeAtlas", "#TradingEdge", "#PatternStats"],
  },
  {
    id: "pattern-library",
    name: "Pattern Library",
    path: "/chart-patterns/library",
    icon: <Database className="h-4 w-4 text-blue-500" />,
    category: "learning",
    shortDescription: "Visual encyclopedia of every chart pattern with examples and trading rules.",
    faqs: [
      { q: "What's in the Pattern Library?", a: "A visual encyclopedia of 20+ chart patterns — each with definition, identification rules, entry/exit guidelines, and real-market examples. Perfect for beginners and experienced traders alike." },
      { q: "Does it include real chart examples?", a: "Yes! Every pattern page includes actual detected occurrences from our historical database, so you see how they look on real price action." },
    ],
    hashtags: ["#ChartPatterns", "#TradingEducation", "#PatternLibrary"],
  },
  {
    id: "blog",
    name: "Blog & Articles",
    path: "/learn",
    icon: <BookOpen className="h-4 w-4 text-green-500" />,
    category: "learning",
    shortDescription: "In-depth articles on technical analysis, pattern trading, and market psychology.",
    faqs: [
      { q: "What topics does the ChartingPath Blog cover?", a: "Deep dives into chart patterns, technical analysis techniques, risk management, trading psychology, and market structure. New content published weekly." },
      { q: "Is the blog free?", a: "100% free — all articles are accessible without an account. We believe education should be open to everyone." },
    ],
    hashtags: ["#TradingBlog", "#LearnToTrade", "#TechnicalAnalysis"],
  },
  {
    id: "pattern-quiz",
    name: "Pattern Quizzes",
    path: "/chart-patterns/quiz",
    icon: <GraduationCap className="h-4 w-4 text-purple-500" />,
    category: "learning",
    shortDescription: "Test your pattern recognition skills with image-based quizzes.",
    faqs: [
      { q: "How do the Pattern Quizzes work?", a: "You're shown a real chart and asked to identify the pattern, predict the breakout direction, or choose the correct entry level. Each question includes a detailed explanation." },
      { q: "Are quizzes based on real charts?", a: "Yes! Quiz images come from actual historical pattern detections — no textbook diagrams. Train your eye on real price action." },
    ],
    hashtags: ["#TradingQuiz", "#PatternRecognition", "#ChartQuiz"],
  },
  {
    id: "pip-calculator",
    name: "Pip Calculator",
    path: "/tools/pip-calculator",
    icon: <Calculator className="h-4 w-4" />,
    category: "tools",
    shortDescription: "Calculate pip value and position size for any forex pair instantly.",
    faqs: [
      { q: "What does the Pip Calculator do?", a: "Enter your forex pair, account currency, and lot size — instantly see pip value in your base currency. Essential for proper position sizing." },
    ],
    hashtags: ["#ForexTools", "#PipCalculator", "#RiskManagement"],
  },
  {
    id: "risk-calculator",
    name: "Risk Calculator",
    path: "/tools/risk-calculator",
    icon: <Calculator className="h-4 w-4" />,
    category: "tools",
    shortDescription: "Determine optimal position size based on your risk tolerance.",
    faqs: [
      { q: "How does the Risk Calculator help me?", a: "Input your account size, risk percentage, and stop-loss distance. It calculates the exact position size so you never risk more than you intend. Risk management made simple." },
    ],
    hashtags: ["#RiskCalculator", "#PositionSizing", "#TradingRisk"],
  },
  {
    id: "economic-calendar",
    name: "Economic Calendar",
    path: "/tools/economic-calendar",
    icon: <Calendar className="h-4 w-4" />,
    category: "tools",
    shortDescription: "Track high-impact economic events that move the markets.",
    faqs: [
      { q: "Why use the ChartingPath Economic Calendar?", a: "Know when NFP, CPI, FOMC, and other market-moving events hit — so you can plan entries and exits around volatility. Filter by impact level and region." },
    ],
    hashtags: ["#EconomicCalendar", "#ForexNews", "#MarketEvents"],
  },
  {
    id: "market-breadth",
    name: "Market Breadth",
    path: "/tools/market-breadth",
    icon: <BarChart3 className="h-4 w-4" />,
    category: "tools",
    shortDescription: "Gauge overall market health with breadth indicators.",
    faqs: [
      { q: "What is Market Breadth on ChartingPath?", a: "Market Breadth shows how many instruments are showing bullish vs bearish patterns across the market. It's a powerful sentiment gauge — when breadth diverges from price, big moves often follow." },
    ],
    hashtags: ["#MarketBreadth", "#MarketSentiment", "#TradingTools"],
  },
  {
    id: "ai-copilot",
    name: "AI Trading Copilot",
    path: "/features/trading-copilot",
    icon: <Bot className="h-4 w-4 text-primary" />,
    category: "tools",
    shortDescription: "Ask questions, get trade ideas, and navigate the platform with AI assistance.",
    faqs: [
      { q: "What can the AI Trading Copilot do?", a: "Ask it anything — 'Show me bullish wedges on forex', 'Score this EURUSD pattern', or 'What's my best-performing setup?' It understands ChartingPath features and guides you to the right tool." },
      { q: "Is the Copilot just ChatGPT?", a: "No — it's purpose-built for ChartingPath. It has real-time access to your signals, scoring data, and platform context. It doesn't hallucinate trade data." },
      { q: "Can the Copilot adjust my Agent Scoring?", a: "Yes! Say 'increase take rate by 5% without more risk' and it reads your current settings, suggests optimised changes, and applies them when you confirm. No manual slider tweaking needed." },
    ],
    hashtags: ["#AICopilot", "#AITrading", "#TradingAssistant"],
  },
  {
    id: "pricing",
    name: "Pricing",
    path: "/projects/pricing",
    icon: <DollarSign className="h-4 w-4" />,
    category: "company",
    shortDescription: "Transparent pricing — Starter (free), Pro, and Elite plans.",
    faqs: [
      { q: "Is ChartingPath free?", a: "Yes! The Starter plan is free forever — you get access to the Screener, Agent Scoring, Pattern Library, Blog, Quizzes, and all calculators. Pro & Elite unlock alerts, backtesting, scripts, and more." },
      { q: "What's included in the Pro plan?", a: "Pro adds 3 active alerts, 20 daily backtests, auto-generated scripts, and priority signal delivery. Perfect for active traders." },
    ],
    hashtags: ["#TradingPlatform", "#FreeTradingTools", "#ChartingPath"],
  },
];

// ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core Services",
  tools: "Tools & Features",
  learning: "Learning & Education",
  company: "Company",
};

const formatTweet = (faq: { q: string; a: string }, service: ServiceDefinition): string => {
  const baseUrl = "https://chartingpath.com";
  const link = `${baseUrl}${service.path}`;
  return `❓ ${faq.q}\n\n${faq.a}\n\n👉 Try it: ${link}\n\n${service.hashtags.join(" ")} #ChartingPath`;
};

export function FAQContentGenerator() {
  const [services, setServices] = useState<ServiceDefinition[]>(buildServiceRegistry);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const handleRefresh = useCallback(() => {
    setServices(buildServiceRegistry());
    setLastRefreshed(new Date());
    toast.success("Service registry refreshed from navigation menu");
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard — paste into X!");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCaptureAndCopy = useCallback(async (service: ServiceDefinition, faqIndex: number) => {
    const faq = service.faqs[faqIndex];
    const tweet = formatTweet(faq, service);

    // Copy tweet first
    navigator.clipboard.writeText(tweet);
    toast.success("Tweet copied! Now capturing page screenshot…");

    // Open the service page in a new tab for manual screenshot
    const url = `${window.location.origin}${service.path}`;
    window.open(url, "_blank");
    toast.info(`Opened ${service.name} page — use the camera button (bottom-right) to capture a screenshot for your post.`, { duration: 6000 });
  }, []);

  const grouped = services.reduce<Record<string, ServiceDefinition[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const totalFaqs = services.reduce((sum, s) => sum + s.faqs.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            FAQ Content for X
          </h2>
          <p className="text-muted-foreground mt-1">
            {services.length} services · {totalFaqs} FAQ posts ready · sourced from header menu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh Services
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">How to use</p>
              <ol className="list-decimal list-inside mt-1 text-muted-foreground space-y-1">
                <li>Browse FAQs below — each is formatted as a ready-to-post tweet</li>
                <li>Click <strong>"Copy & Capture"</strong> to copy the tweet and open the service page</li>
                <li>Use the <Camera className="inline h-3.5 w-3.5" /> capture button (bottom-right on the page) to download a screenshot</li>
                <li>Paste the tweet + attach the screenshot in X</li>
              </ol>
              <p className="mt-2 text-muted-foreground">Hit <strong>"Refresh Services"</strong> whenever the navigation menu changes to regenerate content.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Content by Category */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-6 pr-4">
          {(["core", "tools", "learning", "company"] as const).map((cat) => {
            const catServices = grouped[cat];
            if (!catServices?.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs uppercase tracking-wider">
                    {CATEGORY_LABELS[cat]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({catServices.reduce((s, sv) => s + sv.faqs.length, 0)} posts)
                  </span>
                </h3>
                <Accordion type="multiple" className="space-y-2">
                  {catServices.map((service) => (
                    <AccordionItem key={service.id} value={service.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          {service.icon}
                          <div className="text-left">
                            <span className="font-medium">{service.name}</span>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">
                              {service.shortDescription}
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-auto mr-3 text-xs">
                            {service.faqs.length} FAQ{service.faqs.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {service.faqs.map((faq, faqIdx) => {
                            const tweetId = `${service.id}-${faqIdx}`;
                            const tweet = formatTweet(faq, service);
                            const isEditing = editingId === tweetId;

                            return (
                              <Card key={tweetId} className="bg-muted/30 border-muted">
                                <CardContent className="py-4 px-4 space-y-3">
                                  <p className="font-medium text-sm">❓ {faq.q}</p>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        rows={6}
                                        className="text-sm font-mono"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(editText);
                                            toast.success("Edited tweet copied!");
                                            setEditingId(null);
                                          }}
                                        >
                                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy Edited
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-background rounded-md p-3 border">
                                      {tweet}
                                    </pre>
                                  )}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleCaptureAndCopy(service, faqIdx)}
                                    >
                                      {copiedId === tweetId ? (
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                      ) : (
                                        <Camera className="h-3.5 w-3.5 mr-1" />
                                      )}
                                      Copy & Capture
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopy(tweet, tweetId)}
                                    >
                                      <Copy className="h-3.5 w-3.5 mr-1" />
                                      Copy Only
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingId(tweetId);
                                        setEditText(tweet);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <a
                                      href={`${window.location.origin}${service.path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-auto"
                                    >
                                      <Button size="sm" variant="ghost">
                                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                        Preview
                                      </Button>
                                    </a>
                                    <span className="text-sm text-muted-foreground">
                                      {tweet.length}/280 chars
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
