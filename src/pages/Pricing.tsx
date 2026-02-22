import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Crown, Zap, ArrowLeft, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPricingClicked, trackCheckoutStarted } from "@/services/analytics";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);

  // Track pricing page view from paywall
  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'paywall') {
      trackPricingClicked({ source: 'paywall' });
    }
  }, [searchParams]);

  // Map display plan names to database plan_pricing keys
  const planNameToDbPlan: Record<string, string> = {
    free: 'free',
    lite: 'starter',
    plus: 'pro',
    pro: 'pro_plus',
    team: 'elite',
  };

  const handlePlanSelect = (planName: string) => {
    const dbPlan = planNameToDbPlan[planName.toLowerCase()];
    
    if (dbPlan === 'free') {
      window.location.href = '/auth';
      return;
    }

    trackPricingClicked({ source: 'plan_select', current_plan: planName.toLowerCase() });
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'plan_checkout_opened', {
        event_category: 'Pricing',
        event_label: planName
      });
    }
    
    createSubscription(dbPlan, planName);
  };

  const createSubscription = async (dbPlan: string, displayName: string) => {
    try {
      trackCheckoutStarted({
        plan: dbPlan,
        billing_cycle: isAnnual ? 'annual' : 'monthly',
        source: 'pricing_page'
      });

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan: dbPlan,
          billing_cycle: isAnnual ? 'annual' : 'monthly'
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to start checkout. Please try again or contact support.');
    }
  };

  const calculateMonthlySavings = (monthlyPrice: number, annualPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  const planKeys = ['free', 'lite', 'plus', 'pro', 'team'] as const;

  const plans = [
    {
      key: 'free',
      price: 0,
      annualPrice: 0,
      features: [
        "Daily (1D) timeframe charts only",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "6 classic chart patterns (Double Top/Bottom, H&S, Triangles)",
        "3 active pattern alerts",
        "50 credits/month for Pattern Lab research",
        "Demo-only backtesting (prebuilt examples)",
        "Basic pattern recognition learning guides"
      ],
      dataRefresh: "Daily scans updated every 24h",
      limitations: ["Daily (1D) charts only"],
      popular: false,
      icon: Zap
    },
    {
      key: 'lite',
      price: 12,
      annualPrice: 120,
      features: [
        "Daily + 8H + 4H + 15-minute timeframe charts",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "8 chart patterns (incl. Channels, Flags)",
        "5 active pattern alerts",
        "100 credits/month for Pattern Lab research",
        "Basic backtesting: up to 2 years of historical data",
        "Email support"
      ],
      dataRefresh: "4H: Every 4h • 15m: Top 300 every 15m",
      limitations: [],
      popular: false,
      icon: Zap
    },
    {
      key: 'plus',
      price: 29,
      annualPrice: 290,
      features: [
        "All timeframes (15m, 1H, 4H, 8H, Daily, Weekly)",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "10 chart patterns (incl. Wedges, Cup & Handle)",
        "25 active pattern alerts",
        "300 credits/month for deep research",
        "Full backtesting: up to 3 years of data",
        "Advanced risk & pip calculators",
        "Priority email support"
      ],
      dataRefresh: "1H: Core 1,100 hourly • 4H: All 8,500+ every 4h",
      limitations: [],
      popular: false,
      icon: Star
    },
    {
      key: 'pro',
      price: 79,
      annualPrice: 790,
      features: [
        "All timeframes (15m, 1H, 4H, 8H, Daily, Weekly)",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "Full pattern library (12 patterns incl. premium)",
        "100 active pattern alerts",
        "900 credits/month for unlimited research",
        "Multi-platform script export (TradingView, MT4/MT5)",
        "Full backtesting: up to 5 years daily, 7 years weekly",
        "Advanced metrics & trade analytics",
        "Priority support"
      ],
      dataRefresh: "1H: Core 1,100 hourly • 4H/Daily: Full 8,500+ real-time",
      limitations: [],
      popular: true,
      icon: Star
    },
    {
      key: 'team',
      price: 199,
      annualPrice: 1990,
      features: [
        "All timeframes (15m, 1H, 4H, 8H, Daily, Weekly)",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "Complete pattern library (15+ patterns)",
        "500 active pattern alerts",
        "3000 credits/month for team research",
        "Script conversion across ALL platforms",
        "Full backtesting: up to 10 years of data",
        "Priority queues & VIP support",
        "Early access to new features"
      ],
      dataRefresh: "All timeframes: Full 8,500+ instruments, fastest refresh rates",
      limitations: [],
      popular: false,
      icon: Crown
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('pricingPage.backToHome')}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            {t('pricingPage.headline')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            {t('pricingPage.subheadline')}
          </p>
          
          {/* Value Proposition */}
          <div className="max-w-4xl mx-auto mb-8 p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t('pricingPage.whyTraders')}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-background/80 rounded-xl border border-border/30">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium text-foreground mb-1">{t('pricingPage.outcomeProof')}</div>
                <div className="text-muted-foreground">{t('pricingPage.outcomeProofDesc')}</div>
              </div>
              <div className="p-4 bg-background/80 rounded-xl border border-border/30">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium text-foreground mb-1">{t('pricingPage.proFeatures')}</div>
                <div className="text-muted-foreground">{t('pricingPage.proFeaturesDesc')}</div>
              </div>
              <div className="p-4 bg-background/80 rounded-xl border border-border/30">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-foreground mb-1">{t('pricingPage.patternFirst')}</div>
                <div className="text-muted-foreground">{t('pricingPage.patternFirstDesc')}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-8">
            <span className="px-3 py-1 bg-muted rounded-full">📊 {t('pricingPage.usStocks')}</span>
            <span className="px-3 py-1 bg-muted rounded-full">₿ {t('pricingPage.cryptos')}</span>
            <span className="px-3 py-1 bg-muted rounded-full">💱 {t('pricingPage.forexPairs')}</span>
            <span className="px-3 py-1 bg-muted rounded-full">🛢️ {t('pricingPage.commodities')}</span>
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

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
            const savings = plan.annualPrice ? calculateMonthlySavings(plan.price, plan.annualPrice) : null;
            const planName = t(`pricingPage.plans.${plan.key}.name`);
            const planDesc = t(`pricingPage.plans.${plan.key}.description`);
            const planButton = t(`pricingPage.plans.${plan.key}.button`);

            return (
              <Card 
                key={plan.key} 
                className={`relative ${plan.popular ? 'border-primary shadow-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      {t('pricingPage.mostPopular')}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">{planName}</CardTitle>
                  </div>
                  
                  <div className="space-y-2">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold text-foreground">
                        {t('pricingPage.free')}
                        <span className="text-lg text-muted-foreground"> {t('pricingPage.forever')}</span>
                      </div>
                    ) : isAnnual && plan.annualPrice ? (
                      <div>
                        <div className="text-4xl font-bold text-foreground">
                          ${Math.round(plan.annualPrice / 12)}
                          <span className="text-lg text-muted-foreground">{t('pricingPage.month')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('pricingPage.billedAnnually')} (${plan.annualPrice})
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          ${plan.price}{t('pricingPage.monthlyBilling')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-foreground">
                        ${plan.price}
                        <span className="text-lg text-muted-foreground">{t('pricingPage.month')}</span>
                      </div>
                    )}
                    
                    {isAnnual && savings && plan.price > 0 && (
                      <div className="text-sm text-accent font-semibold">
                        {t('pricingPage.savePerYear', { amount: savings.savings })}
                      </div>
                    )}
                  </div>
                  
                  <CardDescription className="text-base">
                    {planDesc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {plan.dataRefresh && (
                    <div className="p-2 bg-muted/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-medium">{plan.dataRefresh}</span>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => {
                      const isTimeframeFeature = index === 0 && feature.toLowerCase().includes('timeframe');
                      const isLimited = feature.toLowerCase().includes('daily') && feature.toLowerCase().includes('only');
                      
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isLimited ? 'text-amber-500' : 'text-primary'}`} />
                          <span className={`text-sm ${isTimeframeFeature ? 'font-medium text-foreground' : 'text-muted-foreground'} ${isLimited ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePlanSelect(planName)}
                  >
                    {planButton}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Billing Info Section */}
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('pricingPage.flexibleBilling')}
            </h3>
            <p className="text-muted-foreground">
              {t('pricingPage.flexibleBillingDesc')}
            </p>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('pricingPage.faqTitle')}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
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

            <AccordionItem value="platform-compatibility">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.platformQ')}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{t('pricingPage.faq.platformA')}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="billing-upgrades">
              <AccordionTrigger className="text-left">
                {t('pricingPage.faq.billingQ')}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{t('pricingPage.faq.billingA')}</p>
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

        {/* Pricing Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground text-center">
            <strong>{t('about.disclaimerTitle')}</strong> {t('pricingPage.disclaimerEducational')}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> {t('pricingPage.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
