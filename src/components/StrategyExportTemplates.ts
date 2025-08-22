export interface ExportTemplate {
  generateCode: (strategy: any, timeframe?: string, confirmTimeframe?: string) => string;
  generateReadme: (strategy: any) => string;
}

export const EXPORT_TEMPLATES = {
  "TradingView - Pine Script v5": {
    generateCode: (strategy: any, timeframe = "1H") => `
//@version=5
strategy("${strategy.name}", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=1)

// Disclaimer
// This code is for educational purposes only and does not constitute financial advice.
// Trading involves risk. Past performance does not guarantee future results.

// Strategy: ${strategy.name}
// Difficulty: ${strategy.difficulty}
// Risk:Reward: ${strategy.riskReward}
// Success Rate: ${strategy.successRate}
// Timeframe: ${timeframe}

// Input Parameters
${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `${key} = input.float(${value}, title="${key.charAt(0).toUpperCase() + key.slice(1)}")`
).join('\n') : '// Add your input parameters here'}

// Entry Conditions
// ${strategy.entry}

// Exit Conditions  
// ${strategy.exit}

// Strategy Logic (Template - Customize based on your strategy)
// Add your indicators and conditions here
longCondition = false // Replace with actual entry logic
shortCondition = false // Replace with actual entry logic

if (longCondition)
    strategy.entry("Long", strategy.long)

if (shortCondition)
    strategy.entry("Short", strategy.short)

// Exit conditions
// Add your exit logic here

// Alerts
if (longCondition)
    alert("${strategy.name} - Long Signal", alert.freq_once_per_bar)
    
if (shortCondition)
    alert("${strategy.name} - Short Signal", alert.freq_once_per_bar)
`,
    generateReadme: (strategy: any) => `
# ${strategy.name} - TradingView Pine Script

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
- This is a template that requires customization
- Add proper indicator calculations based on the strategy
- Test thoroughly on historical data before live trading
- Always use proper risk management
`
  },

  "MetaTrader 4 - MQL4": {
    generateCode: (strategy: any, timeframe = "PERIOD_H1") => `
//+------------------------------------------------------------------+
//|                                              ${strategy.name}.mq4 |
//|                                     Educational Template Only     |
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
${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `extern double ${key} = ${value}; // ${key}`
).join('\n') : '// Add your input parameters here'}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |  
//+------------------------------------------------------------------+
void OnTick()
{
   // Entry Conditions: ${strategy.entry}
   // Exit Conditions: ${strategy.exit}
   
   // Add your strategy logic here
   bool longCondition = false; // Replace with actual entry logic
   bool shortCondition = false; // Replace with actual entry logic
   
   if(longCondition && OrdersTotal() == 0)
   {
      int ticket = OrderSend(Symbol(), OP_BUY, 0.1, Ask, 3, 0, 0, 
                            "${strategy.name} Long", 0, 0, clrGreen);
   }
   
   if(shortCondition && OrdersTotal() == 0)
   {
      int ticket = OrderSend(Symbol(), OP_SELL, 0.1, Bid, 3, 0, 0,
                            "${strategy.name} Short", 0, 0, clrRed);
   }
   
   // Add exit logic here
}
`,
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
- This is a template that requires customization
- Add proper indicator calculations and entry/exit logic
- Test thoroughly in Strategy Tester before live trading
- Always use proper risk management and position sizing
`
  },

  "MetaTrader 5 - MQL5": {
    generateCode: (strategy: any, timeframe = "PERIOD_H1") => `
//+------------------------------------------------------------------+
//|                                              ${strategy.name}.mq5 |
//|                                     Educational Template Only     |
//+------------------------------------------------------------------+
#property copyright "Educational Template"
#property link      ""
#property version   "1.00"

// Strategy: ${strategy.name}
// Difficulty: ${strategy.difficulty}
// Risk:Reward: ${strategy.riskReward}
// Success Rate: ${strategy.successRate}

// Input parameters
${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `input double ${key} = ${value}; // ${key}`
).join('\n') : '// Add your input parameters here'}

