import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendKey ? new Resend(resendKey) : null;

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("economic_events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Get users who should receive alerts for this event
    const { data: preferences, error: prefError } = await supabase
      .from("economic_calendar_preferences")
      .select("*, profiles(email)")
      .contains("regions", [event.region])
      .contains("indicator_types", [event.indicator_type])
      .contains("impact_levels", [event.impact_level]);

    if (prefError) {
      throw new Error("Error fetching preferences: " + prefError.message);
    }

    console.log(`Found ${preferences?.length || 0} users to notify`);

    const results = {
      email_sent: 0,
      telegram_sent: 0,
      twitter_sent: 0,
      failed: 0
    };

    // Send alerts to each user
    for (const pref of preferences || []) {
      try {
        // Email alert
        if (pref.email_enabled && resend && pref.profiles?.email) {
          const emailContent = formatEmailAlert(event);
          
          await resend.emails.send({
            from: "Economic Alerts <alerts@chartingpath.com>",
            to: [pref.profiles.email],
            subject: `🔔 ${event.event_name} - ${event.country_code}`,
            html: emailContent
          });

          results.email_sent++;
          
          // Log alert
          await supabase.from("economic_alerts").insert({
            user_id: pref.user_id,
            event_id: event.id,
            delivery_method: "email",
            status: "sent"
          });
        }

        // Telegram alert
        if (pref.telegram_enabled && telegramToken && pref.telegram_chat_id) {
          const telegramMessage = formatTelegramAlert(event);
          
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: pref.telegram_chat_id,
              text: telegramMessage,
              parse_mode: "Markdown"
            })
          });

          results.telegram_sent++;
          
          await supabase.from("economic_alerts").insert({
            user_id: pref.user_id,
            event_id: event.id,
            delivery_method: "telegram",
            status: "sent"
          });
        }

        // Twitter/X DM would go here if API credentials are available
        // Note: Twitter API v2 requires OAuth 2.0 for DMs

      } catch (error) {
        console.error("Error sending alert to user:", pref.user_id, error);
        results.failed++;
      }
    }

    console.log("Alert distribution results:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error sending economic alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

function formatEmailAlert(event: any): string {
  const scheduledTime = new Date(event.scheduled_time);
  const formattedTime = scheduledTime.toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short',
    timeZone: 'America/New_York'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .data-row { display: flex; justify-content: space-between; padding: 10px; background: white; margin: 8px 0; border-radius: 4px; }
          .label { font-weight: bold; color: #667eea; }
          .impact { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Real-Time Economic Update</h2>
            <h3>${event.event_name}</h3>
          </div>
          <div class="content">
            <div class="data-row">
              <span class="label">Date/Time:</span>
              <span>${formattedTime} EST</span>
            </div>
            <div class="data-row">
              <span class="label">Country:</span>
              <span>${event.country_code}</span>
            </div>
            ${event.actual_value ? `
            <div class="data-row">
              <span class="label">Actual:</span>
              <span>${event.actual_value}</span>
            </div>
            ` : ''}
            ${event.forecast_value ? `
            <div class="data-row">
              <span class="label">Forecast:</span>
              <span>${event.forecast_value}</span>
            </div>
            ` : ''}
            ${event.previous_value ? `
            <div class="data-row">
              <span class="label">Previous:</span>
              <span>${event.previous_value}</span>
            </div>
            ` : ''}
            ${event.market_impact ? `
            <div class="impact">
              <strong>Market Impact:</strong><br/>
              ${event.market_impact}
            </div>
            ` : ''}
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This alert was generated instantly as soon as the data was released by the official source.
            </p>
          </div>
          <div class="footer">
            <p>ChartingPath Economic Calendar</p>
            <p><a href="https://chartingpath.com">Manage Alert Preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function formatTelegramAlert(event: any): string {
  const scheduledTime = new Date(event.scheduled_time);
  const formattedTime = scheduledTime.toLocaleString('en-US', { 
    dateStyle: 'short', 
    timeStyle: 'short'
  });

  return `
🔔 *Real-Time Economic Update: ${event.event_name}*

📅 *Date/Time:* ${formattedTime} EST
🌍 *Country:* ${event.country_code}
${event.actual_value ? `📊 *Actual:* ${event.actual_value}` : ''}
${event.forecast_value ? `🎯 *Forecast:* ${event.forecast_value}` : ''}
${event.previous_value ? `📈 *Previous:* ${event.previous_value}` : ''}

${event.market_impact ? `\n💡 *Market Impact:*\n${event.market_impact}` : ''}

_Alert generated by ChartingPath Economic Calendar_
  `.trim();
}
