-- Batch 1: Update first 5 candlestick pattern articles with rich narrative content

UPDATE public.learning_articles SET content = '## The Psychology Behind the Abandoned Baby

The Abandoned Baby pattern earned its evocative name from the isolated candle that sits alone, "abandoned" by price action on either side. This three-candle formation represents one of the most dramatic sentiment shifts in technical analysis—a complete capitulation followed by confusion, then decisive reversal.

### Pattern Anatomy

**Bullish Abandoned Baby:**
1. **First Candle**: Strong bearish candle confirming the downtrend
2. **Middle Candle**: Doji that gaps below the first candle''s low (the "abandoned" candle)
3. **Third Candle**: Strong bullish candle that gaps above the doji''s high

**Bearish Abandoned Baby:**
1. **First Candle**: Strong bullish candle confirming the uptrend
2. **Middle Candle**: Doji that gaps above the first candle''s high
3. **Third Candle**: Strong bearish candle that gaps below the doji''s low

### Why This Pattern Works

The psychology is profound. The gap into the doji represents exhaustion—sellers (in a downtrend) push price so aggressively that it creates a gap, but then immediately lose conviction. The doji''s indecision reflects a market frozen in uncertainty. When the third candle gaps in the opposite direction, it signals that new participants have seized control with overwhelming force.

### Trading the Abandoned Baby

| Component | Bullish Setup | Bearish Setup |
|-----------|--------------|---------------|
| **Entry** | Above third candle high | Below third candle low |
| **Stop Loss** | Below doji low | Above doji high |
| **Take Profit** | 2:1 risk-reward minimum | 2:1 risk-reward minimum |

### Real-World Example

**BTC/USD Daily - March 2020 COVID Crash:**
During the March 2020 capitulation, Bitcoin formed a textbook bullish Abandoned Baby at $4,800:
- March 12: Massive bearish candle closing at $5,700
- March 13: Doji gapping down to $4,800 (the fear peak)
- March 16: Bullish engulfing candle gapping up to $5,400

Traders who recognized this pattern and entered above $5,800 with stops below $4,600 captured the beginning of the bull run to $65,000.

### Key Considerations

- **Gap Requirement**: True Abandoned Babies require gaps on BOTH sides of the middle candle
- **Volume Confirmation**: Look for declining volume into the doji, then explosive volume on the reversal candle
- **Rarity**: This is one of the rarest candlestick patterns—when it appears, pay attention
- **Timeframe**: Most reliable on daily charts and higher; intraday gaps are often just session breaks' WHERE slug = 'abandoned-baby';

UPDATE public.learning_articles SET content = '## Understanding Dark Cloud Cover

The Dark Cloud Cover pattern takes its name from the ominous imagery of storm clouds rolling in over a sunny sky. This bearish reversal pattern has warned traders of impending downturns for centuries, originating from Japanese rice traders who recognized its predictive power.

### The Formation

Dark Cloud Cover is a two-candle pattern that appears at the top of uptrends:

1. **First Candle**: A strong bullish candle that continues the uptrend, showing buyer confidence
2. **Second Candle**: A bearish candle that opens above the first candle''s high (gaps up) but closes below the midpoint of the first candle''s body

### The Psychology

This pattern captures a dramatic shift in market sentiment. Bulls push prices higher on day one, feeling triumphant. Day two opens with even more optimism—price gaps up, suggesting continuation. But then sellers emerge with force, driving price down not just to erase the gap, but to penetrate deeply into the previous day''s gains.

The deeper the penetration, the more bearish the signal. A close below 50% of the first candle''s body is the minimum requirement, but closes near the first candle''s open carry even more weight.

### Trading Strategy

| Component | Specification |
|-----------|--------------|
| **Entry** | Below the second candle''s low |
| **Stop Loss** | Above the second candle''s high |
| **Take Profit** | Previous support level or 2:1 R:R |

### Confirmation Factors

- **Volume**: Higher volume on the bearish candle strengthens the signal
- **Resistance**: Pattern forming at known resistance levels increases reliability
- **Overbought Conditions**: RSI above 70 adds confluence
- **Trend Context**: Most effective after extended uptrends

### Real-World Example

**AAPL Daily - September 2020:**
Apple formed a textbook Dark Cloud Cover after its 5:1 stock split euphoria:
- September 1: Strong bullish candle closing at $134.50
- September 2: Opened at $137.50, closed at $131.40 (below 50% of prior body)

