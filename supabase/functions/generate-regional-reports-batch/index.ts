import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Timezone to local market mappings
const LOCAL_MARKETS = {
  'Asia/Tokyo': { indices: ['^N225'], name: 'Nikkei 225', region: 'Asia' },
  'Asia/Shanghai': { indices: ['000001.SS'], name: 'Shanghai Composite', region: 'Asia' },
  'Asia/Hong_Kong': { indices: ['^HSI'], name: 'Hang Seng', region: 'Asia' },
  'Asia/Singapore': { indices: ['^STI'], name: 'Straits Times Index', region: 'Asia' },
  'Australia/Sydney': { indices: ['^AXJO'], name: 'ASX 200', region: 'Asia' },
  'Pacific/Auckland': { indices: ['^NZ50'], name: 'NZX 50', region: 'Asia' },
  'Europe/London': { indices: ['^FTSE'], name: 'FTSE 100', region: 'Europe' },
  'Europe/Paris': { indices: ['^FCHI'], name: 'CAC 40', region: 'Europe' },
  'Europe/Berlin': { indices: ['^GDAXI'], name: 'DAX', region: 'Europe' },
  'America/New_York': { indices: ['^GSPC', '^DJI', '^IXIC'], name: 'US Indices', region: 'Americas' },
  'America/Chicago': { indices: ['ES=F'], name: 'E-mini S&P Futures', region: 'Americas' },
  'America/Los_Angeles': { indices: ['^IXIC'], name: 'Nasdaq (Tech)', region: 'Americas' },
  'America/Toronto': { indices: ['^GSPTSE'], name: 'TSX Composite', region: 'Americas' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { region, timezones, reportType } = await req.json();
    
    console.log(`Batch generating reports for ${region}:`, timezones);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    
    if (!LOVABLE_API_KEY || !FINNHUB_API_KEY) {
      throw new Error("Required API keys not configured");
    }

    // Step 1: Fetch REGIONAL data once (reused for all timezones in region)
    console.log(`Fetching regional data for ${region}...`);
    
    const regionalData: any = {
      timestamp: new Date().toISOString(),
      region: region,
    };

    // Fetch regional stock indices (SPY, QQQ for Americas, etc.)
    const regionalStocks = region === 'Americas' ? ['SPY', 'QQQ', 'DIA'] : 
                          region === 'Europe' ? ['SPY', 'QQQ'] : 
                          ['SPY', 'QQQ']; // Global indices for context
    
    const stockPromises = regionalStocks.map(async symbol => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        return { symbol, ...data };
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return { symbol, c: 0, pc: 0, error: true };
      }
    });
    regionalData.stocks = await Promise.all(stockPromises);

    // Fetch forex data (regional pairs based on region)
    const forexPairs = region === 'Asia' ? 
      [{ symbol: "USDJPY=X", name: "USD/JPY" }, { symbol: "AUDUSD=X", name: "AUD/USD" }] :
      region === 'Europe' ?
      [{ symbol: "EURUSD=X", name: "EUR/USD" }, { symbol: "GBPUSD=X", name: "GBP/USD" }] :
      [{ symbol: "EURUSD=X", name: "EUR/USD" }, { symbol: "USDJPY=X", name: "USD/JPY" }];

    const forexPromises = forexPairs.map(async ({ symbol, name }) => {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`);
        const data = await response.json();
        const quote = data?.chart?.result?.[0];
        const meta = quote?.meta;
        const current = meta?.regularMarketPrice || 0;
        const previous = meta?.previousClose || meta?.chartPreviousClose || current;
        return { symbol: name, c: current, pc: previous, error: !current };
      } catch (error) {
        console.error(`Error fetching ${name}:`, error);
        return { symbol: name, c: 0, pc: 0, error: true };
      }
    });
    regionalData.forex = await Promise.all(forexPromises);

    // Fetch crypto data (same for all regions)
    const cryptoPromises = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"].map(async symbol => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        return { symbol, ...data };
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return { symbol, c: 0, pc: 0, error: true };
      }
    });
    regionalData.crypto = await Promise.all(cryptoPromises);

    // Fetch commodities
    const commodities = [
      { symbol: "GC=F", name: "Gold" },
      { symbol: "CL=F", name: "WTI Crude" }
    ];
    const commodityPromises = commodities.map(async ({ symbol, name }) => {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`);
        const data = await response.json();
        const quote = data?.chart?.result?.[0];
        const meta = quote?.meta;
        const current = meta?.regularMarketPrice || 0;
        const previous = meta?.previousClose || meta?.chartPreviousClose || current;
        return { symbol: name, c: current, pc: previous, error: !current };
      } catch (error) {
        console.error(`Error fetching ${name}:`, error);
        return { symbol: name, c: 0, pc: 0, error: true };
      }
    });
    regionalData.commodities = await Promise.all(commodityPromises);

    // Fetch regional news once
    try {
      const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
      const newsData = await newsResponse.json();
      regionalData.news = newsData.slice(0, 3);
    } catch (error) {
      console.error('Error fetching news:', error);
      regionalData.news = [];
    }

    console.log("Regional data fetched successfully");

    // Step 2: For each timezone, fetch LOCAL market data and generate report
    const reportPromises = timezones.map(async (timezone: string) => {
      try {
        console.log(`Processing ${timezone}...`);
        
        // Fetch local market data
        const localMarket = LOCAL_MARKETS[timezone];
        let localData: any[] = [];
        
        if (localMarket && localMarket.indices.length > 0) {
          const localPromises = localMarket.indices.map(async symbol => {
            // Try multiple data sources with fallback
            
            // 1. Try Yahoo Finance first (free, no auth, works for indices)
            try {
              const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`);
              if (response.ok) {
                const data = await response.json();
                const quote = data?.chart?.result?.[0];
                const meta = quote?.meta;
                const current = meta?.regularMarketPrice || 0;
                const previous = meta?.previousClose || meta?.chartPreviousClose || current;
                if (current > 0) {
                  console.log(`✓ Yahoo: ${symbol} = ${current}`);
                  return { 
                    symbol: symbol,
                    name: localMarket.name,
                    c: current, 
                    pc: previous,
                    error: false 
                  };
                }
              }
            } catch (error) {
              console.log(`✗ Yahoo failed for ${symbol}:`, error.message);
            }

            // 2. Try Finnhub as fallback (for supported symbols)
            if (!symbol.startsWith('^') && !symbol.includes('.')) {
              try {
                const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.c && data.c > 0) {
                    console.log(`✓ Finnhub: ${symbol} = ${data.c}`);
                    return {
                      symbol: symbol,
                      name: localMarket.name,
                      c: data.c,
                      pc: data.pc,
                      error: false
                    };
                  }
                }
              } catch (error) {
                console.log(`✗ Finnhub failed for ${symbol}:`, error.message);
              }
            }

            console.error(`✗✗ ALL sources failed for ${symbol}`);
            return { symbol, name: localMarket.name, c: 0, pc: 0, error: true };
          });
          localData = await Promise.all(localPromises);
          
          // Validate we got at least some data
          const validData = localData.filter(d => !d.error);
          if (validData.length === 0) {
            console.warn(`⚠️  No valid local market data for ${timezone}`);
          }
        }

        // Combine regional + local data
        const combinedData = {
          ...regionalData,
          localMarkets: localData,
          timezone: timezone,
          localMarketName: localMarket?.name || 'N/A'
        };

        // Generate AI prompt with both regional and local context
        const userLocalTime = new Date().toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' });
        const userDayOfWeek = new Date().toLocaleString('en-US', { timeZone: timezone, weekday: 'long' });
        const isWeekend = userDayOfWeek === 'Saturday' || userDayOfWeek === 'Sunday';

        let marketDataSummary = `**Market Report - ${userLocalTime}**\n\n`;
        
        // Local markets first (most relevant to user)
        if (localData.length > 0) {
          marketDataSummary += `**Local Market (${localMarket.name}):**\n`;
          localData.forEach((market: any) => {
            const changePercent = ((market.c - market.pc) / market.pc * 100).toFixed(2);
            marketDataSummary += `- ${market.symbol}: ${market.c.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
          });
          marketDataSummary += "\n";
        }

        // Regional stocks
        marketDataSummary += "**Global/Regional Indices:**\n";
        regionalData.stocks.forEach((stock: any) => {
          const changePercent = ((stock.c - stock.pc) / stock.pc * 100).toFixed(2);
          marketDataSummary += `- ${stock.symbol}: $${stock.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";

        // Forex
        marketDataSummary += "**Forex:**\n";
        regionalData.forex.forEach((pair: any) => {
          const changePercent = ((pair.c - pair.pc) / pair.pc * 100).toFixed(2);
          marketDataSummary += `- ${pair.symbol}: ${pair.c.toFixed(4)} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";

        // Crypto
        marketDataSummary += "**Crypto:**\n";
        regionalData.crypto.forEach((crypto: any) => {
          const changePercent = ((crypto.c - crypto.pc) / crypto.pc * 100).toFixed(2);
          marketDataSummary += `- ${crypto.symbol}: $${crypto.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";

        // Commodities
        marketDataSummary += "**Commodities:**\n";
        regionalData.commodities.forEach((commodity: any) => {
          const changePercent = ((commodity.c - commodity.pc) / commodity.pc * 100).toFixed(2);
          marketDataSummary += `- ${commodity.symbol}: $${commodity.c.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";

        if (regionalData.news && regionalData.news.length > 0) {
          marketDataSummary += "**Key News:**\n";
          regionalData.news.forEach((article: any) => {
            marketDataSummary += `- ${article.headline}\n`;
          });
        }

        const weekendContext = isWeekend ? "Note: Markets are closed for the weekend. Focus on Friday's closing action." : "";
        
        const systemPrompt = `You are a financial analyst providing concise market reports for ${timezone.split('/')[1] || timezone} traders.

CRITICAL: Use ONLY the real-time data provided. Do NOT invent data.

Context:
- Report for: ${timezone} (${localMarket?.name || region})
- Local time: ${userLocalTime}
- Report type: ${reportType}
${weekendContext}

Write a professional market report with these sections:
1. Local Market Overview (lead with ${localMarket?.name || 'local market'})
2. Regional/Global Context (broader market movements)
3. Key Drivers (reference provided news)
4. Outlook (what to watch next session)

Keep it under 400 words. Use **bold** for key numbers and terms. Focus on relevance to ${timezone.split('/')[1]} traders.`;

        const userPrompt = `Analyze this market data and write a concise report:\n\n${marketDataSummary}`;

        // Call Lovable AI
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI error for ${timezone}:`, aiResponse.status, errorText);
          throw new Error(`AI request failed: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const report = aiData.choices[0].message.content;

        // Validate report quality
        const hasValidData = report.length > 300 && 
                            !report.toLowerCase().includes("unavailable") && 
                            !report.toLowerCase().includes("limited breadth") &&
                            !report.toLowerCase().includes("data not available");
        
        if (!hasValidData) {
          console.warn(`⚠️  Report for ${timezone} may have data issues - length: ${report.length}`);
        }

        console.log(`✓ Generated report for ${timezone} (${report.length} chars, valid: ${hasValidData})`);

        return {
          timezone,
          report,
          success: true,
          hasValidData,
          reportLength: report.length
        };

      } catch (error) {
        console.error(`Error generating report for ${timezone}:`, error);
        return {
          timezone,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for all reports to complete
    const reports = await Promise.all(reportPromises);
    
    // Store all reports in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    for (const report of reports) {
      if (report.success && report.hasValidData) {
        const { error } = await supabase
          .from("cached_market_reports")
          .upsert({
            timezone: report.timezone,
            region: region,
            report: report.report,
            markets: ["stocks", "forex", "crypto", "commodities"],
            time_span: "previous_day",
            tone: "professional",
            generated_at: new Date().toISOString(),
            expires_at: expiresAt
          }, {
            onConflict: "timezone,time_span"
          });
        
        if (error) {
          console.error(`Error caching report for ${report.timezone}:`, error);
        } else {
          console.log(`✅ Cached report for ${report.timezone}`);
        }
      } else if (report.success && !report.hasValidData) {
        console.warn(`⚠️  Skipped caching ${report.timezone} - data quality issues`);
      }
    }

    const successCount = reports.filter(r => r.success).length;
    const validCount = reports.filter(r => r.success && r.hasValidData).length;
    console.log(`\n📊 Batch complete: ${validCount}/${successCount} valid reports (${reports.length} total)`);

    return new Response(
      JSON.stringify({
        success: true,
        region,
        generated: successCount,
        valid: validCount,
        total: reports.length,
        reports: reports.map(r => ({ 
          timezone: r.timezone, 
          success: r.success, 
          hasValidData: r.hasValidData,
          reportLength: r.reportLength 
        }))
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Batch generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
