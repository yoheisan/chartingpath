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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
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

        // Determine session context based on timezone
        const getSessionContext = (tz: string) => {
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

        const sessionContext = getSessionContext(sub.timezone);
        const userLocalTime = new Date().toLocaleString('en-US', { timeZone: sub.timezone, dateStyle: 'full', timeStyle: 'short' });
        
        // Determine day of week in user's timezone
        const userDayOfWeek = new Date().toLocaleString('en-US', { timeZone: sub.timezone, weekday: 'long' });
        const isSaturday = userDayOfWeek === 'Saturday';
        const isSunday = userDayOfWeek === 'Sunday';
        const isWeekend = isSaturday || isSunday;

        // Format market data for AI prompt
        let marketDataSummary = `**Real-Time Market Data**\n**Your Local Time: ${userLocalTime} (${sub.timezone})**\n\n`;
        
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
        let timeSpanText = sub.time_span === "previous_day" ? "previous trading day" : "past 5 trading sessions";
        let weekendContext = "";
        
        if (isSunday) {
          timeSpanText = "the past week's trading activity";
          weekendContext = "Note: Today is Sunday. Stock, forex, and commodity markets are closed. Analyze the week's performance from Monday through Friday. Cryptocurrency markets continue trading 24/7, so crypto data reflects current pricing.";
        } else if (isSaturday) {
          timeSpanText = "Friday's trading session and the week's performance";
          weekendContext = "Note: Today is Saturday. Stock, forex, and commodity markets closed Friday and will reopen Monday. For stocks, forex, and commodities, focus on Friday's closing action and weekly trends. Cryptocurrency markets continue trading 24/7, so crypto data reflects current pricing.";
        }
        
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

SESSION CONTEXT REQUIREMENTS:
- The reader is in the ${sessionContext.region} region (timezone: ${sub.timezone})
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

STRUCTURE (use ## for main sections, ### for subsections):
1. **Market Overview** - ${isWeekend ? 'Opening paragraph summarizing the week\'s sentiment and Friday\'s closing action' : 'Opening paragraph summarizing today\'s sentiment'} across provided markets
2. **Equity Markets** - Analyze the exact index data provided with actual percentages${isWeekend ? ' (Friday close and weekly performance)' : ''}
3. **Foreign Exchange** - Currency pair movements from the provided data${isWeekend ? ' (Friday close and weekly trends)' : ''}
4. **Cryptocurrencies** - Bitcoin/Ethereum performance from provided data (${isWeekend ? '24/7 trading continues' : 'current session'})
5. **Commodities** - Energy, metals from provided data${isWeekend ? ' (Friday close and weekly performance)' : ''}
6. **Market Drivers** - Analyze the news headlines provided${isWeekend ? ' from the week' : ''}
7. **Cross-Asset Correlations** - How different markets influenced each other based on the data
8. **Outlook** - What traders should watch for ${isWeekend ? 'when markets reopen Monday' : 'next session'}

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
- Timezone: ${sub.timezone}
- Day: ${userDayOfWeek}
${weekendContext ? `\n**Weekend Context:** ${weekendContext}\n` : ''}

${marketDataSummary}

**Analysis Requirements:**
- Use the EXACT prices and percentage changes provided above
- Reference the actual news headlines provided
${isWeekend ? '- Focus on the weekly perspective and what happened in the most recent trading session (Friday)\n- Note that crypto markets trade 24/7 while traditional markets are closed\n' : ''}- Use session-aware language based on the reader's timezone (e.g., "${sessionContext.usSession}" for US data, "${sessionContext.asiaSession || sessionContext.europeSession || 'other sessions'}" for other regions)
- Analyze how these specific movements relate to each other
- Provide insights based on this real-time data with temporal context
- Tone: ${sub.tone}

Provide a thorough analysis of ${timeSpanText} with actionable insights for traders in the ${sessionContext.region} region${isWeekend ? ', keeping in mind that most markets are closed for the weekend' : ''}.`;

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
          console.error("OpenAI API error:", aiResponse.status);
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

        // Generate unsubscribe and preferences URLs
        const baseUrl = supabaseUrl.replace('/rest/v1', '');
        const unsubscribeUrl = `${baseUrl}/functions/v1/unsubscribe-market-report?token=${sub.unsubscribe_token}`;
        const preferencesUrl = `https://chartingpath.com/tools/market-breadth`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Market Breadth Report</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Brand Header -->
                <div style="background: linear-gradient(135deg, #ff6633 0%, #ff8000 100%); padding: 32px 20px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                  <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">Market Breadth Report</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">Professional Market Analysis & Insights</p>
                </div>

                <div style="padding: 40px 20px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <p style="color: #666; font-size: 14px; margin: 0;">Generated on ${new Date().toLocaleString('en-US', { timeZone: sub.timezone })}</p>
                  </div>

                  <!-- Report Settings Summary -->
                  <div style="background: linear-gradient(135deg, #f9f9f9 0%, #f3f4f6 100%); border-left: 4px solid #ff6633; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.8;">
                      <strong style="color: #ff6633;">📊 Markets:</strong> ${marketListUpper}<br>
                      <strong style="color: #ff6633;">📅 Time Span:</strong> ${timeSpanLabel}<br>
                      <strong style="color: #ff6633;">🌍 Timezone:</strong> ${sub.timezone}<br>
                      <strong style="color: #ff6633;">📝 Tone:</strong> ${sub.tone.charAt(0).toUpperCase() + sub.tone.slice(1)}
                    </p>
                  </div>

                  <!-- Report Content -->
                  <div style="color: #333; font-size: 14px; line-height: 1.8;">
                    <p style="margin: 12px 0;">${htmlReport}</p>
                  </div>

                  <!-- Disclaimer -->
                  <div style="margin-top: 40px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
                      <strong>⚠️ Disclaimer:</strong> This report is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or an offer to buy or sell securities. Always consult with a qualified financial advisor before making investment decisions.
                    </p>
                  </div>

                  <!-- Preferences CTA -->
                  <div style="margin-top: 32px; text-align: center; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">Want to customize your report settings?</p>
                    <a href="${preferencesUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6633 0%, #ff8000 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Manage Preferences</a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 32px 20px; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">ChartingPath</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Professional Trading Education & Tools</p>
              </div>

                  <!-- Footer Links -->
                  <div style="text-align: center; margin-bottom: 20px;">
                    <a href="${preferencesUrl}" style="color: #ff6633; text-decoration: none; font-size: 13px; margin: 0 12px;">Manage Preferences</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Unsubscribe</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://chartingpath.com/privacy" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Privacy</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://chartingpath.com/terms" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Terms</a>
                  </div>

                  <!-- Legal Footer -->
                  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0; line-height: 1.6;">
                      You are receiving this email because you subscribed to Market Breadth Reports.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                      ChartingPath LLC<br>
                      30 N Gould St, Suite R<br>
                      Sheridan, WY 82801, United States
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} ChartingPath. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        await resend.emails.send({
          from: "ChartingPath Market Reports <reports@chartingpath.com>",
          to: [sub.email],
          subject: `📊 Market Breadth Report - ${timeSpanLabel} (${new Date().toLocaleDateString()})`,
          html: emailHtml,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
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
