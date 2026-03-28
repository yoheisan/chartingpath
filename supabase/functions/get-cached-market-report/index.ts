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
    const { timezone, markets: requestMarkets, timeSpan: requestTimeSpan, tone: requestTone, forceGenerate } = await req.json();
    const timeSpan = requestTimeSpan || 'previous_day';
    const tone = requestTone || 'professional';
    
    // Default to all markets if not specified
    const markets = requestMarkets || ["stocks", "forex", "crypto", "commodities"];
    
    console.log("Fetching market report:", { timezone, markets, timeSpan, forceGenerate });

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

    // Map timezone to region for better cache sharing
    const getRegion = (tz: string): string => {
      if (tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore') || tz.includes('Shanghai')) return 'Asia';
      if (tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) return 'Europe';
      if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Toronto')) return 'Americas';
      if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'Australia';
      return timezone; // fallback to exact timezone
    };
    
    const region = getRegion(timezone);

    // Try to get cached report (valid for 2 hours)
    if (!forceGenerate) {
      const { data: cachedReport } = await supabaseClient
        .from("cached_market_reports")
        .select("*")
        .eq("timezone", region)
        .eq("time_span", timeSpan)
        .gte("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (cachedReport) {
        console.log(`✓ Returning cached report for region: ${region} (requested timezone: ${timezone})`);
        return new Response(
          JSON.stringify({ 
            report: cachedReport.report,
            generated_at: cachedReport.generated_at,
            cached: true,
            region,
            cache_age_minutes: Math.round((Date.now() - new Date(cachedReport.generated_at).getTime()) / 60000)
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Generate new report using OpenAI
    console.log("Generating new report using OpenAI...");
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    if (!NEWS_API_KEY) {
      throw new Error("NEWS_API_KEY is not configured");
    }

    // Helper: fetch EODHD real-time quote (primary source)
    const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
    
    function toEODHDSymbol(symbol: string): string {
      if (symbol.includes('=X')) return `${symbol.replace('=X', '')}.FOREX`;
      if (symbol.includes('=F')) return `${symbol.replace('=F', '')}.COMM`;
      if (symbol.startsWith('^')) return `${symbol.replace('^', '')}.INDX`;
      if (symbol.endsWith('.SS')) return `${symbol.replace('.SS', '')}.SHG`;
      if (symbol.endsWith('.SZ')) return `${symbol.replace('.SZ', '')}.SHE`;
      if (symbol.endsWith('.HK')) return symbol;
      if (symbol.endsWith('.SI')) return `${symbol.replace('.SI', '')}.SG`;
      return `${symbol}.US`;
    }

    const fetchEODHDQuote = async (symbol: string): Promise<{ symbol: string; c: number; pc: number; error: boolean }> => {
      if (!EODHD_API_KEY) return { symbol, c: 0, pc: 0, error: true };
      try {
        const eodhSymbol = toEODHDSymbol(symbol);
        const url = `https://eodhd.com/api/real-time/${eodhSymbol}?api_token=${EODHD_API_KEY}&fmt=json`;
        const response = await fetch(url);
        if (!response.ok) return { symbol, c: 0, pc: 0, error: true };
        const data = await response.json();
        const current = data.close || data.previousClose || 0;
        const previous = data.previousClose || current;
        if (!current || current === 0) return { symbol, c: 0, pc: 0, error: true };
        return { symbol, c: current, pc: previous, error: false };
      } catch {
        return { symbol, c: 0, pc: 0, error: true };
      }
    };

    // Helper: Yahoo fallback quote (last resort only)
    const fetchYahooQuote = async (symbol: string, retries = 3): Promise<{ symbol: string; c: number; pc: number; error: boolean }> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`);
          if (response.status === 429) {
            await response.text();
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          if (!response.ok) {
            await response.text();
            return { symbol, c: 0, pc: 0, error: true };
          }
          const data = await response.json();
          const quote = data?.chart?.result?.[0];
          const meta = quote?.meta;
          const current = meta?.regularMarketPrice || 0;
          const previous = meta?.previousClose || meta?.chartPreviousClose || current;
          if (!current || current === 0) return { symbol, c: 0, pc: 0, error: true };
          return { symbol, c: current, pc: previous, error: false };
        } catch {
          if (attempt < retries) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
      return { symbol, c: 0, pc: 0, error: true };
    };

    // Helper: EODHD-first quote with Yahoo fallback
    const fetchQuote = async (symbol: string): Promise<{ symbol: string; c: number; pc: number; error: boolean }> => {
      const eodhResult = await fetchEODHDQuote(symbol);
      if (!eodhResult.error) return eodhResult;
      return fetchYahooQuote(symbol);
    };

    // Helper: sequential fetches with delay
    const fetchSequential = async (symbols: string[]): Promise<any[]> => {
      const results: any[] = [];
      for (let i = 0; i < symbols.length; i++) {
        const result = await fetchQuote(symbols[i]);
        results.push(result);
        if (i < symbols.length - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      return results;
    };

    // Fetch real-time market data
    console.log("Fetching real-time market data...");
    
    const marketData: any = {
      timestamp: new Date().toISOString(),
      timezone: timezone,
    };

    // Fetch stock market data
    if (markets.includes("stocks")) {
      const getStockSymbols = (tz: string): { yahooSymbols: string[]; finnhubSymbols: string[] } => {
        if (tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore') || tz.includes('Shanghai')) {
          return { yahooSymbols: ["^N225", "^HSI", "000001.SS", "^STI", "^KS11"], finnhubSymbols: [] };
        } else if (tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) {
          return { yahooSymbols: ["^FTSE", "^GDAXI", "^FCHI", "^FTMIB", "^STOXX50E"], finnhubSymbols: [] };
        } else if (tz.includes('Sydney') || tz.includes('Melbourne')) {
          return { yahooSymbols: ["^AXJO", "^AORD"], finnhubSymbols: [] };
        } else {
          return { yahooSymbols: [], finnhubSymbols: ["SPY", "QQQ", "DIA"] };
        }
      };
      
      const stockSymbols = getStockSymbols(timezone);
      
      // Fetch Yahoo symbols sequentially to avoid rate limiting
      const yahooResults = await fetchSequential(stockSymbols.yahooSymbols);
      
      // Fetch Finnhub symbols in parallel (different API, no Yahoo rate limit)
      const finnhubPromises = stockSymbols.finnhubSymbols.map(async symbol => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await response.json();
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching Finnhub stock data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      
      const finnhubResults = await Promise.all(finnhubPromises);
      marketData.stocks = [...yahooResults, ...finnhubResults];
      
      // Fetch market news from Finnhub with region-specific categories
      try {
        // Map timezone to Finnhub news category
        const getNewsCategory = (tz: string): string => {
          if (tz.includes('Tokyo')) return 'japan';
          if (tz.includes('Hong_Kong') || tz.includes('Shanghai')) return 'china';
          if (tz.includes('Singapore')) return 'singapore';
          if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'australia';
          if (tz.includes('London')) return 'uk';
          if (tz.includes('Berlin') || tz.includes('Frankfurt')) return 'germany';
          if (tz.includes('Paris')) return 'france';
          return 'general'; // US/Americas default
        };
        
        const newsCategory = getNewsCategory(timezone);
        const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=${newsCategory}&token=${FINNHUB_API_KEY}`);
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

    // Fetch forex data (EODHD-first with Yahoo fallback)
    if (markets.includes("forex")) {
      const forexSymbols = ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X"];
      const forexNames = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"];
      const forexResults = await fetchSequential(forexSymbols);
      marketData.forex = forexResults.map((r, i) => ({ ...r, symbol: forexNames[i] }));
    }

    // Fetch crypto data (Finnhub, not Yahoo — parallel is fine)
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

    // Fetch commodities data (EODHD-first with Yahoo fallback)
    if (markets.includes("commodities")) {
      const comSymbols = ["GC=F", "SI=F", "CL=F", "BZ=F"];
      const comNames = ["Gold (XAU/USD)", "Silver (XAG/USD)", "WTI Crude", "Brent Crude"];
      const comResults = await fetchSequential(comSymbols);
      marketData.commodities = comResults.map((r, i) => ({ ...r, symbol: comNames[i] }));
    }

    console.log("Market data fetched successfully");

    // CRITICAL: If no valid stock data at all, abort — don't generate a misleading report
    const validStocks = (marketData.stocks || []).filter((s: any) => s.c > 0 && s.pc > 0 && !s.error);
    const validForex = (marketData.forex || []).filter((s: any) => s.c > 0 && s.pc > 0 && !s.error);
    const validCrypto = (marketData.crypto || []).filter((s: any) => s.c > 0 && s.pc > 0 && !s.error);
    
    if (validStocks.length === 0 && validForex.length === 0 && validCrypto.length === 0) {
      console.error("ABORTING: No valid market data from any source. All Yahoo/Finnhub fetches failed.");
      return new Response(
        JSON.stringify({ 
          error: "Market data temporarily unavailable. All data sources returned errors. Please try again in a few minutes.",
          retryable: true
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Valid data: ${validStocks.length} stocks, ${validForex.length} forex, ${validCrypto.length} crypto`);

    // Step 1: Summarize top news articles using GPT-4o-mini (reduced to 6 total for speed)
    console.log("Summarizing news articles with GPT-4o-mini...");
    const allNewsArticles = [
      ...(marketData.news || []).slice(0, 3).map((article: any) => ({
        headline: article.headline,
        summary: article.summary,
        source: article.source
      })),
      ...(marketData.geopoliticalNews || []).slice(0, 3).map((article: any) => ({
        headline: article.title,
        summary: article.description,
        source: article.source?.name || 'Unknown'
      }))
    ];

    const newsSummaries = await Promise.all(
      allNewsArticles.map(async (article) => {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ text: `You are a financial analyst. Summarize the following news article in 2-3 sentences, focusing on market impact and key facts.\n\nHeadline: ${article.headline}\nSummary: ${article.summary || 'No summary available'}\nSource: ${article.source}` }] 
              }],
              generationConfig: { maxOutputTokens: 150 },
            }),
          });

          if (!response.ok) {
            console.error(`Gemini error for article "${article.headline}":`, response.status);
            return `${article.headline} (${article.source})`;
          }

          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || `${article.headline} (${article.source})`;
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

    // Format market data for AI prompt — FILTER OUT zero-value data
    let marketDataSummary = `**Real-Time Market Data**\n**Your Local Time: ${userLocalTime} (${timezone})**\n\n`;
    
    const validEntries = (items: any[]) => items.filter((i: any) => i.c > 0 && i.pc > 0 && !i.error);

    if (marketData.stocks) {
      const valid = validEntries(marketData.stocks);
      if (valid.length > 0) {
        marketDataSummary += "**Stock Indices:**\n";
        valid.forEach((stock: any) => {
          const changePercent = ((stock.c - stock.pc) / stock.pc * 100).toFixed(2);
          marketDataSummary += `- ${stock.symbol}: $${stock.c} (${Number(changePercent) > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";
      } else {
        marketDataSummary += "**Stock Indices:** Data temporarily unavailable\n\n";
      }
    }
    
    if (marketData.forex) {
      const valid = validEntries(marketData.forex);
      if (valid.length > 0) {
        marketDataSummary += "**Forex Pairs:**\n";
        valid.forEach((pair: any) => {
          const changePercent = ((pair.c - pair.pc) / pair.pc * 100).toFixed(2);
          marketDataSummary += `- ${pair.symbol}: ${pair.c} (${Number(changePercent) > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";
      }
    }
    
    if (marketData.crypto) {
      const valid = validEntries(marketData.crypto);
      if (valid.length > 0) {
        marketDataSummary += "**Cryptocurrencies:**\n";
        valid.forEach((crypto: any) => {
          const changePercent = ((crypto.c - crypto.pc) / crypto.pc * 100).toFixed(2);
          marketDataSummary += `- ${crypto.symbol}: $${crypto.c} (${Number(changePercent) > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";
      }
    }
    
    if (marketData.commodities) {
      const valid = validEntries(marketData.commodities);
      if (valid.length > 0) {
        marketDataSummary += "**Commodities:**\n";
        valid.forEach((commodity: any) => {
          const changePercent = ((commodity.c - commodity.pc) / commodity.pc * 100).toFixed(2);
          marketDataSummary += `- ${commodity.symbol}: $${commodity.c} (${Number(changePercent) > 0 ? '+' : ''}${changePercent}%)\n`;
        });
        marketDataSummary += "\n";
      }
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

    // Determine if local markets have closed today based on timezone and time
    const getMarketTiming = (tz: string): { hasClosedToday: boolean; marketName: string; closeTime: string } => {
      const hour = parseInt(new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));
      
      if (tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore') || tz.includes('Shanghai')) {
        // Asian markets close around 15:00-16:00 local time
        return { hasClosedToday: hour >= 16, marketName: 'Asian markets', closeTime: '15:00-16:00' };
      } else if (tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) {
        // European markets close around 17:00-17:30 local time
        return { hasClosedToday: hour >= 18, marketName: 'European markets', closeTime: '17:00-17:30' };
      } else if (tz.includes('Sydney') || tz.includes('Melbourne')) {
        // Australian markets close around 16:00 local time
        return { hasClosedToday: hour >= 17, marketName: 'Australian markets', closeTime: '16:00' };
      } else {
        // US markets close around 16:00 ET
        return { hasClosedToday: hour >= 17, marketName: 'US markets', closeTime: '16:00 ET' };
      }
    };
    
    const marketTiming = getMarketTiming(timezone);
    const isSaturday = userDayOfWeek === 'Saturday';
    const isSunday = userDayOfWeek === 'Sunday';
    
    // Adjust timeSpan text based on market timing and day of week
    let timeSpanText = "";
    let weekendContext = "";
    
    if (isSunday) {
      timeSpanText = "the past week's trading activity (Friday's close)";
      weekendContext = "Note: Today is Sunday. Stock, forex, and commodity markets are closed. Analyze the week's performance from Monday through Friday. Cryptocurrency markets continue 24/7.";
    } else if (isSaturday) {
      timeSpanText = "Friday's close and the week's performance";
      weekendContext = "Note: Today is Saturday. Stock, forex, and commodity markets closed Friday and will reopen Monday. Cryptocurrency markets continue 24/7.";
    } else if (timeSpan === "previous_day") {
      // Weekday - check if markets have closed
      if (marketTiming.hasClosedToday) {
        timeSpanText = `today's ${marketTiming.marketName} trading session (closed at ${marketTiming.closeTime} local time)`;
        weekendContext = `Note: ${marketTiming.marketName} have closed for today. The data reflects today's completed trading session.`;
      } else {
        timeSpanText = `yesterday's ${marketTiming.marketName} close`;
        weekendContext = `Note: ${marketTiming.marketName} have not yet closed for today. The data reflects yesterday's completed trading session.`;
      }
    } else {
      timeSpanText = "the past 5 trading sessions";
    }

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

REGIONAL FOCUS:
- This report is for readers in the ${sessionContext.region} region
- PRIORITIZE local market indices and regional developments
- Reference other regions' markets as context (e.g., "overnight US session", "European close")
- Focus on news and economic data most relevant to the ${sessionContext.region} region

STRUCTURE (use ## for main sections):
1. **Market Overview** - Opening paragraph summarizing sentiment, emphasizing ${sessionContext.region} markets
2. **Equity Markets** - Lead with ${sessionContext.region} indices, then reference other major regions
3. **Foreign Exchange** - Currency pair movements relevant to ${sessionContext.region} region
4. **Cryptocurrencies** - Bitcoin/Ethereum performance
5. **Commodities** - Energy, metals from provided data
6. **Market Drivers** - Focus on ${sessionContext.region} economic data, policy decisions, and regional news
7. **Cross-Asset Correlations** - How different markets influenced each other, with focus on ${sessionContext.region} relationships
8. **Outlook** - What ${sessionContext.region} traders should watch for next session
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

    // Step 2: Check daily cost guardrail before calling GPT-5
    console.log("Checking daily AI cost guardrail...");
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get today's spending from the database
    const { data: usageData } = await supabaseClient
      .from('daily_ai_usage')
      .select('usd_spent')
      .eq('date', today)
      .single();
    
    const currentSpend = usageData?.usd_spent || 0;
    console.log(`Today's AI spending: $${currentSpend}`);
    
    // Estimate cost for this request
    // GPT-5: ~$3/1M input tokens, ~$15/1M output tokens
    // Approximate tokens: characters / 4
    const inputChars = systemPrompt.length + userPrompt.length;
    const maxOutputTokens = 8000;
    const estimatedInputTokens = inputChars / 4;
    const estimatedInputCost = (estimatedInputTokens / 1000000) * 3; // $3 per 1M tokens
    const estimatedOutputCost = (maxOutputTokens / 1000000) * 15; // $15 per 1M tokens
    const estimatedCost = estimatedInputCost + estimatedOutputCost;
    
    console.log(`Estimated cost for this request: $${estimatedCost.toFixed(4)}`);
    console.log(`Total if we proceed: $${(currentSpend + estimatedCost).toFixed(4)}`);
    
    // If adding this cost would exceed $1.00, return latest cached report instead
    if (currentSpend + estimatedCost > 1.0) {
      console.log(`Daily budget exceeded ($${currentSpend.toFixed(4)} + $${estimatedCost.toFixed(4)} > $1.00). Returning latest cached report.`);
      
      // Fetch the most recent cached report (regardless of expiry)
      const { data: latestCached } = await supabaseClient
        .from("cached_market_reports")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();
      
      if (latestCached) {
        return new Response(
          JSON.stringify({ 
            report: latestCached.report,
            generated_at: latestCached.generated_at,
            cached: true,
            budgetExceeded: true,
            message: "Daily AI budget reached. Showing latest available report."
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } else {
        // No cached report available at all
        return new Response(
          JSON.stringify({ 
            error: "Daily AI budget exceeded and no cached reports available. Please try again tomorrow.",
            budgetExceeded: true
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
    // Proceed with Lovable AI (Gemini) generation
    console.log("Generating final report with Lovable AI...");
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { maxOutputTokens: 4000 },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini error:", response.status, errorText);
        throw new Error(`Gemini error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const generatedReport = data.candidates?.[0]?.content?.parts?.[0]?.text;

      console.log("Report generated successfully with Gemini");
      console.log("Report length:", generatedReport?.length || 0);
      
      if (!generatedReport || generatedReport.trim().length === 0) {
        throw new Error("Gemini returned an empty report");
      }

      // Cache the new report (expires in 2 hours)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 120);

      await supabaseClient
        .from("cached_market_reports")
        .insert({
          timezone: region,
          markets,
          time_span: timeSpan,
          tone,
          report: generatedReport,
          expires_at: expiresAt.toISOString()
        });

      console.log(`Report generated and cached for region: ${region}`);

      return new Response(
        JSON.stringify({ 
          report: generatedReport,
          generated_at: new Date().toISOString(),
          cached: false,
          region
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error generating report with Lovable AI:", error);
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