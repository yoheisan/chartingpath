import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday

    console.log(`Checking for subscriptions to send at ${currentHour}:${currentMinute} UTC`);

    // Get all active subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from("market_report_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subsError) throw subsError;

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    for (const sub of subscriptions || []) {
      try {
        // Convert send_time to user's timezone
        const [hour, minute] = sub.send_time.split(":");
        const userSendTime = new Date();
        userSendTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

        // Convert to UTC for comparison (simplified - in production use proper timezone library)
        const timezoneOffsets: Record<string, number> = {
          "America/New_York": -5,
          "America/Chicago": -6,
          "America/Denver": -7,
          "America/Los_Angeles": -8,
          "Europe/London": 0,
          "Europe/Paris": 1,
          "Asia/Tokyo": 9,
          "Asia/Hong_Kong": 8,
          "Asia/Singapore": 8,
          "Australia/Sydney": 10,
        };

        const offset = timezoneOffsets[sub.timezone] || 0;
        const utcHour = (parseInt(hour) - offset + 24) % 24;

        // Check if it's time to send (within 15 minute window)
        const timeDiff = Math.abs(utcHour - currentHour) * 60 + Math.abs(parseInt(minute) - currentMinute);
        if (timeDiff > 15) continue;

        // Check frequency (weekly = only on Mondays)
        if (sub.frequency === "weekly" && currentDay !== 1) continue;

        console.log(`Generating report for ${sub.email}`);

        const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
        
        if (!FINNHUB_API_KEY) {
          console.error("FINNHUB_API_KEY not configured, skipping report for", sub.email);
          continue;
        }

        // Fetch real-time market data from Finnhub
        console.log("Fetching real-time market data from Finnhub...");
        
        const marketData: any = {
          timestamp: new Date().toISOString(),
          timezone: sub.timezone,
        };

        // Fetch stock market data
        if (sub.markets.includes("stocks")) {
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
        }

        // Fetch forex data using Yahoo Finance (free, no auth required)
        if (sub.markets.includes("forex")) {
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
                pc: previous 
              };
            } catch (error) {
              console.error(`Error fetching forex data for ${name}:`, error);
              return { symbol: name, c: 0, pc: 0 };
            }
          });
          marketData.forex = await Promise.all(forexPromises);
        }

        // Fetch crypto data
        if (sub.markets.includes("crypto")) {
          const cryptoSymbols = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"];
          const cryptoPromises = cryptoSymbols.map(symbol =>
            fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
              .then(r => r.json())
              .then(data => ({ symbol, ...data }))
          );
          marketData.crypto = await Promise.all(cryptoPromises);
        }

        // Fetch commodities data using Yahoo Finance (free, no auth required)
        if (sub.markets.includes("commodities")) {
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
                pc: previous 
              };
            } catch (error) {
              console.error(`Error fetching commodity data for ${name}:`, error);
              return { symbol: name, c: 0, pc: 0 };
            }
          });
          marketData.commodities = await Promise.all(commodityPromises);
        }

        console.log("Market data fetched successfully");

        // Format market data for AI prompt
        let marketDataSummary = `**Real-Time Market Data (${new Date().toLocaleString('en-US', { timeZone: sub.timezone })}):**\n\n`;
        
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

        // Generate report
        const timeSpanText = sub.time_span === "previous_day" ? "previous trading day" : "past 5 trading sessions";
        const marketList = sub.markets.join(", ");

        let toneInstruction = "";
        switch (sub.tone) {
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
- Tone: ${sub.tone}
- Timezone: ${sub.timezone}

Provide a thorough analysis of the real-time market data above with actionable insights for traders.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

        if (!aiResponse.ok) {
          console.error("AI Gateway error:", aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const report = aiData.choices[0].message.content;

        // Send email
        const timeSpanLabel = sub.time_span === "previous_day" ? "Previous Day" : "Past 5 Sessions";
        const marketListUpper = sub.markets.join(", ").toUpperCase();

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
              <title>Market Breadth Report</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #1a1a1a; font-size: 28px; margin: 0 0 8px 0;">Market Breadth Report</h1>
                  <p style="color: #666; font-size: 14px; margin: 0;">Generated on ${new Date().toLocaleString('en-US', { timeZone: sub.timezone })}</p>
                </div>

                <div style="background-color: #f9f9f9; border-left: 4px solid #4f46e5; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #333;">
                    <strong>Markets:</strong> ${marketListUpper}<br>
                    <strong>Time Span:</strong> ${timeSpanLabel}<br>
                    <strong>Timezone:</strong> ${sub.timezone}<br>
                    <strong>Tone:</strong> ${sub.tone.charAt(0).toUpperCase() + sub.tone.slice(1)}
                  </p>
                </div>

                <div style="color: #333; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 12px 0;">${htmlReport}</p>
                </div>

                <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0e0e0; text-align: center;">
                  <p style="color: #888; font-size: 12px; margin: 0;">
                    This report is for informational purposes only and should not be considered financial advice.
                  </p>
                  <p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">
                    Generated by Market Analysis Tool
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

        await resend.emails.send({
          from: "Market Analysis <onboarding@resend.dev>",
          to: [sub.email],
          subject: `Market Breadth Report - ${timeSpanLabel} (${new Date().toLocaleDateString()})`,
          html: emailHtml,
        });

        console.log(`Report sent successfully to ${sub.email}`);
      } catch (error) {
        console.error(`Error processing subscription for ${sub.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: subscriptions?.length || 0 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-scheduled-market-reports:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send scheduled reports" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
