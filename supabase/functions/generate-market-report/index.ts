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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    // Fetch real-time market data from Finnhub
    console.log("Fetching real-time market data from Finnhub...");
    
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
          console.log(`Stock data for ${symbol}:`, JSON.stringify(data));
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching stock data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      marketData.stocks = await Promise.all(stockPromises);
      
      // Fetch market news
      try {
        const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
        const newsData = await newsResponse.json();
        console.log(`News data:`, JSON.stringify(newsData).substring(0, 200));
        marketData.news = newsData;
      } catch (error) {
        console.error('Error fetching news:', error);
        marketData.news = [];
      }
    }

    // Fetch forex data
    if (markets.includes("forex")) {
      const forexPairs = ["OANDA:EUR_USD", "OANDA:GBP_USD", "OANDA:USD_JPY", "OANDA:AUD_USD"];
      const forexPromises = forexPairs.map(async symbol => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await response.json();
          console.log(`Forex data for ${symbol}:`, JSON.stringify(data));
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching forex data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
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

    // Fetch commodities data
    if (markets.includes("commodities")) {
      const commoditySymbols = ["OANDA:XAU_USD", "OANDA:XAG_USD", "OANDA:BCO_USD", "OANDA:WTICO_USD"];
      const commodityPromises = commoditySymbols.map(async symbol => {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const data = await response.json();
          console.log(`Commodity data for ${symbol}:`, JSON.stringify(data));
          return { symbol, ...data };
        } catch (error) {
          console.error(`Error fetching commodity data for ${symbol}:`, error);
          return { symbol, c: 0, pc: 0, error: true };
        }
      });
      marketData.commodities = await Promise.all(commodityPromises);
    }

    console.log("Market data fetched successfully");

    // Format market data for AI prompt
    let marketDataSummary = `**Real-Time Market Data (${new Date().toLocaleString('en-US', { timeZone: timezone })}):**\n\n`;
    
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
    const timeSpanText = timeSpan === "previous_day" ? "previous trading day" : "past 5 trading sessions";
    
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

CONTENT REQUIREMENTS:
- Base your analysis EXCLUSIVELY on the real-time data provided below
- Use the exact prices and percentage changes given
- Reference the actual news headlines provided
- Do NOT invent data or historical comparisons not in the provided data
- Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

STRUCTURE (use ## for main sections, ### for subsections):
1. **Market Overview** - Opening paragraph summarizing today's sentiment across provided markets
2. **Equity Markets** - Analyze the exact index data provided with actual percentages
3. **Foreign Exchange** - Currency pair movements from the provided data
4. **Cryptocurrencies** - Bitcoin/Ethereum performance from provided data
5. **Commodities** - Energy, metals from provided data
6. **Market Drivers** - Analyze the news headlines provided
7. **Cross-Asset Correlations** - How different markets influenced each other based on the data
8. **Outlook** - What traders should watch for next session

FORMATTING:
${toneInstruction}
- Use **bold** for key terms, numbers, and emphasis (e.g., **2.3%**, **Federal Reserve**, **dovish pivot**)
- Keep paragraphs concise (2-4 sentences)
- Use proper section headings
- Write in a professional, authoritative tone
- Mobile-friendly and email-ready formatting

CRITICAL: This must read like it was edited by FT's editorial team - precise, factual, and professionally formatted. Use ONLY the data provided below.`;

    const userPrompt = `Generate a comprehensive market breadth report for today (${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}).

${marketDataSummary}

**Analysis Requirements:**
- Use the EXACT prices and percentage changes provided above
- Reference the actual news headlines provided
- Analyze how these specific movements relate to each other
- Provide insights based on this real-time data
- Tone: ${tone}
- Timezone: ${timezone}

Provide a thorough analysis of the real-time market data above with actionable insights for traders.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
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
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
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