import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCT_MAP: Record<string, { productId: string; trialDays: number }> = {
  lite_monthly:   { productId: 'pdt_0Nbw1TfS9k9QciWvtEDul', trialDays: 0 },
  lite_annual:    { productId: 'pdt_0Nci20cdaF4NVVxpL7QuN', trialDays: 0 },
  pro_monthly:    { productId: 'pdt_0Nbw2MO14rFVG1F2iZZeG', trialDays: 7 },
  pro_annual:     { productId: 'pdt_0Nci2DtFPMDY7ktqZ5Eob', trialDays: 7 },
  elite_monthly:  { productId: 'pdt_0Nbw2hFVLIRWJlaYWl4Hp', trialDays: 7 },
  elite_annual:   { productId: 'pdt_0Nci1W1HiJ3Cn5fww0Zxi', trialDays: 7 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Optional auth — if a valid user session is present, use their email/id.
    // If not, allow anonymous checkout (Dodo will collect email at checkout).
    let user: { id: string; email: string; name?: string } | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      if (authUser?.email) {
        user = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name,
        };
      }
    }

    const { planKey, email: bodyEmail } = await req.json();
    const plan = PRODUCT_MAP[planKey];
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const DODO_SECRET_KEY = Deno.env.get('DODO_SECRET_KEY')!;
    const DODO_BASE = 'https://test.dodopayments.com';

    const checkoutEmail = user?.email || bodyEmail || undefined;

    const body: any = {
      product_cart: [{ product_id: plan.productId, quantity: 1 }],
      return_url: 'https://chartingpath.com/dashboard',
      metadata: { plan_key: planKey },
    };

    if (checkoutEmail) {
      body.customer = { email: checkoutEmail, name: user?.name || checkoutEmail };
    }

    if (user?.id) {
      body.metadata.user_id = user.id;
    }

    if (plan.trialDays > 0) {
      body.subscription_data = { trial_period_days: plan.trialDays };
    }

    const response = await fetch(`${DODO_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DODO_SECRET_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[create-checkout-session] Dodo error:', err);
      return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await response.json();
    return new Response(JSON.stringify({ checkout_url: session.checkout_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[create-checkout-session]', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
