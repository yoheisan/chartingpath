import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LoginAttemptPayload {
  email?: string;
  success: boolean;
  method: string;
  error_message?: string;
  user_id?: string;
}

async function resolveGeo(ip: string): Promise<{ city?: string; country?: string; region?: string }> {
  // Skip for local/private IPs
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return {};
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,regionName`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      city: data.city || undefined,
      country: data.country || undefined,
      region: data.regionName || undefined,
    };
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: LoginAttemptPayload = await req.json();

    // Extract IP from headers (Supabase sets x-forwarded-for)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";

    // Resolve geolocation from IP
    const geo = await resolveGeo(ip);

    // Use service role to insert
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("login_attempts").insert({
      user_id: payload.user_id || null,
      email: payload.email || null,
      success: payload.success,
      method: payload.method || "password",
      ip_address: ip || null,
      city: geo.city || null,
      country: geo.country || null,
      region: geo.region || null,
      user_agent: userAgent || null,
      error_message: payload.error_message || null,
    });

    if (error) {
      console.error("[track-login] Insert error:", error.message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[track-login] Error:", err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
