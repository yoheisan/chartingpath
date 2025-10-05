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

        // Generate report
        const systemPrompt = `You are an expert financial market analyst providing daily market breadth reports. 

Your task is to generate a comprehensive market summary based on the parameters provided. 

IMPORTANT INSTRUCTIONS:
- Use real-time context from your training data (up to your knowledge cutoff)
- If you don't have exact recent data, provide general market context and trends
- Focus on educational value and typical market behaviors
- Always acknowledge that this is a general analysis and traders should verify with real-time data

Structure your report with these sections:
1. Overall Market Breadth - sentiment and direction in each market
2. Top 3 Market Drivers - news, events, economic data releases
3. Performance Highlights - which assets/sectors outperformed or underperformed
4. Cross-Market Correlations - how markets influenced each other
5. Market-Specific Insights:
   - For Stocks: index movements, sector rotation
   - For Forex: central bank impacts on currency pairs
   - For Crypto: 24h price movements, sentiment, altcoin highlights
   - For Commodities: supply/demand factors, price drivers
6. Trader Takeaway - actionable high-level insight

Format in clean Markdown with headings (##, ###). Keep the report mobile-friendly and email-ready.`;

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

        const userPrompt = `Generate a market breadth report for the ${timeSpanText}.

**Parameters:**
- Timezone: ${sub.timezone}
- Markets: ${marketList}
- Tone: ${sub.tone}

${toneInstruction}

Provide a thorough analysis covering all requested markets with actionable insights for traders.`;

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
