import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "ChartingPath <hello@chartingpath.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Hardcoded English fallback (matches en.json emails.* keys) ──────────
const EN_EMAILS: Record<string, Record<string, string>> = {
  welcome: {
    subject: "Welcome to ChartingPath 👋",
    greeting: "Welcome, {{name}} 👋",
    body: "You now have access to AI-powered chart pattern detection, backtesting, and agent scoring — everything you need to find high-probability trade setups.",
    cta: "See Live Patterns →",
    stepsTitle: "Get started in 3 steps:",
    step1Title: "Browse live pattern detections",
    step1Desc: "The Screener shows real-time chart patterns across forex, crypto, stocks and indices.",
    step2Title: "Run a backtest in Pattern Lab",
    step2Desc: "Pick any pattern and instrument to see its historical win rate, expectancy, and R:R over years of data.",
    step3Title: "Set up pattern alerts",
    step3Desc: "Get emailed when a specific pattern is detected on your favourite instruments. Never miss a setup again.",
    footer: "You're receiving this because you signed up at chartingpath.com",
    dashboard: "Dashboard",
    screener: "Screener",
  },
  gettingStarted: {
    subject: "Your first backtest takes 60 seconds ⚡",
    greeting: "Your first backtest takes 60 seconds ⚡",
    body: "Hi {{name}}, Pattern Lab lets you validate any chart pattern against years of historical data before risking a single dollar.",
    step1: "Go to Pattern Lab",
    step2: "Choose an instrument (e.g. EURUSD, AAPL, BTC-USD)",
    step3: "Choose a pattern (e.g. Bull Flag, Double Bottom)",
    step4: "Hit Run — results in under 30 seconds",
    cta: "Run My First Backtest →",
    dashboard: "Dashboard",
  },
};

/**
 * Fetch translated strings for a given template + language from the translations table.
 * Falls back to English hardcoded strings if DB lookup fails or returns nothing.
 */
async function getEmailStrings(
  templateName: string,
  language: string
): Promise<Record<string, string>> {
  const enFallback = EN_EMAILS[templateName] || {};

  if (language === "en") return enFallback;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Keys are stored as "emails.welcome.greeting", "emails.welcome.body", etc.
    const prefix = templateName === "getting_started" ? "emails.gettingStarted." : `emails.${templateName}.`;

    const { data, error } = await supabase
      .from("translations")
      .select("key, value")
      .eq("language_code", language)
      .eq("status", "approved")
      .like("key", `${prefix}%`);

    if (error || !data || data.length === 0) {
      console.warn(`[send-email] No ${language} translations for ${templateName}, using English`);
      return enFallback;
    }

    // Build map stripping the prefix: "emails.welcome.greeting" → "greeting"
    const translated: Record<string, string> = { ...enFallback };
    for (const row of data) {
      const shortKey = row.key.replace(prefix, "");
      if (shortKey && row.value) {
        translated[shortKey] = row.value;
      }
    }
    return translated;
  } catch (err) {
    console.warn(`[send-email] Translation fetch error for ${language}:`, err);
    return enFallback;
  }
}

/** Replace {{var}} placeholders */
function interpolate(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, subject, html, template, data, language } = await req.json();
    const lang = language || "en";

    let emailHtml = html;
    let emailSubject = subject;

    if (template === "welcome") {
      const s = await getEmailStrings("welcome", lang);
      const vars = { name: data?.name || "Trader" };
      emailSubject = emailSubject || interpolate(s.subject, vars);
      emailHtml = buildWelcomeEmail(s, vars);
    }
    if (template === "getting_started") {
      const s = await getEmailStrings("gettingStarted", lang);
      const vars = { name: data?.name || "Trader" };
      emailSubject = emailSubject || interpolate(s.subject, vars);
      emailHtml = buildGettingStartedEmail(s, vars);
    }

    if (!emailHtml) {
      throw new Error("No email content provided. Specify html or a valid template.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject: emailSubject, html: emailHtml }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("<html") || errorText.includes("<!DOCTYPE")) {
        throw new Error("Upstream service temporarily unavailable");
      }
      throw new Error(`Resend error: ${errorText}`);
    }

    const result = await res.json();
    console.log(`[send-email] Sent ${template || "custom"} email (${lang}) to ${to}, id: ${result.id}`);

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

// ── Template builders (now accept translated string maps) ───────────────

function buildWelcomeEmail(s: Record<string, string>, vars: Record<string, string>): string {
  const i = (key: string) => interpolate(s[key] || "", vars);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChartingPath</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background-color:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
          <span style="color:#f97316;font-size:20px;font-weight:700;letter-spacing:-0.5px;">ChartingPath</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:32px;">
          <h1 style="color:#0f172a;font-size:24px;margin:0 0 16px 0;">${i("greeting")}</h1>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px 0;">${i("body")}</p>
          <a href="https://chartingpath.com/patterns/live" style="display:inline-block;background-color:#f97316;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            ${i("cta")}
          </a>
        </td></tr>
        <tr><td style="background-color:#fff7ed;padding:32px;">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 20px 0;">${i("stepsTitle")}</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 16px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-weight:700;font-size:14px;vertical-align:middle;" align="center">1</td>
                <td style="padding-left:12px;">
                  <strong style="color:#0f172a;">${i("step1Title")}</strong><br/>
                  <span style="color:#64748b;font-size:14px;">${i("step1Desc")}</span>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:0 0 16px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-weight:700;font-size:14px;vertical-align:middle;" align="center">2</td>
                <td style="padding-left:12px;">
                  <strong style="color:#0f172a;">${i("step2Title")}</strong><br/>
                  <span style="color:#64748b;font-size:14px;">${i("step2Desc")}</span>
                </td>
              </tr></table>
            </td></tr>
            <tr><td>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;text-align:center;font-weight:700;font-size:14px;vertical-align:middle;" align="center">3</td>
                <td style="padding-left:12px;">
                  <strong style="color:#0f172a;">${i("step3Title")}</strong><br/>
                  <span style="color:#64748b;font-size:14px;">${i("step3Desc")}</span>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:24px 32px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#94a3b8;font-size:13px;margin:0 0 8px 0;">${i("footer")}</p>
          <p style="margin:0;">
            <a href="https://chartingpath.com/members/dashboard" style="color:#f97316;font-size:13px;text-decoration:none;">${i("dashboard")}</a> ·
            <a href="https://chartingpath.com/patterns/live" style="color:#f97316;font-size:13px;text-decoration:none;">${i("screener")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildGettingStartedEmail(s: Record<string, string>, vars: Record<string, string>): string {
  const i = (key: string) => interpolate(s[key] || "", vars);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChartingPath</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background-color:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
          <span style="color:#f97316;font-size:20px;font-weight:700;">ChartingPath</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:32px;">
          <h1 style="color:#0f172a;font-size:24px;margin:0 0 16px 0;">${i("greeting")}</h1>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">${i("body")}</p>
          <ol style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px 0;">
            <li>${i("step1")}</li>
            <li>${i("step2")}</li>
            <li>${i("step3")}</li>
            <li>${i("step4")}</li>
          </ol>
          <a href="https://chartingpath.com/members/pattern-lab" style="display:inline-block;background-color:#f97316;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            ${i("cta")}
          </a>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#94a3b8;font-size:13px;margin:0;">
            <a href="https://chartingpath.com/members/dashboard" style="color:#f97316;text-decoration:none;">${i("dashboard")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
