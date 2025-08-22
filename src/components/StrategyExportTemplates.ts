export interface ExportTemplate {
  generateCode: (strategy: any, timeframe?: string, confirmTimeframe?: string) => string;
  generateReadme: (strategy: any) => string;
}

export const EXPORT_TEMPLATES = {
  "TradingView - Pine Script v6": {
    generateCode: (strategy: any, timeframe = "1H") => {
      const getIndicatorCode = (indicators: string[]) => {
        let code = '';
        let entryLogic = '';
        let exitLogic = '';
        
        if (indicators.includes('MACD')) {
          code += `// MACD Indicator
[macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
`;
          entryLogic += `ta.crossover(macdLine, signalLine) and histLine > 0`;
          exitLogic += `ta.crossunder(macdLine, signalLine)`;
        }
        
        if (indicators.includes('RSI')) {
          code += `// RSI Indicator
rsiValue = ta.rsi(close, 14)
`;
          if (entryLogic) entryLogic += ` and `;
          entryLogic += `rsiValue < 70 and rsiValue > 30`;
          if (exitLogic) exitLogic += ` or `;
          exitLogic += `rsiValue > 80 or rsiValue < 20`;
        }
        
        if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
          code += `// Moving Average
ema20 = ta.ema(close, 20)
ema50 = ta.ema(close, 50)
`;
          if (entryLogic) entryLogic += ` and `;
          entryLogic += `close > ema20 and ema20 > ema50`;
          if (exitLogic) exitLogic += ` or `;
          exitLogic += `close < ema20`;
        }
        
        if (indicators.includes('Bollinger Bands')) {
          code += `// Bollinger Bands
[bbUpper, bbMiddle, bbLower] = ta.bb(close, 20, 2)
`;
          if (entryLogic) entryLogic += ` and `;
          entryLogic += `close < bbLower`;
          if (exitLogic) exitLogic += ` or `;
          exitLogic += `close > bbUpper`;
        }
        
        if (indicators.includes('Stochastic')) {
          code += `// Stochastic
[stochK, stochD] = ta.stoch(close, high, low, 14)
`;
          if (entryLogic) entryLogic += ` and `;
          entryLogic += `ta.crossover(stochK, stochD) and stochK < 80`;
          if (exitLogic) exitLogic += ` or `;
          exitLogic += `stochK > 80`;
        }
        
        if (indicators.includes('Volume')) {
          code += `// Volume
volumeMA = ta.sma(volume, 20)
`;
          if (entryLogic) entryLogic += ` and `;
          entryLogic += `volume > volumeMA * 1.2`;
        }
        
        // VPT specific logic
        if (indicators.includes('VPT') || strategy.name.includes('Volume Price Trend')) {
          code += `// Volume Price Trend (VPT)
var float vptRaw = na
vptRaw := nz(vptRaw[1]) + (close - close[1]) / nz(close[1], close) * volume
vpt = ta.ema(vptRaw, 20)
vptSig = ta.ema(vpt, 20)
vptSlope = vpt - nz(vpt[5])
`;
          entryLogic = `ta.crossover(vpt, vptSig) and vptSlope > 0`;
          exitLogic = `ta.crossunder(vpt, vptSig) or vptSlope < 0`;
        }
        
        // Default fallback if no recognized indicators
        if (!entryLogic) {
          entryLogic = `close > ta.ema(close, 20) and ta.rsi(close, 14) < 70`;
          exitLogic = `close < ta.ema(close, 20) or ta.rsi(close, 14) > 80`;
        }
        
        return { code, entryLogic, exitLogic };
      };
      
      const indicatorData = getIndicatorCode(strategy.indicators || []);
      
      return `
//@version=6
strategy("${strategy.name} — Ready to Use",
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

// Strategy specific inputs
${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `${key} = input.float(${value}, "${key.charAt(0).toUpperCase() + key.slice(1)}")`
).join('\n') : '// Strategy inputs will be added here'}

//=== Helper: ATR ===
atr = ta.atr(atrLen)

${indicatorData.code}

//=== Entry Conditions ===
// Based on: ${strategy.entry}
longCond  = enableLongs and (${indicatorData.entryLogic})
shortCond = enableShorts and (${indicatorData.exitLogic})

//=== Order sizing and exits ===
longSL = useATR ? close - atrSLmult * atr : close * (1 - slPct/100.0)
longTP = useATR ? close + atrTPmult * atr : close * (1 + tpPct/100.0)

shortSL = useATR ? close + atrSLmult * atr : close * (1 + slPct/100.0)
shortTP = useATR ? close - atrTPmult * atr : close * (1 - tpPct/100.0)

//=== Entries & Exits ===
if (longCond)
    strategy.entry("Long", strategy.long)
if (strategy.position_size > 0)
    strategy.exit("Long Exit", "Long", stop=longSL, limit=longTP)

if (shortCond)
    strategy.entry("Short", strategy.short)
if (strategy.position_size < 0)
    strategy.exit("Short Exit", "Short", stop=shortSL, limit=shortTP)

//=== Plots ===${strategy.indicators?.includes('EMA') || strategy.indicators?.includes('Moving Average') ? `
plot(ema20, "EMA 20", color=color.new(color.blue, 0))
plot(ema50, "EMA 50", color=color.new(color.orange, 0))` : ''}${strategy.indicators?.includes('Bollinger Bands') ? `
plot(bbUpper, "BB Upper", color=color.new(color.gray, 50))
plot(bbMiddle, "BB Middle", color=color.new(color.gray, 50))
plot(bbLower, "BB Lower", color=color.new(color.gray, 50))` : ''}${strategy.indicators?.includes('VPT') || strategy.name.includes('Volume Price Trend') ? `
plot(vpt, "VPT", color=color.new(color.teal, 0))
plot(vptSig, "VPT Signal", color=color.new(color.orange, 0))
hline(0, "Zero", color=color.new(color.gray, 80))` : ''}

plotshape(longCond,  title="Long Signal",  style=shape.triangleup,   color=color.new(color.green,0),
          location=location.belowbar, size=size.tiny, text="LONG")
plotshape(shortCond, title="Short Signal", style=shape.triangledown, color=color.new(color.red,0),
          location=location.abovebar, size=size.tiny, text="SHORT")

bgcolor(strategy.position_size > 0 ? color.new(color.green, 92) :
       strategy.position_size < 0 ? color.new(color.red, 92) : na)

//=== Alerts ===
alertcondition(longCond,  title="${strategy.name} Long",  message="${strategy.name} LONG: {{ticker}} {{interval}}")
alertcondition(shortCond, title="${strategy.name} Short", message="${strategy.name} SHORT: {{ticker}} {{interval}}")

if longCond
    alert("${strategy.name} LONG", alert.freq_once_per_bar)
if shortCond
    alert("${strategy.name} SHORT", alert.freq_once_per_bar)
`;
    },
    generateReadme: (strategy: any) => `
# ${strategy.name} - TradingView Pine Script v6

## Installation Instructions
1. Open TradingView and go to the Pine Editor
2. Delete the default code and paste the provided Pine Script
3. Click "Add to Chart" 
4. Configure the input parameters as needed
5. Set up alerts if desired

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

## Important Notes
- This is a working strategy with actual indicator calculations
- Test thoroughly on historical data before live trading
- Always use proper risk management
- Adjust parameters based on your risk tolerance
`
  },

  "MetaTrader 4 - MQL4": {
    generateCode: (strategy: any, timeframe = "PERIOD_H1") => {
      const getIndicatorLogic = (indicators: string[]) => {
        let variables = '';
        let calculations = '';
        let entryLogic = '';
        let exitLogic = '';
        
        if (indicators.includes('MACD')) {
          calculations += `   double macd = iMACD(Symbol(), 0, 12, 26, 9, PRICE_CLOSE, MODE_MAIN, 0);
   double macdSignal = iMACD(Symbol(), 0, 12, 26, 9, PRICE_CLOSE, MODE_SIGNAL, 0);
`;
          entryLogic += `macd > macdSignal`;
          exitLogic += `macd < macdSignal`;
        }
        
        if (indicators.includes('RSI')) {
          calculations += `   double rsi = iRSI(Symbol(), 0, 14, PRICE_CLOSE, 0);
`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `rsi > 30 && rsi < 70`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `rsi > 80 || rsi < 20`;
        }
        
        if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
          calculations += `   double ema20 = iMA(Symbol(), 0, 20, 0, MODE_EMA, PRICE_CLOSE, 0);
   double ema50 = iMA(Symbol(), 0, 50, 0, MODE_EMA, PRICE_CLOSE, 0);
`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `Close[0] > ema20 && ema20 > ema50`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `Close[0] < ema20`;
        }
        
        if (indicators.includes('Bollinger Bands')) {
          calculations += `   double bbUpper = iBands(Symbol(), 0, 20, 2, 0, PRICE_CLOSE, MODE_UPPER, 0);
   double bbLower = iBands(Symbol(), 0, 20, 2, 0, PRICE_CLOSE, MODE_LOWER, 0);
`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `Close[0] < bbLower`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `Close[0] > bbUpper`;
        }
        
        if (!entryLogic) {
          calculations += `   double ema20 = iMA(Symbol(), 0, 20, 0, MODE_EMA, PRICE_CLOSE, 0);
   double rsi = iRSI(Symbol(), 0, 14, PRICE_CLOSE, 0);
`;
          entryLogic = `Close[0] > ema20 && rsi > 30 && rsi < 70`;
          exitLogic = `Close[0] < ema20 || rsi > 80 || rsi < 20`;
        }
        
        return { variables, calculations, entryLogic, exitLogic };
      };
      
      const logic = getIndicatorLogic(strategy.indicators || []);
      
      return `
//+------------------------------------------------------------------+
//|                            ${strategy.name.replace(/[^a-zA-Z0-9]/g, '_')}.mq4 |
//|                      ${strategy.name} - Ready to Use EA           |
//+------------------------------------------------------------------+
#property copyright "Educational Template"
#property link      ""
#property version   "1.00"
#property strict

// Strategy: ${strategy.name}
// Difficulty: ${strategy.difficulty}
// Risk:Reward: ${strategy.riskReward}
// Success Rate: ${strategy.successRate}

// External parameters
extern double LotSize = 0.1;       // Lot size
extern double StopLoss = 50;       // Stop loss in points
extern double TakeProfit = 150;    // Take profit in points
extern bool EnableLongs = true;    // Enable long positions
extern bool EnableShorts = true;   // Enable short positions
extern int MagicNumber = 12345;    // Magic number

${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `extern double ${key} = ${value}; // ${key}`
).join('\n') : ''}

