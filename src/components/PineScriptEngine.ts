const DISCLAIMER_TEXT = `
IMPORTANT DISCLAIMER - READ CAREFULLY

EDUCATIONAL USE ONLY
This code and related materials are provided for educational purposes only and do not constitute financial advice, investment advice, trading advice, or any other sort of advice.

NO GUARANTEE OF RESULTS
Past performance does not guarantee future results. Trading involves substantial risk of loss and is not suitable for all investors.

USE AT YOUR OWN RISK
You acknowledge that you are using this code at your own risk. The creators are not responsible for any losses incurred from using this code.

CUSTOMIZATION REQUIRED
This is a template that requires customization and testing before live use. Always backtest thoroughly and start with small position sizes.

RISK MANAGEMENT
Always implement proper risk management including position sizing, stop losses, and maximum drawdown controls.
`;

export class PineScriptEngine {
  public static getStrategyParameters(strategy: any): any {
    const approach = strategy.answers?.style?.approach || 'trend-following';
    const riskSettings = strategy.answers?.risk || {};
    
    // Base parameters that all strategies need
    const baseParams = {
      // Session settings
      trade_start: { default: 0, min: 0, max: 2359, step: 1 },
      trade_end: { default: 2359, min: 0, max: 2359, step: 1 },
      
      // Risk management  
      risk_r: { default: riskSettings.riskPerTrade || 2.0, min: 0.1, max: 10.0, step: 0.1 },
      tp_rr: { default: 2.0, min: 0.5, max: 10.0, step: 0.1 },
      
      // Trade direction
      use_long: { default: true },
      use_short: { default: true },
      max_trades_day: { default: 5, min: 0, max: 100, step: 1 }
    };

    // Approach-specific parameters
    switch (approach) {
      case "trend-following":
        return {
          ...baseParams,
          fast_len: { default: 12, min: 5, max: 50, step: 1 },
          slow_len: { default: 26, min: 10, max: 200, step: 1 },
          rsi_len: { default: 14, min: 2, max: 50, step: 1 },
          rsi_buy: { default: 60, min: 50, max: 80, step: 1 },
          rsi_sell: { default: 40, min: 20, max: 50, step: 1 },
          atr_len: { default: 14, min: 5, max: 50, step: 1 },
          atr_mult: { default: 1.5, min: 0.5, max: 5.0, step: 0.1 }
        };

      case "mean-reversion":
        return {
          ...baseParams,
          bb_len: { default: 20, min: 10, max: 50, step: 1 },
          bb_dev: { default: 2.0, min: 1.0, max: 4.0, step: 0.1 },
          rsi_len: { default: 14, min: 2, max: 50, step: 1 },
          rsi_buy: { default: 30, min: 10, max: 40, step: 1 },
          rsi_sell: { default: 70, min: 60, max: 90, step: 1 },
          atr_len: { default: 14, min: 5, max: 50, step: 1 },
          atr_mult: { default: 1.0, min: 0.5, max: 3.0, step: 0.1 }
        };

      case "breakout":
        return {
          ...baseParams,
          bb_len: { default: 20, min: 10, max: 50, step: 1 },
          bb_dev: { default: 2.0, min: 1.0, max: 4.0, step: 0.1 },
          vol_mult: { default: 1.5, min: 1.0, max: 3.0, step: 0.1 },
          atr_len: { default: 14, min: 5, max: 50, step: 1 },
          atr_mult: { default: 2.0, min: 1.0, max: 5.0, step: 0.1 },
          lookback: { default: 20, min: 10, max: 50, step: 1 }
        };

      case "arbitrage":
        return {
          ...baseParams,
          corr_len: { default: 50, min: 20, max: 200, step: 1 },
          zscore_len: { default: 20, min: 10, max: 100, step: 1 },
          zscore_entry: { default: 2.0, min: 1.0, max: 4.0, step: 0.1 },
          zscore_exit: { default: 0.5, min: 0.1, max: 1.5, step: 0.1 },
          atr_len: { default: 14, min: 5, max: 50, step: 1 },
          atr_mult: { default: 1.0, min: 0.5, max: 3.0, step: 0.1 }
        };

      default:
        return {
          ...baseParams,
          fast_len: { default: 12, min: 5, max: 50, step: 1 },
          slow_len: { default: 26, min: 10, max: 200, step: 1 },
          rsi_len: { default: 14, min: 2, max: 50, step: 1 },
          rsi_buy: { default: 60, min: 50, max: 80, step: 1 },
          rsi_sell: { default: 40, min: 20, max: 50, step: 1 },
          atr_len: { default: 14, min: 5, max: 50, step: 1 },
          atr_mult: { default: 1.5, min: 0.5, max: 5.0, step: 0.1 }
        };
    }
  }

