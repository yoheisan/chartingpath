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

    const systemPrompt = `You are a senior financial market analyst writing for Financial Times. Your writing style mirrors the FT's precision, authority, and editorial excellence.

WRITING STYLE REQUIREMENTS:
- Use proper institution names (e.g., "Bank of Japan" or "BoJ", not "Central Bank")
- Use specific terminology: Federal Reserve/Fed, European Central Bank/ECB, Bank of England/BoE, Bank of Japan/BoJ, People's Bank of China/PBoC
- Write in active voice with clear, declarative sentences
- Use specific numbers, percentages, and basis points (bps) when referencing moves
- Reference actual indices by name: S&P 500, Nasdaq Composite, Dow Jones, FTSE 100, DAX, Nikkei 225, etc.
- Cite real economic indicators: NFP, CPI, PMI, GDP, jobless claims, etc.
- Reference actual currency pairs: EUR/USD, GBP/USD, USD/JPY, etc.
- Name specific cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), etc.
- Mention real commodities: WTI crude, Brent crude, gold, copper, wheat, etc.

CONTENT ACCURACY:
- Base your analysis on real market patterns and historical behaviors you know from your training data
- Use precise financial terminology and proper institution names
- Reference actual geopolitical events, central bank actions, and economic data releases that typically move markets
- Acknowledge when you're providing general market context vs. specific recent data

STRUCTURE (use ## for main sections, ### for subsections):
1. **Market Overview** - Opening paragraph summarizing the day's sentiment across markets
2. **Equity Markets** - Major indices performance, sector rotation, notable movers
3. **Foreign Exchange** - Currency pair movements, central bank influence, interest rate differentials
4. **Cryptocurrencies** - Bitcoin/Ethereum performance, market sentiment, regulatory developments
5. **Commodities** - Energy, metals, agricultural products - supply/demand factors
6. **Economic Data & Central Banks** - Key releases, policy statements, forward guidance
7. **Cross-Asset Correlations** - How different markets influenced each other
8. **Outlook** - What traders should watch for next session

FORMATTING:
${toneInstruction}
- Use **bold** for key terms, numbers, and emphasis (e.g., **2.3%**, **Federal Reserve**, **dovish pivot**)
- Keep paragraphs concise (2-4 sentences)
- Use proper section headings
- Write in a professional, authoritative tone
- Mobile-friendly and email-ready formatting

CRITICAL: This must read like it was edited by FT's editorial team - precise, factual, and professionally formatted.`;

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