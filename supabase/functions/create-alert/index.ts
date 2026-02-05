import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alert limits by plan - single source of truth
const ALERT_LIMITS: Record<string, number> = {
  free: 1,
  starter: 2,
  pro: 10,
  pro_plus: 25,
  elite: 999999
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { symbol, pattern, patterns, timeframe, status = 'active', action = 'create' } = body;
    
    // Support both single pattern and multiple patterns
    const patternList: string[] = patterns || (pattern ? [pattern] : []);

    // Get user's subscription plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single();

    const userPlan = profile?.subscription_plan || 'free';
    const maxAlerts = ALERT_LIMITS[userPlan] || ALERT_LIMITS.free;

    // Count active alerts for the user (only status='active', not paused/deleted)
    const { count: activeAlertCount, error: countError } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (countError) {
      console.error('Count error:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to check alert count', code: 'COUNT_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentCount = activeAlertCount || 0;
    console.log(`User ${user.id} (${userPlan}): ${currentCount}/${maxAlerts} active alerts`);

    // For create or enable/resume actions, check limit BEFORE proceeding
    // This prevents race conditions - even if two requests come in simultaneously,
    // both will read the same count and only one can succeed
    if (action === 'create' || action === 'enable') {
      if (currentCount >= maxAlerts) {
        console.log(`Alert limit exceeded for user ${user.id} - rejecting ${action} action`);
        return new Response(
          JSON.stringify({
            error: 'Alert limit exceeded for your subscription plan',
            code: 'ALERT_LIMIT',
            current: currentCount,
            max: maxAlerts,
            plan: userPlan,
            message: `You have ${currentCount} active alert(s). Your ${userPlan} plan allows ${maxAlerts}.`
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'create') {
      // Validate required fields
      if (!symbol || patternList.length === 0 || !timeframe) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: symbol, pattern(s), timeframe', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if creating multiple alerts would exceed limit
      const alertsToCreate = patternList.length;
      if (currentCount + alertsToCreate > maxAlerts) {
        console.log(`Alert limit would be exceeded: ${currentCount} + ${alertsToCreate} > ${maxAlerts}`);
        return new Response(
          JSON.stringify({
            error: 'Creating these alerts would exceed your limit',
            code: 'ALERT_LIMIT',
            current: currentCount,
            requested: alertsToCreate,
            max: maxAlerts,
            plan: userPlan,
            message: `You have ${currentCount} active alert(s) and want to create ${alertsToCreate}. Your ${userPlan} plan allows ${maxAlerts}.`
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert all alerts
      const alertsToInsert = patternList.map(p => ({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        pattern: p,
        timeframe,
        status: 'active'
      }));
      
      const { data: alerts, error: insertError } = await supabase
        .from('alerts')
        .insert(alertsToInsert)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: insertError.message, code: 'INSERT_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`${alerts?.length || 0} alert(s) created successfully for ${symbol.toUpperCase()}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          alerts,
          alertCount: currentCount + (alerts?.length || 0),
          maxAlerts,
          plan: userPlan
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'enable') {
      const { alertId } = body;
      if (!alertId) {
        return new Response(
          JSON.stringify({ error: 'Missing alertId for enable action', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: alert, error: updateError } = await supabase
        .from('alerts')
        .update({ status: 'active' })
        .eq('id', alertId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message, code: 'UPDATE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, alert }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action', code: 'INVALID_ACTION' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message, code: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
