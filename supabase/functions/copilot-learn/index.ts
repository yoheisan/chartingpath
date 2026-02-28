/**
 * copilot-learn
 * 
 * Automated feedback-to-rules pipeline. Runs daily.
 * 
 * 1. Reads failed training pairs (reward_score < 0) from last 7 days
 * 2. Reads content gaps from copilot_feedback
 * 3. Sends batches to Gemini to extract corrective rules
 * 4. Inserts validated rules into copilot_learned_rules
 * 5. Deactivates stale auto-generated rules (unused for 30 days)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 10;
const MAX_RULES_PER_BATCH = 3;

interface ExtractedRule {
  rule_type: string;
  trigger_pattern: string;
  rule_content: string;
  confidence: number;
}

async function extractRulesFromBatch(
  failures: any[],
  gaps: any[],
  apiKey: string
): Promise<ExtractedRule[]> {
  const failureDescriptions = failures.map((f, i) => 
    `Failure ${i + 1}:\n  Prompt: "${f.prompt?.substring(0, 300)}"\n  Response issue: reward_score=${f.reward_score}\n  Tools used: ${JSON.stringify(f.tool_calls?.map((tc: any) => tc.name) || [])}\n  Outcome: ${JSON.stringify(f.outcome_signals || {})}`
  ).join("\n\n");

  const gapDescriptions = gaps.map((g, i) =>
    `Gap ${i + 1}:\n  Question: "${g.question?.substring(0, 300)}"\n  Intent: ${g.intent_category}\n  Gap: ${g.content_gap_description}\n  Priority: ${g.priority_score}`
  ).join("\n\n");

  const prompt = `You are analyzing a trading copilot's failed interactions and content gaps to extract corrective rules.

## Failed Interactions (low reward scores)
${failureDescriptions || "None in this batch"}

## Content Gaps Identified
${gapDescriptions || "None in this batch"}

Extract 1-${MAX_RULES_PER_BATCH} corrective rules that would prevent these failures in the future. Each rule should be actionable and specific.

Return a JSON array (no markdown fences):
[
  {
    "rule_type": "one of: intent_disambiguation, data_awareness, response_format, tool_selection, temporal_context, fallback_behavior",
    "trigger_pattern": "regex or keyword pattern that triggers this rule, e.g. 'market.*end|close.*today'",
    "rule_content": "The specific instruction for the copilot to follow when this pattern matches",
    "confidence": 0.5 to 1.0
  }
]

Guidelines:
- Only extract rules that address CLEAR patterns in the failures
- trigger_pattern should be a lowercase regex-compatible string
- rule_content should be a concise instruction (1-2 sentences)
- Set confidence based on how clearly the pattern emerges (multiple similar failures = higher confidence)
- If no clear patterns emerge, return an empty array []`;

  try {
    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a machine learning feedback analyzer. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!resp.ok) {
      console.error("[copilot-learn] Gemini API error:", resp.status);
      return [];
    }

    const result = await resp.json();
    const content = result.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const rules: ExtractedRule[] = JSON.parse(cleaned);
    
    // Validate structure
    return rules.filter(
      (r) =>
        r.rule_type &&
        r.trigger_pattern &&
        r.rule_content &&
        typeof r.confidence === "number" &&
        r.confidence >= 0.5 &&
        r.confidence <= 1.0
    );
  } catch (err) {
    console.error("[copilot-learn] Rule extraction failed:", err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log("[copilot-learn] Starting automated feedback-to-rules pipeline...");

    // Fetch failed training pairs and content gaps in parallel
    const [failedPairs, contentGaps] = await Promise.all([
      supabase
        .from("copilot_training_pairs")
        .select("prompt, response, tool_calls, tool_results, outcome_signals, reward_score")
        .lt("reward_score", 0)
        .gte("created_at", sevenDaysAgo)
        .order("reward_score", { ascending: true })
        .limit(50),

      supabase
        .from("copilot_feedback")
        .select("question, intent_category, content_gap_description, priority_score")
        .eq("content_gap_identified", true)
        .gte("created_at", sevenDaysAgo)
        .order("priority_score", { ascending: false })
        .limit(30),
    ]);

    const failures = failedPairs.data || [];
    const gaps = contentGaps.data || [];

    console.log(`[copilot-learn] Found ${failures.length} failed pairs, ${gaps.length} content gaps`);

    if (failures.length === 0 && gaps.length === 0) {
      console.log("[copilot-learn] No data to process. Pipeline complete.");
      return new Response(
        JSON.stringify({ success: true, rules_created: 0, message: "No failures or gaps to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process in batches
    const allRules: ExtractedRule[] = [];
    const totalItems = failures.length + gaps.length;
    const batchCount = Math.ceil(totalItems / BATCH_SIZE);

    for (let i = 0; i < Math.min(batchCount, 5); i++) { // Max 5 batches to limit API calls
      const batchFailures = failures.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const batchGaps = gaps.slice(
        Math.max(0, i * BATCH_SIZE - failures.length),
        Math.max(0, (i + 1) * BATCH_SIZE - failures.length)
      );

      if (batchFailures.length === 0 && batchGaps.length === 0) continue;

      console.log(`[copilot-learn] Processing batch ${i + 1}/${Math.min(batchCount, 5)}: ${batchFailures.length} failures, ${batchGaps.length} gaps`);

      const rules = await extractRulesFromBatch(batchFailures, batchGaps, geminiKey);
      allRules.push(...rules);

      // Small delay between batches to avoid rate limiting
      if (i < batchCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`[copilot-learn] Extracted ${allRules.length} rules total`);

    // Deduplicate by trigger_pattern
    const uniqueRules = new Map<string, ExtractedRule>();
    for (const rule of allRules) {
      const key = rule.trigger_pattern;
      if (!uniqueRules.has(key) || (uniqueRules.get(key)!.confidence < rule.confidence)) {
        uniqueRules.set(key, rule);
      }
    }

    // Check for existing rules with same trigger_pattern to avoid duplicates
    const existingTriggers = new Set<string>();
    if (uniqueRules.size > 0) {
      const { data: existing } = await supabase
        .from("copilot_learned_rules")
        .select("trigger_pattern")
        .eq("is_active", true)
        .eq("source", "auto_feedback_loop");
      
      if (existing) {
        for (const e of existing) {
          existingTriggers.add(e.trigger_pattern);
        }
      }
    }

    // Insert new rules
    const newRules = [...uniqueRules.values()].filter(
      (r) => !existingTriggers.has(r.trigger_pattern)
    );

    let insertedCount = 0;
    if (newRules.length > 0) {
      const autoExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      const { error: insertError } = await supabase
        .from("copilot_learned_rules")
        .insert(
          newRules.map((r) => ({
            rule_type: r.rule_type,
            trigger_pattern: r.trigger_pattern,
            rule_content: r.rule_content,
            confidence: r.confidence,
            source: "auto_feedback_loop",
            is_active: true,
            auto_expires_at: autoExpiresAt,
          }))
        );

      if (insertError) {
        console.error("[copilot-learn] Insert error:", insertError);
      } else {
        insertedCount = newRules.length;
        console.log(`[copilot-learn] Inserted ${insertedCount} new rules`);
      }
    }

    // Deactivate stale auto-generated rules (unused for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: deactivated } = await supabase
      .from("copilot_learned_rules")
      .update({ is_active: false })
      .eq("source", "auto_feedback_loop")
      .eq("usage_count", 0)
      .lt("created_at", thirtyDaysAgo)
      .select("id");

    const deactivatedCount = deactivated?.length || 0;
    if (deactivatedCount > 0) {
      console.log(`[copilot-learn] Deactivated ${deactivatedCount} stale rules`);
    }

    // Also deactivate expired rules
    const { data: expired } = await supabase
      .from("copilot_learned_rules")
      .update({ is_active: false })
      .eq("source", "auto_feedback_loop")
      .not("auto_expires_at", "is", null)
      .lt("auto_expires_at", new Date().toISOString())
      .select("id");

    const expiredCount = expired?.length || 0;
    if (expiredCount > 0) {
      console.log(`[copilot-learn] Deactivated ${expiredCount} expired rules`);
    }

    const summary = {
      success: true,
      failures_analyzed: failures.length,
      gaps_analyzed: gaps.length,
      rules_extracted: allRules.length,
      rules_created: insertedCount,
      rules_deactivated: deactivatedCount + expiredCount,
      skipped_duplicates: uniqueRules.size - newRules.length,
    };

    console.log("[copilot-learn] Pipeline complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[copilot-learn] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