// Global variables
${logic.variables}
int lastBarTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("${strategy.name} EA Initialized");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("${strategy.name} EA Deinitialized");
}

//+------------------------------------------------------------------+
//| Check if new bar                                                 |
//+------------------------------------------------------------------+
bool IsNewBar()
{
   if(lastBarTime != Time[0])
   {
      lastBarTime = Time[0];
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |  
//+------------------------------------------------------------------+
void OnTick()
{
   if(!IsNewBar()) return; // Only trade on new bar
   
   // Calculate indicators
${logic.calculations}
   
   // Entry Conditions based on: ${strategy.entry}
   bool longCondition = EnableLongs && (${logic.entryLogic});
   bool shortCondition = EnableShorts && (${logic.exitLogic});
   
   // Check for open positions
   int totalOrders = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS) && OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
         totalOrders++;
   }
   
   // Entry logic
   if(longCondition && totalOrders == 0)
   {
      double sl = StopLoss > 0 ? Ask - StopLoss * Point : 0;
      double tp = TakeProfit > 0 ? Ask + TakeProfit * Point : 0;
      
      int ticket = OrderSend(Symbol(), OP_BUY, LotSize, Ask, 3, sl, tp, 
                            "${strategy.name} Long", MagicNumber, 0, clrGreen);
      if(ticket > 0)
         Print("Long position opened at ", Ask);
   }
   
   if(shortCondition && totalOrders == 0)
   {
      double sl = StopLoss > 0 ? Bid + StopLoss * Point : 0;
      double tp = TakeProfit > 0 ? Bid - TakeProfit * Point : 0;
      
      int ticket = OrderSend(Symbol(), OP_SELL, LotSize, Bid, 3, sl, tp,
                            "${strategy.name} Short", MagicNumber, 0, clrRed);
      if(ticket > 0)
         Print("Short position opened at ", Bid);
   }
   
   // Exit logic based on: ${strategy.exit}
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS) && OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
      {
         bool shouldClose = false;
         
         if(OrderType() == OP_BUY && (${logic.exitLogic}))
            shouldClose = true;
         if(OrderType() == OP_SELL && (${logic.entryLogic}))
            shouldClose = true;
            
         if(shouldClose)
         {
            bool result = OrderClose(OrderTicket(), OrderLots(), 
                                   OrderType() == OP_BUY ? Bid : Ask, 3, clrYellow);
            if(result)
               Print("Position closed by signal");
         }
      }
   }
}
`;
    },
    generateReadme: (strategy: any) => `
