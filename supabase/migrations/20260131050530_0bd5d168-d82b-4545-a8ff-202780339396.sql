-- Update Statistical Arbitrage with comprehensive content
UPDATE learning_articles 
SET content = 'In 1985, Nunzio Tartaglia and a small team at Morgan Stanley discovered something that would revolutionize Wall Street: when Coca-Cola and PepsiCo stocks diverged from their historical price relationship, they almost always converged again. By systematically betting on this mean reversion—buying the underperformer and shorting the outperformer—they generated consistent profits regardless of market direction. This was the birth of statistical arbitrage, or "stat arb," a strategy that now accounts for billions in daily trading volume.

Statistical arbitrage represents the purest application of quantitative finance to trading. Unlike directional strategies that bet on markets going up or down, stat arb is market-neutral: it profits from relative price movements between correlated securities. When Royal Dutch Shell (RDS.A) trades on the NYSE and Royal Dutch Shell (RDS.B) trades on the London Stock Exchange, their prices should theoretically be identical. Any deviation represents a fleeting arbitrage opportunity that stat arb systems exploit in milliseconds.

The strategy''s elegance lies in its mathematical foundation. Cointegration theory, developed by Nobel laureate Clive Granger, provides the statistical framework for identifying pairs whose price relationship is stable over time, even when individual prices wander randomly. This isn''t correlation—two stocks can be perfectly correlated yet not cointegrated, and vice versa. Understanding this distinction is fundamental to successful stat arb.

## The Mathematics of Pairs Trading

**Cointegration vs. Correlation:**

- **Correlation:** Measures how two securities move together at any given moment. High correlation means when A goes up, B usually goes up too.

- **Cointegration:** Measures whether the *spread* between two securities is mean-reverting over time. Two cointegrated assets maintain a stable long-term relationship even if they diverge temporarily.

Example: A dog (price) walking its owner (another price) on a leash. They may wander apart, but the leash (cointegration) ensures they stay within a bounded distance.

**Testing for Cointegration:**

The Engle-Granger two-step method:

1. **Regression:** Regress price of Stock A on Stock B:
   `Price_A = β × Price_B + ε`
   
2. **ADF Test:** Apply Augmented Dickey-Fuller test to residuals (ε). If residuals are stationary (p-value < 0.05), the pair is cointegrated.

**Calculating the Hedge Ratio (β):**

```python
import statsmodels.api as sm

# Ordinary Least Squares regression
X = stock_B_prices
Y = stock_A_prices
X = sm.add_constant(X)
model = sm.OLS(Y, X).fit()
hedge_ratio = model.params[1]

# Spread calculation
spread = stock_A_prices - (hedge_ratio * stock_B_prices)
```

**Z-Score Normalization:**

```python
spread_mean = spread.rolling(20).mean()
spread_std = spread.rolling(20).std()
z_score = (spread - spread_mean) / spread_std
```

**Half-Life of Mean Reversion:**

The half-life tells you how long, on average, the spread takes to revert halfway to its mean. Shorter half-life = faster mean reversion = more trading opportunities.

```python
from statsmodels.regression.linear_model import OLS

# Ornstein-Uhlenbeck half-life calculation
spread_lag = spread.shift(1)
spread_diff = spread - spread_lag
model = OLS(spread_diff[1:], spread_lag[1:]).fit()
half_life = -np.log(2) / model.params[0]
```

Ideal pairs have half-lives between 5-30 days. Shorter = too noisy, longer = capital tied up too long.

## Pair Selection Process

**Step 1: Universe Screening**

Start with economically related securities:
- Same sector (Coke/Pepsi, Visa/Mastercard, Ford/GM)
- ETF and its constituents (XLF and JPM)
- Different share classes (Berkshire A/B, Alphabet A/C)
- ADRs and local listings
- Commodity producers and the commodity (XOM and oil futures)

**Step 2: Statistical Screening**

For each candidate pair:
1. Calculate 1-year rolling correlation (require > 0.80)
2. Run Engle-Granger cointegration test (require p < 0.05)
3. Calculate half-life (require 5-30 days)
4. Measure spread volatility (not too high or too low)
5. Check liquidity (both legs must be easily tradeable)

**Step 3: Economic Rationale Check**

Statistical relationships can break without warning. Ask:
- Why should this relationship persist?
- What could cause structural divergence?
- Have there been recent fundamental changes (spinoffs, M&A, regulatory changes)?

**Top Pairs by Category (Historical Examples):**

| Category | Pair | Typical Half-Life |
|----------|------|-------------------|
| Beverages | KO / PEP | 12 days |
| Payments | V / MA | 8 days |
| Banks | JPM / BAC | 15 days |
| Airlines | UAL / DAL | 10 days |
| Energy | XOM / CVX | 18 days |
| Tech | GOOGL / GOOG | 3 days |
| ETF Arb | SPY / IVV | 1-2 days |

