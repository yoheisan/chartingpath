import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp',
};

// Map Dodo product IDs back to internal plan tiers + billing cycles
const PRODUCT_ID_TO_PLAN: Record<string, { plan: string; cycle: 'monthly' | 'annual' }> = {
  'pdt_0Nbw1TfS9k9QciWvtEDul': { plan: 'lite',  cycle: 'monthly' },
  'pdt_0Nci20cdaF4NVVxpL7QuN': { plan: 'lite',  cycle: 'annual'  },
  'pdt_0Nbw2MO14rFVG1F2iZZeG': { plan: 'pro',   cycle: 'monthly' },
  'pdt_0Nci2DtFPMDY7ktqZ5Eob': { plan: 'pro',   cycle: 'annual'  },
  'pdt_0Nbw2hFVLIRWJlaYWl4Hp': { plan: 'elite', cycle: 'monthly' },
  'pdt_0Nci1W1HiJ3Cn5fww0Zxi': { plan: 'elite', cycle: 'annual'  },
};

function planFromProductId(productId?: string | null): { plan: string; cycle: string } | null {
  if (!productId) return null;
  return PRODUCT_ID_TO_PLAN[productId] ?? null;
}

function planFromMetadata(meta: any): { plan: string; cycle: string } | null {
  const k: string | undefined = meta?.plan_key;
  if (!k) return null;
  const [plan, cycle] = k.split('_');
  if (!plan || !cycle) return null;
  return { plan, cycle };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const WEBHOOK_SECRET = Deno.env.get('DODO_WEBHOOK_SECRET');
  const SITE_URL = Deno.env.get('SITE_URL') || 'https://chartingpath.com';

  if (!WEBHOOK_SECRET) {
    console.error('[dodo-webhook] DODO_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Server not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Verify signature (Dodo uses Standard Webhooks spec)
  const rawBody = await req.text();
  const headers = {
    'webhook-id': req.headers.get('webhook-id') ?? '',
    'webhook-signature': req.headers.get('webhook-signature') ?? '',
    'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
  };

  let event: any;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(rawBody, headers);
  } catch (err: any) {
    console.error('[dodo-webhook] Signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[dodo-webhook] Event received:', event.type);

  try {
    const payload = event.data ?? event;
    const meta = payload.metadata ?? {};
    const customerEmail: string | undefined =
      payload.customer?.email ?? payload.email ?? meta.email;
    const customerName: string | undefined =
      payload.customer?.name ?? meta.name;
    const subscriptionId: string | undefined =
      payload.subscription_id ?? payload.id;
    const productId: string | undefined =
      payload.product_id ?? payload.product_cart?.[0]?.product_id;

    const planInfo =
      planFromMetadata(meta) ?? planFromProductId(productId);

    // Resolve user_id: prefer metadata, fallback to email lookup, else create
    let userId: string | undefined = meta.user_id;

    if (!userId && customerEmail) {
      // Try to find existing auth user by email
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('email', customerEmail)
        .maybeSingle();

      if (existing?.user_id) {
        userId = existing.user_id;
      } else {
        // Anonymous payer — auto-create account + send magic link
        const { data: created, error: createErr } =
          await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: { full_name: customerName, source: 'dodo_anonymous_checkout' },
          });

        if (createErr) {
          console.error('[dodo-webhook] Failed to create user:', createErr.message);
        } else if (created.user) {
          userId = created.user.id;

          // Send magic link so they can access the account
          const { error: linkErr } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: customerEmail,
            options: {
              redirectTo: `${SITE_URL}/members/account?welcome=true`,
            },
          });
          if (linkErr) console.error('[dodo-webhook] Magic link error:', linkErr.message);
          console.log('[dodo-webhook] Created account for anonymous payer:', customerEmail);
        }
      }
    }

    // Handle event types
    switch (event.type) {
      case 'subscription.active':
      case 'subscription.created':
      case 'subscription.renewed':
      case 'payment.succeeded': {
        if (!userId || !planInfo) {
          console.warn('[dodo-webhook] Missing userId or planInfo, skipping activation', {
            userId, planInfo, productId, customerEmail,
          });
          break;
        }

        // Upsert subscription record
        const subPayload: any = {
          user_id: userId,
          stripe_subscription_id: subscriptionId, // reused column for Dodo sub id
          current_plan: planInfo.plan,
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        if (payload.previous_billing_date) subPayload.current_period_start = payload.previous_billing_date;
        if (payload.next_billing_date) subPayload.current_period_end = payload.next_billing_date;

        // Try update existing, else insert
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingSub) {
          await supabase.from('subscriptions').update(subPayload).eq('id', existingSub.id);
        } else {
          await supabase.from('subscriptions').insert(subPayload);
        }

        // Update profile tier
        await supabase
          .from('profiles')
          .update({
            subscription_plan: planInfo.plan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Log billing event
        await supabase.from('billing_events').insert({
          user_id: userId,
          event_type: event.type,
          to_plan: planInfo.plan,
          full_amount_cents: payload.total_amount ?? null,
          metadata: { dodo_event: event.type, billing_cycle: planInfo.cycle, raw: payload },
        });

        console.log('[dodo-webhook] Activated', planInfo.plan, 'for', userId);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.canceled':
      case 'subscription.expired': {
        if (!userId) break;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancel_at_period_end: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        await supabase.from('billing_events').insert({
          user_id: userId,
          event_type: event.type,
          metadata: { raw: payload },
        });
        console.log('[dodo-webhook] Cancelled subscription for', userId);
        break;
      }

      case 'payment.failed': {
        if (!userId) break;
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        await supabase.from('billing_events').insert({
          user_id: userId,
          event_type: event.type,
          metadata: { raw: payload },
        });
        break;
      }

      case 'refund.succeeded':
      case 'refund.created': {
        if (!userId) break;
        await supabase.from('billing_events').insert({
          user_id: userId,
          event_type: event.type,
          full_amount_cents: payload.amount ?? null,
          metadata: { raw: payload },
        });
        await supabase
          .from('profiles')
          .update({ subscription_plan: 'free', subscription_status: 'refunded', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      }

      default:
        console.log('[dodo-webhook] Unhandled event:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[dodo-webhook] Handler error:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});