# ${strategy.name} - MetaTrader 4 Expert Advisor

## Installation Instructions
1. Copy the .mq4 file to your MetaTrader 4/MQL4/Experts folder
2. Restart MetaTrader 4 or refresh the Expert Advisors list
3. Drag the EA onto your chart
4. Configure the input parameters
5. Enable automated trading and allow DLL imports if needed

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

## Important Notes
- This is a working EA with actual indicator calculations
- Test thoroughly in Strategy Tester before live trading
- Always use proper risk management and position sizing
- Adjust StopLoss and TakeProfit parameters based on your risk tolerance
`
  },

  "MetaTrader 5 - MQL5": {
    generateCode: (strategy: any, timeframe = "PERIOD_H1") => {
      const getIndicatorLogic = (indicators: string[]) => {
        let handles = '';
        let calculations = '';
        let entryLogic = '';
        let exitLogic = '';
        
        if (indicators.includes('MACD')) {
          handles += `   macdHandle = iMACD(Symbol(), PERIOD_CURRENT, 12, 26, 9, PRICE_CLOSE);
`;
          calculations += `   double macdMain[], macdSignal[];
   if(CopyBuffer(macdHandle, 0, 0, 2, macdMain) <= 0 || CopyBuffer(macdHandle, 1, 0, 2, macdSignal) <= 0)
      return;
