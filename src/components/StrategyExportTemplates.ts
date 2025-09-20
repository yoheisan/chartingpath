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
      const riskSettings = strategy.answers?.risk || {};
      const marketSettings = strategy.answers?.market || {};
      const approach = strategy.answers?.style?.approach || 'trend-following';
      const accountSize = riskSettings.accountPrinciple || 100000;
      const riskPerTrade = riskSettings.riskPerTrade || 2.0;
      const maxDrawdown = riskSettings.maxDrawdown || 10.0;
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

      const getIndicatorLogic = (approach: string) => {
        let calculations = '';
        let entryLogic = '';
        let exitLogic = '';
        
        switch (approach) {
          case 'trend-following':
            calculations = `   double fast_ema = iMA(Symbol(), 0, ${params.fast_len?.default || 12}, 0, MODE_EMA, PRICE_CLOSE, 0);
   double slow_ema = iMA(Symbol(), 0, ${params.slow_len?.default || 26}, 0, MODE_EMA, PRICE_CLOSE, 0);
   double rsi = iRSI(Symbol(), 0, ${params.rsi_len?.default || 14}, PRICE_CLOSE, 0);
   double atr = iATR(Symbol(), 0, ${params.atr_len?.default || 14}, 0);`;
            entryLogic = `fast_ema > slow_ema && rsi > ${params.rsi_buy?.default || 60}`;
            exitLogic = `fast_ema < slow_ema || rsi < ${params.rsi_sell?.default || 40}`;
            break;

          case 'mean-reversion':
            calculations = `   double bb_upper = iBands(Symbol(), 0, ${params.bb_len?.default || 20}, ${params.bb_dev?.default || 2}, 0, PRICE_CLOSE, MODE_UPPER, 0);
   double bb_lower = iBands(Symbol(), 0, ${params.bb_len?.default || 20}, ${params.bb_dev?.default || 2}, 0, PRICE_CLOSE, MODE_LOWER, 0);
   double bb_middle = iBands(Symbol(), 0, ${params.bb_len?.default || 20}, ${params.bb_dev?.default || 2}, 0, PRICE_CLOSE, MODE_MAIN, 0);
   double rsi = iRSI(Symbol(), 0, ${params.rsi_len?.default || 14}, PRICE_CLOSE, 0);
   double atr = iATR(Symbol(), 0, ${params.atr_len?.default || 14}, 0);`;
            entryLogic = `(Close[0] <= bb_lower && rsi <= ${params.rsi_buy?.default || 30}) || (Close[0] >= bb_upper && rsi >= ${params.rsi_sell?.default || 70})`;
            exitLogic = `Close[0] > bb_middle && rsi > 40 && rsi < 60`;
            break;

          case 'breakout':
            calculations = `   double atr = iATR(Symbol(), 0, ${params.atr_len?.default || 14}, 0);
   double highest_high = iHigh(Symbol(), 0, iHighest(Symbol(), 0, MODE_HIGH, ${params.lookback?.default || 20}, 1));
   double lowest_low = iLow(Symbol(), 0, iLowest(Symbol(), 0, MODE_LOW, ${params.lookback?.default || 20}, 1));
   double volume = iVolume(Symbol(), 0, 0);
   double avgVolume = 0;
   for(int i = 1; i <= ${params.lookback?.default || 20}; i++) avgVolume += iVolume(Symbol(), 0, i);
   avgVolume = avgVolume / ${params.lookback?.default || 20};`;
            entryLogic = `((Close[0] > highest_high) || (Close[0] < lowest_low)) && volume > avgVolume * ${params.vol_mult?.default || 1.5}`;
            exitLogic = `volume < avgVolume`;
            break;

          case 'arbitrage':
            calculations = `   double ma_long = iMA(Symbol(), 0, ${params.corr_len?.default || 50}, 0, MODE_EMA, PRICE_CLOSE, 0);
   double price_deviation = (Close[0] - ma_long) / ma_long * 100;
   double atr = iATR(Symbol(), 0, ${params.atr_len?.default || 14}, 0);
   // Simplified z-score calculation
   double zscore_threshold = ${params.zscore_entry?.default || 2.0};`;
            entryLogic = `MathAbs(price_deviation) > zscore_threshold`;
            exitLogic = `MathAbs(price_deviation) < ${params.zscore_exit?.default || 0.5}`;
            break;

          default:
            calculations = `   double fast_ema = iMA(Symbol(), 0, 12, 0, MODE_EMA, PRICE_CLOSE, 0);
   double slow_ema = iMA(Symbol(), 0, 26, 0, MODE_EMA, PRICE_CLOSE, 0);
   double rsi = iRSI(Symbol(), 0, 14, PRICE_CLOSE, 0);
   double atr = iATR(Symbol(), 0, 14, 0);`;
            entryLogic = `fast_ema > slow_ema && rsi > 30 && rsi < 70`;
            exitLogic = `fast_ema < slow_ema || rsi > 80 || rsi < 20`;
            break;
        }
        
        return { calculations, entryLogic, exitLogic };
      };
      
      const params = PineScriptEngine.getStrategyParameters(strategy);
      const logic = getIndicatorLogic(approach);
      const leverage = riskSettings.leverage || 1;

      return `//+------------------------------------------------------------------+
//|                            ${(strategy.name || 'Strategy').replace(/[^a-zA-Z0-9]/g, '_')}.mq4 |
//|                      ${approach.replace('-', ' ').toUpperCase()} Strategy EA           |
//+------------------------------------------------------------------+
#property copyright "Educational Template"
#property link      ""
#property version   "1.00"
#property strict

// Trading Approach: ${approach.replace('-', ' ').toUpperCase()}
// Strategy: ${strategy.name || 'Custom Strategy'}
// Timeframe: ${selectedTimeframe} (${mtTimeframe})
// Leverage: 1:${leverage}
// Generated from Strategy Builder

extern double AccountSize = ${accountSize};
extern double Leverage = ${leverage};
extern bool UseRiskPerTrade = ${riskPerTrade ? 'true' : 'false'};
extern double RiskPerTradePercent = ${riskPerTrade || 2.0};
extern bool UseMaxDrawdown = ${maxDrawdown ? 'true' : 'false'};
extern double MaxDrawdownPercent = ${maxDrawdown || 10.0};
extern double StopLoss = 50;
extern double TakeProfit = 150;
extern bool EnableLongs = true;
extern bool EnableShorts = true;
extern int MagicNumber = 12345;

const int StrategyTimeframe = ${mtTimeframe};

double accountPeak = 0;
double currentDrawdown = 0.0;
bool drawdownLimitReached = false;
int lastBarTime = 0;

double CalculateLotSize()
{
   if(!UseRiskPerTrade)
   {
      double availableMargin = AccountFreeMargin() * 0.8;
      double leveragedCapital = availableMargin * Leverage;
      double lotSize = leveragedCapital / (MarketInfo(Symbol(), MODE_MARGINREQUIRED) * 100);
      return NormalizeDouble(MathMax(lotSize, 0.01), 2);
   }
   
   double riskAmount = AccountBalance() * (RiskPerTradePercent / 100.0);
   double lotSize = riskAmount / (StopLoss * MarketInfo(Symbol(), MODE_TICKVALUE));
   return NormalizeDouble(MathMax(lotSize, 0.01), 2);
}

void UpdateDrawdown()
{
   if(AccountEquity() > accountPeak)
      accountPeak = AccountEquity();
   
   currentDrawdown = ((accountPeak - AccountEquity()) / accountPeak) * 100;
   
   if(UseMaxDrawdown && currentDrawdown >= MaxDrawdownPercent)
   {
      drawdownLimitReached = true;
   }
}

int OnInit()
{
   accountPeak = AccountSize;
   Print("${approach.replace('-', ' ').toUpperCase()} Strategy EA Initialized");
   return(INIT_SUCCEEDED);
}

void OnTick()
{
   if(Time[0] == lastBarTime) return;
   lastBarTime = Time[0];
   
   UpdateDrawdown();
   if(drawdownLimitReached) return;
   
${logic.calculations}
   
   bool longCondition = ${logic.entryLogic} && EnableLongs;
   bool shortCondition = ${logic.exitLogic} && EnableShorts;
   
   bool hasPosition = false;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS) && OrderMagicNumber() == MagicNumber)
      {
         hasPosition = true;
         break;
      }
   }
   
   if(longCondition && !hasPosition)
   {
      double lots = CalculateLotSize();
      OrderSend(Symbol(), OP_BUY, lots, Ask, 3, Ask - StopLoss * Point, Ask + TakeProfit * Point, 
                "${approach} Long", MagicNumber);
   }
   
   if(shortCondition && !hasPosition)
   {
      double lots = CalculateLotSize();
      OrderSend(Symbol(), OP_SELL, lots, Bid, 3, Bid + StopLoss * Point, Bid - TakeProfit * Point,
                "${approach} Short", MagicNumber);
   }
   
   bool exitCondition = ${logic.exitLogic};
   if(exitCondition && hasPosition)
   {
      for(int i = OrdersTotal() - 1; i >= 0; i--)
      {
         if(OrderSelect(i, SELECT_BY_POS) && OrderMagicNumber() == MagicNumber)
         {
            OrderClose(OrderTicket(), OrderLots(), OrderType() == OP_BUY ? Bid : Ask, 3);
         }
      }
   }
}

void OnDeinit(const int reason)
{
   Print("${approach.replace('-', ' ').toUpperCase()} Strategy EA Stopped");
}

${DISCLAIMER_TEXT}`;
    },
    generateReadme: (strategy: any) => {
      const approach = strategy.answers?.style?.approach || 'trend-following';
      const riskSettings = strategy.answers?.risk || {};
      const marketSettings = strategy.answers?.market || {};
      
      return `# ${strategy.name || 'Trading Strategy'} - MetaTrader 4 Expert Advisor

## Overview
This Expert Advisor implements a **${approach.replace('-', ' ').toUpperCase()}** trading strategy based on your Strategy Builder configuration.

## Trading Approach: ${approach.replace('-', ' ').toUpperCase()}

${approach === 'trend-following' ? 
  `This strategy follows market trends using MACD crossovers and moving average analysis.
  - **Entry**: MACD line crosses above signal line with price above EMA trend
  - **Exit**: MACD crosses below signal or price falls below trend line` :
  approach === 'mean-reversion' ?
  `This strategy capitalizes on price returning to mean using RSI and Bollinger Bands.
  - **Entry**: Price touches Bollinger Band extremes with RSI confirmation
  - **Exit**: Price returns to middle Bollinger Band with RSI neutral` :
  approach === 'breakout' ?
  `This strategy trades breakouts from consolidation zones using ATR and volume.
  - **Entry**: Price breaks above/below recent high/low with volume confirmation
  - **Exit**: Price returns to EMA trend line with reduced volume` :
  approach === 'arbitrage' ?
  `This strategy exploits price differences between correlated assets.
  - **Entry**: Z-score exceeds threshold with strong correlation
  - **Exit**: Z-score returns to neutral with correlation maintained` :
  `This strategy uses a combination of technical indicators for trading decisions.`
}

## Installation
1. Copy the .mq4 file to your MetaTrader 4 Experts folder
2. Restart MetaTrader 4 or refresh Expert Advisors
3. Drag the EA onto your chart
4. Configure the parameters in the inputs tab

## Strategy Configuration
- **Timeframe**: ${marketSettings.timeframes?.[0] || '1H'}
- **Leverage**: 1:${riskSettings.leverage || 1}
- **Risk Per Trade**: ${riskSettings.riskPerTrade ? riskSettings.riskPerTrade + '%' : 'Full Capital Mode'}
- **Max Drawdown**: ${riskSettings.maxDrawdown ? riskSettings.maxDrawdown + '%' : 'No Limit'}

## Risk Management Features
- **Position Sizing**: ${riskSettings.riskPerTrade ? 'Percentage-based risk per trade' : 'Full capital allocation with leverage'}
- **Drawdown Protection**: ${riskSettings.maxDrawdown ? 'Automatic stop when max drawdown reached' : 'Not enabled'}
- **Stop Loss/Take Profit**: Configurable in points
- **New Bar Trading**: Only trades on new bar formation

## Important Parameters
\`\`\`
AccountSize = ${riskSettings.accountPrinciple || 10000}
Leverage = ${riskSettings.leverage || 1}
UseRiskPerTrade = ${riskSettings.riskPerTrade ? 'true' : 'false'}
RiskPerTradePercent = ${riskSettings.riskPerTrade || 2.0}
UseMaxDrawdown = ${riskSettings.maxDrawdown ? 'true' : 'false'}
MaxDrawdownPercent = ${riskSettings.maxDrawdown || 10.0}
\`\`\`

## Disclaimer
${DISCLAIMER_TEXT}

## Support
This is an educational template. Please backtest thoroughly before live trading and always use proper risk management.`;
    }
  }
};