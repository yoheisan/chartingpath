// =====================================================================
// DATA HEALTH RUNNER
//
// DESIGN PRINCIPLE: DETECT AND ALERT, NEVER AUTO-FIX.
// A job that silently "corrects" data destroys the evidence needed to
// find the real bug, and if the check is wrong it corrupts good data.
// The only thing that acts automatically is the write-time guard
// (guard_paper_trade_exit + the price sanity guards in manage-trades /
// monitor-paper-trades), which refuses a bad row before it exists.
// Everything in this function observes, records and notifies.
//
// LIMITATION: these checks only catch what we thought to assert. They
// would NOT have caught the Edge Atlas hardcoded positive-expectancy
// filter, which produced perfectly valid-looking data from flawed
// logic. This is a safety net, not a guarantee.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL") ?? "hello@chartingpath.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  check_name: string;
  severity: string;
  passed: boolean;
  observed_value: string | null;
  detail: unknown;
  duration_ms: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    let only: string | null = null;
    let manual = false;
    try {
      const body = await req.json();
      if (typeof body?.check_name === "string") only = body.check_name;
      manual = body?.manual === true;
    } catch {
      // no body — scheduled run
    }

    // Manual runs come from the admin UI and must prove admin identity.
    if (manual) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      const uid = userData?.user?.id;
      let isAdmin = false;
      if (uid) {
        const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
        isAdmin = data === true;
      }
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error } = await supabase.rpc("run_data_health_checks", { p_only: only });
    if (error) throw error;

    const results = (data ?? []) as CheckResult[];
    const failures = results.filter((r) => !r.passed);
    const criticalFailures = failures.filter((r) => r.severity === "critical");

    // ── Notifications: critical only, at most one per check per day ──
    const notified: string[] = [];
    for (const f of criticalFailures) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("data_health_results")
        .select("id", { count: "exact", head: true })
        .eq("check_name", f.check_name)
        .eq("passed", false)
        .eq("notified", true)
        .gte("run_at", since);

      if ((count ?? 0) > 0) continue; // already told someone today

      const expected = await supabase
        .from("data_health_checks")
        .select("expected_result, description")
        .eq("check_name", f.check_name)
        .maybeSingle();

      // "When did this last pass?" turns a bare failure into a time window
      // to search for the cause — the FX outage was invisible for 12 days
      // precisely because nobody could see when it stopped working.
      const { data: lastPass } = await supabase
        .from("data_health_results")
        .select("run_at")
        .eq("check_name", f.check_name)
        .eq("passed", true)
        .order("run_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const html = `
        <h2>Data health check failed: ${f.check_name}</h2>
        <p><strong>Severity:</strong> critical</p>
        <p><strong>Observed:</strong> ${f.observed_value ?? "n/a"}</p>
        <p><strong>Expected:</strong> ${expected.data?.expected_result ?? "n/a"}</p>
        <p><strong>Last passed:</strong> ${
          lastPass?.run_at ? new Date(lastPass.run_at).toUTCString() : "never recorded as passing"
        }</p>
        <p>${expected.data?.description ?? ""}</p>
        <pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:12px">${
          JSON.stringify(f.detail ?? {}, null, 2)
        }</pre>
        <p style="color:#71717a;font-size:12px">No data was changed. This is a detection-only check.</p>
      `;

      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: ADMIN_EMAIL,
            subject: `[Data Health] CRITICAL: ${f.check_name}`,
            html,
          },
        });
        notified.push(f.check_name);
      } catch (e) {
        console.error(`[data-health] notification failed for ${f.check_name}:`, e);
      }
    }

    if (notified.length > 0) {
      // Mark the newest result row of each notified check so the
      // once-per-day rule works without a separate state table.
      for (const name of notified) {
        const { data: latest } = await supabase
          .from("data_health_results")
          .select("id")
          .eq("check_name", name)
          .order("run_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest?.id) {
          await supabase.from("data_health_results").update({ notified: true }).eq("id", latest.id);
        }
      }
    }

    console.log(
      `[data-health] ${results.length} checks, ${failures.length} failed ` +
        `(${criticalFailures.length} critical), ${notified.length} notifications sent`,
    );

    return new Response(
      JSON.stringify({
        ran: results.length,
        failed: failures.length,
        critical_failed: criticalFailures.length,
        notified,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[data-health] runner failed:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
