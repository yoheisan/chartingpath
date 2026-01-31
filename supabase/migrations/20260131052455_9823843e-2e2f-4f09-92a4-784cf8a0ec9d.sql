-- Batch 7: More Candlestick Patterns (Harami, Morning/Evening Star, Piercing)

-- Harami Patterns
UPDATE learning_articles SET content = '## The Pregnancy Candle: Trading Harami Patterns

In Japanese, "harami" means pregnant—an apt description for this pattern where a small candle is contained entirely within the body of a larger preceding candle. This pattern of contraction after expansion often signals a turning point.

### Anatomy of Harami Patterns

**Bullish Harami**:
- First candle: Large bearish candle (the "mother")
- Second candle: Small candle contained within first candle''s body
- Location: After a downtrend

**Bearish Harami**:
- First candle: Large bullish candle (the "mother")
- Second candle: Small candle contained within first candle''s body
- Location: After an uptrend

**Key Requirement**: The second candle''s body must be entirely within the first candle''s body (shadows can extend beyond).

### Why Harami Patterns Work

The harami represents a shift from trending to indecision:

**Large First Candle**: Strong conviction in one direction
**Small Second Candle**: Sudden loss of momentum, indecision emerges
**Containment**: Bears/bulls who controlled can''t push further

The pattern suggests the dominant force has exhausted itself, at least temporarily.

### Harami vs. Inside Bar

Similar but distinct:

**Harami**: Second candle''s BODY within first candle''s BODY
**Inside Bar**: Second candle''s entire RANGE (high to low) within first candle''s range

Inside bars are stricter; harami patterns are more common but can still be powerful at key levels.

### Harami Cross

A more powerful variation:

**Harami Cross**: Second candle is a doji (open equals close)

The doji within the harami represents even more extreme indecision, often providing a stronger reversal signal.

### Quality Factors

**High Quality Harami**:
- First candle is notably large
- Second candle is notably small (ideally 25% or less of first candle)
- Appears at key support/resistance
- Second candle is a doji (harami cross)
- Context shows extended prior trend

**Lower Quality**:
- First and second candles similar in size
- Appears in choppy, trendless market
- No obvious support/resistance nearby

### Trading the Bullish Harami

**Setup**: After a downtrend, large bearish candle followed by small candle within its body

**Conservative Entry**:
- Wait for third candle to close above harami high
- Entry: Above harami pattern high
- Stop: Below harami pattern low (large candle''s low)
- Target: Prior swing high or resistance

**Aggressive Entry**:
- Enter at second candle close
- Stop: Below harami pattern low
- Target: Prior swing high or resistance

### Trading the Bearish Harami

**Setup**: After an uptrend, large bullish candle followed by small candle within its body

**Conservative Entry**:
- Wait for third candle to close below harami low
- Entry: Below harami pattern low
- Stop: Above harami pattern high (large candle''s high)
- Target: Prior swing low or support

**Aggressive Entry**:
- Enter at second candle close
- Stop: Above harami pattern high
- Target: Prior swing low or support

### Confirmation Signals

Increase confidence with:

**Third Candle**: Follow-through candle in reversal direction
**Volume**: Declining volume on second candle (momentum loss)
**RSI Divergence**: Momentum already showing weakness
**Key Level**: Pattern at significant support/resistance

### Harami in Context

**After Extended Move**: More likely to signal reversal
**After Short Move**: May just signal consolidation before continuation
**At Major Level**: Higher probability signal
**Mid-Range**: Lower probability, likely just noise

### Stop Loss Placement

The pattern provides clear risk parameters:

**Minimum Stop**: Beyond the harami pattern extreme (first candle''s high or low)
**Tighter Stop**: Beyond the second candle''s extreme (less protection but tighter risk)

### Target Strategies

**Target 1**: Prior swing high/low
**Target 2**: Measured move (first candle''s range projected from pattern)
**Target 3**: Key moving average or Fibonacci level

### Common Harami Mistakes

1. **Ignoring Size Ratio**: Second candle should be notably smaller than first
2. **Wrong Location**: Harami mid-trend is often just consolidation
3. **No Confirmation**: Pattern benefits from third candle confirmation
4. **Tight Stops**: Stops inside the harami range will be stopped out by normal volatility

### Multiple Timeframe Approach

