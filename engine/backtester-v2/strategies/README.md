# BacktesterV2 Professional Trading Strategies

This directory contains production-ready, mathematically rigorous trading strategies for the BacktesterV2 engine.

## Available Strategies

### Indicator-Based Strategies

#### TrendFollowing.ts
- **Type**: Momentum
- **Indicators**: Moving Average Crossovers, MACD
- **Use Cases**: Trending markets, strong directional moves
- **Parameters**: MA periods, MACD settings, position sizing
- **Best For**: Forex pairs, major indices

#### MeanReversion.ts
- **Type**: Contrarian
- **Indicators**: RSI, Bollinger Bands
- **Use Cases**: Range-bound markets, overbought/oversold conditions
- **Parameters**: RSI periods, BB standard deviations
- **Best For**: Sideways markets, stocks

#### Breakout.ts
- **Type**: Volatility
- **Indicators**: Donchian Channels, ATR, Support/Resistance
- **Use Cases**: Consolidation breakouts, volatility expansion
- **Parameters**: Lookback periods, ATR multipliers
- **Best For**: All asset classes, volatile instruments

### Statistical Arbitrage

#### PairZScore.ts
- **Type**: Mean reversion (pairs)
- **Method**: Z-score of spread, beta-neutral sizing
- **Use Cases**: Correlated assets, market-neutral strategies
- **Parameters**: Lookback period, entry/exit thresholds, leverage
- **Best For**: Stocks in same sector, ETF pairs, currency crosses

### Chart Pattern Strategies (NEW)

#### HeadAndShoulders.ts
- **Type**: Reversal pattern detection
- **Method**: Peak detection, neckline calculation, breakout confirmation
- **Patterns**: Regular H&S (bearish), Inverse H&S (bullish)
- **Parameters**:
  - `lookbackPeriod`: Bars to analyze for pattern formation
  - `shoulderSymmetryTolerance`: % difference allowed between shoulders
  - `necklineBreakConfirmation`: Bars required to confirm breakout
  - `volumeConfirmation`: Require volume increase on break
- **Best For**: Major trend reversals, swing trading
- **Entry**: Neckline break + confirmation
- **Target**: Measured move (pattern height from neckline)

#### DoubleTopBottom.ts
- **Type**: Reversal pattern detection
- **Method**: Peak similarity matching, neckline validation
- **Patterns**: Double Top (bearish), Double Bottom (bullish)
- **Parameters**:
  - `peakSimilarityTolerance`: % difference for peak equality (e.g., 2%)
  - `minBarsBetweenPeaks`: Minimum separation between tops/bottoms
  - `necklineBreakConfirmation`: Bars to confirm break
- **Best For**: Key support/resistance tests, reversal trading
- **Entry**: Support/resistance break + confirmation
- **Target**: Measured move from pattern height

#### TrianglePatterns.ts
- **Type**: Continuation/breakout pattern detection
- **Method**: Trendline regression, convergence analysis
- **Patterns**: 
  - Ascending Triangle (bullish continuation)
  - Descending Triangle (bearish continuation)
  - Symmetrical Triangle (breakout direction depends on trend)
- **Parameters**:
  - `minTrendlineTouches`: Required touches for valid trendline (2-3)
  - `trendlineTolerance`: % price can deviate from trendline
  - `breakoutConfirmation`: Bars to confirm breakout
- **Best For**: Consolidation periods, momentum trading
- **Entry**: Trendline breakout + volume confirmation
- **Target**: Triangle height projected from breakout

### Single Asset with Cross-Instrument Trigger

#### SingleCrossTrigger.ts
- **Type**: Cross-market signal generation
- **Method**: Trade one asset based on another's trigger
- **Use Cases**: Trade USD pairs based on DXY, trade stocks based on index
- **Parameters**: Tradable symbol, trigger symbol, entry/exit thresholds

## Strategy Selection Guide

### By Market Condition

**Trending Markets**:
- TrendFollowing (MA/MACD)
- Breakout (Donchian)
- TrianglePatterns (continuation)

**Range-Bound Markets**:
- MeanReversion (RSI/BB)
- PairZScore
- DoubleTopBottom (reversal)

**High Volatility**:
- Breakout (ATR-based)
- HeadAndShoulders (major reversals)

**Low Volatility**:
- PairZScore (arbitrage)
- TrianglePatterns (pre-breakout)

### By Trading Style

**Day Trading**:
- Breakout (short lookbacks)
- TrendFollowing (fast MAs)
- SingleCrossTrigger

**Swing Trading**:
- HeadAndShoulders
- DoubleTopBottom
- TrianglePatterns

**Position Trading**:
- TrendFollowing (slow MAs)
- MeanReversion (long cycles)

**Market Neutral**:
- PairZScore

## Pattern Strategy Implementation Details

All chart pattern strategies use **real OHLC mathematical algorithms**, not AI interpretation:

### Mathematical Components

1. **Peak/Trough Detection**: Local extremum identification with configurable window sizes
2. **Trendline Fitting**: Linear regression on swing points with validation
3. **Pattern Validation**: Structural rules (e.g., head higher than shoulders, peak similarity)
4. **Breakout Confirmation**: Multi-bar validation with optional volume confirmation
5. **Measured Move Targets**: Geometric projection based on pattern height

### Volume Confirmation

When `volumeConfirmation: true`:
- Monitors recent volume average
- Requires 20-30% volume increase on breakout
- Reduces false breakouts significantly

### Risk Management

All strategies support:
- **Stop Loss**: Percentage-based stops
- **Take Profit**: Fixed percentage or measured move
- **Position Sizing**: Fixed or risk-based
- **Entry Confirmation**: Multi-bar validation to reduce whipsaws

## Usage Example

```typescript
import { HeadAndShouldersStrategy } from './HeadAndShoulders';

const strategy = new HeadAndShouldersStrategy({
  symbol: 'EURUSD',
  lookbackPeriod: 50,
  shoulderSymmetryTolerance: 0.03, // 3% tolerance
  necklineBreakConfirmation: 2,    // 2 bars to confirm
  volumeConfirmation: true,
  positionSize: 1000,
  stopLoss: 0.02,    // 2% stop loss
  takeProfit: 0.05   // 5% take profit (or use measured move)
});

// In backtest loop
const signals = strategy.generateSignals(date, prices, indicators);
// Process signals...
```

## Testing

Each strategy has comprehensive unit tests in `tests/backtester-v2/`:
- Pattern detection accuracy
- Entry/exit signal generation
- Stop loss/take profit execution
- Parameter validation
- Edge cases

Run tests:
```bash
npm test -- backtester-v2
```

## Performance Optimization

1. **Lookback Period**: Balance between accuracy and performance
   - Shorter = faster but may miss patterns
   - Longer = more accurate but higher memory usage

2. **Confirmation Bars**: Balance between early entry and false signals
   - 1-2 bars = aggressive, more signals
   - 3-5 bars = conservative, fewer false positives

3. **Tolerance Parameters**: Adjust based on asset volatility
   - Low volatility assets: tighter tolerances
   - High volatility assets: looser tolerances

## Future Enhancements

Planned additions:
- Harmonic Patterns (Gartley, Bat, Butterfly, Crab)
- Flag & Pennant patterns
- Cup & Handle pattern
- Wedge patterns (Rising/Falling)
- Candlestick pattern strategies
