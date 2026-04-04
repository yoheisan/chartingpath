import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const { provider, api_key, api_secret, action } = body;

    // Handle disconnect
    if (action === 'disconnect') {
      if (!provider || !['eodhd', 'alpaca'].includes(provider)) {
        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('user_data_providers')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      return new Response(JSON.stringify({ success: true, provider, message: 'Disconnected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate inputs
    if (!provider || !['eodhd', 'alpaca'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider. Must be eodhd or alpaca' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!api_key || typeof api_key !== 'string' || api_key.length < 5) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (provider === 'alpaca' && (!api_secret || typeof api_secret !== 'string')) {
      return new Response(JSON.stringify({ error: 'Alpaca requires both API key and secret' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the key works
    let verified = false;
    let verifyMessage = '';

    if (provider === 'eodhd') {
      try {
        const res = await fetch(
          `https://eodhd.com/api/real-time/EURUSD.FOREX?api_token=${encodeURIComponent(api_key)}&fmt=json`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && (data.close !== undefined || data.previousClose !== undefined)) {
            verified = true;
            verifyMessage = 'EODHD API key verified successfully';
          } else {
            verifyMessage = 'EODHD returned unexpected data — check your API plan';
          }
        } else {
          const text = await res.text();
          verifyMessage = `EODHD returned ${res.status}: ${text.slice(0, 100)}`;
        }
      } catch (e) {
        verifyMessage = `EODHD verification failed: ${(e as Error).message}`;
      }
    } else if (provider === 'alpaca') {
      try {
        const res = await fetch('https://paper-api.alpaca.markets/v2/account', {
          headers: {
            'APCA-API-KEY-ID': api_key,
            'APCA-API-SECRET-KEY': api_secret!,
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          verified = true;
          verifyMessage = 'Alpaca API key verified successfully';
        } else {
          const text = await res.text();
          verifyMessage = `Alpaca returned ${res.status}: ${text.slice(0, 100)}`;
        }
      } catch (e) {
        verifyMessage = `Alpaca verification failed: ${(e as Error).message}`;
      }
    }

    if (!verified) {
      return new Response(JSON.stringify({ success: false, provider, message: verifyMessage }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert into user_data_providers
    const { error: upsertErr } = await supabase
      .from('user_data_providers')
      .upsert({
        user_id: userId,
        provider,
        api_key_encrypted: api_key,
        api_secret_encrypted: api_secret || null,
        is_active: true,
        verified_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (upsertErr) {
      console.error('Upsert error:', upsertErr);
      return new Response(JSON.stringify({ success: false, provider, message: 'Failed to save provider' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, provider, message: verifyMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('verify-data-provider error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
