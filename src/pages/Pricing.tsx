import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Zap, TrendingUp, Star, Database, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { track } from "@/services/analytics";
import { trackEvent } from "@/lib/analytics";
import { PageMeta } from "@/components/PageMeta";
import { useOutcomeCount } from "@/hooks/useOutcomeCount";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const { t } = useTranslation();

  useEffect(() => {
    track("pricing_viewed");
  }, []);

  const tiers = [
    {
      nameKey: 'pricingPage.freeName',
      name: t('pricingPage.freeName', 'Free'),
      price: t('pricingPage.freePrice', '$0 / month'),
      description: t('pricingPage.freeDescription', 'Get started with live pattern scanning.'),
      icon: Zap,
      features: [
        t('pricingPage.freeFeature1', 'Live pattern scanner (20+ instruments)'),
        t('pricingPage.freeFeature2', '3 pattern alerts per day'),
        t('pricingPage.freeFeature3', '7-day outcome history'),
        t('pricingPage.freeFeature4', 'Community access'),
      ],
      cta: t('pricingPage.freeCta', 'Start free'),
      ctaLink: "/auth?mode=signup",
      popular: false,
      variant: "outline" as const,
    },
    {
      nameKey: 'pricingPage.liteName',
      name: t('pricingPage.liteName', 'Lite'),
      price: t('pricingPage.litePrice', '$12 / month'),
      description: t('pricingPage.liteDescription', 'Full outcome history and more alert capacity.'),
      icon: TrendingUp,
      features: [
        t('pricingPage.liteFeature1', 'Everything in Free'),
        t('pricingPage.liteFeature2', 'Full 90-day outcome history'),
        t('pricingPage.liteFeature3', 'Win rates by pattern & timeframe'),
        t('pricingPage.liteFeature4', '5 active alerts'),
        t('pricingPage.liteFeature5', '4H and above timeframes'),
        t('pricingPage.liteFeature6', '2 trading plans'),
      ],
      cta: t('pricingPage.liteCta', 'Start Lite'),
      ctaLink: "/auth?mode=signup&plan=lite",
      popular: true,
      variant: "default" as const,
    },
    {
      nameKey: 'pricingPage.proName',
      name: t('pricingPage.proName', 'Pro'),
      price: t('pricingPage.proPrice', '$79 / month'),
      description: t('pricingPage.proDescription', 'Full outcome data and AI Copilot access.'),
      icon: Star,
      features: [
        t('pricingPage.proFeature1', 'Everything in Free'),
        t('pricingPage.proFeature2', 'Full outcome database (63K+ detections)'),
        t('pricingPage.proFeature3', 'Win rates by pattern, timeframe, instrument'),
        t('pricingPage.proFeature4', 'Unlimited pattern alerts'),
        t('pricingPage.proFeature5', 'ChartingPath Copilot (AI trading assistant)'),
        t('pricingPage.proFeature6', 'Pattern Lab backtester'),
        t('pricingPage.proFeature7', 'Paper trading simulator'),
      ],
      cta: t('pricingPage.proCta', 'Start Pro'),
      ctaLink: "/auth?mode=signup&plan=pro",
      popular: false,
      variant: "outline" as const,
    },
    {
      nameKey: 'pricingPage.dataApiName',
      name: t('pricingPage.dataApiName', 'Data API'),
      price: t('pricingPage.dataApiPrice', 'Contact us'),
      description: t('pricingPage.dataApiDescription', "Institutional access to ChartingPath's outcome dataset."),
      icon: Database,
      features: [
        t('pricingPage.dataApiFeature1', 'REST API access to full outcome database'),
        t('pricingPage.dataApiFeature2', 'Pattern outcomes by instrument × timeframe × regime'),
        t('pricingPage.dataApiFeature3', 'Custom data exports'),
        t('pricingPage.dataApiFeature4', 'Priority support'),
      ],
      cta: t('pricingPage.dataApiCta', 'Get in touch'),
      ctaLink: "mailto:yohei@chartingpath.com",
      popular: false,
      variant: "outline" as const,
      isExternal: true,
    },
  ];

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

        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('pricingPage.headline', 'Simple pricing. Serious data.')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('pricingPage.subheadline', 'Start free. Upgrade when you want deeper outcomes and Copilot access.')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 max-w-6xl mx-auto mb-20">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.nameKey}
                className={`relative flex flex-col ${
                  tier.popular
                    ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]"
                    : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      {t('pricingPage.mostPopular', 'Most popular')}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                  </div>
                  <div className="text-3xl font-bold">{tier.price}</div>
                  <CardDescription className="text-sm mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 space-y-4">
                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.isExternal ? (
                    <Button
                      className="w-full gap-2"
                      variant={tier.variant}
                      size="lg"
                      asChild
                      onClick={() =>
                        trackEvent("pricing.cta_click", { tier: tier.name })
                      }
                    >
                      <a href={tier.ctaLink}>
                        <Mail className="h-4 w-4" />
                        {tier.cta}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={tier.variant}
                      size="lg"
                      asChild
                      onClick={() =>
                        trackEvent("pricing.cta_click", { tier: tier.name })
                      }
                    >
                      <Link to={tier.ctaLink}>{tier.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

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
