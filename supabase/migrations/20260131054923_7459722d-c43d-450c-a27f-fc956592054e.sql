-- Final Batch: Remaining articles - Options, Price Action, Market Analysis

UPDATE learning_articles SET content = '# Supply and Demand Zone Trading: Complete Guide

Supply and demand zones identify areas where institutional orders create imbalances between buyers and sellers. Unlike traditional support/resistance lines, these zones represent price areas where significant unfilled orders may still exist.

## Understanding Supply and Demand

### Supply Zones (Resistance Areas)
- Price areas where sellers overwhelmed buyers
- Creates sharp moves down from the zone
- Unfilled sell orders may remain
- Price often reverses when revisiting

### Demand Zones (Support Areas)  
- Price areas where buyers overwhelmed sellers
- Creates sharp moves up from the zone
- Unfilled buy orders may remain
- Price often bounces when revisiting

## Identifying Quality Zones

### Zone Characteristics
- Strong departure: Price left quickly with momentum
- Fresh zone: Not yet retested (first test most powerful)
- Clear base: Consolidation before the move
- Significant move: The bigger the departure, the stronger the zone

### Drawing Zones
1. Find strong impulsive moves
2. Identify the base/consolidation before the move
3. Draw zone from base high to base low
4. Extend zone to the right for future reference

## Trading Supply and Demand

### Entry Strategy
- Wait for price to return to fresh zone
- Look for reversal candlestick patterns
- Enter on confirmation of zone holding

### Stop-Loss
- Beyond the zone boundary
- Allow for zone penetration tests

### Target
- Opposite zone or prior swing high/low
- Often produces excellent risk:reward

Supply and demand trading provides institutional-level analysis for retail traders.', 
updated_at = NOW()
WHERE slug = 'supply-demand-zones';

UPDATE learning_articles SET content = '# Sector Rotation Strategy: Complete Trading Guide

Sector rotation is an investment strategy that moves capital between different market sectors based on economic cycles. Understanding which sectors perform best during different phases of the business cycle provides a significant edge.

## The Business Cycle

### Four Phases

**Early Expansion:**
- Economy recovering from recession
- Interest rates low, credit easing
- Best sectors: Consumer Discretionary, Financials, Industrials

**Late Expansion:**
- Economy growing strongly
- Inflation rising, rates increasing
- Best sectors: Technology, Materials, Energy

**Early Contraction:**
- Economy slowing
- Fed typically raising rates
- Best sectors: Energy, Healthcare, Consumer Staples

**Late Contraction/Recession:**
- Economy in recession
- Flight to safety
- Best sectors: Utilities, Healthcare, Consumer Staples

## Implementation Strategies

### Active Rotation
- Monitor economic indicators (PMI, employment, yield curve)
- Rotate into sectors expected to outperform
- Use sector ETFs for efficient execution

### Relative Strength Approach
- Compare sector performance vs S&P 500
- Overweight outperforming sectors
- Underweight underperforming sectors

### Momentum-Based
- Buy sectors with best 3-6 month returns
- Rebalance monthly or quarterly
- Avoid sectors in clear downtrends

## Key Indicators

- Yield curve shape (10Y-2Y spread)
- ISM Manufacturing PMI
- Consumer confidence
- Housing starts
- Employment data

Sector rotation provides a framework for strategic allocation across market cycles.', 
updated_at = NOW()
WHERE slug = 'sector-rotation';

UPDATE learning_articles SET content = '# Pin Bar Strategy: High-Probability Reversal Setups

The pin bar is a single-candle reversal pattern featuring a long wick (shadow) that shows price rejection. This price action setup is popular among professional traders for its clarity and reliability.

## Pin Bar Anatomy

### Structure
- Long wick/shadow (tail) on one side
- Small body at opposite end
- Tail should be 2/3+ of total candle range
- Body should be 1/3 or less of range

### Bullish Pin Bar
- Long lower tail
- Body at top of range
- Shows buying at lower prices
- Bullish reversal signal

### Bearish Pin Bar
- Long upper tail
- Body at bottom of range
- Shows selling at higher prices
- Bearish reversal signal

## Trading the Pin Bar

### Entry Methods

**Conservative Entry:**
- Enter on break of pin bar high/low
- Wait for next candle confirmation

