import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, start, end, type = "eod" } = await req.json();
    const apiKey = Deno.env.get("EODHD_API_KEY");

    if (!apiKey) {
      throw new Error("EODHD_API_KEY not configured");
    }

    console.log(`Fetching ${type} data for symbols:`, symbols, `from ${start} to ${end}`);

    const seriesMap: Record<string, { date: string, adjClose: number }[]> = {};

    for (const symbol of symbols) {
      const url = `https://eodhistoricaldata.com/api/eod/${encodeURIComponent(symbol)}?from=${start}&to=${end}&adjusted=true&order=a&api_token=${apiKey}`;
      
      console.log(`Fetching data for ${symbol}:`, url.replace(apiKey, "***"));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch data for ${symbol}:`, response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${response.status} for ${symbol}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} data points for ${symbol}`);
      
      seriesMap[symbol] = (data || []).map((r: any) => ({
        date: r.date,
        adjClose: Number(r.adjusted_close ?? r.close)
      }));
    }

    // Convert to PriceFrame format
    const allDates = Array.from(new Set(symbols.flatMap((s: string) => seriesMap[s].map(r => r.date)))).sort();
    const data = allDates.map(d => symbols.map((s: string) => {
      const row = seriesMap[s].find(r => r.date === d);
      return row ? row.adjClose : NaN;
    }));

    const priceFrame = {
      index: allDates,
      columns: symbols,
      data,
      meta: { provider: "EODHD", fetchedAt: new Date().toISOString() }
    };

    console.log(`Returning price frame with ${allDates.length} dates and ${symbols.length} symbols`);

    return new Response(JSON.stringify(priceFrame), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Market data fetch error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});