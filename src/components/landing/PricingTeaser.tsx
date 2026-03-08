import { Button } from "@/components/ui/button";
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
      price: "$12",
      popular: true,
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
      price: "$79",
    },
  ];

  const handlePricingClick = () => {
    track('pricing_viewed', { source: 'landing_pricing_teaser' });
    trackEvent('landing.cta_click', { button: 'pricing_teaser_see_full' });
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Pricing</p>
          <h2 className="text-3xl font-bold mb-2">{t('pricingTeaser.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('pricingTeaser.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 bg-card/30 ${plan.highlighted ? 'bg-primary/[0.03]' : ''}`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-bold">{plan.name}</span>
                {plan.price && (
                  <span className="text-sm font-mono text-muted-foreground">{plan.price}<span className="text-xs">/mo</span></span>
                )}
              </div>
              <div className="text-xs text-primary font-medium mb-4">{plan.tagline}</div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="sm" onClick={handlePricingClick} className="gap-2">
            <Link to="/pricing">
              {t('pricingTeaser.seeFullPricing')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;
