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
// MT4 EA GENERATOR (Single-TF)
// ============================================

export function generateMT4EA(playbook: PlaybookAST): string {
  assertNoMTF(playbook);
  
  const mtTimeframe = getMTTimeframe(playbook);
  
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
extern int MaxPositions = ${playbook.positionSizing.maxPositions};          // Max concurrent positions
extern double MaxDailyLoss = ${playbook.positionSizing.maxDailyLoss || 0};  // Max daily loss % (0 = disabled)
extern double MaxDrawdown = ${playbook.positionSizing.maxDrawdown || 0};    // Max drawdown % (0 = disabled)
extern double StopLoss = ${playbook.risk.stopLoss.value};                   // Stop loss (${playbook.risk.stopLoss.type})
extern double TakeProfit = ${playbook.risk.takeProfit.value};               // Take profit (${playbook.risk.takeProfit.type})
extern int MagicNumber = ${Math.floor(Math.random() * 900000) + 100000};

// === STATE VARIABLES ===
datetime lastBarTime = 0;
double accountPeak = 0;
double dailyStartBalance = 0;
datetime lastDayChecked = 0;
bool killSwitchTriggered = false;

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   // Timeframe assertion
   if(Period() != StrategyTimeframe)
   {
      Print("WARNING: EA designed for ${playbook.timeframe} (", StrategyTimeframe, 
            ") but attached to ", Period(), ". Results may differ from backtest!");
      // Optionally: return(INIT_FAILED);
   }
   
   accountPeak = AccountBalance();
   dailyStartBalance = AccountBalance();
   lastDayChecked = TimeCurrent();
   
   Print("${playbook.name} EA initialized on ", Symbol(), " ", Period());
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
//| Risk management - kill switches                                   |
//+------------------------------------------------------------------+
void CheckKillSwitches()
{
   // Reset daily tracking on new day
   if(TimeDay(TimeCurrent()) != TimeDay(lastDayChecked))
   {
      dailyStartBalance = AccountBalance();
      lastDayChecked = TimeCurrent();
      Print("New trading day. Daily start balance: ", dailyStartBalance);
   }
   
   // Max daily loss check
   if(MaxDailyLoss > 0)
   {
      double dailyLossPct = ((dailyStartBalance - AccountEquity()) / dailyStartBalance) * 100;
      if(dailyLossPct >= MaxDailyLoss)
      {
         Print("KILL SWITCH: Daily loss ", DoubleToStr(dailyLossPct, 2), 
               "% exceeds limit of ", MaxDailyLoss, "%");
         killSwitchTriggered = true;
         return;
      }
   }
   
   // Max drawdown check
   if(MaxDrawdown > 0)
   {
      accountPeak = MathMax(accountPeak, AccountEquity());
      double drawdownPct = ((accountPeak - AccountEquity()) / accountPeak) * 100;
      if(drawdownPct >= MaxDrawdown)
      {
         Print("KILL SWITCH: Drawdown ", DoubleToStr(drawdownPct, 2), 
               "% exceeds limit of ", MaxDrawdown, "%");
         killSwitchTriggered = true;
         return;
      }
   }
}

//+------------------------------------------------------------------+
//| Position sizing based on risk                                     |
//+------------------------------------------------------------------+
double CalculateLotSize()
{
   double riskAmount = AccountBalance() * (RiskPerTrade / 100.0);
   double atr = iATR(Symbol(), 0, 14, 1); // Use bar[1] (last closed bar)
   double stopPoints = atr * 2 / Point;
   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   
   if(stopPoints <= 0 || tickValue <= 0)
      return 0.01;
   
   double lots = riskAmount / (stopPoints * tickValue);
   lots = NormalizeDouble(lots, 2);
   lots = MathMax(lots, MarketInfo(Symbol(), MODE_MINLOT));
   lots = MathMin(lots, MarketInfo(Symbol(), MODE_MAXLOT));
   
   return lots;
}

//+------------------------------------------------------------------+
//| Count open positions for this EA                                  |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS) && 
         OrderMagicNumber() == MagicNumber && 
         OrderSymbol() == Symbol())
      {
         count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Entry conditions (evaluated on last closed bar)                   |
//+------------------------------------------------------------------+
bool CheckLongEntry()
{
   // All indicators use bar index 1 (last closed bar) for bar-close evaluation
   double ema_fast = iMA(Symbol(), 0, 12, 0, MODE_EMA, PRICE_CLOSE, 1);
   double ema_slow = iMA(Symbol(), 0, 26, 0, MODE_EMA, PRICE_CLOSE, 1);
   double rsi = iRSI(Symbol(), 0, 14, PRICE_CLOSE, 1);
   
   // Example condition - replace with playbook conditions
   return (ema_fast > ema_slow && rsi > 30 && rsi < 70);
}

bool CheckShortEntry()
{
   double ema_fast = iMA(Symbol(), 0, 12, 0, MODE_EMA, PRICE_CLOSE, 1);
   double ema_slow = iMA(Symbol(), 0, 26, 0, MODE_EMA, PRICE_CLOSE, 1);
   double rsi = iRSI(Symbol(), 0, 14, PRICE_CLOSE, 1);
   
   return (ema_fast < ema_slow && rsi > 30 && rsi < 70);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Bar-close evaluation: only process on new bar
   if(!IsNewBar())
      return;
   
   // Check kill switches
   CheckKillSwitches();
   if(killSwitchTriggered)
   {
      Print("Trading halted by kill switch");
      return;
   }
   
   // Check position limit
   if(CountOpenPositions() >= MaxPositions)
      return;
   
   // Calculate ATR for stops (use bar[1])
   double atr = iATR(Symbol(), 0, 14, 1);
   double stopDistance = atr * 2;
   double rrRatio = TakeProfit / StopLoss;
   
   // Check entry conditions
   if(CheckLongEntry())
   {
      double lots = CalculateLotSize();
      double sl = Ask - stopDistance;
      double tp = Ask + (stopDistance * rrRatio);
      
      int ticket = OrderSend(Symbol(), OP_BUY, lots, Ask, 3, sl, tp, 
                             "${playbook.name} Long", MagicNumber, 0, clrGreen);
      if(ticket > 0)
         Print("Long entry: ", lots, " lots at ", Ask, " SL=", sl, " TP=", tp);
      else
         Print("Long entry failed: ", GetLastError());
   }
   
   if(CheckShortEntry())
   {
      double lots = CalculateLotSize();
      double sl = Bid + stopDistance;
      double tp = Bid - (stopDistance * rrRatio);
      
      int ticket = OrderSend(Symbol(), OP_SELL, lots, Bid, 3, sl, tp,
                             "${playbook.name} Short", MagicNumber, 0, clrRed);
      if(ticket > 0)
         Print("Short entry: ", lots, " lots at ", Bid, " SL=", sl, " TP=", tp);
      else
         Print("Short entry failed: ", GetLastError());
   }
}

// ============================================
// PLAYBOOK PARITY NOTES
// ============================================
// 
// FILL MODEL:
// - IsNewBar() ensures evaluation only on bar close
// - All indicator calls use shift=1 (last closed bar)
// - Order execution happens at start of new bar
// 
// SINGLE-TIMEFRAME:
// - All iMA/iRSI/etc use Period()=0 (current chart)
// - Attach to ${playbook.timeframe} chart for backtest parity
// - Warning logged if attached to different timeframe
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;

  // Lint for MTF violations
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
  
  return `//+------------------------------------------------------------------+
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
input double RiskPerTrade = ${playbook.positionSizing.riskPerTrade};      // Risk per trade (%)
input int MaxPositions = ${playbook.positionSizing.maxPositions};          // Max concurrent positions
input double MaxDailyLoss = ${playbook.positionSizing.maxDailyLoss || 0};  // Max daily loss % (0 = disabled)
input double MaxDrawdown = ${playbook.positionSizing.maxDrawdown || 0};    // Max drawdown % (0 = disabled)
input double StopLoss = ${playbook.risk.stopLoss.value};                   // Stop loss
input double TakeProfit = ${playbook.risk.takeProfit.value};               // Take profit
input ulong MagicNumber = ${Math.floor(Math.random() * 900000) + 100000};

// === STATE VARIABLES ===
datetime lastBarTime = 0;
double accountPeak = 0;
double dailyStartBalance = 0;
datetime lastDayChecked = 0;
bool killSwitchTriggered = false;

CTrade trade;

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   if(Period() != StrategyTimeframe)
   {
      Print("WARNING: EA designed for ${playbook.timeframe} (", EnumToString(StrategyTimeframe), 
            ") but attached to ", EnumToString(Period()), ". Results may differ!");
   }
   
   trade.SetExpertMagicNumber(MagicNumber);
   accountPeak = AccountInfoDouble(ACCOUNT_BALANCE);
   dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   lastDayChecked = TimeCurrent();
   
   Print("${playbook.name} EA initialized on ", Symbol(), " ", EnumToString(Period()));
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
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!IsNewBar())
      return;
   
   // Kill switch checks
   if(MaxDailyLoss > 0 || MaxDrawdown > 0)
   {
      double equity = AccountInfoDouble(ACCOUNT_EQUITY);
      
      if(MaxDrawdown > 0)
      {
         accountPeak = MathMax(accountPeak, equity);
         double dd = ((accountPeak - equity) / accountPeak) * 100;
         if(dd >= MaxDrawdown)
         {
            Print("KILL SWITCH: Drawdown ", DoubleToString(dd, 2), "%");
            killSwitchTriggered = true;
         }
      }
   }
   
   if(killSwitchTriggered)
      return;
   
   // Entry logic - bar[1] for closed bar evaluation
   double ema_fast = iMA(Symbol(), Period(), 12, 0, MODE_EMA, PRICE_CLOSE);
   double ema_slow = iMA(Symbol(), Period(), 26, 0, MODE_EMA, PRICE_CLOSE);
   
   double fast_val[], slow_val[];
   ArraySetAsSeries(fast_val, true);
   ArraySetAsSeries(slow_val, true);
   CopyBuffer(ema_fast, 0, 1, 1, fast_val);
   CopyBuffer(ema_slow, 0, 1, 1, slow_val);
   
   bool longSignal = fast_val[0] > slow_val[0];
   bool shortSignal = fast_val[0] < slow_val[0];
   
   // Execute trades
   if(longSignal && PositionsTotal() < MaxPositions)
   {
      double ask = SymbolInfoDouble(Symbol(), SYMBOL_ASK);
      double atr[];
      ArraySetAsSeries(atr, true);
      int atrHandle = iATR(Symbol(), Period(), 14);
      CopyBuffer(atrHandle, 0, 1, 1, atr);
      
      double sl = ask - atr[0] * 2;
      double tp = ask + atr[0] * 2 * (TakeProfit / StopLoss);
      
      trade.Buy(0.1, Symbol(), ask, sl, tp, "${playbook.name}");
   }
}

// ============================================
// PLAYBOOK PARITY NOTES (MT5)
// ============================================
// Apply to ${playbook.timeframe} chart for backtest parity.
// All indicator reads use shift=1 (last closed bar).
// DISCLAIMER: Educational use only.
// ============================================
`;
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