`;
          entryLogic += `macdMain[0] > macdSignal[0] && macdMain[1] <= macdSignal[1]`;
          exitLogic += `macdMain[0] < macdSignal[0]`;
        }
        
        if (indicators.includes('RSI')) {
          handles += `   rsiHandle = iRSI(Symbol(), PERIOD_CURRENT, 14, PRICE_CLOSE);
`;
          calculations += `   double rsi[];
   if(CopyBuffer(rsiHandle, 0, 0, 1, rsi) <= 0) return;
`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `rsi[0] > 30 && rsi[0] < 70`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `rsi[0] > 80 || rsi[0] < 20`;
        }
        
        if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
          handles += `   ema20Handle = iMA(Symbol(), PERIOD_CURRENT, 20, 0, MODE_EMA, PRICE_CLOSE);
   ema50Handle = iMA(Symbol(), PERIOD_CURRENT, 50, 0, MODE_EMA, PRICE_CLOSE);
`;
          calculations += `   double ema20[], ema50[], closes[];
   if(CopyBuffer(ema20Handle, 0, 0, 1, ema20) <= 0 || CopyBuffer(ema50Handle, 0, 0, 1, ema50) <= 0 ||
      CopyClose(Symbol(), PERIOD_CURRENT, 0, 1, closes) <= 0) return;
`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `closes[0] > ema20[0] && ema20[0] > ema50[0]`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `closes[0] < ema20[0]`;
        }
        
        if (!entryLogic) {
          handles += `   ema20Handle = iMA(Symbol(), PERIOD_CURRENT, 20, 0, MODE_EMA, PRICE_CLOSE);
   rsiHandle = iRSI(Symbol(), PERIOD_CURRENT, 14, PRICE_CLOSE);
`;
          calculations += `   double ema20[], rsi[], closes[];
   if(CopyBuffer(ema20Handle, 0, 0, 1, ema20) <= 0 || CopyBuffer(rsiHandle, 0, 0, 1, rsi) <= 0 ||
      CopyClose(Symbol(), PERIOD_CURRENT, 0, 1, closes) <= 0) return;
`;
          entryLogic = `closes[0] > ema20[0] && rsi[0] > 30 && rsi[0] < 70`;
          exitLogic = `closes[0] < ema20[0] || rsi[0] > 80 || rsi[0] < 20`;
        }
        
        return { handles, calculations, entryLogic, exitLogic };
      };
      
      const logic = getIndicatorLogic(strategy.indicators || []);
      
      return `
//+------------------------------------------------------------------+
//|                            ${strategy.name.replace(/[^a-zA-Z0-9]/g, '_')}.mq5 |
//|                      ${strategy.name} - Ready to Use EA           |
//+------------------------------------------------------------------+
#property copyright "Educational Template"
#property link      ""
#property version   "1.00"

// Strategy: ${strategy.name}
// Difficulty: ${strategy.difficulty}
// Risk:Reward: ${strategy.riskReward}
// Success Rate: ${strategy.successRate}

// Input parameters
input double LotSize = 0.1;        // Lot size
input double StopLoss = 50;        // Stop loss in points
input double TakeProfit = 150;     // Take profit in points
input bool EnableLongs = true;     // Enable long positions
input bool EnableShorts = true;    // Enable short positions
input int MagicNumber = 12345;     // Magic number

