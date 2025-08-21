import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpgradeRequest {
  new_plan: 'pro' | 'elite';
  billing_cycle?: 'monthly' | 'yearly';
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { new_plan, billing_cycle = 'monthly' }: UpgradeRequest = await req.json();

    if (!new_plan || !['pro', 'elite'].includes(new_plan)) {
      throw new Error("Invalid plan. Must be 'pro' or 'elite'");
    }

    // Get current subscription and plan pricing
    const [subscriptionResult, pricingResult] = await Promise.all([
      supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).single(),
      supabaseAdmin.from('plan_pricing').select('*').in('plan', ['starter', 'pro', 'elite'])
    ]);

    const { data: currentSub } = subscriptionResult;
    const { data: planPricing, error: pricingError } = pricingResult;

    if (pricingError) {
      throw new Error(`Failed to get plan pricing: ${pricingError.message}`);
    }

    const currentPlan = currentSub?.current_plan || 'starter';
    const targetPricing = planPricing?.find(p => p.plan === new_plan);
    
    if (!targetPricing) {
      throw new Error(`Pricing not found for plan: ${new_plan}`);
    }

    logStep("Plan upgrade request", { currentPlan, newPlan: new_plan, billingCycle: billing_cycle });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Calculate prorata amount if upgrading mid-cycle
    let prorataAmount = 0;
    let immediateChargeAmount = 0;
    
    if (currentSub?.current_period_end && currentPlan !== 'starter') {
      const now = new Date();
      const periodEnd = new Date(currentSub.current_period_end);
      const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (daysRemaining > 0) {
        const { data: prorataResult, error: prorataError } = await supabaseAdmin
          .rpc('calculate_prorata_amount', {
            current_plan: currentPlan,
            new_plan: new_plan,
            days_remaining: daysRemaining
          });

        if (!prorataError && prorataResult) {
          prorataAmount = prorataResult;
          immediateChargeAmount = Math.max(0, prorataAmount); // Only charge if positive
        }
      }
    }

    const baseAmount = billing_cycle === 'yearly' ? targetPricing.yearly_price_cents : targetPricing.monthly_price_cents;
    const totalAmount = baseAmount + immediateChargeAmount;

    logStep("Pricing calculation", { 
      baseAmount, 
      prorataAmount, 
      immediateChargeAmount, 
      totalAmount 
    });

    // Create line items for checkout
    const lineItems = [];

    // Main subscription item
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { 
          name: `${new_plan.charAt(0).toUpperCase() + new_plan.slice(1)} Plan`,
          description: `${billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} subscription`
        },
        unit_amount: baseAmount,
        recurring: billing_cycle === 'yearly' ? { interval: "year" } : { interval: "month" }
      },
      quantity: 1,
    });

    // Add prorata charge if applicable
    if (immediateChargeAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { 
            name: "Pro-rated Upgrade Charge",
            description: `Adjustment for upgrading from ${currentPlan} to ${new_plan}`
          },
          unit_amount: immediateChargeAmount,
        },
        quantity: 1,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/members/account?upgrade=success`,
      cancel_url: `${req.headers.get("origin")}/members/account?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
        new_plan: new_plan,
        billing_cycle: billing_cycle,
        prorata_amount: prorataAmount.toString(),
        previous_plan: currentPlan
      }
    });

    // Log the upgrade attempt
    const { error: billingError } = await supabaseAdmin
      .from('billing_events')
      .insert({
        user_id: user.id,
        subscription_id: currentSub?.id,
        event_type: 'upgrade_attempt',
        from_plan: currentPlan,
        to_plan: new_plan,
        prorata_amount_cents: prorataAmount,
        full_amount_cents: totalAmount,
        billing_reason: `Upgrade from ${currentPlan} to ${new_plan} (${billing_cycle})`,
        metadata: {
          stripe_session_id: session.id,
          billing_cycle,
          base_amount: baseAmount,
          immediate_charge: immediateChargeAmount
        }
      });

    if (billingError) {
      logStep("Billing event logging error", billingError);
    }

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      prorata_amount_cents: prorataAmount,
      immediate_charge_cents: immediateChargeAmount,
      base_amount_cents: baseAmount,
      total_amount_cents: totalAmount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});