**Daily Harami + 4H Entry**: Daily harami signals potential reversal, 4H chart for precise entry timing
**Weekly Harami + Daily Follow-Through**: Weekly harami is a major signal, use daily for execution

### Practice Trade Setup

**Instrument**: GOOGL
**Scenario**: Bullish harami at support after selloff

**Analysis**:
- GOOGL declined from $160 to $140 (12.5% drop in 2 weeks)
- Day 1: Large bearish candle from $143 to $138 (body: $5)
- Day 2: Small bullish doji from $139 to $140, body within Day 1 body (Harami Cross!)
- Pattern forms at $140 horizontal support
- RSI at 28 with bullish divergence

**Trade Plan**:
- **Entry**: Long at $141 (above harami high on Day 3 follow-through)
- **Stop Loss**: $137 (below pattern low)
- **Target 1**: $150 (prior consolidation)
- **Target 2**: $158 (prior breakdown level)
- **Risk:Reward**: $4 risk, $9-$17 reward = 2.25:1 to 4.25:1

The harami teaches us that after expansion comes contraction—and from contraction, new moves are born.',
excerpt = 'Master the harami candlestick pattern—a two-candle reversal signal where a small candle is contained within the body of a larger preceding candle.',
reading_time_minutes = 12
WHERE slug = 'harami-patterns';

-- Morning and Evening Star
UPDATE learning_articles SET content = '## Celestial Reversals: Trading Morning and Evening Star Patterns

As the evening star signals the end of day and the morning star heralds the dawn, these three-candle patterns mark the transition from one trend phase to another. They are among the most reliable reversal patterns in candlestick analysis.

### Morning Star Pattern

The Morning Star is a bullish reversal pattern appearing after a downtrend:

**Candle 1**: Large bearish candle (selling in full force)
**Candle 2**: Small candle that gaps down (indecision after exhaustion)
**Candle 3**: Large bullish candle that closes into the first candle''s body

**The Story**: Sellers are dominant (Candle 1), then exhaust (Candle 2), then buyers take control (Candle 3).

### Evening Star Pattern

The Evening Star is a bearish reversal pattern appearing after an uptrend:

**Candle 1**: Large bullish candle (buying in full force)
**Candle 2**: Small candle that gaps up (indecision after exhaustion)
**Candle 3**: Large bearish candle that closes into the first candle''s body

**The Story**: Buyers are dominant (Candle 1), then exhaust (Candle 2), then sellers take control (Candle 3).

### The Psychology of Three-Candle Reversals

These patterns work because they capture a complete emotional cycle:

**Phase 1 - Conviction**: Strong move in one direction (Candle 1)
**Phase 2 - Indecision**: Loss of momentum, uncertainty (Candle 2)
**Phase 3 - Reversal**: New direction takes over (Candle 3)

The gap between Candles 1 and 2 emphasizes exhaustion; Candle 3 confirms the reversal.

### Quality Factors

**High Quality Morning/Evening Star**:
- Clear gap between Candle 1 and Candle 2
- Candle 2 is very small (ideally a doji = Doji Star variation)
- Candle 3 closes beyond 50% of Candle 1''s body
- Candle 3 has larger body than Candle 1
- Appears at key support/resistance
- Occurs after extended trend

**Lower Quality**:
- No visible gap between candles
- Candle 2 has a larger body
- Candle 3 doesn''t penetrate deeply into Candle 1
- Appears mid-range without significant prior trend

### Star Variations

**Doji Star**: Candle 2 is a doji—stronger signal due to extreme indecision

**Abandoned Baby**: All three candles have gaps (most rare, most powerful)

**Shooting/Hammer Star**: Candle 2 is a shooting star or hammer instead of doji

### Trading the Morning Star

**Setup**: After downtrend, three-candle morning star forms at support

**Entry Options**:

*Conservative*: Wait for Candle 3 to close, enter above Candle 3 high
*Standard*: Enter at Candle 3 close
*Aggressive*: Enter during Candle 3 as bullish momentum is confirmed

**Stop Loss**: Below the pattern low (Candle 2''s low, or Candle 1''s low for wider stop)

**Targets**: Prior swing high, 50-61.8% retracement of prior decline, moving averages

### Trading the Evening Star

**Setup**: After uptrend, three-candle evening star forms at resistance

**Entry Options**:

*Conservative*: Wait for Candle 3 to close, enter below Candle 3 low
*Standard*: Enter at Candle 3 close
*Aggressive*: Enter during Candle 3 as bearish momentum is confirmed

