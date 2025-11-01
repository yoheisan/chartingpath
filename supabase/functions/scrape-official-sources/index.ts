import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapedEvent {
  event_name: string;
  country_code: string;
  region: string;
  indicator_type: string;
  impact_level: string;
  scheduled_time: string;
  actual_value?: string;
  forecast_value?: string;
  previous_value?: string;
  released: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Starting official source scraping...");
    
    // Race multiple scrapers - fastest wins
    const scrapingPromises = [
      scrapeUSBLS(),
      scrapeUSFederal(),
      scrapeEUEurostat(),
      scrapeEUECB(),
      scrapeUKONS(),
      scrapeUKBOE(),
      scrapeJapanMOF(),
      scrapeJapanBOJ(),
    ];
    
    const results = await Promise.allSettled(scrapingPromises);
    
    // Collect all successfully scraped events
    const allEvents: ScrapedEvent[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        console.log(`Scraper ${index} returned ${result.value.length} events`);
        allEvents.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`Scraper ${index} failed:`, result.reason);
      }
    });
    
    console.log(`Total events scraped: ${allEvents.length}`);
    
    // Upsert events to database (update if exists, insert if new)
    if (allEvents.length > 0) {
      const { error: upsertError } = await supabase
        .from("economic_events")
        .upsert(allEvents, {
          onConflict: 'event_name,scheduled_time',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error("Error upserting events:", upsertError);
      } else {
        console.log(`Successfully upserted ${allEvents.length} events`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        events_scraped: allEvents.length,
        sources_checked: scrapingPromises.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in scrape-official-sources:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// US Bureau of Labor Statistics
async function scrapeUSBLS(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping US BLS...");
    const response = await fetch("https://www.bls.gov/schedule/news_release/empsit.htm", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`BLS returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse employment situation releases
    // Look for "Employment Situation for [Month]"
    const releasePattern = /Employment Situation for (\w+ \d{4})/gi;
    const datePattern = /(\w+ \d{1,2}, \d{4})/gi;
    
    let match;
    while ((match = releasePattern.exec(html)) !== null) {
      const monthYear = match[1];
      
      // Try to find the release date near this match
      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(html.length, match.index + 200);
      const context = html.substring(contextStart, contextEnd);
      
      const dateMatch = datePattern.exec(context);
      if (dateMatch) {
        const releaseDate = new Date(dateMatch[1]);
        releaseDate.setHours(8, 30, 0, 0); // 8:30 AM ET
        
        events.push({
          event_name: `US Non-Farm Payrolls (${monthYear})`,
          country_code: "United States",
          region: "US",
          indicator_type: "employment",
          impact_level: "high",
          scheduled_time: releaseDate.toISOString(),
          released: releaseDate < new Date(),
        });
      }
    }
    
    console.log(`BLS: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping BLS:", error);
    return [];
  }
}

// US Federal Reserve
async function scrapeUSFederal(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping US Federal Reserve...");
    const response = await fetch("https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Fed returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse FOMC meeting dates
    // Look for meeting dates in the calendar
    const meetingPattern = /(\w+ \d{1,2}-\d{1,2}, \d{4})/gi;
    
    let match;
    while ((match = meetingPattern.exec(html)) !== null) {
      const dateRange = match[1];
      // Extract the end date (when decision is announced)
      const endDateMatch = dateRange.match(/(\d{1,2}), (\d{4})$/);
      
      if (endDateMatch) {
        const month = dateRange.match(/^(\w+)/)?.[1];
        const day = endDateMatch[1];
        const year = endDateMatch[2];
        
        const releaseDate = new Date(`${month} ${day}, ${year}`);
        releaseDate.setHours(14, 0, 0, 0); // 2:00 PM ET
        
        // Only include future meetings
        if (releaseDate > new Date()) {
          events.push({
            event_name: "FOMC Interest Rate Decision",
            country_code: "United States",
            region: "US",
            indicator_type: "interest_rate",
            impact_level: "high",
            scheduled_time: releaseDate.toISOString(),
            released: false,
          });
        }
      }
    }
    
    console.log(`Federal Reserve: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping Federal Reserve:", error);
    return [];
  }
}

// EU Eurostat
async function scrapeEUEurostat(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping EU Eurostat...");
    // Eurostat has a release calendar API
    const response = await fetch("https://ec.europa.eu/eurostat/api/dissemination/calendar", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Eurostat returned ${response.status}`);
    }
    
    const data = await response.json();
    const events: ScrapedEvent[] = [];
    
    // Parse Eurostat calendar format
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.releaseDate) {
          const releaseDate = new Date(item.releaseDate);
          releaseDate.setHours(10, 0, 0, 0); // 10:00 AM CET
          
          // Only include future or very recent releases
          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          if (releaseDate > sevenDaysAgo) {
            let indicatorType = "other";
            let impactLevel = "medium";
            
            if (item.title.toLowerCase().includes("cpi") || item.title.toLowerCase().includes("inflation")) {
              indicatorType = "inflation";
              impactLevel = "high";
            } else if (item.title.toLowerCase().includes("gdp")) {
              indicatorType = "gdp";
              impactLevel = "high";
            } else if (item.title.toLowerCase().includes("employment") || item.title.toLowerCase().includes("unemployment")) {
              indicatorType = "employment";
              impactLevel = "high";
            }
            
            events.push({
              event_name: item.title || "Eurozone Economic Release",
              country_code: "European Union",
              region: "EU",
              indicator_type: indicatorType,
              impact_level: impactLevel,
              scheduled_time: releaseDate.toISOString(),
              released: releaseDate < now,
            });
          }
        }
      }
    }
    
    console.log(`Eurostat: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping Eurostat:", error);
    return [];
  }
}

// EU ECB
async function scrapeEUECB(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping EU ECB...");
    const response = await fetch("https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ECB returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse ECB meeting calendar
    // Look for Governing Council meeting dates
    const meetingPattern = /(\d{1,2} \w+ \d{4})/gi;
    
    let match;
    while ((match = meetingPattern.exec(html)) !== null) {
      const dateStr = match[1];
      const releaseDate = new Date(dateStr);
      releaseDate.setHours(13, 45, 0, 0); // 1:45 PM CET
      
      // Only include future meetings
      if (releaseDate > new Date()) {
        events.push({
          event_name: "ECB Interest Rate Decision",
          country_code: "European Union",
          region: "EU",
          indicator_type: "interest_rate",
          impact_level: "high",
          scheduled_time: releaseDate.toISOString(),
          released: false,
        });
      }
    }
    
    console.log(`ECB: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping ECB:", error);
    return [];
  }
}

// UK ONS
async function scrapeUKONS(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping UK ONS...");
    const response = await fetch("https://www.ons.gov.uk/releasecalendar", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ONS returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse ONS release calendar
    // Look for key indicators
    const patterns = [
      { pattern: /CPI[\s\w]*(\d{1,2} \w+ \d{4})/gi, name: "UK CPI", type: "inflation", impact: "high" },
      { pattern: /GDP[\s\w]*(\d{1,2} \w+ \d{4})/gi, name: "UK GDP", type: "gdp", impact: "high" },
      { pattern: /Employment[\s\w]*(\d{1,2} \w+ \d{4})/gi, name: "UK Employment Change", type: "employment", impact: "medium" },
    ];
    
    for (const { pattern, name, type, impact } of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const dateStr = match[1];
        const releaseDate = new Date(dateStr);
        releaseDate.setHours(7, 0, 0, 0); // 7:00 AM GMT
        
        const now = new Date();
        const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        if (releaseDate > now && releaseDate < twoWeeksAhead) {
          events.push({
            event_name: name,
            country_code: "United Kingdom",
            region: "UK",
            indicator_type: type,
            impact_level: impact,
            scheduled_time: releaseDate.toISOString(),
            released: false,
          });
        }
      }
    }
    
    console.log(`ONS: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping ONS:", error);
    return [];
  }
}

// UK Bank of England
async function scrapeUKBOE(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping UK Bank of England...");
    const response = await fetch("https://www.bankofengland.co.uk/monetary-policy/monetary-policy-committee", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`BOE returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse MPC meeting dates
    const meetingPattern = /(\d{1,2} \w+ \d{4})/gi;
    
    let match;
    while ((match = meetingPattern.exec(html)) !== null) {
      const dateStr = match[1];
      const releaseDate = new Date(dateStr);
      releaseDate.setHours(12, 0, 0, 0); // 12:00 PM GMT
      
      // Only include future meetings
      if (releaseDate > new Date()) {
        events.push({
          event_name: "Bank of England Rate Decision",
          country_code: "United Kingdom",
          region: "UK",
          indicator_type: "interest_rate",
          impact_level: "high",
          scheduled_time: releaseDate.toISOString(),
          released: false,
        });
      }
    }
    
    console.log(`BOE: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping BOE:", error);
    return [];
  }
}

// Japan Ministry of Finance
async function scrapeJapanMOF(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping Japan MOF...");
    // MOF publishes trade balance data
    const response = await fetch("https://www.mof.go.jp/english/policy/international_policy/reference/balance_of_payments/index.htm", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`MOF returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse trade balance release dates
    // Typically released around 8:50 AM JST on the 8th of each month
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const releaseDate = new Date(now.getFullYear(), now.getMonth() + i, 8);
      releaseDate.setHours(23, 50, 0, 0); // 8:50 AM JST = 11:50 PM UTC (previous day)
      
      if (releaseDate > now) {
        events.push({
          event_name: "Japan Trade Balance",
          country_code: "Japan",
          region: "JP",
          indicator_type: "trade",
          impact_level: "medium",
          scheduled_time: releaseDate.toISOString(),
          released: false,
        });
      }
    }
    
    console.log(`MOF: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping MOF:", error);
    return [];
  }
}

// Japan Bank of Japan
async function scrapeJapanBOJ(): Promise<ScrapedEvent[]> {
  try {
    console.log("Scraping Japan BOJ...");
    const response = await fetch("https://www.boj.or.jp/en/mopo/mpmsche_minu/index.htm", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`BOJ returned ${response.status}`);
    }
    
    const html = await response.text();
    const events: ScrapedEvent[] = [];
    
    // Parse BOJ meeting schedule
    const meetingPattern = /(\w+ \d{1,2}, \d{4})/gi;
    
    let match;
    while ((match = meetingPattern.exec(html)) !== null) {
      const dateStr = match[1];
      const releaseDate = new Date(dateStr);
      releaseDate.setHours(3, 0, 0, 0); // Around noon JST = 3:00 AM UTC
      
      // Only include future meetings
      if (releaseDate > new Date()) {
        events.push({
          event_name: "BoJ Interest Rate Decision",
          country_code: "Japan",
          region: "JP",
          indicator_type: "interest_rate",
          impact_level: "high",
          scheduled_time: releaseDate.toISOString(),
          released: false,
        });
      }
    }
    
    console.log(`BOJ: Found ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error("Error scraping BOJ:", error);
    return [];
  }
}
