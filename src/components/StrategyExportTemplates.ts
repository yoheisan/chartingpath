import { PineScriptEngine } from "./PineScriptEngine";

export interface ExportTemplate {
  generateCode: (strategy: any, timeframe?: string, confirmTimeframe?: string) => string;
  generateReadme: (strategy: any) => string;
}

export const DISCLAIMER_TEXT = `
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

export const EXPORT_TEMPLATES = {
  "TradingView - Pine Script v6": {
    generateCode: (strategy: any, timeframe = "1H") => {
      // Use the new Pine Script engine for Pine Script generation
      return PineScriptEngine.generateStrategyVersion(strategy);
    },
    generateReadme: (strategy: any) => {
      // Use the new Pine Script engine for README generation
      return PineScriptEngine.generateReadme(strategy, "strategy");
    }
  },

  "MetaTrader 4 - MQL4": {
    generateCode: (strategy: any, timeframe = "PERIOD_H1") => {
      // Extract settings from strategy answers
      const riskSettings = strategy.answers?.riskTolerance || {};
      const marketSettings = strategy.answers?.market || {};
      const accountSize = riskSettings.accountPrinciple || 10000;
      const riskPerTrade = riskSettings.riskPerTrade || null;
      const maxDrawdown = riskSettings.maxDrawdown || null;
      const leverage = riskSettings.leverage || 1;
      const selectedTimeframe = marketSettings.timeframes?.[0] || '1H';
      
      // Map timeframe to MetaTrader format
      const timeframeMap = {
        '15M': 'PERIOD_M15',
        '1H': 'PERIOD_H1', 
        '4H': 'PERIOD_H4',
        '1D': 'PERIOD_D1',
        '1W': 'PERIOD_W1'
      };
      const mtTimeframe = timeframeMap[selectedTimeframe] || 'PERIOD_H1';

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

      return `//+------------------------------------------------------------------+
//|                            ${strategy.name.replace(/[^a-zA-Z0-9]/g, '_')}.mq4 |
//|                      ${strategy.name} - Ready to Use EA           |
//+------------------------------------------------------------------+
#property copyright "Educational Template"
#property link      ""
#property version   "1.00"
#property strict

// Strategy: ${strategy.name}
// Timeframe: ${selectedTimeframe} (${mtTimeframe})
// Leverage: 1:${leverage}
// Difficulty: ${strategy.difficulty || 'N/A'}
// Risk:Reward: ${strategy.riskReward || 'N/A'}
// Success Rate: ${strategy.successRate || 'N/A'}

// Strategy Settings from Strategy Builder
extern double AccountSize = ${accountSize};        // Account size from strategy
extern double Leverage = ${leverage};              // Leverage setting from strategy
extern bool UseRiskPerTrade = ${riskPerTrade ? 'true' : 'false'};    // Enable/disable risk per trade
extern double RiskPerTradePercent = ${riskPerTrade || 2.0};          // Risk per trade percentage
extern bool UseMaxDrawdown = ${maxDrawdown ? 'true' : 'false'};      // Enable/disable max drawdown protection
extern double MaxDrawdownPercent = ${maxDrawdown || 10.0};           // Maximum drawdown percentage
extern double StopLoss = 50;       // Stop loss in points
extern double TakeProfit = 150;    // Take profit in points
extern bool EnableLongs = true;    // Enable long positions
extern bool EnableShorts = true;   // Enable short positions
extern int MagicNumber = 12345;    // Magic number

// Timeframe setting from strategy (${selectedTimeframe})
const int StrategyTimeframe = ${mtTimeframe};

${strategy.internalJsonSchema?.inputs ? Object.entries(strategy.internalJsonSchema.inputs).map(([key, value]) => 
  `extern double ${key} = ${value}; // ${key}`
).join('\n') : ''}

// Global variables for risk management
${logic.variables}
double accountPeak = AccountSize;
double currentDrawdown = 0.0;
bool drawdownLimitReached = false;
int lastBarTime = 0;

//+------------------------------------------------------------------+
//| Calculate dynamic lot size with leverage                        |
//+------------------------------------------------------------------+
double CalculateLotSize()
{
   if(!UseRiskPerTrade)
   {
      // Use substantial portion of available capital with leverage
      double availableMargin = AccountFreeMargin() * 0.8;
      double leveragedCapital = availableMargin * Leverage;
      double lotSize = leveragedCapital / (MarketInfo(Symbol(), MODE_MARGINREQUIRED) * 100);
      return NormalizeDouble(MathMax(lotSize, 0.01), 2);
   }
   
   // Calculate lot size based on risk per trade with leverage
   double riskAmount = AccountSize * (RiskPerTradePercent / 100.0);
   double stopLossPoints = StopLoss > 0 ? StopLoss : 50;
   double leveragedRisk = riskAmount * Leverage;
   double lotSize = leveragedRisk / (stopLossPoints * MarketInfo(Symbol(), MODE_TICKVALUE));
   return NormalizeDouble(MathMax(lotSize, 0.01), 2);
}

