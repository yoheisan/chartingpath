import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "ChartingPath <hello@chartingpath.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, subject, html, template, data } = await req.json();

    let emailHtml = html;
    if (template === "welcome") emailHtml = buildWelcomeEmail(data);
    if (template === "getting_started") emailHtml = buildGettingStartedEmail(data);

    if (!emailHtml) {
      throw new Error("No email content provided. Specify html or a valid template.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: emailHtml }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      // Sanitize HTML error responses from upstream
      if (errorText.includes("<html") || errorText.includes("<!DOCTYPE")) {
        throw new Error("Upstream service temporarily unavailable");
      }
      throw new Error(`Resend error: ${errorText}`);
    }

    const result = await res.json();
    console.log(`[send-email] Sent ${template || "custom"} email to ${to}, id: ${result.id}`);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[send-email] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildWelcomeEmail(data: { name?: string }): string {
  const name = data?.name || "Trader";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ChartingPath</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background-color:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
          <span style="color:#f97316;font-size:20px;font-weight:700;letter-spacing:-0.5px;">ChartingPath</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background-color:#ffffff;padding:32px;">
          <h1 style="color:#0f172a;font-size:24px;margin:0 0 16px 0;">Welcome, ${name} 👋</h1>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
            You now have access to AI-powered chart pattern detection, backtesting, and agent scoring — everything you need to find high-probability trade setups.
          </p>
          <a href="https://chartingpath.com/patterns/live" style="display:inline-block;background-color:#f97316;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            See Live Patterns →
          </a>
        </td></tr>
        <!-- Steps -->
        <tr><td style="background-color:#fff7ed;padding:32px;">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 20px 0;">Get started in 3 steps:</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 16px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-weight:700;font-size:14px;vertical-align:middle;" align="center">1</td>
                <td style="padding-left:12px;">
                  <strong style="color:#0f172a;">Browse live pattern detections</strong><br/>
                  <span style="color:#64748b;font-size:14px;">The Screener shows real-time chart patterns across forex, crypto, stocks and indices.</span>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:0 0 16px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-weight:700;font-size:14px;vertical-align:middle;" align="center">2</td>
                <td style="padding-left:12px;">
                  <strong style="color:#0f172a;">Run a backtest in Pattern Lab</strong><br/>
                  <span style="color:#64748b;font-size:14px;">Pick any pattern and instrument to see its historical win rate, expectancy, and R:R over years of data.</span>
                </td>
              </tr></table>
            </td></tr>
            <tr><td>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-weight:700;font-size:14px;vertical-align:middle;" align="center">3</td>
                <td style="padding-left:12px;">
                  <strong style="color:#0f172a;">Set up pattern alerts</strong><br/>
                  <span style="color:#64748b;font-size:14px;">Get emailed when a specific pattern is detected on your favourite instruments. Never miss a setup again.</span>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:#f8fafc;padding:24px 32px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#94a3b8;font-size:13px;margin:0 0 8px 0;">You're receiving this because you signed up at chartingpath.com</p>
          <p style="margin:0;">
            <a href="https://chartingpath.com/members/dashboard" style="color:#f97316;font-size:13px;text-decoration:none;">Dashboard</a> ·
            <a href="https://chartingpath.com/patterns/live" style="color:#f97316;font-size:13px;text-decoration:none;">Screener</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildGettingStartedEmail(data: { name?: string }): string {
  const name = data?.name || "Trader";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your first backtest</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background-color:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
          <span style="color:#f97316;font-size:20px;font-weight:700;">ChartingPath</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:32px;">
          <h1 style="color:#0f172a;font-size:24px;margin:0 0 16px 0;">Your first backtest takes 60 seconds ⚡</h1>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
            Hi ${name}, Pattern Lab lets you validate any chart pattern against years of historical data before risking a single dollar.
          </p>
          <ol style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px 0;">
            <li>Go to <strong>Pattern Lab</strong></li>
            <li>Choose an instrument (e.g. EURUSD, AAPL, BTC-USD)</li>
            <li>Choose a pattern (e.g. Bull Flag, Double Bottom)</li>
            <li>Hit <strong>Run</strong> — results in under 30 seconds</li>
          </ol>
          <a href="https://chartingpath.com/members/pattern-lab" style="display:inline-block;background-color:#f97316;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            Run My First Backtest →
          </a>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#94a3b8;font-size:13px;margin:0;">
            <a href="https://chartingpath.com/members/dashboard" style="color:#f97316;text-decoration:none;">Dashboard</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
