export class ProfessionalPineScriptEngine {
  
  public static generateStrategyFromIndicators(strategy: any): string {
    const name = strategy.name || 'Professional Custom Strategy';
    const indicators = strategy.answers?.style?.indicators || [];
    const conditions = strategy.answers?.style?.conditions || [];
    const riskSettings = strategy.answers?.risk || {};
    const initialCapital = riskSettings.accountPrinciple || 100000;

    // Generate indicator declarations
    const generateIndicatorCode = (indicator: any): string => {
      const params = Object.entries(indicator.parameters || {})
        .map(([key, value]) => value)
        .join(', ');

      switch (indicator.type) {
        case 'ema':
          return `${indicator.id} = ta.ema(close, ${indicator.parameters.length || 20})`;
        
        case 'sma':
          return `${indicator.id} = ta.sma(close, ${indicator.parameters.length || 20})`;
        
        case 'rsi':
          return `${indicator.id} = ta.rsi(close, ${indicator.parameters.length || 14})`;
        
        case 'macd':
          const fast = indicator.parameters.fastLength || 12;
          const slow = indicator.parameters.slowLength || 26;
          const signal = indicator.parameters.signalLength || 9;
          return `[${indicator.id}_line, ${indicator.id}_signal, ${indicator.id}_histogram] = ta.macd(close, ${fast}, ${slow}, ${signal})`;
        
        case 'bollinger_bands':
          const length = indicator.parameters.length || 20;
          const stdDev = indicator.parameters.stdDev || 2.0;
          return `[${indicator.id}_upper, ${indicator.id}_middle, ${indicator.id}_lower] = ta.bb(close, ${length}, ${stdDev})`;
        
        case 'atr':
          return `${indicator.id} = ta.atr(${indicator.parameters.length || 14})`;
        
        case 'stoch':
          const k = indicator.parameters.kPeriod || 14;
          const d = indicator.parameters.dPeriod || 3;
          const smooth = indicator.parameters.smooth || 3;
          return `[${indicator.id}_k, ${indicator.id}_d] = ta.stoch(close, high, low, ${k})`;
        
        default:
          return `// Unknown indicator type: ${indicator.type}`;
      }
    };

    // Generate condition logic
    const generateConditionCode = (condition: any, indicators: any[]): string => {
      const leftInd = indicators.find(i => i.id === condition.leftIndicator);
      const rightInd = indicators.find(i => i.id === condition.rightIndicator);
      
      if (!leftInd || !rightInd) return 'false';

      let leftValue = condition.leftIndicator;
      let rightValue = condition.rightIndicator;

      // Handle special indicator outputs
      if (leftInd.type === 'macd') leftValue = `${condition.leftIndicator}_line`;
      if (rightInd.type === 'macd') rightValue = `${condition.rightIndicator}_line`;
      if (leftInd.type === 'bollinger_bands') leftValue = `${condition.leftIndicator}_middle`;
      if (rightInd.type === 'bollinger_bands') rightValue = `${condition.rightIndicator}_middle`;
      if (leftInd.type === 'stoch') leftValue = `${condition.leftIndicator}_k`;
      if (rightInd.type === 'stoch') rightValue = `${condition.rightIndicator}_k`;

      switch (condition.operator) {
        case 'crosses_above':
          return `ta.crossover(${leftValue}, ${rightValue})`;
        case 'crosses_below':
          return `ta.crossunder(${leftValue}, ${rightValue})`;
        case 'greater_than':
          return `${leftValue} > ${rightValue}`;
        case 'less_than':
          return `${leftValue} < ${rightValue}`;
        case 'equals':
          return `math.abs(${leftValue} - ${rightValue}) < 0.0001`;
        default:
          return 'false';
      }
    };

    // Group conditions by type and direction
    const longEntryConditions = conditions.filter((c: any) => c.type === 'entry' && c.direction === 'long' && c.enabled);
    const shortEntryConditions = conditions.filter((c: any) => c.type === 'entry' && c.direction === 'short' && c.enabled);
    const longExitConditions = conditions.filter((c: any) => c.type === 'exit' && c.direction === 'long' && c.enabled);
    const shortExitConditions = conditions.filter((c: any) => c.type === 'exit' && c.direction === 'short' && c.enabled);

    const generateConditionGroup = (conditionGroup: any[], operation = 'and'): string => {
      if (conditionGroup.length === 0) return 'false';
      const conditions = conditionGroup.map(c => generateConditionCode(c, indicators));
      return conditions.join(` ${operation} `);
    };

    // Generate indicator plots
    const generatePlots = (): string => {
      return indicators.map((indicator: any) => {
        switch (indicator.type) {
          case 'ema':
          case 'sma':
            return `plot(${indicator.id}, title="${indicator.name}", color=color.blue, linewidth=2)`;
          
          case 'rsi':
            return `hline(70, title="RSI Overbought", color=color.red, linestyle=hline.style_dashed)
hline(30, title="RSI Oversold", color=color.green, linestyle=hline.style_dashed)
plot(${indicator.id}, title="${indicator.name}", color=color.purple)`;
          
          case 'macd':
            return `plot(${indicator.id}_line, title="MACD Line", color=color.blue)
plot(${indicator.id}_signal, title="MACD Signal", color=color.red)
plot(${indicator.id}_histogram, title="MACD Histogram", color=color.gray, style=plot.style_histogram)`;
          
          case 'bollinger_bands':
            return `plot(${indicator.id}_upper, title="BB Upper", color=color.red)
plot(${indicator.id}_middle, title="BB Middle", color=color.orange)
plot(${indicator.id}_lower, title="BB Lower", color=color.green)`;
          
          case 'stoch':
            return `hline(80, title="Stoch Overbought", color=color.red, linestyle=hline.style_dashed)
hline(20, title="Stoch Oversold", color=color.green, linestyle=hline.style_dashed)
plot(${indicator.id}_k, title="Stoch K", color=color.blue)
plot(${indicator.id}_d, title="Stoch D", color=color.red)`;
          
          default:
            return `// Plot for ${indicator.name}`;
        }
      }).join('\n');
    };

    return `//@version=5
strategy("${name}", overlay=true, initial_capital=${initialCapital}, pyramiding=0,
         commission_type=strategy.commission.percent, commission_value=0.0,
         process_orders_on_close=true)

// === PROFESSIONAL EA/PINE SCRIPT BUILDER ===
// Generated with ${indicators.length} custom indicators and ${conditions.length} trading conditions
// Builder Version: Professional v2.0

// === Risk Management Inputs ===
risk_per_trade = input.float(${riskSettings.riskPerTrade || 2.0}, title="Risk Per Trade (%)", minval=0.1, maxval=10.0, step=0.1)
tp_ratio = input.float(2.0, title="Take Profit Ratio", minval=0.5, maxval=10.0, step=0.1)
max_trades_day = input.int(5, title="Max Trades Per Day", minval=0, maxval=100, step=1)
use_long = input.bool(true, title="Enable Long Trades")
use_short = input.bool(true, title="Enable Short Trades")

// === Session Filter ===
trade_start = input.int(0, title="Trade Start Time", minval=0, maxval=2359)
trade_end = input.int(2359, title="Trade End Time", minval=0, maxval=2359)

sess_ok(tstart, tend) =>
    t = timenow
    hh = hour
    mm = minute
    cur = hh * 100 + mm
    (tstart <= tend) ? (cur >= tstart and cur <= tend) : (cur >= tstart or cur <= tend)

in_session = sess_ok(trade_start, trade_end)

// === Custom Indicators ===
${indicators.map(generateIndicatorCode).join('\n')}

// ATR for position sizing
atr_value = ta.atr(14)

// === Trading Conditions ===
// Long Entry Conditions
long_entry = ${longEntryConditions.length > 0 ? generateConditionGroup(longEntryConditions) : 'false'}

// Short Entry Conditions  
short_entry = ${shortEntryConditions.length > 0 ? generateConditionGroup(shortEntryConditions) : 'false'}

// Exit Conditions (optional - will use TP/SL if not specified)
long_exit = ${longExitConditions.length > 0 ? generateConditionGroup(longExitConditions) : 'false'}
short_exit = ${shortExitConditions.length > 0 ? generateConditionGroup(shortExitConditions) : 'false'}

// === Position Sizing ===
risk_cash = strategy.equity * (risk_per_trade / 100.0)
stop_distance = atr_value * 2.0  // ATR-based stop loss
position_size = risk_cash / stop_distance

// === Trade Management ===
var trades_today = 0
if ta.change(time("D"))
    trades_today := 0

can_trade = (max_trades_day == 0) or (trades_today < max_trades_day)
newbar = ta.change(time)

// === Entry Logic ===
if use_long and long_entry and in_session and can_trade and newbar and strategy.position_size == 0
    strategy.entry("Long", strategy.long, qty=position_size)
    strategy.exit("Long Exit", from_entry="Long", 
                  stop=close - stop_distance, 
                  limit=close + (stop_distance * tp_ratio))
    trades_today += 1

if use_short and short_entry and in_session and can_trade and newbar and strategy.position_size == 0
    strategy.entry("Short", strategy.short, qty=position_size)
    strategy.exit("Short Exit", from_entry="Short", 
                  stop=close + stop_distance, 
                  limit=close - (stop_distance * tp_ratio))
    trades_today += 1

// === Exit Logic (if custom exit conditions are defined) ===
if long_exit and strategy.position_size > 0
    strategy.close("Long", comment="Custom Exit")

if short_exit and strategy.position_size < 0
    strategy.close("Short", comment="Custom Exit")

// === Indicator Plots ===
${generatePlots()}

// === Strategy Info ===
// Indicators: ${indicators.map((i: any) => i.name).join(', ')}
// Conditions: ${conditions.length} trading rules configured
// Risk Management: ${riskSettings.riskPerTrade || 2}% per trade with ${riskSettings.maxDrawdown || 10}% max drawdown

// === PROFESSIONAL DISCLAIMER ===
// This strategy was generated using a professional EA/Pine Script builder
// EDUCATIONAL USE ONLY - Not financial advice
// Always backtest thoroughly before live trading
// Past performance does not guarantee future results`;
  }

