import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const CLASSIFICATION_TIMEOUT_MS = 12000;
const DOWNSTREAM_TIMEOUT_MS = 30000;

const VALID_DOMAINS = ["scoring", "screener", "research", "navigation", "general"] as const;
type Domain = (typeof VALID_DOMAINS)[number];

interface ClassificationResult {
  domain: Domain;
  confidence: number;
  intent: string;
}

function normalizeContextDomain(context?: string): Domain | null {
  if (!context) return null;
  const c = context.toLowerCase().trim();
  if (VALID_DOMAINS.includes(c as Domain)) return c as Domain;
  if (c.includes("scor")) return "scoring";
  if (c.includes("screen") || c.includes("live")) return "screener";
  if (c.includes("research") || c.includes("pattern-lab") || c.includes("project")) return "research";
  return null;
}

function classifyByHeuristics(userMessage: string, context?: string | Record<string, unknown>): ClassificationResult {
  const ctxDomain = normalizeContextDomain(context);
  if (ctxDomain) {
    return {
      domain: ctxDomain,
      confidence: 0.95,
      intent: "context_routed",
    };
  }

  const text = userMessage.toLowerCase();

  const scoringPatterns = [
    "take rate", "watch rate", "cutoff", "weights", "weight", "agent scoring", "conservative", "aggressive", "risk weight", "timing weight", "portfolio weight",
  ];
  if (scoringPatterns.some((p) => text.includes(p))) {
    return { domain: "scoring", confidence: 0.8, intent: "heuristic_scoring" };
  }

  const screenerPatterns = [
    "find patterns", "show patterns", "live patterns", "setups", "screener", "bull flag", "scan",
  ];
  if (screenerPatterns.some((p) => text.includes(p))) {
    return { domain: "screener", confidence: 0.75, intent: "heuristic_screener" };
  }

  const researchPatterns = [
    "backtest", "historical", "expectancy", "win rate", "analyze", "research", "instrument",
  ];
  if (researchPatterns.some((p) => text.includes(p))) {
    return { domain: "research", confidence: 0.72, intent: "heuristic_research" };
  }

  return { domain: "general", confidence: 0.7, intent: "heuristic_general" };
}

/**
 * Classify the user's latest message into one of 4 domains using Gemini,
 * with deterministic fallback to context + keyword heuristics.
 */
async function classifyIntent(
  userMessage: string,
  context?: string | Record<string, unknown>
): Promise<ClassificationResult> {
  const forcedDomain = normalizeContextDomain(context);
  if (forcedDomain) {
    return {
      domain: forcedDomain,
      confidence: 1,
      intent: "forced_by_context",
    };
  }

  if (!LOVABLE_API_KEY) {
    console.warn("[copilot-router] LOVABLE_API_KEY missing, using heuristic classifier");
    return classifyByHeuristics(userMessage, context);
  }

  const systemPrompt = `You are an intent classifier for a trading platform copilot.
Classify the user's message into exactly ONE domain:
- "scoring": adjusting agent scoring weights, cutoffs, take rates, watch rates, filters
- "screener": searching for patterns, filtering live signals, finding setups
- "research": asking about a specific instrument, pattern stats, historical data, market analysis
- "navigation": user wants to navigate to a different page or section of the app
- "general": everything else — greetings, help, off-topic, ambiguous

Consider the context hint if provided. Be precise — only classify as a specific domain if the intent is clear.`;

  const body = {
    model: "google/gemini-2.5-flash-lite",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: context
          ? `Context: ${context}\n\nUser message: "${userMessage}"`
          : `User message: "${userMessage}"`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "classify_intent",
          description:
            "Classify the user message into a domain with confidence.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                enum: ["scoring", "screener", "research", "navigation", "general"],
                description: "The classified domain.",
              },
              confidence: {
                type: "number",
                description:
                  "Confidence score between 0 and 1. Use < 0.6 if uncertain.",
              },
              intent: {
                type: "string",
                description:
                  "Short description of the detected intent, e.g. 'increase take rate' or 'find bull flags on AAPL'.",
              },
            },
            required: ["domain", "confidence", "intent"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "classify_intent" } },
  };

  try {
    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(CLASSIFICATION_TIMEOUT_MS),
      }
    );

    if (!resp.ok) {
      console.error(
        "[copilot-router] classification request failed:",
        resp.status
      );
      return classifyByHeuristics(userMessage, context);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.warn("[copilot-router] no tool call in classification response");
      return classifyByHeuristics(userMessage, context);
    }

    const parsed = JSON.parse(toolCall.function.arguments) as ClassificationResult;

    if (!VALID_DOMAINS.includes(parsed.domain)) {
      return classifyByHeuristics(userMessage, context);
    }

    if (typeof parsed.confidence !== "number" || parsed.confidence < 0.6) {
      return classifyByHeuristics(userMessage, context);
    }

    return parsed;
  } catch (err) {
    console.error("[copilot-router] classification error:", err);
    return classifyByHeuristics(userMessage, context);
  }
}

