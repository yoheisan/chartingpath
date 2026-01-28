import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KPIMetrics {
  totalUsers: number;
  newUsers7d: number;
  activeUsers7d: number;
  totalSessions7d: number;
  signupConversionRate: number;
  paidConversionRate: number;
  topPatterns: Array<{ name: string; count: number }>;
  criticalIssues: number;
  healthScore: number;
  revenueEstimate: number;
}

async function fetchKPIMetrics(supabase: ReturnType<typeof createClient>): Promise<KPIMetrics> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Fetch new users in last 7 days
  const { count: newUsers7d } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  // Fetch product events for journey analytics
  const { data: events } = await supabase
    .from('product_events')
    .select('event_name, user_id, session_id')
    .gte('created_at', weekAgo.toISOString());

  const uniqueUsers = new Set(events?.filter(e => e.user_id).map(e => e.user_id) || []);
  const uniqueSessions = new Set(events?.map(e => e.session_id) || []);
  
  // Calculate event counts
  const eventCounts: Record<string, number> = {};
  events?.forEach(e => {
    eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
  });

  // Calculate conversion rates
  const landingViews = eventCounts['landing_view'] || eventCounts['session_start'] || 1;
  const signups = eventCounts['signup_completed'] || 0;
  const paidStarts = eventCounts['paid_started'] || 0;
  
  const signupConversionRate = (signups / landingViews) * 100;
  const paidConversionRate = signups > 0 ? (paidStarts / signups) * 100 : 0;

  // Fetch top patterns scanned
  const { data: patternScans } = await supabase
    .from('live_pattern_detections')
    .select('pattern_name')
    .gte('created_at', weekAgo.toISOString());

  const patternCounts: Record<string, number> = {};
  patternScans?.forEach(p => {
    patternCounts[p.pattern_name] = (patternCounts[p.pattern_name] || 0) + 1;
  });

  const topPatterns = Object.entries(patternCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate health score based on conversion benchmarks
  const benchmarks = {
    signupRate: 3.5,
    paidRate: 2.0,
  };
  
  const signupHealth = Math.min(100, (signupConversionRate / benchmarks.signupRate) * 50);
  const paidHealth = Math.min(100, (paidConversionRate / benchmarks.paidRate) * 50);
  const healthScore = Math.round((signupHealth + paidHealth) / 2);

  // Estimate revenue (paid users * $20 avg)
  const revenueEstimate = paidStarts * 20;

  return {
    totalUsers: totalUsers || 0,
    newUsers7d: newUsers7d || 0,
    activeUsers7d: uniqueUsers.size,
    totalSessions7d: uniqueSessions.size,
    signupConversionRate: Math.round(signupConversionRate * 100) / 100,
    paidConversionRate: Math.round(paidConversionRate * 100) / 100,
    topPatterns,
    criticalIssues: signupConversionRate < 2 ? 1 : 0,
    healthScore,
    revenueEstimate,
  };
}

