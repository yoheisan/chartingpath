import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";

const Pricing = () => {
  const handlePlanSelect = (planName: string) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'plan_checkout_opened', {
        event_category: 'Pricing',
        event_label: planName
      });
    }
    // In a real implementation, this would redirect to checkout
    console.log(`Selected plan: ${planName}`);
  };

  const plans = [
    {
      name: "Starter",
      price: 29,
      annualPrice: 313,
      description: "Perfect for beginners getting started with automated trading",
      features: [
        "Script Library (20+ ready-to-use strategies)",
        "Basic Pip & Risk Calculators", 
        "Monthly tutorials",
        "Email support",
        "Basic pattern recognition guides"
      ],
      buttonText: "Start with Starter",
      popular: false,
      icon: Zap
    },
    {
      name: "Pro", 
      price: 79,
      annualPrice: 852,
      description: "Advanced tools and education for serious traders",
      features: [
        "Everything in Starter",
        "Advanced Script Library (50+ strategies)",
        "Chart Pattern Email Alerts (3 active alerts)",
        "Video Course: Automated Trading from Zero to First Bot",
        "Pro Calculators (save profiles, CSV export)",
        'Monthly "New Script of the Month"',
        "Members-only Q&A sessions",
        "Priority support"
      ],
      buttonText: "Go Pro",
      popular: true,
      icon: Star
    },
    {
      name: "Elite",
      price: 199,
      description: "Ultimate access with lifetime benefits",
      features: [
        "Everything in Pro", 
        "Chart Pattern Email Alerts (Unlimited alerts)",
        "Lifetime access option ($999 one-time)",
        "Premium Discord role & exclusive channels",
        "Early access to strategy packs",
        "Reserved access to Automated Script Generator",
        "1-on-1 strategy consultation (monthly)",
        "Custom script requests (2 per month)"
      ],
      buttonText: "Join Elite",
      popular: false,
      icon: Crown,
      lifetime: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free with our tools, upgrade when you're ready to go pro.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-primary shadow-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  
                   <div className="space-y-2">
                    <div className="text-4xl font-bold text-foreground">
                      ${plan.price}
                      <span className="text-lg text-muted-foreground">/month</span>
                    </div>
                    {plan.annualPrice && (
                      <div className="text-sm text-accent font-semibold">
                        or ${plan.annualPrice}/year
                      </div>
                    )}
                    {plan.lifetime && (
                      <div className="text-sm text-accent font-semibold">
                        or $999 lifetime
                      </div>
                    )}
                  </div>
                  
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePlanSelect(plan.name)}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Guarantee Section */}
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              30-Day Money-Back Guarantee
            </h3>
            <p className="text-muted-foreground">
              Cancel anytime, no hidden fees. If you're not satisfied within 30 days, get a full refund.
            </p>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's included in the Script Library?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ready-to-use trading scripts for Pine Script (TradingView), Python (MT4/MT5), and MQL5. 
                  Each script includes setup instructions, backtesting results, and customization guides.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! All plans are month-to-month with no long-term commitment. Cancel anytime from your account settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you're not satisfied, contact support for a full refund.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What platforms do your scripts work with?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our scripts are compatible with TradingView (Pine Script), MetaTrader 4/5 (Python & MQL), and most major trading platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> Educational purposes only. Not financial advice. Past performance does not guarantee future results. 
            Trading involves substantial risk of loss. All scripts and strategies should be thoroughly tested before live trading.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;