${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `input double ${key} = ${value}; // ${key}`
).join('\n') : ''}

#include <Trade\\Trade.mqh>
CTrade trade;

// Indicator handles
int macdHandle = INVALID_HANDLE;
int rsiHandle = INVALID_HANDLE;
int ema20Handle = INVALID_HANDLE;
int ema50Handle = INVALID_HANDLE;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Initialize indicators
${logic.handles}
   
   Print("${strategy.name} EA Initialized");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   // Release indicator handles
   if(macdHandle != INVALID_HANDLE) IndicatorRelease(macdHandle);
   if(rsiHandle != INVALID_HANDLE) IndicatorRelease(rsiHandle);
   if(ema20Handle != INVALID_HANDLE) IndicatorRelease(ema20Handle);
   if(ema50Handle != INVALID_HANDLE) IndicatorRelease(ema50Handle);
   
   Print("${strategy.name} EA Deinitialized");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Only trade on new bar
   static datetime lastBarTime = 0;
   if(iTime(Symbol(), PERIOD_CURRENT, 0) == lastBarTime) return;
   lastBarTime = iTime(Symbol(), PERIOD_CURRENT, 0);
   
   // Calculate indicators
${logic.calculations}
   
   // Entry Conditions based on: ${strategy.entry}
   bool longCondition = EnableLongs && (${logic.entryLogic});
   bool shortCondition = EnableShorts && (${logic.exitLogic});
   
   // Check for open positions
   if(PositionsTotal() == 0)
   {
      if(longCondition)
      {
         double sl = StopLoss > 0 ? SymbolInfoDouble(Symbol(), SYMBOL_ASK) - StopLoss * SymbolInfoDouble(Symbol(), SYMBOL_POINT) : 0;
         double tp = TakeProfit > 0 ? SymbolInfoDouble(Symbol(), SYMBOL_ASK) + TakeProfit * SymbolInfoDouble(Symbol(), SYMBOL_POINT) : 0;
         
         if(trade.Buy(LotSize, Symbol(), 0, sl, tp, "${strategy.name} Long"))
            Print("Long position opened");
      }
      
      if(shortCondition)
      {
         double sl = StopLoss > 0 ? SymbolInfoDouble(Symbol(), SYMBOL_BID) + StopLoss * SymbolInfoDouble(Symbol(), SYMBOL_POINT) : 0;
         double tp = TakeProfit > 0 ? SymbolInfoDouble(Symbol(), SYMBOL_BID) - TakeProfit * SymbolInfoDouble(Symbol(), SYMBOL_POINT) : 0;
         
         if(trade.Sell(LotSize, Symbol(), 0, sl, tp, "${strategy.name} Short"))
            Print("Short position opened");
      }
   }
   
   // Exit logic based on: ${strategy.exit}
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(PositionSelectByIndex(i) && PositionGetString(POSITION_SYMBOL) == Symbol())
      {
         bool shouldClose = false;
         
         if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY && (${logic.exitLogic}))
            shouldClose = true;
         if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL && (${logic.entryLogic}))
            shouldClose = true;
            
         if(shouldClose)
         {
            if(trade.PositionClose(PositionGetInteger(POSITION_TICKET)))
               Print("Position closed by signal");
         }
      }
   }
}
`;
    },
    generateReadme: (strategy: any) => `
# ${strategy.name} - MetaTrader 5 Expert Advisor

## Installation Instructions
1. Copy the .mq5 file to your MetaTrader 5/MQL5/Experts folder
2. Restart MetaTrader 5 or refresh the Expert Advisors list
3. Drag the EA onto your chart
4. Configure the input parameters
5. Enable automated trading

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

