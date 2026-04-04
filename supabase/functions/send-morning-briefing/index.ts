import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
const FROM_EMAIL = "ChartingPath <hello@chartingpath.com>";
const APP_URL = "https://chartingpath.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map timezone to relevant markets
function getRelevantMarkets(tz: string): { region: string; markets: string[]; description: string } {
  if (tz.includes("Asia") || tz.includes("Tokyo") || tz.includes("Hong_Kong") || tz.includes("Singapore") || tz.includes("Shanghai") || tz.includes("Seoul")) {
    return { region: "Asia-Pacific", markets: ["crypto", "asia"], description: "Asian session with US market recap" };
  }
  if (tz.includes("Europe") || tz.includes("London") || tz.includes("Paris") || tz.includes("Berlin") || tz.includes("Amsterdam")) {
    return { region: "Europe", markets: ["forex", "europe", "stocks"], description: "European session with US market preview" };
  }
  if (tz.includes("Australia") || tz.includes("Sydney") || tz.includes("Melbourne")) {
    return { region: "Oceania", markets: ["crypto", "asia", "commodities"], description: "Oceania session with global market recap" };
  }
  return { region: "Americas", markets: ["stocks", "forex", "crypto"], description: "US session with market outlook" };
}

// Map language codes to full names for Gemini
function languageName(code: string): string {
  const map: Record<string, string> = {
    en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
    it: "Italian", nl: "Dutch", ja: "Japanese", ko: "Korean", zh: "Chinese",
    ar: "Arabic", hi: "Hindi", ru: "Russian", tr: "Turkish", pl: "Polish",
    sv: "Swedish", th: "Thai",
  };
  return map[code] || "English";
}

async function fetchEODHDQuote(eodhSymbol: string): Promise<number | null> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!EODHD_API_KEY) return null;
  try {
    const url = `https://eodhd.com/api/real-time/${eodhSymbol}?api_token=${EODHD_API_KEY}&fmt=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.close || data.previousClose || null;
  } catch { return null; }
}

async function fetchBreadthFromEODHDBulk(): Promise<{ advances: number; declines: number; unchanged: number } | null> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!EODHD_API_KEY) return null;
  try {
    const url = `https://eodhd.com/api/eod-bulk-last-day/US?api_token=${EODHD_API_KEY}&fmt=json&filter=extended`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 100) return null;

    let advances = 0, declines = 0, unchanged = 0;
    for (const item of data) {
      const change = item.change_p ?? item.change ?? 0;
      if (change > 0) advances++;
      else if (change < 0) declines++;
      else unchanged++;
    }
    console.log(`[morning-briefing] EODHD bulk breadth: ${advances} adv / ${declines} dec / ${unchanged} unch`);
    return { advances, declines, unchanged };
  } catch (err) {
    console.error("[morning-briefing] EODHD bulk fetch error:", err);
    return null;
  }
}

async function fetchMarketBreadth(): Promise<{ advances: number; declines: number; vix: number | null; sentiment: string; dataAvailable: boolean }> {
  const [bulkBreadth, vix] = await Promise.all([
    fetchBreadthFromEODHDBulk(),
    fetchEODHDQuote("VIX.INDX"),
  ]);

  if (bulkBreadth && (bulkBreadth.advances + bulkBreadth.declines) > 100) {
    const ratio = bulkBreadth.declines > 0 ? bulkBreadth.advances / bulkBreadth.declines : 1;
    let sentiment = "neutral";
    if (ratio >= 1.5) sentiment = "bullish";
    else if (ratio >= 1.0) sentiment = "neutral-bullish";
    else if (ratio >= 0.67) sentiment = "neutral-bearish";
    else sentiment = "bearish";
    return { advances: bulkBreadth.advances, declines: bulkBreadth.declines, vix, sentiment, dataAvailable: true };
  }

  // No real data available — return honest "unavailable" instead of fake numbers
  console.warn("[morning-briefing] Market breadth data unavailable — no fallback used");
  return { advances: 0, declines: 0, vix, sentiment: "unavailable", dataAvailable: false };
}

