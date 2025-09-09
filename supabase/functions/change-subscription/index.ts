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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { new_plan, billing_cycle } = await req.json();
    logStep("Request parameters", { new_plan, billing_cycle });

    // Use database function to process plan change
    const { data: changeResult, error: changeError } = await supabaseService
      .rpc('process_plan_change', {
        p_user_id: user.id,
        p_new_plan: new_plan,
        p_billing_cycle: billing_cycle || 'monthly'
      });

    if (changeError) {
      throw new Error(`Plan change error: ${changeError.message}`);
    }

    if (!changeResult.success) {
      throw new Error(changeResult.error);
    }

    logStep("Plan change processed", changeResult);

    // Initialize Stripe for actual billing operations
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get current subscription from Supabase
    const { data: subscription, error: subError } = await supabaseService
      .from("subscriptions")
      .select("*, plan_pricing!inner(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      throw new Error("No active subscription found");
    }

    if (changeResult.change_type === 'upgrade' && changeResult.immediate) {
      // For upgrades: create immediate billing session for prorated amount
      if (changeResult.prorated_amount_cents > 0) {
        // Get customer ID
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length === 0) {
          throw new Error("Stripe customer not found");
        }
        const customerId = customers.data[0].id;

        // Create checkout session for prorated amount
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { 
                  name: "Plan Upgrade",
                  description: `Upgrade to ${new_plan} - Prorated difference`
                },
                unit_amount: changeResult.prorated_amount_cents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${req.headers.get("origin")}/member/account?upgrade=success`,
          cancel_url: `${req.headers.get("origin")}/member/account?upgrade=cancelled`,
          metadata: {
            user_id: user.id,
            upgrade_to_plan: new_plan,
            billing_cycle: billing_cycle,
            change_type: 'upgrade'
          }
        });

        logStep("Upgrade session created", { sessionId: session.id, amount: changeResult.prorated_amount_cents });

        return new Response(JSON.stringify({
          success: true,
          change_type: 'upgrade',
          immediate: true,
          checkout_url: session.url,
          message: changeResult.message,
          prorated_amount_cents: changeResult.prorated_amount_cents
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // No additional payment needed
        return new Response(JSON.stringify({
          success: true,
          change_type: 'upgrade',
          immediate: true,
          message: 'Plan upgraded successfully with no additional payment required'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      // For downgrades: just return success with effective date
      return new Response(JSON.stringify({
        success: true,
        change_type: 'downgrade',
        immediate: false,
        effective_date: changeResult.effective_date,
        message: changeResult.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in change-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});