**Stop Loss**: Above the pattern high (Candle 2''s high, or Candle 1''s high for wider stop)

**Targets**: Prior swing low, 50-61.8% retracement of prior advance, moving averages

### Penetration Requirement

How deeply Candle 3 closes into Candle 1 matters:

**Deep Penetration (>50%)**: Strong signal, higher conviction
**Shallow Penetration (<50%)**: Weaker signal, wait for confirmation
**Full Penetration (100%+)**: Very strong signal, immediate follow-through likely

### Volume Confirmation

Ideal volume pattern:

**Candle 1**: High volume (strong conviction in original direction)
**Candle 2**: Low volume (loss of interest, exhaustion)
**Candle 3**: High volume (new participants entering reversal direction)

### Gap Considerations

In modern markets, gaps are less common, especially in forex:

**With Gaps**: Classic pattern, stronger signal
**Without Gaps**: Still valid, but requires the "star" candle to be notably small
**With Overlapping Bodies**: Weaker signal, treat as harami-like pattern

### Context Requirements

Best results when:

**Extended Prior Trend**: More exhaustion = better reversal signal
**Key Technical Level**: Support/resistance, round numbers, Fibonacci
**Oscillator Divergence**: RSI/MACD showing momentum weakness
**Volume Characteristics**: Decreasing in trend, spiking on reversal

### Practice Trade Setup

**Instrument**: AMZN
**Scenario**: Morning Star at key support

**Analysis**:
- AMZN declined 15% over 3 weeks, hitting $170 support
- Day 1: Large bearish candle (Open $175, Close $168)
- Day 2: Gap down, small doji (Open $166, High $167, Low $165, Close $166)
- Day 3: Large bullish candle (Open $168, Close $176—closes above Day 1 open)
- Volume: High on Day 1, low on Day 2, high on Day 3
- RSI showing bullish divergence

**Trade Plan**:
- **Entry**: Long at $177 (above Day 3 high)
- **Stop Loss**: $164 (below star low)
- **Target 1**: $190 (50% retracement)
- **Target 2**: $200 (prior consolidation)
- **Risk:Reward**: $13 risk, $13-$23 reward = 1:1 to 1.77:1

The Morning and Evening Stars are the market''s way of saying "the night/day is ending"—a poetic and powerful transition signal.',
excerpt = 'Learn to trade Morning Star and Evening Star patterns—powerful three-candle reversal formations that signal transitions from downtrends to uptrends (and vice versa).',
reading_time_minutes = 13
WHERE slug = 'morning-evening-star';

-- Piercing Pattern
UPDATE learning_articles SET content = '## The Bullish Counter: Trading the Piercing Line Pattern

In the depths of a decline, a dramatic intraday reversal can signal that sellers are finally exhausting. The piercing line pattern captures this moment—a bearish candle followed by a bullish candle that closes above the midpoint of the first, "piercing" through the selling.

### Pattern Anatomy

The Piercing Line is a two-candle bullish reversal:

**First Candle**: A large bearish candle (continuing the downtrend)
**Second Candle**: 
- Opens below the first candle''s low (gap down)
- Closes above the midpoint of the first candle''s body
- But closes below the first candle''s open

**Key Requirement**: The second candle must close above the midpoint but not above the first candle''s open (otherwise it would be a bullish engulfing).

### Dark Cloud Cover: The Opposite Pattern

The bearish counterpart to the Piercing Line:

**First Candle**: Large bullish candle (continuing the uptrend)
**Second Candle**:
- Opens above the first candle''s high (gap up)
- Closes below the midpoint of the first candle''s body
- But closes above the first candle''s close

**The Message**: Buyers pushed price up overnight, but sellers emerged and drove price down through half the gains, "clouding over" the bullish move.

### The Psychology of Piercing

**Piercing Line**:
1. Day 1: Sellers dominate, completing another bearish session
2. Overnight: Price gaps even lower—fear peaks
3. Day 2 Open: Capitulation selling appears exhausted
4. Day 2 Session: Buyers emerge, driving price up through selling resistance
5. Day 2 Close: Price recovers more than half of Day 1''s losses—sentiment shifting

