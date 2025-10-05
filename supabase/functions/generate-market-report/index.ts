import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timezone, markets, timeSpan, tone } = await req.json();
    
    console.log("Generating market report:", { timezone, markets, timeSpan, tone });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt based on user preferences
    const marketList = markets.join(", ");
    const timeSpanText = timeSpan === "previous_day" ? "previous trading day" : "past 5 trading sessions";
    
    let toneInstruction = "";
    switch (tone) {
      case "concise":
        toneInstruction = "Keep it brief and bullet-pointed. Maximum 400 words.";
        break;
      case "narrative":
        toneInstruction = "Write in a flowing narrative style with context and stories. Maximum 600 words.";
        break;
      case "professional":
        toneInstruction = "Use professional financial terminology and structured analysis. Maximum 500 words.";
        break;
    }

    const systemPrompt = `You are an expert financial market analyst providing daily market breadth reports. 

Your task is to generate a comprehensive market summary based on the parameters provided. 

IMPORTANT INSTRUCTIONS:
- Use real-time context from your training data (up to your knowledge cutoff)
- If you don't have exact recent data, provide general market context and trends
- Focus on educational value and typical market behaviors
- Always acknowledge that this is a general analysis and traders should verify with real-time data

Structure your report with these sections:
1. Overall Market Breadth - sentiment and direction in each market
2. Top 3 Market Drivers - news, events, economic data releases
3. Performance Highlights - which assets/sectors outperformed or underperformed
4. Cross-Market Correlations - how markets influenced each other
5. Market-Specific Insights:
   - For Stocks: index movements, sector rotation
   - For Forex: central bank impacts on currency pairs
   - For Crypto: 24h price movements, sentiment, altcoin highlights
   - For Commodities: supply/demand factors, price drivers
6. Trader Takeaway - actionable high-level insight

Format in clean Markdown with headings (##, ###). ${toneInstruction}

CRITICAL: Keep the report mobile-friendly and email-ready. Use clear headings and concise paragraphs.`;

    const userPrompt = `Generate a market breadth report for the ${timeSpanText}.

**Parameters:**
- Timezone: ${timezone}
- Markets: ${marketList}
- Tone: ${tone}

Provide a thorough analysis covering all requested markets with actionable insights for traders.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const report = data.choices[0].message.content;

    console.log("Report generated successfully");

    return new Response(
      JSON.stringify({ report }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-market-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});