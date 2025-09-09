import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client with service role key for writes
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan, billing_cycle } = await req.json();
    logStep("Request parameters", { plan, billing_cycle });

    // Validate plan and billing cycle
    if (!plan || !billing_cycle) {
      throw new Error("Plan and billing_cycle are required");
    }

    if (!['monthly', 'annual'].includes(billing_cycle)) {
      throw new Error("Billing cycle must be 'monthly' or 'annual'");
    }

    // Get plan pricing from database
    const { data: planPricing, error: pricingError } = await supabaseService
      .from("plan_pricing")
      .select("*")
      .eq("plan", plan)
      .single();

    if (pricingError || !planPricing) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const amount = billing_cycle === 'annual' ? planPricing.yearly_price_cents : planPricing.monthly_price_cents;
    logStep("Plan pricing retrieved", { plan, amount, billing_cycle });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `ChartingPath ${plan} subscription`
            },
            unit_amount: amount,
            recurring: { 
              interval: billing_cycle === 'annual' ? 'year' : 'month'
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/member/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
      metadata: {
        user_id: user.id,
        plan: plan,
        billing_cycle: billing_cycle
      }
    });

    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    // Create pending subscription record
    const { error: subscriptionError } = await supabaseService
      .from("subscriptions")
      .insert({
        user_id: user.id,
        current_plan: plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: session.subscription as string,
        status: 'pending',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (billing_cycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
      });

    if (subscriptionError) {
      logStep("Subscription creation error", { error: subscriptionError });
      // Don't throw here as Stripe session is already created
    }

    // Record billing event
    await supabaseService
      .from("billing_events")
      .insert({
        user_id: user.id,
        event_type: 'subscription_created',
        to_plan: plan,
        full_amount_cents: amount,
        stripe_invoice_id: session.id,
        metadata: {
          billing_cycle: billing_cycle,
          stripe_session_id: session.id
        }
      });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});