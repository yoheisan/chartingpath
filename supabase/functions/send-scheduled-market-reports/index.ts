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

        // Check if report was already sent recently (deduplication)
        if (sub.last_sent_at) {
          const lastSentTime = new Date(sub.last_sent_at);
          const hoursSinceLastSent = (now.getTime() - lastSentTime.getTime()) / (1000 * 60 * 60);
          
          // For daily: don't send if already sent within last 12 hours
          // For weekly: don't send if already sent within last 6 days (144 hours)
          const cooldownHours = sub.frequency === "weekly" ? 144 : 12;
          
          if (hoursSinceLastSent < cooldownHours) {
            console.log(`Skipping ${sub.email}: Already sent ${hoursSinceLastSent.toFixed(1)} hours ago (cooldown: ${cooldownHours}h)`);
            continue;
          }
        }

        console.log(`Generating report for ${sub.email}`);

        // Fetch or generate the report via the shared get-cached-market-report function
        const { data: reportData, error: reportError } = await supabase
          .functions
          .invoke("get-cached-market-report", {
            body: {
              timezone: sub.timezone,
              markets: sub.markets,
              timeSpan: sub.time_span,
              tone: sub.tone,
              forceGenerate: false,
            },
          });

        if (reportError) {
          console.error("Error fetching cached market report for", sub.email, reportError);
          continue;
        }

        const rawReport = (reportData as any)?.report as string | undefined;

        if (!rawReport || rawReport.trim().length === 0) {
          console.error("Received empty report for", sub.email, "from get-cached-market-report");
          continue;
        }

        // Send email
        const timeSpanLabel = sub.time_span === "previous_day" ? "Previous Day" : "Past 5 Sessions";
        const marketListUpper = sub.markets.join(", ").toUpperCase();

        const htmlReport = rawReport
          .replace(/## (.*)/g, '<h2 style="color: #333; margin-top: 24px; margin-bottom: 12px;">$1<\/h2>')
          .replace(/### (.*)/g, '<h3 style="color: #555; margin-top: 16px; margin-bottom: 8px;">$1<\/h3>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
          .replace(/\*(.*?)\*/g, '<em>$1<\/em>')
          .replace(/\n\n/g, '<\/p><p style="margin: 12px 0;">')
          .replace(/- (.*)/g, '<li style="margin-left: 20px;">$1<\/li>');

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
                  <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">Market Breadth Report<\/h1>
                  <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">Professional Market Analysis & Insights<\/p>
                <\/div>

                <div style="padding: 40px 20px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <p style="color: #666; font-size: 14px; margin: 0;">Generated on ${new Date().toLocaleString('en-US', { timeZone: sub.timezone })}<\/p>
                  <\/div>

                  <!-- Report Settings Summary -->
                  <div style="background: linear-gradient(135deg, #f9f9f9 0%, #f3f4f6 100%); border-left: 4px solid #ff6633; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.8;">
                      <strong style="color: #ff6633;">📊 Markets:<\/strong> ${marketListUpper}<br>
                      <strong style="color: #ff6633;">📅 Time Span:<\/strong> ${timeSpanLabel}<br>
                      <strong style="color: #ff6633;">🌍 Timezone:<\/strong> ${sub.timezone}<br>
                      <strong style="color: #ff6633;">📝 Tone:<\/strong> ${sub.tone.charAt(0).toUpperCase() + sub.tone.slice(1)}
                    <\/p>
                  <\/div>

                  <!-- Report Content -->
                  <div style="color: #333; font-size: 14px; line-height: 1.8;">
                    <p style="margin: 12px 0;">${htmlReport}<\/p>
                  <\/div>

                  <!-- Disclaimer -->
                  <div style="margin-top: 40px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
                      <strong>⚠️ Disclaimer:<\/strong> This report is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or an offer to buy or sell securities. Always consult with a qualified financial advisor before making investment decisions.
                    <\/p>
                  <\/div>

                  <!-- Preferences CTA -->
                  <div style="margin-top: 32px; text-align: center; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">Want to customize your report settings?<\/p>
                    <a href="${preferencesUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6633 0%, #ff8000 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Manage Preferences<\/a>
                  <\/div>
                <\/div>

                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 32px 20px; border-top: 1px solid #e5e7eb;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">ChartingPath<\/p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Professional Trading Education & Tools<\/p>
                  <\/div>

                  <!-- Footer Links -->
                  <div style="text-align: center; margin-bottom: 20px;">
                    <a href="${preferencesUrl}" style="color: #ff6633; text-decoration: none; font-size: 13px; margin: 0 12px;">Manage Preferences<\/a>
                    <span style="color: #d1d5db;">|<\/span>
                    <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Unsubscribe<\/a>
                    <span style="color: #d1d5db;">|<\/span>
                    <a href="https://chartingpath.com/privacy" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Privacy<\/a>
                    <span style="color: #d1d5db;">|<\/span>
                    <a href="https://chartingpath.com/terms" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Terms<\/a>
                  <\/div>

                  <!-- Legal Footer -->
                  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0; line-height: 1.6;">
                      You are receiving this email because you subscribed to Market Breadth Reports.
                    <\/p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} ChartingPath. All rights reserved.
                    <\/p>
                  <\/div>
                <\/div>
              <\/div>
            <\/body>
          <\/html>
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

        // Update last_sent_at timestamp to prevent duplicates
        const { error: updateError } = await supabase
          .from('market_report_subscriptions')
          .update({ last_sent_at: now.toISOString() })
          .eq('id', sub.id);

        if (updateError) {
          console.error(`Failed to update last_sent_at for ${sub.email}:`, updateError);
        }

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
