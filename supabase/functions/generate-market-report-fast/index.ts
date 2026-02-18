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
    
    console.log("Generating fast market report using Lovable AI:", { timezone, markets, timeSpan, tone });

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

    // Fetch real-time market data
    console.log("Fetching real-time market data...");
    
    const marketData: any = {
      timestamp: new Date().toISOString(),
      timezone: timezone,
    };

    // Fetch stock market data
    if (markets.includes("stocks")) {
      const stockSymbols = ["SPY", "QQQ", "DIA"];
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
      
      // Fetch limited news
      try {
        const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
        const newsData = await newsResponse.json();
        marketData.news = newsData.slice(0, 3); // Only top 3 articles
      } catch (error) {
        console.error('Error fetching news:', error);
        marketData.news = [];
      }
    }

    // Fetch forex data
    if (markets.includes("forex")) {
      const forexPairs = [
        { symbol: "EURUSD=X", name: "EUR/USD" },
        { symbol: "USDJPY=X", name: "USD/JPY" }
      ];
      const forexPromises = forexPairs.map(async ({ symbol, name }) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`);
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

    // Determine session context
    const getSessionContext = (tz: string) => {
      if (tz.includes('Asia') || tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore')) {
        return { region: 'Asia', localSession: 'Asian session' };
      } else if (tz.includes('Europe') || tz.includes('London') || tz.includes('Paris')) {
        return { region: 'Europe', localSession: 'European session' };
      } else if (tz.includes('America') || tz.includes('New_York') || tz.includes('Los_Angeles')) {
        return { region: 'Americas', localSession: 'US session' };
      }
      return { region: 'Global', localSession: 'current session' };
    };

    const sessionContext = getSessionContext(timezone);
    const userLocalTime = new Date().toLocaleString('en-US', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' });
    const userDayOfWeek = new Date().toLocaleString('en-US', { timeZone: timezone, weekday: 'long' });
    const isWeekend = userDayOfWeek === 'Saturday' || userDayOfWeek === 'Sunday';

    // Format market data for AI prompt
    let marketDataSummary = `**Real-Time Market Data - ${userLocalTime}**\n\n`;
    
    if (marketData.stocks) {
      marketDataSummary += "**Stock Indices:**\n";
      marketData.stocks.forEach((stock: any) => {
        const changePercent = ((stock.c - stock.pc) / stock.pc * 100).toFixed(2);
        marketDataSummary += `- ${stock.symbol}: $${stock.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
      
      if (marketData.news && marketData.news.length > 0) {
        marketDataSummary += "**Key News:**\n";
        marketData.news.forEach((article: any) => {
          marketDataSummary += `- ${article.headline}\n`;
        });
        marketDataSummary += "\n";
      }
    }
    
    if (marketData.forex) {
      marketDataSummary += "**Forex:**\n";
      marketData.forex.forEach((pair: any) => {
        const changePercent = ((pair.c - pair.pc) / pair.pc * 100).toFixed(2);
        marketDataSummary += `- ${pair.symbol}: ${pair.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
      });
      marketDataSummary += "\n";
    }
    
    if (marketData.crypto) {
      marketDataSummary += "**Crypto:**\n";
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

    const weekendContext = isWeekend ? "Note: Markets are closed for the weekend. Focus on Friday's closing action." : "";
    
    const systemPrompt = `You are a financial analyst providing concise market reports.

CRITICAL: Use ONLY the real-time data provided. Do NOT invent data.

Context:
- Reader location: ${sessionContext.region}
- Local time: ${userLocalTime}
${weekendContext}

Write a professional market report with these sections:
1. Market Overview (2-3 sentences)
2. Key Movements (analyze the exact data provided)
3. Market Drivers (reference provided news)
4. Outlook (what to watch next session)

Keep it under 400 words. Use **bold** for key numbers and terms. Be precise and factual.`;

    const userPrompt = `Analyze this market data and write a concise report:\n\n${marketDataSummary}`;

    console.log("Calling Gemini API (gemini-2.0-flash)...");

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { maxOutputTokens: 800 },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errorText);
      throw new Error(`Gemini request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const report = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("Fast report generated successfully");

    return new Response(
      JSON.stringify({ 
        report,
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in generate-market-report-fast:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