function generateEmailHTML(metrics: KPIMetrics, recipientEmail: string): string {
  const healthColor = metrics.healthScore >= 70 ? '#22c55e' : metrics.healthScore >= 50 ? '#f59e0b' : '#ef4444';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly KPI Report - ChartingPath</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 28px;">📊 Weekly KPI Report</h1>
      <p style="color: #94a3b8; margin: 0; font-size: 14px;">ChartingPath Performance Summary</p>
      <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <!-- Health Score -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center; border: 1px solid #475569;">
      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Journey Health Score</p>
      <p style="color: ${healthColor}; margin: 0; font-size: 56px; font-weight: bold;">${metrics.healthScore}</p>
      <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">out of 100</p>
    </div>

    <!-- Key Metrics Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
        <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 12px;">Total Users</p>
        <p style="color: #f1f5f9; margin: 0; font-size: 28px; font-weight: bold;">${metrics.totalUsers.toLocaleString()}</p>
      </div>
      <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
        <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 12px;">New Users (7d)</p>
        <p style="color: #22c55e; margin: 0; font-size: 28px; font-weight: bold;">+${metrics.newUsers7d.toLocaleString()}</p>
      </div>
      <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
        <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 12px;">Active Users (7d)</p>
        <p style="color: #f1f5f9; margin: 0; font-size: 28px; font-weight: bold;">${metrics.activeUsers7d.toLocaleString()}</p>
      </div>
      <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
        <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 12px;">Total Sessions</p>
        <p style="color: #f1f5f9; margin: 0; font-size: 28px; font-weight: bold;">${metrics.totalSessions7d.toLocaleString()}</p>
      </div>
    </div>

    <!-- Conversion Metrics -->
    <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
      <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 18px;">📈 Conversion Funnel</h2>
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #94a3b8; font-size: 14px;">Signup Rate</span>
          <span style="color: ${metrics.signupConversionRate >= 3.5 ? '#22c55e' : metrics.signupConversionRate >= 2 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${metrics.signupConversionRate}%</span>
        </div>
        <div style="background: #0f172a; border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${metrics.signupConversionRate >= 3.5 ? '#22c55e' : metrics.signupConversionRate >= 2 ? '#f59e0b' : '#ef4444'}; height: 100%; width: ${Math.min(100, metrics.signupConversionRate * 10)}%;"></div>
        </div>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">Benchmark: 3.5%</p>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #94a3b8; font-size: 14px;">Free → Paid Rate</span>
          <span style="color: ${metrics.paidConversionRate >= 2 ? '#22c55e' : metrics.paidConversionRate >= 1 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${metrics.paidConversionRate}%</span>
        </div>
        <div style="background: #0f172a; border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: ${metrics.paidConversionRate >= 2 ? '#22c55e' : metrics.paidConversionRate >= 1 ? '#f59e0b' : '#ef4444'}; height: 100%; width: ${Math.min(100, metrics.paidConversionRate * 20)}%;"></div>
        </div>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">Benchmark: 2.0%</p>
      </div>
    </div>

    <!-- Top Patterns -->
    ${metrics.topPatterns.length > 0 ? `
    <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
      <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 18px;">🔥 Top Scanned Patterns</h2>
      ${metrics.topPatterns.map((p, i) => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; ${i < metrics.topPatterns.length - 1 ? 'border-bottom: 1px solid #334155;' : ''}">
          <span style="color: #e2e8f0; font-size: 14px;">${i + 1}. ${p.name}</span>
          <span style="color: #94a3b8; font-size: 14px;">${p.count} scans</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Revenue Estimate -->
    <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="color: #a7f3d0; margin: 0 0 4px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Est. Weekly Revenue</p>
      <p style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">$${metrics.revenueEstimate.toLocaleString()}</p>
    </div>

    <!-- Alerts -->
    ${metrics.criticalIssues > 0 ? `
    <div style="background: #7f1d1d; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #991b1b;">
      <p style="color: #fecaca; margin: 0; font-size: 14px;">
        ⚠️ <strong>${metrics.criticalIssues} Critical Issue${metrics.criticalIssues > 1 ? 's' : ''}</strong> detected in the user journey. 
        <a href="https://chartingpath.com/admin/journey-analytics" style="color: #fca5a5;">View Details →</a>
      </p>
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://chartingpath.com/admin/journey-analytics" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">View Full Analytics Dashboard</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #334155; padding-top: 24px;">
      <p style="color: #64748b; margin: 0 0 8px 0; font-size: 12px;">
        This report was sent to ${recipientEmail}
      </p>
      <p style="color: #475569; margin: 0; font-size: 11px;">
        ChartingPath Admin Weekly Digest • <a href="https://chartingpath.com/admin" style="color: #6366f1;">Manage Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get active KPI subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('admin_kpi_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active KPI subscriptions found");
      return new Response(
        JSON.stringify({ success: true, message: "No active subscriptions", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch KPI metrics once for all recipients
    console.log("Fetching KPI metrics...");
    const metrics = await fetchKPIMetrics(supabase);
    console.log("Metrics fetched:", JSON.stringify(metrics));

    // Send emails to all subscribers
    const results = [];
    for (const sub of subscriptions) {
      try {
        const html = generateEmailHTML(metrics, sub.email);
        
        const { error: emailError } = await resend.emails.send({
          from: "ChartingPath <reports@chartingpath.com>",
          to: [sub.email],
          subject: `📊 Weekly KPI Report - Health Score: ${metrics.healthScore}/100`,
          html,
        });

        if (emailError) {
          console.error(`Failed to send to ${sub.email}:`, emailError);
          results.push({ email: sub.email, success: false, error: emailError.message });
        } else {
          console.log(`Successfully sent to ${sub.email}`);
          
          // Update last_sent_at
          await supabase
            .from('admin_kpi_subscriptions')
            .update({ last_sent_at: new Date().toISOString() })
            .eq('id', sub.id);
          
          results.push({ email: sub.email, success: true });
        }
      } catch (e) {
        console.error(`Error sending to ${sub.email}:`, e);
        results.push({ email: sub.email, success: false, error: String(e) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${successCount}/${subscriptions.length} emails`,
        sent: successCount,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-weekly-kpi-report:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
