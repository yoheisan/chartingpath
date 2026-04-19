import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, Zap, TrendingUp, Star, Shield, Database, ArrowLeft, Mail, ChevronDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { track } from "@/services/analytics";
import { trackEvent } from "@/lib/analytics";
import { PageMeta } from "@/components/PageMeta";
import { useOutcomeCount } from "@/hooks/useOutcomeCount";
import { useTranslation } from "react-i18next";
import { PRICING_PLANS } from "@/constants/pricingPlans";
import { useCheckout, type PlanKey as CheckoutPlanKey } from "@/hooks/useCheckout";

const TIER_ICONS: Record<string, any> = {
  free: Zap,
  lite: TrendingUp,
  pro: Star,
  elite: Shield,
  data_api: Database,
};

const Pricing = () => {
  const { t } = useTranslation();
  const { formatted: outcomeCount } = useOutcomeCount();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const { startCheckout, loading: checkoutLoading, error: checkoutError } = useCheckout();

  useEffect(() => {
    track("pricing_viewed");
  }, []);

  useEffect(() => {
    if (checkoutError) toast.error(checkoutError);
  }, [checkoutError]);

  const getPlanCheckoutKey = (planKey: string): CheckoutPlanKey | null => {
    if (planKey === 'free' || planKey === 'data_api') return null;
    return `${planKey}_${billing}` as CheckoutPlanKey;
  };

  const mainPlans = PRICING_PLANS.filter(p => p.key !== 'data_api');
  const dataApiPlan = PRICING_PLANS.find(p => p.key === 'data_api');

  const getFeatures = (plan: typeof PRICING_PLANS[number]) => {
    return plan.features.map(f =>
      f.includes('(live count)') ? f.replace('(live count)', `(${outcomeCount} detections)`) : f
    );
  };

  const getPrice = (plan: typeof PRICING_PLANS[number]) => {
    if (plan.price.monthly === null) return t('pricingPage.contactUs', 'Contact us');
    if (billing === 'annual' && plan.price.annualLabel) return plan.price.annualLabel;
    return plan.price.monthlyLabel;
  };

  const faqs = [
    {
      q: t('pricingPage.faqQ1', 'What counts as a pattern outcome?'),
      a: t('pricingPage.faqA1', 'Every pattern ChartingPath detects is tracked through to its stop loss or take profit target based on ATR-derived levels. We record whether price hit TP or SL first, plus the R-multiple achieved.'),
    },
    {
      q: t('pricingPage.faqQ2', 'Is this financial advice?'),
      a: t('pricingPage.faqA2', 'No. ChartingPath is a data and research platform. Pattern outcomes are historical statistics, not predictions or recommendations.'),
    },
    {
      q: t('pricingPage.faqQ3', 'What instruments are covered?'),
      a: t('pricingPage.faqA3', 'FX majors (EURUSD, GBPUSD, USDJPY and others) and US equities. Coverage expands regularly.'),
    },
  ];

  const comparisonRows = [
    { label: t('pricingPage.compInstruments', 'Instruments'), free: '20 (stocks)', lite: 'All (stocks, FX, ETFs)', pro: 'All', elite: 'All' },
    { label: t('pricingPage.compTimeframes', 'Timeframes'), free: '1h', lite: '4h, 1d', pro: '1h, 4h, 1d, 1wk', elite: '1h, 4h, 1d, 1wk' },
    { label: t('pricingPage.compGrades', 'Pattern grades'), free: 'B & C', lite: 'B & C', pro: 'A, B & C', elite: 'A, B & C' },
    { label: t('pricingPage.compAlerts', 'Alerts'), free: '3 / day', lite: '10 / day', pro: 'Unlimited', elite: 'Unlimited (priority)' },
    { label: t('pricingPage.compHistory', 'Outcome history'), free: '7 days', lite: '90 days', pro: 'Full database', elite: 'Full database' },
    { label: t('pricingPage.compEdgeAtlas', 'Edge Atlas'), free: '—', lite: '✓', pro: '✓', elite: '✓' },
    { label: t('pricingPage.compCopilot', 'Copilot'), free: '—', lite: '—', pro: '✓', elite: '✓' },
    { label: t('pricingPage.compACS', 'ACS'), free: '—', lite: '—', pro: '—', elite: '✓' },
    { label: t('pricingPage.compAPI', 'API'), free: '—', lite: '—', pro: '—', elite: '✓' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={t('pricingPage.metaTitle', 'Simple Pricing. Serious Data. | ChartingPath')}
        description={t('pricingPage.metaDescription', 'Start free with live pattern scanning. Upgrade for full outcome data, AI Copilot, and backtesting across 424K+ detected patterns.')}
        canonicalPath="/pricing"
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('pricingPage.backToHome', 'Back to home')}
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('pricingPage.headline', 'Simple pricing. Serious data.')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
            {t('pricingPage.subheadline', 'Start free. Upgrade when you want deeper outcomes and Copilot access.')}
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-muted rounded-full p-1">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setBilling('monthly')}
            >
              {t('pricingPage.monthly', 'Monthly')}
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setBilling('annual')}
            >
              {t('pricingPage.annual', 'Annual')}
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-4 max-w-6xl mx-auto mb-10">
          {mainPlans.map((plan) => {
            const Icon = TIER_ICONS[plan.key] || Zap;
            const features = getFeatures(plan);
            return (
              <Card
                key={plan.key}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]"
                    : ""
                } ${plan.popular ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 whitespace-nowrap">
                      {t(`pricingPage.badge_${plan.key}`, plan.badge)}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{t(`pricingPage.${plan.key}Name`, plan.name)}</CardTitle>
                  </div>
                  <div className="text-xs text-primary font-medium mb-1">{t(`pricingPage.${plan.key}Tagline`, plan.tagline)}</div>
                  <div className="text-3xl font-bold">{getPrice(plan)}</div>
                  {billing === 'annual' && plan.price.savings && (
                    <Badge variant="secondary" className="mt-1 text-xs">{plan.price.savings}</Badge>
                  )}
                  <CardDescription className="text-sm mt-2">
                    {t(`pricingPage.${plan.key}Description`, plan.description)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 space-y-4">
                  <ul className="space-y-2.5 flex-1">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {(() => {
                    const checkoutKey = getPlanCheckoutKey(plan.key);
                    const isLoading = checkoutKey && checkoutLoading === checkoutKey;
                    if (checkoutKey) {
                      return (
                        <Button
                          className="w-full"
                          variant={plan.highlighted || plan.popular ? "default" : "outline"}
                          size="lg"
                          disabled={!!isLoading}
                          onClick={() => {
                            trackEvent("pricing.cta_click", { tier: plan.name });
                            startCheckout(checkoutKey);
                          }}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t(`pricingPage.${plan.key}Cta`, plan.cta)}
                        </Button>
                      );
                    }
                    return (
                      <Button
                        className="w-full"
                        variant={plan.highlighted || plan.popular ? "default" : "outline"}
                        size="lg"
                        asChild
                        onClick={() => trackEvent("pricing.cta_click", { tier: plan.name })}
                      >
                        <Link to={plan.ctaLink}>{t(`pricingPage.${plan.key}Cta`, plan.cta)}</Link>
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data API — separate row */}
        {dataApiPlan && (
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="flex flex-col sm:flex-row items-center gap-6 p-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold">{t('pricingPage.dataApiName', dataApiPlan.name)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{t('pricingPage.dataApiDescription', dataApiPlan.description)}</p>
                <ul className="space-y-1">
                  {dataApiPlan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" size="lg" asChild onClick={() => trackEvent("pricing.cta_click", { tier: 'Data API' })}>
                <a href={dataApiPlan.ctaLink}>
                  <Mail className="h-4 w-4 mr-2" />
                  {t('pricingPage.dataApiCta', dataApiPlan.cta)}
                </a>
              </Button>
            </Card>
          </div>
        )}

        {/* Comparison table */}
        <div className="max-w-5xl mx-auto mb-20">
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 mx-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
              {t('pricingPage.compareAll', 'Compare all plans')}
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground"></th>
                      <th className="py-3 px-3 font-semibold text-center">Free</th>
                      <th className="py-3 px-3 font-semibold text-center">Lite</th>
                      <th className="py-3 px-3 font-semibold text-center text-primary">Pro</th>
                      <th className="py-3 px-3 font-semibold text-center">Elite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{row.free}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{row.lite}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{row.pro}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{row.elite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t('pricingPage.faqTitle', 'Frequently asked questions')}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
