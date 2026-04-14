import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "@/services/analytics";
import { trackEvent } from '@/lib/analytics';
import { useTranslation } from "react-i18next";
import { PRICING_TEASER_PLANS } from "@/constants/pricingPlans";

export const PricingTeaser = () => {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const handlePricingClick = () => {
    track('pricing_viewed', { source: 'landing_pricing_teaser' });
    trackEvent('landing.cta_click', { button: 'pricing_teaser_see_full' });
  };

  const getPrice = (plan: typeof PRICING_TEASER_PLANS[number]) => {
    if (plan.price.monthly === null) return 'Contact us';
    if (billing === 'annual' && plan.price.annualLabel) return plan.price.annualLabel;
    return plan.price.monthlyLabel;
  };

  return (
    <section className="py-24 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">{t('pricingTeaser.sectionLabel', 'Pricing')}</p>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">{t('pricingTeaser.title', 'Simple pricing. Serious data.')}</h2>
          <p className="text-base text-muted-foreground mb-6">
            {t('pricingTeaser.subtitle', 'Start free. Upgrade when you want deeper outcomes and Copilot access.')}
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-muted rounded-full p-1">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setBilling('monthly')}
            >
              {t('pricingTeaser.monthly', 'Monthly')}
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setBilling('annual')}
            >
              {t('pricingTeaser.annual', 'Annual')}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-px bg-border/30 rounded-xl overflow-visible border border-border/30 mb-10 pt-3">
          {PRICING_TEASER_PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`p-6 bg-card/30 relative ${plan.highlighted ? 'bg-primary/[0.03] ring-1 ring-primary/20' : ''} ${plan.popular ? 'ring-1 ring-primary/50' : ''}`}
            >
              {plan.badge && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full whitespace-nowrap">
                  {t(`pricingTeaser.badge_${plan.key}`, plan.badge)}
                </span>
              )}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-bold">{t(`pricingTeaser.${plan.key}Name`, plan.name)}</span>
              </div>
              <div className="text-sm font-mono text-muted-foreground mb-1">
                {getPrice(plan)}
                {billing === 'annual' && plan.price.savings && (
                  <Badge variant="secondary" className="ml-2 text-xs">{plan.price.savings}</Badge>
                )}
              </div>
              <div className="text-xs text-primary font-medium mb-1">{t(`pricingTeaser.${plan.key}Tagline`, plan.tagline)}</div>
              <p className="text-xs text-muted-foreground mb-4">{t(`pricingTeaser.${plan.key}Description`, plan.description)}</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    {t(`pricingTeaser.${plan.key}Feature${idx + 1}`, feature)}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="sm"
                variant={plan.highlighted || plan.popular ? 'default' : 'outline'}
                className="mt-4 w-full"
                onClick={() => {
                  track(`pricing_start_${plan.key}`, { source: 'landing_pricing_teaser' });
                  trackEvent('landing.cta_click', { button: `pricing_start_${plan.key}` });
                }}
              >
                <Link to={plan.ctaLink}>
                  {t(`pricingTeaser.${plan.key}Cta`, plan.cta)}
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