**Aggressive Entry:**
- Enter at 50% retracement of pin bar
- Better entry price, slightly higher risk

### Stop-Loss
- Beyond the pin bar tail
- This level proved rejection—if broken, signal failed

### Target
- Prior swing high/low
- 2:1 or 3:1 risk:reward minimum
- Key support/resistance levels

## Context Requirements

### Best Pin Bar Locations
- At key support/resistance levels
- At trend lines
- At moving averages
- At Fibonacci levels
- After extended moves

### Avoid Pin Bars
- In middle of range (no context)
- Against strong trend without confluence
- With very small tails
- In choppy, low-volume conditions

## Success Statistics
- At key levels: 65-75%
- Random location: 50-55%
- With confluence: 70-80%

The pin bar is a cornerstone of price action trading.', 
updated_at = NOW()
WHERE slug = 'pin-bar-strategy';

UPDATE learning_articles SET content = '# Price Action Basics: Foundation of Technical Trading

Price action trading analyzes raw price movement without relying heavily on indicators. This approach focuses on candlestick patterns, support/resistance, and market structure to make trading decisions.

## Core Principles

### Price Tells the Story
- Price reflects all market information
- No indicator provides more timely data
- Learning to read price is essential

### Key Concepts
- Support and Resistance levels
- Trend identification (higher highs/lows vs lower highs/lows)
- Candlestick patterns for entry timing
- Market structure breaks for trend changes

## Reading Price Action

### Trend Identification
- Uptrend: Series of higher highs and higher lows
- Downtrend: Series of lower highs and lower lows
- Range: No clear directional bias

### Key Levels
- Support: Where buyers consistently enter
- Resistance: Where sellers consistently enter
- These levels flip when broken

### Candlestick Signals
- Pin bars, engulfing patterns for reversals
- Inside bars for consolidation
- Breakout bars for momentum

## Trading Framework

1. Identify the trend
2. Find key support/resistance
3. Wait for price action signal at key level
4. Enter with defined stop and target

Price action trading provides clean, logical entries based on market behavior.', 
updated_at = NOW()
WHERE slug = 'price-action-basics';

-- Update Options articles with comprehensive content
UPDATE learning_articles SET content = '# Iron Condor Strategy: Range-Bound Income

The iron condor is a neutral options strategy that profits when the underlying stays within a defined range. It combines a bull put spread with a bear call spread to collect premium while limiting risk.

## Strategy Structure

### Components
- Sell OTM put (lower middle strike)
- Buy further OTM put (lowest strike)
- Sell OTM call (upper middle strike)  
- Buy further OTM call (highest strike)

### Profit/Loss Profile
- Max profit: Net premium received
- Max loss: Width of spread minus premium
- Breakeven: Short strikes +/- premium received

## When to Use

### Ideal Conditions
- Low to moderate implied volatility
- Range-bound market expected
- No major events during trade duration
- 30-45 days to expiration

### Strike Selection
- Short strikes at ~16 delta (1 standard deviation)
- Wide enough for comfort, narrow enough for premium

## Risk Management

- Close at 50% max profit
- Close if underlying approaches short strike
- Adjust by rolling tested side
- Never let expire near short strikes

The iron condor provides consistent income in range-bound markets.', 
updated_at = NOW()
WHERE slug = 'iron-condor';

UPDATE learning_articles SET content = '# Butterfly Spread: Precision Strike Trading

The butterfly spread is an options strategy that profits most when the underlying closes exactly at the middle strike at expiration. It offers limited risk with potentially high reward for directional predictions.

## Strategy Structure

### Long Call Butterfly
- Buy 1 lower strike call
- Sell 2 middle strike calls
- Buy 1 higher strike call
- Equal distance between strikes

### Profit/Loss Profile
- Max profit: At middle strike at expiration
- Max loss: Net debit paid
- Breakeven: Lower strike + debit and Upper strike - debit

## When to Use

### Ideal Conditions
- Strong directional conviction on price target
- Expecting low volatility into expiration
- Want defined risk with high reward potential

### Strike Selection
- Center strike at expected price target
- Wings equidistant from center
- Typically use 30-45 DTE

The butterfly offers asymmetric reward when price targets are accurate.', 
updated_at = NOW()
WHERE slug = 'butterfly-spread';