The pattern marked the beginning of a 25% correction. Traders who shorted below $131 with stops at $138 captured significant profits as Apple fell to $103.

### Common Mistakes

1. **Ignoring the Gap**: The second candle must open above the first candle''s high
2. **Insufficient Penetration**: The close must be below the 50% mark of the first candle
3. **Wrong Context**: This pattern is meaningless in sideways markets
4. **Immediate Entry**: Wait for the pattern to complete; don''t anticipate' WHERE slug = 'dark-cloud-cover';

UPDATE public.learning_articles SET content = '## The Doji: A Moment of Perfect Equilibrium

The Doji stands as perhaps the most philosophically significant candlestick pattern in technical analysis. Its form—where open and close are virtually identical—represents that rare market moment when buyers and sellers reach perfect equilibrium. In Japanese, "doji" refers to a blunder or mistake, suggesting the market''s indecision about which direction to take.

### Doji Variations

**Standard Doji**
Equal upper and lower shadows with open/close at center. Represents true indecision.

**Long-Legged Doji**
Extended shadows in both directions. Shows high volatility but ultimate indecision—a tug-of-war where neither side won.

**Dragonfly Doji**
Long lower shadow, no upper shadow. Opens, drops significantly, then recovers to open. Bullish implications, especially at support.

**Gravestone Doji**
Long upper shadow, no lower shadow. Opens, rallies significantly, then falls back to open. Bearish implications, especially at resistance.

**Four Price Doji**
Extremely rare. Open, high, low, and close are all the same. Represents complete market paralysis.

### Context Is Everything

A Doji''s meaning depends entirely on where it appears:

| Location | Doji Type | Implication |
|----------|-----------|-------------|
| After uptrend | Gravestone | Strongly bearish |
| After downtrend | Dragonfly | Strongly bullish |
| At resistance | Any Doji | Potential reversal |
| At support | Any Doji | Potential reversal |
| Mid-trend | Standard | Pause, continuation likely |

### Trading Doji Patterns

The Doji itself is not a trading signal—it''s a warning. Wait for confirmation:

1. **Identify the Doji** at a significant level
2. **Wait for the next candle** to confirm direction
3. **Enter** on break of confirmation candle
4. **Stop Loss** beyond the Doji''s extreme

### Real-World Example

**Gold (XAU/USD) Daily - August 2020:**
Gold formed a Gravestone Doji at its all-time high of $2,075:
- August 6: Price opened at $2,050, spiked to $2,075, then collapsed back to $2,050
- August 7: Bearish confirmation candle

Traders who shorted below $2,040 with stops at $2,080 captured the correction to $1,860—a $180 move representing 8.7% in one of the world''s most liquid markets.

### Volume Analysis

- **Low volume Doji**: Market is simply waiting; weak signal
- **High volume Doji**: Aggressive battle between buyers and sellers; strong signal
- **Decreasing volume into Doji**: Exhaustion pattern; reversal more likely

### Common Mistakes

1. Trading the Doji in isolation without waiting for confirmation
2. Ignoring the trend context
3. Not considering the Doji''s location relative to key levels
4. Treating all Doji types as equal signals' WHERE slug = 'doji-patterns';

UPDATE public.learning_articles SET content = '## The Engulfing Pattern: When Power Changes Hands

The Engulfing pattern is one of the most visually dramatic and psychologically significant candlestick formations. When a candle completely "engulfs" or covers the body of the previous candle, it signals a decisive shift in market control—one side has overwhelmed the other.

### Pattern Structure

**Bullish Engulfing:**
1. First candle is bearish (red/black), continuing a downtrend
2. Second candle is bullish (green/white) and completely covers the first candle''s body
3. The second candle opens below the first''s close and closes above the first''s open

**Bearish Engulfing:**
1. First candle is bullish, continuing an uptrend
2. Second candle is bearish and completely covers the first candle''s body
3. The second candle opens above the first''s close and closes below the first''s open

### The Psychology

The Engulfing pattern captures a complete shift in market sentiment within two periods:

**For Bullish Engulfing:**
The downtrend continues with a bearish candle, and sellers feel confident. But then buyers enter with such force that they not only absorb all selling pressure but push price higher than where the sellers started. This is capitulation by sellers.

**For Bearish Engulfing:**
Bulls push price higher, feeling triumphant. Then sellers overwhelm them completely, erasing all gains and pushing lower. Bull confidence shatters.

