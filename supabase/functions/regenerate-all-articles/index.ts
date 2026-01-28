// Regenerate All Articles - v2 with Lovable AI Gateway
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPREHENSIVE_ARTICLE_TEMPLATES: Record<string, string> = {
  'volume-analysis': `## Why Volume Matters in Trading

Volume is the lifeblood of the market. It represents the total number of shares or contracts traded during a specific period and provides crucial confirmation for price movements. Without volume analysis, you're essentially trading blind—seeing where price went but not understanding the conviction behind the move.

### The Psychology Behind Volume

Every trade requires both a buyer and a seller. High volume indicates strong conviction from market participants, while low volume suggests uncertainty or lack of interest. Understanding this dynamic gives you an edge in predicting whether a move will continue or reverse.

## Core Volume Principles

### Principle 1: Volume Confirms Trend

In a healthy uptrend, volume should increase on up days and decrease on down days. This shows that buyers are aggressive when prices rise and sellers are passive when prices decline. The opposite applies to downtrends.

**Bullish Confirmation:**
- Rising prices + rising volume = Strong uptrend
- Pullback + declining volume = Healthy consolidation

**Bearish Confirmation:**
- Falling prices + rising volume = Strong downtrend
- Rally + declining volume = Weak bounce (likely to fail)

### Principle 2: Volume Precedes Price

Often, volume changes before price direction changes. A surge in volume after a prolonged trend may signal exhaustion. Look for volume spikes at potential reversal points.

### Principle 3: Breakouts Require Volume

A breakout without volume is suspect. When price breaks through support or resistance, volume should be at least 50% above average to confirm the move is genuine. Low-volume breakouts frequently fail.

## Key Volume Patterns

### 1. Accumulation

Accumulation occurs when institutional investors quietly buy shares over time without dramatically moving the price. Signs include:

- Price consolidates in a range
- Volume gradually increases
- More up-volume days than down-volume days
- Price holds above key support levels

This pattern often precedes significant upward moves as institutions complete their buying.

### 2. Distribution

Distribution is the opposite—institutions selling their positions. Signs include:

- Price stalls after an uptrend
- Volume increases on down days
- Failed rallies on declining volume
- Lower highs forming

Distribution often precedes major declines.

### 3. Climax Volume

Climax volume represents exhaustion—an extreme spike in volume that often marks trend endings. Characteristics:

**Buying Climax:**
- Occurs after extended uptrend
- Massive volume spike (2-3x normal)
- Wide price range
- Often closes near the low
- Signals potential top

**Selling Climax:**
- Occurs after extended downtrend
- Massive volume spike
- Wide price range
- Often closes near the high
- Signals potential bottom

### 4. Drying Up Volume

When volume gradually decreases during a trend, it suggests the move is losing momentum. This "drying up" often precedes reversals or consolidation periods.

## Volume Indicators

### On-Balance Volume (OBV)

OBV creates a running total of volume, adding volume on up days and subtracting on down days. It helps identify:

- **Divergences:** When OBV trends differently than price
- **Confirmation:** When OBV confirms price direction
- **Breakouts:** OBV breaking out before price can signal upcoming moves

### Volume Weighted Average Price (VWAP)

VWAP calculates the average price weighted by volume. Institutional traders use it as a benchmark:

- Price above VWAP = Bullish intraday bias
- Price below VWAP = Bearish intraday bias
- VWAP acts as dynamic support/resistance

### Chaikin Money Flow (CMF)

CMF measures buying and selling pressure over a period:

- Positive CMF = Buying pressure (accumulation)
- Negative CMF = Selling pressure (distribution)
- Crossing zero line = Potential trend change

## Volume Trading Strategies

### Strategy 1: Volume Breakout Confirmation

**Setup:**
1. Identify a key resistance level
2. Wait for price to approach resistance
3. Look for volume building as price nears the level

**Entry:**
- Enter when price breaks resistance on volume 50%+ above average
- Place stop below the breakout level

**Target:**
- Measure the consolidation range and project upward

### Strategy 2: Volume Divergence

**Setup:**
1. Price makes a new high
2. Volume is lower than the previous high
3. This divergence signals weakening momentum

**Action:**
- Tighten stops on long positions
- Look for confirmation before shorting
- Wait for price confirmation (lower low) before acting

### Strategy 3: Accumulation Zone Entry

**Setup:**
1. Identify a stock in a trading range
2. Look for increasing volume on up moves
3. Confirm OBV is trending upward

**Entry:**
- Buy near support within the range
- Or buy the breakout above resistance

**Stop:**
- Below the accumulation zone support

## Combining Volume with Price Action

### Volume + Candlestick Patterns

Volume enhances candlestick pattern reliability:

- **Hammer on high volume** = Strong reversal signal
- **Doji on high volume** = Significant indecision
- **Engulfing pattern on high volume** = Powerful reversal

### Volume + Support/Resistance

- **High volume at support** = Strong buying interest (bullish)
- **High volume break of support** = Valid breakdown
- **Low volume at resistance** = Weak selling (potential breakout)

### Volume + Chart Patterns

- **Head and Shoulders:** Volume typically highest at left shoulder, decreases at head and right shoulder
- **Cup and Handle:** Volume dries up in handle, spikes on breakout
- **Triangles:** Volume contracts during formation, expands on breakout

## Common Volume Mistakes to Avoid

1. **Ignoring Context:** High volume means nothing without price context
2. **Expecting Perfection:** Volume patterns are guidelines, not guarantees
3. **Overcomplicating:** Focus on relative volume, not absolute numbers
4. **Ignoring Low Volume:** Sometimes what's NOT happening is important

## Professional Tips

- Compare current volume to the 20-day average
- Watch for volume climaxes at market extremes
- Use volume to filter false breakouts
- Pay attention to pre-market and after-hours volume for stocks
- Remember that volume analysis works best with liquid instruments

## Key Takeaways

1. **Volume confirms price moves** – Always check volume for validation
2. **Breakouts need volume** – Without it, expect failure
3. **Watch for divergences** – They often precede reversals
4. **Climax volume signals exhaustion** – Both at tops and bottoms
5. **Combine with other analysis** – Volume is one piece of the puzzle

Volume analysis is a skill that improves with practice. Start by observing volume patterns in your watchlist without trading, then gradually incorporate volume into your decision-making process. Over time, you'll develop an intuitive feel for what healthy volume looks like versus warning signs of trend exhaustion.`,

  'head-and-shoulders': `## Understanding the Head and Shoulders Pattern

The Head and Shoulders pattern is one of the most reliable and well-known chart patterns in technical analysis. It signals a potential reversal from a bullish trend to a bearish trend and has a remarkable 93% success rate according to Thomas Bulkowski's extensive research.

### Pattern Psychology

The pattern reflects a fundamental shift in market sentiment:

1. **Left Shoulder:** Bulls push price to a new high, but profit-taking causes a pullback
2. **Head:** Bulls try again, pushing to an even higher high, but selling pressure returns
3. **Right Shoulder:** Bulls make a final attempt but fail to reach the previous high—confidence wanes
4. **Breakdown:** The failure at the right shoulder triggers a shift to bearish sentiment

## Pattern Structure

### Left Shoulder
- Price rises to a peak on increasing volume
- A pullback follows on decreasing volume
- This creates the first peak and establishes initial support

### Head
- Price rallies again, exceeding the left shoulder high
- Volume may be similar or slightly less than left shoulder
- Another pullback occurs, often returning to the same support area

### Right Shoulder
- Price attempts another rally
- **Critical:** This rally fails to reach the head's height
- Volume is typically noticeably lower than head and left shoulder
- This lower high signals weakening bullish momentum

### Neckline
- Connect the lows after the left shoulder and head
- This line becomes crucial support and trigger level
- The neckline can be horizontal, upward-sloping, or downward-sloping
- Downward-sloping necklines often lead to more aggressive breakdowns

## Volume Confirmation

Volume behavior is crucial for pattern validity:

- **Left Shoulder:** Highest volume (peak buying enthusiasm)
- **Head:** Moderate volume (momentum slowing)
- **Right Shoulder:** Lowest volume (buyers exhausted)
- **Neckline Break:** Volume should surge on the breakdown

If volume doesn't decrease progressively from left to right, be skeptical of the pattern.

## Trading Strategy

### Entry Points

**Conservative Entry:**
- Wait for neckline break with closing candle below
- Ensures confirmation but may miss initial move
- Best for risk-averse traders

**Aggressive Entry:**
- Enter on right shoulder formation failure
- Look for rejection candles near resistance
- Higher reward but requires more skill

**Retest Entry:**
- After neckline breaks, price often retests from below
- Enter on the retest failure
- Offers excellent risk-reward
- Doesn't always occur

### Stop Loss Placement

**Above Right Shoulder:**
- Place stop above the right shoulder high
- Provides buffer for volatility
- Wider stop = smaller position size

**Above Neckline:**
- Tighter stop just above broken neckline
- Use for retest entries
- Smaller stop = larger position size

### Price Target Calculation

**Measured Move:**
1. Measure vertical distance from head to neckline
2. Project that distance downward from neckline break point
3. This gives minimum expected move

**Example:**
- Head at $100, Neckline at $90
- Distance = $10
- Breakdown at $90, Target = $80

## Inverse Head and Shoulders

The pattern also works in reverse at market bottoms:

### Characteristics
- Occurs after a downtrend
- Left shoulder, head, and right shoulder form as lows
- Neckline connects the highs
- Signals bullish reversal

### Key Differences
- Volume should increase on the breakout
- Often more reliable than the standard pattern
- Offers excellent risk-reward at market bottoms

## Real-World Application

### Confirmation Signals
- RSI divergence at head (lower high on RSI while price makes higher high)
- MACD crossover
- Moving average breakdown
- Increased volume on neckline break

### Warning Signs (Pattern May Fail)
- Very symmetrical pattern (too perfect)
- No volume confirmation
- Strong fundamental news against the breakdown
- Pattern forming against major trend

## Pattern Variations

### Complex Head and Shoulders
- Multiple left or right shoulders
- Takes longer to form
- Often leads to larger moves

### Sloped Necklines
- **Upward Sloping:** More bullish bias initially, sharper breakdown
- **Downward Sloping:** Already showing weakness, more reliable

### Time Frames
- The pattern works across all time frames
- Higher time frames (daily, weekly) are more reliable
- Intraday patterns need additional confirmation

## Common Mistakes to Avoid

1. **Anticipating the Pattern:** Wait for neckline break
2. **Ignoring Volume:** Volume must confirm
3. **Wrong Neckline Drawing:** Use swing lows, not intraday noise
4. **Forcing Patterns:** Not every three-peak formation is H&S
5. **Ignoring Context:** Consider overall market trend

## Statistical Performance (Bulkowski)

- **Success Rate:** 93% (bearish)
- **Average Decline:** 22%
- **Failure Rate:** 7%
- **Throwback Rate:** 45% (price retests neckline)

### Tips from Research
- Patterns with upward-sloping necklines perform better
- Larger patterns (longer formation time) lead to bigger moves
- Head significantly higher than shoulders is ideal

## Trading Plan Template

**Before Entry:**
1. Identify all pattern components
2. Draw the neckline accurately
3. Confirm volume progression
4. Set target and stop levels
5. Calculate position size

**Entry Checklist:**
- [ ] Clear left shoulder, head, right shoulder
- [ ] Right shoulder lower than head
- [ ] Decreasing volume trend
- [ ] Neckline break confirmed
- [ ] Volume surge on break

**After Entry:**
1. Set stop above right shoulder or neckline
2. First target: 50% of measured move
3. Second target: 100% of measured move
4. Trail stop after first target hit

## Key Takeaways

1. **Patience is essential** – Don't anticipate, wait for confirmation
2. **Volume tells the story** – Decreasing volume validates the pattern
3. **Neckline is the trigger** – No break, no trade
4. **Manage risk precisely** – Use the pattern for stop placement
5. **Consider the context** – Most reliable in uptrends after extended rallies

The Head and Shoulders pattern remains one of the most powerful tools in technical analysis. Master it, and you'll have a reliable method for identifying major trend reversals with excellent risk-reward characteristics.`,
};

