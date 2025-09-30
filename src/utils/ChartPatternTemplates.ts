import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Zap,
  Triangle,
  Flag,
  Repeat,
  Sparkles,
  BarChart3,
  LucideIcon
} from 'lucide-react';

export interface ChartPatternTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Reversal' | 'Continuation' | 'Candlestick' | 'Harmonic' | 'Breakout';
  complexity: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  icon: LucideIcon;
  color: string;
  assetTypes: string[];
  timeframes: {
    optimal: string;
    supported: string[];
    description: string;
  };
  accuracy: string;
  defaultTarget: number; // Default target gain %
  defaultStopLoss: number; // Default stop loss %
  professionalUse: {
    hedgeFunds: boolean;
    institutionalTraders: boolean;
    retailTraders: boolean;
  };
  patternDetails: {
    detectCriteria: string[];
    confirmationRules: string[];
    entryTrigger: string;
    invalidation: string;
  };
}

export const chartPatternTemplates: ChartPatternTemplate[] = [
  // REVERSAL PATTERNS
  {
    id: 'head-shoulders',
    name: 'Head & Shoulders',
    description: 'Classic reversal pattern with three peaks, middle one highest. Reliable bearish signal at trend tops.',
    category: 'Reversal',
    complexity: 'Intermediate',
    icon: TrendingDown,
    color: 'bg-red-500',
    assetTypes: ['Forex', 'Stocks', 'Indices', 'Crypto'],
    timeframes: {
      optimal: '4H, 1D',
      supported: ['1H', '4H', '1D', '1W'],
      description: 'Works best on higher timeframes where major reversals occur'
    },
    accuracy: '70-80%',
    defaultTarget: 5.0,
    defaultStopLoss: 2.0,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Three peaks with middle peak highest', 'Clear neckline support', 'Volume decreases on right shoulder'],
      confirmationRules: ['Price breaks below neckline', 'Volume increases on breakdown', 'Retest of neckline as resistance'],
      entryTrigger: 'Break and close below neckline with volume',
      invalidation: 'Price closes above right shoulder high'
    }
  },
  {
    id: 'inverse-head-shoulders',
    name: 'Inverse Head & Shoulders',
    description: 'Bullish reversal pattern with three troughs, middle one lowest. Strong bottom formation signal.',
    category: 'Reversal',
    complexity: 'Intermediate',
    icon: TrendingUp,
    color: 'bg-green-500',
    assetTypes: ['Forex', 'Stocks', 'Indices', 'Crypto'],
    timeframes: {
      optimal: '4H, 1D',
      supported: ['1H', '4H', '1D', '1W'],
      description: 'Most reliable on daily and 4-hour charts for major bottoms'
    },
    accuracy: '70-80%',
    defaultTarget: 5.0,
    defaultStopLoss: 2.0,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Three troughs with middle trough lowest', 'Neckline resistance', 'Volume increases on right shoulder'],
      confirmationRules: ['Price breaks above neckline', 'Strong volume on breakout', 'Pullback holds neckline support'],
      entryTrigger: 'Break and close above neckline with volume',
      invalidation: 'Price closes below right shoulder low'
    }
  },
  {
    id: 'double-top',
    name: 'Double Top',
    description: 'Two peaks at similar levels indicating exhaustion of uptrend. M-shaped bearish reversal.',
    category: 'Reversal',
    complexity: 'Beginner',
    icon: TrendingDown,
    color: 'bg-red-600',
    assetTypes: ['Forex', 'Stocks', 'Indices', 'Crypto', 'Commodities'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['15M', '1H', '4H', '1D'],
      description: 'Effective across all major timeframes'
    },
    accuracy: '65-75%',
    defaultTarget: 3.5,
    defaultStopLoss: 1.5,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Two peaks at approximately same price level', 'Valley between peaks', 'Second peak fails at resistance'],
      confirmationRules: ['Break below valley support', 'Measured move projection', 'Volume confirmation'],
      entryTrigger: 'Close below valley support level',
      invalidation: 'New high above second peak'
    }
  },
  {
    id: 'double-bottom',
    name: 'Double Bottom',
    description: 'Two troughs at similar levels showing support. W-shaped bullish reversal pattern.',
    category: 'Reversal',
    complexity: 'Beginner',
    icon: TrendingUp,
    color: 'bg-green-600',
    assetTypes: ['Forex', 'Stocks', 'Indices', 'Crypto', 'Commodities'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['15M', '1H', '4H', '1D'],
      description: 'Reliable across multiple timeframes'
    },
    accuracy: '65-75%',
    defaultTarget: 3.5,
    defaultStopLoss: 1.5,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Two troughs at similar price level', 'Peak between troughs', 'Second trough holds support'],
      confirmationRules: ['Break above peak resistance', 'Volume surge on breakout', 'Pullback holds'],
      entryTrigger: 'Close above peak resistance level',
      invalidation: 'New low below second trough'
    }
  },

  // CONTINUATION PATTERNS
  {
    id: 'bull-flag',
    name: 'Bull Flag',
    description: 'Strong uptrend followed by brief consolidation in downward channel. Continuation pattern.',
    category: 'Continuation',
    complexity: 'Beginner',
    icon: Flag,
    color: 'bg-blue-500',
    assetTypes: ['Forex', 'Stocks', 'Crypto'],
    timeframes: {
      optimal: '15M, 1H, 4H',
      supported: ['5M', '15M', '1H', '4H', '1D'],
      description: 'Fast-forming pattern, works on all timeframes'
    },
    accuracy: '70-80%',
    defaultTarget: 4.0,
    defaultStopLoss: 1.5,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Strong impulsive upward move', 'Tight consolidation with lower highs', 'Volume decreases during flag'],
      confirmationRules: ['Break above flag resistance', 'Volume surge on breakout', 'Projected target = flagpole length'],
      entryTrigger: 'Close above flag resistance with volume',
      invalidation: 'Break below flag support'
    }
  },
  {
    id: 'bear-flag',
    name: 'Bear Flag',
    description: 'Sharp downtrend followed by upward sloping consolidation. Bearish continuation.',
    category: 'Continuation',
    complexity: 'Beginner',
    icon: Flag,
    color: 'bg-orange-500',
    assetTypes: ['Forex', 'Stocks', 'Crypto'],
    timeframes: {
      optimal: '15M, 1H, 4H',
      supported: ['5M', '15M', '1H', '4H', '1D'],
      description: 'Quick pattern formation across timeframes'
    },
    accuracy: '70-80%',
    defaultTarget: 4.0,
    defaultStopLoss: 1.5,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Sharp downward move', 'Upward sloping consolidation', 'Decreasing volume in flag'],
      confirmationRules: ['Break below flag support', 'Volume increases on breakdown', 'Target = flagpole projection'],
      entryTrigger: 'Close below flag support with volume',
      invalidation: 'Break above flag resistance'
    }
  },
  {
    id: 'ascending-triangle',
    name: 'Ascending Triangle',
    description: 'Flat top resistance with rising support. Bullish continuation or reversal pattern.',
    category: 'Continuation',
    complexity: 'Intermediate',
    icon: Triangle,
    color: 'bg-teal-500',
    assetTypes: ['Forex', 'Stocks', 'Indices', 'Crypto'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['1H', '4H', '1D', '1W'],
      description: 'Requires multiple touches, best on higher timeframes'
    },
    accuracy: '75-85%',
    defaultTarget: 5.0,
    defaultStopLoss: 2.0,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Horizontal resistance at top', 'Rising support line', 'At least 2 touches each line', 'Compression near apex'],
      confirmationRules: ['Break above resistance with volume', 'Sustained move', 'Height of triangle = target'],
      entryTrigger: 'Close above resistance with volume surge',
      invalidation: 'Break below rising support'
    }
  },

  // CANDLESTICK PATTERNS
  {
    id: 'bullish-engulfing',
    name: 'Bullish Engulfing',
    description: 'Two-candle reversal: large green candle completely engulfs previous red candle.',
    category: 'Candlestick',
    complexity: 'Beginner',
    icon: Activity,
    color: 'bg-green-700',
    assetTypes: ['Forex', 'Stocks', 'Crypto', 'Commodities'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['15M', '1H', '4H', '1D'],
      description: 'Works on all timeframes with proper context'
    },
    accuracy: '60-70%',
    defaultTarget: 2.5,
    defaultStopLoss: 1.0,
    professionalUse: {
      hedgeFunds: false,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Prior downtrend', 'Small red candle', 'Large green candle engulfs entire red candle body'],
      confirmationRules: ['At support level', 'Volume increase on engulfing candle', 'Next candle confirms direction'],
      entryTrigger: 'Open of candle after engulfing pattern',
      invalidation: 'Close below engulfing candle low'
    }
  },
  {
    id: 'bearish-engulfing',
    name: 'Bearish Engulfing',
    description: 'Large red candle completely engulfs previous green candle. Strong reversal signal.',
    category: 'Candlestick',
    complexity: 'Beginner',
    icon: Activity,
    color: 'bg-red-700',
    assetTypes: ['Forex', 'Stocks', 'Crypto', 'Commodities'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['15M', '1H', '4H', '1D'],
      description: 'Effective across timeframes'
    },
    accuracy: '60-70%',
    defaultTarget: 2.5,
    defaultStopLoss: 1.0,
    professionalUse: {
      hedgeFunds: false,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Prior uptrend', 'Small green candle', 'Large red candle engulfs entire green candle body'],
      confirmationRules: ['At resistance level', 'Volume spike', 'Following bearish candle'],
      entryTrigger: 'Open of candle after engulfing',
      invalidation: 'Close above engulfing candle high'
    }
  },
  {
    id: 'hammer',
    name: 'Hammer / Pin Bar',
    description: 'Small body with long lower wick. Shows rejection of lower prices, bullish reversal.',
    category: 'Candlestick',
    complexity: 'Beginner',
    icon: Target,
    color: 'bg-cyan-500',
    assetTypes: ['Forex', 'Stocks', 'Crypto'],
    timeframes: {
      optimal: '4H, 1D',
      supported: ['1H', '4H', '1D'],
      description: 'Most reliable on daily charts at key support'
    },
    accuracy: '60-70%',
    defaultTarget: 2.0,
    defaultStopLoss: 1.0,
    professionalUse: {
      hedgeFunds: false,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Long lower wick (2-3x body)', 'Small body at top', 'Little to no upper wick', 'At support/downtrend'],
      confirmationRules: ['Next candle closes above hammer high', 'At key support level', 'Volume confirmation'],
      entryTrigger: 'Break above hammer high',
      invalidation: 'Close below hammer low'
    }
  },

  // HARMONIC PATTERNS
  {
    id: 'gartley',
    name: 'Gartley Pattern',
    description: 'Fibonacci-based harmonic pattern. XABCD structure with specific ratios.',
    category: 'Harmonic',
    complexity: 'Advanced',
    icon: Sparkles,
    color: 'bg-purple-500',
    assetTypes: ['Forex', 'Stocks', 'Indices'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['1H', '4H', '1D'],
      description: 'Requires precise Fibonacci ratios, best on higher timeframes'
    },
    accuracy: '70-80%',
    defaultTarget: 6.0,
    defaultStopLoss: 2.5,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: false
    },
    patternDetails: {
      detectCriteria: ['XA leg establishes trend', 'AB retracement 61.8% of XA', 'BC retracement 38.2-88.6% of AB', 'D completion at 78.6% of XA'],
      confirmationRules: ['All Fibonacci ratios align', 'Volume divergence at D', 'Price action reversal at D'],
      entryTrigger: 'Reversal confirmation at point D',
      invalidation: 'Price moves beyond X point'
    }
  },

  // BREAKOUT PATTERNS
  {
    id: 'opening-range-breakout',
    name: 'Opening Range Breakout (ORB)',
    description: 'Trade breakout of first 30-60 minutes range. Captures day momentum.',
    category: 'Breakout',
    complexity: 'Beginner',
    icon: Zap,
    color: 'bg-yellow-500',
    assetTypes: ['Stocks', 'Indices', 'Forex'],
    timeframes: {
      optimal: '5M, 15M',
      supported: ['1M', '5M', '15M'],
      description: 'Intraday pattern for session opens'
    },
    accuracy: '55-65%',
    defaultTarget: 2.0,
    defaultStopLoss: 1.0,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Mark high/low of first 30min', 'Wait for consolidation', 'Volume buildup'],
      confirmationRules: ['Strong break above/below range', 'Volume 2x average', 'Momentum confirmation'],
      entryTrigger: 'Close outside opening range with volume',
      invalidation: 'Return inside opening range'
    }
  },
  {
    id: 'volatility-squeeze',
    name: 'Volatility Squeeze / NR7',
    description: 'Narrowest range in 7 bars. Low volatility precedes explosive move.',
    category: 'Breakout',
    complexity: 'Intermediate',
    icon: BarChart3,
    color: 'bg-indigo-500',
    assetTypes: ['Forex', 'Stocks', 'Crypto'],
    timeframes: {
      optimal: '1H, 4H, 1D',
      supported: ['1H', '4H', '1D'],
      description: 'Contraction pattern best on higher timeframes'
    },
    accuracy: '60-70%',
    defaultTarget: 4.0,
    defaultStopLoss: 1.5,
    professionalUse: {
      hedgeFunds: true,
      institutionalTraders: true,
      retailTraders: true
    },
    patternDetails: {
      detectCriteria: ['Current bar has narrowest range of last 7 bars', 'Bollinger Bands squeeze', 'ATR declining'],
      confirmationRules: ['Directional break with volume', 'ATR expansion', 'Momentum indicator confirms'],
      entryTrigger: 'Breakout direction confirmed with volume',
      invalidation: 'False breakout returns to range'
    }
  }
];
