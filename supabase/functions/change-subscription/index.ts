import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHANGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

/**
 * Find or create a Stripe Price for a given plan.
 * Searches existing prices by product metadata, or creates a new product+price.
 */
async function findOrCreateStripePrice(
  stripe: Stripe,
  planName: string,
  amountCents: number,
  interval: 'month' | 'year'
): Promise<string> {
  // Search for existing prices matching this plan
  const prices = await stripe.prices.list({
    active: true,
    currency: 'usd',
    type: 'recurring',
    limit: 100,
  });

  // Find a price that matches our plan, amount, and interval
  for (const price of prices.data) {
    if (
      price.unit_amount === amountCents &&
      price.recurring?.interval === interval &&
      price.metadata?.plan === planName
    ) {
      logStep("Found existing Stripe price", { priceId: price.id, plan: planName });
      return price.id;
    }
  }

  // Create a new product and price
  const product = await stripe.products.create({
    name: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
    description: `ChartingPath ${planName} subscription`,
    metadata: { plan: planName },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: 'usd',
    recurring: { interval },
    metadata: { plan: planName },
  });

  logStep("Created new Stripe price", { priceId: price.id, productId: product.id, plan: planName });
  return price.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { new_plan, billing_cycle = 'monthly' } = await req.json();
    logStep("Request parameters", { new_plan, billing_cycle });

    // Get current subscription from DB
    const { data: subscription, error: subError } = await supabaseService
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      throw new Error("No active subscription found");
    }

    if (!subscription.stripe_subscription_id) {
      throw new Error("No Stripe subscription ID found — cannot modify subscription");
    }

    logStep("Current subscription", { 
      plan: subscription.current_plan, 
      stripeSubId: subscription.stripe_subscription_id 
    });

    // Get new plan pricing from DB
    const { data: newPlanPricing, error: pricingError } = await supabaseService
      .from("plan_pricing")
      .select("*")
      .eq("plan", new_plan)
      .single();

    if (pricingError || !newPlanPricing) {
      throw new Error(`Invalid plan: ${new_plan}`);
    }

    const interval: 'month' | 'year' = billing_cycle === 'annual' ? 'year' : 'month';
    const newAmount = billing_cycle === 'annual' 
      ? newPlanPricing.yearly_price_cents 
      : newPlanPricing.monthly_price_cents;

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    logStep("Stripe subscription retrieved", { 
      id: stripeSubscription.id, 
      status: stripeSubscription.status,
      itemCount: stripeSubscription.items.data.length 
    });

    if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
      throw new Error(`Stripe subscription is ${stripeSubscription.status}, cannot modify`);
    }

    // Get the subscription item to update
    const subscriptionItem = stripeSubscription.items.data[0];
    if (!subscriptionItem) {
      throw new Error("No subscription items found");
    }

    // Find or create the target Stripe price
    const newPriceId = await findOrCreateStripePrice(stripe, new_plan, newAmount, interval);

    // Determine change type
    const currentAmount = subscriptionItem.price?.unit_amount || 0;
    const changeType = newAmount > currentAmount ? 'upgrade' : 'downgrade';
    logStep("Change type determined", { changeType, currentAmount, newAmount });

    // Update the Stripe subscription immediately with proration
    // Stripe will automatically calculate credits/charges
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: subscriptionItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      metadata: {
        plan: new_plan,
        billing_cycle: billing_cycle,
        changed_at: new Date().toISOString(),
        change_type: changeType,
      }
    });

    logStep("Stripe subscription updated", { 
      id: updatedSubscription.id, 
      status: updatedSubscription.status,
      newPriceId 
    });

    // Update local DB immediately
    const { error: updateError } = await supabaseService
      .from("subscriptions")
      .update({
        previous_plan: subscription.current_plan,
        current_plan: new_plan,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      logStep("DB update error (non-fatal)", { error: updateError });
    }

    // Update profile subscription plan
    await supabaseService.rpc('update_profile_subscription', {
      p_user_id: user.id,
      p_plan: new_plan,
      p_status: 'active'
    });

    // Record billing event
    await supabaseService
      .from("billing_events")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        event_type: changeType,
        from_plan: subscription.current_plan,
        to_plan: new_plan,
        prorata_amount_cents: 0, // Stripe handles proration internally
        metadata: {
          billing_cycle,
          stripe_subscription_id: updatedSubscription.id,
          proration_behavior: 'create_prorations',
          immediate: true,
        }
      });

    const message = changeType === 'upgrade'
      ? `Upgraded to ${new_plan}! Prorated charges applied to your next invoice.`
      : `Downgraded to ${new_plan}. Prorated credit applied to your account.`;

    return new Response(JSON.stringify({
      success: true,
      change_type: changeType,
      immediate: true,
      message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in change-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
