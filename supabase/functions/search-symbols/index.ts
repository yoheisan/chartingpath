import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Map Yahoo quoteType to our asset_type */
function mapQuoteType(quoteType: string, symbol: string): string {
  const qt = (quoteType || '').toUpperCase();
  if (qt === 'CRYPTOCURRENCY') return 'crypto';
  if (qt === 'CURRENCY') return 'fx';
  if (qt === 'FUTURE' || qt === 'COMMODITY') return 'commodities';
  if (qt === 'INDEX') return 'indices';
  if (qt === 'ETF' || qt === 'MUTUALFUND') return 'etfs';
  if (qt === 'EQUITY') return 'stocks';
  // Fallback heuristics
  if (symbol.endsWith('=X')) return 'fx';
  if (symbol.endsWith('=F')) return 'commodities';
  if (symbol.endsWith('-USD')) return 'crypto';
  return 'stocks';
}

/** Derive exchange from Yahoo exchange field */
function mapExchange(yahooExchange: string, assetType: string, symbol: string): string {
  const ex = (yahooExchange || '').toUpperCase();
  if (ex.includes('NAS') || ex === 'NMS' || ex === 'NGM' || ex === 'NCM') return 'NASDAQ';
  if (ex === 'NYQ' || ex === 'NYSE' || ex === 'NYS') return 'NYSE';
  if (ex === 'HKG') return 'HKEX';
  if (ex === 'SES') return 'SGX';
  if (ex === 'BKK') return 'SET';
  if (ex === 'SHH' || ex === 'SHG') return 'SSE';
  if (ex === 'SHE' || ex === 'SHZ') return 'SZSE';
  if (ex === 'JPX' || ex === 'TYO') return 'JPX';
  if (ex === 'LSE' || ex === 'LON') return 'LSE';
  if (ex === 'GER' || ex === 'FRA') return 'XETRA';
  if (ex === 'PAR') return 'EURONEXT';
  if (ex === 'KSC' || ex === 'KOE') return 'KRX';
  if (ex === 'ASX') return 'ASX';
  if (ex === 'NSI' || ex === 'NSE' || ex === 'BSE') return 'NSE_INDIA';
  if (ex === 'MIL') return 'MIL';
  if (ex.includes('CCC') || ex === 'CCC') return 'BINANCE';
  if (assetType === 'crypto') return 'BINANCE';
  if (assetType === 'fx') return 'FOREX';
  if (assetType === 'commodities') return 'COMEX';
  if (assetType === 'indices') return 'INDEX';
  if (assetType === 'etfs') return 'US_ETF';
  return 'OTHER';
}

function deriveCountry(symbol: string, assetType: string): string | null {
  if (symbol.endsWith('.HK')) return 'HK';
  if (symbol.endsWith('.SI')) return 'SG';
  if (symbol.endsWith('.BK')) return 'TH';
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'CN';
  if (symbol.endsWith('.MI')) return 'IT';
  if (symbol.endsWith('.L')) return 'GB';
  if (symbol.endsWith('.DE')) return 'DE';
  if (symbol.endsWith('.PA')) return 'FR';
  if (symbol.endsWith('.T')) return 'JP';
  if (symbol.endsWith('.AX')) return 'AU';
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) return 'IN';
  if (symbol.endsWith('.KS') || symbol.endsWith('.KQ')) return 'KR';
  if (assetType === 'fx' || assetType === 'crypto' || assetType === 'commodities') return null;
  if (!symbol.includes('.')) return 'US';
  return null;
}

function deriveCurrency(symbol: string, assetType: string): string | null {
  if (symbol.endsWith('.HK')) return 'HKD';
  if (symbol.endsWith('.SI')) return 'SGD';
  if (symbol.endsWith('.BK')) return 'THB';
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'CNY';
  if (symbol.endsWith('.L')) return 'GBP';
  if (symbol.endsWith('.DE') || symbol.endsWith('.PA')) return 'EUR';
  if (symbol.endsWith('.T')) return 'JPY';
  if (symbol.endsWith('.AX')) return 'AUD';
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) return 'INR';
  if (symbol.endsWith('.KS') || symbol.endsWith('.KQ')) return 'KRW';
  if (assetType === 'crypto') return 'USD';
  if (assetType === 'fx') return null;
  if (assetType === 'commodities') return 'USD';
  if (!symbol.includes('.')) return 'USD';
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, upsert_symbol } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Upsert path: persist a selected web result ──
    if (upsert_symbol) {
      const s = upsert_symbol;
      const assetType = mapQuoteType(s.quoteType || '', s.symbol);
      const exchange = mapExchange(s.exchange || '', assetType, s.symbol);
      const row = {
        symbol: s.symbol,
        name: s.name || s.symbol,
        asset_type: assetType,
        exchange,
        country: deriveCountry(s.symbol, assetType),
        currency: deriveCurrency(s.symbol, assetType),
        is_active: true,
      };
      const { error } = await supabase
        .from('instruments')
        .upsert(row, { onConflict: 'symbol' });
      if (error) console.error('[search-symbols] upsert error:', error.message);
      return new Response(JSON.stringify({ success: !error, instrument: row }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Search path: Yahoo Finance autocomplete ──
    if (!query || query.length < 1) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&listsCount=0&enableFuzzyQuery=false`;
    const yahooRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!yahooRes.ok) {
      console.error('[search-symbols] Yahoo API error:', yahooRes.status);
      return new Response(JSON.stringify({ results: [], error: 'Yahoo API error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await yahooRes.json();
    const quotes = data.quotes || [];

    const results = quotes
      .filter((q: any) => q.symbol && q.quoteType !== 'OPTION')
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        quoteType: q.quoteType || 'EQUITY',
        exchange: q.exchange || '',
        asset_type: mapQuoteType(q.quoteType || '', q.symbol),
      }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[search-symbols] Error:', error);
    return new Response(JSON.stringify({ results: [], error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
