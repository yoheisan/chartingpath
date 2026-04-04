import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import {
  Bot, ArrowRight, Activity, Database, Eye, Code2, Brain, Link2,
  Search, Bell, FileCode, FlaskConical, CheckCircle, X,
  RefreshCw, MessageSquareText
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTradingCopilotContext } from "@/components/copilot";
import { useOutcomeCount } from "@/hooks/useOutcomeCount";

const TradingCopilotFeature = () => {
  const { t } = useTranslation();
  const copilot = useTradingCopilotContext();

  // Moat features — expanded for the feature page
  const moatFeatures = [
    {
      icon: Activity,
      title: t('tradingCopilot.moat.livePatternDb'),
      description: t('tradingCopilot.moat.livePatternDbDesc'),
      whyCant: t('tradingCopilot.moat.livePatternDbCant'),
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Database,
      title: t('tradingCopilot.moat.backtestAtlas'),
      description: t('tradingCopilot.moat.backtestAtlasDesc'),
      whyCant: t('tradingCopilot.moat.backtestAtlasCant'),
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Eye,
      title: t('tradingCopilot.moat.chartContext'),
      description: t('tradingCopilot.moat.chartContextDesc'),
      whyCant: t('tradingCopilot.moat.chartContextCant'),
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Code2,
      title: t('tradingCopilot.moat.pineScript'),
      description: t('tradingCopilot.moat.pineScriptDesc'),
      whyCant: t('tradingCopilot.moat.pineScriptCant'),
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      icon: Brain,
      title: t('tradingCopilot.moat.selfImproving'),
      description: t('tradingCopilot.moat.selfImprovingDesc'),
      whyCant: t('tradingCopilot.moat.selfImprovingCant'),
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: Link2,
      title: t('tradingCopilot.moat.actionBridging'),
      description: t('tradingCopilot.moat.actionBridgingDesc'),
      whyCant: t('tradingCopilot.moat.actionBridgingCant'),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const challenges = [
    {
      prompt: t('tradingCopilot.challenges.prompt1'),
      copilot: {
        type: "table" as const,
        summary: t('tradingCopilot.challenges.summary1'),
        rows: [
          { symbol: "BTC/USD", grade: "A", rr: "2.3" },
          { symbol: "ETH/USD", grade: "B+", rr: "2.0" },
          { symbol: "SOL/USD", grade: "A-", rr: "2.1" },
        ],
        hasActions: true,
      },
      generic: t('tradingCopilot.challenges.generic1'),
    },
    {
      prompt: t('tradingCopilot.challenges.prompt2'),
      copilot: {
        type: "stats" as const,
        summary: t('tradingCopilot.challenges.summary2'),
        stats: [
          { label: t('tradingCopilot.challenges.statWinRate'), value: "62.4%" },
          { label: t('tradingCopilot.challenges.statExpectancy'), value: "0.38R" },
          { label: t('tradingCopilot.challenges.statBestTf'), value: "4H" },
        ],
        hasActions: true,
      },
      generic: t('tradingCopilot.challenges.generic2'),
    },
    {
      prompt: t('tradingCopilot.challenges.prompt3'),
      copilot: {
        type: "code" as const,
        summary: t('tradingCopilot.challenges.summary3'),
        code: '//@version=5\nstrategy("AAPL H&S", overlay=true)\n// Entry: 185.40 | SL: 188.20 | TP: 179.80\n// ... 47 more lines with position sizing',
        hasActions: true,
      },
      generic: t('tradingCopilot.challenges.generic3'),
    },
  ];

  const workflowSteps = [
    { icon: Search, label: t('tradingCopilot.workflow.discover'), description: t('tradingCopilot.workflow.discoverDesc'), color: "text-amber-500" },
    { icon: FlaskConical, label: t('tradingCopilot.workflow.research'), description: t('tradingCopilot.workflow.researchDesc'), color: "text-violet-500" },
    { icon: Bell, label: t('tradingCopilot.workflow.execute'), description: t('tradingCopilot.workflow.executeDesc'), color: "text-emerald-500" },
    { icon: FileCode, label: t('tradingCopilot.workflow.automate'), description: t('tradingCopilot.workflow.automateDesc'), color: "text-cyan-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — two-column wide layout */}
      <section className="relative py-20 md:py-28 px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 40% 30%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 60% 70%, hsl(var(--accent)) 0%, transparent 50%)',
          }}
        />
        <div className="relative container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <Badge variant="secondary" className="mb-6 gap-1.5 text-sm">
                <Bot className="h-4 w-4" />
                {t('tradingCopilot.badge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.08] tracking-tight">
                An AI trading assistant built on outcome data —{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  not just indicators
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                Every other AI trading tool reads RSI and MACD. ChartingPath Copilot reasons from 63,000+ real pattern outcomes to give you analysis grounded in what actually happened — not what the textbooks say should happen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8 py-6 text-lg" onClick={() => copilot.open()}>
                  <Bot className="h-5 w-5" />
                  {t('tradingCopilot.tryCopilot')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                  <a href="#challenge">
                    {t('tradingCopilot.seeComparison')}
                  </a>
                </Button>
              </div>
            </div>

            {/* Right — workflow loop visual */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {workflowSteps.map((step) => (
                <div key={step.label} className="rounded-xl border border-border/40 bg-card/50 p-6">
                  <step.icon className={`h-8 w-8 ${step.color} mb-3`} />
                  <p className="font-semibold text-foreground mb-1">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 Differentiator Points */}
      <section className="py-24 px-4 md:px-6 lg:px-8 border-t border-border/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
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
            ].map((d) => (
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
          <p className="text-xs text-muted-foreground">
            Copilot is available on Pro and above. Paper trading simulation only — not financial advice.
          </p>
        </div>
      </section>

      {/* "Try This With ChatGPT" Challenge */}
      <section id="challenge" className="py-24 px-4 md:px-6 lg:px-8 bg-muted/30 border-t border-border/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-start">
            {/* Left — section header */}
            <div className="lg:sticky lg:top-24">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
                {t('tradingCopilot.challengeLabel', 'Side-by-Side')}
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                {t('tradingCopilot.challengeTitle')}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t('tradingCopilot.challengeSubtitle')}
              </p>
            </div>

            {/* Right — challenge cards */}
            <div className="space-y-8">
              {challenges.map((challenge, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="px-5 py-3 bg-muted/50 border-b">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground">{t('tradingCopilot.prompt')}</span>{" "}
                      "{challenge.prompt}"
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    {/* ChartingPath side */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{t('tradingCopilot.copilotLabel')}</span>
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
                              <p className="text-lg font-bold tabular-nums">{s.value}</p>
                              <p className="text-sm text-muted-foreground">{s.label}</p>
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
                          <Badge variant="secondary" className="text-sm">{t('tradingCopilot.openInPatternLab')}</Badge>
                          <Badge variant="secondary" className="text-sm">{t('tradingCopilot.createAlert')}</Badge>
                        </div>
                      )}
                    </div>

                    {/* Generic AI side */}
                    <div className="p-5 space-y-3 bg-muted/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">{t('tradingCopilot.genericLabel')}</span>
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
        </div>
      </section>

      {/* 6 Moat Cards */}
      <section className="py-24 px-4 md:px-6 lg:px-8 border-t border-border/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-start">
            {/* Left — section header */}
            <div className="lg:sticky lg:top-24">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
                {t('tradingCopilot.moatLabel', 'Competitive Moat')}
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                {t('tradingCopilot.moatTitle')}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t('tradingCopilot.moatSubtitle')}
              </p>
            </div>

            {/* Right — cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </div>
      </section>

      {/* Built Into Your Workflow — wide horizontal */}
      <section className="py-24 px-4 md:px-6 lg:px-8 bg-muted/30 border-t border-border/20">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
              {t('tradingCopilot.workflowLabel', 'Workflow')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              {t('tradingCopilot.workflowTitle')}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t('tradingCopilot.workflowSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {workflowSteps.map((step, i) => (
              <div key={step.label} className="relative">
                <Card className="text-center h-full">
                  <CardContent className="p-6 space-y-3">
                    <step.icon className={`h-10 w-10 mx-auto ${step.color}`} />
                    <p className="font-semibold text-lg">{step.label}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {i < workflowSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 z-10" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border bg-card">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('tradingCopilot.copilotConnects')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — wide horizontal bar */}
      <section className="py-20 px-4 md:px-6 lg:px-8 border-t border-border/20">
        <div className="container mx-auto">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                {t('tradingCopilot.readyToTry')}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                {t('tradingCopilot.pressCmd')} <kbd className="px-1.5 py-0.5 rounded border bg-muted text-sm font-mono">{t('tradingCopilot.cmdKey')}</kbd> {t('tradingCopilot.anywhereInPlatform')}
              </p>
            </div>
            <div className="shrink-0">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 px-10 py-7 text-lg font-bold whitespace-nowrap"
                onClick={() => copilot?.open()}
              >
                <Bot className="h-5 w-5" />
                {t('tradingCopilot.openCopilot', 'Open Copilot')}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 md:px-6 lg:px-8 border-t">
        <div className="container mx-auto">
          <DisclaimerBanner variant="compact" />
        </div>
      </section>
    </div>
  );
};

export default TradingCopilotFeature;
