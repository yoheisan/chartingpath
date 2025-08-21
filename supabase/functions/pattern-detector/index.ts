import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CandleData {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  t: number; // timestamp
}

interface PatternResult {
  detected: boolean;
  confidence: number;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Pattern detector function started");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabaseService
      .from("alerts")
      .select(`
        *,
        profiles!inner(email, subscription_status)
      `)
      .eq("status", "active")
      .eq("profiles.subscription_status", "active");

    if (alertsError) {
      throw new Error(`Failed to fetch alerts: ${alertsError.message}`);
    }

    console.log(`Processing ${alerts?.length || 0} active alerts`);

    const processedAlerts = [];

    for (const alert of alerts || []) {
      try {
        console.log(`Processing alert ${alert.id} for ${alert.symbol}`);

        // Fetch market data from Finnhub
        const marketData = await fetchMarketData(alert.symbol, alert.timeframe);
        
        if (!marketData || marketData.length < 5) {
          console.log(`Insufficient market data for ${alert.symbol}`);
          continue;
        }

        // Detect pattern
        const patternResult = detectPattern(marketData, alert.pattern);
        
        if (patternResult.detected) {
          console.log(`Pattern detected for ${alert.symbol}: ${alert.pattern}`);

          // Log the detection
          const { error: logError } = await supabaseService
            .from("alerts_log")
            .insert({
              alert_id: alert.id,
              pattern_data: {
                pattern: alert.pattern,
                confidence: patternResult.confidence,
                description: patternResult.description
              },
              price_data: {
                symbol: alert.symbol,
                timeframe: alert.timeframe,
                current_price: marketData[marketData.length - 1].c,
                candle_data: marketData.slice(-3) // Last 3 candles
              }
            });

          if (logError) {
            console.error(`Failed to log alert ${alert.id}:`, logError);
          }

          // Send email alert
          try {
            const emailResult = await supabaseService.functions.invoke('send-pattern-alert', {
              body: {
                alert,
                patternResult,
                marketData: marketData.slice(-3)
              }
            });

            if (emailResult.error) {
              console.error(`Failed to send email for alert ${alert.id}:`, emailResult.error);
            } else {
              // Update log with email sent status
              await supabaseService
                .from("alerts_log")
                .update({ 
                  email_sent: true, 
                  email_sent_at: new Date().toISOString() 
                })
                .eq("alert_id", alert.id)
                .order("triggered_at", { ascending: false })
                .limit(1);
            }
          } catch (emailError) {
            console.error(`Email sending error for alert ${alert.id}:`, emailError);
          }

          processedAlerts.push({
            alertId: alert.id,
            symbol: alert.symbol,
            pattern: alert.pattern,
            detected: true
          });
        }
      } catch (alertError) {
        console.error(`Error processing alert ${alert.id}:`, alertError);
      }
    }