#include <Trade\\Trade.mqh>
CTrade trade;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Entry Conditions: ${strategy.entry}
   // Exit Conditions: ${strategy.exit}
   
   // Add your strategy logic here
   bool longCondition = false; // Replace with actual entry logic
   bool shortCondition = false; // Replace with actual entry logic
   
   if(longCondition && PositionsTotal() == 0)
   {
      trade.Buy(0.1, Symbol(), 0, 0, 0, "${strategy.name} Long");
   }
   
   if(shortCondition && PositionsTotal() == 0)
   {
      trade.Sell(0.1, Symbol(), 0, 0, 0, "${strategy.name} Short");
   }
   
   // Add exit logic here
}
`,
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
- This is a template that requires customization
- Add proper indicator calculations and entry/exit logic
- Test thoroughly in Strategy Tester before live trading
- Always use proper risk management and position sizing
`
  },

  "cTrader - C#": {
    generateCode: (strategy: any, timeframe = "TimeFrame.Hour") => `
using System;
using cAlgo.API;
using cAlgo.API.Indicators;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.None)]
    public class ${strategy.name.replace(/[^a-zA-Z0-9]/g, '')} : Robot
    {
        // Strategy: ${strategy.name}
        // Difficulty: ${strategy.difficulty}
        // Risk:Reward: ${strategy.riskReward}
        // Success Rate: ${strategy.successRate}

        // Parameters
        ${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
          `[Parameter("${key}", DefaultValue = ${value})]
        public double ${key} { get; set; }`
        ).join('\n        ') : '// Add your input parameters here'}

        protected override void OnStart()
        {
            // Initialize indicators here
        }

        protected override void OnTick()
        {
            // Entry Conditions: ${strategy.entry}
            // Exit Conditions: ${strategy.exit}
            
            // Add your strategy logic here
            bool longCondition = false; // Replace with actual entry logic
            bool shortCondition = false; // Replace with actual entry logic
            
            if (longCondition && Positions.Count == 0)
            {
                ExecuteMarketOrder(TradeType.Buy, SymbolName, 1000, "${strategy.name} Long");
            }
            
            if (shortCondition && Positions.Count == 0)
            {
                ExecuteMarketOrder(TradeType.Sell, SymbolName, 1000, "${strategy.name} Short");
            }
            
            // Add exit logic here
        }

        protected override void OnStop()
        {
            // Put your deinitialization logic here
        }
    }
}
`,
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
- This is a template that requires customization
- Add proper indicator initialization and calculations
- Test thoroughly in backtesting mode before live trading
- Always use proper risk management and position sizing
`
  },

  "NinjaTrader 8 - C#": {
    generateCode: (strategy: any, timeframe = "Data.BarsPeriodType.Minute, 60") => `
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
    public class ${strategy.name.replace(/[^a-zA-Z0-9]/g, '')} : Strategy
    {
        // Strategy: ${strategy.name}
        // Difficulty: ${strategy.difficulty}
        // Risk:Reward: ${strategy.riskReward}
        // Success Rate: ${strategy.successRate}

        ${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
          `private double ${key} = ${value};`
        ).join('\n        ') : '// Add your input parameters here'}

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = @"${strategy.description}";
                Name = "${strategy.name}";
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
            }
            else if (State == State.DataLoaded)
            {
                // Initialize indicators here
            }
        }

        protected override void OnBarUpdate()
        {
            // Entry Conditions: ${strategy.entry}
            // Exit Conditions: ${strategy.exit}
            
            // Add your strategy logic here
            bool longCondition = false; // Replace with actual entry logic
            bool shortCondition = false; // Replace with actual entry logic
            
            if (longCondition)
            {
                EnterLong("${strategy.name} Long");
            }
            
            if (shortCondition)
            {
                EnterShort("${strategy.name} Short");
            }
            
            // Add exit logic here
        }

        ${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
          `[NinjaScriptProperty]
        [Display(Name = "${key}", Order = 1, GroupName = "Parameters")]
        public double ${key.charAt(0).toUpperCase() + key.slice(1)}
        { get; set; }`
        ).join('\n        ') : '// Add your properties here'}
    }
}
`,
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
- This is a template that requires customization
- Add proper indicator initialization in OnStateChange
- Test thoroughly using the Strategy Analyzer before live trading
- Always use proper risk management and position sizing
`
  }
};

export const DISCLAIMER_TEXT = `
DISCLAIMER - EDUCATIONAL USE ONLY

This code and content are for educational purposes only and do not constitute financial advice. 

IMPORTANT WARNINGS:
• Trading involves substantial risk of loss
• Past performance does not guarantee future results
• This is a template that requires customization and testing
• Never trade with money you cannot afford to lose
• Always use proper risk management
• Test thoroughly on historical data before live trading
• Consider consulting with a qualified financial advisor

The creators of this code are not responsible for any trading losses or damages that may result from the use of this software.

Use at your own risk.
`;