  public static generateStrategyVersion(strategy: any): string {
    const name = strategy.name || 'Professional Strategy';
    const approach = strategy.answers?.style?.approach || 'trend-following';
    const params = this.getStrategyParameters(strategy);
    const riskSettings = strategy.answers?.risk || {};
    const initialCapital = riskSettings.accountPrinciple || 100000;

    // Generate parameter inputs
    const generateInputs = (params: any) => {
      return Object.entries(params).map(([key, config]: [string, any]) => {
        if (typeof config.default === 'boolean') {
          return `${key} = input.bool(${config.default}, "${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}")`;
        } else if (typeof config.default === 'number') {
          const minMax = config.min !== undefined && config.max !== undefined ? `, minval=${config.min}, maxval=${config.max}` : '';
          const step = config.step !== undefined ? `, step=${config.step}` : '';
          return `${key} = input.${Number.isInteger(config.default) ? 'int' : 'float'}(${config.default}, "${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"${minMax}${step})`;
        }
        return `${key} = input.string("${config.default}", "${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}")`;
      }).join('\n');
    };

    // Generate approach-specific indicators and signals
    const generateIndicatorsAndSignals = (approach: string) => {
      switch (approach) {
        case "trend-following":
          return {
            indicators: `
ema_fast = ta.ema(close, fast_len)
ema_slow = ta.ema(close, slow_len)
rsi      = ta.rsi(close, rsi_len)
atr      = ta.atr(atr_len)`,
            longCond: `(ema_fast > ema_slow) and (rsi > rsi_buy)`,
            shortCond: `(ema_fast < ema_slow) and (rsi < rsi_sell)`,
            plots: `plot(ema_fast, title="EMA Fast", color=color.blue)
plot(ema_slow, title="EMA Slow", color=color.red)`
          };

        case "mean-reversion":
          return {
            indicators: `
[bb_upper, bb_middle, bb_lower] = ta.bb(close, bb_len, bb_dev)
rsi      = ta.rsi(close, rsi_len)
atr      = ta.atr(atr_len)`,
            longCond: `(close <= bb_lower) and (rsi <= rsi_buy)`,
            shortCond: `(close >= bb_upper) and (rsi >= rsi_sell)`,
            plots: `plot(bb_upper, title="BB Upper", color=color.gray)
plot(bb_middle, title="BB Middle", color=color.orange)
plot(bb_lower, title="BB Lower", color=color.gray)`
          };

        case "breakout":
          return {
            indicators: `
[bb_upper, bb_middle, bb_lower] = ta.bb(close, bb_len, bb_dev)
atr      = ta.atr(atr_len)
volume_ma = ta.sma(volume, lookback)
highest_high = ta.highest(high, lookback)
lowest_low = ta.lowest(low, lookback)`,
            longCond: `(close > highest_high[1]) and (volume > volume_ma * vol_mult)`,
            shortCond: `(close < lowest_low[1]) and (volume > volume_ma * vol_mult)`,
            plots: `plot(highest_high, title="Resistance", color=color.red, style=plot.style_line)
plot(lowest_low, title="Support", color=color.green, style=plot.style_line)`
          };

        case "arbitrage":
          return {
            indicators: `
// Note: This is a simplified arbitrage example
ma_short = ta.ema(close, corr_len / 2)
ma_long = ta.ema(close, corr_len)
price_deviation = (close - ma_long) / ma_long * 100
zscore = (price_deviation - ta.sma(price_deviation, zscore_len)) / ta.stdev(price_deviation, zscore_len)
atr = ta.atr(atr_len)`,
            longCond: `zscore <= -zscore_entry`,
            shortCond: `zscore >= zscore_entry`,
            plots: `plot(ma_long, title="Reference MA", color=color.yellow)
hline(0, title="Zero Line", color=color.gray)`
          };

        default:
          return {
            indicators: `
ema_fast = ta.ema(close, fast_len)
ema_slow = ta.ema(close, slow_len)
rsi      = ta.rsi(close, rsi_len)
atr      = ta.atr(atr_len)`,
            longCond: `(ema_fast > ema_slow) and (rsi > rsi_buy)`,
            shortCond: `(ema_fast < ema_slow) and (rsi < rsi_sell)`,
            plots: `plot(ema_fast, title="EMA Fast", color=color.blue)
plot(ema_slow, title="EMA Slow", color=color.red)`
          };
      }
    };

    const { indicators, longCond, shortCond, plots } = generateIndicatorsAndSignals(approach);

    return `//@version=5
strategy("${name}", overlay=true, initial_capital=${initialCapital}, pyramiding=0,
         commission_type=strategy.commission.percent, commission_value=0.0,
         process_orders_on_close=true)

// === PROFESSIONAL STRATEGY BUILDER ===
// Approach: ${approach.toUpperCase()}
// Generated from Strategy Builder with professional-grade parameters

// === Inputs (generated) ===
${generateInputs(params)}

// === Derived indicators ===
${indicators}

// === Session filter ===
sess_ok(_tstart, _tend) =>
    t = timenow
    hh = hour
    mm = minute
    cur = hh * 100 + mm
    (_tstart <= _tend) ? (cur >= _tstart and cur <= _tend) : (cur >= _tstart or cur <= _tend)

in_session = sess_ok(trade_start, trade_end)

// === One-trade-per-bar guard ===
newbar = ta.change(time)

// === Entries ===
longCond  = use_long  and in_session and ${longCond}
shortCond = use_short and in_session and ${shortCond}

// === Position Sizing (risk % of equity using ATR stop distance) ===
stop_dist_pts = atr_mult * atr
risk_cash = strategy.equity * (risk_r/100.0)
qty = risk_cash / stop_dist_pts

// Limit trades per day
var trades_today = 0
if ta.change(time("D"))
    trades_today := 0

can_trade = (max_trades_day == 0) or (trades_today < max_trades_day)

// Place orders
if longCond and can_trade and newbar
    strategy.entry("Long", strategy.long, qty=qty)
    strategy.exit("LX", from_entry="Long", stop=close - stop_dist_pts, limit=close + stop_dist_pts * tp_rr)
    trades_today += 1

if shortCond and can_trade and newbar
    strategy.entry("Short", strategy.short, qty=qty)
    strategy.exit("SX", from_entry="Short", stop=close + stop_dist_pts, limit=close - stop_dist_pts * tp_rr)
    trades_today += 1

// === Plots ===
${plots}

// === DISCLAIMER ===
// Educational purposes only. Not financial advice.
// Trading involves risk. Past performance does not guarantee future results.
// Always backtest thoroughly and start with small position sizes.`;
  }