// Generate comprehensive content using AI for articles not in templates
async function generateComprehensiveContent(
  article: { title: string; slug: string; category: string; excerpt: string; difficulty_level: string; tags: string[] },
  apiKey: string
): Promise<string> {
  const prompt = `You are an expert financial markets and trading education writer. Generate a comprehensive, professional educational article about "${article.title}".

Category: ${article.category}
Difficulty: ${article.difficulty_level}
Tags: ${article.tags.join(', ')}
Summary: ${article.excerpt}

Requirements:
- Write 1500-2500 words of rich, educational content
- Use proper markdown formatting with ## for main sections and ### for subsections
- Include practical examples and actionable trading strategies
- Cover: What it is, How it works, Trading strategies, Risk management, Common mistakes, Professional tips
- Be educational but engaging
- Include bullet points and numbered lists where appropriate
- End with Key Takeaways section
- Do NOT include the title in the content (it's displayed separately)
- Start directly with the first ## section

Return ONLY the markdown content, no JSON wrapper or additional text.`;

  // Use Lovable AI gateway with correct model name
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-mini',
      messages: [
        { role: 'system', content: 'You are an expert trading education content writer. Generate comprehensive, well-structured educational articles in markdown format.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Prefer Lovable API key, fall back to OpenAI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const aiApiKey = lovableApiKey || openAIApiKey;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { slugs, useTemplatesOnly } = await req.json() || {};

    // Fetch articles to regenerate
    let query = supabase
      .from('learning_articles')
      .select('id, title, slug, category, excerpt, difficulty_level, tags, content')
      .eq('status', 'published');

    if (slugs && Array.isArray(slugs) && slugs.length > 0) {
      query = query.in('slug', slugs);
    }

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    console.log(`Found ${articles?.length || 0} articles to process`);

    const results: { slug: string; status: string; contentLength?: number }[] = [];

    for (const article of articles || []) {
      try {
        let newContent: string;

        // Check if we have a pre-written template
        if (COMPREHENSIVE_ARTICLE_TEMPLATES[article.slug]) {
          console.log(`Using template for ${article.slug}`);
          newContent = COMPREHENSIVE_ARTICLE_TEMPLATES[article.slug];
        } else if (useTemplatesOnly) {
          console.log(`Skipping ${article.slug} (no template, templatesOnly=true)`);
          results.push({ slug: article.slug, status: 'skipped' });
          continue;
        } else if (!aiApiKey) {
          console.log(`Skipping ${article.slug} (no API key)`);
          results.push({ slug: article.slug, status: 'skipped_no_api_key' });
          continue;
        } else {
          console.log(`Generating AI content for ${article.slug}`);
          newContent = await generateComprehensiveContent(article, aiApiKey);
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Update the article
        const { error: updateError } = await supabase
          .from('learning_articles')
          .update({ 
            content: newContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`Updated ${article.slug} with ${newContent.length} characters`);
        results.push({ 
          slug: article.slug, 
          status: 'updated',
          contentLength: newContent.length 
        });

      } catch (articleError) {
        console.error(`Error processing ${article.slug}:`, articleError);
        results.push({ 
          slug: article.slug, 
          status: 'error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Regenerate articles error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
