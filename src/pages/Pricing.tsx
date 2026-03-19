import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Crown, Zap, ArrowLeft, Star, Shield, Users, TrendingUp, Clock } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPricingClicked, trackCheckoutStarted, track } from "@/services/analytics";
import { useTranslation } from "react-i18next";
import { PageMeta } from '@/components/PageMeta';

const Pricing = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(true); // Default to annual for higher conversion

  useEffect(() => {
    track('pricing_viewed');
    const source = searchParams.get('source');
    if (source === 'paywall') {
      trackPricingClicked({ source: 'paywall' });
    }
  }, [searchParams]);

  const planNameToDbPlan: Record<string, string> = {
    free: 'free',
    lite: 'starter',
    plus: 'pro',
    pro: 'pro_plus',
    team: 'elite',
  };

  const handlePlanSelect = (planKey: string) => {
    const dbPlan = planNameToDbPlan[planKey.toLowerCase()];
    
    if (dbPlan === 'free') {
      window.location.href = '/auth';
      return;
    }

    trackCheckoutStarted({
      plan: dbPlan || planKey,
      billing_cycle: isAnnual ? 'annual' : 'monthly',
      source: 'pricing_page'
    });

    toast(t('pricing.paymentsComingSoonTitle'), {
      description: t('pricing.paymentsComingSoonDesc'),
      duration: 8000,
    });
  };

  const calculateMonthlySavings = (monthlyPrice: number, annualPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  // Focused 3-tier layout: Free / Plus (recommended) / Pro
  const corePlans = [
    {
      key: 'free',
      price: 0,
      annualPrice: 0,
      features: [
        "Daily (1D) timeframe only",
        "1,100+ instruments screened",
        "6 classic chart patterns",
        "3 active alerts",
        "50 credits/month",
        "3 scripts/month",
        "Demo backtesting",
      ],
      popular: false,
      icon: Zap,
      cta: 'Start Free Now →',
      freeTagline: 'Start free today — no credit card, no time limit. Upgrade when you\'re ready.',
    },
    {
      key: 'plus',
      price: 29,
      annualPrice: 290,
      features: [
        "All timeframes (15m → Weekly)",
        "1,100+ instruments screened",
        "10 chart patterns",
        "25 active alerts",
        "300 credits/month",
        "30 scripts/month",
        "Full backtesting (3 years)",
        "Risk & pip calculators",
        "Priority email support",
      ],
      popular: true,
      icon: Star,
      cta: 'Start Plus Plan',
    },
    {
      key: 'pro',
      price: 79,
      annualPrice: 790,
      features: [
        "Everything in Plus, and:",
        "Full pattern library (12+)",
        "100 active alerts",
        "900 credits/month",
        "100 scripts/month",
        "Script export (TV, MT4/MT5)",
        "Full backtesting (5+ years)",
        "Advanced trade analytics",
        "Priority support",
      ],
      popular: false,
      icon: Crown,
      cta: 'Start Pro Plan',
    },
  ];

  const expandedPlans = [
    {
      key: 'lite',
      price: 12,
      annualPrice: 120,
      features: [
        "Daily + 8H + 4H + 15m timeframes",
        "1,100+ instruments screened",
        "8 chart patterns",
        "5 active alerts",
        "100 credits/month",
        "10 scripts/month",
        "Basic backtesting (2 years)",
        "Email support",
      ],
      icon: Zap,
      cta: 'Start Lite Plan',
    },
    {
      key: 'team',
      price: 199,
      annualPrice: 1990,
      features: [
        "Everything in Pro, and:",
        "15+ patterns",
        "500 active alerts",
        "3000 credits/month",
        "Unlimited scripts",
        "Full 10-year backtesting",
        "Priority queues & VIP support",
        "Early access to new features",
      ],
      icon: Crown,
      cta: 'Start Team Plan',
    },
  ];

  const [showAllPlans, setShowAllPlans] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Pricing — Free Forever Tier Available | ChartingPath"
        description="Start free with 50 credits per month, 3 active alerts and live screener access. Upgrade to Lite or Pro for more backtests, alerts and advanced features."
        canonicalPath="/projects/pricing"
      />
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('pricingPage.backToHome')}
          </Link>
        </div>

        {/* Header — simplified */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            {t('pricingPage.headline')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
            {t('pricingPage.subheadline')}
          </p>

          {/* Social Proof Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">2,400+</strong> traders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">320K+</strong> backtested outcomes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">1,100+</strong> instruments tracked daily</span>
            </div>
          </div>

          {/* Money-Back Guarantee */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-foreground mb-8">
            <Shield className="h-4 w-4 text-primary" />
            14-day money-back guarantee on annual plans · Cancel anytime
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('pricingPage.monthly')}
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('pricingPage.annually')}
            </span>
          </div>
          {isAnnual && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
              💰 {t('pricingPage.saveUpTo')}
            </div>
          )}
        </div>

        {/* Core 3-Column Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {corePlans.map((plan) => {
            const Icon = plan.icon;
            const savings = plan.annualPrice ? calculateMonthlySavings(plan.price, plan.annualPrice) : null;
            const planName = t(`pricingPage.plans.${plan.key}.name`);
            const planDesc = t(`pricingPage.plans.${plan.key}.description`);

            return (
              <Card 
                key={plan.key} 
                className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-glow ring-1 ring-primary/20 scale-[1.02]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      {t('pricingPage.mostPopular')}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{planName}</CardTitle>
                  </div>
                  
                  <div className="space-y-1">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-bold text-foreground">
                        {t('pricingPage.free')}
                        <span className="text-base text-muted-foreground"> {t('pricingPage.forever')}</span>
                      </div>
                    ) : isAnnual && plan.annualPrice ? (
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          ${Math.round(plan.annualPrice / 12)}
                          <span className="text-base text-muted-foreground">{t('pricingPage.month')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('pricingPage.billedAnnually')} (${plan.annualPrice})
                        </div>
                        {savings && (
                          <div className="text-xs text-accent font-semibold mt-1">
                            Save ${savings.savings}/yr ({savings.percentage}% off)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-foreground">
                        ${plan.price}
                        <span className="text-base text-muted-foreground">{t('pricingPage.month')}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardDescription className="text-sm mt-2">
                    {planDesc}
                  </CardDescription>
                  {plan.freeTagline && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{plan.freeTagline}</p>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col flex-1 space-y-4">
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${plan.popular ? 'shadow-md' : ''}`}
                    variant={plan.popular || plan.key === 'free' ? "default" : "outline"}
                    size="lg"
                    onClick={() => handlePlanSelect(plan.key)}
                  >
                    {plan.cta}
                  </Button>

                  {plan.popular && (
                    <p className="text-xs text-center text-muted-foreground">
                      No credit card required to start
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Expand to see Lite & Team */}
        <div className="text-center mb-12">
          <button
            onClick={() => setShowAllPlans(!showAllPlans)}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            {showAllPlans ? 'Show fewer plans' : 'See Lite ($12/mo) and Team ($199/mo) plans'}
          </button>

          {showAllPlans && (
            <div className="grid gap-6 md:grid-cols-2 mt-6 max-w-3xl mx-auto">
              {expandedPlans.map((plan) => {
                const Icon = plan.icon;
                const savings = plan.annualPrice ? calculateMonthlySavings(plan.price, plan.annualPrice) : null;
                const planName = t(`pricingPage.plans.${plan.key}.name`);
                const planDesc = t(`pricingPage.plans.${plan.key}.description`);

                return (
                  <Card key={plan.key} className="flex flex-col">
                    <CardHeader className="text-center pb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{planName}</CardTitle>
                      </div>
                      <div className="space-y-1">
                        {isAnnual && plan.annualPrice ? (
                          <div>
                            <div className="text-3xl font-bold text-foreground">
                              ${Math.round(plan.annualPrice / 12)}
                              <span className="text-base text-muted-foreground">{t('pricingPage.month')}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('pricingPage.billedAnnually')} (${plan.annualPrice})
                            </div>
                            {savings && (
                              <div className="text-xs text-accent font-semibold mt-1">
                                Save ${savings.savings}/yr
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-foreground">
                            ${plan.price}
                            <span className="text-base text-muted-foreground">{t('pricingPage.month')}</span>
                          </div>
                        )}
                      </div>
                      <CardDescription className="text-sm mt-2">{planDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 space-y-4">
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant="outline" onClick={() => handlePlanSelect(plan.key)}>
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Trust Signals Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Shield, label: '14-Day Guarantee', sub: 'Annual plans' },
            { icon: Clock, label: 'Cancel Anytime', sub: 'No lock-in' },
            { icon: Zap, label: 'Instant Access', sub: 'Start in seconds' },
            { icon: Users, label: 'Active Community', sub: '2,400+ traders' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 border border-border/30">
              <item.icon className="h-5 w-5 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.sub}</span>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('pricingPage.faqTitle')}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            <AccordionItem value="money-back">
              <AccordionTrigger className="text-left">
                Is there a money-back guarantee?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-2">
                  <p>Yes! Annual plans come with a <strong className="text-foreground">14-day money-back guarantee</strong>. If you're not satisfied, contact us within 14 days for a full refund.</p>
                  <p>Monthly plans can be cancelled anytime — you'll retain access until the end of your billing period.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upgrade-payment">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.upgradeQ')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-3">
                  <p><strong>Upgrading:</strong> {t('pricingPage.faq.upgradeA1')}</p>
                  <p><strong>Downgrading:</strong> {t('pricingPage.faq.upgradeA2')}</p>
                  <p className="font-medium text-foreground">{t('pricingPage.faq.upgradeA3')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel-anytime">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.cancelQ')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-2">
                  <p>{t('pricingPage.faq.cancelA1')}</p>
                  <p className="font-medium text-foreground">{t('pricingPage.faq.cancelA2')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="script-library">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.scriptLibQ')}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{t('pricingPage.faq.scriptLibA')}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund-policy">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.refundQ')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-2">
                  <p>{t('pricingPage.faq.refundA1')}</p>
                  <p>{t('pricingPage.faq.refundA2')}</p>
                  <p className="font-medium text-foreground">{t('pricingPage.faq.refundA3')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-refresh-rates">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.refreshQ')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-3">
                  <p>{t('pricingPage.faq.refreshA')}</p>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Daily (1D) & Weekly (1W):</strong> {t('pricingPage.faq.refreshDaily')}</li>
                    <li><strong>4-Hour (4H):</strong> {t('pricingPage.faq.refresh4h')}</li>
                    <li><strong>Hourly (1H):</strong> {t('pricingPage.faq.refresh1h')}</li>
                    <li><strong>15-Minute (15m):</strong> {t('pricingPage.faq.refresh15m')}</li>
                  </ul>
                  <p className="text-xs italic">{t('pricingPage.faq.refreshNote')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground text-center">
            <strong>{t('about.disclaimerTitle')}</strong> {t('pricingPage.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