**Dark Cloud Cover**:
1. Day 1: Buyers dominate, completing another bullish session
2. Overnight: Price gaps even higher—greed peaks
3. Day 2 Open: Late buyers rush in at the top
4. Day 2 Session: Sellers emerge, driving price down through buying support
5. Day 2 Close: Price gives back more than half of Day 1''s gains—sentiment shifting

### Quality Factors

**High Quality Piercing Line**:
- After sustained downtrend
- Clear gap down on Day 2
- Day 2 closes above 60-70% of Day 1''s body (not just 50%)
- Both candles have substantial bodies
- Forms at key support level
- Increasing volume on Day 2

**Lower Quality**:
- Shallow prior trend
- Minimal or no gap
- Day 2 just barely crosses 50% level
- Small candle bodies
- No obvious support nearby

### Piercing vs. Bullish Engulfing

**Piercing Line**: Day 2 closes into Day 1''s body but not above the open
**Bullish Engulfing**: Day 2 closes above Day 1''s open (stronger signal)

Both are bullish, but engulfing patterns represent more complete reversal.

### Trading the Piercing Line

**Setup**: Downtrend, piercing line forms at support

**Entry Strategy**:

*Conservative*: Wait for Day 3 to close above Day 2''s high
- Entry: Above Day 2 high
- Stop: Below Day 2 low
- Target: Prior swing high or resistance

*Aggressive*: Enter at Day 2 close
- Entry: Day 2 close
- Stop: Below Day 2 low
- Target: Prior swing high or resistance

### Trading the Dark Cloud Cover

**Setup**: Uptrend, dark cloud cover forms at resistance

**Entry Strategy**:

*Conservative*: Wait for Day 3 to close below Day 2''s low
- Entry: Below Day 2 low
- Stop: Above Day 2 high
- Target: Prior swing low or support

*Aggressive*: Enter at Day 2 close
- Entry: Day 2 close
- Stop: Above Day 2 high
- Target: Prior swing low or support

### The 50% Rule

The midpoint of Day 1''s body is critical:

**Deep Penetration (>60%)**: Stronger signal, higher conviction
**Shallow Penetration (50-60%)**: Valid but weaker signal
**Below 50%**: Not a valid pattern, may be just a bounce

### Gap Considerations

The gap opening is important:

**Wide Gap**: More extreme sentiment, more powerful reversal
**Narrow Gap**: Still valid but less conviction
**No Gap**: Pattern is weakened but can still work in forex where gaps are rare

### Volume Confirmation

Ideal volume:

**Day 1**: Normal or high volume (selling conviction)
**Day 2**: High volume (new buying entering)

High volume on Day 2 suggests institutional buying, not just short covering.

### Combining with Other Signals

**RSI Oversold**: Piercing at oversold levels increases probability
**Support Confluence**: Multiple support types at same level
**Candlestick Cluster**: Multiple bullish candles forming at same zone
**Moving Average**: Piercing at key moving average (50, 200)

### Common Mistakes

1. **Not Measuring Properly**: Must close above true 50% of body, not estimate
2. **Wrong Context**: Piercing in uptrend is not reversal signal
3. **Ignoring Gap**: No gap significantly weakens the pattern
4. **Early Exit**: These patterns often lead to sustained moves—don''t exit too soon

### Practice Trade Setup

**Instrument**: BA (Boeing)
**Scenario**: Piercing line after selloff

**Analysis**:
- BA declined from $200 to $175 (12.5% over 2 weeks)
- Day 1: Large bearish candle, Open $178, Close $172
- Day 2: Opens at $170 (gap down), closes at $176
- Day 2 closes at 67% of Day 1 body (above 50% = valid, above 60% = strong)
- Pattern forms at $175 horizontal support
- Volume higher on Day 2

**Trade Plan**:
- **Entry**: Long at $177 (above Day 2 high on confirmation)
- **Stop Loss**: $169 (below Day 2 low)
- **Target 1**: $185 (prior consolidation)
- **Target 2**: $195 (50% retracement of decline)
- **Risk:Reward**: $8 risk, $8-$18 reward = 1:1 to 2.25:1

The piercing line shows that even in dark times, buyers can emerge to counter the selling—a knife catching in its most controlled form.',
excerpt = 'Master the Piercing Line and Dark Cloud Cover patterns—powerful two-candle reversals that signal momentum shifts when one candle penetrates more than half of the prior candle.',
reading_time_minutes = 12
WHERE slug = 'piercing-pattern';