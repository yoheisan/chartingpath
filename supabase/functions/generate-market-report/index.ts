import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timezone, markets, timeSpan, tone } = await req.json();
    
    console.log("Generating market report:", { timezone, markets, timeSpan, tone });

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

    // Fetch real-time market data from Finnhub
    console.log("Fetching real-time market data from Finnhub...");
    
    const marketData: any = {
      timestamp: new Date().toISOString(),
      timezone: timezone,
    };

    // Fetch stock market data
    if (markets.includes("stocks")) {
      // Select region-appropriate stock indices
      const getStockSymbols = (tz: string): string[] => {
        if (tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore') || tz.includes('Shanghai')) {
          return ["^N225", "^HSI", "000001.SS", "^STI", "^KS11"]; // Nikkei, Hang Seng, Shanghai, Singapore, KOSPI
        } else if (tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) {
          return ["^FTSE", "^GDAXI", "^FCHI", "^FTMIB", "^STOXX50E"]; // FTSE 100, DAX, CAC 40, FTSE MIB, Euro Stoxx 50
        } else if (tz.includes('Sydney') || tz.includes('Melbourne')) {
          return ["^AXJO", "^AORD"]; // ASX 200, All Ordinaries
        } else {
          return ["SPY", "QQQ", "DIA", "^GSPC", "^IXIC", "^DJI"]; // US markets (default)
        }
      };
      
      const stockSymbols = getStockSymbols(timezone);
      const stockPromises = stockSymbols.map(async symbol => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await response.json();
          console.log(`Stock data for ${symbol}:`, JSON.stringify(data));
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching stock data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      marketData.stocks = await Promise.all(stockPromises);
      
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
        console.log(`Finnhub ${newsCategory} news data:`, JSON.stringify(newsData).substring(0, 200));
        marketData.news = newsData;
      } catch (error) {
        console.error('Error fetching Finnhub news:', error);
        marketData.news = [];
      }

      // Fetch geopolitical news from NewsAPI with region-specific focus
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const fromDate = yesterday.toISOString().split('T')[0];

        // Determine region from timezone
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
          return '(G7 OR G20 OR global)'; // Default fallback
        };

        const regionKeywords = getRegionKeywords(timezone);

        // Fetch region-specific news
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
        console.log(`NewsAPI region-specific (${timezone}) data:`, JSON.stringify(geopoliticalNews).substring(0, 200));
        
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

    // Fetch forex data using Yahoo Finance (free, no auth required)
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
          console.log(`Forex data for ${name}:`, JSON.stringify(data).substring(0, 300));
          
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
          console.log(`Crypto data for ${symbol}:`, JSON.stringify(data));
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching crypto data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      marketData.crypto = await Promise.all(cryptoPromises);
    }

    // Fetch commodities data using Yahoo Finance (free, no auth required)
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
          console.log(`Commodity data for ${name}:`, JSON.stringify(data).substring(0, 300));
          
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

    // Determine session context based on timezone
    const getSessionContext = (tz: string) => {
      const hour = new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
      const hourNum = parseInt(hour);
      
      // Determine which region the user is in
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
    
    // Determine day of week in user's timezone
    const userDayOfWeek = new Date().toLocaleString('en-US', { timeZone: timezone, weekday: 'long' });
    const isSaturday = userDayOfWeek === 'Saturday';
    const isSunday = userDayOfWeek === 'Sunday';
    const isWeekend = isSaturday || isSunday;

    // Format market data for AI prompt
    let marketDataSummary = `**Real-Time Market Data**\n**Your Local Time: ${userLocalTime} (${timezone})**\n\n`;
    
    if (marketData.stocks) {
      marketDataSummary += "**Stock Indices:**\n";
      marketData.stocks.forEach((stock: any) => {
        const changePercent = ((stock.c - stock.pc) / stock.pc * 100).toFixed(2);
        marketDataSummary += `- ${stock.symbol}: $${stock.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
      
      if (marketData.news && marketData.news.length > 0) {
        marketDataSummary += "**Top Market News:**\n";
        marketData.news.slice(0, 5).forEach((article: any) => {
          marketDataSummary += `- ${article.headline} (${article.source})\n`;
        });
        marketDataSummary += "\n";
      }

      if (marketData.geopoliticalNews && marketData.geopoliticalNews.length > 0) {
        marketDataSummary += "**Geopolitical & Policy Developments:**\n";
        marketData.geopoliticalNews.slice(0, 5).forEach((article: any) => {
          const sourceName = article.source?.name || 'Unknown';
          marketDataSummary += `- ${article.title} (${sourceName})\n`;
        });
        marketDataSummary += "\n";
      }
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

    // Build the prompt based on user preferences
    const marketList = markets.join(", ");
    
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
    
    // Adjust timeSpan text based on market timing and day of week
    let timeSpanText = "";
    let weekendContext = "";
    
    if (isSunday) {
      timeSpanText = "the past week's trading activity (Friday's close)";
      weekendContext = "Note: Today is Sunday. Stock, forex, and commodity markets are closed. Analyze the week's performance from Monday through Friday. Cryptocurrency markets continue trading 24/7, so crypto data reflects current pricing.";
    } else if (isSaturday) {
      timeSpanText = "Friday's close and the week's performance";
      weekendContext = "Note: Today is Saturday. Stock, forex, and commodity markets closed Friday and will reopen Monday. For stocks, forex, and commodities, focus on Friday's closing action and weekly trends. Cryptocurrency markets continue trading 24/7, so crypto data reflects current pricing.";
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

    const systemPrompt = `You are a senior financial market analyst writing for Financial Times. Your writing style mirrors the FT's precision, authority, and editorial excellence.

CRITICAL: You are analyzing REAL-TIME market data provided below. Use the exact prices, percentages, and news headlines given. Do NOT make up data or use historical examples.

WRITING STYLE REQUIREMENTS:
- Use proper institution names (e.g., "Bank of Japan" or "BoJ", not "Central Bank")
- Use specific terminology: Federal Reserve/Fed, European Central Bank/ECB, Bank of England/BoE, Bank of Japan/BoJ, People's Bank of China/PBoC
- Write in active voice with clear, declarative sentences
- Use the EXACT numbers and percentages from the provided data
- Reference the actual news headlines provided
- Use specific numbers, percentages, and basis points (bps) when referencing moves

SESSION CONTEXT REQUIREMENTS:
- The reader is in the ${sessionContext.region} region (timezone: ${timezone})
- When referring to market data from other regions, use session-aware language:
  ${sessionContext.usSession ? `- US market data: "${sessionContext.usSession}"` : ''}
  ${sessionContext.europeSession ? `- European market data: "${sessionContext.europeSession}"` : ''}
  ${sessionContext.asiaSession ? `- Asian market data: "${sessionContext.asiaSession}"` : ''}
- Example: For Asian readers viewing US data, write "the overnight US session saw..." or "US markets closed..."
- Example: For US readers viewing Asian data, write "the overnight Asian session..." or "Asian markets earlier today..."
- Always provide temporal context so readers understand WHEN the data is from relative to their local time

CONTENT REQUIREMENTS:
- Base your analysis EXCLUSIVELY on the real-time data provided below
- Use the exact prices and percentage changes given
- Reference the actual news headlines provided
- Do NOT invent data or historical comparisons not in the provided data
- Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
- Reader's local time is: ${userLocalTime}
- Day of week: ${userDayOfWeek}
${weekendContext ? `\n${weekendContext}\n` : ''}

REGIONAL FOCUS:
- This report is for readers in the ${sessionContext.region} region
- PRIORITIZE local market indices and regional developments
- Reference other regions' markets as context (e.g., "overnight US session", "European close")
- Focus on news and economic data most relevant to the ${sessionContext.region} region

STRUCTURE (use ## for main sections, ### for subsections):
1. **Market Overview** - ${isWeekend ? 'Opening paragraph summarizing the week\'s sentiment and Friday\'s closing action' : 'Opening paragraph summarizing today\'s sentiment'} across provided markets, emphasizing ${sessionContext.region} markets
2. **Equity Markets** - Lead with ${sessionContext.region} indices, then reference other major regions. Analyze exact data with actual percentages${isWeekend ? ' (Friday close and weekly performance)' : ''}
3. **Foreign Exchange** - Currency pair movements relevant to ${sessionContext.region} region${isWeekend ? ' (Friday close and weekly trends)' : ''}
4. **Cryptocurrencies** - Bitcoin/Ethereum performance from provided data (${isWeekend ? '24/7 trading continues' : 'current session'})
5. **Commodities** - Energy, metals from provided data${isWeekend ? ' (Friday close and weekly performance)' : ''}
6. **Market Drivers** - Focus on ${sessionContext.region} economic data, policy decisions, and regional news. Include global developments that impact local markets${isWeekend ? ' from the week' : ''}
   - Present geopolitical events factually without subjective judgment
   - Focus on reported facts: what officials announced, what policies were enacted, what events occurred
   - Avoid speculative or opinion-based commentary on political events
   - Connect geopolitical developments to market movements using factual data
7. **Cross-Asset Correlations** - How different markets influenced each other, with focus on ${sessionContext.region} market relationships
8. **Outlook** - What ${sessionContext.region} traders should watch for ${isWeekend ? 'when markets reopen Monday' : 'next session'}, including relevant global catalysts

FORMATTING:
${toneInstruction}
- Use **bold** for key terms, numbers, and emphasis (e.g., **2.3%**, **Federal Reserve**, **dovish pivot**)
- Keep paragraphs concise (2-4 sentences)
- Use proper section headings
- Write in a professional, authoritative tone
- Mobile-friendly and email-ready formatting

CRITICAL: This must read like it was edited by FT's editorial team - precise, factual, and professionally formatted. Use ONLY the data provided below.`;

    const userPrompt = `Generate a comprehensive market breadth report for ${timeSpanText}.

**Reader Context:**
- Location: ${sessionContext.region} region
- Local Time: ${userLocalTime}
- Timezone: ${timezone}
- Day: ${userDayOfWeek}
${weekendContext ? `\n**Weekend Context:** ${weekendContext}\n` : ''}

${marketDataSummary}

**Analysis Requirements:**
- Use the EXACT prices and percentage changes provided above
- Reference the actual news headlines provided
${isWeekend ? '- Focus on the weekly perspective and what happened in the most recent trading session (Friday)\n- Note that crypto markets trade 24/7 while traditional markets are closed\n' : ''}- Use session-aware language based on the reader's timezone (e.g., "${sessionContext.usSession}" for US data, "${sessionContext.asiaSession || sessionContext.europeSession || 'other sessions'}" for other regions)
- Analyze how these specific movements relate to each other
- Provide insights based on this real-time data with temporal context
- Tone: ${tone}

Provide a thorough analysis of ${timeSpanText} with actionable insights for traders in the ${sessionContext.region} region${isWeekend ? ', keeping in mind that most markets are closed for the weekend' : ''}.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please check your OpenAI account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const report = data.choices[0].message.content;

    console.log("Report generated successfully");

    return new Response(
      JSON.stringify({ report }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-market-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});