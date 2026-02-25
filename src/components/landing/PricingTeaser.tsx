import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "@/services/analytics";
import { trackEvent } from '@/lib/analytics';
import { useTranslation } from "react-i18next";

export const PricingTeaser = () => {
  const { t } = useTranslation();

  const plans = [
    {
      name: t('pricingTeaser.free'),
      tagline: t('pricingTeaser.freeTagline'),
      features: [
        t('pricingTeaser.creditsPerMonth', { count: 50 }),
        t('pricingTeaser.activeAlerts', { count: 3 }),
        t('pricingTeaser.basicPatterns'),
      ],
    },
    {
      name: t('pricingTeaser.lite'),
      tagline: t('pricingTeaser.liteTagline'),
      features: [
        t('pricingTeaser.creditsPerMonth', { count: 100 }),
        t('pricingTeaser.activeAlerts', { count: 5 }),
        t('pricingTeaser.timeframe4h'),
      ],
      highlighted: false,
      price: "$12/mo",
    },
    {
      name: t('pricingTeaser.pro'),
      tagline: t('pricingTeaser.proTagline'),
      features: [
        t('pricingTeaser.creditsPerMonth', { count: 900 }),
        t('pricingTeaser.activeAlerts', { count: 100 }),
        t('pricingTeaser.allTimeframes'),
      ],
      highlighted: true,
      price: "$79/mo",
    },
  ];

  const handlePricingClick = () => {
    track('pricing_viewed', { source: 'landing_pricing_teaser' });
    trackEvent('landing.cta_click', { button: 'pricing_teaser_see_full' });
  };

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">{t('pricingTeaser.title')}</h2>
          <p className="text-muted-foreground">
            {t('pricingTeaser.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`text-center ${plan.highlighted ? 'border-primary ring-1 ring-primary/20' : ''}`}
            >
              <CardContent className="p-6">
                <div className="text-lg font-bold mb-1">{plan.name}</div>
                <div className="text-sm text-primary mb-4">{plan.tagline}</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 justify-center">
                      <Check className="h-3.5 w-3.5 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" variant="outline" onClick={handlePricingClick}>
            <Link to="/pricing">
              {t('pricingTeaser.seeFullPricing')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;