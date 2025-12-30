import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingUp, Shield, Target, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PLANS_CONFIG } from "@/config/plans";

const ProjectsPricing = () => {
  const { t } = useTranslation();

  const tiers = [
    {
      key: 'FREE' as const,
      name: 'Free',
      price: 0,
      config: PLANS_CONFIG.tiers.FREE,
      popular: false,
      cta: t('projects.pricing.cta.free'),
      bestFor: t('projects.pricing.bestFor.free'),
    },
    {
      key: 'PLUS' as const,
      name: 'Plus',
      price: 29,
      config: PLANS_CONFIG.tiers.PLUS,
      popular: false,
      cta: t('projects.pricing.cta.plus'),
      bestFor: t('projects.pricing.bestFor.plus'),
    },
    {
      key: 'PRO' as const,
      name: 'Pro',
      price: 79,
      config: PLANS_CONFIG.tiers.PRO,
      popular: true,
      cta: t('projects.pricing.cta.pro'),
      bestFor: t('projects.pricing.bestFor.pro'),
    },
    {
      key: 'TEAM' as const,
      name: 'Team',
      price: 199,
      config: PLANS_CONFIG.tiers.TEAM,
      popular: false,
      cta: t('projects.pricing.cta.team'),
      bestFor: t('projects.pricing.bestFor.team'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Trading Projects
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {t('projects.pricing.headline')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('projects.pricing.subheadline')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 lg:grid-cols-4 mb-16">
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
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <div className="mt-4">
                  {tier.price === 0 ? (
                    <div className="text-4xl font-bold text-foreground">Free</div>
                  ) : (
                    <div className="text-4xl font-bold text-foreground">
                      ${tier.price}
                      <span className="text-lg text-muted-foreground font-normal">/mo</span>
                    </div>
                  )}
                </div>
                <CardDescription className="text-sm mt-2">
                  {tier.bestFor}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Key Limits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('projects.pricing.features.monthlyCredits')}</span>
                    <span className="font-semibold text-foreground">{tier.config.monthlyCredits}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('projects.pricing.features.dailyRuns')}</span>
                    <span className="font-semibold text-foreground">{tier.config.dailyRunCap}/day</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('projects.pricing.features.maxInstruments')}</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.projects.setup_finder.maxInstruments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('projects.pricing.features.maxLookback')}</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.projects.setup_finder.maxLookbackYears}y
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('projects.pricing.features.activeAlerts')}</span>
                    <span className="font-semibold text-foreground">{tier.config.maxActiveAlerts}</span>
                  </div>
                </div>

                {/* Project Features */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Setup Finder</span>
                  </div>
                  {tier.config.projects.pattern_lab.enabled !== false && (
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">Pattern Lab</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Portfolio Checkup</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">Portfolio Sim</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  {tier.key === 'TEAM' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:team@chartingpath.com">
                        <Mail className="h-4 w-4 mr-2" />
                        {tier.cta}
                      </a>
                    </Button>
                  ) : (
                    <Button 
                      variant={tier.popular ? "default" : "outline"} 
                      className="w-full"
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
              {t('projects.pricing.creditsExplained')}. {t('projects.pricing.estimatedBefore')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{t('projects.pricing.examples.setupFinder50')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{t('projects.pricing.examples.patternLab10')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="grid gap-6 sm:grid-cols-3 mb-16">
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {t('projects.pricing.trust.execution')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Every backtest includes documented assumptions
            </p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {t('projects.pricing.trust.bracket')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Consistent SL/TP calculation across all features
            </p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Target className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {t('projects.pricing.trust.alerts')}
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
