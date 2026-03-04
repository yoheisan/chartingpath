import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ALL_INSTRUMENTS, type Instrument } from "../_shared/screenerInstruments.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Derives exchange from symbol conventions.
 */
function deriveExchange(yahooSymbol: string, assetType: string): string {
  // APAC suffixes
  if (yahooSymbol.endsWith('.HK')) return 'HKEX';
  if (yahooSymbol.endsWith('.SI')) return 'SGX';
  if (yahooSymbol.endsWith('.BK')) return 'SET';
  if (yahooSymbol.endsWith('.SS')) return 'SSE';
  if (yahooSymbol.endsWith('.SZ')) return 'SZSE';
  if (yahooSymbol.endsWith('.MI')) return 'MIL';

  // Asset-type based
  if (assetType === 'crypto') return 'CRYPTO';
  if (assetType === 'fx') return 'FOREX';
  if (assetType === 'commodities') return 'COMEX';
  if (assetType === 'indices') {
    if (yahooSymbol.startsWith('^GSPC') || yahooSymbol.startsWith('^DJI') || yahooSymbol.startsWith('^IXIC') || yahooSymbol.startsWith('^NDX') || yahooSymbol.startsWith('^RUT') || yahooSymbol.startsWith('^VIX') || yahooSymbol.startsWith('^MID') || yahooSymbol.startsWith('^SP600')) return 'US_INDEX';
    if (yahooSymbol.startsWith('^FTSE')) return 'LSE';
    if (yahooSymbol.startsWith('^GDAXI')) return 'XETRA';
    if (yahooSymbol.startsWith('^FCHI')) return 'EURONEXT';
    if (yahooSymbol.startsWith('^N225')) return 'JPX';
    if (yahooSymbol.startsWith('^HSI')) return 'HKEX';
    if (yahooSymbol.startsWith('^KS11')) return 'KRX';
    if (yahooSymbol.startsWith('^STI')) return 'SGX';
    if (yahooSymbol.startsWith('^AXJO')) return 'ASX';
    if (yahooSymbol.startsWith('^BSESN') || yahooSymbol.startsWith('^NSEI')) return 'NSE_INDIA';
    if (yahooSymbol.startsWith('000001.SS') || yahooSymbol.startsWith('399001.SZ')) return 'SSE';
    return 'INDEX';
  }
  if (assetType === 'etfs') return 'US_ETF';

  // US stocks: best-effort NYSE/NASDAQ mapping
  // Known NASDAQ-listed stocks (major ones)
  const nasdaqSymbols = new Set([
    'AAPL','MSFT','GOOGL','GOOG','AMZN','NVDA','META','TSLA','AVGO','AMD','INTC','QCOM',
    'TXN','MU','ASML','LRCX','AMAT','KLAC','MRVL','ADI','NXPI','ON','MPWR','SWKS','QRVO',
    'CRM','ORCL','ADBE','NOW','INTU','SNOW','PANW','CRWD','DDOG','ZS','WDAY','TEAM',
    'SPLK','FTNT','NET','MDB','OKTA','VEEV','HUBS','TTD','ANSS','CDNS','SNPS','PTC',
    'NFLX','BKNG','ABNB','UBER','LYFT','SHOP','PYPL','COIN','ROKU','SPOT','DASH',
    'ZM','DOCU','ETSY','EBAY','PINS','TWLO','MTCH',
    'COST','TGT','ORLY','DLTR','ULTA','FIVE','ROST',
    'PEP','MDLZ','KMB','KR','STZ',
    'CMCSA','CHTR','TMUS','EA','TTWO','ATVI',
    'PDD','BIDU','JD','NTES','BILI','NIO','XPEV','LI',
    'AMGN','GILD','REGN','VRTX','MRNA','ISRG','BIIB','ILMN','DXCM','ALGN','IDXX',
    'SBUX','LULU','MAR','RCL',
    'CSX','ODFL','FAST','PAYX','VRSK','CPRT',
    'PLTR','RIVN','LCID','SOFI','HOOD','RBLX','SNAP','U','AFRM','UPST','CLOV',
    'GME','AMC',
    'PAYC','PCTY','BILL','ZI','CFLT','PATH',
    'ENTG','TER','MKSI','ACLS',
    'HOLX','WAT','TECH','BBY','WSM','RH','ANF','YELP',
    'MCHP','SMCI','LSCC','MBLY','ARM',
  ]);

  if (nasdaqSymbols.has(yahooSymbol)) return 'NASDAQ';
  
  // Default US stocks to NYSE
  if (assetType === 'stocks' && !yahooSymbol.includes('.')) return 'NYSE';

  return 'OTHER';
}

