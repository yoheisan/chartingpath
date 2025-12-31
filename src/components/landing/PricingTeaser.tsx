import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "@/services/analytics";

const plans = [
  {
    name: "Free",
    tagline: "Explore",
    features: ["25 credits/month", "1 active alert", "Basic patterns"],
  },
  {
    name: "Plus",
    tagline: "Active Testing",
    features: ["150 credits/month", "5 active alerts", "All patterns"],
    highlighted: false,
  },
  {
    name: "Pro",
    tagline: "Daily Scanning",
    features: ["900 credits/month", "25 active alerts", "Priority support"],
    highlighted: true,
  },
];

export const PricingTeaser = () => {
  const handlePricingClick = () => {
    track('pricing_viewed', { source: 'landing_pricing_teaser' });
  };

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Simple, Credit-Based Pricing</h2>
          <p className="text-muted-foreground">
            Credits are used for scans and backtests. Start free, upgrade as you grow.
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
              See Full Pricing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;
