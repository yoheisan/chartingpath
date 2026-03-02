import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Bearer Token auth ──────────────────────────────────────────────────
function getBearerToken(): string {
  const token = Deno.env.get("TWITTER_BEARER_TOKEN");
  if (!token) throw new Error("TWITTER_BEARER_TOKEN not set");
  return token;
}

// ── Resolve username to numeric user ID ────────────────────────────────
async function resolveUsernameToId(username: string): Promise<{ id: string; name: string } | null> {
  const bearerToken = getBearerToken();
  const cleanUsername = username.replace(/^@/, "");
  const url = `https://api.x.com/2/users/by/username/${cleanUsername}?user.fields=public_metrics`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (res.status === 429) {
    const resetAt = res.headers.get("x-rate-limit-reset");
    throw new Error(`rate_limited:${resetAt || ""}`);
  }

  if (!res.ok) {
    const txt = await res.text();
    console.error(`[discover-x] Failed to resolve @${cleanUsername}: ${res.status} ${txt}`);
    return null;
  }

  const body = await res.json();
  if (!body.data) return null;
  return { id: body.data.id, name: body.data.name };
}

// ── Fetch following list for a user ────────────────────────────────────
async function fetchFollowing(
  userId: string,
  paginationToken?: string
): Promise<{ users: any[]; nextToken?: string }> {
  const bearerToken = getBearerToken();
  const baseUrl = `https://api.x.com/2/users/${userId}/following`;
  const params = new URLSearchParams({
    max_results: "100",
    "user.fields": "public_metrics,username,name",
  });
  if (paginationToken) params.set("pagination_token", paginationToken);

  const fullUrl = `${baseUrl}?${params.toString()}`;

  const res = await fetch(fullUrl, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (res.status === 429) {
    const resetAt = res.headers.get("x-rate-limit-reset");
    throw new Error(`rate_limited:${resetAt || ""}`);
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }

  const body = await res.json();
  return {
    users: body.data || [],
    nextToken: body.meta?.next_token,
  };
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
    const action = body.action || "crawl_next";

    // ── ACTION: reset_seeds ─────────────────────────────────────────
    if (action === "reset_seeds") {
      const { data, error } = await supabase
        .from("x_discovery_seeds")
        .update({ status: "pending", pagination_token: null, crawled_at: null, accounts_found: 0 })
        .eq("status", "completed")
        .select("id");

      if (error) throw error;

      return new Response(
        JSON.stringify({ reset: data?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: add_seeds ──────────────────────────────────────────
    if (action === "add_seeds") {
      const seeds: { user_id: string; username?: string }[] = body.seeds || [];
      if (!seeds.length) {
        return new Response(
          JSON.stringify({ error: "No seeds provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rows = seeds.map((s) => ({
        seed_user_id: s.user_id,
        seed_username: s.username || null,
        status: "pending",
      }));

      const { data, error } = await supabase
        .from("x_discovery_seeds")
        .upsert(rows, { onConflict: "seed_user_id", ignoreDuplicates: true })
        .select("id");

      if (error) throw error;

      return new Response(
        JSON.stringify({ inserted: data?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: crawl_next (default, called by cron) ───────────────
    if (action === "crawl_next") {
      // Pick the next uncrawled seed (or one with a pagination token for continuation)
      const { data: seed, error: seedErr } = await supabase
        .from("x_discovery_seeds")
        .select("*")
        .in("status", ["pending", "crawling"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (seedErr) throw seedErr;

      if (!seed) {
        console.log("[discover-x] All seeds crawled.");
        return new Response(
          JSON.stringify({ message: "All seeds crawled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[discover-x] Crawling seed: ${seed.seed_user_id} (@${seed.seed_username || "?"})`);

      // Mark as crawling
      await supabase
        .from("x_discovery_seeds")
        .update({ status: "crawling" })
        .eq("id", seed.id);

      try {
        const result = await fetchFollowing(seed.seed_user_id, seed.pagination_token || undefined);
        const users = result.users;

        console.log(`[discover-x] Found ${users.length} following for seed ${seed.seed_user_id}`);

        // Upsert discovered accounts
        let newFound = 0;
        for (const u of users) {
          const metrics = u.public_metrics || {};

          // Upsert discovered account
          const { error: insertErr } = await supabase
            .from("x_discovered_accounts")
            .upsert(
              {
                user_id: u.id,
                username: u.username,
                name: u.name,
                followers_count: metrics.followers_count || 0,
                following_count: metrics.following_count || 0,
                discovered_via: [seed.seed_user_id],
                discovery_count: 1,
                status: "discovered",
              },
              { onConflict: "user_id", ignoreDuplicates: false }
            );

          if (insertErr) {
            // If conflict, update discovered_via array and increment count
            if (insertErr.code === "23505" || insertErr.message?.includes("duplicate")) {
              // Need to update existing row
              const { data: existing } = await supabase
                .from("x_discovered_accounts")
                .select("discovered_via")
                .eq("user_id", u.id)
                .single();

              if (existing && !existing.discovered_via?.includes(seed.seed_user_id)) {
                const newVia = [...(existing.discovered_via || []), seed.seed_user_id];
                await supabase
                  .from("x_discovered_accounts")
                  .update({
                    discovered_via: newVia,
                    discovery_count: newVia.length,
                    followers_count: metrics.followers_count || 0,
                    following_count: metrics.following_count || 0,
                  })
                  .eq("user_id", u.id);
              }
            }
          } else {
            newFound++;
          }
        }

        // Update seed status
        if (result.nextToken) {
          // More pages to crawl
          await supabase
            .from("x_discovery_seeds")
            .update({
              pagination_token: result.nextToken,
              accounts_found: (seed.accounts_found || 0) + users.length,
              status: "crawling",
            })
            .eq("id", seed.id);
        } else {
          // Done with this seed
          await supabase
            .from("x_discovery_seeds")
            .update({
              status: "completed",
              crawled_at: new Date().toISOString(),
              accounts_found: (seed.accounts_found || 0) + users.length,
              pagination_token: null,
            })
            .eq("id", seed.id);
        }

        return new Response(
          JSON.stringify({
            seed: seed.seed_user_id,
            username: seed.seed_username,
            found: users.length,
            new_accounts: newFound,
            has_more: !!result.nextToken,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        if (err.message?.startsWith("rate_limited")) {
          // Revert to pending, will retry next cycle
          await supabase
            .from("x_discovery_seeds")
            .update({ status: seed.pagination_token ? "crawling" : "pending" })
            .eq("id", seed.id);

          console.log("[discover-x] Rate limited, will retry next cycle.");
          return new Response(
            JSON.stringify({ message: "Rate limited, retrying later" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw err;
      }
    }

    // ── ACTION: score_and_enqueue ──────────────────────────────────
    if (action === "score_and_enqueue") {
      const minScore = body.min_score || 3;
      const minFollowers = body.min_followers || 100;
      const limit = body.limit || 500;

      // Find high-scoring discovered accounts not yet enqueued
      const { data: candidates, error: fetchErr } = await supabase
        .from("x_discovered_accounts")
        .select("user_id, username, discovery_count, followers_count")
        .eq("status", "discovered")
        .gte("discovery_count", minScore)
        .gte("followers_count", minFollowers)
        .order("discovery_count", { ascending: false })
        .limit(limit);

      if (fetchErr) throw fetchErr;

      if (!candidates?.length) {
        return new Response(
          JSON.stringify({ message: "No candidates above threshold", min_score: minScore }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Bulk insert into x_follow_queue
      const queueRows = candidates.map((c) => ({
        target_user_id: c.user_id,
        target_username: c.username,
        status: "pending",
      }));

      const { error: queueErr } = await supabase
        .from("x_follow_queue")
        .upsert(queueRows, { onConflict: "target_user_id", ignoreDuplicates: true });

      if (queueErr) throw queueErr;

      // Mark as enqueued
      const userIds = candidates.map((c) => c.user_id);
      await supabase
        .from("x_discovered_accounts")
        .update({ status: "enqueued" })
        .in("user_id", userIds);

      return new Response(
        JSON.stringify({ enqueued: candidates.length, min_score: minScore }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: get_stats ──────────────────────────────────────────
    if (action === "get_stats") {
      const { data: seedStats } = await supabase
        .from("x_discovery_seeds")
        .select("status");

      const { count: totalDiscovered } = await supabase
        .from("x_discovered_accounts")
        .select("*", { count: "exact", head: true });

      const { count: highScore } = await supabase
        .from("x_discovered_accounts")
        .select("*", { count: "exact", head: true })
        .gte("discovery_count", 3);

      const seedCounts = {
        pending: seedStats?.filter((s) => s.status === "pending").length || 0,
        crawling: seedStats?.filter((s) => s.status === "crawling").length || 0,
        completed: seedStats?.filter((s) => s.status === "completed").length || 0,
        total: seedStats?.length || 0,
      };

      return new Response(
        JSON.stringify({
          seeds: seedCounts,
          total_discovered: totalDiscovered || 0,
          high_score_candidates: highScore || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[discover-x] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
