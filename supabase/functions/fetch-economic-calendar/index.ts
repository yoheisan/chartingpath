import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FinnhubEconomicEvent {
  actual: number | null;
  country: string;
  estimate: number | null;
  event: string;
  impact: string;
  prev: number | null;
  time: string;
  unit: string;
}

async function fetchFinnhubEconomicCalendar(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const fromDate = startDate.split('T')[0];
  const toDate = endDate.split('T')[0];
  
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${apiKey}`;
  
  console.log(`Fetching Finnhub economic calendar: ${fromDate} to ${toDate}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`Finnhub API error: ${response.status}`);
    throw new Error(`Finnhub API error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`Received ${data.economicCalendar?.length || 0} events from Finnhub`);
  
  // Transform Finnhub data to our format
  const events = (data.economicCalendar || []).map((event: FinnhubEconomicEvent) => {
    // Map Finnhub impact to our importance scale
    let importance: string;
    if (event.impact === "high") {
      importance = "High";
    } else if (event.impact === "medium") {
      importance = "Medium";
    } else {
      importance = "Low";
    }
    
    // Determine category based on event name
    let category = "Other";
    const eventLower = event.event.toLowerCase();
    if (eventLower.includes("employment") || eventLower.includes("jobs") || eventLower.includes("unemployment")) {
      category = "Employment";
    } else if (eventLower.includes("gdp")) {
      category = "GDP";
    } else if (eventLower.includes("inflation") || eventLower.includes("cpi") || eventLower.includes("ppi")) {
      category = "Inflation";
    } else if (eventLower.includes("retail") || eventLower.includes("sales")) {
      category = "Consumer";
    } else if (eventLower.includes("rate") || eventLower.includes("fomc") || eventLower.includes("fed")) {
      category = "Central Bank";
    } else if (eventLower.includes("pmi") || eventLower.includes("manufacturing")) {
      category = "Manufacturing";
    }
    
    return {
      Event: event.event,
      Country: getCountryName(event.country),
      Region: event.country,
      Category: category,
      Date: event.time,
      Importance: importance,
      Actual: event.actual,
      Forecast: event.estimate,
      Previous: event.prev,
      Unit: event.unit || ""
    };
  });
  
  return events;
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    'US': 'United States',
    'EU': 'European Union',
    'GB': 'United Kingdom',
    'JP': 'Japan',
    'CN': 'China',
    'AU': 'Australia',
    'CA': 'Canada',
    'CH': 'Switzerland',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'KR': 'South Korea',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'NZ': 'New Zealand',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'PL': 'Poland',
    'TR': 'Turkey',
    'ZA': 'South Africa',
    'RU': 'Russia',
  };
  return names[code] || code;
}

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
    
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching real economic calendar data from Finnhub...");
    
    // Fetch real economic calendar events from Finnhub
    const data = await fetchFinnhubEconomicCalendar(FINNHUB_API_KEY, start_date, end_date);
    
    // Filter by regions if specified
    let filteredData = data;
    if (regions && regions.length > 0) {
      filteredData = data.filter((item: any) => regions.includes(item.Region));
    }
    
    // Transform and store events
    const events: EconomicEvent[] = filteredData.map((item: any) => ({
      event_name: item.Event,
      country_code: item.Country,
      region: item.Region,
      indicator_type: mapToIndicatorType(item.Category),
      impact_level: item.Importance.toLowerCase(),
      scheduled_time: new Date(item.Date).toISOString(),
      actual_value: item.Actual !== null ? item.Actual.toString() : null,
      forecast_value: item.Forecast !== null ? item.Forecast.toString() : null,
      previous_value: item.Previous !== null ? item.Previous.toString() : null,
      market_impact: item.Actual !== null && item.Forecast !== null ? 
        generateMarketImpact(item) : null,
      released: item.Actual !== null
    }));

    console.log(`Fetched ${events.length} events from Finnhub`);
    console.log(`Impact levels requested: ${impact_levels?.join(', ') || 'all'}`);
    
    // Count events by impact level
    const impactCounts = {
      high: events.filter(e => e.impact_level === 'high').length,
      medium: events.filter(e => e.impact_level === 'medium').length,
      low: events.filter(e => e.impact_level === 'low').length,
    };
    console.log('Events by impact:', impactCounts);

    // Delete ALL events in the date range (regardless of impact level)
    const { error: deleteError } = await supabase
      .from("economic_events")
      .delete()
      .gte("scheduled_time", new Date(start_date).toISOString())
      .lte("scheduled_time", new Date(end_date).toISOString());
    
    if (deleteError) {
      console.error("Error deleting old events:", deleteError);
    }
    
    // Insert ALL events into database (don't filter by impact level)
    if (events.length > 0) {
      const { error: insertError } = await supabase
        .from("economic_events")
        .insert(events);
      
      if (insertError) {
        console.error("Error inserting events:", insertError);
      } else {
        console.log(`Successfully inserted ${events.length} events (all importance levels)`);
      }
    }

    console.log(`Processed ${events.length} economic events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: events,
        count: events.length,
        impact_breakdown: impactCounts
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
  if (countryUpper.includes("KOREA") || countryUpper.includes("KR")) return "KR";
  if (countryUpper.includes("INDIA") || countryUpper.includes("IN")) return "IN";
  if (countryUpper.includes("SINGAPORE") || countryUpper.includes("SG")) return "SG";
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

function mapImpactLevel(importance: string): string {
  const imp = importance.toLowerCase();
  if (imp === "high") return "high";
  if (imp === "medium") return "medium";
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

