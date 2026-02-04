/**
 * Pattern Script Exporter
 * 
 * Generates executable trading scripts from detected patterns for:
 * - TradingView (Pine Script v5)
 * - MetaTrader 4 (MQL4)
 * - MetaTrader 5 (MQL5)
 * 
 * EXECUTION CONTRACT:
 * - Entry: Market price at deployment (not stale detection price)
 * - SL/TP: Dynamically recalculated to maintain original R:R ratio
 * - SL Breach: Warning displayed if original SL was violated before entry
 */

export interface PatternExportData {
  patternName: string;
  patternId: string;
  instrument: string;
  timeframe: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
  atrValue: number;
  detectedAt: string;
  qualityScore: string;
}

export type ScriptType = 'strategy' | 'indicator';

// ============================================================================
// PINE SCRIPT v5 GENERATOR
// ============================================================================

export function generatePineScriptV5(
  data: PatternExportData,
  type: ScriptType = 'strategy'
): string {
  const isLong = data.direction === 'long';
  const escapedName = data.patternName.replace(/['"]/g, '');
  
  const header = `// ════════════════════════════════════════════════════════════════════════════
// ${escapedName} - Auto-Generated from Pattern Detection
// ════════════════════════════════════════════════════════════════════════════
// Instrument: ${data.instrument} | Timeframe: ${data.timeframe}
// Direction: ${data.direction.toUpperCase()} | Quality: ${data.qualityScore}
// Original R:R Target: 1:${data.riskRewardRatio}
// Generated: ${new Date().toISOString()}
// 
// EXECUTION NOTES:
// - Entry executes at CURRENT price (not detection price)
// - SL/TP recalculated to maintain ${data.riskRewardRatio}:1 R:R ratio
// - Warning shown if original SL was breached before deployment
// ════════════════════════════════════════════════════════════════════════════

//@version=5`;

  if (type === 'strategy') {
    return `${header}
strategy("${escapedName}", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=2)

// ─── INPUTS ─────────────────────────────────────────────────────────────────
riskPercent = input.float(2.0, "Risk Per Trade %", minval=0.1, maxval=10, step=0.1)
targetRR = input.float(${data.riskRewardRatio}, "Target R:R Ratio", minval=1, maxval=10, step=0.5)
useATRStop = input.bool(true, "Use ATR-Based Stop")
atrMultiplier = input.float(2.0, "ATR Multiplier", minval=0.5, maxval=5)
maxBarsInTrade = input.int(100, "Max Bars in Trade", minval=10, maxval=500)

// ─── PATTERN DATA ───────────────────────────────────────────────────────────
string direction = "${data.direction}"
bool isLong = direction == "long"
float originalEntry = ${data.entryPrice}
float originalSL = ${data.stopLossPrice}
float originalTP = ${data.takeProfitPrice}
float patternATR = ${data.atrValue}

// ─── DYNAMIC ENTRY CALCULATION ──────────────────────────────────────────────
// Entry at current market price, SL/TP recalculated to preserve R:R
atr = ta.atr(14)
stopDistance = useATRStop ? atr * atrMultiplier : math.abs(originalEntry - originalSL)

entryPrice = close
stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance
takeProfit = isLong ? entryPrice + (stopDistance * targetRR) : entryPrice - (stopDistance * targetRR)

// ─── SL BREACH DETECTION ────────────────────────────────────────────────────
// Check if original SL was violated before script deployment
slBreached = isLong ? low < originalSL : high > originalSL
var bool warningShown = false

if slBreached and not warningShown
    label.new(bar_index, high, "⚠️ Original SL was breached before entry", 
              color=color.orange, textcolor=color.white, style=label.style_label_down)
    warningShown := true

// ─── ENTRY SIGNAL ───────────────────────────────────────────────────────────
// One-time entry on first bar after script loads
var bool hasEntered = false
enterLong = isLong and not hasEntered and barstate.isconfirmed
enterShort = not isLong and not hasEntered and barstate.isconfirmed

if enterLong
    strategy.entry("Long", strategy.long)
    strategy.exit("Exit Long", "Long", stop=stopLoss, limit=takeProfit)
    hasEntered := true

if enterShort
    strategy.entry("Short", strategy.short)
    strategy.exit("Exit Short", "Short", stop=stopLoss, limit=takeProfit)
    hasEntered := true

// ─── TIME STOP ──────────────────────────────────────────────────────────────
barsInTrade = strategy.position_size != 0 ? bar_index - strategy.opentrades.entry_bar_index(0) : 0
if barsInTrade >= maxBarsInTrade and strategy.position_size != 0
    strategy.close_all("Time Stop")

// ─── VISUALIZATION ──────────────────────────────────────────────────────────
plot(strategy.position_size != 0 ? stopLoss : na, "Stop Loss", color.red, 2, plot.style_linebr)
plot(strategy.position_size != 0 ? takeProfit : na, "Take Profit", color.green, 2, plot.style_linebr)

// Original levels (dashed)
plot(originalSL, "Original SL", color.new(color.red, 70), 1, plot.style_circles)
plot(originalTP, "Original TP", color.new(color.green, 70), 1, plot.style_circles)

bgcolor(slBreached ? color.new(color.orange, 90) : na)
`;
  } else {
    // Indicator version
    return `${header}
indicator("${escapedName}", overlay=true)

// ─── PATTERN DATA ───────────────────────────────────────────────────────────
string direction = "${data.direction}"
bool isLong = direction == "long"
float originalEntry = ${data.entryPrice}
float originalSL = ${data.stopLossPrice}
float originalTP = ${data.takeProfitPrice}
float targetRR = ${data.riskRewardRatio}

// ─── DYNAMIC LEVELS ─────────────────────────────────────────────────────────
atr = ta.atr(14)
stopDistance = atr * 2
currentEntry = close
dynamicSL = isLong ? currentEntry - stopDistance : currentEntry + stopDistance
dynamicTP = isLong ? currentEntry + (stopDistance * targetRR) : currentEntry - (stopDistance * targetRR)

// ─── SL BREACH CHECK ────────────────────────────────────────────────────────
slBreached = isLong ? low < originalSL : high > originalSL

// ─── VISUALIZATION ──────────────────────────────────────────────────────────
// Original levels
hline(originalEntry, "Detection Entry", color.blue, hline.style_dashed)
hline(originalSL, "Original SL", color.red, hline.style_dashed)
hline(originalTP, "Original TP", color.green, hline.style_dashed)

// Dynamic levels
plot(dynamicSL, "Dynamic SL", color.red, 2)
plot(dynamicTP, "Dynamic TP", color.green, 2)

// Entry zone
upperZone = originalEntry * 1.005
lowerZone = originalEntry * 0.995
bgcolor(close > lowerZone and close < upperZone ? color.new(color.blue, 90) : na)

// Warning
plotshape(slBreached, "SL Breach Warning", shape.xcross, location.abovebar, color.orange, size=size.small)

// Info table
var table infoTable = table.new(position.top_right, 2, 5, bgcolor=color.new(color.gray, 80))
if barstate.islast
    table.cell(infoTable, 0, 0, "Pattern", text_color=color.white)
    table.cell(infoTable, 1, 0, "${escapedName}", text_color=color.white)
    table.cell(infoTable, 0, 1, "Direction", text_color=color.white)
    table.cell(infoTable, 1, 1, "${data.direction.toUpperCase()}", text_color=isLong ? color.green : color.red)
    table.cell(infoTable, 0, 2, "R:R Target", text_color=color.white)
    table.cell(infoTable, 1, 2, "1:${data.riskRewardRatio}", text_color=color.white)
    table.cell(infoTable, 0, 3, "Quality", text_color=color.white)
    table.cell(infoTable, 1, 3, "${data.qualityScore}", text_color=color.yellow)
    table.cell(infoTable, 0, 4, "SL Status", text_color=color.white)
    table.cell(infoTable, 1, 4, slBreached ? "⚠️ BREACHED" : "✅ INTACT", text_color=slBreached ? color.orange : color.green)
`;
  }
}

// ============================================================================
// MQL4 GENERATOR
// ============================================================================

export function generateMQL4(data: PatternExportData): string {
  const isLong = data.direction === 'long';
  const escapedName = data.patternName.replace(/['"]/g, '');
  const orderType = isLong ? 'OP_BUY' : 'OP_SELL';
  
  return `//+------------------------------------------------------------------+
//| ${escapedName} EA - Auto-Generated
//| Pattern: ${data.patternName}
//| Instrument: ${data.instrument} | Timeframe: ${data.timeframe}
//| Direction: ${data.direction} | Quality: ${data.qualityScore}
//| Generated: ${new Date().toISOString()}
//+------------------------------------------------------------------+
#property copyright "Pattern Forge Export"
#property link      "https://patternforge.com"
#property version   "1.00"
#property strict

// ─── PATTERN DATA ───────────────────────────────────────────────────────────
string direction = "${data.direction}";
double originalEntry = ${data.entryPrice};
double originalSL = ${data.stopLossPrice};
double originalTP = ${data.takeProfitPrice};
double targetRR = ${data.riskRewardRatio};
double patternATR = ${data.atrValue};

// ─── INPUTS ─────────────────────────────────────────────────────────────────
input double RiskPercent = 2.0;      // Risk per trade %
input int    ATRPeriod = 14;         // ATR period
input double ATRMultiplier = 2.0;    // ATR multiplier for SL
input int    MaxBarsInTrade = 100;   // Max bars before time stop
input int    MagicNumber = 123456;   // EA magic number
input int    Slippage = 3;           // Max slippage in pips

// ─── GLOBALS ────────────────────────────────────────────────────────────────
bool hasEntered = false;
bool warningShown = false;
int entryBar = 0;

//+------------------------------------------------------------------+
//| Expert initialization                                              |
//+------------------------------------------------------------------+
int OnInit() {
   Print("${escapedName} EA initialized");
   Print("Direction: ", direction, " | R:R Target: 1:", targetRR);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                            |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   Print("${escapedName} EA removed");
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick() {
   // ─── SL BREACH CHECK ──────────────────────────────────────────────
   bool slBreached = false;
   if(direction == "long") {
      slBreached = Low[0] < originalSL;
   } else {
      slBreached = High[0] > originalSL;
   }
   
   if(slBreached && !warningShown) {
      Alert("⚠️ ${escapedName}: Original SL was breached before entry!");
      warningShown = true;
   }
   
   // ─── ENTRY LOGIC ──────────────────────────────────────────────────
   if(!hasEntered && OrdersTotal() == 0) {
      double atr = iATR(Symbol(), PERIOD_CURRENT, ATRPeriod, 0);
      double stopDistance = atr * ATRMultiplier;
      
      double entryPrice, stopLoss, takeProfit;
      
      if(direction == "long") {
         entryPrice = Ask;
         stopLoss = NormalizeDouble(entryPrice - stopDistance, Digits);
         takeProfit = NormalizeDouble(entryPrice + (stopDistance * targetRR), Digits);
         
         int ticket = OrderSend(Symbol(), ${orderType}, CalculateLotSize(stopDistance), 
                                entryPrice, Slippage, stopLoss, takeProfit, 
                                "${escapedName}", MagicNumber, 0, clrGreen);
         if(ticket > 0) {
            hasEntered = true;
            entryBar = Bars;
            Print("Long entry: ", entryPrice, " SL: ", stopLoss, " TP: ", takeProfit);
         }
      } else {
         entryPrice = Bid;
         stopLoss = NormalizeDouble(entryPrice + stopDistance, Digits);
         takeProfit = NormalizeDouble(entryPrice - (stopDistance * targetRR), Digits);
         
         int ticket = OrderSend(Symbol(), OP_SELL, CalculateLotSize(stopDistance), 
                                entryPrice, Slippage, stopLoss, takeProfit, 
                                "${escapedName}", MagicNumber, 0, clrRed);
         if(ticket > 0) {
            hasEntered = true;
            entryBar = Bars;
            Print("Short entry: ", entryPrice, " SL: ", stopLoss, " TP: ", takeProfit);
         }
      }
   }
   
   // ─── TIME STOP ────────────────────────────────────────────────────
   if(hasEntered && OrdersTotal() > 0) {
      int barsInTrade = Bars - entryBar;
      if(barsInTrade >= MaxBarsInTrade) {
         for(int i = OrdersTotal() - 1; i >= 0; i--) {
            if(OrderSelect(i, SELECT_BY_POS) && OrderMagicNumber() == MagicNumber) {
               if(OrderType() == OP_BUY) {
                  OrderClose(OrderTicket(), OrderLots(), Bid, Slippage, clrYellow);
               } else if(OrderType() == OP_SELL) {
                  OrderClose(OrderTicket(), OrderLots(), Ask, Slippage, clrYellow);
               }
               Print("Time stop triggered after ", barsInTrade, " bars");
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk %                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopDistance) {
   double riskAmount = AccountBalance() * (RiskPercent / 100);
   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize = MarketInfo(Symbol(), MODE_TICKSIZE);
   double lotSize = riskAmount / ((stopDistance / tickSize) * tickValue);
   
   double minLot = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
   
   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   lotSize = MathMax(minLot, MathMin(maxLot, lotSize));
   
   return lotSize;
}
//+------------------------------------------------------------------+
`;
}

// ============================================================================
// MQL5 GENERATOR
// ============================================================================

export function generateMQL5(data: PatternExportData): string {
  const isLong = data.direction === 'long';
  const escapedName = data.patternName.replace(/['"]/g, '');
  
  return `//+------------------------------------------------------------------+
//| ${escapedName} EA - Auto-Generated
//| Pattern: ${data.patternName}
//| Instrument: ${data.instrument} | Timeframe: ${data.timeframe}
//| Direction: ${data.direction} | Quality: ${data.qualityScore}
//| Generated: ${new Date().toISOString()}
//+------------------------------------------------------------------+
#property copyright "Pattern Forge Export"
#property link      "https://patternforge.com"
#property version   "1.00"

#include <Trade/Trade.mqh>

// ─── PATTERN DATA ───────────────────────────────────────────────────────────
string direction = "${data.direction}";
double originalEntry = ${data.entryPrice};
double originalSL = ${data.stopLossPrice};
double originalTP = ${data.takeProfitPrice};
double targetRR = ${data.riskRewardRatio};
double patternATR = ${data.atrValue};

// ─── INPUTS ─────────────────────────────────────────────────────────────────
input double RiskPercent = 2.0;      // Risk per trade %
input int    ATRPeriod = 14;         // ATR period
input double ATRMultiplier = 2.0;    // ATR multiplier for SL
input int    MaxBarsInTrade = 100;   // Max bars before time stop
input ulong  MagicNumber = 123456;   // EA magic number
input ulong  Slippage = 30;          // Max slippage in points

// ─── GLOBALS ────────────────────────────────────────────────────────────────
CTrade trade;
bool hasEntered = false;
bool warningShown = false;
datetime entryTime = 0;
int atrHandle;

//+------------------------------------------------------------------+
//| Expert initialization                                              |
//+------------------------------------------------------------------+
int OnInit() {
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(Slippage);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   atrHandle = iATR(_Symbol, PERIOD_CURRENT, ATRPeriod);
   if(atrHandle == INVALID_HANDLE) {
      Print("Failed to create ATR indicator");
      return(INIT_FAILED);
   }
   
   Print("${escapedName} EA initialized");
   Print("Direction: ", direction, " | R:R Target: 1:", targetRR);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                            |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   IndicatorRelease(atrHandle);
   Print("${escapedName} EA removed");
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick() {
   // ─── SL BREACH CHECK ──────────────────────────────────────────────
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, PERIOD_CURRENT, 0, 1, rates) < 1) return;
   
   bool slBreached = false;
   if(direction == "long") {
      slBreached = rates[0].low < originalSL;
   } else {
      slBreached = rates[0].high > originalSL;
   }
   
   if(slBreached && !warningShown) {
      Alert("⚠️ ${escapedName}: Original SL was breached before entry!");
      warningShown = true;
   }
   
   // ─── ENTRY LOGIC ──────────────────────────────────────────────────
   if(!hasEntered && PositionsTotal() == 0) {
      double atrBuffer[];
      ArraySetAsSeries(atrBuffer, true);
      if(CopyBuffer(atrHandle, 0, 0, 1, atrBuffer) < 1) return;
      
      double atr = atrBuffer[0];
      double stopDistance = atr * ATRMultiplier;
      
      double entryPrice, stopLoss, takeProfit;
      double lotSize = CalculateLotSize(stopDistance);
      
      if(direction == "long") {
         entryPrice = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         stopLoss = NormalizeDouble(entryPrice - stopDistance, _Digits);
         takeProfit = NormalizeDouble(entryPrice + (stopDistance * targetRR), _Digits);
         
         if(trade.Buy(lotSize, _Symbol, entryPrice, stopLoss, takeProfit, "${escapedName}")) {
            hasEntered = true;
            entryTime = TimeCurrent();
            Print("Long entry: ", entryPrice, " SL: ", stopLoss, " TP: ", takeProfit);
         }
      } else {
         entryPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         stopLoss = NormalizeDouble(entryPrice + stopDistance, _Digits);
         takeProfit = NormalizeDouble(entryPrice - (stopDistance * targetRR), _Digits);
         
         if(trade.Sell(lotSize, _Symbol, entryPrice, stopLoss, takeProfit, "${escapedName}")) {
            hasEntered = true;
            entryTime = TimeCurrent();
            Print("Short entry: ", entryPrice, " SL: ", stopLoss, " TP: ", takeProfit);
         }
      }
   }
   
   // ─── TIME STOP ────────────────────────────────────────────────────
   if(hasEntered && PositionsTotal() > 0) {
      int barsInTrade = Bars(_Symbol, PERIOD_CURRENT, entryTime, TimeCurrent());
      if(barsInTrade >= MaxBarsInTrade) {
         for(int i = PositionsTotal() - 1; i >= 0; i--) {
            ulong ticket = PositionGetTicket(i);
            if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == MagicNumber) {
               trade.PositionClose(ticket);
               Print("Time stop triggered after ", barsInTrade, " bars");
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk %                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopDistance) {
   double riskAmount = AccountInfoDouble(ACCOUNT_BALANCE) * (RiskPercent / 100);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double lotSize = riskAmount / ((stopDistance / tickSize) * tickValue);
   
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   lotSize = MathMax(minLot, MathMin(maxLot, lotSize));
   
   return lotSize;
}
//+------------------------------------------------------------------+
`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getScriptFileExtension(platform: 'pine' | 'mql4' | 'mql5'): string {
  switch (platform) {
    case 'pine': return '.pine';
    case 'mql4': return '.mq4';
    case 'mql5': return '.mq5';
  }
}

export function getScriptMimeType(platform: 'pine' | 'mql4' | 'mql5'): string {
  return 'text/plain';
}
