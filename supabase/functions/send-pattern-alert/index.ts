import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Configure VAPID for Web Push
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:alerts@chartingpath.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  alert: {
    id: string;
    symbol: string;
    timeframe: string;
    pattern: string;
    user_id: string;
    profiles: {
      email: string;
      email_notifications_enabled?: boolean;
      push_notifications_enabled?: boolean;
    };
  };
  patternResult: {
    confidence: number;
    description: string;
  };
  marketData: Array<{
    o: number;
    h: number;
    l: number;
    c: number;
    t: number;
  }>;
  bracketLevels?: {
    direction: 'long' | 'short';
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    riskRewardRatio: number;
    stopLossMethod: string;
    takeProfitMethod: string;
  };
}

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

const patternNames: { [key: string]: string } = {
  'hammer': 'Hammer',
  'inverted_hammer': 'Inverted Hammer',
  'bullish_engulfing': 'Bullish Engulfing',
  'bearish_engulfing': 'Bearish Engulfing',
  'doji': 'Doji',
  'morning_star': 'Morning Star',
  'evening_star': 'Evening Star',
  'ema_cross_bullish': 'EMA Cross (Bullish)',
  'ema_cross_bearish': 'EMA Cross (Bearish)',
  'rsi_divergence_bullish': 'RSI Divergence (Bullish)',
  'rsi_divergence_bearish': 'RSI Divergence (Bearish)',
};

const timeframeNames: { [key: string]: string } = {
  '15m': '15 Minutes',
  '1h': '1 Hour',
  '4h': '4 Hours',
  '1d': '1 Day',
};

