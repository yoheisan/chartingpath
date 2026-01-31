-- Risk Management: Hedging Strategies
UPDATE learning_articles SET content = '## Understanding Hedging in Trading

Hedging is the practice of taking an offsetting position to reduce exposure to adverse price movements. It''s not about making money—it''s about protecting existing profits or reducing potential losses. Professional traders and institutions hedge constantly; retail traders should understand when and how to apply these strategies.

### The Insurance Analogy

Hedging is like insurance:
- **Cost**: Premiums reduce overall returns
- **Benefit**: Protection against catastrophic loss
- **Trade-off**: You can''t profit fully from favorable moves

Just as you don''t regret car insurance when you don''t crash, you shouldn''t regret hedges that expire worthless when positions profit.

---

## When to Hedge

### Scenarios Requiring Hedges

**Concentrated Positions**
- Single stock represents >20% of portfolio
- Sector concentration beyond comfort level
- Can''t or don''t want to sell (tax, conviction, restrictions)

**Event Risk**
- Holding through earnings announcements
- Major economic events (FOMC, NFP, CPI)
- Political events (elections, policy decisions)
- Company-specific events (FDA approvals, lawsuits)

**Market Regime Uncertainty**
- Extended bull market, overvalued conditions
- High volatility regimes
- Potential trend changes

**Profit Protection**
- Significant unrealized gains you want to protect
- Approaching year-end (tax planning)
- Equity curve at all-time highs

---

## Core Hedging Strategies

### 1. Protective Put (Stock + Long Put)

**Structure**: Own stock + buy put option at desired protection level

**Example**:
- Own 100 shares of AAPL at $150
- Buy 1 AAPL $145 Put for $3.00 (1 month expiration)
- Cost: $300 (premium)

**Protection Profile**:
- Maximum loss: $5/share (stock to strike) + $3 premium = $8/share ($800 total)
- Breakeven: $153 (stock price + premium paid)
- Upside: Unlimited (minus premium paid)

**When to Use**:
- You want to stay long but fear short-term downside
- Willing to pay premium for peace of mind
- Earnings, FOMC, or other binary events approaching

### 2. Collar (Stock + Put + Short Call)

**Structure**: Own stock + buy put + sell call to offset put cost

**Example**:
- Own 100 AAPL at $150
- Buy 1 AAPL $140 Put for $2.00
- Sell 1 AAPL $160 Call for $2.50
- Net credit: $0.50 ($50 total)

**Protection Profile**:
- Maximum loss: $10/share (stock to $140 put strike)
- Maximum gain: $10/share (stock to $160 call strike) + $0.50 credit
- Cost: Zero (or net credit)

**When to Use**:
- Want downside protection without paying premium
- Willing to cap upside
- Holding through known risk events

### 3. Index Hedge (Individual Stocks + Short Index)

**Structure**: Long individual positions + short S&P 500 futures or buy puts

**Example**:
- Long $100,000 in tech stocks
- Buy 1 SPY $400 Put (if SPY at $420) for $5.00
- Notional hedge: ~$40,000-50,000

**Protection Profile**:
- If market drops 10%, individual stocks may drop 12-15%
- Index put gains offset some stock losses
- Beta mismatch means imperfect hedge

**When to Use**:
- Hedging market risk, not stock-specific risk
- Many positions too complex to hedge individually
- Concerned about broad market decline

### 4. Pairs Trading / Market Neutral

**Structure**: Long one stock + short correlated stock

**Example**:
- Long 100 shares KO (Coca-Cola) at $60
- Short 100 shares PEP (Pepsi) at $170
- Notionally: Long $6,000, Short $17,000 (adjust sizes for dollar neutrality)

**Adjusted**: Long 283 KO ($17,000) + Short 100 PEP ($17,000)

**Protection Profile**:
- Market risk largely neutralized
- Profit if KO outperforms PEP (regardless of market direction)
- Loss if PEP outperforms KO

**When to Use**:
- You have conviction about relative performance
- Want to neutralize market direction risk
- Factor exposure (long value, short growth, etc.)

### 5. Tail Risk Hedge (Far OTM Puts)

**Structure**: Buy cheap, far out-of-the-money puts

**Example**:
- Portfolio: $500,000
- Buy 10 SPY $350 Puts (SPY at $420) for $0.50 each
- Cost: $500 (0.1% of portfolio)