## Important Notes
- This is a working EA with actual indicator calculations
- Test thoroughly in Strategy Tester before live trading
- Always use proper risk management and position sizing
- Adjust StopLoss and TakeProfit parameters based on your risk tolerance
`
  },

  "cTrader - C#": {
    generateCode: (strategy: any, timeframe = "TimeFrame.Hour") => {
      const getIndicatorLogic = (indicators: string[]) => {
        let declarations = '';
        let initialization = '';
        let entryLogic = '';
        let exitLogic = '';
        
        if (indicators.includes('MACD')) {
          declarations += `        private MacdCrossOver macd;\n`;
          initialization += `            macd = Indicators.MacdCrossOver(12, 26, 9);\n`;
          entryLogic += `macd.MACD.LastValue > macd.Signal.LastValue && macd.MACD.Last(1) <= macd.Signal.Last(1)`;
          exitLogic += `macd.MACD.LastValue < macd.Signal.LastValue`;
        }
        
        if (indicators.includes('RSI')) {
          declarations += `        private RelativeStrengthIndex rsi;\n`;
          initialization += `            rsi = Indicators.RelativeStrengthIndex(Bars.ClosePrices, 14);\n`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `rsi.Result.LastValue > 30 && rsi.Result.LastValue < 70`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `rsi.Result.LastValue > 80 || rsi.Result.LastValue < 20`;
        }
        
        if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
          declarations += `        private ExponentialMovingAverage ema20;\n        private ExponentialMovingAverage ema50;\n`;
          initialization += `            ema20 = Indicators.ExponentialMovingAverage(Bars.ClosePrices, 20);\n            ema50 = Indicators.ExponentialMovingAverage(Bars.ClosePrices, 50);\n`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `Bars.ClosePrices.LastValue > ema20.Result.LastValue && ema20.Result.LastValue > ema50.Result.LastValue`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `Bars.ClosePrices.LastValue < ema20.Result.LastValue`;
        }
        
        if (!entryLogic) {
          declarations += `        private ExponentialMovingAverage ema20;\n        private RelativeStrengthIndex rsi;\n`;
          initialization += `            ema20 = Indicators.ExponentialMovingAverage(Bars.ClosePrices, 20);\n            rsi = Indicators.RelativeStrengthIndex(Bars.ClosePrices, 14);\n`;
          entryLogic = `Bars.ClosePrices.LastValue > ema20.Result.LastValue && rsi.Result.LastValue > 30 && rsi.Result.LastValue < 70`;
          exitLogic = `Bars.ClosePrices.LastValue < ema20.Result.LastValue || rsi.Result.LastValue > 80 || rsi.Result.LastValue < 20`;
        }
        
        return { declarations, initialization, entryLogic, exitLogic };
      };
      
      const logic = getIndicatorLogic(strategy.indicators || []);
      
      return `
using System;
using cAlgo.API;
using cAlgo.API.Indicators;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.None)]
    public class ${strategy.name.replace(/[^a-zA-Z0-9]/g, '')}Robot : Robot
    {
        // Strategy: ${strategy.name}
        // Difficulty: ${strategy.difficulty}
        // Risk:Reward: ${strategy.riskReward}
        // Success Rate: ${strategy.successRate}

        // Parameters
        [Parameter("Volume", DefaultValue = 1000)]
        public int Volume { get; set; }
        
        [Parameter("Stop Loss (pips)", DefaultValue = 20)]
        public double StopLoss { get; set; }
        
        [Parameter("Take Profit (pips)", DefaultValue = 60)]
        public double TakeProfit { get; set; }
        
        [Parameter("Enable Longs", DefaultValue = true)]
        public bool EnableLongs { get; set; }
        
        [Parameter("Enable Shorts", DefaultValue = true)]
        public bool EnableShorts { get; set; }

        ${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
          `[Parameter("${key}", DefaultValue = ${value})]
        public double ${key} { get; set; }`
        ).join('\n        ') : ''}

        // Indicators
${logic.declarations}

        protected override void OnStart()
        {
            // Initialize indicators
${logic.initialization}
            
            Print("${strategy.name} Robot Started");
        }

        protected override void OnTick()
        {
            // Only trade on bar close
            if (Bars.ClosePrices.Count < 2) return;
            
            // Entry Conditions based on: ${strategy.entry}
            bool longCondition = EnableLongs && (${logic.entryLogic});
            bool shortCondition = EnableShorts && (${logic.exitLogic});
            
            // Check for existing positions
            var position = Positions.Find("${strategy.name}", SymbolName);
            
            if (position == null)
            {
                if (longCondition)
                {
                    var result = ExecuteMarketOrder(TradeType.Buy, SymbolName, Volume, "${strategy.name}",
                        StopLoss > 0 ? StopLoss : null, TakeProfit > 0 ? TakeProfit : null);
                    if (result.IsSuccessful)
                        Print("Long position opened at ", Symbol.Bid);
                }
                
                if (shortCondition)
                {
                    var result = ExecuteMarketOrder(TradeType.Sell, SymbolName, Volume, "${strategy.name}",
                        StopLoss > 0 ? StopLoss : null, TakeProfit > 0 ? TakeProfit : null);
                    if (result.IsSuccessful)
                        Print("Short position opened at ", Symbol.Ask);
                }
            }
            else
            {
                // Exit logic based on: ${strategy.exit}
                bool shouldClose = false;
                
                if (position.TradeType == TradeType.Buy && (${logic.exitLogic}))
                    shouldClose = true;
                if (position.TradeType == TradeType.Sell && (${logic.entryLogic}))
                    shouldClose = true;
                    
                if (shouldClose)
                {
                    var result = ClosePosition(position);
                    if (result.IsSuccessful)
                        Print("Position closed by signal");
                }
            }
        }

        protected override void OnStop()
        {
            Print("${strategy.name} Robot Stopped");
        }
    }
}
`;
    },
    generateReadme: (strategy: any) => `
