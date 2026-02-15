/**
 * ============================================
 * PLAYBOOK EXPORT UTILITIES
 * ============================================
 * 
 * Utilities for generating executable code from PlaybookAST
 * with strict single-timeframe enforcement and NoMTF assertions.
 */

import { 
  PlaybookAST, 
  PlaybookTimeframe,
  getMTTimeframe, 
  getPineTimeframe,
  VALID_TIMEFRAMES,
  assertNoMTF 
} from '@/types/PlaybookAST';

// ============================================
// NO-MTF LINT CHECKS
// ============================================

/**
 * Scans Pine Script output for MTF constructs
 * Fails if request.security() or similar is found
 */
export function lintPineForMTF(pineCode: string): { 
  valid: boolean; 
  violations: string[] 
} {
  const violations: string[] = [];
  
  // Check for request.security (MTF function)
  if (/request\.security\s*\(/i.test(pineCode)) {
    violations.push('request.security() detected - MTF not allowed in v1 exports');
  }
  
  // Check for request.security_lower_tf
  if (/request\.security_lower_tf\s*\(/i.test(pineCode)) {
    violations.push('request.security_lower_tf() detected - MTF not allowed');
  }
  
  // Check for timeframe parameter overrides
  if (/timeframe\s*=\s*["'][^"']+["']/i.test(pineCode) && 
      !/timeframe\.period/i.test(pineCode)) {
    violations.push('Hardcoded timeframe parameter detected - use chart timeframe only');
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Scans MT4/MT5 output for MTF constructs
 */
export function lintMQLForMTF(mqlCode: string): { 
  valid: boolean; 
  violations: string[] 
} {
  const violations: string[] = [];
  
  // Check for iTime/iClose/etc with non-current timeframe
  const mtfFunctions = ['iTime', 'iOpen', 'iHigh', 'iLow', 'iClose', 'iVolume', 'iMA', 'iRSI', 'iMACD'];
  for (const fn of mtfFunctions) {
    // Pattern: iMA(Symbol(), PERIOD_H4, ...) where not PERIOD_CURRENT and not Symbol()
    const pattern = new RegExp(`${fn}\\s*\\([^)]*,\\s*(PERIOD_[A-Z0-9]+)`, 'gi');
    let match;
    while ((match = pattern.exec(mqlCode)) !== null) {
      const period = match[1];
      // Allow if it matches expected timeframe or is PERIOD_CURRENT
      if (period !== 'PERIOD_CURRENT' && !mqlCode.includes(`const int StrategyTimeframe = ${period}`)) {
        // This might be a different TF - flag for review
        // Note: We allow if it matches StrategyTimeframe constant
      }
    }
  }
  
  // Check for explicit iTime on different period
  if (/iTime\s*\([^,]+,\s*PERIOD_(?!CURRENT)(?!D1)[A-Z0-9]+/i.test(mqlCode) && 
      !/const int StrategyTimeframe/i.test(mqlCode)) {
    violations.push('iTime with non-strategy timeframe detected');
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

// ============================================
// PINE SCRIPT V6 GENERATOR (Single-TF)
// ============================================

export function generatePineScriptV6(playbook: PlaybookAST): string {
  // Validate no MTF in playbook
  assertNoMTF(playbook);
  
  const pineTimeframe = getPineTimeframe(playbook);
  const indicatorCode = generatePineIndicators(playbook);
  const conditionCode = generatePineConditions(playbook);
  const riskCode = generatePineRiskManagement(playbook);
  
  const code = `// @version=5
// ============================================
// ${playbook.name.toUpperCase()}
// Single-Timeframe Playbook (v1)
// ============================================
// 
// TIMEFRAME: ${playbook.timeframe}
// FILL MODEL: Signal on bar close, entry on next bar open
// 
// IMPORTANT: Apply this strategy to a chart with timeframe = ${playbook.timeframe}
// No request.security() is used - single-timeframe execution only.
// 
// Generated: ${new Date().toISOString()}
// ============================================

strategy("${playbook.name}", overlay=true, 
         initial_capital=100000, 
         pyramiding=0,
         process_orders_on_close=false,  // Orders execute on next bar open
         calc_on_every_tick=false,       // Bar-close evaluation only
         commission_type=strategy.commission.percent, 
         commission_value=${playbook.execution.commissionPerLot || 0},
         slippage=${playbook.execution.slippagePoints || 0})

// === TIMEFRAME ASSERTION ===
// This strategy is designed for ${playbook.timeframe} timeframe
// Using on different timeframe may produce different results
var string EXPECTED_TF = "${pineTimeframe}"

// === RISK INPUTS ===
i_riskPercent = input.float(${playbook.positionSizing.riskPerTrade}, "Risk Per Trade %", minval=0.1, maxval=10)
i_maxPositions = input.int(${playbook.positionSizing.maxPositions}, "Max Positions", minval=1, maxval=10)
${playbook.positionSizing.maxDailyLoss ? `i_maxDailyLoss = input.float(${playbook.positionSizing.maxDailyLoss}, "Max Daily Loss %", minval=1, maxval=50)` : '// Max daily loss: disabled'}
${playbook.positionSizing.maxDrawdown ? `i_maxDrawdown = input.float(${playbook.positionSizing.maxDrawdown}, "Max Drawdown %", minval=1, maxval=50)` : '// Max drawdown: disabled'}

// === INDICATORS (all computed on current chart timeframe) ===
${indicatorCode}

// ATR for position sizing and stops
atr_value = ta.atr(14)

// === ENTRY CONDITIONS (evaluated on bar close) ===
${conditionCode}

// === POSITION SIZING ===
risk_amount = strategy.equity * (i_riskPercent / 100.0)
stop_distance = atr_value * ${playbook.risk.stopLoss.type === 'atr' ? playbook.risk.stopLoss.atrMultiplier || 2 : 2}
position_size = risk_amount / stop_distance

// === RISK MANAGEMENT ===
${riskCode}

// === EXECUTION LOGIC (bar-close signals, next-bar fills) ===
// barstate.isconfirmed ensures we only evaluate on closed bars
if barstate.isconfirmed
    // Long Entry
    if long_entry_condition and strategy.position_size == 0 and can_trade
        strategy.entry("Long", strategy.long, qty=position_size)
        strategy.exit("Long Exit", from_entry="Long", 
                      stop=close - stop_distance, 
                      limit=close + (stop_distance * ${playbook.risk.takeProfit.value / playbook.risk.stopLoss.value}))
    
    // Short Entry (if enabled)
    ${playbook.entryConditions.short && playbook.entryConditions.short.length > 0 ? `
    if short_entry_condition and strategy.position_size == 0 and can_trade
        strategy.entry("Short", strategy.short, qty=position_size)
        strategy.exit("Short Exit", from_entry="Short", 
                      stop=close + stop_distance, 
                      limit=close - (stop_distance * ${playbook.risk.takeProfit.value / playbook.risk.stopLoss.value}))` : '// Short entries disabled'}
    
    // Exit conditions (if custom exits defined)
    if long_exit_condition and strategy.position_size > 0
        strategy.close("Long", comment="Exit Signal")
    
    if short_exit_condition and strategy.position_size < 0
        strategy.close("Short", comment="Exit Signal")

// === VISUAL PLOTS ===
plotshape(long_entry_condition and barstate.isconfirmed, title="Long Signal", 
          location=location.belowbar, color=color.green, style=shape.triangleup, size=size.small)
${playbook.entryConditions.short && playbook.entryConditions.short.length > 0 ? 
  `plotshape(short_entry_condition and barstate.isconfirmed, title="Short Signal", 
          location=location.abovebar, color=color.red, style=shape.triangledown, size=size.small)` : ''}

// ============================================
// PLAYBOOK PARITY NOTES
// ============================================
// 
// FILL MODEL: 
// - Signals computed on bar close (barstate.isconfirmed)
// - Orders filled at next bar open (process_orders_on_close=false)
// - This matches backtest engine behavior
//
// SINGLE-TIMEFRAME:
// - No request.security() used
// - All indicators computed on chart timeframe
// - Apply to ${playbook.timeframe} chart for parity with backtest
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;

  // Lint the output for MTF violations
  const lintResult = lintPineForMTF(code);
  if (!lintResult.valid) {
    throw new Error(
      `Pine Script MTF lint failed:\n${lintResult.violations.join('\n')}`
    );
  }
  
  return code;
}

function generatePineIndicators(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) {
    return '// No custom indicators defined';
  }
  
  return playbook.indicators.map(ind => {
    switch (ind.type) {
      case 'ema':
        return `${ind.id} = ta.ema(close, ${ind.parameters.length || 20})`;
      case 'sma':
        return `${ind.id} = ta.sma(close, ${ind.parameters.length || 20})`;
      case 'rsi':
        return `${ind.id} = ta.rsi(close, ${ind.parameters.length || 14})`;
      case 'macd':
        return `[${ind.id}_line, ${ind.id}_signal, ${ind.id}_hist] = ta.macd(close, ${ind.parameters.fast || 12}, ${ind.parameters.slow || 26}, ${ind.parameters.signal || 9})`;
      case 'bollinger_bands':
        return `[${ind.id}_mid, ${ind.id}_upper, ${ind.id}_lower] = ta.bb(close, ${ind.parameters.length || 20}, ${ind.parameters.stdDev || 2})`;
      case 'atr':
        return `${ind.id} = ta.atr(${ind.parameters.length || 14})`;
      case 'stoch':
        return `${ind.id}_k = ta.stoch(close, high, low, ${ind.parameters.k || 14})\n${ind.id}_d = ta.sma(${ind.id}_k, ${ind.parameters.d || 3})`;
      default:
        return `// Unknown indicator: ${ind.type}`;
    }
  }).join('\n');
}

function generatePineConditions(playbook: PlaybookAST): string {
  const longConds = playbook.entryConditions.long.length > 0 
    ? playbook.entryConditions.long.map(c => conditionToPine(c)).join(` ${playbook.entryConditions.logic === 'and' ? 'and' : 'or'} `)
    : 'false';
    
  const shortConds = playbook.entryConditions.short && playbook.entryConditions.short.length > 0
    ? playbook.entryConditions.short.map(c => conditionToPine(c)).join(` ${playbook.entryConditions.logic === 'and' ? 'and' : 'or'} `)
    : 'false';
    
  const longExitConds = playbook.exitConditions?.long && playbook.exitConditions.long.length > 0
    ? playbook.exitConditions.long.map(c => conditionToPine(c)).join(' or ')
    : 'false';
    
  const shortExitConds = playbook.exitConditions?.short && playbook.exitConditions.short.length > 0
    ? playbook.exitConditions.short.map(c => conditionToPine(c)).join(' or ')
    : 'false';
    
  return `long_entry_condition = ${longConds}
short_entry_condition = ${shortConds}
long_exit_condition = ${longExitConds}
short_exit_condition = ${shortExitConds}`;
}

function conditionToPine(condition: any): string {
  const lhs = condition.lhs?.indicator || 'close';
  const op = condition.operator;
  const rhs = condition.rhs?.indicator || condition.rhs?.value || '0';
  
  switch (op) {
    case 'crosses_above': return `ta.crossover(${lhs}, ${rhs})`;
    case 'crosses_below': return `ta.crossunder(${lhs}, ${rhs})`;
    case 'greater_than': 
    case 'above': return `${lhs} > ${rhs}`;
    case 'less_than':
    case 'below': return `${lhs} < ${rhs}`;
    case 'equals': return `math.abs(${lhs} - ${rhs}) < 0.0001`;
    default: return 'true';
  }
}

function generatePineRiskManagement(playbook: PlaybookAST): string {
  const lines: string[] = [];
  
  // Max daily loss kill switch
  if (playbook.positionSizing.maxDailyLoss) {
    lines.push(`
// Daily loss kill switch
var float daily_start_equity = strategy.initial_capital
if ta.change(time("D"))
    daily_start_equity := strategy.equity

daily_loss_pct = ((daily_start_equity - strategy.equity) / daily_start_equity) * 100
daily_loss_exceeded = daily_loss_pct >= i_maxDailyLoss`);
  } else {
    lines.push('daily_loss_exceeded = false');
  }
  
  // Max drawdown kill switch
  if (playbook.positionSizing.maxDrawdown) {
    lines.push(`
// Drawdown kill switch
var float peak_equity = strategy.initial_capital
peak_equity := math.max(peak_equity, strategy.equity)
current_drawdown = ((peak_equity - strategy.equity) / peak_equity) * 100
drawdown_exceeded = current_drawdown >= i_maxDrawdown`);
  } else {
    lines.push('drawdown_exceeded = false');
  }
  
  lines.push(`
// Trade permission
can_trade = not daily_loss_exceeded and not drawdown_exceeded`);
  
  return lines.join('\n');
}

// ============================================
// MQL CONDITION HELPERS
// ============================================

function conditionToMT4(condition: any): string {
  const lhs = mqlIndicatorRef(condition.lhs, 'mt4');
  const rhs = condition.rhs?.value !== undefined 
    ? String(condition.rhs.value) 
    : mqlIndicatorRef(condition.rhs, 'mt4');
  
  switch (condition.operator) {
    case 'crosses_above':
      return `(${lhs.replace(',1)', ',1)')} > ${rhs.replace(',1)', ',1)')} && ${lhs.replace(',1)', ',2)')} <= ${rhs.replace(',1)', ',2)')})`;
    case 'crosses_below':
      return `(${lhs.replace(',1)', ',1)')} < ${rhs.replace(',1)', ',1)')} && ${lhs.replace(',1)', ',2)')} >= ${rhs.replace(',1)', ',2)')})`;
    case 'greater_than':
    case 'above':
      return `(${lhs} > ${rhs})`;
    case 'less_than':
    case 'below':
      return `(${lhs} < ${rhs})`;
    case 'equals':
      return `(MathAbs(${lhs} - ${rhs}) < 0.0001)`;
    default:
      return 'true';
  }
}

function conditionToMT5(condition: any): string {
  const lhs = mqlIndicatorRef(condition.lhs, 'mt5');
  const rhs = condition.rhs?.value !== undefined 
    ? String(condition.rhs.value) 
    : mqlIndicatorRef(condition.rhs, 'mt5');
  
  switch (condition.operator) {
    case 'crosses_above':
      return `(${lhs.replace('[0]', '[0]')} > ${rhs.replace('[0]', '[0]')} && ${lhs.replace('[0]', '[1]')} <= ${rhs.replace('[0]', '[1]')})`;
    case 'crosses_below':
      return `(${lhs.replace('[0]', '[0]')} < ${rhs.replace('[0]', '[0]')} && ${lhs.replace('[0]', '[1]')} >= ${rhs.replace('[0]', '[1]')})`;
    case 'greater_than':
    case 'above':
      return `(${lhs} > ${rhs})`;
    case 'less_than':
    case 'below':
      return `(${lhs} < ${rhs})`;
    case 'equals':
      return `(MathAbs(${lhs} - ${rhs}) < 0.0001)`;
    default:
      return 'true';
  }
}

function mqlIndicatorRef(ref: any, platform: 'mt4' | 'mt5'): string {
  if (!ref || !ref.indicator) return 'Close[1]';
  
  const id = ref.indicator;
  
  // If it's a raw value
  if (typeof id === 'number') return String(id);
  
  // Common indicator patterns
  if (id === 'close') return platform === 'mt4' ? 'Close[1]' : 'close_buf[0]';
  if (id === 'open') return platform === 'mt4' ? 'Open[1]' : 'open_buf[0]';
  if (id === 'high') return platform === 'mt4' ? 'High[1]' : 'high_buf[0]';
  if (id === 'low') return platform === 'mt4' ? 'Low[1]' : 'low_buf[0]';
  
  // Return as-is for indicator IDs that will be resolved
  if (platform === 'mt4') return `${id}_val`;
  return `${id}_buf[0]`;
}

function generateMT4Indicators(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) return '   // No custom indicators';
  
  return playbook.indicators.map(ind => {
    switch (ind.type) {
      case 'ema':
        return `   double ${ind.id}_val = iMA(Symbol(), 0, ${ind.parameters.length || 20}, 0, MODE_EMA, PRICE_CLOSE, 1);`;
      case 'sma':
        return `   double ${ind.id}_val = iMA(Symbol(), 0, ${ind.parameters.length || 20}, 0, MODE_SMA, PRICE_CLOSE, 1);`;
      case 'rsi':
        return `   double ${ind.id}_val = iRSI(Symbol(), 0, ${ind.parameters.length || 14}, PRICE_CLOSE, 1);`;
      case 'macd':
        return `   double ${ind.id}_line_val = iMACD(Symbol(), 0, ${ind.parameters.fast || 12}, ${ind.parameters.slow || 26}, ${ind.parameters.signal || 9}, PRICE_CLOSE, MODE_MAIN, 1);\n   double ${ind.id}_signal_val = iMACD(Symbol(), 0, ${ind.parameters.fast || 12}, ${ind.parameters.slow || 26}, ${ind.parameters.signal || 9}, PRICE_CLOSE, MODE_SIGNAL, 1);\n   double ${ind.id}_hist_val = ${ind.id}_line_val - ${ind.id}_signal_val;`;
      case 'bollinger_bands':
        return `   double ${ind.id}_upper_val = iBands(Symbol(), 0, ${ind.parameters.length || 20}, ${ind.parameters.stdDev || 2}, 0, PRICE_CLOSE, MODE_UPPER, 1);\n   double ${ind.id}_lower_val = iBands(Symbol(), 0, ${ind.parameters.length || 20}, ${ind.parameters.stdDev || 2}, 0, PRICE_CLOSE, MODE_LOWER, 1);\n   double ${ind.id}_mid_val = iBands(Symbol(), 0, ${ind.parameters.length || 20}, ${ind.parameters.stdDev || 2}, 0, PRICE_CLOSE, MODE_MAIN, 1);`;
      case 'atr':
        return `   double ${ind.id}_val = iATR(Symbol(), 0, ${ind.parameters.length || 14}, 1);`;
      case 'stoch':
        return `   double ${ind.id}_k_val = iStochastic(Symbol(), 0, ${ind.parameters.k || 14}, ${ind.parameters.d || 3}, 3, MODE_SMA, 0, MODE_MAIN, 1);\n   double ${ind.id}_d_val = iStochastic(Symbol(), 0, ${ind.parameters.k || 14}, ${ind.parameters.d || 3}, 3, MODE_SMA, 0, MODE_SIGNAL, 1);`;
      default:
        return `   // Unknown indicator: ${ind.type}`;
    }
  }).join('\n');
}

function generateMT4Conditions(playbook: PlaybookAST): string {
  const longConds = playbook.entryConditions.long.length > 0
    ? playbook.entryConditions.long.map(c => conditionToMT4(c)).join(playbook.entryConditions.logic === 'and' ? ' && ' : ' || ')
    : 'false';
  
  const shortConds = playbook.entryConditions.short && playbook.entryConditions.short.length > 0
    ? playbook.entryConditions.short.map(c => conditionToMT4(c)).join(playbook.entryConditions.logic === 'and' ? ' && ' : ' || ')
    : 'false';
  
  return `   bool longSignal = ${longConds};
   bool shortSignal = ${shortConds};`;
}

// ============================================
// MT4 EA GENERATOR (Single-TF)
// ============================================

export function generateMT4EA(playbook: PlaybookAST): string {
  assertNoMTF(playbook);
  
  const mtTimeframe = getMTTimeframe(playbook);
  const indicatorCode = generateMT4Indicators(playbook);
  const conditionCode = generateMT4Conditions(playbook);
  const slMult = playbook.risk.stopLoss.type === 'atr' ? (playbook.risk.stopLoss.value || 2) : 2;
  const tpMult = playbook.risk.takeProfit.type === 'atr' ? (playbook.risk.takeProfit.value || 4) : (slMult * (playbook.risk.takeProfit.value / playbook.risk.stopLoss.value));
  
  const code = `//+------------------------------------------------------------------+
//|                            ${playbook.name.replace(/[^a-zA-Z0-9]/g, '_')}.mq4 |
//|                      Single-Timeframe Playbook EA (v1)            |
//+------------------------------------------------------------------+
#property copyright "ChartingPath Playbook Generator"
#property link      ""
#property version   "1.00"
#property strict

// ============================================
// PLAYBOOK: ${playbook.name}
// TIMEFRAME: ${playbook.timeframe} (${mtTimeframe})
// FILL MODEL: Signal on bar close, entry on next bar open
// ============================================

// === EXPECTED TIMEFRAME ===
const int StrategyTimeframe = ${mtTimeframe};

// === INPUTS ===
extern double RiskPerTrade = ${playbook.positionSizing.riskPerTrade};      // Risk per trade (%)
extern int    MaxPositions = ${playbook.positionSizing.maxPositions};       // Max concurrent positions
extern double MaxDailyLoss = ${playbook.positionSizing.maxDailyLoss || 0}; // Max daily loss % (0=disabled)
extern double MaxDrawdown  = ${playbook.positionSizing.maxDrawdown || 0};  // Max drawdown % (0=disabled)
extern double SL_ATR_Mult  = ${slMult};                                    // SL ATR multiplier
extern double TP_ATR_Mult  = ${tpMult};                                    // TP ATR multiplier
extern int    MaxSpreadPts = 30;                                            // Max spread in points (0=disabled)
extern int    Slippage     = ${playbook.execution.slippagePoints || 3};     // Slippage in points
extern int    MagicNumber  = ${Math.floor(Math.random() * 900000) + 100000};

// === STATE VARIABLES ===
datetime lastBarTime       = 0;
double   accountPeak       = 0;
double   dailyStartBalance = 0;
int      lastDay           = -1;
bool     killSwitchTriggered = false;

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   if(Period() != StrategyTimeframe)
   {
      Print("WARNING: EA designed for ${playbook.timeframe} (", StrategyTimeframe,
            ") but attached to ", Period(), ". Results may differ from backtest!");
   }
   
   accountPeak       = AccountBalance();
   dailyStartBalance = AccountBalance();
   lastDay           = DayOfYear();
   
   Print("${playbook.name} EA initialized | ", Symbol(), " | TF=", Period(),
         " | Risk=", RiskPerTrade, "% | SL_ATR=", SL_ATR_Mult, " | TP_ATR=", TP_ATR_Mult);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("${playbook.name} EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| New bar detection (bar-close evaluation)                          |
//+------------------------------------------------------------------+
bool IsNewBar()
{
   if(Time[0] == lastBarTime)
      return false;
   lastBarTime = Time[0];
   return true;
}

//+------------------------------------------------------------------+
//| Risk management — kill switches                                   |
//+------------------------------------------------------------------+
bool CheckKillSwitches()
{
   // Reset daily tracking on new day
   int today = DayOfYear();
   if(today != lastDay)
   {
      dailyStartBalance  = AccountBalance();
      lastDay            = today;
      killSwitchTriggered = false; // Reset daily kill switch
      Print("New trading day. Start balance: ", DoubleToStr(dailyStartBalance, 2));
   }
   
   // Max daily loss
   if(MaxDailyLoss > 0 && dailyStartBalance > 0)
   {
      double dailyLossPct = ((dailyStartBalance - AccountEquity()) / dailyStartBalance) * 100.0;
      if(dailyLossPct >= MaxDailyLoss)
      {
         if(!killSwitchTriggered)
            Print("KILL SWITCH: Daily loss ", DoubleToStr(dailyLossPct, 2),
                  "% >= limit ", DoubleToStr(MaxDailyLoss, 2), "%");
         killSwitchTriggered = true;
         return true;
      }
   }
   
   // Max drawdown
   if(MaxDrawdown > 0)
   {
      accountPeak = MathMax(accountPeak, AccountEquity());
      if(accountPeak > 0)
      {
         double ddPct = ((accountPeak - AccountEquity()) / accountPeak) * 100.0;
         if(ddPct >= MaxDrawdown)
         {
            if(!killSwitchTriggered)
               Print("KILL SWITCH: Drawdown ", DoubleToStr(ddPct, 2),
                     "% >= limit ", DoubleToStr(MaxDrawdown, 2), "%");
            killSwitchTriggered = true;
            return true;
         }
      }
   }
   
   return killSwitchTriggered;
}

//+------------------------------------------------------------------+
//| Spread check                                                      |
//+------------------------------------------------------------------+
bool IsSpreadAcceptable()
{
   if(MaxSpreadPts <= 0) return true;
   int spread = (int)MarketInfo(Symbol(), MODE_SPREAD);
   if(spread > MaxSpreadPts)
   {
      Print("Spread too wide: ", spread, " > ", MaxSpreadPts);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Position sizing based on risk (with lot step normalization)       |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopDistancePrice)
{
   if(stopDistancePrice <= 0) return 0;
   
   double riskAmount = AccountBalance() * (RiskPerTrade / 100.0);
   double tickValue  = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize   = MarketInfo(Symbol(), MODE_TICKSIZE);
   double minLot     = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot     = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep    = MarketInfo(Symbol(), MODE_LOTSTEP);
   
   if(tickValue <= 0 || tickSize <= 0 || lotStep <= 0)
      return minLot;
   
   double stopTicks = stopDistancePrice / tickSize;
   double lots      = riskAmount / (stopTicks * tickValue);
   
   // Normalize to lot step
   lots = MathFloor(lots / lotStep) * lotStep;
   lots = MathMax(lots, minLot);
   lots = MathMin(lots, maxLot);
   
   return NormalizeDouble(lots, 2);
}

//+------------------------------------------------------------------+
//| Count open positions for this EA (magic + symbol filter)          |
//+------------------------------------------------------------------+
int CountMyPositions()
{
   int count = 0;
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderMagicNumber() == MagicNumber && OrderSymbol() == Symbol())
            count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Normalize price to tick size                                      |
//+------------------------------------------------------------------+
double NormPrice(double price)
{
   double tickSize = MarketInfo(Symbol(), MODE_TICKSIZE);
   if(tickSize <= 0) return NormalizeDouble(price, (int)MarketInfo(Symbol(), MODE_DIGITS));
   return NormalizeDouble(MathRound(price / tickSize) * tickSize, (int)MarketInfo(Symbol(), MODE_DIGITS));
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Bar-close evaluation only
   if(!IsNewBar())
      return;
   
   // Kill switches
   if(CheckKillSwitches())
      return;
   
   // Position limit
   if(CountMyPositions() >= MaxPositions)
      return;
   
   // Spread gate
   if(!IsSpreadAcceptable())
      return;
   
   // === INDICATORS (all on bar[1] = last closed bar) ===
${indicatorCode}
   double atr_val = iATR(Symbol(), 0, 14, 1);
   if(atr_val <= 0) return; // Safety: no valid ATR
   
   // === ENTRY CONDITIONS ===
${conditionCode}
   
   double stopDist = NormPrice(atr_val * SL_ATR_Mult);
   double tpDist   = NormPrice(atr_val * TP_ATR_Mult);
   
   // === LONG ENTRY ===
   if(longSignal)
   {
      double ask  = Ask;
      double sl   = NormPrice(ask - stopDist);
      double tp   = NormPrice(ask + tpDist);
      double lots = CalculateLotSize(stopDist);
      
      if(lots > 0)
      {
         int ticket = OrderSend(Symbol(), OP_BUY, lots, ask, Slippage, sl, tp,
                                "${playbook.name}", MagicNumber, 0, clrGreen);
         if(ticket > 0)
            Print("LONG | ", lots, " lots @ ", ask, " | SL=", sl, " TP=", tp, " | ATR=", DoubleToStr(atr_val, (int)MarketInfo(Symbol(), MODE_DIGITS)));
         else
            Print("LONG FAILED | Err=", GetLastError(), " | Ask=", ask, " SL=", sl, " TP=", tp);
      }
   }
   
   // === SHORT ENTRY ===
   if(shortSignal)
   {
      double bid  = Bid;
      double sl   = NormPrice(bid + stopDist);
      double tp   = NormPrice(bid - tpDist);
      double lots = CalculateLotSize(stopDist);
      
      if(lots > 0)
      {
         int ticket = OrderSend(Symbol(), OP_SELL, lots, bid, Slippage, sl, tp,
                                "${playbook.name}", MagicNumber, 0, clrRed);
         if(ticket > 0)
            Print("SHORT | ", lots, " lots @ ", bid, " | SL=", sl, " TP=", tp, " | ATR=", DoubleToStr(atr_val, (int)MarketInfo(Symbol(), MODE_DIGITS)));
         else
            Print("SHORT FAILED | Err=", GetLastError(), " | Bid=", bid, " SL=", sl, " TP=", tp);
      }
   }
}

// ============================================
// PLAYBOOK PARITY NOTES
// ============================================
//
// FILL MODEL:
// - IsNewBar() ensures evaluation only on bar close
// - All indicator calls use shift=1 (last closed bar)
// - Order execution at start of new bar (next-bar open fill)
//
// SINGLE-TIMEFRAME:
// - All iMA/iRSI/etc use Period()=0 (current chart)
// - Attach to ${playbook.timeframe} chart for backtest parity
// - Warning logged if attached to different timeframe
//
// RISK CONTROLS:
// - Lot sizing via ATR-based risk (lot-step normalized)
// - Spread gate prevents entries during illiquid conditions
// - Daily loss + drawdown kill switches
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;

  const lintResult = lintMQLForMTF(code);
  if (!lintResult.valid) {
    console.warn('MT4 MTF lint warnings:', lintResult.violations);
  }
  
  return code;
}

// ============================================
// MT5 EA GENERATOR (Single-TF)
// ============================================

export function generateMT5EA(playbook: PlaybookAST): string {
  assertNoMTF(playbook);
  
  const mtTimeframe = getMTTimeframe(playbook);
  const slMult = playbook.risk.stopLoss.type === 'atr' ? (playbook.risk.stopLoss.value || 2) : 2;
  const tpMult = playbook.risk.takeProfit.type === 'atr' ? (playbook.risk.takeProfit.value || 4) : (slMult * (playbook.risk.takeProfit.value / playbook.risk.stopLoss.value));
  
  const mt5Indicators = generateMT5Indicators(playbook);
  const mt5HandleDecls = generateMT5HandleDeclarations(playbook);
  const mt5HandleInits = generateMT5HandleInits(playbook);
  const mt5HandleReleases = generateMT5HandleReleases(playbook);
  const mt5BufferDecls = generateMT5BufferDeclarations(playbook);
  const mt5BufferCopies = generateMT5BufferCopies(playbook);
  const mt5Conditions = generateMT5Conditions(playbook);
  
  const code = `//+------------------------------------------------------------------+
//|                            ${playbook.name.replace(/[^a-zA-Z0-9]/g, '_')}.mq5 |
//|                      Single-Timeframe Playbook EA (v1)            |
//+------------------------------------------------------------------+
#property copyright "ChartingPath Playbook Generator"
#property link      ""
#property version   "1.00"

// ============================================
// PLAYBOOK: ${playbook.name}
// TIMEFRAME: ${playbook.timeframe} (${mtTimeframe})
// FILL MODEL: Signal on bar close, entry on next bar open
// ============================================

#include <Trade\\Trade.mqh>

// === EXPECTED TIMEFRAME ===
const ENUM_TIMEFRAMES StrategyTimeframe = ${mtTimeframe};

// === INPUTS ===
input double InpRiskPerTrade = ${playbook.positionSizing.riskPerTrade};      // Risk per trade (%)
input int    InpMaxPositions = ${playbook.positionSizing.maxPositions};       // Max concurrent positions
input double InpMaxDailyLoss = ${playbook.positionSizing.maxDailyLoss || 0}; // Max daily loss % (0=disabled)
input double InpMaxDrawdown  = ${playbook.positionSizing.maxDrawdown || 0};  // Max drawdown % (0=disabled)
input double InpSL_ATR_Mult  = ${slMult};                                    // SL ATR multiplier
input double InpTP_ATR_Mult  = ${tpMult};                                    // TP ATR multiplier
input int    InpMaxSpreadPts = 30;                                            // Max spread (points, 0=disabled)
input ulong  InpMagicNumber  = ${Math.floor(Math.random() * 900000) + 100000};

// === INDICATOR HANDLES (created once in OnInit) ===
int hATR = INVALID_HANDLE;
${mt5HandleDecls}

// === STATE ===
datetime lastBarTime         = 0;
double   accountPeak         = 0;
double   dailyStartBalance   = 0;
MqlDateTime lastDayStruct;
bool     killSwitchTriggered = false;

CTrade trade;

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   if(Period() != StrategyTimeframe)
   {
      Print("WARNING: EA designed for ${playbook.timeframe} (",
            EnumToString(StrategyTimeframe), ") but attached to ",
            EnumToString(Period()), ". Results may differ!");
   }
   
   // Create indicator handles ONCE
   hATR = iATR(Symbol(), Period(), 14);
   if(hATR == INVALID_HANDLE)
   {
      Print("FATAL: Failed to create ATR handle");
      return(INIT_FAILED);
   }
${mt5HandleInits}
   
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   accountPeak     = AccountInfoDouble(ACCOUNT_BALANCE);
   dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   TimeCurrent(lastDayStruct);
   
   Print("${playbook.name} EA initialized | ", Symbol(), " | TF=",
         EnumToString(Period()), " | Risk=", InpRiskPerTrade, "%");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization — release all handles                     |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(hATR != INVALID_HANDLE) IndicatorRelease(hATR);
${mt5HandleReleases}
   Print("${playbook.name} EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| New bar detection                                                 |
//+------------------------------------------------------------------+
bool IsNewBar()
{
   datetime currentBarTime = iTime(Symbol(), Period(), 0);
   if(currentBarTime == lastBarTime)
      return false;
   lastBarTime = currentBarTime;
   return true;
}

//+------------------------------------------------------------------+
//| Kill switches                                                     |
//+------------------------------------------------------------------+
bool CheckKillSwitches()
{
   MqlDateTime now;
   TimeCurrent(now);
   
   // Reset on new day
   if(now.day_of_year != lastDayStruct.day_of_year || now.year != lastDayStruct.year)
   {
      dailyStartBalance   = AccountInfoDouble(ACCOUNT_BALANCE);
      lastDayStruct       = now;
      killSwitchTriggered = false;
      Print("New trading day. Start balance: ", DoubleToString(dailyStartBalance, 2));
   }
   
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   
   // Daily loss
   if(InpMaxDailyLoss > 0 && dailyStartBalance > 0)
   {
      double dailyLoss = ((dailyStartBalance - equity) / dailyStartBalance) * 100.0;
      if(dailyLoss >= InpMaxDailyLoss)
      {
         if(!killSwitchTriggered)
            Print("KILL SWITCH: Daily loss ", DoubleToString(dailyLoss, 2),
                  "% >= ", DoubleToString(InpMaxDailyLoss, 2), "%");
         killSwitchTriggered = true;
      }
   }
   
   // Drawdown
   if(InpMaxDrawdown > 0)
   {
      accountPeak = MathMax(accountPeak, equity);
      if(accountPeak > 0)
      {
         double dd = ((accountPeak - equity) / accountPeak) * 100.0;
         if(dd >= InpMaxDrawdown)
         {
            if(!killSwitchTriggered)
               Print("KILL SWITCH: Drawdown ", DoubleToString(dd, 2),
                     "% >= ", DoubleToString(InpMaxDrawdown, 2), "%");
            killSwitchTriggered = true;
         }
      }
   }
   
   return killSwitchTriggered;
}

//+------------------------------------------------------------------+
//| Spread check                                                      |
//+------------------------------------------------------------------+
bool IsSpreadAcceptable()
{
   if(InpMaxSpreadPts <= 0) return true;
   long spread = SymbolInfoInteger(Symbol(), SYMBOL_SPREAD);
   if(spread > InpMaxSpreadPts)
   {
      Print("Spread too wide: ", spread, " > ", InpMaxSpreadPts);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Count positions for THIS EA (magic + symbol filter)               |
//+------------------------------------------------------------------+
int CountMyPositions()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(PositionGetInteger(POSITION_MAGIC) == (long)InpMagicNumber &&
            PositionGetString(POSITION_SYMBOL) == Symbol())
            count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Risk-based lot sizing (with lot step normalization)               |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopDistPrice)
{
   if(stopDistPrice <= 0) return 0;
   
   double balance   = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmt   = balance * (InpRiskPerTrade / 100.0);
   double tickVal   = SymbolInfoDouble(Symbol(), SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(Symbol(), SYMBOL_TRADE_TICK_SIZE);
   double minLot    = SymbolInfoDouble(Symbol(), SYMBOL_VOLUME_MIN);
   double maxLot    = SymbolInfoDouble(Symbol(), SYMBOL_VOLUME_MAX);
   double lotStep   = SymbolInfoDouble(Symbol(), SYMBOL_VOLUME_STEP);
   
   if(tickVal <= 0 || tickSize <= 0 || lotStep <= 0)
      return minLot;
   
   double stopTicks = stopDistPrice / tickSize;
   double lots      = riskAmt / (stopTicks * tickVal);
   
   lots = MathFloor(lots / lotStep) * lotStep;
   lots = MathMax(lots, minLot);
   lots = MathMin(lots, maxLot);
   
   return NormalizeDouble(lots, 2);
}

//+------------------------------------------------------------------+
//| Normalize price to symbol tick size                               |
//+------------------------------------------------------------------+
double NormPrice(double price)
{
   double tickSize = SymbolInfoDouble(Symbol(), SYMBOL_TRADE_TICK_SIZE);
   int digits      = (int)SymbolInfoInteger(Symbol(), SYMBOL_DIGITS);
   if(tickSize <= 0) return NormalizeDouble(price, digits);
   return NormalizeDouble(MathRound(price / tickSize) * tickSize, digits);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!IsNewBar())
      return;
   
   if(CheckKillSwitches())
      return;
   
   if(CountMyPositions() >= InpMaxPositions)
      return;
   
   if(!IsSpreadAcceptable())
      return;
   
   // === READ ATR (bar[1] = last closed bar) ===
   double atr_buf[];
   ArraySetAsSeries(atr_buf, true);
   if(CopyBuffer(hATR, 0, 1, 1, atr_buf) < 1 || atr_buf[0] <= 0)
      return;
   
   double atr_val = atr_buf[0];
   
   // === READ INDICATOR BUFFERS ===
${mt5BufferDecls}
${mt5BufferCopies}
   
   // === ENTRY CONDITIONS ===
${mt5Conditions}
   
   double stopDist = NormPrice(atr_val * InpSL_ATR_Mult);
   double tpDist   = NormPrice(atr_val * InpTP_ATR_Mult);
   
   // === LONG ENTRY ===
   if(longSignal)
   {
      double ask  = SymbolInfoDouble(Symbol(), SYMBOL_ASK);
      double sl   = NormPrice(ask - stopDist);
      double tp   = NormPrice(ask + tpDist);
      double lots = CalculateLotSize(stopDist);
      
      if(lots > 0)
      {
         if(trade.Buy(lots, Symbol(), ask, sl, tp, "${playbook.name}"))
            Print("LONG | ", lots, " lots @ ", ask, " | SL=", sl, " TP=", tp);
         else
            Print("LONG FAILED | Err=", trade.ResultRetcode(),
                  " | ", trade.ResultRetcodeDescription());
      }
   }
   
   // === SHORT ENTRY ===
   if(shortSignal)
   {
      double bid  = SymbolInfoDouble(Symbol(), SYMBOL_BID);
      double sl   = NormPrice(bid + stopDist);
      double tp   = NormPrice(bid - tpDist);
      double lots = CalculateLotSize(stopDist);
      
      if(lots > 0)
      {
         if(trade.Sell(lots, Symbol(), bid, sl, tp, "${playbook.name}"))
            Print("SHORT | ", lots, " lots @ ", bid, " | SL=", sl, " TP=", tp);
         else
            Print("SHORT FAILED | Err=", trade.ResultRetcode(),
                  " | ", trade.ResultRetcodeDescription());
      }
   }
}

// ============================================
// PLAYBOOK PARITY NOTES (MT5)
// ============================================
//
// FILL MODEL:
// - IsNewBar() ensures evaluation only on bar close
// - All CopyBuffer calls use start=1 (last closed bar)
// - Order execution at start of new bar
//
// SINGLE-TIMEFRAME:
// - All indicator handles use Period() (current chart)
// - Attach to ${playbook.timeframe} chart for backtest parity
//
// RISK CONTROLS:
// - ATR-based lot sizing with lot-step normalization
// - Spread gate, daily loss + drawdown kill switches
// - Position counting filtered by magic number + symbol
//
// HANDLE MANAGEMENT:
// - All indicator handles created in OnInit()
// - All handles released in OnDeinit() (no memory leaks)
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;

  const lintResult = lintMQLForMTF(code);
  if (!lintResult.valid) {
    console.warn('MT5 MTF lint warnings:', lintResult.violations);
  }
  
  return code;
}

// MT5 helper: generate handle declarations
function generateMT5HandleDeclarations(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) return '// No custom indicator handles';
  return playbook.indicators.map(ind => {
    return `int h_${ind.id} = INVALID_HANDLE;`;
  }).join('\n');
}

// MT5 helper: generate handle inits in OnInit
function generateMT5HandleInits(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) return '   // No custom indicators to init';
  return playbook.indicators.map(ind => {
    switch (ind.type) {
      case 'ema':
        return `   h_${ind.id} = iMA(Symbol(), Period(), ${ind.parameters.length || 20}, 0, MODE_EMA, PRICE_CLOSE);\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      case 'sma':
        return `   h_${ind.id} = iMA(Symbol(), Period(), ${ind.parameters.length || 20}, 0, MODE_SMA, PRICE_CLOSE);\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      case 'rsi':
        return `   h_${ind.id} = iRSI(Symbol(), Period(), ${ind.parameters.length || 14}, PRICE_CLOSE);\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      case 'macd':
        return `   h_${ind.id} = iMACD(Symbol(), Period(), ${ind.parameters.fast || 12}, ${ind.parameters.slow || 26}, ${ind.parameters.signal || 9}, PRICE_CLOSE);\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      case 'bollinger_bands':
        return `   h_${ind.id} = iBands(Symbol(), Period(), ${ind.parameters.length || 20}, 0, ${ind.parameters.stdDev || 2}, PRICE_CLOSE);\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      case 'atr':
        return `   h_${ind.id} = iATR(Symbol(), Period(), ${ind.parameters.length || 14});\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      case 'stoch':
        return `   h_${ind.id} = iStochastic(Symbol(), Period(), ${ind.parameters.k || 14}, ${ind.parameters.d || 3}, 3, MODE_SMA, STO_LOWHIGH);\n   if(h_${ind.id} == INVALID_HANDLE) { Print("Failed: ${ind.id}"); return(INIT_FAILED); }`;
      default:
        return `   // Unknown indicator: ${ind.type}`;
    }
  }).join('\n');
}

// MT5 helper: release handles
function generateMT5HandleReleases(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) return '   // No custom handles to release';
  return playbook.indicators.map(ind => {
    return `   if(h_${ind.id} != INVALID_HANDLE) IndicatorRelease(h_${ind.id});`;
  }).join('\n');
}

// MT5 helper: buffer declarations
function generateMT5BufferDeclarations(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) return '   // No indicator buffers';
  const lines: string[] = [];
  for (const ind of playbook.indicators) {
    if (ind.type === 'macd') {
      lines.push(`   double ${ind.id}_line_buf[], ${ind.id}_signal_buf[];`);
      lines.push(`   ArraySetAsSeries(${ind.id}_line_buf, true); ArraySetAsSeries(${ind.id}_signal_buf, true);`);
    } else if (ind.type === 'bollinger_bands') {
      lines.push(`   double ${ind.id}_mid_buf[], ${ind.id}_upper_buf[], ${ind.id}_lower_buf[];`);
      lines.push(`   ArraySetAsSeries(${ind.id}_mid_buf, true); ArraySetAsSeries(${ind.id}_upper_buf, true); ArraySetAsSeries(${ind.id}_lower_buf, true);`);
    } else if (ind.type === 'stoch') {
      lines.push(`   double ${ind.id}_k_buf[], ${ind.id}_d_buf[];`);
      lines.push(`   ArraySetAsSeries(${ind.id}_k_buf, true); ArraySetAsSeries(${ind.id}_d_buf, true);`);
    } else {
      lines.push(`   double ${ind.id}_buf[];`);
      lines.push(`   ArraySetAsSeries(${ind.id}_buf, true);`);
    }
  }
  return lines.join('\n');
}

// MT5 helper: copy buffers
function generateMT5BufferCopies(playbook: PlaybookAST): string {
  if (playbook.indicators.length === 0) return '   // No buffers to copy';
  const lines: string[] = [];
  for (const ind of playbook.indicators) {
    if (ind.type === 'macd') {
      lines.push(`   CopyBuffer(h_${ind.id}, 0, 1, 2, ${ind.id}_line_buf);`);
      lines.push(`   CopyBuffer(h_${ind.id}, 1, 1, 2, ${ind.id}_signal_buf);`);
    } else if (ind.type === 'bollinger_bands') {
      lines.push(`   CopyBuffer(h_${ind.id}, 0, 1, 2, ${ind.id}_mid_buf);`);
      lines.push(`   CopyBuffer(h_${ind.id}, 1, 1, 2, ${ind.id}_upper_buf);`);
      lines.push(`   CopyBuffer(h_${ind.id}, 2, 1, 2, ${ind.id}_lower_buf);`);
    } else if (ind.type === 'stoch') {
      lines.push(`   CopyBuffer(h_${ind.id}, 0, 1, 2, ${ind.id}_k_buf);`);
      lines.push(`   CopyBuffer(h_${ind.id}, 1, 1, 2, ${ind.id}_d_buf);`);
    } else {
      lines.push(`   CopyBuffer(h_${ind.id}, 0, 1, 2, ${ind.id}_buf);`);
    }
  }
  return lines.join('\n');
}

// MT5 helper: generate indicator refs for MT5
function generateMT5Indicators(playbook: PlaybookAST): string {
  // MT5 uses handles; indicators are read via CopyBuffer in OnTick
  return '';
}

// MT5 helper: conditions
function generateMT5Conditions(playbook: PlaybookAST): string {
  const longConds = playbook.entryConditions.long.length > 0
    ? playbook.entryConditions.long.map(c => conditionToMT5(c)).join(playbook.entryConditions.logic === 'and' ? ' && ' : ' || ')
    : 'false';
  
  const shortConds = playbook.entryConditions.short && playbook.entryConditions.short.length > 0
    ? playbook.entryConditions.short.map(c => conditionToMT5(c)).join(playbook.entryConditions.logic === 'and' ? ' && ' : ' || ')
    : 'false';
  
  return `   bool longSignal = ${longConds};
   bool shortSignal = ${shortConds};`;
}

// ============================================
// README GENERATOR
// ============================================

export function generatePlaybookReadme(playbook: PlaybookAST, exportType: 'pine' | 'mt4' | 'mt5'): string {
  return `# ${playbook.name} - Playbook Export

## Overview
This is a single-timeframe trading playbook generated by ChartingPath.

## Configuration

| Parameter | Value |
|-----------|-------|
| **Timeframe** | ${playbook.timeframe} |
| **Symbol** | ${playbook.symbol} |
| **Risk Per Trade** | ${playbook.positionSizing.riskPerTrade}% |
| **Stop Loss** | ${playbook.risk.stopLoss.value} (${playbook.risk.stopLoss.type}) |
| **Take Profit** | ${playbook.risk.takeProfit.value} (${playbook.risk.takeProfit.type}) |
| **Max Positions** | ${playbook.positionSizing.maxPositions} |
${playbook.positionSizing.maxDailyLoss ? `| **Max Daily Loss** | ${playbook.positionSizing.maxDailyLoss}% (Kill Switch) |` : ''}
${playbook.positionSizing.maxDrawdown ? `| **Max Drawdown** | ${playbook.positionSizing.maxDrawdown}% (Kill Switch) |` : ''}

## Single-Timeframe Contract

This playbook follows strict single-timeframe semantics:

1. **One Timeframe Only**: All signals computed on \`${playbook.timeframe}\`
2. **Bar-Close Evaluation**: Signals generated on bar close only
3. **Next-Bar Fill**: Entry executed at next bar open
4. **No MTF Logic**: No request.security() (Pine) or cross-TF iMA() (MT4/5)

## Fill Model

| Stage | Description |
|-------|-------------|
| Signal | Computed on bar \`i\` close |
| Entry | Filled at bar \`i+1\` open |
| SL/TP | Set relative to entry price |

## Installation

${exportType === 'pine' ? `
### TradingView (Pine Script v5)
1. Open TradingView and go to Pine Editor
2. Create new script and paste the code
3. Click "Add to Chart"
4. **IMPORTANT**: Set chart timeframe to \`${playbook.timeframe}\`
5. Configure inputs in strategy settings
` : exportType === 'mt4' ? `
### MetaTrader 4
1. Copy \`.mq4\` file to \`MQL4/Experts/\` folder
2. Restart MT4 or right-click Navigator → Refresh
3. Drag EA onto \`${playbook.timeframe}\` chart
4. Enable AutoTrading and Live Trading
5. Configure inputs in EA properties
` : `
### MetaTrader 5
1. Copy \`.mq5\` file to \`MQL5/Experts/\` folder
2. Compile in MetaEditor
3. Drag EA onto \`${playbook.timeframe}\` chart
4. Enable Algo Trading
5. Configure inputs in EA properties
`}

## Backtest Parity

To ensure parity with ChartingPath backtest results:

- Apply to **${playbook.timeframe}** timeframe chart
- Use the same symbol: **${playbook.symbol}**
- Matching date range for comparison
- Account for slippage/commission differences

## Risk Warning

**EDUCATIONAL USE ONLY**

- This code is provided for educational purposes
- Past performance does not guarantee future results
- Trading involves substantial risk of loss
- Always test thoroughly on demo before live trading
- Never risk more than you can afford to lose

## Generated

- Date: ${new Date().toISOString()}
- Version: ${playbook.version}
- Generator: ChartingPath Playbook v1
`;
}
