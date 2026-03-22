import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingUp, Shield, Target, ArrowRight, Star, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PLANS_CONFIG, TIER_DISPLAY, PlanTier } from "@/config/plans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const ProjectsPricing = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const p = (key: string) => t(`projects.pricing.${key}`);

  const planNameToDbPlan: Record<string, string> = {
    FREE: 'free',
    LITE: 'starter',
    PLUS: 'pro',
    PRO: 'pro_plus',
    ELITE: 'elite',
  };

  const handlePlanSelect = async (tierKey: string) => {
    const dbPlan = planNameToDbPlan[tierKey];
    
    if (dbPlan === 'free') {
      window.location.href = '/auth';
      return;
    }

    // Paid plans are coming soon - show toast instead of Stripe checkout
    toast(t('pricing.paymentsComingSoonTitle'), {
      description: t('pricing.paymentsComingSoonDesc'),
      duration: 8000,
    });
  };

  // Annual prices (yearly / 12, rounded)
  const annualMonthlyPrices: Record<string, number> = {
    FREE: 0,
    LITE: Math.round(20500 / 12 / 100),
    PLUS: Math.round(42100 / 12 / 100),
    PRO: Math.round(85300 / 12 / 100),
    TEAM: Math.round(160900 / 12 / 100),
  };

  const monthlyPrices: Record<string, number> = {
    FREE: 0, LITE: 19, PLUS: 39, PRO: 79, TEAM: 149,
  };

  const tiers: Array<{
    key: PlanTier;
    name: string;
    monthlyPrice: number;
    annualMonthlyPrice: number;
    annualYearlyPrice: number;
    config: typeof PLANS_CONFIG.tiers.FREE;
    popular: boolean;
    cta: string;
    bestFor: string;
  }> = [
    {
      key: 'FREE', name: 'Free', monthlyPrice: 0, annualMonthlyPrice: 0, annualYearlyPrice: 0,
      config: PLANS_CONFIG.tiers.FREE, popular: false,
      cta: p('cta.free'), bestFor: p('bestFor.free'),
    },
    {
      key: 'LITE', name: 'Lite', monthlyPrice: 19, annualMonthlyPrice: annualMonthlyPrices.LITE, annualYearlyPrice: 205,
      config: PLANS_CONFIG.tiers.LITE, popular: false,
      cta: p('cta.lite'), bestFor: p('bestFor.lite'),
    },
    {
      key: 'PLUS', name: 'Plus', monthlyPrice: 39, annualMonthlyPrice: annualMonthlyPrices.PLUS, annualYearlyPrice: 421,
      config: PLANS_CONFIG.tiers.PLUS, popular: false,
      cta: p('cta.plus'), bestFor: p('bestFor.plus'),
    },
    {
      key: 'PRO', name: 'Pro', monthlyPrice: 79, annualMonthlyPrice: annualMonthlyPrices.PRO, annualYearlyPrice: 853,
      config: PLANS_CONFIG.tiers.PRO, popular: true,
      cta: p('cta.pro'), bestFor: p('bestFor.pro'),
    },
    {
      key: 'TEAM', name: 'Team', monthlyPrice: 149, annualMonthlyPrice: annualMonthlyPrices.TEAM, annualYearlyPrice: 1609,
      config: PLANS_CONFIG.tiers.TEAM, popular: false,
      cta: p('cta.team'), bestFor: p('bestFor.team'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            {p('betaPricing')}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {p('headline')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            {p('subheadline')}
          </p>

          {/* Core Value Props */}
          <div className="grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto mb-6">
            {/* FREE - Default Screener */}
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">{p('freeScreener.badge')}</Badge>
                <span className="font-semibold text-foreground">{p('freeScreener.title')}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: p('freeScreener.desc') }} />
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {p('freeScreener.sp500')}</li>
                <li>• {p('freeScreener.crypto')}</li>
                <li>• {p('freeScreener.forex')}</li>
                <li>• {p('freeScreener.commodities')}</li>
              </ul>
            </div>
            
            {/* PAID - Custom Watchlist */}
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">{p('paidScreener.badge')}</Badge>
                <span className="font-semibold text-foreground">{p('paidScreener.title')}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: p('paidScreener.desc') }} />
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {p('paidScreener.smallCaps')}</li>
                <li>• {p('paidScreener.cadence')}</li>
                <li>• {p('paidScreener.alerts')}</li>
                <li>• {p('paidScreener.slots')}</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="outline" className="bg-background/50">{p('badges.screenerFree')}</Badge>
            <Badge variant="outline" className="bg-background/50">{p('badges.chartPatterns')}</Badge>
            <Badge variant="outline" className="bg-background/50">{p('badges.research')}</Badge>
          </div>

          {/* Social Proof */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <strong className="text-foreground">2,400+</strong> traders using ChartingPath
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" />
                <strong className="text-foreground">4.8/5</strong> avg. rating
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">14-day money-back guarantee</span>
              <span className="text-muted-foreground">· No questions asked</span>
            </div>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            {p('monthly')}
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === 'annual' ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
            {p('annual')}
          </span>
          {billingCycle === 'annual' && (
            <Badge variant="secondary">{p('savePercent')}</Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
          {tiers.map((tier) => {
            const displayPrice = billingCycle === 'annual' ? tier.annualMonthlyPrice : tier.monthlyPrice;
            return (
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
                    {p('mostPopular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                <div className="mt-3">
                  {displayPrice === 0 ? (
                    <div className="text-3xl font-bold text-foreground">{p('free')}</div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-foreground">
                        ${displayPrice}
                        <span className="text-sm text-muted-foreground font-normal">{p('perMonth')}</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${tier.annualYearlyPrice}{p('perYear')} · <span className="line-through">${tier.monthlyPrice * 12}/yr</span>
                        </div>
                      )}
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
                    <span className="text-muted-foreground">{p('labels.credits')}</span>
                    <span className="font-semibold text-foreground">{tier.config.monthlyCredits}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.manualAlerts')}</span>
                    <span className="font-semibold text-foreground">{tier.config.maxActiveAlerts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.planAlerts')}</span>
                    <span className={`font-semibold ${tier.config.maxPlanAlerts === 0 ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                      {tier.config.maxPlanAlerts === 0 ? '—' : `${tier.config.maxPlanAlerts}/${p('labels.perPlan')}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.tradingPlans')}</span>
                    <span className={`font-semibold ${tier.config.maxActivePlans <= 1 ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {tier.config.maxActivePlans >= 99 ? p('labels.unlimited') : tier.config.maxActivePlans}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scripts</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.monthlyScripts === -1 ? p('labels.unlimited') : `${tier.config.monthlyScripts}/mo`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.instruments')}</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.projects.setup_finder.maxInstruments}/run
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.lookback')}</span>
                    <span className="font-semibold text-foreground">
                      {tier.config.projects.setup_finder.maxLookbackYears}y
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.studyTFs')}</span>
                    <span className="font-semibold text-foreground text-right text-xs">
                      {tier.config.study.allowedTimeframes.map(tf => tf.toUpperCase()).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p('labels.watchlistSlots')}</span>
                    <span className={`font-semibold ${tier.config.maxWatchlistSlots === 0 ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                      {tier.config.maxWatchlistSlots === 0 ? '—' : 
                       tier.config.maxWatchlistSlots >= 9999 ? p('labels.unlimited') : 
                       tier.config.maxWatchlistSlots}
                    </span>
                  </div>
                </div>

                {/* Project Features */}
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{p('featureNames.patternScreener')}</span>
                  </div>
                  {tier.config.projects.pattern_lab.enabled !== false && (
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{p('featureNames.patternLab')}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{p('featureNames.portfolioTools')}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  <Button 
                    variant={tier.popular ? "default" : "outline"} 
                    className="w-full"
                    size="sm"
                    disabled={loading === tier.key}
                    onClick={() => handlePlanSelect(tier.key)}
                  >
                    {loading === tier.key ? p('loading') : tier.cta}
                    {loading !== tier.key && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Money-back guarantee reminder */}
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            All paid plans include a <strong className="text-foreground">14-day money-back guarantee</strong>. Cancel anytime, no questions asked.
          </p>
        </div>
        <Card className="mb-16 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {p('howCreditsWork')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {p('creditsExplained')}. {p('estimatedBefore')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{p('examples.patternLabSmall')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{p('examples.patternLabLarge')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Refresh Rates */}
        <Card className="mb-16 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {p('dataRefreshRates')}
            </CardTitle>
            <CardDescription>
              {p('dataRefreshDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">{p('core')}</Badge>
                </div>
                <p className="font-semibold text-foreground mb-1">{p('coreCharts')}</p>
                <p className="text-sm text-muted-foreground mb-2">{p('coreInstruments')}</p>
                <p className="text-xs text-blue-600 font-medium">{p('coreRefresh')}</p>
              </div>
              <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{p('fullUniverse')}</Badge>
                </div>
                <p className="font-semibold text-foreground mb-1">{p('fullCharts')}</p>
                <p className="text-sm text-muted-foreground mb-2">{p('fullInstruments')}</p>
                <p className="text-xs text-muted-foreground font-medium">{p('fullRefresh')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-16 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>{p('faqTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">{p('faq.timeframesQ')}</h4>
              <p className="text-sm text-muted-foreground">{p('faq.timeframesA')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{p('faq.freshnessQ')}</h4>
              <p className="text-sm text-muted-foreground">
                <strong>{p('faq.freshnessA1')}</strong><br/>
                <strong>{p('faq.freshnessA2')}</strong>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{p('faq.whatIsLabQ')}</h4>
              <p className="text-sm text-muted-foreground">{p('faq.whatIsLabA')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{p('faq.detectionQ')}</h4>
              <p className="text-sm text-muted-foreground">{p('faq.detectionA')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="grid gap-6 sm:grid-cols-3 mb-16">
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">{p('trust.execution')}</h3>
            <p className="text-sm text-muted-foreground">{p('trust.executionDesc')}</p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">{p('trust.bracket')}</h3>
            <p className="text-sm text-muted-foreground">{p('trust.bracketDesc')}</p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-6">
            <Target className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">{p('trust.alerts')}</h3>
            <p className="text-sm text-muted-foreground">{p('trust.alertsDesc')}</p>
          </Card>
        </div>

        {/* Educational Disclaimer */}
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>{t('about.disclaimerTitle')}</strong> {p('educationalDisclaimer')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsPricing;