/**
 * Log classification result to copilot_training_pairs for future model improvement.
 */
async function logClassification(
  userMessage: string,
  classification: ClassificationResult,
  userId: string | null
) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from("copilot_training_pairs").insert({
      prompt: userMessage,
      response: "", // will be filled later if needed
      domain: classification.domain,
      intent_classification: classification.intent,
      parameters_used: {
        confidence: classification.confidence,
        classified_domain: classification.domain,
      },
      user_id: userId,
    });
  } catch (err) {
    // Non-blocking — don't fail the request over logging
    console.error("[copilot-router] logging error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language, context, prewarmed } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastUserMsg = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");
    const userText = lastUserMsg?.content || "";

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getUser(token);
        userId = data?.user?.id || null;
      } catch {
        // Non-critical — proceed without user ID
      }
    }

    // Fast-path: regex-based navigation detection before LLM call
    const NAV_PATTERNS = [
      /\b(go to|open|navigate to|take me to|show me the page|switch to)\b/i,
    ];
    const isNavIntent = NAV_PATTERNS.some((p) => p.test(userText));
    if (isNavIntent) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      supabase.from("copilot_training_pairs").insert({
        prompt: userText,
        response: "",
        domain: "navigation",
        intent_classification: "navigate",
        parameters_used: {},
        user_id: userId,
      });
      return new Response(
        JSON.stringify({ domain: "navigation", confidence: 0.95, intent: "navigate" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const classification = await classifyIntent(userText, context);
    console.log(
      `[copilot-router] domain=${classification.domain} confidence=${classification.confidence} intent="${classification.intent}"`
    );

    logClassification(userText, classification, userId);

    const handlerMap: Record<string, string> = {
      scoring: "copilot-scoring-handler",
      screener: "copilot-screener-handler",
      research: "copilot-research-handler",
      navigation: "trading-copilot",
      general: "trading-copilot",
    };
    const handlerName = handlerMap[classification.domain] ?? "trading-copilot";
    const handlerUrl = `${SUPABASE_URL}/functions/v1/${handlerName}`;

    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
    };
    if (authHeader) {
      forwardHeaders.Authorization = authHeader;
    }

    let downstreamResp: Response;
    try {
      downstreamResp = await fetch(handlerUrl, {
        method: "POST",
        headers: forwardHeaders,
        body: JSON.stringify({ messages, language, context, prewarmed }),
        signal: AbortSignal.timeout(DOWNSTREAM_TIMEOUT_MS),
      });
    } catch (fetchError) {
      const isAbort = fetchError instanceof DOMException && fetchError.name === "TimeoutError";
      return new Response(
        JSON.stringify({
          error: isAbort
            ? `Downstream handler timed out after ${DOWNSTREAM_TIMEOUT_MS}ms`
            : "Failed to reach downstream copilot handler",
        }),
        {
          status: isAbort ? 504 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!downstreamResp.ok) {
      const contentType = downstreamResp.headers.get("Content-Type") || "";
      if (contentType.includes("text/html")) {
        return new Response(
          JSON.stringify({ error: "Upstream service temporarily unavailable" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(downstreamResp.body, {
        status: downstreamResp.status,
        headers: {
          ...corsHeaders,
          "Content-Type":
            downstreamResp.headers.get("Content-Type") ?? "application/json",
        },
      });
    }

    return new Response(downstreamResp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[copilot-router] error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
