import { 
  TrendingUp, 
  TrendingDown, 
  Zap,
  BarChart3,
  Target,
  Clock,
  Repeat,
  ArrowUpDown
} from 'lucide-react';

export interface ProfessionalStrategy {
  id: string;
  name: string;
  description: string;
  category: 'Trend' | 'Mean Reversion' | 'Momentum' | 'Arbitrage' | 'Market Neutral';
  assetTypes: string[];
  timeframes: {
    primary: string[];
    optimal: string;
    description: string;
  };
  parameters: {
    entryConditions: string[];
    exitConditions: string[];
    riskManagement: {
      stopLoss: string;
      takeProfit: string;
      positionSizing: string;
    };
    indicators: string[];
  };
  marketConditions: {
    best: string;
    avoid: string;
  };
  complexity: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  icon: React.ElementType;
  color: string;
  professionalUse: {
    hedgeFunds: boolean;
    retailTraders: boolean;
    institutionalTraders: boolean;
    description: string;
  };
}

export const professionalStrategies: ProfessionalStrategy[] = [
  {
    id: 'ema-crossover',
    name: 'EMA Crossover Trend Following',
    description: 'Classic trend-following using exponential moving average crossovers - widely used by institutional traders',
    category: 'Trend',
    assetTypes: ['Forex', 'Stocks', 'Crypto', 'Commodities'],
    timeframes: {
      primary: ['4H', '1D', '1W'],
      optimal: '4H',
      description: 'Works best on 4H+ timeframes to avoid noise'
    },
    parameters: {
      entryConditions: [
        'Fast EMA (12) crosses above Slow EMA (26)',
        'Price above 200 EMA (trend filter)',
        'Volume confirmation (if available)'
      ],
      exitConditions: [
        'Fast EMA crosses below Slow EMA',
        'Price hits stop loss or take profit',
        'Momentum divergence signals'
      ],
      riskManagement: {
        stopLoss: '2-3 ATR below entry',
        takeProfit: '2:1 or 3:1 risk-reward ratio',
        positionSizing: '1-2% account risk per trade'
      },
      indicators: ['EMA 12', 'EMA 26', 'EMA 200', 'ATR', 'Volume']
    },
    marketConditions: {
      best: 'Strong trending markets with clear directional bias',
      avoid: 'Sideways/choppy markets with frequent false breakouts'
    },
    complexity: 'Beginner',
    icon: TrendingUp,
    color: 'bg-blue-500',
    professionalUse: {
      hedgeFunds: true,
      retailTraders: true,
      institutionalTraders: true,
      description: 'One of the most widely used strategies across all trader types'
    }
  },
  {
    id: 'bollinger-mean-reversion',
    name: 'Bollinger Band Mean Reversion',
    description: 'Professional mean reversion strategy using Bollinger Bands - favored by quantitative hedge funds',
    category: 'Mean Reversion',
    assetTypes: ['Stocks', 'Forex', 'ETFs'],
    timeframes: {
      primary: ['1H', '4H', '1D'],
      optimal: '1H',
      description: 'Optimal on hourly charts for good signal frequency'
    },
    parameters: {
      entryConditions: [
        'Price touches lower Bollinger Band (oversold)',
        'RSI below 30 confirmation',
        'No major trend breakout in progress'
      ],
      exitConditions: [
        'Price reaches middle Bollinger Band (mean)',
        'RSI above 50',
        'Stop loss at recent swing low'
      ],
      riskManagement: {
        stopLoss: '1.5-2 ATR below entry',
        takeProfit: 'Middle Bollinger Band or upper band',
        positionSizing: '1-1.5% account risk per trade'
      },
      indicators: ['Bollinger Bands (20,2)', 'RSI (14)', 'ATR', 'Volume']
    },
    marketConditions: {
      best: 'Range-bound markets with clear support/resistance',
      avoid: 'Strong trending markets or low volatility periods'
    },
    complexity: 'Intermediate',
    icon: TrendingDown,
    color: 'bg-green-500',
    professionalUse: {
      hedgeFunds: true,
      retailTraders: true,
      institutionalTraders: false,
      description: 'Popular among quantitative funds for statistical arbitrage'
    }
  },
  {
    id: 'breakout-momentum',
    name: 'Breakout Momentum Strategy',
    description: 'Captures explosive moves when price breaks key levels - used by momentum-focused hedge funds',
    category: 'Momentum',
    assetTypes: ['Stocks', 'Crypto', 'Commodities'],
    timeframes: {
      primary: ['15M', '1H', '4H'],
      optimal: '1H',
      description: 'Balance between signal quality and frequency'
    },
    parameters: {
      entryConditions: [
        'Price breaks above resistance with 20%+ volume spike',
        'Consolidation period of at least 10 periods',
        'ATR expansion indicating increased volatility'
      ],
      exitConditions: [
        'Price fails to make new highs for 5 periods',
        'Volume decreases significantly',
        'Price retraces 50% of breakout move'
      ],
      riskManagement: {
        stopLoss: 'Below breakout level or recent swing low',
        takeProfit: 'Measured move target or next resistance',
        positionSizing: '1.5-2.5% account risk (higher for breakouts)'
      },
      indicators: ['Volume', 'ATR', 'Support/Resistance levels', 'Consolidation patterns']
    },
    marketConditions: {
      best: 'High volatility markets with clear breakout setups',
      avoid: 'Low volatility or whipsaw market conditions'
    },
    complexity: 'Intermediate',
    icon: Zap,
    color: 'bg-orange-500',
    professionalUse: {
      hedgeFunds: true,
      retailTraders: true,
      institutionalTraders: true,
      description: 'Widely used by momentum funds and CTA strategies'
    }
  },
  {
    id: 'pairs-statistical-arbitrage',
    name: 'Statistical Pairs Trading',
    description: 'Market-neutral strategy trading correlated assets - core strategy for quantitative hedge funds',
    category: 'Arbitrage',
    assetTypes: ['Stocks', 'ETFs', 'Forex Pairs'],
    timeframes: {
      primary: ['1H', '4H', '1D'],
      optimal: '4H',
      description: 'Longer timeframes reduce transaction costs'
    },
    parameters: {
      entryConditions: [
        'Price ratio deviates 2+ standard deviations from mean',
        'Strong historical correlation (>0.7)',
        'Cointegration test passes'
      ],
      exitConditions: [
        'Price ratio returns to mean',
        'Correlation breaks down significantly',
        'Maximum holding period reached (30 days)'
      ],
      riskManagement: {
        stopLoss: '3 standard deviations from entry',
        takeProfit: 'Return to mean or slight overcorrection',
        positionSizing: 'Equal dollar amounts long/short'
      },
      indicators: ['Price Ratio', 'Z-Score', 'Correlation', 'Cointegration']
    },
    marketConditions: {
      best: 'Stable market conditions with functioning correlations',
      avoid: 'Crisis periods when correlations break down'
    },
    complexity: 'Advanced',
    icon: BarChart3,
    color: 'bg-purple-500',
    professionalUse: {
      hedgeFunds: true,
      retailTraders: false,
      institutionalTraders: true,
      description: 'Core strategy for market-neutral hedge funds'
    }
  },
  {
    id: 'rsi-divergence',
    name: 'RSI Divergence Strategy',
    description: 'Identifies trend reversal opportunities using momentum divergences - used by technical analysis professionals',
    category: 'Mean Reversion',
    assetTypes: ['Stocks', 'Forex', 'Crypto'],
    timeframes: {
      primary: ['1H', '4H', '1D'],
      optimal: '4H',
      description: 'Higher timeframes provide more reliable divergence signals'
    },
    parameters: {
      entryConditions: [
        'Price makes lower low, RSI makes higher low (bullish divergence)',
        'RSI below 40 for bullish, above 60 for bearish',
        'Confirmation candle in opposite direction'
      ],
      exitConditions: [
        'RSI reaches opposite extreme (30/70)',
        'Price reaches target based on previous swing',
        'Divergence pattern invalidated'
      ],
      riskManagement: {
        stopLoss: 'Below/above recent swing point',
        takeProfit: 'Previous swing high/low or Fibonacci levels',
        positionSizing: '1-2% account risk per trade'
      },
      indicators: ['RSI (14)', 'Price Action', 'Support/Resistance', 'Fibonacci']
    },
    marketConditions: {
      best: 'Trending markets showing signs of exhaustion',
      avoid: 'Strong momentum markets without divergences'
    },
    complexity: 'Intermediate',
    icon: Target,
    color: 'bg-red-500',
    professionalUse: {
      hedgeFunds: false,
      retailTraders: true,
      institutionalTraders: true,
      description: 'Popular among discretionary traders and technical analysts'
    }
  },
  {
    id: 'macd-trend-confirmation',
    name: 'MACD Trend Confirmation',
    description: 'Momentum-based trend confirmation strategy - staple of institutional technical analysis',
    category: 'Trend',
    assetTypes: ['Stocks', 'Forex', 'ETFs'],
    timeframes: {
      primary: ['4H', '1D', '1W'],
      optimal: '1D',
      description: 'Daily charts provide best balance of signal quality'
    },
    parameters: {
      entryConditions: [
        'MACD line crosses above signal line',
        'MACD histogram turns positive',
        'Price above 50-period moving average'
      ],
      exitConditions: [
        'MACD line crosses below signal line',
        'MACD histogram shows weakening momentum',
        'Price closes below moving average'
      ],
      riskManagement: {
        stopLoss: '2 ATR below entry for long positions',
        takeProfit: 'Trail stop using moving average or ATR',
        positionSizing: '1.5-2% account risk per trade'
      },
      indicators: ['MACD (12,26,9)', 'Moving Average (50)', 'ATR', 'Volume']
    },
    marketConditions: {
      best: 'Trending markets with clear momentum',
      avoid: 'Choppy, sideways markets'
    },
    complexity: 'Beginner',
    icon: ArrowUpDown,
    color: 'bg-indigo-500',
    professionalUse: {
      hedgeFunds: true,
      retailTraders: true,
      institutionalTraders: true,
      description: 'Widely used as trend confirmation across all trader types'
    }
  }
];

export const getStrategiesByAsset = (assetType: string): ProfessionalStrategy[] => {
  return professionalStrategies.filter(strategy => 
    strategy.assetTypes.includes(assetType)
  );
};

export const getStrategyById = (id: string): ProfessionalStrategy | undefined => {
  return professionalStrategies.find(strategy => strategy.id === id);
};