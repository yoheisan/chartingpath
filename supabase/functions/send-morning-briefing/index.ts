import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "ChartingPath <hello@chartingpath.com>";
const APP_URL = "https://chartingpath.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get users who have opted into morning briefing emails
    // For now, send to all users with email preferences who haven't unsubscribed
    const { data: users, error: usersErr } = await supabase
      .from("user_email_preferences")
      .select("user_id")
      .eq("unsubscribed", false);

    if (usersErr) throw usersErr;

    let sentCount = 0;
    let errorCount = 0;

    for (const { user_id } of users || []) {
      try {
        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
        if (!authUser?.user?.email) continue;

        const email = authUser.user.email;
        const name = authUser.user.user_metadata?.full_name || "Trader";

        // Fetch user's watchlist
        const { data: watchlist } = await supabase
          .from("user_watchlist")
          .select("symbol")
          .eq("user_id", user_id);

        const watchlistSymbols = (watchlist || []).map((w: any) => w.symbol);

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

        // Fetch paper trading portfolio
        const { data: portfolio } = await supabase
          .from("paper_portfolios")
          .select("current_balance, total_pnl")
          .eq("user_id", user_id)
          .maybeSingle();

        // Fetch open trades
        const { data: openTrades } = await supabase
          .from("paper_trades")
          .select("symbol, pnl, status")
          .eq("user_id", user_id)
          .eq("status", "open");

        // Fetch recently closed trades (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: closedTrades } = await supabase
          .from("paper_trades")
          .select("symbol, pnl, close_reason, outcome_r")
          .eq("user_id", user_id)
          .eq("status", "closed")
          .gte("closed_at", yesterday)
          .limit(5);

        // Fetch top AI verdicts
        const { data: topScores } = await supabase
          .from("agent_scores")
          .select("instrument, detection_id, analyst_raw, risk_raw, timing_raw, portfolio_raw, is_proven, win_rate, expectancy_r")
          .eq("is_proven", true)
          .order("scored_at", { ascending: false })
          .limit(10);

        let topVerdicts: any[] = [];
        if (topScores && topScores.length > 0) {
          const ids = topScores.map((s: any) => s.detection_id);
          const { data: dets } = await supabase
            .from("live_pattern_detections")
            .select("id, pattern_name")
            .in("id", ids)
            .eq("status", "active");

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

        // Build email HTML
        const html = buildBriefingEmail({
          name,
          watchlistSignals,
          portfolio,
          openTrades: openTrades || [],
          closedTrades: closedTrades || [],
          topVerdicts,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject: `☀️ Your Morning Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
          html,
        });

        sentCount++;
      } catch (userErr) {
        console.error(`[morning-briefing] Error for user ${user_id}:`, userErr);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, errors: errorCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[morning-briefing] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface BriefingData {
  name: string;
  watchlistSignals: any[];
  portfolio: any;
  openTrades: any[];
  closedTrades: any[];
  topVerdicts: any[];
}

function buildBriefingEmail(data: BriefingData): string {
  const { name, watchlistSignals, portfolio, openTrades, closedTrades, topVerdicts } = data;

  const totalPnl = portfolio?.total_pnl ?? 0;
  const balance = portfolio?.current_balance ?? 100000;
  const pnlColor = totalPnl >= 0 ? "#10b981" : "#ef4444";
  const pnlSign = totalPnl >= 0 ? "+" : "";

  const signalsHtml = watchlistSignals.length > 0
    ? watchlistSignals.map((s: any) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${s.instrument}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${s.pattern_name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:${s.direction === 'long' ? '#10b981' : '#ef4444'};">${s.direction === 'long' ? '▲ Long' : '▼ Short'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${s.timeframe}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${(s.risk_reward_ratio || 0).toFixed(1)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#888;font-size:13px;">No active signals on your watchlist today</td></tr>`;

  const verdictsHtml = topVerdicts.length > 0
    ? topVerdicts.map((v: any) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600;">${v.instrument}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${v.patternName}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;color:#f97316;">${v.composite}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${v.winRate ? v.winRate + '%' : '—'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${v.expectancyR ? v.expectancyR + 'R' : '—'}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#888;font-size:13px;">No proven signals today</td></tr>`;

  const openTradesHtml = openTrades.length > 0
    ? `<p style="font-size:13px;color:#555;">You have <strong>${openTrades.length}</strong> open position(s) being monitored.</p>`
    : `<p style="font-size:13px;color:#888;">No open positions.</p>`;

  const closedTradesHtml = closedTrades.length > 0
    ? `<p style="font-size:13px;color:#555;"><strong>${closedTrades.length}</strong> trade(s) closed in the last 24 hours:</p>
       <ul style="padding-left:20px;margin:4px 0 0;">
         ${closedTrades.map((t: any) => {
           const pnl = t.pnl || 0;
           const rMultiple = t.outcome_r ? ` (${t.outcome_r >= 0 ? '+' : ''}${t.outcome_r.toFixed(1)}R)` : '';
           return `<li style="font-size:13px;color:${pnl >= 0 ? '#10b981' : '#ef4444'};margin-bottom:2px;">${t.symbol}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}${rMultiple}</li>`;
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
      <h1 style="margin:0;font-size:22px;font-weight:700;">Good morning, ${name}</h1>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.8;">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
    </div>

    <div style="background:white;padding:24px 28px;border-radius:0 0 12px 12px;">
      <!-- Portfolio Snapshot -->
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">💼 Portfolio</p>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div>
            <p style="margin:0;font-size:12px;color:#64748b;">Balance</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:700;">$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-size:12px;color:#64748b;">Total P&L</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:${pnlColor};">${pnlSign}$${totalPnl.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <!-- Paper Trades -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">📊 Paper Trades</p>
        ${openTradesHtml}
        ${closedTradesHtml}
      </div>

      <!-- Watchlist Signals -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">👁️ Watchlist Signals</p>
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
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:600;">⚡ Top AI Verdicts</p>
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

      <!-- CTA -->
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/members/dashboard" style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Open Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">
      You're receiving this because you signed up at chartingpath.com.<br/>
      <a href="${APP_URL}/settings" style="color:#94a3b8;">Manage email preferences</a>
    </p>
  </div>
</body>
</html>`;
}
