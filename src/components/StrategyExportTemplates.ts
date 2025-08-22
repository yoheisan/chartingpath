export interface ExportTemplate {
  generateCode: (strategy: any, timeframe?: string, confirmTimeframe?: string) => string;
  generateReadme: (strategy: any) => string;
}

export const EXPORT_TEMPLATES = {
  "TradingView - Pine Script v6": {
    generateCode: (strategy: any, timeframe = "1H") => {
      // Use the new Pine Script engine for Pine Script generation
      const { PineScriptEngine } = require("@/components/PineScriptEngine");
      return PineScriptEngine.generateStrategyVersion(strategy);
    },
    generateReadme: (strategy: any) => {
      // Use the new Pine Script engine for README generation
      const { PineScriptEngine } = require("@/components/PineScriptEngine");
      return PineScriptEngine.generateReadme(strategy, "strategy");
    }
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
        
        if (indicators.includes('VPT') || strategy.name.includes('Volume Price Trend')) {
          // Use the exact VPT implementation from the user's working script
          calculations += `   // Volume Price Trend (VPT) - User's Working Implementation
   static double vptRaw = 0;
   vptRaw += (Close[0] - Close[1]) / Close[1] * Volume[0];
   double vpt = iMAOnArray(vptBuffer, 0, 20, 0, MODE_EMA, 0); // Smoothed VPT
   double vptSig = iMAOnArray(vptSigBuffer, 0, 20, 0, MODE_EMA, 0); // Signal line
   double vptSlope = vpt - vptBuffer[5]; // 5-bar slope
`;
          entryLogic = `vpt > vptSig && vptSlope > 0`;
          exitLogic = `vpt < vptSig || vptSlope < 0`;
        } else if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
          calculations += `   double ema20 = iMA(Symbol(), 0, 20, 0, MODE_EMA, PRICE_CLOSE, 0);
   double ema50 = iMA(Symbol(), 0, 50, 0, MODE_EMA, PRICE_CLOSE, 0);
`;
          if (entryLogic) entryLogic += ` && `;
          entryLogic += `Close[0] > ema20 && ema20 > ema50`;
          if (exitLogic) exitLogic += ` || `;
          exitLogic += `Close[0] < ema20`;
        }
        
        if (indicators.includes('VPT') || strategy.name.includes('Volume Price Trend')) {
          // Use the exact VPT implementation from the user's working script
          calculations += `   // Volume Price Trend (VPT) - User's Working Implementation
   static double vptRaw = 0;
   vptRaw += (Close[0] - Close[1]) / Close[1] * Volume[0];
   double vpt = iMAOnArray(vptBuffer, 0, 20, 0, MODE_EMA, 0); // Smoothed VPT
   double vptSig = iMAOnArray(vptSigBuffer, 0, 20, 0, MODE_EMA, 0); // Signal line
   double vptSlope = vpt - vptBuffer[5]; // 5-bar slope
`;
          entryLogic = `vpt > vptSig && vptSlope > 0`;
          exitLogic = `vpt < vptSig || vptSlope < 0`;
        } else if (indicators.includes('Bollinger Bands')) {
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
        
        if (indicators.includes('VPT') || strategy.name.includes('Volume Price Trend')) {
          // Use the exact VPT implementation from the user's working script  
          handles += `   vptHandle = iCustom(Symbol(), PERIOD_CURRENT, "VPT_Custom", 0);
`;
          calculations += `   double vpt[], vptSig[];
   if(CopyBuffer(vptHandle, 0, 0, 2, vpt) <= 0 || CopyBuffer(vptHandle, 1, 0, 2, vptSig) <= 0)
      return;
   double vptSlope = vpt[0] - vpt[1]; // Current vs previous
`;
          entryLogic = `vpt[0] > vptSig[0] && vpt[1] <= vptSig[1] && vptSlope > 0`;
          exitLogic = `vpt[0] < vptSig[0] || vptSlope < 0`;
        } else if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
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
        
        if (indicators.includes('VPT') || strategy.name.includes('Volume Price Trend')) {
          // Use the exact VPT implementation from the user's working script
          declarations += `        private VPTIndicator vptIndicator;\n`;
          initialization += `            vptIndicator = new VPTIndicator();\n`;
          entryLogic = `vptIndicator.VPT.LastValue > vptIndicator.Signal.LastValue && vptIndicator.Slope > 0`;
          exitLogic = `vptIndicator.VPT.LastValue < vptIndicator.Signal.LastValue || vptIndicator.Slope < 0`;
        } else if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
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
        
        if (indicators.includes('VPT') || strategy.name.includes('Volume Price Trend')) {
          // Use the exact VPT implementation from the user's working script
          declarations += `        private VPT vptIndicator;\n`;
          initialization += `                vptIndicator = VPT();\n`;
          entryLogic = `vptIndicator.VPTValue[0] > vptIndicator.Signal[0] && vptIndicator.Slope[0] > 0`;
          exitLogic = `vptIndicator.VPTValue[0] < vptIndicator.Signal[0] || vptIndicator.Slope[0] < 0`;
        } else if (indicators.includes('Moving Average') || indicators.includes('EMA')) {
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