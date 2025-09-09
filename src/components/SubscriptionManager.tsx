import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Clock, AlertTriangle, CheckCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface SubscriptionData {
  id: string;
  current_plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface PlanPricing {
  plan: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  features: any;
  max_alerts: number;
}

interface RefundEligibility {
  eligible: boolean;
  reason: string;
  amount_cents?: number;
  days_remaining?: number;
}

export const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundEligibility, setRefundEligibility] = useState<RefundEligibility | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Get current subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      setSubscription(subData);

      // Get available plans
      const { data: plansData, error: plansError } = await supabase
        .from('plan_pricing')
        .select('*')
        .order('monthly_price_cents', { ascending: true });

      if (plansError) {
        throw plansError;
      }

      setAvailablePlans(plansData);

      // Check refund eligibility if user has active subscription
      if (subData) {
        await checkRefundEligibility(subData.id);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const checkRefundEligibility = async (subscriptionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('request-refund', {
        body: { 
          subscription_id: subscriptionId,
          check_only: true 
        }
      });

      if (error) throw error;
      setRefundEligibility(data);
    } catch (error) {
      console.error('Error checking refund eligibility:', error);
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    if (!subscription) return;
    
    try {
      setChangingPlan(true);
      
      const { data, error } = await supabase.functions.invoke('change-subscription', {
        body: {
          new_plan: newPlan,
          billing_cycle: billingCycle
        }
      });

      if (error) throw error;

      if (data.checkout_url) {
        // For upgrades requiring payment
        window.open(data.checkout_url, '_blank');
        toast.success('Redirecting to payment...');
      } else {
        // For downgrades or no-payment upgrades
        toast.success(data.message);
        await loadSubscriptionData();
      }

    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!subscription || !refundReason.trim()) return;

    try {
      setProcessingRefund(true);

      const { data, error } = await supabase.functions.invoke('request-refund', {
        body: {
          subscription_id: subscription.id,
          reason: refundReason
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Refund request submitted successfully');
        setShowRefundDialog(false);
        setRefundReason("");
        await loadSubscriptionData();
      } else {
        toast.error(data.message || 'Refund request failed');
      }

    } catch (error) {
      console.error('Error requesting refund:', error);
      toast.error('Failed to submit refund request');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleCreateSubscription = async (plan: string) => {
    try {
      setChangingPlan(true);

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan: plan,
          billing_cycle: billingCycle
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to checkout...');
      }

    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setChangingPlan(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getPlanDisplayPrice = (plan: PlanPricing) => {
    const price = billingCycle === 'annual' ? plan.yearly_price_cents : plan.monthly_price_cents;
    if (billingCycle === 'annual') {
      return `${formatPrice(Math.round(price / 12))}/month (${formatPrice(price)}/year)`;
    }
    return `${formatPrice(price)}/month`;
  };

  const isUpgrade = (newPlan: string) => {
    if (!subscription) return true;
    const currentPlan = availablePlans.find(p => p.plan === subscription.current_plan);
    const targetPlan = availablePlans.find(p => p.plan === newPlan);
    if (!currentPlan || !targetPlan) return false;
    
    const currentPrice = billingCycle === 'annual' ? currentPlan.yearly_price_cents : currentPlan.monthly_price_cents;
    const targetPrice = billingCycle === 'annual' ? targetPlan.yearly_price_cents : targetPlan.monthly_price_cents;
    
    return targetPrice > currentPrice;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading subscription data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Change Plan</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {subscription ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Subscription
                    </CardTitle>
                    <CardDescription>
                      Active since {new Date(subscription.current_period_start).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                    {subscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold capitalize">{subscription.current_plan} Plan</h4>
                    <p className="text-muted-foreground">
                      Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {refundEligibility && (
                    <Alert className={refundEligibility.eligible ? "border-green-200" : "border-orange-200"}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Refund Status:</strong> {refundEligibility.reason}
                        {refundEligibility.eligible && refundEligibility.days_remaining && (
                          <span className="block mt-1">
                            {refundEligibility.days_remaining} days remaining for refund eligibility
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  You're currently on the free plan. Upgrade to unlock premium features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleCreateSubscription('starter')}>
                  Get Started with Starter Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <Badge variant="secondary">Save up to 17%</Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.filter(plan => plan.plan !== 'free').map((plan) => {
              const isCurrent = subscription?.current_plan === plan.plan;
              const upgradeType = isUpgrade(plan.plan);
              
              return (
                <Card key={plan.plan} className={isCurrent ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="capitalize">{plan.plan}</CardTitle>
                      {isCurrent && <Badge>Current</Badge>}
                    </div>
                    <CardDescription className="text-2xl font-bold">
                      {getPlanDisplayPrice(plan)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isCurrent && (
                      <Button
                        onClick={() => subscription ? handlePlanChange(plan.plan) : handleCreateSubscription(plan.plan)}
                        disabled={changingPlan}
                        className="w-full"
                        variant={upgradeType ? "default" : "outline"}
                      >
                        {changingPlan ? (
                          "Processing..."
                        ) : subscription ? (
                          <>
                            {upgradeType ? (
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                            )}
                            {upgradeType ? 'Upgrade' : 'Downgrade'}
                          </>
                        ) : (
                          'Get Started'
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {subscription && refundEligibility?.eligible && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Request Refund
                </CardTitle>
                <CardDescription>
                  You're eligible for a refund within our 14-day window for annual subscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Request Refund</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Refund</DialogTitle>
                      <DialogDescription>
                        Refund amount: {formatPrice(refundEligibility.amount_cents || 0)}
                        <br />
                        Please provide a reason for your refund request.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Please tell us why you'd like a refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowRefundDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRefundRequest}
                        disabled={processingRefund || !refundReason.trim()}
                      >
                        {processingRefund ? "Submitting..." : "Submit Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Billing Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Refund Policy</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Refunds are available for annual plans only within 14 calendar days of payment</li>
                  <li>No refunds for monthly plans or upgrades to more expensive plans</li>
                  <li>Users who filed chargebacks/disputes are not eligible for refunds</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Plan Changes</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Upgrades:</strong> Take effect immediately with prorated billing</li>
                  <li><strong>Downgrades:</strong> Take effect at the end of your current billing period</li>
                  <li>All remaining days are converted to equivalent value on the new tier</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};