# ${strategy.name} - cTrader Robot

## Installation Instructions
1. Open cTrader and go to Automate
2. Click "New" and select "Robot"
3. Replace the default code with the provided C# code
4. Build the robot (Ctrl+B)
5. Add the robot to your chart and configure parameters

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

## Important Notes
- This is a working robot with actual indicator calculations
- Test thoroughly in backtesting mode before live trading
- Always use proper risk management and position sizing
- Adjust Volume, StopLoss, and TakeProfit parameters based on your account size and risk tolerance
`
  },

  "NinjaTrader 8 - C#": {
    generateCode: (strategy: any, timeframe = "Data.BarsPeriodType.Minute, 60") => {
      const getIndicatorLogic = (indicators: string[]) => {
        let declarations = '';
        let initialization = '';
        let entryLogic = '';
        let exitLogic = '';
        
        if (indicators.includes('MACD')) {
          declarations += `        private MACD macd;\n`;
          initialization += `                macd = MACD(Close, 12, 26, 9);\n`;
          entryLogic += `CrossAbove(macd.Diff, 0, 1)`;
          exitLogic += `CrossBelow(macd.Diff, 0, 1)`;
        }
        
        if (indicators.includes('RSI')) {
          declarations += `        private RSI rsi;\n`;
          initialization += `                rsi = RSI(Close, 14, 1);\n`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `rsi[0] > 30 && rsi[0] < 70`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `rsi[0] > 80 || rsi[0] < 20`;
        }
        
        if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
          declarations += `        private EMA ema20;\n        private EMA ema50;\n`;
          initialization += `                ema20 = EMA(Close, 20);\n                ema50 = EMA(Close, 50);\n`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `Close[0] > ema20[0] && ema20[0] > ema50[0]`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `Close[0] < ema20[0]`;
        }
        
        if (!entryLogic) {
          declarations += `        private EMA ema20;\n        private RSI rsi;\n`;
          initialization += `                ema20 = EMA(Close, 20);\n                rsi = RSI(Close, 14, 1);\n`;
          entryLogic = `Close[0] > ema20[0] && rsi[0] > 30 && rsi[0] < 70`;
          exitLogic = `Close[0] < ema20[0] || rsi[0] > 80 || rsi[0] < 20`;
        }
        
        return { declarations, initialization, entryLogic, exitLogic };
      };
      
      const logic = getIndicatorLogic(strategy.indicators || []);
      
      return `
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Xml.Serialization;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
using NinjaTrader.NinjaScript.Strategies;

namespace NinjaTrader.NinjaScript.Strategies
{
    public class ${strategy.name.replace(/[^a-zA-Z0-9]/g, '')}Strategy : Strategy
    {
        // Strategy: ${strategy.name}
        // Difficulty: ${strategy.difficulty}
        // Risk:Reward: ${strategy.riskReward}
        // Success Rate: ${strategy.successRate}

        // Indicators
${logic.declarations}

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = @"${strategy.description}";
                Name = "${strategy.name.replace(/[^a-zA-Z0-9]/g, '')}Strategy";
                Calculate = Calculate.OnBarClose;
                EntriesPerDirection = 1;
                EntryHandling = EntryHandling.AllEntries;
                IsExitOnSessionCloseStrategy = true;
                ExitOnSessionCloseSeconds = 30;
                IsFillLimitOnTouch = false;
                MaximumBarsLookBack = MaximumBarsLookBack.TwoHundredFiftySix;
                OrderFillResolution = OrderFillResolution.Standard;
                Slippage = 0;
                StartBehavior = StartBehavior.WaitUntilFlat;
                TimeInForce = TimeInForce.Gtc;
                TraceOrders = false;
                RealtimeErrorHandling = RealtimeErrorHandling.StopCancelClose;
                StopTargetHandling = StopTargetHandling.PerEntryExecution;
                BarsRequiredToTrade = 20;
                IsInstantiatedOnEachOptimizationIteration = true;
                