async function sendEmail(
  alert: AlertEmailRequest['alert'],
  patternResult: AlertEmailRequest['patternResult'],
  marketData: AlertEmailRequest['marketData'],
  bracketLevels: AlertEmailRequest['bracketLevels']
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const patternName = patternNames[alert.pattern] || alert.pattern;
    const timeframeName = timeframeNames[alert.timeframe] || alert.timeframe;
    const currentPrice = marketData[marketData.length - 1]?.c || 0;
    const chartingPathUrl = `https://chartingpath.com/members/alerts`;

    const subject = `Pattern Alert: ${patternName} detected on ${alert.symbol} (${timeframeName})`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chart Pattern Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .pattern-card { background-color: #f1f5f9; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .price-info { background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .footer { background-color: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
          .disclaimer { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Chart Pattern Alert</h1>
            <p>Pattern detected on ${alert.symbol}</p>
          </div>
          
          <div class="content">
            <div class="pattern-card">
              <h2 style="margin-top: 0; color: #1e293b;">Pattern Detected: ${patternName}</h2>
              <p><strong>Symbol:</strong> ${alert.symbol}</p>
              <p><strong>Timeframe:</strong> ${timeframeName}</p>
              <p><strong>Confidence:</strong> ${(patternResult.confidence * 100).toFixed(0)}%</p>
              <p><strong>Description:</strong> ${patternResult.description}</p>
            </div>

            <div class="price-info">
              <h3 style="margin-top: 0; color: #065f46;">Market Information</h3>
              <p><strong>Current Price:</strong> $${currentPrice.toFixed(4)}</p>
              <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
              ${bracketLevels ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #10b981;">
                <p style="margin: 5px 0;"><strong>Direction:</strong> ${bracketLevels.direction.toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Entry:</strong> $${bracketLevels.entryPrice.toFixed(4)}</p>
                <p style="margin: 5px 0; color: #dc2626;"><strong>Stop Loss:</strong> $${bracketLevels.stopLossPrice.toFixed(4)}</p>
                <p style="margin: 5px 0; color: #16a34a;"><strong>Take Profit:</strong> $${bracketLevels.takeProfitPrice.toFixed(4)}</p>
                <p style="margin: 5px 0;"><strong>R:R Ratio:</strong> ${bracketLevels.riskRewardRatio.toFixed(2)}</p>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${chartingPathUrl}" class="cta-button">View on ChartingPath</a>
            </div>

            <div class="disclaimer">
              <h4 style="margin-top: 0; color: #92400e;">⚠️ Important Disclaimer</h4>
              <p style="margin-bottom: 0; color: #92400e; font-size: 14px;">
                This alert is for educational purposes only and does not constitute financial advice. 
                Trading involves substantial risk of loss. Always conduct your own research and consider 
                your risk tolerance before making trading decisions.
              </p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              This alert was generated by ChartingPath's automated pattern detection system. 
              You can manage your alerts by logging into your account.
            </p>
          </div>

          <div class="footer">
            <p>ChartingPath - Chart Pattern Email Alerts</p>
            <p>Turn Charts Into Trading Scripts — Without the Guesswork</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ChartingPath Alerts <alerts@chartingpath.com>",
      to: [alert.profiles.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("[send-pattern-alert] Email sent successfully:", emailResponse.data?.id);
    return { success: true, emailId: emailResponse.data?.id };
  } catch (error: any) {
    console.error("[send-pattern-alert] Email error:", error);
    return { success: false, error: error.message };
  }
}

async function sendPushNotifications(
  userId: string,
  alert: AlertEmailRequest['alert'],
  patternResult: AlertEmailRequest['patternResult'],
  currentPrice: number
): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[send-pattern-alert] VAPID keys not configured, skipping push");
    return { success: false, sent: 0, failed: 0, error: "VAPID keys not configured" };
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh_key, auth_key")
      .eq("user_id", userId);

    if (subError) {
      console.error("[send-pattern-alert] Error fetching push subscriptions:", subError);
      return { success: false, sent: 0, failed: 0, error: subError.message };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-pattern-alert] No push subscriptions found for user:", userId);
      return { success: true, sent: 0, failed: 0 };
    }

    const patternName = patternNames[alert.pattern] || alert.pattern;
    const timeframeName = timeframeNames[alert.timeframe] || alert.timeframe;

    // Prepare push notification payload
    const payload = JSON.stringify({
      title: `Pattern Alert: ${patternName} on ${alert.symbol}`,
      body: `${patternResult.description} (${(patternResult.confidence * 100).toFixed(0)}% confidence) - $${currentPrice.toFixed(2)}`,
      tag: `pattern-alert-${alert.id}`,
      url: "/members/alerts",
      alertId: alert.id,
      requireInteraction: true,
      data: {
        symbol: alert.symbol,
        pattern: alert.pattern,
        timeframe: timeframeName,
        price: currentPrice,
      },
      actions: [
        { action: "view", title: "View Chart" },
        { action: "dismiss", title: "Dismiss" },
      ],
    });

    let sent = 0;
    let failed = 0;

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh_key,
                auth: sub.auth_key,
              },
            },
            payload
          );
          return { success: true };
        } catch (error: any) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log("[send-pattern-alert] Removing expired subscription:", sub.endpoint);
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          throw error;
        }
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        console.error("[send-pattern-alert] Push notification failed:", result.reason);
      }
    });

    console.log(`[send-pattern-alert] Push notifications: ${sent} sent, ${failed} failed`);
    return { success: true, sent, failed };
  } catch (error: any) {
    console.error("[send-pattern-alert] Push error:", error);
    return { success: false, sent: 0, failed: 0, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alert, patternResult, marketData, bracketLevels }: AlertEmailRequest = await req.json();
    const currentPrice = marketData[marketData.length - 1]?.c || 0;

    console.log(`[send-pattern-alert] Processing alert for ${alert.symbol} to user ${alert.user_id}`);

    // Get notification preferences (default to true if not set)
    const emailEnabled = alert.profiles.email_notifications_enabled !== false;
    const pushEnabled = alert.profiles.push_notifications_enabled !== false;

    console.log(`[send-pattern-alert] Preferences - Email: ${emailEnabled}, Push: ${pushEnabled}`);

    // Send notifications in parallel
    const [emailResult, pushResult] = await Promise.allSettled([
      emailEnabled 
        ? sendEmail(alert, patternResult, marketData, bracketLevels)
        : Promise.resolve({ success: false, error: "Email notifications disabled" }),
      pushEnabled && alert.user_id
        ? sendPushNotifications(alert.user_id, alert, patternResult, currentPrice)
        : Promise.resolve({ success: false, sent: 0, failed: 0, error: "Push notifications disabled" }),
    ]);

    const emailStatus = emailResult.status === "fulfilled" ? emailResult.value : { success: false, error: "Failed" };
    const pushStatus = pushResult.status === "fulfilled" ? pushResult.value : { success: false, sent: 0, failed: 0, error: "Failed" };

    console.log("[send-pattern-alert] Results:", { email: emailStatus, push: pushStatus });

    return new Response(JSON.stringify({ 
      success: true,
      channels: {
        email: emailStatus,
        push: pushStatus,
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("[send-pattern-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