**Protection Profile**:
- Puts expire worthless in normal conditions
- In crash (SPY drops to $350), puts worth ~$70 each = $7,000
- Asymmetric payoff: Small cost, large potential gain in crisis

**When to Use**:
- Ongoing portfolio insurance
- Elevated crash risk periods
- Sleep-at-night money for long-term holdings

---

## Calculating Hedge Ratios

### Beta-Adjusted Hedging

If your portfolio has higher beta than the hedge instrument:

**Formula**: Hedge Size = Portfolio Value × Portfolio Beta / Hedge Instrument Beta

**Example**:
- Portfolio: $100,000 in tech stocks, beta = 1.3
- Hedge: SPY puts, beta = 1.0
- Hedge Size Needed: $100,000 × 1.3 / 1.0 = $130,000 notional

### Delta-Adjusted Hedging

For options hedges, consider delta:

**Example**:
- 100 shares of stock to hedge
- Put option with delta of -0.40
- Puts needed: 100 / 0.40 = 250 shares notional = 2.5 contracts

As the stock moves, delta changes—hedges require adjustment.

---

## Dynamic Hedging

### When to Adjust

**Static Hedge**: Set it and forget it until expiration or exit
**Dynamic Hedge**: Adjust as conditions change

**Adjustment Triggers**:
- Stock price moves significantly (delta changes)
- Time decay erodes option protection
- Implied volatility changes materially
- Fundamental thesis changes

### Rolling Hedges

As options approach expiration:
1. Close existing hedge (or let expire)
2. Open new hedge at current levels
3. Cost: Additional premium; Benefit: Continued protection

**Example (Monthly Roll)**:
- Original: June $145 Put on AAPL
- Roll: Sell June put, buy July $145 (or new strike) put

---

## Hedge Costs and Trade-offs

### The Cost of Protection

| Hedge Type | Typical Cost | Upside Cap? | Adjustment Needed? |
|------------|--------------|-------------|-------------------|
| Protective Put | 2-5% of position | No | At expiration |
| Collar | 0% (neutral) | Yes | At expiration |
| Index Put | 1-3% of portfolio | No | At expiration |
| Tail Risk Put | 0.1-0.5% of portfolio | No | Monthly/Quarterly |

### When Not to Hedge

- **Small positions**: Transaction costs exceed benefit
- **High conviction, long timeframe**: Hedge cost compounds
- **Cheap underlying**: Selling is simpler
- **Low correlation**: Hedge won''t track position

---

## Common Hedging Mistakes

### 1. Over-Hedging
Hedging more than needed costs money and limits gains. If you''re hedging 100% of a position, consider just selling.

### 2. Wrong Instrument
Hedging individual stock risk with index puts leaves stock-specific risk exposed. Match the hedge to the risk.

### 3. Ignoring Costs
Hedge costs compound. 2% quarterly = 8% annually = significant return drag.

### 4. Set and Forget
Markets move; hedges need maintenance. Review hedge effectiveness regularly.

### 5. Panic Hedging
Buying puts after market drops 10% is expensive (high IV) and locks in losses. Hedge before you need to, not after.

---

## Professional Hedge Examples

### Example 1: Earnings Protection
**Situation**: Long 500 NVDA at $500, earnings tomorrow
**Concern**: Stock could drop 15% on miss
**Action**: Buy 5 NVDA $480 Puts for $8.00 each = $4,000
**Outcome**: If NVDA drops to $420, puts worth $60 each = $30,000 (offsets $40,000 stock loss)

### Example 2: Portfolio Tail Risk
**Situation**: $1M portfolio, 60% stocks, concerned about crash
**Action**: Allocate 0.3% ($3,000) to SPY 15% OTM puts quarterly
**Outcome**: In normal times, lose $12,000/year. In crash, puts provide $50,000+ offset.

### Example 3: Tax-Efficient Protection
**Situation**: Huge gain in single stock, selling triggers tax
**Action**: Collar locks in gain without triggering sale
**Outcome**: Capped upside, protected downside, no current tax event

---

## Key Takeaways

1. **Hedging is insurance**: Accept the cost, appreciate the protection
2. **Match hedge to risk**: Stock risk needs stock or sector hedges
3. **Size matters**: Under-hedging provides false comfort; over-hedging is expensive
4. **Timing matters**: Hedge before volatility spikes, not after
5. **Review regularly**: Markets change; hedges need adjustment

Hedging won''t make you rich—it prevents you from becoming poor. The best hedge is one you never need, but you''re glad you had.' WHERE slug = 'hedging-strategies';

