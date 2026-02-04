/**
 * ============================================
 * PATTERN SCRIPT EXPORTER
 * ============================================
 * 
 * Generates executable trading scripts from detected patterns
 * with dynamic entry logic and SL breach warnings.
 * 
 * Key Features:
 * - Market entry at current price (not stale detection price)
 * - Dynamic SL/TP recalculation maintaining R:R ratio
 * - SL breach warning (allows override)
 * - Supports Pine Script v5, MT4, MT5
 */

export interface PatternDetection {
  id: string;
  instrument: string;
  pattern_name: string;
  direction: 'bullish' | 'bearish' | string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  timeframe?: string;
  quality_score?: string;
  asset_type?: string;
  first_detected_at?: string;
}

export interface ExportOptions {
  targetRR?: number; // Override R:R if desired
  useMarketEntry?: boolean; // Default true - enter at current price
  showBreachWarning?: boolean; // Default true - show SL breach warning
}

export type ExportPlatform = 'pine' | 'mt4' | 'mt5';

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function generatePatternScript(
  pattern: PatternDetection,
  platform: ExportPlatform,
  options: ExportOptions = {}
): string {
  const {
    targetRR = pattern.risk_reward_ratio || 3,
    useMarketEntry = true,
    showBreachWarning = true,
  } = options;

  const isLong = pattern.direction === 'bullish' || pattern.direction.toLowerCase().includes('bull');
  const stopDistance = Math.abs(pattern.entry_price - pattern.stop_loss_price);
  
  const scriptMeta = {
    patternName: formatPatternName(pattern.pattern_name),
    instrument: pattern.instrument,
    direction: isLong ? 'Long' : 'Short',
    originalEntry: pattern.entry_price,
    originalSL: pattern.stop_loss_price,
    originalTP: pattern.take_profit_price,
    stopDistance,
    rr: targetRR,
    timeframe: pattern.timeframe || '1D',
    detectedAt: pattern.first_detected_at || new Date().toISOString(),
    qualityScore: pattern.quality_score || 'N/A',
  };

  switch (platform) {
    case 'pine':
      return generatePinePatternScript(scriptMeta, useMarketEntry, showBreachWarning);
    case 'mt4':
      return generateMT4PatternScript(scriptMeta, useMarketEntry, showBreachWarning);
    case 'mt5':
      return generateMT5PatternScript(scriptMeta, useMarketEntry, showBreachWarning);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// ============================================
// PINE SCRIPT V5 GENERATOR
// ============================================

interface ScriptMeta {
  patternName: string;
  instrument: string;
  direction: string;
  originalEntry: number;
  originalSL: number;
  originalTP: number;
  stopDistance: number;
  rr: number;
  timeframe: string;
  detectedAt: string;
  qualityScore: string;
}

function generatePinePatternScript(
  meta: ScriptMeta,
  useMarketEntry: boolean,
  showBreachWarning: boolean
): string {
  const isLong = meta.direction === 'Long';
  
  return `// @version=5
// ============================================
// ${meta.patternName.toUpperCase()} PATTERN TRADE SCRIPT
// ============================================
// 
// Pattern: ${meta.patternName}
// Instrument: ${meta.instrument}
// Direction: ${meta.direction}
// Quality Score: ${meta.qualityScore}
// Detected: ${meta.detectedAt}
// 
// EXECUTION MODEL:
// - Entry: ${useMarketEntry ? 'Market price (dynamic)' : 'Original detection price'}
// - SL/TP: Recalculated to maintain ${meta.rr}:1 R:R ratio
// - Fill: Signal on bar close, execution on next bar open
//
// Generated: ${new Date().toISOString()}
// ============================================

strategy("${meta.patternName} - ${meta.instrument}", overlay=true,
         initial_capital=100000,
         pyramiding=0,
         process_orders_on_close=false,
         calc_on_every_tick=false,
         commission_type=strategy.commission.percent,
         commission_value=0.01)

// === ORIGINAL PATTERN LEVELS ===
// These are the levels at pattern detection time
var float ORIGINAL_ENTRY = ${meta.originalEntry.toFixed(5)}
var float ORIGINAL_SL = ${meta.originalSL.toFixed(5)}
var float ORIGINAL_TP = ${meta.originalTP.toFixed(5)}
var float ORIGINAL_STOP_DISTANCE = ${meta.stopDistance.toFixed(5)}
var float TARGET_RR = ${meta.rr}

// === USER INPUTS ===
i_riskPercent = input.float(1.0, "Risk Per Trade %", minval=0.1, maxval=10)
i_manualEntry = input.bool(false, "Use Manual Entry (click to enter)")
i_overrideRR = input.float(${meta.rr}, "Risk:Reward Ratio", minval=1, maxval=10)

// === ATR FOR DYNAMIC CALCULATIONS ===
atr_value = ta.atr(14)

// === DYNAMIC ENTRY LOGIC ===
// When deployed, uses current price and recalculates SL/TP to maintain R:R
${useMarketEntry ? `
// MARKET ENTRY MODE: Enter at current price, recalculate brackets
dynamic_entry = close
dynamic_stop_distance = atr_value * 2  // ATR-based stop maintains consistency
${isLong ? `
dynamic_sl = dynamic_entry - dynamic_stop_distance
dynamic_tp = dynamic_entry + (dynamic_stop_distance * i_overrideRR)
` : `
dynamic_sl = dynamic_entry + dynamic_stop_distance
dynamic_tp = dynamic_entry - (dynamic_stop_distance * i_overrideRR)
`}
` : `
// STATIC ENTRY MODE: Use original detection levels
dynamic_entry = ORIGINAL_ENTRY
dynamic_sl = ORIGINAL_SL  
dynamic_tp = ORIGINAL_TP
dynamic_stop_distance = ORIGINAL_STOP_DISTANCE
`}

// === SL BREACH DETECTION ===
${showBreachWarning ? `
// Check if original stop loss was already breached
${isLong ? `
sl_already_breached = low < ORIGINAL_SL
` : `
sl_already_breached = high > ORIGINAL_SL
`}

// Visual warning if SL was breached before entry
var bool breach_warning_shown = false
if sl_already_breached and not breach_warning_shown
    label.new(bar_index, ${isLong ? 'low' : 'high'}, 
              "⚠️ SL BREACHED\\nOriginal SL: " + str.tostring(ORIGINAL_SL, "#.#####") + "\\nProceed with caution",
              color=color.orange, textcolor=color.white, style=label.style_label_${isLong ? 'up' : 'down'}, size=size.normal)
    breach_warning_shown := true
` : '// SL breach warning disabled'}

// === POSITION SIZING ===
risk_amount = strategy.equity * (i_riskPercent / 100.0)
position_size = risk_amount / dynamic_stop_distance

// === ENTRY SIGNAL ===
// Activate on first bar after script deployment (or use manual trigger)
var bool entry_executed = false
entry_condition = not entry_executed and (not i_manualEntry or input.bool(false, "CLICK TO ENTER NOW"))

// === EXECUTION ===
if barstate.isconfirmed and entry_condition and strategy.position_size == 0
    ${isLong ? `
    strategy.entry("${meta.patternName} Long", strategy.long, qty=position_size)
    strategy.exit("Exit Long", from_entry="${meta.patternName} Long",
                  stop=dynamic_sl,
                  limit=dynamic_tp)
    ` : `
    strategy.entry("${meta.patternName} Short", strategy.short, qty=position_size)
    strategy.exit("Exit Short", from_entry="${meta.patternName} Short",
                  stop=dynamic_sl,
                  limit=dynamic_tp)
    `}
    entry_executed := true
    
    label.new(bar_index, ${isLong ? 'low' : 'high'},
              "ENTRY: " + str.tostring(close, "#.#####") + 
              "\\nSL: " + str.tostring(dynamic_sl, "#.#####") +
              "\\nTP: " + str.tostring(dynamic_tp, "#.#####") +
              "\\nR:R: 1:" + str.tostring(i_overrideRR),
              color=${isLong ? 'color.green' : 'color.red'}, textcolor=color.white,
              style=label.style_label_${isLong ? 'up' : 'down'}, size=size.small)

// === VISUAL REFERENCE LINES ===
// Show original pattern levels for reference
plot(ORIGINAL_ENTRY, "Original Entry", color=color.gray, linewidth=1, style=plot.style_circles)
plot(ORIGINAL_SL, "Original SL", color=color.new(color.red, 70), linewidth=1, style=plot.style_linebr)
plot(ORIGINAL_TP, "Original TP", color=color.new(color.green, 70), linewidth=1, style=plot.style_linebr)

// Show dynamic levels when in position
plot(strategy.position_size != 0 ? dynamic_sl : na, "Active SL", color=color.red, linewidth=2)
plot(strategy.position_size != 0 ? dynamic_tp : na, "Active TP", color=color.green, linewidth=2)

// ============================================
// DEPLOYMENT INSTRUCTIONS
// ============================================
//
// 1. Open TradingView → Pine Editor
// 2. Paste this script and click "Add to Chart"
// 3. Apply to ${meta.instrument} chart with ${meta.timeframe} timeframe
// 4. Script will auto-enter at current market price
// 5. SL and TP are automatically calculated to maintain ${meta.rr}:1 R:R
//
// IMPORTANT:
// - If SL was already hit, a warning label will appear
// - Entry still proceeds - you decide if trade is still valid
// - Adjust "Risk Per Trade %" in settings to control position size
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;
}

// ============================================
// MT4 EA GENERATOR
// ============================================

function generateMT4PatternScript(
  meta: ScriptMeta,
  useMarketEntry: boolean,
  showBreachWarning: boolean
): string {
  const isLong = meta.direction === 'Long';
  
  return `//+------------------------------------------------------------------+
//|                    ${meta.patternName.replace(/\s+/g, '_')}_${meta.instrument}.mq4 |
//|                    Pattern Trade Script - ChartingPath            |
//+------------------------------------------------------------------+
#property copyright "ChartingPath Pattern Exporter"
#property version   "1.00"
#property strict

// ============================================
// ${meta.patternName.toUpperCase()} PATTERN TRADE
// ============================================
// Instrument: ${meta.instrument}
// Direction: ${meta.direction}
// Quality Score: ${meta.qualityScore}
// Detected: ${meta.detectedAt}
// ============================================

// === ORIGINAL PATTERN LEVELS ===
const double ORIGINAL_ENTRY = ${meta.originalEntry.toFixed(5)};
const double ORIGINAL_SL = ${meta.originalSL.toFixed(5)};
const double ORIGINAL_TP = ${meta.originalTP.toFixed(5)};
const double ORIGINAL_STOP_DISTANCE = ${meta.stopDistance.toFixed(5)};

// === INPUTS ===
extern double RiskPercent = 1.0;        // Risk per trade (%)
extern double TargetRR = ${meta.rr};    // Risk:Reward ratio
extern bool UseMarketEntry = ${useMarketEntry ? 'true' : 'false'};  // Enter at market vs original price
extern bool ShowBreachWarning = ${showBreachWarning ? 'true' : 'false'};  // Show SL breach warning
extern int MagicNumber = ${Math.floor(Math.random() * 900000) + 100000};

// === STATE ===
bool entryExecuted = false;
bool breachWarningShown = false;

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("${meta.patternName} Pattern EA initialized");
   Print("Original Entry: ", ORIGINAL_ENTRY, " SL: ", ORIGINAL_SL, " TP: ", ORIGINAL_TP);
   
   // Check for SL breach on init
   if(ShowBreachWarning)
   {
      ${isLong ? `
      if(Bid < ORIGINAL_SL)
      {
         Alert("⚠️ WARNING: Stop Loss was already breached! Original SL: ", ORIGINAL_SL, " Current: ", Bid);
         Comment("⚠️ SL BREACHED - Proceed with caution");
         breachWarningShown = true;
      }
      ` : `
      if(Ask > ORIGINAL_SL)
      {
         Alert("⚠️ WARNING: Stop Loss was already breached! Original SL: ", ORIGINAL_SL, " Current: ", Ask);
         Comment("⚠️ SL BREACHED - Proceed with caution");
         breachWarningShown = true;
      }
      `}
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Calculate dynamic levels based on current price                   |
//+------------------------------------------------------------------+
void CalculateDynamicLevels(double &entry, double &sl, double &tp)
{
   double atr = iATR(Symbol(), 0, 14, 1);
   double stopDistance = atr * 2;
   
   if(UseMarketEntry)
   {
      ${isLong ? `
      entry = Ask;  // Market entry for long
      sl = entry - stopDistance;
      tp = entry + (stopDistance * TargetRR);
      ` : `
      entry = Bid;  // Market entry for short
      sl = entry + stopDistance;
      tp = entry - (stopDistance * TargetRR);
      `}
   }
   else
   {
      entry = ORIGINAL_ENTRY;
      sl = ORIGINAL_SL;
      tp = ORIGINAL_TP;
   }
}

//+------------------------------------------------------------------+
//| Calculate position size based on risk                             |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopDistance)
{
   double riskAmount = AccountBalance() * (RiskPercent / 100.0);
   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   double stopPoints = stopDistance / Point;
   
   if(stopPoints <= 0 || tickValue <= 0) return 0.01;
   
   double lots = riskAmount / (stopPoints * tickValue);
   lots = NormalizeDouble(lots, 2);
   lots = MathMax(lots, MarketInfo(Symbol(), MODE_MINLOT));
   lots = MathMin(lots, MarketInfo(Symbol(), MODE_MAXLOT));
   
   return lots;
}

//+------------------------------------------------------------------+
//| Count open positions                                              |
//+------------------------------------------------------------------+
int CountPositions()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         if(OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
            count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Only execute once
   if(entryExecuted) return;
   if(CountPositions() > 0) return;
   
   double entry, sl, tp;
   CalculateDynamicLevels(entry, sl, tp);
   
   double stopDistance = MathAbs(entry - sl);
   double lots = CalculateLotSize(stopDistance);
   
   int slPoints = (int)(stopDistance / Point);
   int tpPoints = (int)(MathAbs(tp - entry) / Point);
   
   ${isLong ? `
   int ticket = OrderSend(Symbol(), OP_BUY, lots, Ask, 3, 
                          NormalizeDouble(sl, Digits), 
                          NormalizeDouble(tp, Digits),
                          "${meta.patternName} Long", MagicNumber, 0, clrGreen);
   ` : `
   int ticket = OrderSend(Symbol(), OP_SELL, lots, Bid, 3,
                          NormalizeDouble(sl, Digits),
                          NormalizeDouble(tp, Digits),
                          "${meta.patternName} Short", MagicNumber, 0, clrRed);
   `}
   
   if(ticket > 0)
   {
      Print("✅ ${meta.patternName} trade opened. Ticket: ", ticket);
      Print("Entry: ", entry, " SL: ", sl, " TP: ", tp, " R:R: 1:", TargetRR);
      entryExecuted = true;
   }
   else
   {
      Print("❌ Order failed. Error: ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Comment("");
   Print("${meta.patternName} Pattern EA stopped.");
}

// ============================================
// DEPLOYMENT INSTRUCTIONS
// ============================================
//
// 1. Open MetaTrader 4 → MetaEditor
// 2. File → New → Expert Advisor
// 3. Paste this code and compile (F7)
// 4. Drag EA onto ${meta.instrument} chart
// 5. EA will auto-enter at current market price
// 6. SL/TP calculated to maintain ${meta.rr}:1 R:R
//
// IMPORTANT:
// - Set "Allow live trading" in EA properties
// - If SL was breached, you'll see alert - decide if still valid
// - Adjust RiskPercent to control position size
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;
}

// ============================================
// MT5 EA GENERATOR
// ============================================

function generateMT5PatternScript(
  meta: ScriptMeta,
  useMarketEntry: boolean,
  showBreachWarning: boolean
): string {
  const isLong = meta.direction === 'Long';
  
  return `//+------------------------------------------------------------------+
//|                    ${meta.patternName.replace(/\s+/g, '_')}_${meta.instrument}.mq5 |
//|                    Pattern Trade Script - ChartingPath            |
//+------------------------------------------------------------------+
#property copyright "ChartingPath Pattern Exporter"
#property version   "1.00"

#include <Trade\\Trade.mqh>

// ============================================
// ${meta.patternName.toUpperCase()} PATTERN TRADE
// ============================================
// Instrument: ${meta.instrument}
// Direction: ${meta.direction}
// Quality Score: ${meta.qualityScore}
// Detected: ${meta.detectedAt}
// ============================================

// === ORIGINAL PATTERN LEVELS ===
const double ORIGINAL_ENTRY = ${meta.originalEntry.toFixed(5)};
const double ORIGINAL_SL = ${meta.originalSL.toFixed(5)};
const double ORIGINAL_TP = ${meta.originalTP.toFixed(5)};
const double ORIGINAL_STOP_DISTANCE = ${meta.stopDistance.toFixed(5)};

// === INPUTS ===
input double RiskPercent = 1.0;           // Risk per trade (%)
input double TargetRR = ${meta.rr};       // Risk:Reward ratio
input bool UseMarketEntry = ${useMarketEntry ? 'true' : 'false'};     // Enter at market vs original
input bool ShowBreachWarning = ${showBreachWarning ? 'true' : 'false'};  // Show SL breach warning
input ulong MagicNumber = ${Math.floor(Math.random() * 900000) + 100000};

// === OBJECTS ===
CTrade trade;
bool entryExecuted = false;
bool breachWarningShown = false;

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_IOC);
   
   Print("${meta.patternName} Pattern EA initialized");
   Print("Original Entry: ", ORIGINAL_ENTRY, " SL: ", ORIGINAL_SL, " TP: ", ORIGINAL_TP);
   
   // Check for SL breach
   if(ShowBreachWarning)
   {
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      
      ${isLong ? `
      if(bid < ORIGINAL_SL)
      {
         Alert("⚠️ WARNING: Stop Loss was already breached! Original SL: ", ORIGINAL_SL, " Current Bid: ", bid);
         Comment("⚠️ SL BREACHED - Proceed with caution");
         breachWarningShown = true;
      }
      ` : `
      if(ask > ORIGINAL_SL)
      {
         Alert("⚠️ WARNING: Stop Loss was already breached! Original SL: ", ORIGINAL_SL, " Current Ask: ", ask);
         Comment("⚠️ SL BREACHED - Proceed with caution");
         breachWarningShown = true;
      }
      `}
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Calculate dynamic levels                                          |
//+------------------------------------------------------------------+
void CalculateDynamicLevels(double &entry, double &sl, double &tp)
{
   int atrHandle = iATR(_Symbol, PERIOD_CURRENT, 14);
   double atrBuffer[];
   ArraySetAsSeries(atrBuffer, true);
   CopyBuffer(atrHandle, 0, 1, 1, atrBuffer);
   double atr = atrBuffer[0];
   IndicatorRelease(atrHandle);
   
   double stopDistance = atr * 2;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   if(UseMarketEntry)
   {
      ${isLong ? `
      entry = ask;
      sl = entry - stopDistance;
      tp = entry + (stopDistance * TargetRR);
      ` : `
      entry = bid;
      sl = entry + stopDistance;
      tp = entry - (stopDistance * TargetRR);
      `}
   }
   else
   {
      entry = ORIGINAL_ENTRY;
      sl = ORIGINAL_SL;
      tp = ORIGINAL_TP;
   }
}

//+------------------------------------------------------------------+
//| Calculate lot size                                                |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopDistance)
{
   double riskAmount = AccountInfoDouble(ACCOUNT_BALANCE) * (RiskPercent / 100.0);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double stopPoints = stopDistance / tickSize;
   
   if(stopPoints <= 0 || tickValue <= 0) return SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   
   double lots = riskAmount / (stopPoints * tickValue);
   lots = NormalizeDouble(lots, 2);
   lots = MathMax(lots, SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN));
   lots = MathMin(lots, SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX));
   
   return lots;
}

//+------------------------------------------------------------------+
//| Check existing positions                                          |
//+------------------------------------------------------------------+
int CountPositions()
{
   int count = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      if(PositionGetSymbol(i) == _Symbol)
         if(PositionGetInteger(POSITION_MAGIC) == MagicNumber)
            count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   if(entryExecuted) return;
   if(CountPositions() > 0) return;
   
   double entry, sl, tp;
   CalculateDynamicLevels(entry, sl, tp);
   
   double stopDistance = MathAbs(entry - sl);
   double lots = CalculateLotSize(stopDistance);
   
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, digits);
   tp = NormalizeDouble(tp, digits);
   
   bool result = false;
   ${isLong ? `
   result = trade.Buy(lots, _Symbol, 0, sl, tp, "${meta.patternName} Long");
   ` : `
   result = trade.Sell(lots, _Symbol, 0, sl, tp, "${meta.patternName} Short");
   `}
   
   if(result)
   {
      Print("✅ ${meta.patternName} trade opened successfully");
      Print("Entry: ", entry, " SL: ", sl, " TP: ", tp, " R:R: 1:", TargetRR);
      entryExecuted = true;
   }
   else
   {
      Print("❌ Trade failed. Error: ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Comment("");
   Print("${meta.patternName} Pattern EA stopped.");
}

// ============================================
// DEPLOYMENT INSTRUCTIONS
// ============================================
//
// 1. Open MetaTrader 5 → MetaEditor
// 2. File → New → Expert Advisor
// 3. Paste this code and compile (F7)
// 4. Drag EA onto ${meta.instrument} chart
// 5. EA auto-enters at current market price
// 6. SL/TP maintains ${meta.rr}:1 R:R ratio
//
// IMPORTANT:
// - Enable "Allow Algo Trading" in MT5 settings
// - If SL breached, you'll see warning - decide if still valid
// - Adjust RiskPercent in inputs
//
// DISCLAIMER: Educational use only. Not financial advice.
// ============================================
`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatPatternName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get script file extension for platform
 */
export function getScriptExtension(platform: ExportPlatform): string {
  switch (platform) {
    case 'pine': return '.pine';
    case 'mt4': return '.mq4';
    case 'mt5': return '.mq5';
  }
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: ExportPlatform): string {
  switch (platform) {
    case 'pine': return 'TradingView Pine Script v5';
    case 'mt4': return 'MetaTrader 4 EA';
    case 'mt5': return 'MetaTrader 5 EA';
  }
}
