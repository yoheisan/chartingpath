import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, api_key, api_secret, user_id, ticker, qty, side } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Helper to get stored keys for a user
    async function getKeys(uid: string) {
      const { data } = await sb
        .from("broker_connections")
        .select("api_key_encrypted, api_secret_encrypted, is_live, capital_allocated")
        .eq("user_id", uid)
        .eq("is_live", true)
        .maybeSingle();
      return data;
    }

    // ---- VERIFY ----
    if (action === "verify") {
      const res = await fetch("https://paper-api.alpaca.markets/v2/account", {
        headers: {
          "APCA-API-KEY-ID": api_key,
          "APCA-API-SECRET-KEY": api_secret,
        },
      });
      if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials — check your Alpaca API keys and try again" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      const acct = await res.json();
      return new Response(
        JSON.stringify({ success: true, balance: parseFloat(acct.equity || "0"), account_id: acct.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- PLACE ORDER ----
    if (action === "place_order") {
      const conn = await getKeys(user_id);
      if (!conn) {
        return new Response(
          JSON.stringify({ success: false, error: "No active broker connection" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const orderRes = await fetch("https://paper-api.alpaca.markets/v2/orders", {
        method: "POST",
        headers: {
          "APCA-API-KEY-ID": conn.api_key_encrypted,
          "APCA-API-SECRET-KEY": conn.api_secret_encrypted,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: ticker,
          qty: qty.toString(),
          side: side || "buy",
          type: "market",
          time_in_force: "day",
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        return new Response(
          JSON.stringify({ success: false, error: orderData.message || "Order failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order: orderData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- FLATTEN ALL ----
    if (action === "flatten_all") {
      const conn = await getKeys(user_id);
      if (!conn) {
        return new Response(
          JSON.stringify({ success: false, error: "No active broker connection" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Get all open positions
      const posRes = await fetch("https://paper-api.alpaca.markets/v2/positions", {
        headers: {
          "APCA-API-KEY-ID": conn.api_key_encrypted,
          "APCA-API-SECRET-KEY": conn.api_secret_encrypted,
        },
      });
      const positions = await posRes.json();

      if (!Array.isArray(positions)) {
        return new Response(
          JSON.stringify({ success: true, closed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Close each position
      for (const pos of positions) {
        await fetch(`https://paper-api.alpaca.markets/v2/positions/${pos.symbol}`, {
          method: "DELETE",
          headers: {
            "APCA-API-KEY-ID": conn.api_key_encrypted,
            "APCA-API-SECRET-KEY": conn.api_secret_encrypted,
          },
        });
      }

      // Close all live_trades
      await sb
        .from("live_trades")
        .update({ outcome: "loss", exit_time: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("outcome", "open");

      return new Response(
        JSON.stringify({ success: true, closed: positions.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
