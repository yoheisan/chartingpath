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

const PLAN_KEY_TO_PLAN: Record<string, string> = {
  lite_monthly: 'lite', lite_annual: 'lite',
  pro_monthly: 'pro', pro_annual: 'pro',
  elite_monthly: 'elite', elite_annual: 'elite',
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

async function resolveUserId(
  supabase: ReturnType<typeof createClient>,
  userIdFromMetadata: string | null,
  email: string | null,
): Promise<{ userId: string | null; isNew: boolean }> {
  if (userIdFromMetadata) return { userId: userIdFromMetadata, isNew: false };
  if (!email) return { userId: null, isNew: false };

  // Try to find existing auth user by email via listUsers (small page).
  // Note: Supabase admin API does not provide direct email lookup, so we paginate.
  // For projects with many users, a custom RPC is recommended; here we scan first 1000.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return { userId: existing.id, isNew: false };

  // Provision a new user
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    console.error('[dodo-webhook] Failed to create user for', email, createErr?.message);
    return { userId: null, isNew: false };
  }

  // Send a recovery (password setup) link so buyer can claim the account
  try {
    await supabase.auth.admin.generateLink({ type: 'recovery', email });
  } catch (e) {
    console.warn('[dodo-webhook] Could not generate recovery link:', (e as any)?.message);
  }

  return { userId: created.user.id, isNew: true };
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

    const userIdFromMetadata: string | null =
      data?.metadata?.user_id || data?.customer?.metadata?.user_id || null;
    const planKeyFromMetadata: string | null =
      data?.metadata?.plan_key || data?.customer?.metadata?.plan_key || null;
    const email: string | null =
      data?.customer?.email || data?.email || null;
    const productId = data?.product_id || data?.items?.[0]?.product_id;
    const plan =
      (productId ? PRODUCT_TO_PLAN[productId] : null) ||
      (planKeyFromMetadata ? PLAN_KEY_TO_PLAN[planKeyFromMetadata] : null);

    // Resolve user — either from metadata (logged-in flow) or by email (anonymous flow)
    const { userId, isNew } = await resolveUserId(supabase, userIdFromMetadata, email);

    if (!userId) {
      console.warn('[dodo-webhook] Could not resolve user (no metadata, no email match). Skipping.');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isNew) {
      console.info(`[dodo-webhook] Provisioned new account for ${email} (user ${userId})`);
    }

    switch (type) {
      case 'subscription.active':
      case 'subscription.renewed':
        if (plan) {
          await supabase.from('user_profiles').upsert({
            id: userId,
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_id: data.subscription_id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
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
