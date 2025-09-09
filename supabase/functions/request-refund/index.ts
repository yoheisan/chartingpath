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

    // For automatic processing, you could also process the refund immediately via Stripe
    // But based on your policy, manual review might be preferred for compliance
    
    // Initialize Stripe to get payment details (optional for immediate processing)
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the subscription and billing details
    const { data: subscription, error: subError } = await supabaseService
      .from("subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found");
    }

    // Optional: Get Stripe subscription details for additional validation
    if (subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        logStep("Stripe subscription retrieved", { 
          id: stripeSubscription.id, 
          status: stripeSubscription.status 
        });
        
        // You could add additional validation here based on Stripe data
      } catch (stripeError) {
        logStep("Warning: Could not retrieve Stripe subscription", { error: stripeError });
        // Don't fail the request if Stripe lookup fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      eligible: true,
      refund_request_id: refundRequest.id,
      amount_cents: eligibilityResult.amount_cents,
      days_remaining: eligibilityResult.days_remaining,
      status: 'pending',
      message: "Refund request submitted successfully. Our team will process it within 1-2 business days.",
      estimated_processing_time: "1-2 business days"
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