## Trading the Spread

**Entry Rules:**

1. **Z-Score Threshold:** Enter when Z-score crosses ±2.0 standard deviations
   - If Z-score > +2.0: Short spread (short A, long B)
   - If Z-score < -2.0: Long spread (long A, short B)

2. **Confirmation:** Wait for Z-score to stabilize (not rapidly diverging further)

3. **Volume Check:** Ensure both legs have adequate liquidity (>$1M daily volume each)

**Position Sizing:**

Dollar-neutral positions using the hedge ratio:
```
If hedge_ratio = 0.85 and we want $100,000 exposure:
- Stock A position: $100,000 / (1 + 0.85) = $54,054
- Stock B position: $54,054 × 0.85 = $45,946
```

For a long spread trade:
- Buy $54,054 of Stock A
- Short $45,946 of Stock B

**Exit Rules:**

1. **Mean Reversion Exit:** Close when Z-score crosses 0 (spread returned to mean)

2. **Partial Profit:** Take half off at Z-score ±1.0

3. **Stop Loss:** Exit if Z-score exceeds ±3.0 or half-life is exceeded (relationship may be broken)

4. **Time Stop:** Maximum holding period of 2× half-life

**Risk Management:**

- **Pair Correlation:** If correlation drops below 0.60, exit immediately
- **Maximum Drawdown:** Close pair if unrealized loss exceeds 5% of position value
- **Portfolio Level:** Maximum 20% of capital in any single sector
- **Regime Filter:** Reduce exposure during high-VIX environments

## Practice Trade Setups

**Setup 1: Classic Sector Pair (KO/PEP)**
- **Pair:** Coca-Cola (KO) / PepsiCo (PEP)
- **Hedge Ratio:** 0.92 (from 1-year OLS regression)
- **Signal:** Z-score hits +2.3 (KO overvalued relative to PEP)
- **Trade:** Short $50,000 KO at $59.50, Long $46,000 PEP at $178.00
- **Stop Loss:** Z-score > 3.0 or 30-day time stop
- **Target:** Z-score crosses 0.5 (partial) and 0.0 (full)
- **Expected Return:** 2-4% over 10-15 days

**Setup 2: ETF Arbitrage (SPY/IVV)**
- **Pair:** SPDR S&P 500 ETF (SPY) / iShares S&P 500 (IVV)
- **Hedge Ratio:** 1.00 (tracking same index)
- **Signal:** IVV trades 0.03% below SPY (3bps spread)
- **Trade:** Long $200,000 IVV, Short $200,000 SPY
- **Target:** Spread converges within 1-2 hours
- **Expected Return:** 0.02% (requires scale and low costs)

**Setup 3: Cross-Asset (XOM vs. Oil Futures)**
- **Pair:** Exxon Mobil (XOM) / WTI Crude Futures (CL)
- **Hedge Ratio:** 0.15 (XOM moves ~15% of oil''s percentage move)
- **Signal:** Z-score hits -2.5 (XOM undervalued vs. oil move)
- **Trade:** Long $100,000 XOM at $95.00
- **Hedge:** Short oil futures or long USO puts
- **Target:** XOM catches up to oil move within 2 weeks

## Common Mistakes and How to Avoid Them

1. **Ignoring Sector Beta:** Even "market-neutral" pairs have sector exposure. GM/F pair is still 100% exposed to auto sector.

2. **Overfitting Hedge Ratios:** Don''t use in-sample data to calculate hedge ratios. Use rolling out-of-sample estimates.

3. **Ignoring Structural Breaks:** Pairs can decorrelate permanently (think AT&T before/after breakup). Monitor for fundamental changes.

4. **Overleveraging:** Because individual positions seem low-risk, traders often overleverage. A 3× leverage pair portfolio can still blow up.

5. **Ignoring Borrow Costs:** Shorting popular stocks can cost 5-10%+ annually. Factor this into expected returns.

## Portfolio Construction

Successful stat arb runs multiple pairs simultaneously:

1. **Diversification:** 15-30 pairs across sectors
2. **Correlation Matrix:** Ensure pairs are uncorrelated with each other
3. **Capital Allocation:** Equal risk per pair (volatility-adjusted sizing)
4. **Rebalancing:** Weekly hedge ratio recalculation
5. **Capacity Limits:** Reduce size when spreads are tight across the board

## Key Takeaways

Statistical arbitrage is one of the most intellectually elegant trading strategies, combining economic intuition with rigorous mathematical framework. Success requires deep understanding of cointegration, disciplined execution, and constant monitoring for structural breaks. Start with obvious pairs (same-sector leaders, ETF arbitrage), master the mathematics, and only then expand to more exotic relationships. Remember: the best stat arb opportunities exist precisely because they''re difficult to identify and harder to execute consistently.',
updated_at = now()
WHERE slug = 'statistical-arbitrage';