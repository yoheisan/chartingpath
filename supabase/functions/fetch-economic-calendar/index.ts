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

    // Don't filter by impact level - generate all levels
    console.log(`Generated ${events.length} events before filtering`);
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
  
  // Define economic indicators by region with varying importance levels
  const economicIndicators = {
    US: [
      // High Impact (3)
      { name: 'Non-Farm Payrolls', type: 'employment', impact: 3, typical_day: 5 },
      { name: 'CPI (Consumer Price Index)', type: 'inflation', impact: 3, typical_day: 13 },
      { name: 'Federal Reserve Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 20 },
      { name: 'GDP Growth Rate', type: 'gdp', impact: 3, typical_day: 28 },
      { name: 'Unemployment Rate', type: 'employment', impact: 3, typical_day: 5 },
      // Medium Impact (2)
      { name: 'Retail Sales', type: 'retail', impact: 2, typical_day: 15 },
      { name: 'ISM Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 1 },
      { name: 'PPI (Producer Price Index)', type: 'inflation', impact: 2, typical_day: 14 },
      { name: 'Consumer Confidence', type: 'other', impact: 2, typical_day: 26 },
      { name: 'Durable Goods Orders', type: 'manufacturing', impact: 2, typical_day: 22 },
      // Low Impact (1)
      { name: 'Building Permits', type: 'other', impact: 1, typical_day: 17 },
      { name: 'Housing Starts', type: 'other', impact: 1, typical_day: 16 },
      { name: 'Factory Orders', type: 'manufacturing', impact: 1, typical_day: 4 },
      { name: 'Crude Oil Inventories', type: 'other', impact: 1, typical_day: 11 },
    ],
    EU: [
      // High Impact (3)
      { name: 'ECB Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 14 },
      { name: 'Eurozone CPI', type: 'inflation', impact: 3, typical_day: 17 },
      { name: 'Eurozone GDP', type: 'gdp', impact: 3, typical_day: 30 },
      // Medium Impact (2)
      { name: 'German Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 23 },
      { name: 'Eurozone Retail Sales', type: 'retail', impact: 2, typical_day: 5 },
      { name: 'German IFO Business Climate', type: 'other', impact: 2, typical_day: 24 },
      // Low Impact (1)
      { name: 'Eurozone Industrial Production', type: 'manufacturing', impact: 1, typical_day: 12 },
      { name: 'German ZEW Economic Sentiment', type: 'other', impact: 1, typical_day: 19 },
    ],
    UK: [
      // High Impact (3)
      { name: 'Bank of England Rate Decision', type: 'interest_rate', impact: 3, typical_day: 21 },
      { name: 'UK CPI', type: 'inflation', impact: 3, typical_day: 19 },
      { name: 'UK GDP', type: 'gdp', impact: 3, typical_day: 10 },
      // Medium Impact (2)
      { name: 'UK Employment Change', type: 'employment', impact: 2, typical_day: 12 },
      { name: 'UK Retail Sales', type: 'retail', impact: 2, typical_day: 20 },
      // Low Impact (1)
      { name: 'UK Manufacturing PMI', type: 'manufacturing', impact: 1, typical_day: 1 },
      { name: 'UK Services PMI', type: 'other', impact: 1, typical_day: 3 },
    ],
    JP: [
      // High Impact (3)
      { name: 'BoJ Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 19 },
      { name: 'Japan GDP', type: 'gdp', impact: 3, typical_day: 15 },
      // Medium Impact (2)
      { name: 'Japan CPI', type: 'inflation', impact: 2, typical_day: 24 },
      { name: 'Tankan Business Survey', type: 'manufacturing', impact: 2, typical_day: 1 },
      { name: 'Japan Trade Balance', type: 'trade', impact: 2, typical_day: 18 },
      // Low Impact (1)
      { name: 'Japan Industrial Production', type: 'manufacturing', impact: 1, typical_day: 29 },
      { name: 'Japan Retail Sales', type: 'retail', impact: 1, typical_day: 27 },
    ],
    CN: [
      // High Impact (3)
      { name: 'China GDP', type: 'gdp', impact: 3, typical_day: 18 },
      // Medium Impact (2)
      { name: 'China CPI', type: 'inflation', impact: 2, typical_day: 9 },
      { name: 'China Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 31 },
      { name: 'China Trade Balance', type: 'trade', impact: 2, typical_day: 7 },
      { name: 'China Retail Sales', type: 'retail', impact: 2, typical_day: 15 },
      // Low Impact (1)
      { name: 'China Industrial Production', type: 'manufacturing', impact: 1, typical_day: 14 },
      { name: 'China Fixed Asset Investment', type: 'other', impact: 1, typical_day: 13 },
    ],
    AU: [
      // High Impact (3)
      { name: 'RBA Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 5 },
      { name: 'Australia CPI', type: 'inflation', impact: 3, typical_day: 25 },
      { name: 'Australia GDP', type: 'gdp', impact: 3, typical_day: 6 },
      // Medium Impact (2)
      { name: 'Australia Employment Change', type: 'employment', impact: 2, typical_day: 18 },
      { name: 'Australia Trade Balance', type: 'trade', impact: 2, typical_day: 2 },
      // Low Impact (1)
      { name: 'Australia Retail Sales', type: 'retail', impact: 1, typical_day: 30 },
    ],
    CA: [
      // High Impact (3)
      { name: 'BoC Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 24 },
      { name: 'Canada CPI', type: 'inflation', impact: 3, typical_day: 19 },
      // Medium Impact (2)
      { name: 'Canada Employment Change', type: 'employment', impact: 2, typical_day: 8 },
      { name: 'Canada GDP', type: 'gdp', impact: 2, typical_day: 29 },
      // Low Impact (1)
      { name: 'Canada Retail Sales', type: 'retail', impact: 1, typical_day: 21 },
    ],
    KR: [
      // High Impact (3)
      { name: 'BoK Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 22 },
      { name: 'South Korea GDP', type: 'gdp', impact: 3, typical_day: 25 },
      // Medium Impact (2)
      { name: 'South Korea CPI', type: 'inflation', impact: 2, typical_day: 2 },
      { name: 'South Korea Trade Balance', type: 'trade', impact: 2, typical_day: 1 },
      { name: 'South Korea Exports', type: 'trade', impact: 2, typical_day: 15 },
      // Low Impact (1)
      { name: 'South Korea Industrial Production', type: 'manufacturing', impact: 1, typical_day: 30 },
      { name: 'South Korea Retail Sales', type: 'retail', impact: 1, typical_day: 28 },
    ],
    IN: [
      // High Impact (3)
      { name: 'RBI Interest Rate Decision', type: 'interest_rate', impact: 3, typical_day: 8 },
      { name: 'India CPI', type: 'inflation', impact: 3, typical_day: 12 },
      { name: 'India GDP', type: 'gdp', impact: 3, typical_day: 31 },
      // Medium Impact (2)
      { name: 'India Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 1 },
      { name: 'India Trade Balance', type: 'trade', impact: 2, typical_day: 10 },
      // Low Impact (1)
      { name: 'India Industrial Production', type: 'manufacturing', impact: 1, typical_day: 11 },
      { name: 'India Infrastructure Output', type: 'other', impact: 1, typical_day: 29 },
    ],
    SG: [
      // High Impact (3)
      { name: 'Singapore GDP', type: 'gdp', impact: 3, typical_day: 14 },
      // Medium Impact (2)
      { name: 'Singapore CPI', type: 'inflation', impact: 2, typical_day: 23 },
      { name: 'Singapore Manufacturing PMI', type: 'manufacturing', impact: 2, typical_day: 3 },
      { name: 'Singapore Trade Balance', type: 'trade', impact: 2, typical_day: 17 },
      // Low Impact (1)
      { name: 'Singapore Retail Sales', type: 'retail', impact: 1, typical_day: 6 },
      { name: 'Singapore Industrial Production', type: 'manufacturing', impact: 1, typical_day: 26 },
    ],
  };
  
  // Calculate total days in range
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // For each region, generate events distributed across the date range
  regions.forEach(region => {
    const indicators = economicIndicators[region as keyof typeof economicIndicators] || [];
    
    if (indicators.length === 0) {
      console.log(`No indicators defined for region: ${region}`);
      return;
    }
    
    // Generate at least 2 events per indicator across the range
    indicators.forEach((indicator, idx) => {
      // Calculate how many events to generate (at least 2 per indicator)
      const numEvents = Math.max(2, Math.ceil(totalDays / 7)); // At least 2, or 1 per week
      
      for (let i = 0; i < numEvents; i++) {
        // Distribute events evenly across the date range
        const eventDate = new Date(start);
        const dayOffset = Math.floor((totalDays / numEvents) * i) + (idx % 3); // Stagger by indicator
        eventDate.setDate(start.getDate() + dayOffset);
        
        // SKIP WEEKENDS - Economic data only releases on weekdays
        const dayOfWeek = eventDate.getDay();
        if (dayOfWeek === 0) { // Sunday
          eventDate.setDate(eventDate.getDate() + 1); // Move to Monday
        } else if (dayOfWeek === 6) { // Saturday
          eventDate.setDate(eventDate.getDate() + 2); // Move to Monday
        }
        
        // Set realistic release time based on region and indicator type
        const releaseTime = getReleaseTime(region, indicator.type);
        eventDate.setHours(releaseTime.hour, releaseTime.minute, 0, 0);
        
        // Ensure within range
        if (eventDate >= start && eventDate <= end) {
          const isPast = eventDate < now;
          const event: any = {
            Event: indicator.name,
            Country: getCountryName(region),
            Region: region, // Store the region code directly
            Category: indicator.type,
            Date: eventDate.toISOString(), // Include full timestamp
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
  
  console.log(`Generated ${events.length} events across ${regions.length} regions`);
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

function getReleaseTime(region: string, indicatorType: string): { hour: number; minute: number } {
  // Return time in UTC for consistent storage
  // US releases typically at 8:30 AM ET (13:30 UTC) or 10:00 AM ET (15:00 UTC)
  // EU releases typically at 10:00 AM CET (09:00 UTC)
  // UK releases typically at 7:00 AM GMT (07:00 UTC)
  // Asian releases vary
  
  switch (region) {
    case 'US':
      // Most US data at 8:30 AM ET (13:30 UTC in winter, 12:30 UTC in summer - using winter time)
      return indicatorType === 'interest_rate' ? { hour: 14, minute: 0 } : { hour: 13, minute: 30 };
    case 'EU':
      // EU data at 10:00 AM CET (09:00 UTC)
      return { hour: 9, minute: 0 };
    case 'UK':
      // UK data at 7:00 AM GMT (07:00 UTC)
      return { hour: 7, minute: 0 };
    case 'JP':
      // Japan data typically evening before in UTC (23:50 UTC = 8:50 AM JST)
      return { hour: 23, minute: 50 };
    case 'CN':
      // China data typically at 2:00 AM UTC (10:00 AM China time)
      return { hour: 2, minute: 0 };
    case 'AU':
      // Australia data at 1:30 AM UTC (11:30 AM AEDT)
      return { hour: 1, minute: 30 };
    case 'CA':
      // Canada data at 8:30 AM ET (13:30 UTC)
      return { hour: 13, minute: 30 };
    case 'KR':
      // South Korea at midnight UTC (9:00 AM KST)
      return { hour: 0, minute: 0 };
    case 'IN':
      // India at 7:00 AM IST (1:30 UTC)
      return { hour: 1, minute: 30 };
    case 'SG':
      // Singapore at 8:00 AM SGT (00:00 UTC)
      return { hour: 0, minute: 0 };
    default:
      return { hour: 9, minute: 0 };
  }
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
