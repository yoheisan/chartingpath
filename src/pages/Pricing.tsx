import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Zap, Star, Database, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { track } from "@/services/analytics";
import { trackEvent } from "@/lib/analytics";
import { PageMeta } from "@/components/PageMeta";

const Pricing = () => {
  useEffect(() => {
    track("pricing_viewed");
  }, []);

  const tiers = [
    {
      name: "Free",
      price: "$0 / month",
      description: "Get started with live pattern scanning.",
      icon: Zap,
      features: [
        "Live pattern scanner (20+ instruments)",
        "3 pattern alerts per day",
        "7-day outcome history",
        "Community access",
      ],
      cta: "Start free",
      ctaLink: "/auth?mode=signup",
      popular: false,
      variant: "outline" as const,
    },
    {
      name: "Pro",
      price: "$79 / month",
      description: "Full outcome data and AI Copilot access.",
      icon: Star,
      features: [
        "Everything in Free",
        "Full outcome database (63K+ detections)",
        "Win rates by pattern, timeframe, instrument",
        "Unlimited pattern alerts",
        "ChartingPath Copilot (AI trading assistant)",
        "Pattern Lab backtester",
        "Paper trading simulator",
      ],
      cta: "Start Pro",
      ctaLink: "/auth?mode=signup&plan=pro",
      popular: true,
      variant: "default" as const,
    },
    {
      name: "Data API",
      price: "Contact us",
      description: "Institutional access to ChartingPath's outcome dataset.",
      icon: Database,
      features: [
        "REST API access to full outcome database",
        "Pattern outcomes by instrument × timeframe × regime",
        "Custom data exports",
        "Priority support",
      ],
      cta: "Get in touch",
      ctaLink: "mailto:yohei@chartingpath.com",
      popular: false,
      variant: "outline" as const,
      isExternal: true,
    },
  ];

  const faqs = [
    {
      q: "What counts as a pattern outcome?",
      a: "Every pattern ChartingPath detects is tracked through to its stop loss or take profit target based on ATR-derived levels. We record whether price hit TP or SL first, plus the R-multiple achieved.",
    },
    {
      q: "Is this financial advice?",
      a: "No. ChartingPath is a data and research platform. Pattern outcomes are historical statistics, not predictions or recommendations.",
    },
    {
      q: "What instruments are covered?",
      a: "FX majors (EURUSD, GBPUSD, USDJPY and others) and US equities. Coverage expands regularly.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Simple Pricing. Serious Data. | ChartingPath"
        description="Start free with live pattern scanning. Upgrade for full outcome data, AI Copilot, and backtesting across 63K+ detected patterns."
        canonicalPath="/pricing"
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Back */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple pricing. Serious data.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when you want deeper outcomes and Copilot access.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-20">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.popular
                    ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]"
                    : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Most popular
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

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently asked questions
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