-- Risk Management: Kelly Criterion
UPDATE learning_articles SET content = '## Understanding the Kelly Criterion

The Kelly Criterion is a mathematical formula for optimal bet sizing that maximizes long-term wealth growth. Developed by John Kelly at Bell Labs in 1956, it has been adopted by legendary investors like Warren Buffett and Ed Thorp. When applied correctly, it represents the mathematically optimal position size for any edge.

### The Formula

**Kelly Percentage = W - (1-W)/R**

Where:
- **W** = Win rate (probability of winning)
- **R** = Win/Loss ratio (average win / average loss)

**Example**:
- Win rate: 55%
- Average win: $300
- Average loss: $200
- R = 300/200 = 1.5

Kelly % = 0.55 - (1-0.55)/1.5
Kelly % = 0.55 - 0.45/1.5
Kelly % = 0.55 - 0.30
Kelly % = 0.25 or **25% of capital**

---

## Why Kelly Is Optimal

### Geometric Growth Maximization

The Kelly Criterion maximizes the geometric mean of returns, which is the compound growth rate. This differs from maximizing expected value (arithmetic mean).

**Example Comparison**:

| Bet Size | Expected Return | Growth Rate | Long-term Wealth |
|----------|-----------------|-------------|------------------|
| Under-Kelly | Good | Suboptimal | Grows slower |
| Full Kelly | Maximum | Maximum | Maximum |
| Over-Kelly | Good | Suboptimal | Grows slower |
| Way Over-Kelly | May be high | Negative | Goes to zero |

Key insight: Betting too large is as damaging as betting too small—but with added risk of ruin.

### No Risk of Ruin

At Kelly sizing, it''s mathematically impossible to go broke (in continuous betting). Each bet is proportional to remaining capital.

- Lose 25% → Next bet is 25% of 75% = 18.75%
- Continue losing → Bets shrink proportionally
- You asymptotically approach zero but never reach it

---

## Calculating Kelly for Trading

### Step 1: Gather Your Statistics

You need reliable data from at least 100 trades:
- Win rate (% of trades profitable)
- Average winning trade ($)
- Average losing trade ($)

**Caution**: Statistics must come from your actual trading with your actual psychology—not backtests.

### Step 2: Calculate Win/Loss Ratio

R = Average Win / Average Loss

**Example**:
- 100 trades: 58 winners, 42 losers
- Total profits from winners: $14,500
- Total losses from losers: $8,400
- Average win: $14,500 / 58 = $250
- Average loss: $8,400 / 42 = $200
- R = 250 / 200 = 1.25

### Step 3: Apply Kelly Formula

Kelly % = W - (1-W)/R
Kelly % = 0.58 - (0.42)/1.25
Kelly % = 0.58 - 0.336
Kelly % = 0.244 or **24.4%**

### Step 4: Apply Fractional Kelly

Full Kelly is rarely practical because:
- Statistics are estimates, not certainties
- Markets are non-stationary (edge changes)
- Volatility at full Kelly is psychologically brutal

**Fractional Kelly recommendations**:
- Conservative: 1/4 Kelly (6.1% in example)
- Moderate: 1/2 Kelly (12.2% in example)
- Aggressive: Full Kelly (24.4% in example)

Most professional traders use 1/4 to 1/2 Kelly.

---

## Practical Kelly Application

### Position Sizing Workflow

1. **Calculate Kelly %** for your strategy (once, update quarterly)
2. **Apply fraction** (typically 1/4 or 1/2)
3. **Calculate dollar risk** per trade: Account × Fractional Kelly
4. **Calculate position size**: Dollar risk / Stop loss distance

**Example**:
- Account: $100,000
- Full Kelly: 24%
- Fractional (1/4): 6%
- Dollar risk per trade: $100,000 × 0.06 = $6,000
- Stop loss: $5 per share
- Position size: $6,000 / $5 = 1,200 shares

### Multiple Strategies

If you trade multiple uncorrelated strategies:
- Calculate Kelly for each separately
- Sum of all positions should not exceed portfolio Kelly
- Diversification allows for larger total allocation

### Adjusting for Confidence

Less confidence in edge estimate → Lower Kelly fraction

| Confidence Level | Kelly Fraction |
|------------------|----------------|
| Highly confident (1000+ trades) | 1/2 Kelly |
| Moderately confident (200-1000 trades) | 1/4 Kelly |
| Low confidence (<200 trades) | 1/8 Kelly |
| Uncertain | Fixed 1-2% risk |

