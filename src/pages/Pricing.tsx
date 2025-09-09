import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useState } from "react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

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

  const calculateMonthlySavings = (monthlyPrice: number, annualPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      annualPrice: 0,
      description: "Perfect funnel to get started with ChartingPath",
      features: [
        "Access to 5 chart patterns",
        "1 active alert",
        "Demo-only backtesting (prebuilt examples)",
        "Algo builder sandbox (no export)",
        "No community sharing",
        "Basic pattern recognition guides"
      ],
      buttonText: "Get Started Free",
      popular: false,
      icon: Zap
    },
    {
      name: "Starter",
      price: 19,
      annualPrice: 205,
      description: "For casual traders ready to unlock full features",
      features: [
        "Full chart pattern library",
        "Save up to 5 strategies",
        "10 active alerts",
        "Paper trading with 1-year history",
        "Basic backtesting: 20 runs/month, up to 1 year of data",
        "Backtester V2: 5 runs/month (single asset strategies only)",
        "Basic risk & pip calculators",
        "Email support"
      ],
      buttonText: "Start Trading",
      popular: false,
      icon: Zap
    },
    {
      name: "Pro", 
      price: 39,
      annualPrice: 421,
      description: "The sweet spot for serious traders",
      features: [
        "Everything in Starter",
        "Unlimited strategies",
        "50 active alerts",
        "Multi-platform script export (TradingView, MT4/MT5, PineScript)",
        "Full historical backtesting (unlimited runs)",
        "Backtester V2: 50 runs/month (single + pair trading strategies)",
        "Advanced metrics & trade analytics",
        "Forward testing sandbox with history logs",
        "Enhanced Alerts Library with outcomes tracking",
        "Priority support"
      ],
      buttonText: "Go Pro",
      popular: true,
      icon: Star
    },
    {
      name: "Pro+",
      price: 79,
      annualPrice: 853,
      description: "Advanced analytics and community features",
      features: [
        "Everything in Pro",
        "Advanced risk dashboards + performance analytics",
        "Community strategy sharing",
        "Portfolio forward testing",
        "Backtester V2: Unlimited runs (all strategy types: single, pair, basket)",
        "High-frequency data access (tick-level backtesting)",
        "Advanced portfolio optimization tools",
        "Better learning progress tracking with milestones",
        "Advanced backtesting metrics & CSV exports",
        "Pro+ Discord role with exclusive channels"
      ],
      buttonText: "Go Pro+",
      popular: false,
      icon: Star
    },
    {
      name: "Elite",
      price: 149,
      annualPrice: 1609,
      description: "Ultimate power user experience",
      features: [
        "Everything in Pro+",
        "Script conversion across ALL platforms (TradingView, MT4/MT5, NinjaTrader, QuantConnect, ThinkOrSwim)",
        "Priority backtesting queues (institutional-grade compute)",
        "Backtester V2: Custom strategy development & deployment",
        "Real-time strategy monitoring & alerts",
        "VIP support & onboarding",
        "Advanced scenario simulations for strategies",
        "Early access to new features & alpha testing",
        "Premium Discord role & private channels"
      ],
      buttonText: "Join Elite",
      popular: false,
      icon: Crown
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
            Plans for every level of ambition
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free with our tools, upgrade when you're ready to go pro.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
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
              Annually
            </span>
          </div>
          {isAnnual && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
              💰 Save up to 17%
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
            const billingText = isAnnual && plan.annualPrice ? 'billed annually' : '/month';
            const savings = plan.annualPrice ? calculateMonthlySavings(plan.price, plan.annualPrice) : null;

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
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold text-foreground">
                        Free
                        <span className="text-lg text-muted-foreground"> forever</span>
                      </div>
                    ) : isAnnual && plan.annualPrice ? (
                      <div>
                        <div className="text-4xl font-bold text-foreground">
                          ${Math.round(plan.annualPrice / 12)}
                          <span className="text-lg text-muted-foreground">/month</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          billed annually (${plan.annualPrice})
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          ${plan.price}/month monthly
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-foreground">
                        ${plan.price}
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                    )}
                    
                    {isAnnual && savings && plan.price > 0 && (
                      <div className="text-sm text-accent font-semibold">
                        Save ${savings.savings} a year
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

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does upgrading without payment work?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    You can upgrade your annual subscription at any time with no extra transactions needed. All remaining days of your current plan will be automatically converted into equivalent value days on the new tier. You don't lose anything, just use the remaining amount to switch to a better version.
                  </p>
                  <p>
                    Thus, the remaining period of your subscription will be reduced and your next payment date will be switched. You can upgrade your annual non-professional or professional subscription at any time with no extra money payments. All remaining days of your current plan will be automatically converted into equivalent value days on the new tier.
                  </p>
                  <p className="font-medium text-foreground">
                    Remember, it's not a free trial. Once upgraded, there will be no option to revert this action. However, you'll be able to set a downgraded plan for the next billing period.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-2">
                  <p>
                    You can cancel your subscription anytime and it will not auto-renew after the current paid term. Paid service will remain active for the duration of the paid term.
                  </p>
                  <p className="font-medium text-foreground">
                    A canceled trial will stop immediately after cancellation.
                  </p>
                </div>
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do plan upgrades affect billing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When you upgrade to a higher tier, we automatically calculate the prorated difference and apply your remaining subscription value to the new plan. Your billing cycle adjusts accordingly, and you'll see the updated next payment date in your account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Educational use only.</strong> Monthly plans are non-refundable. Annual plans are refundable for unused full months. Lifetime is refundable within 1 month of purchase. See Terms & Privacy for details.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
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