import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversationInsight {
  conversationId: string;
  intentCategory: string;
  topics: string[];
  engagementLevel: "high" | "medium" | "low" | "abandoned";
  dropOffPoint: string | null;
  contentGaps: string[];
  userSatisfactionSignal: "positive" | "neutral" | "negative" | "unknown";
  journeySuggestion: string | null;
}

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

    // Fetch conversations not yet analyzed (last 24h, with messages)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: conversations, error: convError } = await supabase
      .from("copilot_conversations")
      .select("id, title, created_at, updated_at")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (convError) throw convError;
    if (!conversations?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "No recent conversations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which conversations are already analyzed
    const convoIds = conversations.map((c: any) => c.id);
    const { data: existingAnalyses } = await supabase
      .from("copilot_feedback")
      .select("session_id")
      .in("session_id", convoIds.map((id: string) => `batch-${id}`));

    const analyzedIds = new Set((existingAnalyses || []).map((a: any) => a.session_id.replace("batch-", "")));
    const unanalyzed = conversations.filter((c: any) => !analyzedIds.has(c.id));

    if (!unanalyzed.length) {
      return new Response(JSON.stringify({ processed: 0, message: "All recent conversations already analyzed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load messages for unanalyzed conversations (batch)
    const { data: allMessages, error: msgError } = await supabase
      .from("copilot_messages")
      .select("conversation_id, role, content, created_at")
      .in("conversation_id", unanalyzed.map((c: any) => c.id))
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;

    // Group messages by conversation
    const messagesByConvo: Record<string, any[]> = {};
    for (const msg of allMessages || []) {
      if (!messagesByConvo[msg.conversation_id]) messagesByConvo[msg.conversation_id] = [];
      messagesByConvo[msg.conversation_id].push(msg);
    }

    const insights: ConversationInsight[] = [];
    let processed = 0;

    // Analyze in batches of 5 to avoid rate limits
    for (let i = 0; i < unanalyzed.length; i += 5) {
      const batch = unanalyzed.slice(i, i + 5);

      const batchPromises = batch.map(async (convo: any) => {
        const messages = messagesByConvo[convo.id] || [];
        if (messages.length === 0) return null;

        const transcript = messages
          .map((m: any) => `${m.role}: ${m.content.substring(0, 500)}`)
          .join("\n\n");

        const messageCount = messages.length;
        const userMessages = messages.filter((m: any) => m.role === "user").length;
        const lastMessage = messages[messages.length - 1];

        const prompt = `Analyze this trading copilot conversation for user intent and engagement.

Conversation (${messageCount} messages, ${userMessages} user messages):
${transcript.substring(0, 3000)}

Last message was from: ${lastMessage?.role}

Respond with JSON only (no markdown):
{
  "intentCategory": "one of: pattern_discovery, signal_validation, education, script_generation, backtest_setup, market_analysis, alert_management, account_help, unclear",
  "topics": ["specific", "topics", "discussed"],
  "engagementLevel": "high|medium|low|abandoned",
  "dropOffPoint": "description of where/why user stopped engaging, or null if still active",
  "contentGaps": ["list of topics/features the user wanted but weren't well served"],
  "userSatisfactionSignal": "positive|neutral|negative|unknown",
  "journeySuggestion": "suggestion for improving the user journey based on this conversation, or null"
}

Engagement guidelines:
- "high": 4+ user messages, follows up on answers
- "medium": 2-3 user messages
- "low": 1 user message only  
- "abandoned": user asked something but the last message suggests confusion or dissatisfaction`;

        try {
          const aiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 },
              }),
            }
          );

          if (!aiResp.ok) {
            console.error(`AI analysis failed for ${convo.id}:`, aiResp.status);
            return null;
          }

          const result = await aiResp.json();
          const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const analysis = JSON.parse(clean);

          // Store as copilot_feedback with batch session prefix
          await supabase.from("copilot_feedback").insert({
            user_id: null, // batch analysis, no specific user context needed for RLS
            session_id: `batch-${convo.id}`,
            question: `[Batch Analysis] ${convo.title || "Untitled"}`,
            response: `${messageCount} messages analyzed. Intent: ${analysis.intentCategory}. Engagement: ${analysis.engagementLevel}.`,
            quality_score: analysis.engagementLevel === "high" ? 5 : analysis.engagementLevel === "medium" ? 3 : 1,
            topics: analysis.topics || [],
            intent_category: analysis.intentCategory || "unknown",
            content_gap_identified: (analysis.contentGaps || []).length > 0,
            content_gap_description: (analysis.contentGaps || []).join("; ") || null,
            priority_score: analysis.engagementLevel === "abandoned" ? 80 : (analysis.contentGaps || []).length > 0 ? 60 : 20,
          });

          return {
            conversationId: convo.id,
            ...analysis,
          } as ConversationInsight;
        } catch (err) {
          console.error(`Failed to analyze conversation ${convo.id}:`, err);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      for (const r of results) {
        if (r) {
          insights.push(r);
          processed++;
        }
      }
    }

    // Generate aggregate summary
    const intentDistribution: Record<string, number> = {};
    const allTopics: Record<string, number> = {};
    const allGaps: string[] = [];
    let abandonedCount = 0;

    for (const insight of insights) {
      intentDistribution[insight.intentCategory] = (intentDistribution[insight.intentCategory] || 0) + 1;
      for (const t of insight.topics) {
        allTopics[t] = (allTopics[t] || 0) + 1;
      }
      for (const g of insight.contentGaps) {
        allGaps.push(g);
      }
      if (insight.engagementLevel === "abandoned") abandonedCount++;
    }

    return new Response(JSON.stringify({
      processed,
      total_conversations: unanalyzed.length,
      summary: {
        intent_distribution: intentDistribution,
        top_topics: Object.entries(allTopics).sort((a, b) => b[1] - a[1]).slice(0, 10),
        content_gaps: [...new Set(allGaps)],
        abandoned_rate: unanalyzed.length > 0 ? (abandonedCount / unanalyzed.length * 100).toFixed(1) + "%" : "0%",
      },
      insights,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-conversation-intents error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