---

## Kelly Variants

### Fractional Kelly

**f = Kelly × fraction** (e.g., 0.5)

Benefits:
- Reduces volatility significantly
- Still captures most of growth rate
- More robust to estimation errors

### Half Kelly Returns vs. Full Kelly

Surprisingly, half Kelly captures 75% of growth rate with 50% of the volatility:

| Metric | Full Kelly | Half Kelly |
|--------|------------|------------|
| Growth rate | 100% | 75% |
| Volatility | 100% | 50% |
| Max drawdown | High | Moderate |
| Psychological burden | Severe | Manageable |

### Continuous Kelly

For frequent trading where positions overlap:

**f = (μ - r) / σ²**

Where:
- μ = Expected return
- r = Risk-free rate
- σ² = Variance of returns

This continuous form is common in quantitative finance.

---

## Kelly Limitations

### 1. Estimation Error

Kelly requires precise knowledge of edge. In reality:
- Win rates fluctuate
- Market conditions change
- Sample sizes are limited

**Solution**: Use conservative Kelly fractions.

### 2. Non-Normal Distributions

Kelly assumes certain distribution properties. Markets have:
- Fat tails (extreme events)
- Skewness (asymmetric returns)
- Kurtosis (peaked distributions)

**Solution**: Account for tail risk separately; Kelly for normal operation.

### 3. Psychological Feasibility

Full Kelly produces extreme volatility:
- 50% drawdowns are expected
- Multi-year recovery periods possible
- Few traders can stomach this

**Solution**: Fractional Kelly matches risk tolerance.

### 4. Correlation Effects

Multiple positions may be correlated:
- Positions that move together increase effective sizing
- Kelly on each position separately can overexpose

**Solution**: Calculate portfolio-level Kelly or reduce individual Kelly fractions.

---

## Kelly in Practice

### Example 1: Day Trader

**Statistics** (500 trades):
- Win rate: 52%
- Average win: $450
- Average loss: $350

**Calculation**:
R = 450/350 = 1.29
Kelly = 0.52 - 0.48/1.29 = 0.52 - 0.37 = 0.15 or 15%

**Application** (1/2 Kelly):
- Account: $50,000
- Risk per trade: 7.5% = $3,750
- If stop is $2: Position size = 1,875 shares

### Example 2: Swing Trader

**Statistics** (150 trades):
- Win rate: 45%
- Average win: $1,200
- Average loss: $600

**Calculation**:
R = 1200/600 = 2.0
Kelly = 0.45 - 0.55/2.0 = 0.45 - 0.275 = 0.175 or 17.5%

**Application** (1/4 Kelly due to lower sample):
- Account: $100,000
- Risk per trade: 4.4% = $4,400
- If stop is $5: Position size = 880 shares

### Example 3: No Edge

**Statistics**:
- Win rate: 48%
- Average win: $200
- Average loss: $200

**Calculation**:
R = 200/200 = 1.0
Kelly = 0.48 - 0.52/1.0 = 0.48 - 0.52 = -0.04

**Result**: Negative Kelly means no edge exists. Optimal bet = $0.

This is why proving your edge before sizing is critical.

---

## Common Mistakes

### 1. Using Backtest Statistics
Backtests overestimate edges. Use live trading data only.

### 2. Full Kelly Without Fractional Adjustment
The volatility is intolerable. Always use fractional Kelly.

### 3. Ignoring Correlation
Multiple positions in same sector = effectively one large position.

### 4. Not Recalculating
Edges change. Recalculate Kelly quarterly using recent data.

### 5. Emotional Overrides
After wins, temptation to exceed Kelly. After losses, temptation to reduce. Stick to formula.

---

## Key Takeaways

1. **Kelly is mathematically optimal**: For long-term geometric growth
2. **Inputs matter**: Garbage statistics → garbage sizing
3. **Fractional Kelly is practical**: 1/4 to 1/2 Kelly captures most growth with less pain
4. **No edge = no bet**: Negative Kelly means don''t trade that strategy
5. **Update regularly**: Recalculate as your edge evolves

The Kelly Criterion removes emotion from sizing decisions. Your only job is to develop an edge—Kelly tells you exactly how much to bet.' WHERE slug = 'kelly-criterion';

-- Risk Management: Maximum Loss Rules
UPDATE learning_articles SET content = '## Why Maximum Loss Rules Exist

