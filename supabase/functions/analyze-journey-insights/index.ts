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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const { days = 30, analysisType = "full" } = await req.json().catch(() => ({}));

    // 1. Fetch analytics events
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error: eventsError } = await supabase
      .from("analytics_events")
      .select("event_name, user_id, session_id, properties, ts")
      .gte("ts", since)
      .order("ts", { ascending: true })
      .limit(5000);

    if (eventsError) throw eventsError;

    // 2. Fetch copilot feedback for content gaps
    const { data: feedback } = await supabase
      .from("copilot_feedback")
      .select("question, intent_category, content_gap_identified, content_gap_description, quality_score, topics, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    // 3. Build aggregated data for AI analysis
    const eventCounts: Record<string, number> = {};
    const sessionPaths: Record<string, string[]> = {};
    const regionSessions: Record<string, number> = {};
    const userDropOffs: Record<string, number> = {};

    for (const e of events || []) {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
      const sid = e.session_id || "unknown";
      if (!sessionPaths[sid]) sessionPaths[sid] = [];
      sessionPaths[sid].push(e.event_name);

      // Extract region from properties
      const props = e.properties as Record<string, any> | null;
      const url = props?.url || "";
      const tz = props?.timezone || props?.tz || "unknown";
      let region = "Unknown";
      if (typeof tz === "string") {
        if (tz.includes("America")) region = "Americas";
        else if (tz.includes("Europe") || tz.includes("Africa")) region = "Europe/Africa";
        else if (tz.includes("Asia") || tz.includes("Pacific") || tz.includes("Australia")) region = "Asia-Pacific";
      }
      regionSessions[region] = (regionSessions[region] || 0) + 1;
    }

    // Calculate drop-off points (last event per session)
    for (const [sid, path] of Object.entries(sessionPaths)) {
      if (path.length > 0) {
        const lastEvent = path[path.length - 1];
        userDropOffs[lastEvent] = (userDropOffs[lastEvent] || 0) + 1;
      }
    }

    // Aggregate content gaps from copilot feedback
    const contentGaps: string[] = [];
    const intentDistribution: Record<string, number> = {};
    const lowQualityTopics: string[] = [];

    for (const fb of feedback || []) {
      if (fb.content_gap_identified && fb.content_gap_description) {
        contentGaps.push(fb.content_gap_description);
      }
      if (fb.intent_category) {
        intentDistribution[fb.intent_category] = (intentDistribution[fb.intent_category] || 0) + 1;
      }
      if ((fb.quality_score || 0) <= 2 && fb.topics) {
        lowQualityTopics.push(...(fb.topics as string[]));
      }
    }

    // 4. Send to Gemini for AI analysis
    const prompt = `You are a product analytics AI for a trading platform (ChartingPath).

Analyze this user journey data and identify UNMET NEEDS ranked by business impact.

EVENT COUNTS (${days} days):
${JSON.stringify(eventCounts, null, 2)}

DROP-OFF POINTS (where users leave):
${JSON.stringify(userDropOffs, null, 2)}

SESSIONS BY REGION:
${JSON.stringify(regionSessions, null, 2)}

CONTENT GAPS FROM COPILOT (topics users asked about but weren't served):
${contentGaps.slice(0, 20).join("\n")}

LOW QUALITY COPILOT TOPICS (users were unsatisfied):
${[...new Set(lowQualityTopics)].slice(0, 15).join(", ")}

INTENT DISTRIBUTION FROM COPILOT:
${JSON.stringify(intentDistribution, null, 2)}

TOTAL SESSIONS: ${Object.keys(sessionPaths).length}
AVG EVENTS/SESSION: ${(Object.values(sessionPaths).reduce((a, b) => a + b.length, 0) / Math.max(Object.keys(sessionPaths).length, 1)).toFixed(1)}

Respond with JSON only (no markdown):
{
  "unmetNeeds": [
    {
      "id": "unique_id",
      "title": "Short title",
      "description": "What users need but aren't getting",
      "severity": "critical|high|medium|low",
      "affectedUsers": "estimated percentage or count",
      "evidence": "data points supporting this",
      "suggestedAction": "concrete action to address",
      "impactScore": 1-100,
      "category": "feature_gap|ux_friction|content_gap|onboarding|monetization"
    }
  ],
  "regionalInsights": [
    {
      "region": "Americas|Europe/Africa|Asia-Pacific",
      "engagement": "high|medium|low",
      "topEvents": ["most common events"],
      "uniqueNeeds": "region-specific observation",
      "opportunity": "actionable insight"
    }
  ],
  "journeySummary": {
    "healthScore": 0-100,
    "biggestBottleneck": "description",
    "quickestWin": "description",
    "retentionRisk": "description"
  },
  "copilotInsights": {
    "topUnservedIntents": ["list of intents not well served"],
    "contentGapPriority": ["ranked content to create"],
    "satisfactionTrend": "improving|stable|declining"
  }
}`;

    const aiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("Gemini API error:", aiResp.status, errText);
      throw new Error(`Gemini API error: ${aiResp.status}`);
    }

    const result = await aiResp.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(clean);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      metadata: {
        days,
        totalEvents: events?.length || 0,
        totalSessions: Object.keys(sessionPaths).length,
        totalFeedback: feedback?.length || 0,
        analyzedAt: new Date().toISOString(),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-journey-insights error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