async function fetchMarketPrices(): Promise<Record<string, { price: number; change: string }>> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  const symbols = [
    { key: "SPY", eod: "SPY.US" },
    { key: "QQQ", eod: "QQQ.US" },
    { key: "BTC", eod: "BTC-USD.CC" },
    { key: "ETH", eod: "ETH-USD.CC" },
    { key: "EUR/USD", eod: "EURUSD.FOREX" },
    { key: "Gold", eod: "GC.COMEX" },
  ];

  const results: Record<string, { price: number; change: string }> = {};
  if (!EODHD_API_KEY) return results;

  await Promise.all(symbols.map(async ({ key, eod }) => {
    try {
      const url = `https://eodhd.com/api/real-time/${eod}?api_token=${EODHD_API_KEY}&fmt=json`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const current = data.close || data.previousClose || 0;
      const prev = data.previousClose || data.open || current;
      const pct = prev > 0 ? ((current - prev) / prev * 100).toFixed(2) : "0.00";
      results[key] = { price: current, change: `${Number(pct) >= 0 ? "+" : ""}${pct}%` };
    } catch { /* skip */ }
  }));
  return results;
}

async function generateTranslatedBriefing(params: {
  language: string;
  region: string;
  userName: string;
  breadth: { advances: number; declines: number; vix: number | null; sentiment: string; dataAvailable: boolean };
  prices: Record<string, { price: number; change: string }>;
  watchlistSignals: any[];
  portfolio: any;
  openTrades: any[];
  closedTrades: any[];
  topVerdicts: any[];
  timezone: string;
  hasMasterPlan: boolean;
}): Promise<{ subject: string; greeting: string; briefingHtml: string; labels: Record<string, string> }> {
  const { language, region, userName, breadth, prices, watchlistSignals, portfolio, openTrades, closedTrades, topVerdicts, timezone, hasMasterPlan } = params;
  const langName = languageName(language);
  const userTime = new Date().toLocaleString("en-US", { timeZone: timezone, dateStyle: "full", timeStyle: "short" });

  const pricesSummary = Object.entries(prices).map(([k, v]) => `${k}: $${v.price} (${v.change})`).join("\n");

  const prompt = `You are a professional financial market analyst writing a morning briefing email.

WRITE ENTIRELY IN ${langName.toUpperCase()}. Every word must be in ${langName}.

Context:
- Reader: ${userName}, located in ${region} (${timezone})
- Local time: ${userTime}

MARKET BREADTH DATA:
${breadth.dataAvailable ? `- NYSE Advances: ${breadth.advances}, Declines: ${breadth.declines}
- Advance/Decline Ratio: ${(breadth.advances / Math.max(breadth.declines, 1)).toFixed(2)}
- VIX: ${breadth.vix ?? "N/A"}
- Overall Sentiment: ${breadth.sentiment}` : "- Market breadth data is unavailable today. Do NOT make up breadth numbers. Mention that breadth data was not available."}

IMPORTANT: This is a weekday briefing. Do NOT say "as the trading day unfolds" if the local time suggests markets may be closed. Be factual about market hours.

MARKET PRICES:
${pricesSummary}

WATCHLIST SIGNALS (${watchlistSignals.length}):
${watchlistSignals.length > 0 ? watchlistSignals.map(s => `${s.instrument} - ${s.pattern_name} (${s.direction}, ${s.timeframe})`).join("\n") : "None active"}

PORTFOLIO:
- Balance: $${(portfolio?.current_balance ?? 100000).toLocaleString()}
- P&L: $${(portfolio?.total_pnl ?? 0).toFixed(2)}
- Open trades: ${openTrades.length}
- Recently closed: ${closedTrades.length}

TOP AI VERDICTS:
${topVerdicts.length > 0 ? topVerdicts.map((v: any) => `${v.instrument} (${v.patternName}) - Score: ${v.composite}, Win: ${v.winRate || "N/A"}%`).join("\n") : "None"}

Generate a JSON response with:
1. "subject" - Email subject line (include ☀️ emoji, date in reader's locale)
2. "greeting" - Personal greeting for ${userName}
3. "market_breadth_summary" - 2-3 sentences analyzing market breadth and sentiment for the ${region} reader. Reference actual numbers.
4. "key_levels" - 2-3 sentences on key market levels/movers relevant to ${region}
5. "outlook" - 1-2 sentences on what to watch in the upcoming session
6. "labels" - An object with translated UI labels:
   - "market_breadth": translation of "Market Breadth"
   - "key_levels_label": translation of "Key Levels"
   - "outlook_label": translation of "Outlook"
   - "portfolio": translation of "Portfolio"
   - "paper_trades": translation of "Paper Trades"
   - "watchlist_signals": translation of "Watchlist Signals"
   - "ai_verdicts": translation of "AI Verdicts"
   - "open_dashboard": translation of "Open Dashboard"
   ${!hasMasterPlan ? `- "no_plan_title": translation of "You haven't set up a Trading Plan yet"
   - "no_plan_desc": translation of "Create a Trading Plan to unlock automated paper trading, performance tracking, and personalized AI-scored signals in your daily briefing."
   - "create_plan": translation of "Create Trading Plan"` : ""}

Keep total content under 250 words (excluding labels). Be factual and reference exact data provided. Professional but approachable tone.`;

  const defaultLabels: Record<string, string> = {
    market_breadth: "Market Breadth", key_levels_label: "Key Levels", outlook_label: "Outlook",
    portfolio: "Portfolio", paper_trades: "Paper Trades", watchlist_signals: "Watchlist Signals",
    ai_verdicts: "AI Verdicts", open_dashboard: "Open Dashboard",
    no_plan_title: "You haven't set up a Trading Plan yet",
    no_plan_desc: "Create a Trading Plan to unlock automated paper trading, performance tracking, and personalized AI-scored signals in your daily briefing.",
    create_plan: "Create Trading Plan",
  };

  if (!GEMINI_API_KEY) {
    return {
      subject: `☀️ Morning Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
      greeting: `Good morning, ${userName}`,
      briefingHtml: `<p>Market breadth: ${breadth.advances} advances vs ${breadth.declines} declines (${breadth.sentiment}). VIX: ${breadth.vix ?? "N/A"}</p>`,
      labels: defaultLabels,
    };
  }

  try {
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, responseMimeType: "application/json" },
      }),
    });

    if (!aiRes.ok) throw new Error(`Gemini error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text);
    const labels = { ...defaultLabels, ...(parsed.labels || {}) };

    const briefingHtml = `
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">📊 ${labels.market_breadth}</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13px;color:#16a34a;font-weight:600;">▲ ${breadth.advances}</span>
            <span style="font-size:13px;color:#dc2626;font-weight:600;">▼ ${breadth.declines}</span>
            <span style="font-size:13px;color:#6b7280;">VIX: ${breadth.vix?.toFixed(1) ?? "N/A"}</span>
            <span style="font-size:13px;font-weight:700;color:${breadth.sentiment.includes("bull") ? "#16a34a" : breadth.sentiment.includes("bear") ? "#dc2626" : "#6b7280"};">${breadth.sentiment.toUpperCase()}</span>
          </div>
          <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">${parsed.market_breadth_summary || ""}</p>
        </div>
      </div>
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">📈 ${labels.key_levels_label}</p>
        <p style="font-size:13px;color:#374151;line-height:1.5;margin:0;">${parsed.key_levels || ""}</p>
      </div>
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">🔮 ${labels.outlook_label}</p>
        <p style="font-size:13px;color:#374151;line-height:1.5;margin:0;">${parsed.outlook || ""}</p>
      </div>`;

    return {
      subject: parsed.subject || `☀️ Morning Briefing`,
      greeting: parsed.greeting || `Good morning, ${userName}`,
      briefingHtml,
      labels,
    };
  } catch (err) {
    console.error("[morning-briefing] Gemini error:", err);
    return {
      subject: `☀️ Morning Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
      greeting: `Good morning, ${userName}`,
      briefingHtml: `<p>Market breadth: ${breadth.advances} advances vs ${breadth.declines} declines (${breadth.sentiment}).</p>`,
      labels: defaultLabels,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Weekend guard — skip on Saturday/Sunday (markets closed)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      console.log("[morning-briefing] Skipping — weekend (UTC day:", dayOfWeek, ")");
      return new Response(JSON.stringify({ success: true, sent: 0, message: "Skipped — weekend" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get users who have opted into morning briefing emails
    const { data: users, error: usersErr } = await supabase
      .from("user_email_preferences")
      .select("user_id, timezone, morning_briefing_enabled")
      .eq("unsubscribed", false)
      .eq("morning_briefing_enabled", true);

    if (usersErr) throw usersErr;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch market data once for all users
    const [breadth, prices] = await Promise.all([
      fetchMarketBreadth(),
      fetchMarketPrices(),
    ]);

    console.log(`[morning-briefing] Processing ${users.length} subscribers. Breadth: ${breadth.sentiment}`);

    let sentCount = 0;
    let errorCount = 0;

    for (const { user_id, timezone: userTz } of users) {
      try {
        const tz = userTz || "America/New_York";

        // Get user email + language in parallel
        const [authUserRes, langRes] = await Promise.all([
          supabase.auth.admin.getUserById(user_id),
          supabase.from("user_language_preferences").select("language_code").eq("user_id", user_id).maybeSingle(),
        ]);

        const authUser = authUserRes.data;
        if (!authUser?.user?.email) continue;

        const email = authUser.user.email;
        const name = authUser.user.user_metadata?.full_name || "Trader";
        const language = langRes.data?.language_code || "en";
        const { region } = getRelevantMarkets(tz);

        // Fetch user-specific data in parallel
        const [watchlistRes, portfolioRes, openTradesRes, closedTradesRes, topScoresRes, masterPlansRes] = await Promise.all([
          supabase.from("user_watchlist").select("symbol").eq("user_id", user_id),
          supabase.from("paper_portfolios").select("current_balance, total_pnl").eq("user_id", user_id).maybeSingle(),
          supabase.from("paper_trades").select("symbol, pnl, status").eq("user_id", user_id).eq("status", "open"),
          supabase.from("paper_trades").select("symbol, pnl, close_reason, outcome_r").eq("user_id", user_id).eq("status", "closed").gte("closed_at", new Date(Date.now() - 86400000).toISOString()).limit(5),
          supabase.from("agent_scores").select("instrument, detection_id, analyst_raw, risk_raw, timing_raw, portfolio_raw, is_proven, win_rate, expectancy_r").eq("is_proven", true).order("scored_at", { ascending: false }).limit(10),
          supabase.from("master_plans").select("id").eq("user_id", user_id).eq("is_active", true).limit(1),
        ]);

        const watchlistSymbols = (watchlistRes.data || []).map((w: any) => w.symbol);

        // Fetch watchlist signals
        let watchlistSignals: any[] = [];
        if (watchlistSymbols.length > 0) {
          const { data: patterns } = await supabase
            .from("live_pattern_detections")
            .select("instrument, pattern_name, direction, timeframe, risk_reward_ratio, trend_alignment")
            .eq("status", "active")
            .in("instrument", watchlistSymbols)
            .limit(10);
          watchlistSignals = patterns || [];
        }

        // Build top verdicts
        let topVerdicts: any[] = [];
        const topScores = topScoresRes.data;
        if (topScores && topScores.length > 0) {
          const ids = topScores.map((s: any) => s.detection_id);
          const { data: dets } = await supabase
            .from("live_pattern_detections").select("id, pattern_name").in("id", ids).eq("status", "active");
          const detMap = new Map((dets || []).map((d: any) => [d.id, d.pattern_name]));
          topVerdicts = topScores
            .filter((s: any) => detMap.has(s.detection_id))
            .map((s: any) => ({
              instrument: s.instrument,
              patternName: detMap.get(s.detection_id),
              composite: ((s.analyst_raw + s.risk_raw + s.timing_raw + s.portfolio_raw) / 4 * 100).toFixed(0),
              winRate: s.win_rate ? s.win_rate.toFixed(0) : null,
              expectancyR: s.expectancy_r?.toFixed(2),
            }))
            .sort((a: any, b: any) => Number(b.composite) - Number(a.composite))
            .slice(0, 3);
        }

        const hasMasterPlan = (masterPlansRes.data?.length ?? 0) > 0;

        // Generate translated briefing with market breadth via Gemini
        const { subject, greeting, briefingHtml, labels } = await generateTranslatedBriefing({
          language,
          region,
          userName: name,
          breadth,
          prices,
          watchlistSignals,
          portfolio: portfolioRes.data,
          openTrades: openTradesRes.data || [],
          closedTrades: closedTradesRes.data || [],
          topVerdicts,
          timezone: tz,
          hasMasterPlan,
        });

        // Build final email HTML
        const html = buildFinalEmail({
          greeting,
          briefingHtml,
          watchlistSignals,
          portfolio: portfolioRes.data,
          openTrades: openTradesRes.data || [],
          closedTrades: closedTradesRes.data || [],
          topVerdicts,
          timezone: tz,
          language,
          hasMasterPlan,
          labels,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject,
          html,
        });

        sentCount++;
        console.log(`[morning-briefing] ✓ Sent to ${email} (${language}, ${region})`);
      } catch (userErr: any) {
        console.error(`[morning-briefing] Error for user ${user_id}:`, userErr);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, errors: errorCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[morning-briefing] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildFinalEmail(params: {
  greeting: string;
  briefingHtml: string;
  watchlistSignals: any[];
  portfolio: any;
  openTrades: any[];
  closedTrades: any[];
  topVerdicts: any[];
  timezone: string;
  language: string;
  hasMasterPlan: boolean;
  labels: Record<string, string>;
}): string {
  const { greeting, briefingHtml, watchlistSignals, portfolio, openTrades, closedTrades, topVerdicts, timezone, language, hasMasterPlan, labels } = params;

  const totalPnl = portfolio?.total_pnl ?? 0;
  const balance = portfolio?.current_balance ?? 100000;
  const pnlColor = totalPnl >= 0 ? "#10b981" : "#ef4444";
  const pnlSign = totalPnl >= 0 ? "+" : "";

  const dateStr = new Date().toLocaleDateString(language === "en" ? "en-US" : language, {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const signalsHtml = watchlistSignals.length > 0
    ? watchlistSignals.map((s: any) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${s.instrument}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${s.pattern_name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:${s.direction === "long" ? "#10b981" : "#ef4444"};">${s.direction === "long" ? "▲ Long" : "▼ Short"}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${s.timeframe}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${(s.risk_reward_ratio || 0).toFixed(1)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#888;font-size:13px;">—</td></tr>`;

  const verdictsHtml = topVerdicts.length > 0
    ? topVerdicts.map((v: any) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600;">${v.instrument}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${v.patternName}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;color:#f97316;">${v.composite}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${v.winRate ? v.winRate + "%" : "—"}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${v.expectancyR ? v.expectancyR + "R" : "—"}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#888;font-size:13px;">—</td></tr>`;

  const openTradesHtml = openTrades.length > 0
    ? `<p style="font-size:13px;color:#555;"><strong>${openTrades.length}</strong> open position(s)</p>`
    : `<p style="font-size:13px;color:#888;">—</p>`;

  const closedTradesHtml = closedTrades.length > 0
    ? `<ul style="padding-left:20px;margin:4px 0 0;">
         ${closedTrades.map((t: any) => {
           const pnl = t.pnl || 0;
           const rMultiple = t.outcome_r ? ` (${t.outcome_r >= 0 ? "+" : ""}${t.outcome_r.toFixed(1)}R)` : "";
           return `<li style="font-size:13px;color:${pnl >= 0 ? "#10b981" : "#ef4444"};margin-bottom:2px;">${t.symbol}: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}${rMultiple}</li>`;
         }).join("")}
       </ul>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px 12px 0 0;padding:24px 28px;color:white;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.7;">☀️ Morning Briefing</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;">${greeting}</h1>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.8;">${dateStr}</p>
    </div>

    <div style="background:white;padding:24px 28px;border-radius:0 0 12px 12px;">
      <!-- AI-Generated Market Breadth + Outlook (translated) -->
      ${briefingHtml}

      <!-- Portfolio Snapshot -->
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">💼 ${labels.portfolio}</p>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div>
            <p style="margin:0;font-size:12px;color:#64748b;">Balance</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:700;">$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-size:12px;color:#64748b;">P&L</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:${pnlColor};">${pnlSign}$${totalPnl.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <!-- Paper Trades -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">📊 ${labels.paper_trades}</p>
        ${openTradesHtml}
        ${closedTradesHtml}
      </div>

      <!-- Watchlist Signals -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">👁️ ${labels.watchlist_signals}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:6px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Symbol</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Pattern</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Dir</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">TF</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">R:R</th>
            </tr>
          </thead>
          <tbody>${signalsHtml}</tbody>
        </table>
      </div>

      <!-- Top AI Verdicts -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">⚡ ${labels.ai_verdicts}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:6px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Symbol</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Pattern</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Score</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Win%</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Exp</th>
            </tr>
          </thead>
          <tbody>${verdictsHtml}</tbody>
        </table>
      </div>

      ${!hasMasterPlan ? `
      <!-- Master Plan Nudge -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">⚠️ ${labels.no_plan_title}</p>
        <p style="margin:0 0 12px;font-size:13px;color:#78350f;line-height:1.5;">${labels.no_plan_desc}</p>
        <a href="${APP_URL}/members/copilot?action=new-plan" style="display:inline-block;background:#f97316;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
          ${labels.create_plan} →
        </a>
      </div>
      ` : ""}

      <!-- CTA -->
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/members/dashboard" style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          ${labels.open_dashboard} →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">
      ChartingPath · <a href="${APP_URL}/settings" style="color:#94a3b8;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
}
