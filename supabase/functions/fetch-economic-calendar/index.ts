import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EconomicEvent {
  name: string;
  country_code: string;
  region: string;
  indicator_type: string;
  impact_level: string;
  scheduled_time: string;
  actual_value?: string;
  forecast_value?: string;
  previous_value?: string;
  market_impact?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start_date, end_date, regions, impact_levels } = await req.json();
    
    const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
    
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error("ALPHA_VANTAGE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // For demo/free tier: Use mock data or FRED API for US data
    // Alpha Vantage has economic indicators but limited calendar functionality
    // Here we'll create a hybrid approach: fetch key indicators and format as calendar events
    
    console.log("Fetching economic calendar data...");
    
    // Fetch key US indicators from Alpha Vantage
    const indicators = ['CPI', 'RETAIL_SALES', 'UNEMPLOYMENT', 'NONFARM_PAYROLL'];
    const data = [];
    
    for (const indicator of indicators) {
      const url = `https://www.alphavantage.co/query?function=ECONOMIC_INDICATOR&name=${indicator}&interval=monthly&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          // Transform to calendar event format
          const latestData = result.data[0];
          data.push({
            Event: indicator.replace('_', ' '),
            Country: 'United States',
            Category: indicator,
            Date: latestData.date,
            Actual: latestData.value,
            Importance: indicator === 'NONFARM_PAYROLL' ? 3 : 2
          });
        }
      }
    }
    
    // Transform and store events
    const events: EconomicEvent[] = data.map((item: any) => ({
      event_name: item.Event || item.Category,
      country_code: item.Country,
      region: mapCountryToRegion(item.Country),
      indicator_type: mapToIndicatorType(item.Category),
      impact_level: mapImpactLevel(item.Importance || 2),
      scheduled_time: new Date(item.Date).toISOString(),
      actual_value: item.Actual?.toString(),
      forecast_value: item.Forecast?.toString(),
      previous_value: item.Previous?.toString(),
      market_impact: item.Actual && item.Forecast ? 
        generateMarketImpact(item) : null,
      released: !!item.Actual
    }));

    // Filter by impact level if specified
    const filteredEvents = impact_levels && impact_levels.length > 0
      ? events.filter(e => impact_levels.includes(e.impact_level))
      : events;

    // Upsert events into database
    for (const event of filteredEvents) {
      const { error } = await supabase
        .from("economic_events")
        .upsert(event, {
          onConflict: "event_name,scheduled_time",
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error("Error upserting event:", error);
      }
    }

    console.log(`Processed ${filteredEvents.length} economic events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: filteredEvents,
        count: filteredEvents.length 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error fetching economic calendar:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

function mapCountryToRegion(country: string): string {
  const countryUpper = country.toUpperCase();
  if (countryUpper.includes("UNITED STATES") || countryUpper.includes("US")) return "US";
  if (countryUpper.includes("EURO") || countryUpper.includes("EUROPE")) return "EU";
  if (countryUpper.includes("UNITED KINGDOM") || countryUpper.includes("UK")) return "UK";
  if (countryUpper.includes("JAPAN")) return "JP";
  if (countryUpper.includes("CHINA")) return "CN";
  if (countryUpper.includes("AUSTRALIA")) return "AU";
  if (countryUpper.includes("CANADA")) return "CA";
  return "OTHER";
}

function mapToIndicatorType(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("cpi") || cat.includes("inflation") || cat.includes("price")) return "inflation";
  if (cat.includes("gdp") || cat.includes("growth")) return "gdp";
  if (cat.includes("employment") || cat.includes("job") || cat.includes("unemployment")) return "employment";
  if (cat.includes("rate") || cat.includes("interest")) return "interest_rate";
  if (cat.includes("manufacturing") || cat.includes("pmi") || cat.includes("production")) return "manufacturing";
  if (cat.includes("retail") || cat.includes("sales")) return "retail";
  if (cat.includes("trade") || cat.includes("balance")) return "trade";
  return "other";
}

function mapImpactLevel(importance: number): string {
  if (importance >= 3) return "high";
  if (importance >= 2) return "medium";
  return "low";
}

function generateMarketImpact(item: any): string {
  const actual = parseFloat(item.Actual);
  const forecast = parseFloat(item.Forecast);
  
  if (isNaN(actual) || isNaN(forecast)) return "";
  
  const diff = actual - forecast;
  const diffPercent = ((diff / Math.abs(forecast)) * 100).toFixed(1);
  
  if (Math.abs(diff) < Math.abs(forecast) * 0.05) {
    return "In line with expectations. Minimal market reaction expected.";
  }
  
  if (diff > 0) {
    return `Came in ${Math.abs(parseFloat(diffPercent))}% higher than forecast. Potentially bullish for ${item.Country} currency.`;
  } else {
    return `Came in ${Math.abs(parseFloat(diffPercent))}% lower than forecast. Potentially bearish for ${item.Country} currency.`;
  }
}
