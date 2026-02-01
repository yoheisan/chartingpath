import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Crown, Zap, ArrowLeft, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPricingClicked, trackCheckoutStarted } from "@/services/analytics";

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);

  // Track pricing page view from paywall
  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'paywall') {
      trackPricingClicked({ source: 'paywall' });
    }
  }, [searchParams]);

  const handlePlanSelect = (planName: string) => {
    // Track pricing clicked
    trackPricingClicked({ source: 'plan_select', current_plan: planName.toLowerCase() });
    
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'plan_checkout_opened', {
        event_category: 'Pricing',
        event_label: planName
      });
    }
    
    // Create subscription via Supabase function
    createSubscription(planName);
  };

  const createSubscription = async (plan: string) => {
    try {
      // Track checkout started
      trackCheckoutStarted({
        plan: plan.toLowerCase(),
        billing_cycle: isAnnual ? 'annual' : 'monthly',
        source: 'pricing_page'
      });

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan: plan.toLowerCase(),
          billing_cycle: isAnnual ? 'annual' : 'monthly'
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      // Show error message
      toast.error('Failed to start checkout. Please try again or contact support.');
    }
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
      description: "Explore pattern detection on 1,100+ instruments",
      features: [
        "Daily (1D) timeframe charts only",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "6 classic chart patterns (Double Top/Bottom, H&S, Triangles)",
        "3 active pattern alerts",
        "50 credits/month for Setup Finder research",
        "Demo-only backtesting (prebuilt examples)",
        "Basic pattern recognition learning guides"
      ],
      dataRefresh: "Daily scans updated every 24h",
      limitations: ["Daily (1D) charts only"],
      buttonText: "Get Started Free",
      popular: false,
      icon: Zap
    },
    {
      name: "Lite",
      price: 12,
      annualPrice: 120,
      description: "Unlock intraday timeframes for active trading",
      features: [
        "Daily + 4H + 15-minute timeframe charts",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "8 chart patterns (incl. Channels, Flags)",
        "5 active pattern alerts",
        "100 credits/month for Setup Finder & Pattern Lab",
        "Basic backtesting: up to 2 years of historical data",
        "Email support"
      ],
      dataRefresh: "4H: Every 4h • 15m: Top 300 every 15m",
      limitations: [],
      buttonText: "Get Lite",
      popular: false,
      icon: Zap
    },
    {
      name: "Plus",
      price: 29,
      annualPrice: 290,
      description: "All timeframes for serious pattern research",
      features: [
        "All timeframes (15m, 1H, 4H, Daily, Weekly)",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "10 chart patterns (incl. Wedges, Cup & Handle)",
        "25 active pattern alerts",
        "300 credits/month for deep research",
        "Full backtesting: up to 3 years of data",
        "Advanced risk & pip calculators",
        "Priority email support"
      ],
      dataRefresh: "1H: Core 1,100 hourly • 4H: All 8,500+ every 4h",
      limitations: [],
      buttonText: "Get Plus",
      popular: false,
      icon: Star
    },
    {
      name: "Pro", 
      price: 79,
      annualPrice: 790,
      description: "Complete toolkit for professional traders",
      features: [
        "All timeframes (15m, 1H, 4H, Daily, Weekly)",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "Full pattern library (12 patterns incl. premium)",
        "100 active pattern alerts",
        "900 credits/month for unlimited research",
        "Multi-platform script export (TradingView, MT4/MT5)",
        "Full backtesting: up to 7 years of data",
        "Advanced metrics & trade analytics",
        "Priority support"
      ],
      dataRefresh: "1H: Core 1,100 hourly • 4H/Daily: Full 8,500+ real-time",
      limitations: [],
      buttonText: "Go Pro",
      popular: true,
      icon: Star
    },
    {
      name: "Team",
      price: 199,
      annualPrice: 1990,
      description: "Enterprise features for trading teams",
      features: [
        "All timeframes (15m, 1H, 4H, Daily, Weekly)",
        "Full screener access: 1,100+ instruments (S&P 500, Top Crypto, FX, Commodities)",
        "Complete pattern library (15+ patterns)",
        "500 active pattern alerts",
        "3000 credits/month for team research",
        "Script conversion across ALL platforms",
        "Full backtesting: up to 10 years of data",
        "Priority queues & VIP support",
        "Early access to new features"
      ],
      dataRefresh: "All timeframes: Full 8,500+ instruments, fastest refresh rates",
      limitations: [],
      buttonText: "Join Team",
      popular: false,
      icon: Crown
    }
  ];

  return (
    <div className="min-h-screen bg-background">
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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Scan 1,100+ instruments across S&P 500, Crypto, Forex & Commodities. Start free, upgrade when you're ready.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-8">
            <span className="px-3 py-1 bg-muted rounded-full">📊 500+ US Stocks</span>
            <span className="px-3 py-1 bg-muted rounded-full">₿ 100+ Cryptocurrencies</span>
            <span className="px-3 py-1 bg-muted rounded-full">💱 50+ Forex Pairs</span>
            <span className="px-3 py-1 bg-muted rounded-full">🛢️ 30+ Commodities</span>
          </div>

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
                  {/* Data Refresh Badge */}
                  {plan.dataRefresh && (
                    <div className="p-2 bg-muted/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-medium">{plan.dataRefresh}</span>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => {
                      // Highlight timeframe feature (first feature) for visibility
                      const isTimeframeFeature = index === 0 && feature.toLowerCase().includes('timeframe');
                      const isLimited = feature.toLowerCase().includes('daily') && feature.toLowerCase().includes('only');
                      
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isLimited ? 'text-amber-500' : 'text-primary'}`} />
                          <span className={`text-sm ${isTimeframeFeature ? 'font-medium text-foreground' : 'text-muted-foreground'} ${isLimited ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                            {feature}
                          </span>
                        </li>
                      );
                    })}
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

          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            <AccordionItem value="upgrade-payment">
              <AccordionTrigger className="text-left">
                How does upgrading without payment work?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Upgrading:</strong> You can upgrade your annual subscription at any time with no extra transactions needed. All remaining days of your current plan will be automatically converted into equivalent value days on the new tier. You don't lose anything, just use the remaining amount to switch to a better version. Thus, the remaining period of your subscription will be reduced and your next payment date will be switched.
                  </p>
                  <p>
                    <strong>Downgrading:</strong> If you downgrade, your current plan will stay exactly as it is until its subscription date. Then, once it expires, your new downgraded plan will go live at the selected rate.
                  </p>
                  <p className="font-medium text-foreground">
                    Remember, it's not a free trial. Once upgraded, there will be no option to revert this action. However, you'll be able to set a downgraded plan for the next billing period.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel-anytime">
              <AccordionTrigger className="text-left">
                Can I cancel anytime?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-2">
                  <p>
                    You can cancel your subscription anytime and it will not auto-renew after the current paid term. Paid service will remain active for the duration of the paid term.
                  </p>
                  <p className="font-medium text-foreground">
                    A canceled trial will stop immediately after cancellation.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="script-library">
              <AccordionTrigger className="text-left">
                What's included in the Script Library?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Ready-to-use trading scripts for Pine Script (TradingView), Python (MT4/MT5), and MQL5. 
                  Each script includes setup instructions, backtesting results, and customization guides.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund-policy">
              <AccordionTrigger className="text-left">
                What is your Refund Policy?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-2">
                  <p>
                    Refunds are available for annual plans only and must be requested within 14 calendar days of payment. To request a refund, contact our support team.
                  </p>
                  <p>
                    There are no refunds for upgrades to a more expensive plan, monthly plans or market data, even if the subscription is cancelled on the same day as the payment has gone through.
                  </p>
                  <p className="font-medium text-foreground">
                    Please note that users who filed a chargeback/dispute request or a claim are not eligible for a refund.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="platform-compatibility">
              <AccordionTrigger className="text-left">
                What platforms do your scripts work with?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Our scripts are compatible with TradingView (Pine Script), MetaTrader 4/5 (Python & MQL), and most major trading platforms.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="billing-upgrades">
              <AccordionTrigger className="text-left">
                How do plan upgrades affect billing?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  When you upgrade to a higher tier, we automatically calculate the prorated difference and apply your remaining subscription value to the new plan. Your billing cycle adjusts accordingly, and you'll see the updated next payment date in your account.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-refresh-rates">
              <AccordionTrigger className="text-left">
                How often is pattern data refreshed?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Data refresh rates depend on your plan tier and the timeframe you're analyzing:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Daily (1D) & Weekly (1W):</strong> Updated every 24 hours for all 8,500+ instruments</li>
                    <li><strong>4-Hour (4H):</strong> Updated every 4 hours for all 8,500+ instruments</li>
                    <li><strong>Hourly (1H):</strong> Updated hourly for Core 1,100 instruments; every 8h for extended universe</li>
                    <li><strong>15-Minute (15m):</strong> Updated every 15 minutes for Top 300 most liquid instruments</li>
                  </ul>
                  <p className="text-xs italic">
                    Higher refresh rates for intraday data require significant API resources. Premium tiers get priority access during high-traffic periods.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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