Maximum loss rules are pre-defined limits that halt trading when certain loss thresholds are reached. They exist because human psychology deteriorates predictably under drawdown stress. Rules enforce discipline when your brain is least capable of rational decision-making.

### The Tilt Problem

When traders experience losses:
- Amygdala (emotional brain) becomes hyperactive
- Prefrontal cortex (rational brain) becomes less active
- Risk perception distorts (feel "due" for wins)
- Position sizing often increases (trying to recover)
- Setup quality decreases (forcing trades)

Maximum loss rules intervene before this cascade destroys accounts.

---

## Types of Maximum Loss Rules

### 1. Daily Maximum Loss

**Definition**: Stop trading for the day when cumulative loss reaches threshold.

**Common Thresholds**:
- Conservative: 1% of account
- Moderate: 2% of account
- Aggressive: 3% of account

**Example**:
- Account: $100,000
- Daily max loss: 2% = $2,000
- First trade: -$800
- Second trade: -$700
- Third trade: -$600 (Total: -$2,100)
- STOP: Daily limit hit. No more trading today.

### 2. Weekly Maximum Loss

**Definition**: Stop trading for the week when cumulative weekly loss reaches threshold.

**Common Thresholds**:
- Conservative: 3% of account
- Moderate: 5% of account
- Aggressive: 7% of account

**Logic**: Even if you don''t hit daily limits, cumulative weekly pain requires a reset.

### 3. Monthly Maximum Loss

**Definition**: Stop or reduce trading when monthly loss reaches threshold.

**Common Thresholds**:
- Conservative: 5% of account
- Moderate: 8% of account
- Aggressive: 10% of account

**Response Options**:
- Stop trading entirely for rest of month
- Reduce position sizes by 50%
- Paper trade only until month ends

### 4. Consecutive Loss Rule

**Definition**: Stop trading after N consecutive losses regardless of dollar amount.

**Common Thresholds**:
- Conservative: 2 consecutive losses → break
- Moderate: 3 consecutive losses → break
- Aggressive: 5 consecutive losses → stop for day

**Logic**: Consecutive losses may indicate market regime issue or psychological impairment.

### 5. Strategy-Specific Limits

**Definition**: Maximum drawdown allowed for individual strategy before pausing.

**Example**:
- Breakout strategy: Stop at -20% strategy drawdown
- Mean reversion: Stop at -15% strategy drawdown

**Logic**: Losing streaks may indicate strategy-market mismatch.

---

## Setting Your Maximum Loss Thresholds

### Step 1: Understand Your Edge Statistics

From your trading data, determine:
- Average losing streak length
- Average loss per trade
- Typical daily P&L volatility

**Example Analysis**:
- Average loss: $250
- Longest losing streak: 7 trades
- Worst-case day (historical): -$1,800

### Step 2: Statistical Boundaries

Set limits that accommodate normal variance but catch unusual days:

**Formula Approach**:
Daily limit = Average daily loss × 2 standard deviations

If your normal daily P&L standard deviation is $600:
Daily limit ≈ 2 × $600 = $1,200 (or round to $1,500)

### Step 3: Psychological Tolerance

Rules must be survivable psychologically:
- A limit you can''t tolerate won''t be followed
- A limit that triggers often causes frustration
- Balance protection with practical trading

### Step 4: Account Preservation

Ensure limits prevent catastrophic damage:
- Monthly limit should prevent >10% annual drawdown from single month
- Weekly limit prevents monthly limit from being hit in one week
- Daily limit prevents weekly limit from being hit in one day

**Hierarchy Example**:
- Daily: 1.5%
- Weekly: 4%
- Monthly: 7%
- Annual target max drawdown: 20%

---

## Implementation Methods

### Manual Implementation

**Process**:
1. Calculate threshold before trading begins
2. Track P&L throughout session
3. When threshold approaches, heighten awareness
4. When threshold hit, close all positions and stop

**Challenges**:
- Requires discipline
- Easy to rationalize "one more trade"
- Emotion can override

### Automated Implementation

**Platform Features**:
- Many platforms offer daily loss limits
- Positions automatically closed at threshold
- Account locked until next trading day

**Benefits**:
- No discipline required
- Cannot be overridden in the moment
- Technology enforces what psychology can''t

### Hybrid Implementation

**Process**:
1. Set hard stop at 2x your soft limit (automated)
2. Manually follow soft limit (1x)
3. Automated hard stop catches failures of discipline

