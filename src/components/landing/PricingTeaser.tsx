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
      name: t('pricingTeaser.free', 'Free'),
      tagline: t('pricingTeaser.freeTagline', 'Explore'),
      description: t('pricingTeaser.freeDescription', 'See live pattern signals and explore the outcome database.'),
      features: [
        t('pricingTeaser.freeFeature1', 'Live pattern scanner (all asset classes)'),
        t('pricingTeaser.freeFeature2', 'Basic outcome data (last 7 days)'),
        t('pricingTeaser.freeFeature3', '3 active alerts'),
        t('pricingTeaser.freeFeature4', 'Grade C & B patterns'),
        t('pricingTeaser.freeFeature5', '1 trading plan'),
      ],
      cta: t('pricingTeaser.startFree', 'Start Free →'),
    },
    {
      name: t('pricingTeaser.lite', 'Lite'),
      tagline: t('pricingTeaser.liteTagline', 'Getting Started'),
      description: t('pricingTeaser.liteDescription', 'Full outcome history and more alert capacity.'),
      features: [
        t('pricingTeaser.liteFeature1', 'Everything in Free'),
        t('pricingTeaser.liteFeature2', 'Full 90-day outcome history'),
        t('pricingTeaser.liteFeature3', 'Win rates by pattern & timeframe'),
        t('pricingTeaser.liteFeature4', '5 active alerts'),
        t('pricingTeaser.liteFeature5', '4H and above timeframes'),
        t('pricingTeaser.liteFeature6', '2 trading plans'),
      ],
      price: "$12",
      popular: true,
      cta: t('pricingTeaser.startLite', 'Start Lite'),
    },
    {
      name: t('pricingTeaser.pro', 'Pro'),
      tagline: t('pricingTeaser.proTagline', 'Serious Trading'),
      description: t('pricingTeaser.proDescription', 'Complete outcome database, Edge Atlas, and Copilot access.'),
      features: [
        t('pricingTeaser.proFeature1', 'Everything in Lite'),
        t('pricingTeaser.proFeature2', 'Full outcome database (424K+ detections)'),
        t('pricingTeaser.proFeature3', 'Edge Atlas — patterns ranked by annualized return'),
        t('pricingTeaser.proFeature4', 'ChartingPath Copilot (AI assistant)'),
        t('pricingTeaser.proFeature5', 'All timeframes including 1H'),
        t('pricingTeaser.proFeature6', '100 active alerts'),
        t('pricingTeaser.proFeature7', '10 trading plans'),
        t('pricingTeaser.proFeature8', 'Paper trading simulator'),
      ],
      highlighted: true,
      price: "$79",
      cta: t('pricingTeaser.startPro', 'Start Pro'),
    },
  ];

  const handlePricingClick = () => {
    track('pricing_viewed', { source: 'landing_pricing_teaser' });
    trackEvent('landing.cta_click', { button: 'pricing_teaser_see_full' });
  };

  return (
    <section className="py-24 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">{t('pricingTeaser.sectionLabel', 'Pricing')}</p>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">{t('pricingTeaser.title', 'Simple pricing. Serious data.')}</h2>
          <p className="text-base text-muted-foreground">
            {t('pricingTeaser.subtitle', 'Start free. Upgrade when you want deeper outcomes and Copilot access.')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border/30 rounded-xl overflow-visible border border-border/30 mb-10 pt-3">
          {plans.map((plan, planIdx) => (
            <div
              key={plan.name}
              className={`p-6 bg-card/30 relative ${plan.highlighted ? 'bg-primary/[0.03]' : ''} ${plan.popular ? 'ring-1 ring-primary/50' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                  {t('pricingTeaser.mostPopular', 'Most Popular')}
                </span>
              )}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-bold">{plan.name}</span>
                {plan.price && (
                  <span className="text-sm font-mono text-muted-foreground">{plan.price}<span className="text-xs">/{t('pricingTeaser.perMonth', 'mo')}</span></span>
                )}
              </div>
              <div className="text-xs text-primary font-medium mb-1">{plan.tagline}</div>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {/* CTA for each plan */}
              <Button asChild size="sm" variant={planIdx === 0 ? 'default' : 'outline'} className="mt-4 w-full" onClick={() => {
                track(`pricing_start_${plan.name.toLowerCase()}`, { source: 'landing_pricing_teaser' });
                trackEvent('landing.cta_click', { button: `pricing_start_${plan.name.toLowerCase()}` });
              }}>
                <Link to="/auth?mode=signup">
                  {plan.cta}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="sm" onClick={handlePricingClick} className="gap-2">
            <Link to="/pricing">
              {t('pricingTeaser.seeFullPricing', 'See Full Pricing')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;