                // Default parameters
                StopLoss = 20;
                TakeProfit = 60;
                EnableLongs = true;
                EnableShorts = true;

                ${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
                  `${key.charAt(0).toUpperCase() + key.slice(1)} = ${value};`
                ).join('\n                ') : ''}
            }
            else if (State == State.DataLoaded)
            {
                // Initialize indicators
${logic.initialization}
            }
        }

        protected override void OnBarUpdate()
        {
            if (BarsInProgress != 0 || CurrentBars[0] < BarsRequiredToTrade)
                return;
                
            // Entry Conditions based on: ${strategy.entry}
            bool longCondition = EnableLongs && (${logic.entryLogic});
            bool shortCondition = EnableShorts && (${logic.exitLogic});
            
            // Entry logic
            if (Position.MarketPosition == MarketPosition.Flat)
            {
                if (longCondition)
                {
                    EnterLong("${strategy.name} Long");
                }
                
                if (shortCondition)
                {
                    EnterShort("${strategy.name} Short");
                }
            }
            
            // Exit logic based on: ${strategy.exit}
            if (Position.MarketPosition == MarketPosition.Long && (${logic.exitLogic}))
            {
                ExitLong("Exit Long", "${strategy.name} Long");
            }
            
            if (Position.MarketPosition == MarketPosition.Short && (${logic.entryLogic}))
            {
                ExitShort("Exit Short", "${strategy.name} Short");
            }
        }

        #region Properties
        [NinjaScriptProperty]
        [Range(1, int.MaxValue)]
        [Display(Name = "Stop Loss", Description = "Stop loss in ticks", Order = 1, GroupName = "Parameters")]
        public int StopLoss { get; set; }

        [NinjaScriptProperty]
        [Range(1, int.MaxValue)]
        [Display(Name = "Take Profit", Description = "Take profit in ticks", Order = 2, GroupName = "Parameters")]
        public int TakeProfit { get; set; }
        
        [NinjaScriptProperty]
        [Display(Name = "Enable Longs", Description = "Enable long positions", Order = 3, GroupName = "Parameters")]
        public bool EnableLongs { get; set; }
        
        [NinjaScriptProperty]
        [Display(Name = "Enable Shorts", Description = "Enable short positions", Order = 4, GroupName = "Parameters")]
        public bool EnableShorts { get; set; }

        ${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
          `[NinjaScriptProperty]
        [Display(Name = "${key}", Order = 5, GroupName = "Parameters")]
        public double ${key.charAt(0).toUpperCase() + key.slice(1)} { get; set; }`
        ).join('\n        ') : ''}
        #endregion
    }
}
`;
    },
    generateReadme: (strategy: any) => `
# ${strategy.name} - NinjaTrader 8 Strategy

## Installation Instructions
1. Open NinjaTrader 8 and go to Tools > NinjaScript Editor
2. Right-click on Strategies folder and select "New Strategy"
3. Replace the default code with the provided C# code
4. Compile the strategy (F5)
5. Add the strategy to your chart from the Strategies menu

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

## Important Notes
- This is a working strategy with actual indicator calculations
- Test thoroughly using the Strategy Analyzer before live trading
- Always use proper risk management and position sizing
- Adjust StopLoss and TakeProfit parameters based on your risk tolerance
`
  }
};

export const DISCLAIMER_TEXT = `
DISCLAIMER - EDUCATIONAL USE ONLY

This code and content are for educational purposes only and do not constitute financial advice. 

IMPORTANT WARNINGS:
• Trading involves substantial risk of loss
• Past performance does not guarantee future results
• This is a working template but requires testing and customization
• Never trade with money you cannot afford to lose
• Always use proper risk management
• Test thoroughly on historical data before live trading
• Consider consulting with a qualified financial advisor

CUSTOMIZATION REQUIRED:
• Adjust parameters based on your risk tolerance
• Test on multiple instruments and timeframes
• Implement additional filters and confirmations as needed
• Monitor performance and adjust accordingly

The generated code includes functional indicator calculations and entry/exit logic,
but should be thoroughly tested and customized for your specific trading approach.
`;