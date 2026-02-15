import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active services
    const { data: services, error: svcErr } = await supabase
      .from("service_registry")
      .select("*")
      .eq("is_active", true);

    if (svcErr) throw svcErr;

    const results = [];

    // Ping each service in parallel
    const checks = (services || []).map(async (svc) => {
      if (!svc.health_endpoint) return null;

      const start = Date.now();
      let status = "up";
      let statusCode: number | null = null;
      let errorMessage: string | null = null;
      let latencyMs: number | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(svc.health_endpoint, {
          method: "OPTIONS",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        latencyMs = Date.now() - start;
        statusCode = res.status;

        if (statusCode >= 500) {
          status = "down";
          errorMessage = `HTTP ${statusCode}`;
        } else if (latencyMs > 5000) {
          status = "degraded";
          errorMessage = `High latency: ${latencyMs}ms`;
        }
      } catch (err) {
        latencyMs = Date.now() - start;
        if (err instanceof DOMException && err.name === "AbortError") {
          status = "timeout";
          errorMessage = "Request timed out after 10s";
        } else {
          status = "down";
          errorMessage = err.message || "Unknown error";
        }
      }

      return {
        service_name: svc.service_name,
        status,
        latency_ms: latencyMs,
        status_code: statusCode,
        error_message: errorMessage,
        checked_at: new Date().toISOString(),
      };
    });

    const checkResults = (await Promise.all(checks)).filter(Boolean);

    // Insert all results
    if (checkResults.length > 0) {
      const { error: insertErr } = await supabase
        .from("service_health_checks")
        .insert(checkResults);
      if (insertErr) console.error("Insert error:", insertErr);
    }

    // Send email alerts for unhealthy services
    const unhealthyServices = checkResults.filter(
      (r) => r && r.status !== "up"
    );
    if (unhealthyServices.length > 0) {
      await sendHealthAlertEmail(supabase, unhealthyServices);
    }

    // Also check data seeding health
    await checkDataSeedingHealth(supabase);

    // Cleanup old records (keep 7 days)
    await supabase.rpc("cleanup_old_health_checks");

    return new Response(
      JSON.stringify({
        ok: true,
        checked: checkResults.length,
        results: checkResults,
        alerts_sent: unhealthyServices.length > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Health ping error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendHealthAlertEmail(supabase: any, unhealthyServices: any[]) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set, skipping health alert email");
    return;
  }

  try {
    // Get admin emails
    const { data: admins, error: adminErr } = await supabase
      .from("user_roles")
      .select("user_id, profiles(email)")
      .in("role", ["admin", "super_admin"]);

    if (adminErr || !admins?.length) {
      console.warn("No admin users found for health alerts");
      return;
    }

    const adminEmails = admins
      .map((a: any) => a.profiles?.email)
      .filter(Boolean);

    if (adminEmails.length === 0) return;

    const resend = new Resend(resendKey);

    const statusEmoji: Record<string, string> = {
      down: "🔴",
      degraded: "🟡",
      timeout: "🟠",
    };

    const serviceRows = unhealthyServices
      .map(
        (s) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a3d;">${statusEmoji[s.status] || "⚪"} ${s.service_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a3d;text-transform:uppercase;font-weight:600;color:${s.status === 'down' ? '#ef4444' : s.status === 'timeout' ? '#f97316' : '#eab308'}">${s.status}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a3d;">${s.latency_ms != null ? s.latency_ms + 'ms' : '—'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a3d;color:#94a3b8;">${s.error_message || '—'}</td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin:0;padding:0;background:#0a0a14;font-family:Arial,sans-serif;color:#e2e8f0;">
        <div style="max-width:640px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="margin:0;color:#fff;">⚠️ Service Health Alert</h2>
            <p style="margin:8px 0 0;color:#fca5a5;font-size:14px;">${unhealthyServices.length} service(s) reporting issues — ${new Date().toUTCString()}</p>
          </div>
          <div style="background:#111118;padding:24px;border-radius:0 0 12px 12px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="color:#94a3b8;text-align:left;">
                  <th style="padding:8px 12px;border-bottom:2px solid #2a2a3d;">Service</th>
                  <th style="padding:8px 12px;border-bottom:2px solid #2a2a3d;">Status</th>
                  <th style="padding:8px 12px;border-bottom:2px solid #2a2a3d;">Latency</th>
                  <th style="padding:8px 12px;border-bottom:2px solid #2a2a3d;">Error</th>
                </tr>
              </thead>
              <tbody>${serviceRows}</tbody>
            </table>
            <p style="margin:20px 0 0;font-size:12px;color:#64748b;">This alert was sent automatically by the ChartingPath health monitoring system.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "Health Alerts <alerts@chartingpath.com>",
      to: adminEmails,
      subject: `⚠️ Service Alert: ${unhealthyServices.map((s) => s.service_name).join(", ")} ${unhealthyServices[0].status.toUpperCase()}`,
      html,
    });

    console.log(`Health alert email sent to ${adminEmails.length} admin(s)`);
  } catch (err) {
    console.error("Failed to send health alert email:", err);
  }
}

async function checkDataSeedingHealth(supabase: any) {
  try {
    const assetClasses = [
      { class: "stocks", patterns: ["US_%", "AAPL%"] },
      { class: "fx", patterns: ["EUR%", "GBP%", "USD%"] },
      { class: "crypto", patterns: ["BTC%", "ETH%"] },
      { class: "indices", patterns: ["%GSPC%", "%DJI%"] },
    ];

    for (const ac of assetClasses) {
      const { count: recentCount } = await supabase
        .from("historical_prices")
        .select("symbol", { count: "exact", head: true })
        .gte("timestamp", new Date(Date.now() - 3 * 86400000).toISOString());

      const { count: totalCount } = await supabase
        .from("live_pattern_detections")
        .select("instrument", { count: "exact", head: true })
        .eq("status", "active");

      await supabase.from("data_seeding_status").upsert(
        {
          source: "eodhd",
          asset_class: ac.class,
          total_tickers: totalCount || 0,
          seeded_tickers: recentCount || 0,
          failed_tickers: 0,
          last_seed_at: new Date().toISOString(),
          checked_at: new Date().toISOString(),
        },
        { onConflict: "source,asset_class", ignoreDuplicates: false }
      );
    }
  } catch (err) {
    console.error("Seeding health check error:", err);
  }
}
