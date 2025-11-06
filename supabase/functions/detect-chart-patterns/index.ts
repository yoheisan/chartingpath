import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OHLCBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PatternDetectionRequest {
  patternType: string; // 'head-shoulders', 'double-top', etc.
  ohlcData: OHLCBar[];
  patternConfig: {
    tolerance?: number; // % tolerance for pattern matching
    minBars?: number; // minimum bars required
    volumeConfirmation?: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patternType, ohlcData, patternConfig }: PatternDetectionRequest = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build detection prompt based on pattern type
    const detectionPrompt = buildDetectionPrompt(patternType, ohlcData, patternConfig);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07",
        messages: [
          {
            role: "system",
            content: `You are an expert technical analysis pattern recognition system. Analyze OHLC price data to detect specific chart patterns with high precision.

Your task is to:
1. Identify if the pattern exists in the data
2. Mark exact entry, stop loss, and take profit levels
3. Calculate pattern quality score (0-100)
4. Provide Fibonacci levels for harmonic patterns
5. Return structured JSON output only

Be strict - only detect patterns that meet professional criteria.`
          },
          {
            role: "user",
            content: detectionPrompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "pattern_detected",
              description: "Report detected chart pattern with precise levels",
              parameters: {
                type: "object",
                properties: {
                  detected: { type: "boolean" },
                  confidence: { type: "number", minimum: 0, maximum: 100 },
                  entryPrice: { type: "number" },
                  stopLoss: { type: "number" },
                  takeProfit: { type: "number" },
                  patternStartIndex: { type: "integer" },
                  patternEndIndex: { type: "integer" },
                  keyLevels: {
                    type: "object",
                    properties: {
                      neckline: { type: "number" },
                      leftShoulder: { type: "number" },
                      head: { type: "number" },
                      rightShoulder: { type: "number" },
                      support: { type: "number" },
                      resistance: { type: "number" },
                      fibonacciLevels: {
                        type: "object",
                        properties: {
                          "0.382": { type: "number" },
                          "0.500": { type: "number" },
                          "0.618": { type: "number" },
                          "0.786": { type: "number" }
                        }
                      }
                    }
                  },
                  volumeConfirmed: { type: "boolean" },
                  notes: { type: "string" }
                },
                required: ["detected", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "pattern_detected" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please check your OpenAI account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No pattern detection result from AI");
    }

    const detectionResult = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        pattern: detectionResult,
        algorithm: generateAlgorithmCode(patternType, detectionResult)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Pattern detection error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Pattern detection failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildDetectionPrompt(
  patternType: string,
  ohlcData: OHLCBar[],
  config: any
): string {
  const dataString = ohlcData.map((bar, idx) => 
    `[${idx}] O:${bar.open} H:${bar.high} L:${bar.low} C:${bar.close} V:${bar.volume || 0}`
  ).join("\n");

  const patternInstructions: Record<string, string> = {
    "head-shoulders": `
Detect HEAD & SHOULDERS pattern:
- Find 3 peaks: left shoulder, head (highest), right shoulder
- Neckline: support line connecting lows between peaks
- Shoulders should be roughly equal height
- Head must be significantly higher than shoulders
- Volume should decrease on right shoulder
- Entry: break below neckline
- Stop: above right shoulder high
- Target: measured move (head to neckline distance projected down)
`,
    "inverse-head-shoulders": `
Detect INVERSE HEAD & SHOULDERS pattern:
- Find 3 troughs: left shoulder, head (lowest), right shoulder
- Neckline: resistance connecting highs between troughs
- Entry: break above neckline
- Stop: below right shoulder low
- Target: measured move upward
`,
    "double-top": `
Detect DOUBLE TOP pattern:
- Two peaks at approximately same level (within 2% tolerance)
- Valley between peaks (support level)
- Second peak fails to break above first peak
- Entry: break below valley support
- Stop: above second peak
- Target: valley depth projected down
`,
    "double-bottom": `
Detect DOUBLE BOTTOM pattern:
- Two troughs at approximately same level
- Peak between troughs (resistance)
- Entry: break above peak resistance
- Stop: below second trough
- Target: valley height projected up
`,
    "bull-flag": `
Detect BULL FLAG pattern:
- Sharp upward move (flagpole)
- Tight downward-sloping consolidation (flag)
- Entry: break above flag resistance
- Stop: below flag support
- Target: flagpole height projected up
`,
    "gartley": `
Detect GARTLEY HARMONIC pattern:
- XA leg: initial move
- AB retracement: 61.8% of XA
- BC retracement: 38.2-88.6% of AB
- D completion: 78.6% of XA
- Must have precise Fibonacci ratios
- Entry: at point D
- Stop: beyond X
`,
    "bullish-engulfing": `
Detect BULLISH ENGULFING candlestick:
- Prior downtrend
- Small red candle followed by large green candle
- Green candle body completely engulfs red candle body
- Entry: open of next candle
- Stop: below engulfing low
`,
    "hammer": `
Detect HAMMER/PIN BAR:
- Long lower wick (2-3x body size)
- Small body at top of range
- Little to no upper wick
- At support level or end of downtrend
- Entry: break above hammer high
- Stop: below hammer low
`
  };

  return `${patternInstructions[patternType] || "Detect the specified chart pattern"}

OHLC Data (${ohlcData.length} bars):
${dataString}

Configuration:
- Tolerance: ${config.tolerance || 2}%
- Min Bars: ${config.minBars || 5}
- Volume Confirmation: ${config.volumeConfirmation ? "Required" : "Optional"}

Analyze this data and detect if the ${patternType} pattern exists.`;
}

function generateAlgorithmCode(patternType: string, detection: any): {
  pineScript: string;
  mt4: string;
  mt5: string;
} {
  // Generate exportable code templates
  return {
    pineScript: generatePineScript(patternType, detection),
    mt4: generateMT4Code(patternType, detection),
    mt5: generateMT5Code(patternType, detection)
  };
}

function generatePineScript(patternType: string, detection: any): string {
  return `// Pine Script v5 - ${patternType} Detection
//@version=5
indicator("${patternType} Detector", overlay=true)

// Pattern Detection Logic
// Entry: ${detection.entryPrice || 'N/A'}
// Stop Loss: ${detection.stopLoss || 'N/A'}
// Take Profit: ${detection.takeProfit || 'N/A'}

// Add your detection algorithm here
// This is a template - customize based on pattern requirements
`;
}

function generateMT4Code(patternType: string, detection: any): string {
  return `// MT4 Expert Advisor - ${patternType} Detection
// Entry: ${detection.entryPrice || 'N/A'}
// Stop Loss: ${detection.stopLoss || 'N/A'}
// Take Profit: ${detection.takeProfit || 'N/A'}

// Add your detection algorithm here
`;
}

function generateMT5Code(patternType: string, detection: any): string {
  return `// MT5 Expert Advisor - ${patternType} Detection
// Entry: ${detection.entryPrice || 'N/A'}
// Stop Loss: ${detection.stopLoss || 'N/A'}
// Take Profit: ${detection.takeProfit || 'N/A'}

// Add your detection algorithm here
`;
}
