import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChangeMembershipRequest {
  user_id: string;
  new_plan: 'starter' | 'pro' | 'elite';
  reason?: string;
  is_free_assignment?: boolean; // Admin can assign plan for free
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CHANGE-MEMBERSHIP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const adminUser = userData.user;
    if (!adminUser) throw new Error("User not authenticated");
    logStep("Admin authenticated", { adminId: adminUser.id });

    // Check if user has admin role - CRITICAL security check
    const { data: isAdminUser, error: roleError } = await supabaseAdmin
      .rpc('is_admin', { _user_id: adminUser.id });
    
    if (roleError) {
      logStep("Admin role check failed", { error: roleError.message });
      throw new Error("Failed to verify admin privileges");
    }
    
    if (!isAdminUser) {
      logStep("Unauthorized access attempt", { userId: adminUser.id });
      throw new Error("Unauthorized: Admin privileges required");
    }
    
    logStep("Admin authorization verified", { adminId: adminUser.id });

    const { user_id, new_plan, reason, is_free_assignment = false }: ChangeMembershipRequest = await req.json();

    if (!user_id || !new_plan) {
      throw new Error("Missing required fields: user_id and new_plan");
    }

    logStep("Processing membership change", { user_id, new_plan, is_free_assignment });

    // Get current subscription
    const { data: currentSub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Failed to get current subscription: ${subError.message}`);
    }

    const previousPlan = currentSub?.current_plan || 'starter';
    logStep("Current subscription found", { previousPlan, currentPlan: new_plan });

    // Calculate prorata if not a free assignment and it's a plan change
    let prorataAmount = 0;
    if (!is_free_assignment && previousPlan !== new_plan && currentSub?.current_period_end) {
      const now = new Date();
      const periodEnd = new Date(currentSub.current_period_end);
      const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (daysRemaining > 0) {
        const { data: prorataResult, error: prorataError } = await supabaseAdmin
          .rpc('calculate_prorata_amount', {
            current_plan: previousPlan,
            new_plan: new_plan,
            days_remaining: daysRemaining
          });

        if (prorataError) {
          logStep("Prorata calculation error", prorataError);
        } else {
          prorataAmount = prorataResult || 0;
        }
      }
    }

    logStep("Prorata calculation", { prorataAmount });

    // Update or create subscription record
    const subscriptionData = {
      user_id,
      current_plan: new_plan,
      previous_plan: previousPlan,
      status: 'active',
      updated_at: new Date().toISOString(),
      ...(currentSub ? {} : {
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
    };

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (upsertError) {
      throw new Error(`Failed to update subscription: ${upsertError.message}`);
    }

    logStep("Subscription updated successfully");

    // Create billing event record
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .single();

    const eventType = previousPlan === 'starter' && new_plan !== 'starter' ? 'upgrade' :
                     previousPlan !== 'starter' && new_plan === 'starter' ? 'downgrade' :
                     previousPlan !== new_plan ? (new_plan === 'elite' ? 'upgrade' : 'downgrade') : 'update';

    const { error: billingError } = await supabaseAdmin
      .from('billing_events')
      .insert({
        user_id,
        subscription_id: subscription?.id,
        event_type: is_free_assignment ? 'admin_assignment' : eventType,
        from_plan: previousPlan,
        to_plan: new_plan,
        prorata_amount_cents: prorataAmount,
        billing_reason: reason || `Admin changed plan from ${previousPlan} to ${new_plan}`,
        metadata: {
          admin_user_id: adminUser.id,
          is_free_assignment,
          changed_at: new Date().toISOString()
        }
      });

    if (billingError) {
      logStep("Billing event error", billingError);
    }

    logStep("Membership change completed successfully");

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully changed membership from ${previousPlan} to ${new_plan}`,
      user_id,
      previous_plan: previousPlan,
      new_plan,
      prorata_amount_cents: prorataAmount,
      is_free_assignment
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});