import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Database, Eye, Code2, Brain, Link2,
  ArrowRight, Bot, User, TrendingUp, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackEvent } from '@/lib/analytics';
import { useTradingCopilotContext } from "@/components/copilot";

const demoResults = [
  { symbol: "BTC/USD", quality: "A", entry: "67,420", sl: "65,800", tp: "71,200", rr: "2.3" },
  { symbol: "ETH/USD", quality: "B+", entry: "3,580", sl: "3,440", tp: "3,860", rr: "2.0" },
  { symbol: "SOL/USD", quality: "A-", entry: "148.50", sl: "142.00", tp: "162.00", rr: "2.1" },
];

export const CopilotShowcase = () => {
  const { t } = useTranslation();
  const copilot = useTradingCopilotContext();

  const moatFeatures = [
    {
      icon: Activity,
      title: t('copilotShowcase.liveMarketAccess'),
      description: t('copilotShowcase.liveMarketAccessDesc'),
      cantDo: t('copilotShowcase.liveMarketAccessCant'),
      color: "text-amber-500",
    },
    {
      icon: Database,
      title: t('copilotShowcase.backtested'),
      description: t('copilotShowcase.backtestedDesc'),
      cantDo: t('copilotShowcase.backtestedCant'),
      color: "text-violet-500",
    },
    {
      icon: Eye,
      title: t('copilotShowcase.chartContext'),
      description: t('copilotShowcase.chartContextDesc'),
      cantDo: t('copilotShowcase.chartContextCant'),
      color: "text-emerald-500",
    },
    {
      icon: Code2,
      title: t('copilotShowcase.pineScript'),
      description: t('copilotShowcase.pineScriptDesc'),
      cantDo: t('copilotShowcase.pineScriptCant'),
      color: "text-cyan-500",
    },
    {
      icon: Brain,
      title: t('copilotShowcase.selfImproving'),
      description: t('copilotShowcase.selfImprovingDesc'),
      cantDo: t('copilotShowcase.selfImprovingCant'),
      color: "text-pink-500",
    },
    {
      icon: Link2,
      title: t('copilotShowcase.actionBridging'),
      description: t('copilotShowcase.actionBridgingDesc'),
      cantDo: t('copilotShowcase.actionBridgingCant'),
      color: "text-blue-500",
    },
  ];

  return (
    <section className="py-24 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Header — left-aligned two-column */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-start mb-16">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
              {t('copilotShowcase.badge')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              {t('copilotShowcase.title')}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('copilotShowcase.subtitle') }} />
          </div>
          <div />
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
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                <p className="text-xs text-muted-foreground/70 italic border-t border-border/50 pt-3">
                  {feature.cantDo}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Conversation — two-column: CTA left, chat right */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-start">
          {/* Left — heading + CTA */}
          <div className="lg:sticky lg:top-24">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">{t('copilotShowcase.seeItInAction')}</h3>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              {t('copilotShowcase.demoDesc', 'Ask about any pattern, instrument, or strategy. The copilot pulls live data and backtest results in real time.')}
            </p>
            <div className="space-y-3">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full sm:w-auto" onClick={() => { trackEvent('landing.cta_click', { button: 'copilot_try_now' }); copilot.open(); }}>
                {t('copilotShowcase.tryNow', 'Try Copilot Now')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Link to="/features/trading-copilot" onClick={() => trackEvent('landing.cta_click', { button: 'copilot_learn_more' })}>
                  {t('copilotShowcase.learnMore')}
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('copilotShowcase.pressToTry') }} />
            </div>
          </div>

          {/* Right — chat demo */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('copilotShowcase.tradingCopilot')}</span>
              <Badge variant="outline" className="text-xs ml-auto">{t('copilotShowcase.demo')}</Badge>
            </div>

            {/* User message */}
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="p-1.5 rounded-full bg-muted h-fit">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2.5 text-sm max-w-[85%]">
                  {t('copilotShowcase.demoQuestion')}
                </div>
              </div>

              {/* Copilot response */}
              <div className="flex gap-3">
                <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('copilotShowcase.demoResponse') }} />
                  {/* Results table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('copilotShowcase.symbol')}</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('copilotShowcase.grade')}</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('copilotShowcase.entry')}</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('copilotShowcase.sl')}</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('copilotShowcase.tp')}</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('copilotShowcase.rr')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demoResults.map((r) => (
                          <tr key={r.symbol} className="border-b last:border-0">
                            <td className="px-3 py-2.5 font-medium">{r.symbol}</td>
                            <td className="px-3 py-2.5">
                              <Badge variant="outline" className="text-xs font-mono">{r.quality}</Badge>
                            </td>
                            <td className="px-3 py-2.5 font-mono tabular-nums">{r.entry}</td>
                            <td className="px-3 py-2.5 font-mono tabular-nums text-destructive">{r.sl}</td>
                            <td className="px-3 py-2.5 font-mono tabular-nums text-emerald-500">{r.tp}</td>
                            <td className="px-3 py-2.5 font-mono tabular-nums">{r.rr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                      <TrendingUp className="h-3 w-3" /> {t('copilotShowcase.validateInPatternLab')}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                      <Code2 className="h-3 w-3" /> {t('copilotShowcase.exportPineScript')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footnote */}
            <div className="px-5 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground text-center italic">
                {t('copilotShowcase.chatgptFootnote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CopilotShowcase;
