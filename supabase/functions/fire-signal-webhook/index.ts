import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * fire-signal-webhook
 * 
 * Called from check-alert-matches when alert.webhook_url is set.
 * Fires a standardized JSON signal to the user's configured webhook endpoint.
 * Signs payload with HMAC-SHA256 for verification.
 */

const MAX_WEBHOOKS_PER_HOUR = 10;
const WEBHOOK_TIMEOUT_MS = 5000;

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      user_id,
      alert_id,
      webhook_url,
      webhook_secret,
      symbol,
      direction,
      timeframe,
      entry_price,
      stop_loss_price,
      take_profit_price,
      risk_reward_ratio,
      pattern,
      quality_grade,
      detection_id,
    } = await req.json();

    // Validate
    if (!user_id || !webhook_url || !symbol) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate HTTPS
    if (!webhook_url.startsWith('https://')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook URL must use HTTPS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fire-signal-webhook] Processing for user ${user_id}, ${symbol} → ${webhook_url}`);

    // Rate limit check: max 10 per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('signal_webhook_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('created_at', oneHourAgo);

    if ((recentCount || 0) >= MAX_WEBHOOKS_PER_HOUR) {
      console.log(`[fire-signal-webhook] Rate limit exceeded for user ${user_id}: ${recentCount} in last hour`);
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded (max 10/hour)', code: 'RATE_LIMITED' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build standardized payload
    const payload = {
      signal: 'entry',
      symbol: symbol.toUpperCase(),
      direction: direction || 'long',
      timeframe: timeframe || '',
      entry_price: entry_price || 0,
      stop_loss: stop_loss_price || 0,
      take_profit: take_profit_price || 0,
      risk_reward: risk_reward_ratio || 0,
      pattern: pattern || '',
      quality_grade: quality_grade || 'C',
      timestamp: new Date().toISOString(),
      source: 'chartingpath',
    };

    const payloadStr = JSON.stringify(payload);

    // Build headers
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ChartingPath-Webhook/1.0',
    };

    // Sign if secret is provided
    if (webhook_secret) {
      const signature = await hmacSign(webhook_secret, payloadStr);
      webhookHeaders['X-Signature'] = signature;
      webhookHeaders['X-Signature-Algorithm'] = 'HMAC-SHA256';
    }

    // Fire webhook with timeout
    const startTime = Date.now();
    let responseStatus = 0;
    let responseBody = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: webhookHeaders,
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      responseStatus = response.status;
      responseBody = (await response.text()).substring(0, 500); // truncate
    } catch (fetchErr: any) {
      responseStatus = 0;
      responseBody = fetchErr.message || 'Connection failed';
      console.error(`[fire-signal-webhook] Fetch error:`, fetchErr.message);
    }

    const latencyMs = Date.now() - startTime;

    // Log the webhook delivery
    await supabase
      .from('signal_webhook_log')
      .insert({
        alert_id,
        detection_id,
        user_id,
        payload,
        response_status: responseStatus,
        response_body: responseBody,
        latency_ms: latencyMs,
      });

    const success = responseStatus >= 200 && responseStatus < 300;
    console.log(`[fire-signal-webhook] ${success ? 'SUCCESS' : 'FAILED'}: ${responseStatus} in ${latencyMs}ms`);

    return new Response(
      JSON.stringify({
        success,
        response_status: responseStatus,
        latency_ms: latencyMs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fire-signal-webhook] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
