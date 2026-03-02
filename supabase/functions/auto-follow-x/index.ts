import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── OAuth 1.0a helpers (same as post-to-social-media) ──────────────────
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const baseStr = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const key = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return createHmac("sha1", key).update(baseStr).digest("base64");
}

function oauthHeader(method: string, url: string): string {
  const apiKey = Deno.env.get("TWITTER_API_KEY")!;
  const apiSecret = Deno.env.get("TWITTER_API_SECRET")!;
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")!;
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!;

  const params: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  params.oauth_signature = generateOAuthSignature(
    method,
    url,
    params,
    apiSecret,
    accessTokenSecret
  );

  return (
    "OAuth " +
    Object.entries(params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

// ── Get authenticated user ID (cached in memory per cold-start) ────────
let cachedUserId: string | null = null;

async function getMyUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const url = "https://api.x.com/2/users/me";
  const res = await fetch(url, {
    headers: { Authorization: oauthHeader("GET", url) },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET /users/me failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  cachedUserId = data.data.id;
  console.log("[auto-follow-x] Authenticated user ID:", cachedUserId);
  return cachedUserId!;
}

// ── Follow a single user ───────────────────────────────────────────────
async function followUser(
  myId: string,
  targetUserId: string
): Promise<{ ok: boolean; skip?: boolean; error?: string }> {
  const url = `https://api.x.com/2/users/${myId}/following`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", url),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_user_id: targetUserId }),
  });

  const txt = await res.text();
  console.log(`[auto-follow-x] Follow ${targetUserId}: ${res.status} ${txt}`);

  if (res.status === 429 || res.status === 402) {
    return { ok: false, error: "rate_limited" };
  }

  if (!res.ok) {
    // User not found / suspended → skip
    if (res.status === 400 || res.status === 404) {
      return { ok: false, skip: true, error: txt };
    }
    return { ok: false, error: `${res.status}: ${txt}` };
  }

  const body = JSON.parse(txt);
  // If already following, mark as skipped
  if (body.data?.following === false) {
    return { ok: false, skip: true, error: "pending_follow_request" };
  }

  return { ok: true };
}

// ── Main handler ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "follow_next";

    // ── ACTION: add_users ──────────────────────────────────────────
    if (action === "add_users") {
      const users: { user_id: string; username?: string }[] = body.users || [];
      if (!users.length) {
        return new Response(
          JSON.stringify({ error: "No users provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rows = users.map((u) => ({
        target_user_id: u.user_id,
        target_username: u.username || null,
        status: "pending",
      }));

      const { data, error } = await supabase
        .from("x_follow_queue")
        .upsert(rows, { onConflict: "target_user_id", ignoreDuplicates: true })
        .select("id");

      if (error) throw error;

      return new Response(
        JSON.stringify({ inserted: data?.length || 0, total_submitted: users.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: follow_next (default, called by cron) ──────────────
    // Pick the oldest pending row
    const { data: next, error: fetchErr } = await supabase
      .from("x_follow_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!next) {
      console.log("[auto-follow-x] No pending users in queue.");
      return new Response(
        JSON.stringify({ message: "Queue empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[auto-follow-x] Processing: ${next.target_user_id} (@${next.target_username || "?"})`);

    const myId = await getMyUserId();
    const result = await followUser(myId, next.target_user_id);

    if (result.error === "rate_limited") {
      // Don't update status — retry next cycle
      console.log("[auto-follow-x] Rate limited, will retry next cycle.");
      return new Response(
        JSON.stringify({ message: "Rate limited, retrying later", target: next.target_user_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newStatus = result.ok ? "followed" : result.skip ? "skipped" : "failed";

    await supabase
      .from("x_follow_queue")
      .update({
        status: newStatus,
        error_message: result.error || null,
        attempted_at: new Date().toISOString(),
      })
      .eq("id", next.id);

    return new Response(
      JSON.stringify({
        target: next.target_user_id,
        username: next.target_username,
        status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[auto-follow-x] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
