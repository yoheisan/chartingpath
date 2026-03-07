import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const VALID_DOMAINS = ["scoring", "screener", "research", "general"] as const;
type Domain = (typeof VALID_DOMAINS)[number];

interface ClassificationResult {
  domain: Domain;
  confidence: number;
  intent: string;
}

/**
 * Classify the user's latest message into one of 4 domains using a single
 * Gemini Flash call with tool-calling for structured output.
 */
async function classifyIntent(
  userMessage: string,
  context?: string
): Promise<ClassificationResult> {
  const systemPrompt = `You are an intent classifier for a trading platform copilot.
Classify the user's message into exactly ONE domain:
- "scoring": adjusting agent scoring weights, cutoffs, take rates, watch rates, filters
- "screener": searching for patterns, filtering live signals, finding setups
- "research": asking about a specific instrument, pattern stats, historical data, market analysis
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
                enum: ["scoring", "screener", "research", "general"],
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
      }
    );

    if (!resp.ok) {
      console.error(
        "[copilot-router] classification request failed:",
        resp.status
      );
      return { domain: "general", confidence: 0, intent: "classification_error" };
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.warn("[copilot-router] no tool call in classification response");
      return { domain: "general", confidence: 0, intent: "no_tool_call" };
    }

    const parsed = JSON.parse(toolCall.function.arguments) as ClassificationResult;

    // Validate domain
    if (!VALID_DOMAINS.includes(parsed.domain)) {
      parsed.domain = "general";
    }

    // Confidence gate: below 0.6 → always general
    if (typeof parsed.confidence !== "number" || parsed.confidence < 0.6) {
      parsed.domain = "general";
    }

    return parsed;
  } catch (err) {
    console.error("[copilot-router] classification error:", err);
    return { domain: "general", confidence: 0, intent: "classification_exception" };
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

    // Extract the latest user message for classification
    const lastUserMsg = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");
    const userText = lastUserMsg?.content || "";

    // Extract user ID from Authorization header if present
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

    // Step 1: Classify intent
    const classification = await classifyIntent(userText, context);
    console.log(
      `[copilot-router] domain=${classification.domain} confidence=${classification.confidence} intent="${classification.intent}"`
    );

    // Step 2: Log classification (non-blocking)
    logClassification(userText, classification, userId);

    // Step 3: Route to dedicated domain handler
    const handlerMap: Record<string, string> = {
      scoring: 'copilot-scoring-handler',
      screener: 'copilot-screener-handler',
      research: 'copilot-research-handler',
      general: 'trading-copilot',
    };
    const handlerName = handlerMap[classification.domain] ?? 'trading-copilot';
    const handlerUrl = `${SUPABASE_URL}/functions/v1/${handlerName}`;

    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: Deno.env.get('SUPABASE_ANON_KEY') || '',
    };
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    const downstreamResp = await fetch(handlerUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify({ messages, language, context, prewarmed }),
    });

    if (!downstreamResp.ok) {
      return new Response(downstreamResp.body, {
        status: downstreamResp.status,
        headers: {
          ...corsHeaders,
          "Content-Type":
            downstreamResp.headers.get("Content-Type") ?? "application/json",
        },
      });
    }

    // Step 4: Pipe SSE stream directly — no buffering
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
