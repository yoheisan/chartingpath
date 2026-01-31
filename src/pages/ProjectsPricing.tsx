import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingUp, Shield, Target, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PLANS_CONFIG, TIER_DISPLAY, PlanTier } from "@/config/plans";

const ProjectsPricing = () => {
  const { t } = useTranslation();

  const tiers: Array<{
    key: PlanTier;
    name: string;
    price: number;
    config: typeof PLANS_CONFIG.tiers.FREE;
    popular: boolean;
    cta: string;
    bestFor: string;
  }> = [
    {
      key: 'FREE',
      name: 'Free',
      price: 0,
      config: PLANS_CONFIG.tiers.FREE,
      popular: false,
      cta: t('projects.pricing.cta.free', 'Start Free'),
      bestFor: TIER_DISPLAY.FREE.bestFor,
    },
    {
      key: 'LITE',
      name: 'Lite',
      price: 12,
      config: PLANS_CONFIG.tiers.LITE,
      popular: false,
      cta: 'Get Lite',
      bestFor: TIER_DISPLAY.LITE.bestFor,
    },
    {
      key: 'PLUS',
      name: 'Plus',
      price: 29,
      config: PLANS_CONFIG.tiers.PLUS,
      popular: false,
      cta: t('projects.pricing.cta.plus', 'Get Plus'),
      bestFor: TIER_DISPLAY.PLUS.bestFor,
    },
    {
      key: 'PRO',
      name: 'Pro',
      price: 79,
      config: PLANS_CONFIG.tiers.PRO,
      popular: true,
      cta: t('projects.pricing.cta.pro', 'Go Pro'),
      bestFor: TIER_DISPLAY.PRO.bestFor,
    },
    {
      key: 'TEAM',
      name: 'Team',
      price: 199,
      config: PLANS_CONFIG.tiers.TEAM,
      popular: false,
      cta: t('projects.pricing.cta.team', 'Contact Sales'),
      bestFor: TIER_DISPLAY.TEAM.bestFor,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Beta Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {t('projects.pricing.headline', 'Simple, Credit-Based Pricing')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            {t('projects.pricing.subheadline', 'Credits scale with symbols × history × patterns. Start free, upgrade as you grow.')}
          </p>
          <div className="text-sm text-muted-foreground max-w-3xl mx-auto mb-4 space-y-1">
            <p>
              <span className="text-foreground font-medium">Screener:</span> 1,100+ instruments monitored by default 
              (S&P 500 • 100+ Crypto • 50+ Forex • 30+ Commodities)
            </p>
            <p>
              <span className="text-foreground font-medium">Research:</span> Analyze ANY of 8,000+ US stocks via Setup Finder
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="outline" className="bg-background/50">Pattern Screener: Free for all</Badge>
            <Badge variant="outline" className="bg-background/50">20+ Chart Patterns</Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Custom Watchlist Monitoring (Paid)</Badge>
          </div>
        </div>

        {/* Pricing Cards - 5 columns on large screens */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-16">
          {tiers.map((tier) => (
            <Card 
              key={tier.key} 
              className={`relative flex flex-col ${
                tier.popular 
                  ? 'border-primary shadow-lg ring-1 ring-primary/20' 
                  : 'border-border/50'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                <div className="mt-3">
                  {tier.price === 0 ? (
                    <div className="text-3xl font-bold text-foreground">Free</div>
                  ) : (
                    <div className="text-3xl font-bold text-foreground">
                      ${tier.price}
                      <span className="text-sm text-muted-foreground font-normal">/mo</span>
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs mt-2">
                  {tier.bestFor}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Key Limits */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-semibold text-foreground">{tier.config.monthlyCredits}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Alerts</span>
                    <span className="font-semibold text-foreground">{tier.config.maxActiveAlerts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Instruments</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.projects.setup_finder.maxInstruments}/run
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lookback</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.projects.setup_finder.maxLookbackYears}y
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeframes</span>
                    <span className="font-semibold text-foreground text-right text-xs">
                      {tier.key === 'FREE' ? '1D' : 
                       tier.key === 'LITE' ? '15m, 4H, 1D' : 
                       '15m, 1H, 4H, 1D, 1W'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Watchlist Slots</span>
                    <span className={`font-semibold ${tier.config.maxWatchlistSlots === 0 ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                      {tier.config.maxWatchlistSlots === 0 ? '—' : 
                       tier.config.maxWatchlistSlots >= 9999 ? 'Unlimited' : 
                       tier.config.maxWatchlistSlots}
                    </span>
                  </div>
                </div>

                {/* Project Features */}
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Setup Finder</span>
                  </div>
                  {tier.config.projects.pattern_lab.enabled !== false && (
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Pattern Lab</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Portfolio Tools</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  {tier.key === 'TEAM' ? (
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <a href="mailto:team@chartingpath.com">
                        <Mail className="h-4 w-4 mr-2" />
                        {tier.cta}
                      </a>
                    </Button>
                  ) : (
                    <Button 
                      variant={tier.popular ? "default" : "outline"} 
                      className="w-full"
                      size="sm"
                      asChild
                    >
                      <Link to="/auth">
                        {tier.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Explanation */}
        <Card className="mb-16 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('projects.pricing.creditsExplained', 'Credits scale with symbols × history × patterns × timeframe')}. {t('projects.pricing.estimatedBefore', 'Credits are estimated before you run.')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{t('projects.pricing.examples.setupFinder50', 'Setup Finder (50 symbols, 4H, 2y, 6 patterns) ≈ 17 credits')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{t('projects.pricing.examples.patternLab10', 'Pattern Lab (10 symbols, 1D, 5y, 4 patterns) ≈ 12–18 credits')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="grid gap-6 sm:grid-cols-3 mb-16">
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {t('projects.pricing.trust.execution', 'Execution Assumptions Transparency')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Every backtest includes documented assumptions
            </p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {t('projects.pricing.trust.bracket', 'Deterministic bracket engine (v1.0.0)')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Consistent SL/TP calculation across all features
            </p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Target className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {t('projects.pricing.trust.alerts', 'Alerts include SL/TP & target reached')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Get notified when price hits your targets
            </p>
          </Card>
        </div>

        {/* Educational Disclaimer */}
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Educational Use Only:</strong> All trade plans and signals are for educational purposes only and do not constitute financial advice. Trading involves substantial risk of loss. Past performance does not guarantee future results.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsPricing;
