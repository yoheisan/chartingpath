import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating sample report for ${email}`);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    
    if (!OPENAI_API_KEY || !FINNHUB_API_KEY) {
      throw new Error("API keys not configured");
    }

    // Fetch real-time market data
    const marketData: any = {
      timestamp: new Date().toISOString(),
      timezone: "America/New_York",
    };

    // Fetch stock market data
    const stockSymbols = ["SPY", "QQQ", "DIA", "^GSPC", "^IXIC", "^DJI"];
    const stockPromises = stockSymbols.map(symbol =>
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
        .then(r => r.json())
        .then(data => ({ symbol, ...data }))
    );
    marketData.stocks = await Promise.all(stockPromises);
    
    // Fetch market news
    const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
    marketData.news = await newsResponse.json();

    // Fetch forex data
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
        return { symbol: name, c: current, pc: previous };
      } catch (error) {
        console.error(`Error fetching forex data for ${name}:`, error);
        return { symbol: name, c: 0, pc: 0 };
      }
    });
    marketData.forex = await Promise.all(forexPromises);

    // Fetch crypto data
    const cryptoSymbols = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"];
    const cryptoPromises = cryptoSymbols.map(symbol =>
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
        .then(r => r.json())
        .then(data => ({ symbol, ...data }))
    );
    marketData.crypto = await Promise.all(cryptoPromises);

    // Fetch commodities data
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
        return { symbol: name, c: current, pc: previous };
      } catch (error) {
        console.error(`Error fetching commodity data for ${name}:`, error);
        return { symbol: name, c: 0, pc: 0 };
      }
    });
    marketData.commodities = await Promise.all(commodityPromises);

    // Format market data summary
    const userLocalTime = new Date().toLocaleString('en-US', { timeZone: "America/New_York", dateStyle: 'full', timeStyle: 'short' });
    let marketDataSummary = `**Real-Time Market Data**\n**Your Local Time: ${userLocalTime} (America/New_York)**\n\n`;
    
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
    
    marketDataSummary += "**Forex Pairs:**\n";
    marketData.forex.forEach((pair: any) => {
      const changePercent = ((pair.c - pair.pc) / pair.pc * 100).toFixed(2);
      marketDataSummary += `- ${pair.symbol}: ${pair.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
    });
    marketDataSummary += "\n";
    
    marketDataSummary += "**Cryptocurrencies:**\n";
    marketData.crypto.forEach((crypto: any) => {
      const changePercent = ((crypto.c - crypto.pc) / crypto.pc * 100).toFixed(2);
      marketDataSummary += `- ${crypto.symbol}: $${crypto.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
    });
    marketDataSummary += "\n";
    
    marketDataSummary += "**Commodities:**\n";
    marketData.commodities.forEach((commodity: any) => {
      const changePercent = ((commodity.c - commodity.pc) / commodity.pc * 100).toFixed(2);
      marketDataSummary += `- ${commodity.symbol}: $${commodity.c} (${changePercent > 0 ? '+' : ''}${changePercent}%)\n`;
    });

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
Keep it brief and professional. Maximum 500 words.
- Use **bold** for key terms, numbers, and emphasis
- Keep paragraphs concise (2-4 sentences)
- Write in a professional, authoritative tone
- Mobile-friendly and email-ready formatting`;

    const userPrompt = `Generate a comprehensive market breadth report for today's trading session.

${marketDataSummary}

**Analysis Requirements:**
- Use the EXACT prices and percentage changes provided above
- Reference the actual news headlines provided
- Analyze how these specific movements relate to each other
- Provide insights based on this real-time data
- Tone: professional

Provide a thorough analysis with actionable insights for traders.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", aiResponse.status, errorText);
      throw new Error("Failed to generate report");
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices[0].message.content;

    // Format HTML report
    const htmlReport = report
      .replace(/## (.*)/g, '<h2 style="color: #333; margin-top: 24px; margin-bottom: 12px;">$1</h2>')
      .replace(/### (.*)/g, '<h3 style="color: #555; margin-top: 16px; margin-bottom: 8px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
      .replace(/- (.*)/g, '<li style="margin-left: 20px;">$1</li>');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sample Market Breadth Report</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Brand Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 20px; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.15); width: 64px; height: 64px; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">Sample Market Report</h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">Professional Market Analysis & Insights</p>
            </div>

            <div style="padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Generated on ${new Date().toLocaleString('en-US', { timeZone: "America/New_York" })}</p>
              </div>

              <!-- Sample Badge -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.8;">
                  <strong style="color: #f59e0b;">📧 Sample Report</strong><br>
                  This is a demonstration of our professional market analysis service. Subscribe to receive daily or weekly reports tailored to your preferences.
                </p>
              </div>

              <!-- Report Settings Summary -->
              <div style="background: linear-gradient(135deg, #f9f9f9 0%, #f3f4f6 100%); border-left: 4px solid #4f46e5; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.8;">
                  <strong style="color: #4f46e5;">📊 Markets:</strong> STOCKS, FOREX, CRYPTO, COMMODITIES<br>
                  <strong style="color: #4f46e5;">📅 Time Span:</strong> Previous Day<br>
                  <strong style="color: #4f46e5;">🌍 Timezone:</strong> America/New_York<br>
                  <strong style="color: #4f46e5;">📝 Tone:</strong> Professional
                </p>
              </div>

              <!-- Report Content -->
              <div style="color: #333; font-size: 14px; line-height: 1.8;">
                <p style="margin: 12px 0;">${htmlReport}</p>
              </div>

              <!-- Disclaimer -->
              <div style="margin-top: 40px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
                  <strong>⚠️ Disclaimer:</strong> This report is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or an offer to buy or sell securities.
                </p>
              </div>

              <!-- CTA -->
              <div style="margin-top: 32px; text-align: center; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Ready to subscribe?</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">Get personalized market reports delivered to your inbox daily or weekly.</p>
                <a href="https://dgznlsckoamseqcpzfqm.supabase.co/tools/market-breadth" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Subscribe Now</a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 32px 20px; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center;">
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Market Analysis Platform</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Your trusted source for market intelligence</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "ChartingPath Market Reports <reports@chartingpath.com>",
      to: [email],
      subject: `📊 Sample Market Breadth Report - ${new Date().toLocaleDateString()}`,
      html: emailHtml,
    });

    console.log(`Sample report sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Sample report sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sample-market-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send sample report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