//+------------------------------------------------------------------+
//| Check drawdown limit                                             |
//+------------------------------------------------------------------+
bool CheckDrawdownLimit()
{
   if(!UseMaxDrawdown) return true; // No limit set
   
   double currentEquity = AccountEquity();
   accountPeak = MathMax(accountPeak, currentEquity);
   currentDrawdown = ((accountPeak - currentEquity) / accountPeak) * 100.0;
   
   if(currentDrawdown >= MaxDrawdownPercent)
   {
      if(!drawdownLimitReached)
      {
         Print("DRAWDOWN LIMIT REACHED: ", currentDrawdown, "% - Stopping all trading");
         drawdownLimitReached = true;
      }
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("${strategy.name} EA Initialized");
   Print("Strategy Timeframe: ", EnumToString((ENUM_TIMEFRAMES)StrategyTimeframe));
   Print("Leverage: 1:", Leverage);
   Print("Risk Management - Per Trade: ", UseRiskPerTrade ? "Enabled" : "Disabled");
   Print("Risk Management - Max Drawdown: ", UseMaxDrawdown ? "Enabled" : "Disabled");
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
   // Only trade on the specified strategy timeframe
   if(Period() != StrategyTimeframe)
   {
      Comment("Strategy designed for ", EnumToString((ENUM_TIMEFRAMES)StrategyTimeframe), 
              " timeframe. Current: ", EnumToString(Period()));
      return;
   }
   
   if(!IsNewBar()) return; // Only trade on new bar
   
   // Check drawdown limit first
   if(!CheckDrawdownLimit()) 
   {
      // Close all positions if drawdown limit is reached
      for(int i = OrdersTotal() - 1; i >= 0; i--)
      {
         if(OrderSelect(i, SELECT_BY_POS) && OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
         {
            bool result = OrderClose(OrderTicket(), OrderLots(), 
                                   OrderType() == OP_BUY ? Bid : Ask, 3, clrRed);
            if(result) Print("Position closed due to drawdown limit");
         }
      }
      return; // Stop all trading
   }
   
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
   
   // Calculate dynamic lot size
   double lotSize = CalculateLotSize();
   
   // Entry logic
   if(longCondition && totalOrders == 0)
   {
      double sl = StopLoss > 0 ? Ask - StopLoss * Point : 0;
      double tp = TakeProfit > 0 ? Ask + TakeProfit * Point : 0;
      
      int ticket = OrderSend(Symbol(), OP_BUY, lotSize, Ask, 3, sl, tp, 
                            "${strategy.name} Long", MagicNumber, 0, clrGreen);
      if(ticket > 0)
      {
         string riskInfo = UseRiskPerTrade ? 
            StringConcatenate("Risk: ", RiskPerTradePercent, "% | Lot: ", lotSize, " | Lev: 1:", Leverage) :
            StringConcatenate("Full Capital Mode | Lot: ", lotSize, " | Lev: 1:", Leverage);
         Print("Long position opened at ", Ask, " | ", riskInfo);
      }
   }
   
   if(shortCondition && totalOrders == 0)
   {
      double sl = StopLoss > 0 ? Bid + StopLoss * Point : 0;
      double tp = TakeProfit > 0 ? Bid - TakeProfit * Point : 0;
      
      int ticket = OrderSend(Symbol(), OP_SELL, lotSize, Bid, 3, sl, tp,
                            "${strategy.name} Short", MagicNumber, 0, clrRed);
      if(ticket > 0)
      {
         string riskInfo = UseRiskPerTrade ? 
            StringConcatenate("Risk: ", RiskPerTradePercent, "% | Lot: ", lotSize, " | Lev: 1:", Leverage) :
            StringConcatenate("Full Capital Mode | Lot: ", lotSize, " | Lev: 1:", Leverage);
         Print("Short position opened at ", Bid, " | ", riskInfo);
      }
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
    generateReadme: (strategy: any) => {
      const riskSettings = strategy.answers?.riskTolerance || {};
      const marketSettings = strategy.answers?.market || {};
      const selectedTimeframe = marketSettings.timeframes?.[0] || '1H';
      const leverage = riskSettings.leverage || 1;
      
      return `# ${strategy.name} - MetaTrader 4 Expert Advisor

## Strategy Configuration
- **Timeframe**: ${selectedTimeframe}
- **Leverage**: 1:${leverage}
- **Risk Management**: ${riskSettings.riskPerTrade ? 'Enabled' : 'Disabled'}
- **Drawdown Protection**: ${riskSettings.maxDrawdown ? 'Enabled' : 'Disabled'}

## Installation Instructions
1. Copy the .mq4 file to your MetaTrader 4/MQL4/Experts folder
2. Restart MetaTrader 4 or refresh the Expert Advisors list
3. Drag the EA onto your chart (${selectedTimeframe} timeframe recommended)
4. Configure the input parameters
5. Enable automated trading and allow DLL imports if needed

## Strategy Details
- **Difficulty**: ${strategy.difficulty || 'N/A'}
- **Risk:Reward**: ${strategy.riskReward || 'N/A'}
- **Success Rate**: ${strategy.successRate || 'N/A'}
- **Indicators**: ${strategy.indicators ? strategy.indicators.join(', ') : 'Custom logic'}
- **Designed Timeframe**: ${selectedTimeframe}

## Entry Rules
${strategy.entry || 'Custom entry logic based on selected indicators'}

## Exit Rules
${strategy.exit || 'Custom exit logic with stop loss and take profit'}

## Risk Management Features
${riskSettings.riskPerTrade ? 
`- **Risk Per Trade**: ${riskSettings.riskPerTrade}% of account per trade` : 
'- **Full Capital Mode**: Uses substantial portion of available capital'}
${riskSettings.maxDrawdown ? 
`- **Maximum Drawdown Protection**: Strategy halts at ${riskSettings.maxDrawdown}% drawdown` : 
'- **No Drawdown Limit**: Strategy runs to completion regardless of losses'}
- **Leverage Support**: Calculations include 1:${leverage} leverage
- **Timeframe Protection**: Only trades on ${selectedTimeframe} timeframe

## Important Notes
- This EA includes your actual Strategy Builder settings
- Test thoroughly in Strategy Tester before live trading
- The EA will only trade on ${selectedTimeframe} charts
- Risk management settings match your Strategy Builder configuration
- Always monitor drawdown and adjust parameters as needed
`;
    }
  }
};