import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  'pdt_0Nbw1TfS9k9QciWvtEDul': 'lite',
  'pdt_0Nci20cdaF4NVVxpL7QuN': 'lite',
  'pdt_0Nbw2MO14rFVG1F2iZZeG': 'pro',
  'pdt_0Nci2DtFPMDY7ktqZ5Eob': 'pro',
  'pdt_0Nbw2hFVLIRWJlaYWl4Hp': 'elite',
  'pdt_0Nci1W1HiJ3Cn5fww0Zxi': 'elite',
};

async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  const secret = Deno.env.get('DODO_WEBHOOK_SECRET');
  if (!secret) return false;
  const webhookId = req.headers.get('webhook-id');
  const webhookTimestamp = req.headers.get('webhook-timestamp');
  const webhookSignature = req.headers.get('webhook-signature');
  if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

  try {
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const secretBytes = Uint8Array.from(atob(secret.replace('whsec_', '')), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
    const computedSig = 'v1,' + btoa(String.fromCharCode(...new Uint8Array(signature)));
    return webhookSignature.split(' ').some(sig => sig === computedSig);
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.text();

    const isValid = await verifyWebhookSignature(req, body);
    if (!isValid) {
      console.warn('[dodo-webhook] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    console.info(`[dodo-webhook] Event: ${type}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userId = data?.metadata?.user_id || data?.customer?.metadata?.user_id;
    const productId = data?.product_id || data?.items?.[0]?.product_id;
    const plan = productId ? PRODUCT_TO_PLAN[productId] : null;

    if (!userId) {
      console.warn('[dodo-webhook] No user_id in metadata, skipping');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (type) {
      case 'subscription.active':
      case 'subscription.renewed':
        if (plan) {
          await supabase.from('user_profiles').update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_id: data.subscription_id,
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
          console.info(`[dodo-webhook] Activated ${plan} for user ${userId}`);
        }
        break;

      case 'subscription.on_hold':
        await supabase.from('user_profiles').update({
          subscription_status: 'on_hold',
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        break;

      case 'subscription.failed':
        await supabase.from('user_profiles').update({
          subscription_plan: 'free',
          subscription_status: 'failed',
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        break;

      case 'subscription.updated':
        if (plan) {
          await supabase.from('user_profiles').update({
            subscription_plan: plan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;

      case 'payment.succeeded':
        console.info(`[dodo-webhook] Payment succeeded for user ${userId}`);
        break;

      case 'payment.failed':
        console.warn(`[dodo-webhook] Payment failed for user ${userId}`);
        break;

      default:
        console.info(`[dodo-webhook] Unhandled event type: ${type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[dodo-webhook]', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