  public static generateIndicatorVersion(strategy: any): string {
    // Generate indicator version by modifying the strategy version
    const strategyCode = this.generateStrategyVersion(strategy);
    return strategyCode.replace('strategy(', 'indicator(').replace(/strategy\./g, '');
  }

  public static generateDisclaimer(): string {
    return DISCLAIMER_TEXT;
  }

  public static generateReadme(strategy: any, type: string): string {
    const name = strategy.name || 'Professional Strategy';
    const approach = strategy.answers?.style?.approach || 'trend-following';
    const riskSettings = strategy.answers?.risk || {};
    
    return `# ${name} - Professional ${type.toUpperCase()}

## Overview
This ${type} implements a **${approach.replace('-', ' ').toUpperCase()}** trading strategy generated from the Professional Strategy Builder.

## Trading Approach: ${approach.replace('-', ' ').toUpperCase()}

${approach === 'trend-following' ? 
  `This strategy follows market trends using EMA crossovers and RSI confirmation.
  - **Entry**: Fast EMA above Slow EMA with RSI above buy threshold
  - **Exit**: Fast EMA below Slow EMA with RSI below sell threshold
  - **Risk Management**: ATR-based position sizing with percentage risk per trade` :
  approach === 'mean-reversion' ?
  `This strategy capitalizes on price returning to mean using Bollinger Bands and RSI.
  - **Entry**: Price touches Bollinger Band extremes with RSI confirmation
  - **Exit**: Price returns to opposite extreme or RSI neutralizes
  - **Risk Management**: ATR-based stops with controlled position sizing` :
  approach === 'breakout' ?
  `This strategy trades breakouts from consolidation zones using volume and range analysis.
  - **Entry**: Price breaks recent highs/lows with volume confirmation
  - **Exit**: Price returns to range or volume decreases
  - **Risk Management**: ATR-based stops with breakout-specific sizing` :
  approach === 'arbitrage' ?
  `This strategy exploits price inefficiencies using statistical analysis.
  - **Entry**: Z-score exceeds threshold indicating price deviation
  - **Exit**: Z-score returns to neutral range
  - **Risk Management**: Controlled exposure with statistical confidence` :
  `This strategy uses a combination of technical indicators for trading decisions.`
}

## Professional Features
- **Session Filtering**: Trade only during specified hours
- **Risk Management**: Percentage-based position sizing using ATR
- **Daily Limits**: Maximum trades per day to control overtrading
- **Professional Parameters**: All inputs with proper min/max/step validation
- **Stop Loss & Take Profit**: ATR-based with configurable risk-reward ratios

## Strategy Configuration
- **Risk Per Trade**: ${riskSettings.riskPerTrade ? riskSettings.riskPerTrade + '%' : '2.0%'} of account equity
- **Max Drawdown**: ${riskSettings.maxDrawdown ? riskSettings.maxDrawdown + '%' : 'Not specified'}
- **Initial Capital**: $${riskSettings.accountPrinciple || 100000}
- **Approach**: ${approach.replace('-', ' ').toUpperCase()}

## Disclaimer
${DISCLAIMER_TEXT}

## Support
This is a professional-grade template generated by the Strategy Builder. Please backtest thoroughly before live trading and always use proper risk management.`;
  }
}