function deriveCountry(yahooSymbol: string, assetType: string): string | null {
  if (yahooSymbol.endsWith('.HK')) return 'HK';
  if (yahooSymbol.endsWith('.SI')) return 'SG';
  if (yahooSymbol.endsWith('.BK')) return 'TH';
  if (yahooSymbol.endsWith('.SS') || yahooSymbol.endsWith('.SZ')) return 'CN';
  if (yahooSymbol.endsWith('.MI')) return 'IT';
  if (assetType === 'fx' || assetType === 'crypto' || assetType === 'commodities') return null;
  if (assetType === 'indices') {
    if (yahooSymbol.startsWith('^FTSE')) return 'GB';
    if (yahooSymbol.startsWith('^GDAXI')) return 'DE';
    if (yahooSymbol.startsWith('^FCHI')) return 'FR';
    if (yahooSymbol.startsWith('^N225')) return 'JP';
    if (yahooSymbol.startsWith('^HSI')) return 'HK';
    if (yahooSymbol.startsWith('^KS11')) return 'KR';
    if (yahooSymbol.startsWith('^TWII')) return 'TW';
    if (yahooSymbol.startsWith('^AXJO')) return 'AU';
    if (yahooSymbol.startsWith('^BSESN') || yahooSymbol.startsWith('^NSEI')) return 'IN';
    if (yahooSymbol.startsWith('^GSPTSE')) return 'CA';
    if (yahooSymbol.startsWith('^BVSP')) return 'BR';
    if (yahooSymbol.startsWith('^MXX')) return 'MX';
    if (yahooSymbol.startsWith('^MERV')) return 'AR';
    if (yahooSymbol.startsWith('^JKSE')) return 'ID';
    if (yahooSymbol.startsWith('^STI')) return 'SG';
  }
  return 'US';
}

function deriveCurrency(yahooSymbol: string, assetType: string): string | null {
  if (yahooSymbol.endsWith('.HK')) return 'HKD';
  if (yahooSymbol.endsWith('.SI')) return 'SGD';
  if (yahooSymbol.endsWith('.BK')) return 'THB';
  if (yahooSymbol.endsWith('.SS') || yahooSymbol.endsWith('.SZ')) return 'CNY';
  if (assetType === 'crypto') return 'USD';
  if (assetType === 'fx') return null;
  if (assetType === 'commodities') return 'USD';
  return 'USD';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rows: any[] = [];

    for (const [assetType, instruments] of Object.entries(ALL_INSTRUMENTS)) {
      for (const inst of instruments as Instrument[]) {
        rows.push({
          symbol: inst.yahooSymbol,
          name: inst.name || null,
          exchange: deriveExchange(inst.yahooSymbol, assetType),
          asset_type: assetType,
          country: deriveCountry(inst.yahooSymbol, assetType),
          currency: deriveCurrency(inst.yahooSymbol, assetType),
          is_active: true,
        });
      }
    }

    console.log(`[seed-instruments] Seeding ${rows.length} instruments`);

    // Upsert in batches of 100
    let upserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from('instruments').upsert(batch, { onConflict: 'symbol' });
      if (error) {
        console.error(`[seed-instruments] Batch ${i} error:`, error.message);
      } else {
        upserted += batch.length;
      }
    }

    // Backfill exchange on live_pattern_detections
    const { error: backfillLpd } = await supabase.rpc('backfill_exchange_live_patterns');
    if (backfillLpd) console.warn('[seed-instruments] LPD backfill skipped (function may not exist yet):', backfillLpd.message);

    // Backfill exchange on historical_pattern_occurrences 
    const { error: backfillHpo } = await supabase.rpc('backfill_exchange_historical_patterns');
    if (backfillHpo) console.warn('[seed-instruments] HPO backfill skipped (function may not exist yet):', backfillHpo.message);

    return new Response(JSON.stringify({
      success: true,
      totalInstruments: rows.length,
      upserted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[seed-instruments] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
