import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timezone, markets, timeSpan, tone, forceGenerate } = await req.json();
    
    console.log("Fetching market report:", { timezone, timeSpan, forceGenerate });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user ID and IP for rate limiting
    const authHeader = req.headers.get("authorization");
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id;
    }
    
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";

    // Check rate limit (30 minutes between requests per user/IP)
    if (forceGenerate && userId) {
      const { data: rateLimitCheck } = await supabaseClient
        .rpc("check_rate_limit", {
          p_user_id: userId,
          p_ip_address: clientIp,
          p_timezone: timezone
        });

      if (!rateLimitCheck) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait 30 minutes between report generations.",
            cached: false
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Try to get cached report (valid for 30 minutes)
    if (!forceGenerate) {
      const { data: cachedReport } = await supabaseClient
        .from("cached_market_reports")
        .select("*")
        .eq("timezone", timezone)
        .eq("time_span", timeSpan)
        .gte("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (cachedReport) {
        console.log("Returning cached report");
        return new Response(
          JSON.stringify({ 
            report: cachedReport.report,
            generated_at: cachedReport.generated_at,
            cached: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Generate new report using OpenAI
    console.log("Generating new report using OpenAI...");
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY is not configured");
    }

    // Fetch real-time market data
    console.log("Fetching real-time market data...");
    
    const marketData: any = {
      timestamp: new Date().toISOString(),
      timezone: timezone,
    };

    // Fetch stock market data
    if (markets.includes("stocks")) {
      const stockSymbols = ["SPY", "QQQ", "DIA", "^GSPC", "^IXIC", "^DJI"];
      const stockPromises = stockSymbols.map(async symbol => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await response.json();
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching stock data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      marketData.stocks = await Promise.all(stockPromises);
      
      // Fetch market news from Finnhub
      try {
        const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
        const newsData = await newsResponse.json();
        marketData.news = newsData;
      } catch (error) {
        console.error('Error fetching Finnhub news:', error);
        marketData.news = [];
      }

      // Fetch geopolitical news from NewsAPI
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const fromDate = yesterday.toISOString().split('T')[0];

        const getRegionKeywords = (tz: string): string => {
          if (tz.startsWith('America/')) {
            return '(United States OR US OR Federal Reserve OR Fed OR Congress OR White House OR Trump OR Biden OR Washington)';
          } else if (tz.startsWith('Europe/')) {
            return '(European Union OR EU OR ECB OR Brexit OR UK OR Germany OR France OR Brussels)';
          } else if (tz.startsWith('Asia/')) {
            if (tz.includes('Tokyo')) return '(Japan OR BOJ OR Tokyo OR yen)';
            if (tz.includes('Shanghai') || tz.includes('Hong_Kong')) return '(China OR PBOC OR Beijing OR yuan OR Hong Kong)';
            if (tz.includes('Singapore')) return '(Singapore OR Southeast Asia OR ASEAN)';
            return '(Asia OR China OR Japan OR India)';
          } else if (tz.startsWith('Australia/')) {
            return '(Australia OR RBA OR Sydney OR AUD)';
          }
          return '(G7 OR G20 OR global)';
        };

        const regionKeywords = getRegionKeywords(timezone);
        const newsApiResponse = await fetch(
          `https://newsapi.org/v2/everything?` +
          `q=${regionKeywords} AND (government OR political OR geopolitical OR trade OR sanctions OR election OR policy OR central bank) AND (market OR economy OR financial OR stocks OR bonds)&` +
          `from=${fromDate}&` +
          `sortBy=relevancy&` +
          `language=en&` +
          `pageSize=15&` +
          `apiKey=${NEWS_API_KEY}`
        );
        const geopoliticalNews = await newsApiResponse.json();
        
        if (geopoliticalNews.status === 'ok' && geopoliticalNews.articles) {
          marketData.geopoliticalNews = geopoliticalNews.articles;
        } else {
          marketData.geopoliticalNews = [];
        }
      } catch (error) {
        console.error('Error fetching geopolitical news:', error);
        marketData.geopoliticalNews = [];
      }
    }

    // Fetch forex data
    if (markets.includes("forex")) {
      const forexPairs = [
        { symbol: "EURUSD=X", name: "EUR/USD" },
        { symbol: "GBPUSD=X", name: "GBP/USD" },
        { symbol: "USDJPY=X", name: "USD/JPY" },
        { symbol: "AUDUSD=X", name: "AUD/USD" }
      ];
      const forexPromises = forexPairs.map(async ({ symbol, name }) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`);
          const data = await response.json();
          
          const quote = data?.chart?.result?.[0];
          const meta = quote?.meta;
          const current = meta?.regularMarketPrice || 0;
          const previous = meta?.previousClose || meta?.chartPreviousClose || current;
          
          return { 
            symbol: name, 
            c: current, 
            pc: previous,
            error: !current 
          };
        } catch (error) {
          console.error(`Error fetching forex data for ${name}:`, error);
          return { symbol: name, c: 0, pc: 0, error: true };
        }
      });
      marketData.forex = await Promise.all(forexPromises);
    }

    // Fetch crypto data
    if (markets.includes("crypto")) {
      const cryptoSymbols = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"];
      const cryptoPromises = cryptoSymbols.map(async symbol => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await response.json();
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching crypto data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      marketData.crypto = await Promise.all(cryptoPromises);
    }

    // Fetch commodities data
    if (markets.includes("commodities")) {
      const commodities = [
        { symbol: "GC=F", name: "Gold (XAU/USD)" },
        { symbol: "SI=F", name: "Silver (XAG/USD)" },
        { symbol: "CL=F", name: "WTI Crude" },
        { symbol: "BZ=F", name: "Brent Crude" }
      ];
      const commodityPromises = commodities.map(async ({ symbol, name }) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`);
          const data = await response.json();
          
          const quote = data?.chart?.result?.[0];
          const meta = quote?.meta;
          const current = meta?.regularMarketPrice || 0;
          const previous = meta?.previousClose || meta?.chartPreviousClose || current;
          
          return { 
            symbol: name, 
            c: current, 
            pc: previous,
            error: !current 
          };
        } catch (error) {
          console.error(`Error fetching commodity data for ${name}:`, error);
          return { symbol: name, c: 0, pc: 0, error: true };
        }
      });
      marketData.commodities = await Promise.all(commodityPromises);
    }

    console.log("Market data fetched successfully");

    // Step 1: Summarize each news article using GPT-4o-mini
    console.log("Summarizing news articles with GPT-4o-mini...");
    const allNewsArticles = [
      ...(marketData.news || []).slice(0, 5).map((article: any) => ({
        headline: article.headline,
        summary: article.summary,
        source: article.source
      })),
      ...(marketData.geopoliticalNews || []).slice(0, 5).map((article: any) => ({
        headline: article.title,
        summary: article.description,
        source: article.source?.name || 'Unknown'
      }))
    ];

    const newsSummaries = await Promise.all(
      allNewsArticles.map(async (article) => {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a financial analyst. Summarize the following news article in 2-3 sentences, focusing on market impact and key facts.' 
                },
                { 
                  role: 'user', 
                  content: `Headline: ${article.headline}\nSummary: ${article.summary || 'No summary available'}\nSource: ${article.source}` 
                }
              ],
              max_tokens: 150,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            console.error(`OpenAI error for article "${article.headline}":`, response.status);
            return `${article.headline} (${article.source})`;
          }

          const data = await response.json();
          return data.choices[0].message.content;
        } catch (error) {
          console.error(`Error summarizing article "${article.headline}":`, error);
          return `${article.headline} (${article.source})`;
        }
      })
    );

    console.log("News summaries generated successfully");

    // Determine session context
    const getSessionContext = (tz: string) => {
      if (tz.includes('Asia') || tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore')) {
        return {
          region: 'Asia',
          usSession: 'overnight US session',
          europeSession: 'European session',
          localSession: 'Asian session'
        };
      } else if (tz.includes('Europe') || tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin')) {
        return {
          region: 'Europe',
          usSession: 'overnight US session',
          asiaSession: 'earlier Asian session',
          localSession: 'European session'
        };
      } else if (tz.includes('America') || tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles')) {
        return {
          region: 'Americas',
          asiaSession: 'overnight Asian session',
          europeSession: 'earlier European session',
          localSession: 'US session'
        };
      } else {
        return {
          region: 'Global',
          usSession: 'US session',
          europeSession: 'European session',
          asiaSession: 'Asian session',
          localSession: 'current session'
        };
      }
    };

    const sessionContext = getSessionContext(timezone);
    const userLocalTime = new Date().toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' });
    const userDayOfWeek = new Date().toLocaleString('en-US', { timeZone: timezone, weekday: 'long' });
    const isWeekend = userDayOfWeek === 'Saturday' || userDayOfWeek === 'Sunday';

    // Format market data for AI prompt
    let marketDataSummary = `**Real-Time Market Data**\n**Your Local Time: ${userLocalTime} (${timezone})**\n\n`;
    
    if (marketData.stocks) {
      marketDataSummary += "**Stock Indices:**\n";
      marketData.stocks.forEach((stock: any) => {
        const changePercent = ((stock.c - stock.pc) / stock.pc * 100).toFixed(2);
        marketDataSummary += `- ${stock.symbol}: $${stock.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
    }
    
    if (marketData.forex) {
      marketDataSummary += "**Forex Pairs:**\n";
      marketData.forex.forEach((pair: any) => {
        const changePercent = ((pair.c - pair.pc) / pair.pc * 100).toFixed(2);
        marketDataSummary += `- ${pair.symbol}: ${pair.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
    }
    
    if (marketData.crypto) {
      marketDataSummary += "**Cryptocurrencies:**\n";
      marketData.crypto.forEach((crypto: any) => {
        const changePercent = ((crypto.c - crypto.pc) / crypto.pc * 100).toFixed(2);
        marketDataSummary += `- ${crypto.symbol}: $${crypto.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
    }
    
    if (marketData.commodities) {
      marketDataSummary += "**Commodities:**\n";
      marketData.commodities.forEach((commodity: any) => {
        const changePercent = ((commodity.c - commodity.pc) / commodity.pc * 100).toFixed(2);
        marketDataSummary += `- ${commodity.symbol}: $${commodity.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
    }

    if (newsSummaries.length > 0) {
      marketDataSummary += "**Summarized News & Developments:**\n";
      newsSummaries.forEach((summary, index) => {
        marketDataSummary += `${index + 1}. ${summary}\n`;
      });
      marketDataSummary += "\n";
    }

    // Build tone instruction
    let toneInstruction = "";
    switch (tone) {
      case "concise":
        toneInstruction = "Keep it brief and bullet-pointed. Maximum 400 words.";
        break;
      case "narrative":
        toneInstruction = "Write in a flowing narrative style with context and stories. Maximum 600 words.";
        break;
      case "professional":
        toneInstruction = "Use professional financial terminology and structured analysis. Maximum 500 words.";
        break;
    }

    const timeSpanText = timeSpan === "previous_day" ? "previous trading day" : "past 5 trading sessions";
    const weekendContext = isWeekend ? "Note: Today is the weekend. Stock, forex, and commodity markets are closed. Focus on Friday's closing action and weekly trends. Cryptocurrency markets continue 24/7." : "";

    const systemPrompt = `You are a senior financial market analyst writing for Financial Times. Your writing style mirrors the FT's precision, authority, and editorial excellence.

CRITICAL: You are analyzing REAL-TIME market data provided below. Use the exact prices, percentages, and news summaries given. Do NOT make up data or use historical examples.

WRITING STYLE REQUIREMENTS:
- Use proper institution names (e.g., "Bank of Japan" or "BoJ", not "Central Bank")
- Write in active voice with clear, declarative sentences
- Use the EXACT numbers and percentages from the provided data
- Use specific numbers, percentages, and basis points (bps) when referencing moves

SESSION CONTEXT:
- The reader is in the ${sessionContext.region} region (timezone: ${timezone})
- Reader's local time: ${userLocalTime}
- Day of week: ${userDayOfWeek}
${weekendContext}

STRUCTURE (use ## for main sections):
1. **Market Overview** - Opening paragraph summarizing sentiment
2. **Equity Markets** - Analyze the exact index data provided
3. **Foreign Exchange** - Currency pair movements
4. **Cryptocurrencies** - Bitcoin/Ethereum performance
5. **Commodities** - Energy, metals data
6. **Market Drivers** - Analyze the news summaries provided
7. **Cross-Asset Correlations** - How different markets influenced each other
8. **Outlook** - What traders should watch for next session

FORMATTING:
${toneInstruction}
- Use **bold** for key terms and numbers
- Keep paragraphs concise (2-4 sentences)
- Write in a professional, authoritative tone`;

    const userPrompt = `Generate a comprehensive market breadth report covering ${markets.join(", ")} for the ${timeSpanText}.

${marketDataSummary}`;

    // Step 2: Generate final report using GPT-5
    console.log("Generating final report with GPT-5...");
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: "OpenAI rate limit exceeded. Please try again in a moment.",
              rateLimited: true
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: "OpenAI credits depleted. Please check your OpenAI account.",
              needsCredits: true
            }),
            {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const generatedReport = data.choices[0].message.content;

      console.log("Report generated successfully with OpenAI");

      // Cache the new report (expires in 30 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      await supabaseClient
        .from("cached_market_reports")
        .insert({
          timezone,
          markets,
          time_span: timeSpan,
          tone,
          report: generatedReport,
          expires_at: expiresAt.toISOString()
        });

      console.log("Report generated and cached");

      return new Response(
        JSON.stringify({ 
          report: generatedReport,
          generated_at: new Date().toISOString(),
          cached: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error generating report with OpenAI:", error);
      throw error;
    }

  } catch (error) {
    console.error("Error in get-cached-market-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to get report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});