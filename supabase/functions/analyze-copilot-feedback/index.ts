import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackAnalysis {
  topics: string[];
  intentCategory: string;
  qualityScore: number;
  contentGapIdentified: boolean;
  contentGapDescription: string | null;
  priorityScore: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, response, sessionId, userId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to analyze the question and response quality
    const analysisPrompt = `Analyze this trading copilot conversation for quality and content gaps.

Question: "${question}"
Response: "${response?.substring(0, 1000) || 'No response yet'}"

Respond with a JSON object (no markdown):
{
  "topics": ["array", "of", "topics"], // e.g., ["bull flag", "crypto", "entry strategy"]
  "intentCategory": "one of: pattern_search, education, statistics, pine_script, general_question, unclear",
  "qualityScore": 1-5, // 5 = excellent question, 1 = unclear/spam
  "contentGapIdentified": true/false, // true if the question reveals missing content/features
  "contentGapDescription": "description of what content/feature is missing, or null",
  "priorityScore": 0-100 // higher = more urgent to address (based on gap importance and question quality)
}

Priority scoring guidelines:
- 80-100: Critical missing feature that many users would need
- 60-79: Important content gap (e.g., pattern not documented)
- 40-59: Nice-to-have improvement
- 20-39: Minor enhancement
- 0-19: Not a content gap or low-quality question`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a content quality analyzer. Return only valid JSON." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResp.ok) {
      console.error("AI analysis failed:", aiResp.status);
      // Store with defaults if AI fails
      const { error } = await supabase.from("copilot_feedback").insert({
        user_id: userId || null,
        session_id: sessionId,
        question,
        response: response?.substring(0, 5000),
        quality_score: 3,
        topics: [],
        intent_category: "unknown",
        content_gap_identified: false,
        priority_score: 0,
      });

      if (error) console.error("Failed to store feedback:", error);
      
      return new Response(JSON.stringify({ stored: true, analyzed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResp.json();
    const content = result.choices?.[0]?.message?.content || "{}";
    
    let analysis: FeedbackAnalysis;
    try {
      // Clean up any markdown code fences
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse AI analysis:", content);
      analysis = {
        topics: [],
        intentCategory: "unknown",
        qualityScore: 3,
        contentGapIdentified: false,
        contentGapDescription: null,
        priorityScore: 0,
      };
    }

    // Store the analyzed feedback
    const { error } = await supabase.from("copilot_feedback").insert({
      user_id: userId || null,
      session_id: sessionId,
      question,
      response: response?.substring(0, 5000),
      quality_score: analysis.qualityScore,
      topics: analysis.topics,
      intent_category: analysis.intentCategory,
      content_gap_identified: analysis.contentGapIdentified,
      content_gap_description: analysis.contentGapDescription,
      priority_score: analysis.priorityScore,
    });

    if (error) {
      console.error("Failed to store feedback:", error);
      throw error;
    }

    return new Response(JSON.stringify({ 
      stored: true, 
      analyzed: true,
      analysis 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-copilot-feedback error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