### Trading Strategy

| Component | Bullish Setup | Bearish Setup |
|-----------|--------------|---------------|
| **Entry** | Above engulfing candle high | Below engulfing candle low |
| **Stop Loss** | Below engulfing candle low | Above engulfing candle high |
| **Target** | Previous swing high or 2:1 R:R | Previous swing low or 2:1 R:R |

### Quality Filters

Not all Engulfing patterns are equal. High-probability setups have:

1. **Size Differential**: The engulfing candle should be significantly larger than the engulfed candle
2. **Volume Surge**: 1.5x or greater volume on the engulfing candle
3. **Key Level Location**: Pattern forms at support/resistance
4. **Extended Trend**: Appears after a prolonged move, not at trend start

### Real-World Example

**NVDA Daily - October 2023:**
Nvidia formed a textbook Bullish Engulfing at $400 support:
- October 26: Bearish candle closing at $405 after multi-day pullback
- October 27: Massive bullish candle opening at $403, closing at $440

The engulfing candle was 3x the size of the prior candle with 2x average volume. Traders entering above $440 with stops at $400 captured the move to $500+ within three weeks.

### Common Mistakes

1. **Ignoring the Trend**: Engulfing patterns against the major trend often fail
2. **Shadow Focus**: Focus on body engulfment; shadows are secondary
3. **No Confirmation**: Some traders wait for next candle to confirm
4. **Overtrading**: Not every engulfing pattern is tradeable—context matters' WHERE slug = 'engulfing-patterns';

UPDATE public.learning_articles SET content = '## The Hammer: When Sellers Exhaust Themselves

The Hammer pattern earned its name from its distinctive shape—a small body sitting atop a long lower shadow, resembling a hammer or mallet. This single-candle reversal pattern has been a cornerstone of Japanese candlestick analysis for centuries, prized for its ability to identify potential market bottoms.

### Anatomy of a Hammer

**Classic Hammer Requirements:**
- Small real body at the upper end of the trading range
- Lower shadow at least 2x the length of the body (the longer, the better)
- Little to no upper shadow
- Appears after a downtrend
- Body color is secondary (bullish body slightly preferred)

**The Inverted Hammer:**
- Same reversal implication as the Hammer
- Long upper shadow, small body at lower end
- Appears at the bottom of downtrends
- Requires stronger confirmation than the classic Hammer

### The Psychology Behind the Pattern

The Hammer tells a powerful story of seller exhaustion:

1. **Opening**: Price opens after a downtrend
2. **Selling Pressure**: Sellers push price significantly lower during the session
3. **The Turn**: Buyers step in with force, overwhelming sellers
4. **The Close**: Price recovers to close near the open

This intraday rejection of lower prices—especially when the low represents a significant drop—signals that sellers have thrown everything they have at the market and failed.

### Trading the Hammer

| Component | Specification |
|-----------|--------------|
| **Entry** | Above the Hammer''s high |
| **Stop Loss** | Below the Hammer''s low |
| **Take Profit** | Previous resistance or 2:1 R:R minimum |

### Confirmation Strategies

While some traders enter directly on Hammer signals, others prefer confirmation:

1. **Next Candle Confirmation**: Wait for a bullish candle following the Hammer
2. **Volume Confirmation**: Higher volume on the Hammer strengthens the signal
3. **Support Confluence**: Hammer at known support level is higher probability

### Real-World Example

**EUR/USD Daily - March 2020:**
The Euro formed a perfect Hammer during the COVID panic:
- March 23: After falling from 1.1500 to 1.0640, EUR/USD printed a Hammer
- Opened at 1.0720, dropped to 1.0640, closed at 1.0780
- Lower shadow was 4x the body length
- Volume was 2.5x the 20-day average

Traders who entered above 1.0800 with stops at 1.0620 captured the rally to 1.1100 within two weeks—a 300-pip move with under 200 pips at risk.

### Quality Filters

**High-Probability Hammers:**
- Lower shadow 3x+ body length
- Appears at major support
- Volume above average
- Follows extended downtrend

**Lower-Probability Hammers:**
- Shadow barely meets 2x requirement
- No clear support level
- Low volume
- Appears in choppy market

### The Hanging Man Warning

A Hammer at the TOP of an uptrend is called a **Hanging Man**—it carries bearish implications. Same shape, opposite context, opposite meaning. Always identify the prevailing trend before trading.' WHERE slug = 'hammer-patterns';