  public static generateReadme(strategy: any): string {
    const name = strategy.name || 'Professional Custom Strategy';
    const indicators = strategy.answers?.style?.indicators || [];
    const conditions = strategy.answers?.style?.conditions || [];
    const riskSettings = strategy.answers?.risk || {};

    const indicatorList = indicators.map((ind: any) => `- ${ind.name}`).join('\n');
    const conditionList = conditions.map((cond: any, index: number) => 
      `${index + 1}. ${cond.type.toUpperCase()} ${cond.direction.toUpperCase()}: When ${indicators.find((i: any) => i.id === cond.leftIndicator)?.name || 'Indicator'} ${cond.operator.replace('_', ' ')} ${indicators.find((i: any) => i.id === cond.rightIndicator)?.name || 'Indicator'}`
    ).join('\n');

    return `# ${name} - Professional Pine Script Strategy

## Overview
This professional-grade Pine Script strategy was generated using the EA/Pine Script Builder with custom indicator configurations and trading conditions.

## Strategy Configuration

### Technical Indicators (${indicators.length})
${indicatorList || 'No indicators configured'}

### Trading Conditions (${conditions.length})
${conditionList || 'No conditions configured'}

### Risk Management
- **Risk Per Trade**: ${riskSettings.riskPerTrade || 2}% of account equity
- **Maximum Drawdown**: ${riskSettings.maxDrawdown || 10}%
- **Initial Capital**: $${riskSettings.accountPrinciple || 100000}
- **Position Sizing**: ATR-based with percentage risk model

## Professional Features
- **Multi-Indicator Support**: Combines multiple technical indicators seamlessly
- **Advanced Condition Logic**: Supports crossover, comparison, and threshold conditions
- **Session Filtering**: Trade only during specified market hours
- **Daily Trade Limits**: Prevents overtrading with configurable limits
- **Professional Risk Management**: ATR-based stops with configurable risk-reward ratios
- **Real-time Plotting**: All indicators plotted with professional styling

## Installation Instructions
1. Open TradingView and navigate to Pine Script Editor
2. Copy and paste the generated Pine Script code
3. Click "Add to Chart" to apply the strategy
4. Configure parameters in the strategy settings panel
5. Backtest thoroughly before live trading

## Important Notes
- **Educational Purpose Only**: This strategy is for educational and research purposes
- **Not Financial Advice**: Always conduct your own analysis before trading
- **Risk Warning**: Trading involves substantial risk of loss
- **Backtesting Required**: Always backtest strategies before live implementation
- **Start Small**: Begin with small position sizes when transitioning to live trading

## Customization
All indicator parameters can be adjusted in the strategy inputs panel:
- Modify indicator periods and settings
- Adjust risk management parameters
- Configure session times
- Set trade limits and filters

## Support
This strategy was generated using professional-grade algorithms and best practices. For questions about strategy logic or customization, refer to Pine Script documentation or trading communities.

---

**Disclaimer**: Past performance does not guarantee future results. Trading involves risk and may not be suitable for all investors. Always use proper risk management and never risk more than you can afford to lose.`;
  }
}