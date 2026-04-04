const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toEODHDSymbol(symbol: string): string {
  // FX pairs: EURUSD=X → EURUSD.FOREX
  if (symbol.endsWith('=X')) {
    return symbol.replace('=X', '.FOREX');
  }
  // Crypto: BTC-USD → BTC-USD (EODHD uses CC exchange)
  if (symbol.includes('-USD') || symbol.includes('-USDT')) {
    const base = symbol.split('-')[0];
    return `${base}-USD.CC`;
  }
  // Default: assume US exchange
  return `${symbol}.US`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    if (!symbol || typeof symbol !== 'string') {
      return new Response(JSON.stringify({ error: 'symbol is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('EODHD_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'EODHD_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eodhSymbol = toEODHDSymbol(symbol);
    const url = `https://eodhd.com/api/real-time/${eodhSymbol}?api_token=${apiKey}&fmt=json`;

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.error(`[get-live-price] EODHD error: ${response.status} for ${eodhSymbol}`);
      return new Response(JSON.stringify({ error: `EODHD returned ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const price = Number(data.close || data.previousClose || data.open);

    if (!price || isNaN(price) || price <= 0) {
      console.error(`[get-live-price] No valid price for ${eodhSymbol}:`, data);
      return new Response(JSON.stringify({ error: 'No valid price returned' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[get-live-price] ${symbol} → ${eodhSymbol} = ${price}`);

    return new Response(JSON.stringify({
      price,
      symbol,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[get-live-price] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