    console.log(`Pattern detection completed. Processed ${processedAlerts.length} alerts`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedAlerts.length,
      alerts: processedAlerts
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Pattern detector error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function fetchMarketData(symbol: string, timeframe: string): Promise<CandleData[]> {
  try {
    const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
    if (!finnhubKey) {
      throw new Error("FINNHUB_API_KEY not configured");
    }

    // Convert timeframe to Finnhub format
    const resolution = timeframe === '15m' ? '15' : 
                      timeframe === '1h' ? '60' : 
                      timeframe === '4h' ? '240' : 'D';

    const to = Math.floor(Date.now() / 1000);
    const from = to - (resolution === 'D' ? 30 * 24 * 60 * 60 : 100 * 60 * parseInt(resolution));

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${finnhubKey}`;
    
    console.log(`Fetching market data for ${symbol} with resolution ${resolution}`);
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.s !== 'ok') {
      throw new Error(`Market data error: ${data.s}`);
    }

    // Convert to our format
    const candles: CandleData[] = [];
    for (let i = 0; i < data.c.length; i++) {
      candles.push({
        o: data.o[i],
        h: data.h[i],
        l: data.l[i],
        c: data.c[i],
        v: data.v[i],
        t: data.t[i]
      });
    }

    return candles.slice(-20); // Return last 20 candles for analysis
  } catch (error) {
    console.error(`Failed to fetch market data for ${symbol}:`, error);
    return [];
  }
}

function detectPattern(candles: CandleData[], pattern: string): PatternResult {
  if (candles.length < 3) {
    return { detected: false, confidence: 0, description: "Insufficient data" };
  }

  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  const beforePrevious = candles[candles.length - 3];

  switch (pattern) {
    case 'hammer':
      return detectHammer(latest);
    
    case 'inverted_hammer':
      return detectInvertedHammer(latest);
    
    case 'bullish_engulfing':
      return detectBullishEngulfing(previous, latest);
    
    case 'bearish_engulfing':
      return detectBearishEngulfing(previous, latest);
    
    case 'doji':
      return detectDoji(latest);
    
    case 'morning_star':
      return detectMorningStar(beforePrevious, previous, latest);
    
    case 'evening_star':
      return detectEveningStar(beforePrevious, previous, latest);
    
    case 'ema_cross_bullish':
      return detectEmaCross(candles, true);
    
    case 'ema_cross_bearish':
      return detectEmaCross(candles, false);
    
    case 'rsi_divergence_bullish':
      return detectRsiDivergence(candles, true);
    
    case 'rsi_divergence_bearish':
      return detectRsiDivergence(candles, false);
    
    default:
      return { detected: false, confidence: 0, description: "Unknown pattern" };
  }
}

function detectHammer(candle: CandleData): PatternResult {
  const body = Math.abs(candle.c - candle.o);
  const upperShadow = candle.h - Math.max(candle.c, candle.o);
  const lowerShadow = Math.min(candle.c, candle.o) - candle.l;
  const totalRange = candle.h - candle.l;

  // Hammer: small body, long lower shadow, minimal upper shadow
  const isHammer = 
    body < totalRange * 0.3 && // Small body
    lowerShadow > body * 2 && // Long lower shadow
    upperShadow < body * 0.5; // Minimal upper shadow

  return {
    detected: isHammer,
    confidence: isHammer ? 0.8 : 0,
    description: isHammer ? "Hammer pattern detected - potential bullish reversal" : "No hammer pattern"
  };
}

function detectInvertedHammer(candle: CandleData): PatternResult {
  const body = Math.abs(candle.c - candle.o);
  const upperShadow = candle.h - Math.max(candle.c, candle.o);
  const lowerShadow = Math.min(candle.c, candle.o) - candle.l;
  const totalRange = candle.h - candle.l;

  // Inverted Hammer: small body, long upper shadow, minimal lower shadow
  const isInvertedHammer = 
    body < totalRange * 0.3 && // Small body
    upperShadow > body * 2 && // Long upper shadow
    lowerShadow < body * 0.5; // Minimal lower shadow

  return {
    detected: isInvertedHammer,
    confidence: isInvertedHammer ? 0.8 : 0,
    description: isInvertedHammer ? "Inverted hammer pattern detected - potential bullish reversal" : "No inverted hammer pattern"
  };
}

function detectBullishEngulfing(prev: CandleData, curr: CandleData): PatternResult {
  const prevBearish = prev.c < prev.o;
  const currBullish = curr.c > curr.o;
  const engulfs = curr.o < prev.c && curr.c > prev.o;

  const isBullishEngulfing = prevBearish && currBullish && engulfs;

  return {
    detected: isBullishEngulfing,
    confidence: isBullishEngulfing ? 0.85 : 0,
    description: isBullishEngulfing ? "Bullish engulfing pattern detected - strong bullish signal" : "No bullish engulfing pattern"
  };
}

function detectBearishEngulfing(prev: CandleData, curr: CandleData): PatternResult {
  const prevBullish = prev.c > prev.o;
  const currBearish = curr.c < curr.o;
  const engulfs = curr.o > prev.c && curr.c < prev.o;

  const isBearishEngulfing = prevBullish && currBearish && engulfs;

  return {
    detected: isBearishEngulfing,
    confidence: isBearishEngulfing ? 0.85 : 0,
    description: isBearishEngulfing ? "Bearish engulfing pattern detected - strong bearish signal" : "No bearish engulfing pattern"
  };
}

function detectDoji(candle: CandleData): PatternResult {
  const body = Math.abs(candle.c - candle.o);
  const totalRange = candle.h - candle.l;

  // Doji: very small body relative to total range
  const isDoji = body < totalRange * 0.1;

  return {
    detected: isDoji,
    confidence: isDoji ? 0.75 : 0,
    description: isDoji ? "Doji pattern detected - market indecision" : "No doji pattern"
  };
}

function detectMorningStar(first: CandleData, second: CandleData, third: CandleData): PatternResult {
  const firstBearish = first.c < first.o;
  const secondSmall = Math.abs(second.c - second.o) < Math.abs(first.c - first.o) * 0.5;
  const thirdBullish = third.c > third.o;
  const gapDown = second.h < first.l;
  const gapUp = third.l > second.h;

  const isMorningStar = firstBearish && secondSmall && thirdBullish && (gapDown || gapUp);

  return {
    detected: isMorningStar,
    confidence: isMorningStar ? 0.9 : 0,
    description: isMorningStar ? "Morning star pattern detected - strong bullish reversal" : "No morning star pattern"
  };
}

function detectEveningStar(first: CandleData, second: CandleData, third: CandleData): PatternResult {
  const firstBullish = first.c > first.o;
  const secondSmall = Math.abs(second.c - second.o) < Math.abs(first.c - first.o) * 0.5;
  const thirdBearish = third.c < third.o;
  const gapUp = second.l > first.h;
  const gapDown = third.h < second.l;

  const isEveningStar = firstBullish && secondSmall && thirdBearish && (gapUp || gapDown);

  return {
    detected: isEveningStar,
    confidence: isEveningStar ? 0.9 : 0,
    description: isEveningStar ? "Evening star pattern detected - strong bearish reversal" : "No evening star pattern"
  };
}

function detectEmaCross(candles: CandleData[], bullish: boolean): PatternResult {
  if (candles.length < 10) {
    return { detected: false, confidence: 0, description: "Insufficient data for EMA analysis" };
  }

  // Calculate simple moving averages as proxy for EMA
  const sma9 = calculateSMA(candles.slice(-9), 9);
  const sma21 = calculateSMA(candles.slice(-21), 21);
  const prevSma9 = calculateSMA(candles.slice(-10, -1), 9);
  const prevSma21 = calculateSMA(candles.slice(-22, -1), 21);

  const currentCross = bullish ? sma9 > sma21 : sma9 < sma21;
  const previousCross = bullish ? prevSma9 <= prevSma21 : prevSma9 >= prevSma21;
  
  const isCross = currentCross && previousCross;

  return {
    detected: isCross,
    confidence: isCross ? 0.7 : 0,
    description: isCross ? `EMA cross detected - ${bullish ? 'bullish' : 'bearish'} signal` : "No EMA cross detected"
  };
}

function detectRsiDivergence(candles: CandleData[], bullish: boolean): PatternResult {
  // Simplified RSI divergence detection
  // In a real implementation, you'd calculate actual RSI values
  if (candles.length < 14) {
    return { detected: false, confidence: 0, description: "Insufficient data for RSI analysis" };
  }

  const prices = candles.map(c => c.c);
  const recent = prices.slice(-5);
  const earlier = prices.slice(-10, -5);

  const recentTrend = recent[recent.length - 1] - recent[0];
  const earlierTrend = earlier[earlier.length - 1] - earlier[0];

  // Simplified divergence check
  const hasDivergence = bullish ? 
    (recentTrend < 0 && earlierTrend < recentTrend) : // Bullish: lower lows
    (recentTrend > 0 && earlierTrend > recentTrend);   // Bearish: higher highs

  return {
    detected: hasDivergence,
    confidence: hasDivergence ? 0.6 : 0,
    description: hasDivergence ? `RSI divergence detected - ${bullish ? 'bullish' : 'bearish'} signal` : "No RSI divergence detected"
  };
}

function calculateSMA(candles: CandleData[], period: number): number {
  const prices = candles.slice(-period).map(c => c.c);
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}