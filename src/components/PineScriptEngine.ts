export interface StrategyConfig {
  name: string;
  indicators: string[];
  primarySignals: string[];
  entryFilters: string[];
  exitConditions: string[];
  specialParams?: { [key: string]: any };
}

export class PineScriptEngine {
  private static getStrategyConfig(strategy: any): StrategyConfig {
    const { name, category, indicators } = strategy;
    
    // Map each strategy to its specific signals and filters
    switch (category) {
      case "MACD":
        return {
          name,
          indicators: ["MACD", "EMA", "Volume"],
          primarySignals: [
            name.includes("Golden Cross") ? "macdCrossUp" : 
            name.includes("Divergence") ? "macdDivergence" :
            name.includes("Zero Line") ? "macdZeroBounce" :
            name.includes("Histogram") ? "macdHistogram" :
            name.includes("Triple Screen") ? "macdTripleScreen" : "macdCrossUp"
          ],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "RSI":
        return {
          name,
          indicators: ["RSI", "EMA", "Volume"],
          primarySignals: [
            name.includes("Divergence") ? "rsiDivergence" :
            name.includes("50 Line") ? "rsi50Line" :
            name.includes("Overbought") ? "rsiOverboughtOversold" :
            name.includes("Failure") ? "rsiFailureSwing" :
            name.includes("Cutler") ? "rsiCutler" : "rsi50Line"
          ],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "Bollinger Bands":
        return {
          name,
          indicators: ["BollingerBands", "Volume", "ATR"],
          primarySignals: [
            name.includes("Squeeze") ? "bbSqueeze" :
            name.includes("Mean Reversion") ? "bbMeanReversion" :
            name.includes("Walk") ? "bbWalk" :
            name.includes("Double") ? "bbDouble" :
            name.includes("Reversal") ? "bbReversal" : "bbSqueeze"
          ],
          entryFilters: ["volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "Moving Averages":
        return {
          name,
          indicators: ["EMA", "Volume"],
          primarySignals: [
            name.includes("Golden Cross") ? "maGoldenCross" :
            name.includes("Triple") ? "maTripleCross" :
            name.includes("VWAP") ? "vwapBounce" :
            name.includes("Hull") ? "hullMA" :
            name.includes("Adaptive") ? "adaptiveMA" : "maGoldenCross"
          ],
          entryFilters: ["volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "Stochastic":
      case "Williams %R":
      case "CCI": 
      case "Momentum":
        return {
          name,
          indicators: ["Stochastic", "EMA", "Volume"],
          primarySignals: [
            name.includes("Stochastic") ? "stochCross" :
            name.includes("Williams") ? "williamsR" :
            name.includes("CCI") ? "cciZeroCross" :
            name.includes("ROC") ? "rocMomentum" :
            name.includes("PMO") ? "pmoSignal" : "stochCross"
          ],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "Volume":
        if (name.includes("VPT") || name.includes("Volume Price Trend")) {
          return {
            name,
            indicators: ["VPT", "EMA", "Volume"],
            primarySignals: ["vptCrossover"],
            entryFilters: ["trendFilter", "volumeFilter", "vptMomentum"],
            exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"],
            specialParams: { smoothVPT: 0, vptSigLen: 20, slopeLookback: 5 }
          };
        }
        return {
          name,
          indicators: ["OBV", "ADX", "ParabolicSAR", "EMA", "Volume"],
          primarySignals: [
            name.includes("OBV") ? "obvTrend" :
            name.includes("ADX") ? "adxFilter" :
            name.includes("Parabolic") ? "sarTrend" : "obvTrend"
          ],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "Fibonacci":
      case "Ichimoku":
      case "Pivot Points":
        return {
          name,
          indicators: ["SupportResistance", "EMA", "Volume"],
          primarySignals: [
            name.includes("Fibonacci") ? "fiboBounce" :
            name.includes("Ichimoku") ? "ichimokuBreakout" :
            name.includes("Pivot") ? "pivotBounce" : "fiboBounce"
          ],
          entryFilters: ["volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      case "Advanced":
      case "Multi-Indicator":
      case "Trend Following":
        return {
          name,
          indicators: ["MACD", "RSI", "BollingerBands", "EMA", "Volume"],
          primarySignals: ["tripleConfirmation", "mtfAlignment"],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"],
          specialParams: { confirmTimeframe: "4h" }
        };

      case "Scalping":
      case "Swing Trading":
      case "Mean Reversion":
      case "Breakout":
        return {
          name,
          indicators: ["EMA", "RSI", "Volume"],
          primarySignals: [
            name.includes("Scalping") ? "fastEMAScalp" :
            name.includes("Swing") ? "weeklySwing" :
            name.includes("Mean Reversion") ? "oversoldBounce" :
            name.includes("Breakout") ? "volumeBreakout" : "fastEMAScalp"
          ],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };

      default:
        return {
          name,
          indicators: ["EMA", "RSI", "Volume"],
          primarySignals: ["basicTrend"],
          entryFilters: ["trendFilter", "volumeFilter"],
          exitConditions: ["oppositeSignal", "stopLoss", "takeProfit"]
        };
    }
  }

  private static generateIndicatorCalculations(config: StrategyConfig): string {
    let code = '';
    
    // Core calculations available to all strategies
    code += `
//=== Core calculations (available to all) ===
// EMA trend
emaLen      = input.int(50,   "Trend EMA Length", minval=1)
emaTrend    = ta.ema(close, emaLen)
upTrend     = close > emaTrend
dnTrend     = close < emaTrend

// Volume filter
useVolFilt  = input.bool(true,"Require Volume > VolMA?", inline="v")
volMaLen    = input.int(20,   "Vol MA Len", inline="v")
volMA       = ta.sma(volume, volMaLen)
volOK       = not useVolFilt or volume > volMA
`;

    // Add strategy-specific indicators
    if (config.primarySignals.includes("vptCrossover")) {
      code += `
// VPT (Volume Price Trend) - available to VPT strategies
smoothVPT   = input.int(${config.specialParams?.smoothVPT || 0}, "VPT Smoothing (0 = raw)", minval=0)
vptSigLen   = input.int(${config.specialParams?.vptSigLen || 20}, "VPT Signal Length (EMA)", minval=1)
slopeLookback = input.int(${config.specialParams?.slopeLookback || 5}, "VPT Slope Lookback (bars)", minval=1)

var float vptRaw = na
vptRaw := nz(vptRaw[1]) + (close - close[1]) / nz(close[1], close) * volume
vpt = smoothVPT > 0 ? ta.ema(vptRaw, smoothVPT) : vptRaw
vptSig = ta.ema(vpt, vptSigLen)
vptSlope = vpt - nz(vpt[slopeLookback])
`;
    }

    if (config.indicators.includes("MACD")) {
      code += `
// MACD
macdFast    = input.int(12, "MACD Fast Length")
macdSlow    = input.int(26, "MACD Slow Length")
macdSignal  = input.int(9,  "MACD Signal Length")
[macdLine, signalLine, histLine] = ta.macd(close, macdFast, macdSlow, macdSignal)
`;
    }

    if (config.indicators.includes("RSI")) {
      code += `
// RSI
rsiLen      = input.int(14, "RSI Length")
rsiValue    = ta.rsi(close, rsiLen)
rsiOB       = input.float(70, "RSI Overbought Level")
rsiOS       = input.float(30, "RSI Oversold Level")
`;
    }

    if (config.indicators.includes("BollingerBands")) {
      code += `
// Bollinger Bands
bbLen       = input.int(20, "BB Length")
bbDev       = input.float(2.0, "BB Deviation")
[bbUpper, bbMiddle, bbLower] = ta.bb(close, bbLen, bbDev)
bbSqueeze   = (bbUpper - bbLower) / bbMiddle < input.float(0.1, "Squeeze Threshold")
`;
    }

    if (config.indicators.includes("Stochastic")) {
      code += `
// Stochastic
stochK      = input.int(14, "Stochastic %K")
stochD      = input.int(3,  "Stochastic %D")
stochSmooth = input.int(3,  "Stochastic Smooth")
[stochKVal, stochDVal] = ta.stoch(close, high, low, stochK)
stochKSmooth = ta.sma(stochKVal, stochSmooth)
stochDSmooth = ta.sma(stochDVal, stochD)
`;
    }

    return code;
  }

  private static generateSignalLogic(config: StrategyConfig): { longCond: string, shortCond: string } {
    let longCond = '';
    let shortCond = '';

    // Generate signal logic based on primary signals
    config.primarySignals.forEach(signal => {
      switch (signal) {
        case "vptCrossover":
          longCond = `ta.crossover(vpt, vptSig) and vptSlope > 0`;
          shortCond = `ta.crossunder(vpt, vptSig) and vptSlope < 0`;
          break;

        case "macdCrossUp":
          longCond = `ta.crossover(macdLine, signalLine)`;
          shortCond = `ta.crossunder(macdLine, signalLine)`;
          break;

        case "macdZeroBounce":
          longCond = `macdLine > 0 and macdLine[1] <= 0`;
          shortCond = `macdLine < 0 and macdLine[1] >= 0`;
          break;

        case "macdHistogram":
          longCond = `histLine > histLine[1] and histLine[1] < histLine[2]`;
          shortCond = `histLine < histLine[1] and histLine[1] > histLine[2]`;
          break;

        case "rsi50Line":
          longCond = `ta.crossover(rsiValue, 50)`;
          shortCond = `ta.crossunder(rsiValue, 50)`;
          break;

        case "rsiOverboughtOversold":
          longCond = `rsiValue < rsiOS and rsiValue[1] >= rsiOS`;
          shortCond = `rsiValue > rsiOB and rsiValue[1] <= rsiOB`;
          break;

        case "bbSqueeze":
          longCond = `bbSqueeze[1] and not bbSqueeze and close > bbUpper[1]`;
          shortCond = `bbSqueeze[1] and not bbSqueeze and close < bbLower[1]`;
          break;

        case "bbMeanReversion":
          longCond = `close <= bbLower and close > close[1]`;
          shortCond = `close >= bbUpper and close < close[1]`;
          break;

        case "maGoldenCross":
          longCond = `ta.crossover(ta.ema(close, 50), ta.ema(close, 200))`;
          shortCond = `ta.crossunder(ta.ema(close, 50), ta.ema(close, 200))`;
          break;

        case "stochCross":
          longCond = `ta.crossover(stochKSmooth, stochDSmooth) and stochKSmooth < 80`;
          shortCond = `ta.crossunder(stochKSmooth, stochDSmooth) and stochKSmooth > 20`;
          break;

        case "tripleConfirmation":
          longCond = `ta.crossover(macdLine, signalLine) and rsiValue > 30 and rsiValue < 70 and close > bbLower`;
          shortCond = `ta.crossunder(macdLine, signalLine) and rsiValue < 70 and rsiValue > 30 and close < bbUpper`;
          break;

        default:
          longCond = `close > emaTrend and rsiValue > 30 and rsiValue < 70`;
          shortCond = `close < emaTrend and rsiValue < 70 and rsiValue > 30`;
      }
    });

    // Apply uniform filters
    const filters = [];
    if (config.entryFilters.includes("trendFilter")) {
      filters.push("upTrend", "dnTrend");
    }
    if (config.entryFilters.includes("volumeFilter")) {
      filters.push("volOK", "volOK");
    }
    if (config.entryFilters.includes("vptMomentum")) {
      filters.push("vptSlope > 0", "vptSlope < 0");
    }

    if (filters.length > 0) {
      longCond = `${longCond} and ${filters[0]}${filters.length > 2 ? ` and ${filters[2]}` : ''}`;
      shortCond = `${shortCond} and ${filters[1]}${filters.length > 3 ? ` and ${filters[3]}` : ''}`;
    }

    return { longCond, shortCond };
  }

  public static generateIndicatorVersion(strategy: any): string {
    const config = this.getStrategyConfig(strategy);
    const indicators = this.generateIndicatorCalculations(config);
    const { longCond, shortCond } = this.generateSignalLogic(config);

    return `
//@version=6
indicator("${config.name} — Indicator Version", shorttitle="${config.name}_IND", overlay=true)

// ------------------------------------------------------------
// DISCLAIMER (leave in place):
// Educational purposes only. Not financial advice.
// Trading involves risk. Past performance does not guarantee future results.
// ------------------------------------------------------------

//=== Inputs ===
// Trade direction
enableLongs = input.bool(true,  "Show Long Signals")
enableShorts= input.bool(true, "Show Short Signals")

// Optional date range
useStartDate = input.bool(false, "Use Start Date Filter")
startDate   = input.time(timestamp("2020-01-01 00:00"), "Start Date")
useEndDate  = input.bool(false, "Use End Date Filter")
endDate     = input.time(timestamp("2025-12-31 23:59"), "End Date")

// Date filter
dateFilter = (not useStartDate or time >= startDate) and (not useEndDate or time <= endDate)

${indicators}

//=== Signal Logic ===
// Primary signals based on: ${strategy.entry}
longSignal  = enableLongs and dateFilter and (${longCond})
shortSignal = enableShorts and dateFilter and (${shortCond})

//=== Plots ===
// Trend EMA
plot(emaTrend, "Trend EMA", color=color.new(color.blue, 0), linewidth=2)

${config.primarySignals.includes("vptCrossover") ? `
// VPT indicators
plot(vpt, "VPT", color=color.new(color.teal, 0))
plot(vptSig, "VPT Signal", color=color.new(color.orange, 0))
hline(0, "Zero", color=color.new(color.gray, 80))
` : ''}

${config.indicators.includes("BollingerBands") ? `
// Bollinger Bands
plot(bbUpper, "BB Upper", color=color.new(color.gray, 50))
plot(bbMiddle, "BB Middle", color=color.new(color.gray, 50))
plot(bbLower, "BB Lower", color=color.new(color.gray, 50))
` : ''}

// Signal shapes
plotshape(longSignal,  title="Long Signal",  style=shape.triangleup,   color=color.new(color.green,0),
          location=location.belowbar, size=size.small, text="LONG")
plotshape(shortSignal, title="Short Signal", style=shape.triangledown, color=color.new(color.red,0),
          location=location.abovebar, size=size.small, text="SHORT")

// Background highlighting
bgcolor(longSignal ? color.new(color.green, 95) : shortSignal ? color.new(color.red, 95) : na)

//=== Alerts ===
alertcondition(longSignal,  title="${config.name} Long",  message="${config.name} LONG: {{ticker}} {{interval}} — Entry conditions met")
alertcondition(shortSignal, title="${config.name} Short", message="${config.name} SHORT: {{ticker}} {{interval}} — Entry conditions met")

// Table for signal info
if barstate.islast
    var table infoTable = table.new(position.top_right, 2, 4, bgcolor=color.new(color.white, 80), border_width=1)
    table.cell(infoTable, 0, 0, "Strategy", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 1, 0, "${config.name}", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 0, 1, "Difficulty", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 1, 1, "${strategy.difficulty}", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 0, 2, "Success Rate", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 1, 2, "${strategy.successRate}", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 0, 3, "Risk:Reward", text_color=color.black, text_size=size.small)
    table.cell(infoTable, 1, 3, "${strategy.riskReward}", text_color=color.black, text_size=size.small)
`;
  }

  public static generateStrategyVersion(strategy: any): string {
    const config = this.getStrategyConfig(strategy);
    const indicators = this.generateIndicatorCalculations(config);
    const { longCond, shortCond } = this.generateSignalLogic(config);

    return `
//@version=6
strategy("${config.name} — Strategy Version",
     overlay=true,
     initial_capital=100000,
     default_qty_type=strategy.percent_of_equity,
     default_qty_value=1,
     commission_type=strategy.commission.percent,
     commission_value=0.0,
     calc_on_every_tick=false,
     calc_on_order_fills=true,
     pyramiding=0)

// ------------------------------------------------------------
// DISCLAIMER (leave in place):
// Educational purposes only. Not financial advice.
// Trading involves risk. Past performance does not guarantee future results.
// ------------------------------------------------------------

//=== Inputs ===
// Risk management
useATR      = input.bool(true, "Use ATR stops/targets?")
atrLen      = input.int(14,   "ATR Length",       minval=1)
atrSLmult   = input.float(1.5,"ATR Stop Mult",    minval=0.1, step=0.1)
atrTPmult   = input.float(3.0,"ATR TakeProfit Mult", minval=0.1, step=0.1)

slPct       = input.float(1.0,"Stop Loss % (if not ATR)",  minval=0.1, step=0.1)
tpPct       = input.float(3.5,"Take Profit % (if not ATR)",minval=0.1, step=0.1)

// Trade direction
enableLongs = input.bool(true,  "Enable Longs")
enableShorts= input.bool(true, "Enable Shorts")

// Optional date range
useStartDate = input.bool(false, "Use Start Date Filter")
startDate   = input.time(timestamp("2020-01-01 00:00"), "Start Date")
useEndDate  = input.bool(false, "Use End Date Filter")
endDate     = input.time(timestamp("2025-12-31 23:59"), "End Date")

// Date filter
dateFilter = (not useStartDate or time >= startDate) and (not useEndDate or time <= endDate)

//=== Helper: ATR ===
atr = ta.atr(atrLen)

${indicators}

//=== Entry Logic (strategy-specific + uniform filters) ===
// Based on: ${strategy.entry}
longCond  = enableLongs and dateFilter and (${longCond})
shortCond = enableShorts and dateFilter and (${shortCond})

//=== Order sizing and exits ===
longSL  = useATR ? close - atrSLmult * atr : close * (1 - slPct/100.0)
longTP  = useATR ? close + atrTPmult * atr : close * (1 + tpPct/100.0)
shortSL = useATR ? close + atrSLmult * atr : close * (1 + slPct/100.0)
shortTP = useATR ? close - atrTPmult * atr : close * (1 - tpPct/100.0)

//=== Entries & Exits (paired + opposite close) ===
if longCond
    if strategy.position_size < 0
        strategy.close("Short")
    strategy.entry("Long", strategy.long)
    strategy.exit("Exit Long", "Long", stop=longSL, limit=longTP)

if shortCond
    if strategy.position_size > 0
        strategy.close("Long")
    strategy.entry("Short", strategy.short)
    strategy.exit("Exit Short", "Short", stop=shortSL, limit=shortTP)

//=== Plots ===
// Trend EMA
plot(emaTrend, "Trend EMA", color=color.new(color.blue, 0), linewidth=2)

${config.primarySignals.includes("vptCrossover") ? `
// VPT indicators
plot(vpt, "VPT", color=color.new(color.teal, 0))
plot(vptSig, "VPT Signal", color=color.new(color.orange, 0))
hline(0, "Zero", color=color.new(color.gray, 80))
` : ''}

${config.indicators.includes("BollingerBands") ? `
// Bollinger Bands
plot(bbUpper, "BB Upper", color=color.new(color.gray, 50))
plot(bbMiddle, "BB Middle", color=color.new(color.gray, 50))
plot(bbLower, "BB Lower", color=color.new(color.gray, 50))
` : ''}

plotshape(longCond,  title="Long Signal",  style=shape.triangleup,   color=color.new(color.green,0),
          location=location.belowbar, size=size.tiny, text="LONG")
plotshape(shortCond, title="Short Signal", style=shape.triangledown, color=color.new(color.red,0),
          location=location.abovebar, size=size.tiny, text="SHORT")

bgcolor(strategy.position_size > 0 ? color.new(color.green, 92) :
       strategy.position_size < 0 ? color.new(color.red, 92) : na)

//=== Alerts ===
alertcondition(longCond,  title="${config.name} Long",  message="${config.name} LONG: {{ticker}} {{interval}} — Entry conditions met")
alertcondition(shortCond, title="${config.name} Short", message="${config.name} SHORT: {{ticker}} {{interval}} — Entry conditions met")

// Optional immediate alerts (off by default to avoid duplicates)
// if longCond
//     alert("${config.name} LONG", alert.freq_once_per_bar)
// if shortCond
//     alert("${config.name} SHORT", alert.freq_once_per_bar)
`;
  }

  public static generateReadme(strategy: any, variant: "indicator" | "strategy"): string {
    return `
# ${strategy.name} - Pine Script v6 ${variant.charAt(0).toUpperCase() + variant.slice(1)} Version

## Installation Instructions
1. Open TradingView and go to the Pine Editor
2. Delete the default code and paste the provided Pine Script
3. Click "Add to Chart" 
4. Configure the input parameters as needed
5. Set up alerts if desired (both variants support alertconditions)

## Strategy Details
- **Difficulty**: ${strategy.difficulty}
- **Risk:Reward**: ${strategy.riskReward}
- **Success Rate**: ${strategy.successRate}
- **Indicators**: ${strategy.indicators.join(', ')}
- **Timeframes**: ${strategy.timeframes.join(', ')}

## Entry Rules
${strategy.entry}

## Exit Rules
${strategy.exit}

## ${variant === "strategy" ? "Strategy" : "Indicator"} Features
${variant === "strategy" ? `
- **Backtesting**: Full strategy with automated entries and exits
- **Risk Management**: ATR-based or percentage-based stops/targets
- **Position Management**: Automatic opposite-close (no overlapping positions)
- **Date Filtering**: Optional start/end date range for backtesting
- **Alerts**: Real-time trading alerts via alertcondition()
` : `
- **Signal Detection**: Visual signals with arrows and background highlighting
- **Clean Interface**: No trade execution, pure signal indication
- **Alerts**: Real-time alerts for entry conditions via alertcondition()
- **Information Table**: Strategy stats displayed on chart
- **Date Filtering**: Optional date range for signal display
`}

## Uniform Engine Features
This script follows the uniform Pine v6 engine with:
- **Trend Filter**: EMA-based trend agreement (configurable)
- **Volume Filter**: Volume above MA confirmation (optional)
- **Consistent Risk Management**: ATR or percentage-based stops/targets
- **No Overlapping Positions**: Strategy variant closes opposite before new entry
- **Alert System**: Standardized alert messages with ticker and timeframe
- **Date Range Support**: Optional backtesting date ranges

## Important Notes
- This is a working ${variant} with actual indicator calculations
- Test thoroughly on historical data before live trading
- Always use proper risk management
- Adjust parameters based on your risk tolerance and market conditions
${variant === "strategy" ? "- Backtest results are hypothetical and don't guarantee future performance" : "- Use this indicator alongside proper risk management for live trading decisions"}

## Support
For questions or issues, refer to the TradingView Pine Script documentation or community forums.
`;
  }

  public static generateDisclaimer(): string {
    return `
IMPORTANT DISCLAIMER - READ CAREFULLY

EDUCATIONAL USE ONLY
This Pine Script code and related materials are provided for educational purposes only and do not constitute financial advice, investment advice, trading advice, or any other sort of advice.

TRADING RISKS
Trading and investing in financial markets involves substantial risk of loss and is not suitable for every investor. Past performance does not guarantee future results. The value of investments may go down as well as up.

NO FINANCIAL ADVICE
The creator(s) of this script are not licensed financial advisors, investment advisors, or registered investment advisors. Nothing in this script or related materials should be construed as financial advice.

NO WARRANTIES
This code is provided "as is" without any warranties, express or implied. The creators make no representations about the accuracy, completeness, or reliability of the script.

USE AT YOUR OWN RISK
You acknowledge that you are using this script entirely at your own risk. Any trading decisions you make are solely your responsibility.

HYPOTHETICAL RESULTS
Any backtesting results shown are hypothetical and do not represent actual trading. Hypothetical trading programs in general are designed with the benefit of hindsight and may not reflect the impact of material economic and market factors.

LIABILITY LIMITATION
In no event shall the creators be liable for any direct, indirect, incidental, special, or consequential damages arising out of the use of this script.

COMPLIANCE
Ensure that your use of this script complies with all applicable laws and regulations in your jurisdiction.

By using this script, you acknowledge that you have read, understood, and agree to this disclaimer.

Last Updated: ${new Date().toLocaleDateString()}
`;
  }
}