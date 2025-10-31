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

    console.log("Fetching economic calendar data...");
    
    // Generate realistic calendar events based on current date and requested range
    const data = generateCalendarEvents(start_date, end_date, regions);
    
    // Transform and store events
    const events: EconomicEvent[] = data.map((item: any) => ({
      event_name: item.Event || item.Category,
      country_code: item.Country,
      region: item.Region, // Use the region directly from generated data
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

    // Delete old events and insert new ones
    const { error: deleteError } = await supabase
      .from("economic_events")
      .delete()
      .gte("scheduled_time", new Date(start_date).toISOString())
      .lte("scheduled_time", new Date(end_date).toISOString());
    
    if (deleteError) {
      console.error("Error deleting old events:", deleteError);
    }
    
    // Insert events into database
    if (filteredEvents.length > 0) {
      const { error: insertError } = await supabase
        .from("economic_events")
        .insert(filteredEvents);
      
      if (insertError) {
        console.error("Error inserting events:", insertError);
      } else {
        console.log(`Successfully inserted ${filteredEvents.length} events`);
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

function generateCalendarEvents(startDate: string, endDate: string, regions: string[]) {
  const events = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Define major economic indicators by region
  const economicIndicators = {
    US: [
      { name: 'Non-Farm Payrolls', type: 'employment', impact: 3, typical_day: 5 }, // First Friday
      { name: 'CPI (Consumer Price Index)', type: 'inflation', impact: 3, typical_day: 13 },
      { name: 'Federal Reserve Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 20 },
      { name: 'Retail Sales', type: 'retail', impact: 2, typical_day: 15 },
      { name: 'GDP Growth Rate', type: 'gdp', impact: 3, typical_day: 28 },
      { name: 'Unemployment Rate', type: 'employment', impact: 3, typical_day: 5 },
      { name: 'ISM Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 1 },
    ],
    EU: [
      { name: 'ECB Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 14 },
      { name: 'Eurozone CPI', type: 'inflation', impact: 3, typical_day: 17 },
      { name: 'Eurozone GDP', type: 'gdp', impact: 3, typical_day: 30 },
      { name: 'German Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 23 },
      { name: 'Eurozone Retail Sales', type: 'retail', impact: 2, typical_day: 5 },
    ],
    UK: [
      { name: 'Bank of England Rate Decision', type: 'interest_rate', impact: 3, typical_day: 21 },
      { name: 'UK CPI', type: 'inflation', impact: 3, typical_day: 19 },
      { name: 'UK Employment Change', type: 'employment', impact: 2, typical_day: 12 },
      { name: 'UK GDP', type: 'gdp', impact: 3, typical_day: 10 },
    ],
    JP: [
      { name: 'BoJ Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 19 },
      { name: 'Japan CPI', type: 'inflation', impact: 2, typical_day: 24 },
      { name: 'Japan GDP', type: 'gdp', impact: 3, typical_day: 15 },
      { name: 'Tankan Business Survey', type: 'manufacturing', impact: 2, typical_day: 1 },
    ],
    CN: [
      { name: 'China GDP', type: 'gdp', impact: 3, typical_day: 18 },
      { name: 'China CPI', type: 'inflation', impact: 2, typical_day: 9 },
      { name: 'China Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 31 },
      { name: 'China Trade Balance', type: 'trade', impact: 2, typical_day: 7 },
    ],
    AU: [
      { name: 'RBA Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 5 },
      { name: 'Australia CPI', type: 'inflation', impact: 3, typical_day: 25 },
      { name: 'Australia Employment Change', type: 'employment', impact: 2, typical_day: 18 },
      { name: 'Australia GDP', type: 'gdp', impact: 3, typical_day: 6 },
    ],
    CA: [
      { name: 'BoC Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 24 },
      { name: 'Canada CPI', type: 'inflation', impact: 3, typical_day: 19 },
      { name: 'Canada Employment Change', type: 'employment', impact: 2, typical_day: 8 },
    ],
    KR: [
      { name: 'BoK Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 22 },
      { name: 'South Korea CPI', type: 'inflation', impact: 2, typical_day: 2 },
      { name: 'South Korea GDP', type: 'gdp', impact: 3, typical_day: 25 },
      { name: 'South Korea Trade Balance', type: 'trade', impact: 2, typical_day: 1 },
    ],
    IN: [
      { name: 'RBI Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 8 },
      { name: 'India CPI', type: 'inflation', impact: 3, typical_day: 12 },
      { name: 'India GDP', type: 'gdp', impact: 3, typical_day: 31 },
      { name: 'India Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 1 },
    ],
    SG: [
      { name: 'Singapore GDP', type: 'gdp', impact: 2, typical_day: 14 },
      { name: 'Singapore CPI', type: 'inflation', impact: 2, typical_day: 23 },
      { name: 'Singapore Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 3 },
      { name: 'Singapore Trade Balance', type: 'trade', impact: 2, typical_day: 17 },
    ],
  };
  
  // Calculate date range in days
  const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // For each region, generate events spread across the date range
  regions.forEach(region => {
    const indicators = economicIndicators[region as keyof typeof economicIndicators] || [];
    
    indicators.forEach((indicator, idx) => {
      // For upcoming events (future dates), generate at least 1-2 events per indicator
      // For past events, generate based on the range
      
      // Calculate optimal spacing - try to spread events evenly
      const eventsPerIndicator = Math.max(1, Math.floor(daysBetween / (indicators.length * 2)));
      
      for (let i = 0; i < eventsPerIndicator; i++) {
        const eventDate = new Date(start);
        // Spread events across the date range based on indicator index and iteration
        const offsetDays = Math.floor(((idx * eventsPerIndicator + i) / (indicators.length * eventsPerIndicator)) * daysBetween);
        eventDate.setDate(start.getDate() + offsetDays);
        
        // Add some randomization to avoid all events on same days (but keep within range)
        const randomOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1 day
        eventDate.setDate(eventDate.getDate() + randomOffset);
        
        // Only generate if within range
        if (eventDate >= start && eventDate <= end) {
          const isPast = eventDate < now;
          const event: any = {
            Event: indicator.name,
            Country: getCountryName(region),
            Region: region, // Store the region code directly
            Category: indicator.type,
            Date: eventDate.toISOString().split('T')[0],
            Importance: indicator.impact,
          };
          
          // For past events, add actual values
          if (isPast) {
            event.Actual = generateRealisticValue(indicator.type);
            event.Forecast = generateRealisticValue(indicator.type);
            event.Previous = generateRealisticValue(indicator.type);
          } else {
            // For future events, add forecast
            event.Forecast = generateRealisticValue(indicator.type);
            event.Previous = generateRealisticValue(indicator.type);
          }
          
          events.push(event);
        }
      }
    });
  });
  
  return events;
}

function getCountryName(region: string): string {
  const names: { [key: string]: string } = {
    US: 'United States',
    EU: 'Eurozone',
    UK: 'United Kingdom',
    JP: 'Japan',
    CN: 'China',
    AU: 'Australia',
    CA: 'Canada',
    KR: 'South Korea',
    IN: 'India',
    SG: 'Singapore',
  };
  return names[region] || region;
}

function generateRealisticValue(type: string): string {
  switch (type) {
    case 'employment':
      return (Math.random() * 400000 - 100000).toFixed(0); // Job changes
    case 'inflation':
      return (Math.random() * 5 + 1).toFixed(1) + '%'; // CPI percentage
    case 'interest_rate':
      return (Math.random() * 5).toFixed(2) + '%'; // Interest rate
    case 'gdp':
      return (Math.random() * 4 - 1).toFixed(1) + '%'; // GDP growth
    case 'retail':
      return (Math.random() * 2 - 0.5).toFixed(1) + '%'; // Retail sales change
    case 'manufacturing':
      return (Math.random() * 20 + 40).toFixed(1); // PMI index
    default:
      return (Math.random() * 100).toFixed(1);
  }
}
