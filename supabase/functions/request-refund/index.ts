import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-REFUND] ${step}${detailsStr}`);
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

    const { subscription_id, reason } = await req.json();
    logStep("Request parameters", { subscription_id, reason });

    if (!subscription_id) {
      throw new Error("subscription_id is required");
    }

    // Check refund eligibility using the database function
    const { data: eligibilityResult, error: eligibilityError } = await supabaseService
      .rpc('check_refund_eligibility', {
        p_user_id: user.id,
        p_subscription_id: subscription_id
      });

    if (eligibilityError) {
      throw new Error(`Error checking eligibility: ${eligibilityError.message}`);
    }

    logStep("Eligibility check result", eligibilityResult);

    if (!eligibilityResult.eligible) {
      return new Response(JSON.stringify({
        success: false,
        eligible: false,
        reason: eligibilityResult.reason,
        message: "Refund request not eligible based on our refund policy"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create refund request in database
    const { data: refundRequest, error: refundError } = await supabaseService
      .from("refunds")
      .insert({
        user_id: user.id,
        subscription_id: subscription_id,
        amount_cents: eligibilityResult.amount_cents,
        reason: reason || "User requested refund",
        is_eligible: true,
        eligibility_reason: eligibilityResult.reason,
        status: 'pending'
      })
      .select()
      .single();

    if (refundError) {
      throw new Error(`Error creating refund request: ${refundError.message}`);
    }

    logStep("Refund request created", { refundId: refundRequest.id });

    // Automatically process the refund via Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the subscription details
    const { data: subscription, error: subError } = await supabaseService
      .from("subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found");
    }

    let stripeRefundId: string | null = null;

    // Step 1: Find the latest payment intent / charge to refund
    if (subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id, {
          expand: ['latest_invoice'],
        });
        logStep("Stripe subscription retrieved", { id: stripeSubscription.id, status: stripeSubscription.status });

        // Get the latest invoice's payment intent to refund
        const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;
        if (latestInvoice?.payment_intent) {
          const paymentIntentId = typeof latestInvoice.payment_intent === 'string'
            ? latestInvoice.payment_intent
            : latestInvoice.payment_intent.id;

          // Issue the refund
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: eligibilityResult.amount_cents, // refund the full annual amount
            reason: 'requested_by_customer',
          });
          stripeRefundId = refund.id;
          logStep("Stripe refund created", { refundId: refund.id, amount: refund.amount, status: refund.status });
        } else {
          logStep("No payment intent found on latest invoice, attempting charge-based refund");
          // Fallback: find charges on the customer
          const charges = await stripe.charges.list({
            customer: subscription.stripe_customer_id,
            limit: 1,
          });
          if (charges.data.length > 0) {
            const refund = await stripe.refunds.create({
              charge: charges.data[0].id,
              amount: eligibilityResult.amount_cents,
              reason: 'requested_by_customer',
            });
            stripeRefundId = refund.id;
            logStep("Stripe refund created via charge", { refundId: refund.id });
          }
        }

        // Step 2: Cancel the Stripe subscription immediately
        await stripe.subscriptions.cancel(stripeSubscription.id);
        logStep("Stripe subscription cancelled", { id: stripeSubscription.id });

      } catch (stripeError) {
        const errMsg = stripeError instanceof Error ? stripeError.message : String(stripeError);
        logStep("Stripe processing error", { error: errMsg });
        
        // Update refund record to failed
        await supabaseService
          .from("refunds")
          .update({ status: 'failed', eligibility_reason: `Stripe error: ${errMsg}` })
          .eq("id", refundRequest.id);

        throw new Error(`Refund processing failed: ${errMsg}`);
      }
    } else {
      throw new Error("No Stripe subscription ID found — cannot process refund automatically");
    }

    // Step 3: Update refund record to completed
    await supabaseService
      .from("refunds")
      .update({
        status: 'completed',
        stripe_refund_id: stripeRefundId,
      })
      .eq("id", refundRequest.id);

    // Step 4: Downgrade user to starter
    await supabaseService
      .from("subscriptions")
      .update({
        previous_plan: subscription.current_plan,
        current_plan: 'starter',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription_id);

    // Step 5: Record billing event
    await supabaseService
      .from("billing_events")
      .insert({
        user_id: user.id,
        subscription_id: subscription_id,
        event_type: 'refund',
        from_plan: subscription.current_plan,
        to_plan: 'starter',
        full_amount_cents: eligibilityResult.amount_cents,
        billing_reason: reason || 'Customer requested refund (auto-processed)',
        metadata: {
          stripe_refund_id: stripeRefundId,
          days_remaining: eligibilityResult.days_remaining,
        },
      });

    logStep("Refund fully processed", { refundId: refundRequest.id, stripeRefundId });

    return new Response(JSON.stringify({
      success: true,
      eligible: true,
      refund_request_id: refundRequest.id,
      stripe_refund_id: stripeRefundId,
      amount_cents: eligibilityResult.amount_cents,
      days_remaining: eligibilityResult.days_remaining,
      status: 'completed',
      message: "Refund processed successfully. The amount will be returned to your payment method within 5-10 business days.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in request-refund", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});