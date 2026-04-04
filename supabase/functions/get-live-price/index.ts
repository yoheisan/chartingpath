const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toBinanceSymbol(symbol: string): string {
  // BTC-USD → BTCUSDT, ETH-USD → ETHUSDT
  return symbol.replace('-USD', 'USDT').replace('-USDT', 'USDT');
}

function isCrypto(symbol: string): boolean {
  return symbol.includes('-USD') || symbol.includes('-USDT');
}

function isFx(symbol: string): boolean {
  return symbol.endsWith('=X');
}

async function fetchBinancePrice(symbol: string): Promise<{ price: number; source: string }> {
  const binanceSymbol = toBinanceSymbol(symbol);
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const data = await res.json();
  const price = Number(data.price);
  if (!price || isNaN(price)) throw new Error('Binance returned no price');
  return { price, source: 'binance' };
}

async function fetchYahooPrice(symbol: string): Promise<{ price: number; source: string }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const data = await res.json();
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!price || isNaN(Number(price))) throw new Error('Yahoo returned no price');
  return { price: Number(price), source: 'yahoo' };
}

async function fetchWithFallback(symbol: string): Promise<{ price: number; source: string }> {
  if (isCrypto(symbol)) {
    // Crypto: Binance first, Yahoo fallback
    try { return await fetchBinancePrice(symbol); } catch (e) {
      console.warn(`[get-live-price] Binance failed for ${symbol}:`, e.message);
    }
    return await fetchYahooPrice(symbol);
  }

  // FX and everything else: Yahoo
  return await fetchYahooPrice(symbol);
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

    const { price, source } = await fetchWithFallback(symbol);

    console.log(`[get-live-price] ${symbol} = ${price} via ${source}`);

    return new Response(JSON.stringify({
      price,
      symbol,
      source,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[get-live-price] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch price' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