**Example**:
- Soft limit: $1,500 (self-enforced)
- Hard limit: $3,000 (automated)

---

## Maximum Loss Rule Protocols

### When Daily Limit Is Hit

**Immediate Actions**:
1. Close all open positions
2. Close trading platform
3. Step away from computer physically
4. Do NOT return to check prices

**Same-Day Review** (1-2 hours later):
1. Journal all trades with emotional notes
2. Identify what went wrong (if anything—could be normal variance)
3. Note warning signs you might have missed

**Preparation for Tomorrow**:
1. Confirm no change to standard position sizing
2. Review that strategy is still valid
3. Mental reset: Tomorrow is a new day

### When Weekly Limit Is Hit

**Immediate Actions**:
1. Close all positions
2. No trading until following Monday
3. Complete thorough week review

**During Time Off**:
1. Comprehensive trade-by-trade analysis
2. Identify patterns in losing trades
3. Assess whether market conditions changed
4. Determine if strategy adjustment needed

**Return to Trading**:
1. Monday: Paper trade or reduced size
2. If confidence restored: Normal size Tuesday
3. If doubts persist: Continue reduced size

### When Monthly Limit Is Hit

**Immediate Actions**:
1. Stop all live trading for remainder of month
2. This is not optional or negotiable

**During Time Off**:
1. Deep strategy review
2. Consult mentor or trading community
3. Extensive journaling and pattern recognition
4. Consider whether something fundamental changed

**Return to Trading**:
1. First week: 50% position size
2. Second week: 75% if first week profitable
3. Third week: 100% if week two profitable
4. Reset to 50% if losses continue

---

## Common Implementation Failures

### Failure 1: Moving the Goalposts

**Behavior**: "I''m at my limit, but this next trade is a sure thing."
**Result**: Limit becomes meaningless; losses compound.
**Solution**: Limits are law, not guidelines. Zero exceptions.

### Failure 2: Time Pressure Violations

**Behavior**: "Market closes in 30 minutes, I need to make this back."
**Result**: Desperation trades at worst possible time.
**Solution**: Time of day doesn''t change the limit.

### Failure 3: Revenge After Reset

**Behavior**: Next trading day, double size to "recover" yesterday''s losses.
**Result**: Potential for worse day compounding prior damage.
**Solution**: New day = standard size. Past losses are sunk costs.

### Failure 4: Not Counting Commissions/Fees

**Behavior**: "I''m at -$1,450, limit is $1,500, I have room."
**Result**: With commissions, actual loss exceeds limit.
**Solution**: Include all costs in loss calculation.

### Failure 5: Ignoring Open P&L

**Behavior**: "I haven''t closed the position, so it''s not a loss yet."
**Result**: Unrealized loss becomes realized and exceeds limit.
**Solution**: Count open P&L toward limits; a loss is a loss.

---

## Adjusting Limits Over Time

### When to Tighten Limits

- During drawdown periods (reduce variance)
- When learning new strategy
- When trading new instruments
- During unusual market conditions (high volatility)

### When to Loosen Limits

- Track record proves consistent profitability
- Account growth allows for larger absolute limits
- Edge has been verified over large sample

### Percentage vs. Absolute Amounts

**Percentage**:
- Scales with account size
- Consistent risk management as account grows
- Recommended for most traders

**Absolute**:
- "I can''t lose more than $5,000/day"
- May make sense for psychological reasons
- Must be updated as account changes

---

## Maximum Loss Rules for Different Trader Types

### Day Traders
- Daily limit: 1-2% of account
- Per-trade limit: 0.25-0.5% of account
- Consecutive loss limit: 3 trades → 15-minute break

### Swing Traders
- Daily limit: 2-3% (positions may gap against)
- Weekly limit: 4-5%
- Per-trade limit: 1-2% of account

### Position Traders
- Weekly limit: 3-4%
- Monthly limit: 6-8%
- Per-trade limit: 1.5-2.5% of account

---

## Key Takeaways

1. **Rules exist for bad times**: You don''t need limits when things are good
2. **Predetermined limits stick**: Limits set during trading don''t work
3. **Automation is ideal**: Technology beats willpower
4. **No exceptions**: One exception destroys the rule''s power
5. **Limits protect careers**: Single bad days can end trading careers

The best traders aren''t those who never have losing days—they''re those who survive losing days with capital intact.' WHERE slug = 'max-loss-rules';