/**
 * Maps strategy article slugs to their educational primer configurations.
 * Based on research from Investopedia, BabyPips, CMT curriculum, and TradingView education.
 * 
 * Each configuration provides comprehensive beginner-to-professional educational content
 * following industry best practices for trading education.
 */

import { StrategyPrimerData } from '@/components/blog/StrategyPrimer';

/**
 * Master mapping of article slugs to strategy primer data.
 * Organized by category for maintainability.
 */
export const STRATEGY_PRIMER_MAPPING: Record<string, StrategyPrimerData> = {
  // ===== MACD INDICATOR =====
  'macd-complete-strategy': {
    strategyName: 'MACD (Moving Average Convergence Divergence)',
    category: 'indicator',
    difficulty: 'beginner',
    whatIsIt: 'MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price. It consists of three components: the MACD line (difference between 12 and 26-period EMAs), the signal line (9-period EMA of the MACD line), and the histogram (difference between MACD and signal lines). When these lines cross, they generate trading signals.',
    whyItMatters: 'MACD is one of the most widely used indicators in technical analysis because it combines trend and momentum in a single tool. It helps traders identify when a trend is gaining or losing strength, potential reversals, and optimal entry/exit points. Professional traders and institutions use MACD as a core component of their analysis.',
    history: {
      origin: 'MACD was developed in the late 1970s and has since become one of the most trusted and widely used indicators in technical analysis.',
      developer: 'Gerald Appel',
      yearIntroduced: '1979'
    },
    analogy: 'Think of MACD like a car speedometer and its rate of change. The MACD line is your current speed, the signal line is your average speed over time, and when current speed crosses above average, you\'re accelerating (bullish). When it crosses below, you\'re decelerating (bearish). The histogram shows how quickly you\'re speeding up or slowing down.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'Futures'],
      bestTimeframes: ['Daily', '4H', '1H', 'Weekly'],
      marketConditions: 'Trending markets. MACD works best when prices are making sustained moves in one direction. Less effective in choppy, sideways markets.'
    },
    prerequisites: [
      {
        title: 'Moving Averages',
        description: 'Understanding how moving averages smooth price data and identify trends is essential, as MACD is built from two EMAs.',
        importance: 'essential'
      },
      {
        title: 'Trend Identification',
        description: 'Knowing how to identify uptrends and downtrends helps you use MACD signals in the right market context.',
        importance: 'essential'
      },
      {
        title: 'Momentum Concept',
        description: 'Understanding that momentum measures the rate of price change helps interpret MACD histogram readings.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'MACD Line',
        explanation: 'The difference between the 12-period EMA and 26-period EMA. When the faster EMA is above the slower EMA, the MACD line is positive (bullish). When below, it\'s negative (bearish).',
        example: 'If the 12 EMA is at $105 and the 26 EMA is at $100, the MACD line value is +5.'
      },
      {
        concept: 'Signal Line',
        explanation: 'A 9-period EMA of the MACD line itself. It acts as a trigger line - when MACD crosses above it, it\'s a buy signal; when it crosses below, it\'s a sell signal.',
        example: 'A trader might enter long when MACD crosses above the signal line after a pullback in an uptrend.'
      },
      {
        concept: 'Histogram',
        explanation: 'The visual difference between the MACD line and signal line. Expanding bars show increasing momentum; contracting bars show decreasing momentum.',
        example: 'Before a trend reversal, you\'ll often see the histogram bars getting smaller, signaling weakening momentum.'
      },
      {
        concept: 'Zero Line',
        explanation: 'The horizontal line at zero on the MACD chart. When MACD is above zero, the short-term trend is bullish. Below zero indicates a bearish short-term trend.',
        example: 'A bullish signal is more reliable when MACD crosses above its signal line AND is above the zero line.'
      }
    ],
    howItWorks: [
      {
        step: 'Calculate the MACD Line',
        detail: 'Subtract the 26-period EMA from the 12-period EMA. This shows whether short-term momentum is above or below longer-term momentum.'
      },
      {
        step: 'Calculate the Signal Line',
        detail: 'Apply a 9-period EMA to the MACD line. This smooths out the MACD and provides clearer crossover signals.'
      },
      {
        step: 'Generate the Histogram',
        detail: 'The histogram is the difference between the MACD and signal lines, shown as bars above or below zero.'
      },
      {
        step: 'Identify Crossover Signals',
        detail: 'Bullish signal: MACD crosses above signal line. Bearish signal: MACD crosses below signal line.'
      },
      {
        step: 'Confirm with Zero Line',
        detail: 'Signals above the zero line (during uptrends) are more bullish; signals below zero (during downtrends) are more bearish.'
      }
    ],
    signals: [
      {
        signal: 'Bullish Crossover',
        meaning: 'MACD line crosses above the signal line, indicating upward momentum is building',
        action: 'buy'
      },
      {
        signal: 'Bearish Crossover',
        meaning: 'MACD line crosses below the signal line, indicating downward momentum is building',
        action: 'sell'
      },
      {
        signal: 'Zero Line Cross Up',
        meaning: 'MACD crosses above zero, confirming a shift to bullish territory',
        action: 'buy'
      },
      {
        signal: 'Bullish Divergence',
        meaning: 'Price makes lower lows while MACD makes higher lows - momentum is actually improving',
        action: 'buy'
      },
      {
        signal: 'Histogram Shrinking',
        meaning: 'Bars are getting smaller, indicating the current trend is losing momentum',
        action: 'caution'
      }
    ],
    strengths: [
      'Combines trend and momentum in a single indicator',
      'Easy to read crossover signals for beginners',
      'Divergences provide early warning of potential reversals',
      'Works across all markets and timeframes',
      'Histogram provides visual momentum confirmation'
    ],
    limitations: [
      'Lagging indicator - signals come after price has moved',
      'Generates false signals in choppy, sideways markets',
      'Standard settings may not work for all instruments',
      'Can stay overbought/oversold for extended periods in strong trends',
      'Not reliable as a standalone indicator - needs confirmation'
    ],
    practicalTips: [
      'Use MACD signals in the direction of the larger trend for higher probability trades',
      'Look for divergences between price and MACD histogram for early reversal warnings',
      'Combine with support/resistance levels for better entry and exit points',
      'Consider using different MACD settings for different timeframes (faster for scalping, slower for swing trading)',
      'Pay attention to histogram expansion/contraction as an early momentum indicator'
    ],
    commonMistakes: [
      'Trading every crossover without considering market context or trend direction',
      'Ignoring divergences - they often precede significant reversals',
      'Using MACD alone without price action or other confirmation',
      'Not adjusting settings for different market volatility conditions',
      'Chasing signals in sideways markets where MACD generates many false crossovers'
    ],
    relatedStrategies: [
      { name: 'RSI', relationship: 'Momentum confirmation' },
      { name: 'Moving Averages', relationship: 'Trend direction' },
      { name: 'Stochastic', relationship: 'Overbought/oversold' }
    ]
  },

  // ===== RSI INDICATOR =====
  'rsi-strategy': {
    strategyName: 'RSI (Relative Strength Index)',
    category: 'indicator',
    difficulty: 'beginner',
    whatIsIt: 'RSI is a momentum oscillator that measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions. It ranges from 0 to 100, with readings above 70 traditionally considered overbought and readings below 30 considered oversold. RSI helps traders identify potential reversal points and trend strength.',
    whyItMatters: 'RSI is one of the most popular indicators because it provides clear, actionable signals. It helps traders avoid buying when prices are overextended and selling when prices may be due for a bounce. Understanding RSI is fundamental to technical analysis and is used by traders at all levels.',
    history: {
      origin: 'RSI was introduced in a 1978 book titled "New Concepts in Technical Trading Systems" and has become one of the most trusted oscillators.',
      developer: 'J. Welles Wilder Jr.',
      yearIntroduced: '1978'
    },
    analogy: 'Think of RSI like a rubber band. The more it stretches (high RSI), the more likely it is to snap back (price correction). The more it\'s compressed (low RSI), the more likely it is to spring up (price bounce). The band can stay stretched for a while, but eventually, it tends to return toward the middle.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'ETFs'],
      bestTimeframes: ['Daily', '4H', '1H', '15min'],
      marketConditions: 'Works in both trending and ranging markets. In trends, look for pullbacks to oversold/overbought. In ranges, fade the extremes.'
    },
    prerequisites: [
      {
        title: 'Price Action Basics',
        description: 'Understanding how price moves and forms support/resistance helps contextualize RSI readings.',
        importance: 'essential'
      },
      {
        title: 'Trend vs Range Markets',
        description: 'RSI interpretation differs based on whether the market is trending or ranging.',
        importance: 'essential'
      },
      {
        title: 'Candlestick Patterns',
        description: 'Combining RSI with candlestick reversal patterns improves signal accuracy.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'Overbought Zone (Above 70)',
        explanation: 'When RSI is above 70, the asset has been bought aggressively and may be due for a pullback. In strong uptrends, RSI can stay overbought for extended periods.',
        example: 'A stock rallies 20% in two weeks, pushing RSI to 82. While not an immediate sell signal, it warns buyers to be cautious.'
      },
      {
        concept: 'Oversold Zone (Below 30)',
        explanation: 'When RSI is below 30, the asset has been sold aggressively and may be due for a bounce. In strong downtrends, RSI can stay oversold.',
        example: 'After a market crash, RSI hits 15. This extreme reading often precedes a relief rally, though it doesn\'t guarantee the bottom.'
      },
      {
        concept: 'RSI Divergence',
        explanation: 'When price and RSI move in opposite directions. Bullish divergence: price makes lower lows while RSI makes higher lows. Bearish divergence: price makes higher highs while RSI makes lower highs.',
        example: 'Bitcoin makes a new high at $50,000 but RSI peaks at 65 vs. 75 at the previous high - bearish divergence warning of weakness.'
      },
      {
        concept: 'RSI 50 Centerline',
        explanation: 'RSI above 50 indicates bullish momentum dominates; below 50 indicates bearish momentum. The 50 line acts as support in uptrends and resistance in downtrends.',
        example: 'In an uptrend, RSI often bounces off 50 during pullbacks rather than falling to 30.'
      }
    ],
    howItWorks: [
      {
        step: 'Calculate Average Gains and Losses',
        detail: 'Look back over the RSI period (typically 14) and calculate the average of up days vs. down days.'
      },
      {
        step: 'Compute Relative Strength',
        detail: 'Divide average gains by average losses to get the RS (relative strength) value.'
      },
      {
        step: 'Normalize to 0-100 Scale',
        detail: 'Apply the RSI formula: 100 - (100 / (1 + RS)) to get a value between 0 and 100.'
      },
      {
        step: 'Identify Extremes',
        detail: 'Watch for readings above 70 (overbought) or below 30 (oversold) for potential reversals.'
      },
      {
        step: 'Confirm with Price Action',
        detail: 'Look for candlestick patterns or price structure confirmation before acting on RSI signals.'
      }
    ],
    signals: [
      {
        signal: 'Oversold Bounce (RSI < 30)',
        meaning: 'Price has been sold heavily and may be due for a bounce or reversal',
        action: 'buy'
      },
      {
        signal: 'Overbought Pullback (RSI > 70)',
        meaning: 'Price has been bought heavily and may be due for a pullback or reversal',
        action: 'sell'
      },
      {
        signal: 'Bullish Divergence',
        meaning: 'Price weakness is not confirmed by momentum - potential bottom forming',
        action: 'buy'
      },
      {
        signal: 'RSI Breaks Above 50',
        meaning: 'Momentum is shifting from bearish to bullish',
        action: 'buy'
      },
      {
        signal: 'RSI Failure Swing',
        meaning: 'RSI fails to reach previous extreme before reversing - strong reversal signal',
        action: 'caution'
      }
    ],
    strengths: [
      'Easy to read with clear overbought/oversold zones',
      'Works in both trending and ranging markets',
      'Divergences provide early warning of reversals',
      'Versatile across all markets and timeframes',
      'Can be used for entry timing and exit signals'
    ],
    limitations: [
      'Can stay overbought/oversold for extended periods in strong trends',
      'May generate premature reversal signals in trending markets',
      'Default 14-period may not suit all trading styles',
      'Requires price action confirmation for reliable signals',
      'Works better as a filter than a standalone trigger'
    ],
    practicalTips: [
      'In strong uptrends, use RSI pullbacks to 40-50 as buying opportunities rather than waiting for 30',
      'Combine RSI with support/resistance for higher probability entries',
      'Look for bullish divergences at key support levels for powerful buy signals',
      'Use shorter RSI periods (7-9) for more signals, longer (21) for fewer but stronger signals',
      'Don\'t fight strong trends - RSI can stay extreme longer than your account can stay solvent'
    ],
    commonMistakes: [
      'Selling just because RSI is overbought in a strong uptrend',
      'Buying every oversold reading without price confirmation',
      'Ignoring divergences - they often precede major reversals',
      'Using RSI alone without considering market structure',
      'Not adjusting RSI levels for different market regimes'
    ],
    relatedStrategies: [
      { name: 'MACD', relationship: 'Trend confirmation' },
      { name: 'Stochastic', relationship: 'Alternative oscillator' },
      { name: 'Bollinger Bands', relationship: 'Volatility context' }
    ]
  },

  // ===== MOVING AVERAGE CROSSOVER =====
  'moving-average-crossover-strategy': {
    strategyName: 'Moving Average Crossover',
    category: 'indicator',
    difficulty: 'beginner',
    whatIsIt: 'Moving Average Crossover is one of the most fundamental trend-following strategies. It uses two moving averages of different periods - when the faster (shorter-period) MA crosses above the slower (longer-period) MA, it signals a potential uptrend. When it crosses below, it signals a potential downtrend. This simple concept forms the basis of many professional trading systems.',
    whyItMatters: 'Moving average crossovers provide objective, rules-based signals that remove emotional decision-making. They help traders identify trend changes early and stay on the right side of the market. Many legendary traders, including Richard Dennis\'s Turtle Traders, have built fortunes using variations of this approach.',
    history: {
      origin: 'Moving averages have been used since the early 1900s, but crossover strategies became popular with the rise of computerized trading in the 1970s and 1980s. The "Golden Cross" and "Death Cross" are now watched by millions of traders worldwide.',
      developer: 'Various (systematic development)',
      yearIntroduced: '1970s'
    },
    analogy: 'Think of the two moving averages like a thermometer for market temperature. The fast MA shows today\'s temperature, while the slow MA shows the average over the past month. When today\'s temperature (fast MA) crosses above the monthly average (slow MA), it\'s getting warmer (bullish). When it crosses below, it\'s getting colder (bearish).',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'ETFs', 'Futures'],
      bestTimeframes: ['Daily', 'Weekly', '4H'],
      marketConditions: 'Trending markets. Crossovers work best when markets make sustained directional moves. They struggle in choppy, sideways conditions.'
    },
    prerequisites: [
      {
        title: 'Simple vs Exponential MAs',
        description: 'Understanding the difference between SMA (equal weight) and EMA (recent weight) helps you choose the right type.',
        importance: 'essential'
      },
      {
        title: 'Trend Basics',
        description: 'Knowing what constitutes an uptrend (higher highs/lows) and downtrend (lower highs/lows) provides context.',
        importance: 'essential'
      },
      {
        title: 'Timeframe Selection',
        description: 'Different timeframes produce different signal frequencies and lag.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'Fast Moving Average',
        explanation: 'The shorter-period MA that responds quickly to price changes. Common periods: 10, 12, 20, 50 days. More responsive but noisier.',
        example: 'A 10-day EMA hugs price closely and reacts quickly to new trends or reversals.'
      },
      {
        concept: 'Slow Moving Average',
        explanation: 'The longer-period MA that smooths out noise and identifies the major trend. Common periods: 50, 100, 200 days. More reliable but lags.',
        example: 'A 200-day SMA is used by institutions to define the major trend - above it is bullish, below is bearish.'
      },
      {
        concept: 'Golden Cross',
        explanation: 'When the 50-day MA crosses above the 200-day MA, it\'s historically considered a bullish signal for the medium term.',
        example: 'Apple\'s golden cross in 2019 preceded a 100%+ rally over the following year.'
      },
      {
        concept: 'Death Cross',
        explanation: 'When the 50-day MA crosses below the 200-day MA, it\'s considered a bearish warning signal.',
        example: 'The S&P 500 death cross in early 2020 coincided with the COVID crash.'
      }
    ],
    howItWorks: [
      {
        step: 'Select Two Moving Averages',
        detail: 'Choose a fast MA (e.g., 12 EMA) and slow MA (e.g., 26 EMA). Popular pairs: 9/21, 12/26, 20/50, 50/200.'
      },
      {
        step: 'Plot Both on Price Chart',
        detail: 'Add both MAs to your chart. The fast MA will be closer to price, the slow MA further away.'
      },
      {
        step: 'Wait for Crossover',
        detail: 'A bullish crossover occurs when fast crosses above slow. A bearish crossover occurs when fast crosses below slow.'
      },
      {
        step: 'Confirm the Signal',
        detail: 'Look for price to close above/below both MAs, increased volume, or other technical confirmation.'
      },
      {
        step: 'Manage the Position',
        detail: 'Stay in the trade as long as the MAs remain in favorable alignment. Exit on the opposite crossover.'
      }
    ],
    signals: [
      {
        signal: 'Bullish Crossover',
        meaning: 'Fast MA crosses above slow MA - short-term trend is outpacing long-term, bullish momentum building',
        action: 'buy'
      },
      {
        signal: 'Bearish Crossover',
        meaning: 'Fast MA crosses below slow MA - short-term trend weakening relative to long-term, bearish momentum',
        action: 'sell'
      },
      {
        signal: 'Price Above Both MAs',
        meaning: 'Price is above both MAs, both MAs are rising - strong uptrend confirmation',
        action: 'buy'
      },
      {
        signal: 'MAs Converging',
        meaning: 'Fast and slow MAs getting closer together - trend may be weakening or about to change',
        action: 'caution'
      }
    ],
    strengths: [
      'Simple, objective signals that anyone can follow',
      'Keeps you on the right side of major trends',
      'Easy to backtest and automate',
      'Works across all markets and timeframes',
      'Removes emotional decision-making'
    ],
    limitations: [
      'Signals lag - you won\'t catch the exact top or bottom',
      'Whipsaws in sideways markets cause false signals and losses',
      'No built-in profit target or stop loss',
      'Can give back significant profits waiting for exit signal',
      'Requires patience - fewer trades in trending strategies'
    ],
    practicalTips: [
      'Add a filter like ADX > 25 to only take signals in trending markets',
      'Use the slow MA as a trailing stop instead of waiting for a full crossover',
      'Consider the slope of both MAs - rising MAs in a bullish cross is stronger',
      'Combine with support/resistance for better entry points',
      'On higher timeframes (daily/weekly), crossovers catch major moves with fewer whipsaws'
    ],
    commonMistakes: [
      'Trading crossovers in sideways markets - wait for trending conditions',
      'Using periods that are too close together, causing excessive signals',
      'Not confirming with other factors like volume or price action',
      'Abandoning the strategy after a few whipsaws instead of trusting the process',
      'Over-optimizing periods to past data (curve fitting)'
    ],
    relatedStrategies: [
      { name: 'MACD', relationship: 'EMA-based momentum' },
      { name: 'Bollinger Bands', relationship: 'MA with volatility' },
      { name: 'ADX', relationship: 'Trend strength filter' }
    ]
  },

  // ===== BOLLINGER BANDS =====
  'bollinger-bands-strategy': {
    strategyName: 'Bollinger Bands',
    category: 'indicator',
    difficulty: 'intermediate',
    whatIsIt: 'Bollinger Bands consist of a middle band (20-period SMA) with an upper and lower band set at 2 standard deviations above and below. The bands expand when volatility increases and contract when volatility decreases. This creates a dynamic envelope around price that adapts to market conditions, helping identify overbought/oversold levels, volatility breakouts, and trend strength.',
    whyItMatters: 'Bollinger Bands are unique because they adapt to volatility rather than using fixed levels. This makes them more reliable across different market conditions. The "squeeze" pattern (contracting bands) often precedes explosive moves, giving traders an edge in timing breakout entries.',
    history: {
      origin: 'Bollinger Bands were developed in the early 1980s and formally introduced in 1983. They remain one of the most popular and versatile technical indicators.',
      developer: 'John Bollinger',
      yearIntroduced: '1983'
    },
    analogy: 'Think of Bollinger Bands like a rubber tunnel around price. The tunnel expands and contracts based on how wild price movements have been. When the tunnel gets very tight (squeeze), it\'s like a spring being compressed - eventually, it will release with a powerful move. When price touches the edges, it\'s stretched like a rubber band and often snaps back.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'Commodities'],
      bestTimeframes: ['Daily', '4H', '1H', '15min'],
      marketConditions: 'Versatile - works in both trending and ranging markets. Squeeze patterns work in consolidation; band rides work in trends.'
    },
    prerequisites: [
      {
        title: 'Moving Averages',
        description: 'The middle band is a 20-period SMA, so understanding MAs is fundamental.',
        importance: 'essential'
      },
      {
        title: 'Standard Deviation Basics',
        description: 'Understanding that bands measure volatility through statistical dispersion helps interpret signals.',
        importance: 'helpful'
      },
      {
        title: 'Volatility Concepts',
        description: 'Knowing that low volatility often precedes high volatility helps anticipate squeeze breakouts.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'The Squeeze',
        explanation: 'When the bands contract to their narrowest point, volatility is low. This often precedes a large directional move. The squeeze itself doesn\'t predict direction, only that a move is coming.',
        example: 'Tesla consolidated for weeks with bands at their tightest in months, then broke out 30% in the following weeks.'
      },
      {
        concept: 'Band Walk',
        explanation: 'In strong trends, price will "walk" along the upper or lower band, repeatedly touching it without reversing. This indicates trend strength, not overbought/oversold.',
        example: 'During Apple\'s 2020 rally, price walked along the upper band for weeks - selling at each touch would have been a costly mistake.'
      },
      {
        concept: 'Mean Reversion',
        explanation: 'In ranging markets, price touching the outer bands often reverts to the middle band. This is the basis for band-to-band trading strategies.',
        example: 'A stock oscillating between $95 and $105 touches the lower band at $95 - a mean reversion trader buys expecting a move back to the 20 SMA.'
      },
      {
        concept: '%B Indicator',
        explanation: 'Shows where price is relative to the bands. %B of 1 means at upper band, 0 means at lower band, 0.5 means at middle band.',
        example: 'A %B reading of 0.1 combined with RSI oversold provides a high-probability bounce setup.'
      }
    ],
    howItWorks: [
      {
        step: 'Calculate the Middle Band',
        detail: 'Compute a 20-period Simple Moving Average of closing prices.'
      },
      {
        step: 'Calculate Standard Deviation',
        detail: 'Compute the 20-period standard deviation of prices to measure recent volatility.'
      },
      {
        step: 'Plot Upper and Lower Bands',
        detail: 'Upper band = Middle band + (2 × StdDev). Lower band = Middle band - (2 × StdDev).'
      },
      {
        step: 'Identify Band Conditions',
        detail: 'Look for squeezes (narrow bands), breakouts (price breaking bands with momentum), or mean reversion setups.'
      },
      {
        step: 'Trade Based on Context',
        detail: 'In trends, buy band touches on the lower band. In ranges, fade touches on either band. After squeezes, trade the breakout direction.'
      }
    ],
    signals: [
      {
        signal: 'Squeeze Breakout Up',
        meaning: 'After band contraction, price breaks above upper band with increased volume - bullish momentum',
        action: 'buy'
      },
      {
        signal: 'Squeeze Breakout Down',
        meaning: 'After band contraction, price breaks below lower band with volume - bearish momentum',
        action: 'sell'
      },
      {
        signal: 'Lower Band Touch in Uptrend',
        meaning: 'Pullback to lower band in an uptrend - potential support and buying opportunity',
        action: 'buy'
      },
      {
        signal: 'Upper Band Fade in Range',
        meaning: 'Price reaching upper band in sideways market - potential resistance for mean reversion short',
        action: 'sell'
      },
      {
        signal: 'W Bottom Pattern',
        meaning: 'Price makes a low outside bands, bounces, makes a second low inside bands - bullish reversal pattern',
        action: 'buy'
      }
    ],
    strengths: [
      'Adapts to volatility - bands widen and narrow automatically',
      'The squeeze provides early warning of upcoming volatility',
      'Works for both trend-following and mean-reversion strategies',
      'Visual and intuitive to read',
      'Provides dynamic support/resistance levels'
    ],
    limitations: [
      'Bands can expand rapidly in volatile markets, making entries difficult',
      'Touches of bands are not reliable reversal signals in trends',
      'Squeeze doesn\'t predict direction, only that a move is coming',
      'Can produce false breakouts that reverse back inside bands',
      'Standard settings may need adjustment for different instruments'
    ],
    practicalTips: [
      'Use the squeeze as a setup, not a signal - wait for price to confirm direction',
      'In strong trends, don\'t fade upper band touches - look for pullbacks to the middle band instead',
      'Combine with RSI or other oscillators for higher probability reversal signals',
      'Watch for M-top and W-bottom patterns that form at the bands for reversal setups',
      'Consider using bandwidth indicator to quantify how tight the squeeze is'
    ],
    commonMistakes: [
      'Automatically selling when price touches the upper band in an uptrend',
      'Not recognizing the difference between trending and ranging conditions',
      'Trading every band touch without confirmation',
      'Ignoring the middle band as a potential target or stop level',
      'Expecting squeeze breakouts to always lead to sustained trends'
    ],
    relatedStrategies: [
      { name: 'Keltner Channels', relationship: 'ATR-based alternative' },
      { name: 'RSI', relationship: 'Confirmation oscillator' },
      { name: 'MACD', relationship: 'Momentum confirmation' }
    ]
  },

  // ===== SWING TRADING =====
  'swing-trading-strategy': {
    strategyName: 'Swing Trading',
    category: 'trading-style',
    difficulty: 'intermediate',
    whatIsIt: 'Swing trading is a trading style that aims to capture "swings" or short-to-medium term price movements over days to weeks. Unlike day trading (same-day positions) or position trading (months to years), swing traders hold positions through multiple days, profiting from price oscillations within a larger trend. It balances the frequency of day trading with the reduced time commitment of longer-term investing.',
    whyItMatters: 'Swing trading offers the best of both worlds: it provides meaningful profit opportunities without requiring constant screen time. Many successful traders prefer swing trading because it allows them to maintain a job or other activities while still actively participating in markets. It\'s also less stressful than day trading while offering more opportunities than buy-and-hold investing.',
    history: {
      origin: 'Swing trading has roots in the early 20th century work of technical analysis pioneers. The term gained popularity in the 1990s as more retail traders gained access to markets.',
      developer: 'Various (systematic development)',
      yearIntroduced: '1990s (terminology)'
    },
    analogy: 'Think of swing trading like surfing. You\'re not trying to catch every tiny ripple (day trading) or wait for a tsunami (position trading). You\'re looking for good waves (swings) that form regularly, riding them for a meaningful distance, then paddling back out to catch the next one.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'ETFs', 'Crypto'],
      bestTimeframes: ['Daily', '4H', 'Weekly for context'],
      marketConditions: 'Works best in markets with clear technical patterns and regular volatility. Trending markets offer better swing opportunities than flat markets.'
    },
    prerequisites: [
      {
        title: 'Support and Resistance',
        description: 'Swing points form at S/R levels. Understanding these is critical for entry, stop, and target placement.',
        importance: 'essential'
      },
      {
        title: 'Trend Identification',
        description: 'Knowing whether you\'re trading with or against the trend affects position sizing and expectations.',
        importance: 'essential'
      },
      {
        title: 'Risk Management',
        description: 'Holding overnight exposes you to gaps and events. Proper position sizing is mandatory.',
        importance: 'essential'
      },
      {
        title: 'Chart Pattern Recognition',
        description: 'Many swing setups come from breakouts of patterns like flags, wedges, and triangles.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'Swing Highs and Swing Lows',
        explanation: 'Price doesn\'t move in straight lines - it makes peaks (swing highs) and troughs (swing lows). Swing traders look to buy near swing lows and sell near swing highs.',
        example: 'In an uptrend, buy when price pulls back to form a higher low (swing low), with a stop below that low.'
      },
      {
        concept: 'Trading the Pullback',
        explanation: 'Rather than chasing breakouts, swing traders often wait for price to pull back to support (in uptrends) or resistance (in downtrends) before entering.',
        example: 'Stock breaks out to $50, pulls back to $47 (old resistance now support), swing trader enters long targeting $55.'
      },
      {
        concept: 'Multi-Timeframe Analysis',
        explanation: 'Use a higher timeframe (weekly) to determine the trend, then use a lower timeframe (daily) to time entries in the direction of that trend.',
        example: 'Weekly chart shows uptrend. Wait for daily chart to show pullback to 20 EMA, then enter long.'
      },
      {
        concept: 'Risk-Reward Ratio',
        explanation: 'Swing traders typically aim for 2:1 or 3:1 reward-to-risk ratios. This means risking $1 to potentially make $2-$3.',
        example: 'Entry at $100, stop at $97 (3% risk), target at $109 (9% reward) = 3:1 R:R.'
      }
    ],
    howItWorks: [
      {
        step: 'Identify the Trend',
        detail: 'Use weekly charts to determine the dominant trend. Trade primarily in that direction for higher probability.'
      },
      {
        step: 'Wait for a Setup',
        detail: 'On daily charts, look for pullbacks to support in uptrends, rallies to resistance in downtrends, or pattern breakouts.'
      },
      {
        step: 'Confirm the Entry',
        detail: 'Wait for a bullish reversal candle at support, volume confirmation, or indicator signal (RSI bounce, MACD cross).'
      },
      {
        step: 'Set Stop Loss',
        detail: 'Place stop below the swing low (for longs) or above swing high (for shorts). Never risk more than 1-2% of account.'
      },
      {
        step: 'Define Profit Target',
        detail: 'Target the next resistance level, previous swing high, or use a fixed R:R (e.g., 2:1).'
      },
      {
        step: 'Manage the Trade',
        detail: 'Trail stops as trade moves in your favor. Consider scaling out at key levels.'
      }
    ],
    signals: [
      {
        signal: 'Pullback to Support in Uptrend',
        meaning: 'Price retraces to a prior resistance-turned-support level - opportunity to enter with trend',
        action: 'buy'
      },
      {
        signal: 'Rally to Resistance in Downtrend',
        meaning: 'Price bounces to a prior support-turned-resistance level - opportunity to short with trend',
        action: 'sell'
      },
      {
        signal: 'Breakout with Volume',
        meaning: 'Price breaks out of consolidation with above-average volume - momentum confirmation',
        action: 'buy'
      },
      {
        signal: 'Bullish Divergence at Support',
        meaning: 'RSI making higher lows while price makes lower lows at key support - reversal likely',
        action: 'buy'
      }
    ],
    strengths: [
      'Doesn\'t require constant monitoring like day trading',
      'Captures larger moves than scalping',
      'Less stressful than intraday trading',
      'Works with a full-time job or other commitments',
      'Lower commission costs than frequent trading'
    ],
    limitations: [
      'Overnight and weekend gap risk',
      'Requires patience to wait for setups',
      'May miss opportunities if too selective',
      'Needs good risk management for holding through volatility',
      'Psychological challenge of holding through minor drawdowns'
    ],
    practicalTips: [
      'Trade liquid stocks/pairs with tight spreads and good volume',
      'Use limit orders to get better entry prices on pullbacks',
      'Keep a watchlist of 10-20 setups and wait for them to trigger',
      'Review trades weekly, not daily, to avoid overtrading',
      'Consider position size based on ATR to normalize risk across different volatility stocks'
    ],
    commonMistakes: [
      'Entering too early before pullback is complete',
      'Not using stop losses or moving them further away when losing',
      'Taking profits too early out of fear',
      'Overtrading when there are no quality setups',
      'Fighting the larger trend for counter-trend trades'
    ],
    relatedStrategies: [
      { name: 'Day Trading', relationship: 'Shorter timeframe style' },
      { name: 'Position Trading', relationship: 'Longer timeframe style' },
      { name: 'Trend Following', relationship: 'Complementary approach' }
    ]
  },

  // ===== TREND FOLLOWING =====
  'trend-following-strategy': {
    strategyName: 'Trend Following',
    category: 'trading-style',
    difficulty: 'beginner',
    whatIsIt: 'Trend following is a trading philosophy based on a simple premise: markets trend, and once a trend begins, it\'s more likely to continue than reverse. Trend followers don\'t predict where prices will go - they react to where prices are going. By entering in the direction of established trends and staying until the trend ends, they aim to capture the bulk of major market moves.',
    whyItMatters: 'Trend following is one of the few strategies proven to work over decades across all asset classes. Legendary traders like Richard Dennis, Ed Seykota, and the Turtle Traders made fortunes using trend following. It\'s also one of the most robust strategies because it doesn\'t rely on predicting the future - it simply reacts to what the market is doing.',
    history: {
      origin: 'While trend following has ancient roots, it was formalized as a systematic approach in the 1970s and 1980s. The Turtle Traders experiment proved it could be taught.',
      developer: 'Richard Dennis, Ed Seykota (pioneers)',
      yearIntroduced: '1983 (Turtle Trading experiment)'
    },
    analogy: 'Trend following is like swimming with the current instead of against it. You don\'t try to predict when the river will change direction - you simply notice when the current shifts and adjust your direction. Fighting the current (counter-trend trading) is exhausting and often futile.',
    marketContext: {
      bestMarkets: ['Futures', 'Forex', 'Commodities', 'Stocks'],
      bestTimeframes: ['Daily', 'Weekly'],
      marketConditions: 'Works best in markets with sustained directional moves. Struggles in choppy, mean-reverting conditions. Long-term success comes from catching big trends.'
    },
    prerequisites: [
      {
        title: 'Moving Averages',
        description: 'Most trend following systems use MAs to define trend direction and generate signals.',
        importance: 'essential'
      },
      {
        title: 'Drawdown Psychology',
        description: 'Trend followers experience many small losses and drawdowns. Understanding this is essential for sticking with the strategy.',
        importance: 'essential'
      },
      {
        title: 'Position Sizing',
        description: 'Proper position sizing ensures no single loss destroys the account while allowing winners to run.',
        importance: 'essential'
      }
    ],
    coreConcepts: [
      {
        concept: 'The Trend is Your Friend',
        explanation: 'Once established, trends tend to persist due to momentum, psychology, and fundamental factors. Fighting trends is a losing strategy long-term.',
        example: 'The S&P 500 uptrend from 2009-2020 rewarded those who stayed long, punished those who repeatedly called tops.'
      },
      {
        concept: 'Let Profits Run, Cut Losses Short',
        explanation: 'Trend followers use tight stops to limit losses but wide targets (or no targets) to let winning trades compound.',
        example: 'Risk $100 per trade. Take 6 small losses of $100 each, but when you\'re right, ride the winner for $1000+.'
      },
      {
        concept: 'Win Rate vs. Win Size',
        explanation: 'Trend following typically has a low win rate (30-40%) but a high average win/loss ratio (3:1 or higher). A few big wins cover many small losses.',
        example: 'Win 3 out of 10 trades, but the 3 winners average $500 while 7 losers average $100. Net profit: $800.'
      },
      {
        concept: 'Systematic Rules',
        explanation: 'Trend following systems are mechanical. Rules are defined in advance for entry, exit, and position sizing - no discretion or prediction.',
        example: 'Turtle Trading: Buy on 20-day breakout, exit on 10-day breakout in opposite direction. No judgment needed.'
      }
    ],
    howItWorks: [
      {
        step: 'Define the Trend',
        detail: 'Use objective criteria: price above 200 MA = uptrend, below = downtrend. Or use higher highs/lows structure.'
      },
      {
        step: 'Wait for Entry Signal',
        detail: 'Enter when trend is confirmed: breakout above resistance, moving average crossover, or new highs/lows.'
      },
      {
        step: 'Set Initial Stop',
        detail: 'Use ATR or recent swing point to set a stop that gives the trade room to breathe but limits loss.'
      },
      {
        step: 'Let the Trade Run',
        detail: 'Don\'t take profits early. Trail the stop as price moves in your favor using ATR, moving averages, or swing points.'
      },
      {
        step: 'Exit When Trend Ends',
        detail: 'Exit when your trailing stop is hit or when a reversal signal triggers (opposite crossover, structure break).'
      }
    ],
    signals: [
      {
        signal: 'Price Breaks Above Resistance',
        meaning: 'New high suggests buyers in control and trend continuation - enter long',
        action: 'buy'
      },
      {
        signal: 'MA Crossover Bullish',
        meaning: 'Short-term momentum exceeding long-term momentum - trend starting or accelerating',
        action: 'buy'
      },
      {
        signal: 'Higher Lows Forming',
        meaning: 'Each pullback finds support at a higher level - uptrend structure intact',
        action: 'buy'
      },
      {
        signal: 'Price Closes Below Trailing Stop',
        meaning: 'Trend momentum fading or reversing - exit to protect profits',
        action: 'sell'
      }
    ],
    strengths: [
      'Backed by decades of academic research and real-world success',
      'Works across all markets and timeframes',
      'Doesn\'t require prediction - reacts to what IS happening',
      'Big winners can more than offset many small losses',
      'Fully systematic and automatable'
    ],
    limitations: [
      'Low win rate is psychologically difficult for many traders',
      'Extended drawdown periods (months) are normal',
      'Underperforms in choppy, sideways markets',
      'Requires patience and discipline to follow the rules',
      'May miss tops and bottoms - by design'
    ],
    practicalTips: [
      'Diversify across uncorrelated markets to smooth equity curve',
      'Use position sizing based on volatility (ATR) so each trade has equal risk',
      'Trade the same position size whether you feel confident or not',
      'Review your rules monthly, not daily - avoid the temptation to tweak',
      'Accept that most trades will be losers - that\'s how trend following works'
    ],
    commonMistakes: [
      'Taking profits too early instead of letting winners run',
      'Widening stops when trade goes against you',
      'Abandoning the system after a losing streak',
      'Over-optimizing rules to past data (curve fitting)',
      'Not diversifying across multiple markets'
    ],
    relatedStrategies: [
      { name: 'Momentum Trading', relationship: 'Similar philosophy' },
      { name: 'Breakout Trading', relationship: 'Entry methodology' },
      { name: 'Turtle Trading', relationship: 'Famous implementation' }
    ]
  },

  // ===== CANDLESTICK PATTERNS - DOJI =====
  'doji-patterns': {
    strategyName: 'Doji Candlestick Patterns',
    category: 'candlestick',
    difficulty: 'beginner',
    whatIsIt: 'A Doji is a candlestick pattern that forms when the opening and closing prices are virtually equal, resulting in a very small or nonexistent body. The pattern indicates indecision in the market - neither buyers nor sellers could gain control. While a single Doji is just a sign of pause, when it appears after a strong trend or at key levels, it can signal potential reversals.',
    whyItMatters: 'Doji patterns are among the most important candlestick formations because they capture moments of market equilibrium. When appearing at significant price levels (support, resistance, Fibonacci levels), they often precede trend changes. Understanding Dojis helps traders identify when momentum is shifting before a reversal begins.',
    history: {
      origin: 'Candlestick charting originated in 18th century Japan for rice trading. The Doji is one of the most ancient and respected patterns.',
      developer: 'Munehisa Homma (Japanese rice trader)',
      yearIntroduced: '1700s'
    },
    analogy: 'A Doji is like a tug-of-war that ends in a draw. Both teams (bulls and bears) pulled hard all day, but at the end, neither gained ground. The rope ended where it started. After such an exhausting match, one team often dominates the next round.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'Futures'],
      bestTimeframes: ['Daily', '4H', '1H'],
      marketConditions: 'Most significant after extended trends or at key support/resistance levels. Less meaningful in sideways markets.'
    },
    prerequisites: [
      {
        title: 'Candlestick Basics',
        description: 'Understanding open, close, high, low and how they form candle bodies and wicks is essential.',
        importance: 'essential'
      },
      {
        title: 'Support and Resistance',
        description: 'Dojis at S/R levels are much more significant than random Dojis in the middle of a trend.',
        importance: 'essential'
      },
      {
        title: 'Trend Context',
        description: 'A Doji after a long trend is significant; a Doji in a sideways market is not.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'Standard Doji',
        explanation: 'Open and close are at the same level with wicks on both sides. Shows perfect indecision between bulls and bears.',
        example: 'After 5 green candles up, a Doji forms. This suggests bullish momentum may be pausing.'
      },
      {
        concept: 'Dragonfly Doji',
        explanation: 'Open and close at the high of the day with a long lower wick. Shows sellers pushed price down but buyers brought it all the way back.',
        example: 'At support, a Dragonfly Doji suggests strong buying interest - potential reversal up.'
      },
      {
        concept: 'Gravestone Doji',
        explanation: 'Open and close at the low of the day with a long upper wick. Shows buyers pushed up but sellers rejected it completely.',
        example: 'At resistance, a Gravestone Doji shows strong selling pressure - potential reversal down.'
      },
      {
        concept: 'Confirmation',
        explanation: 'A Doji alone is just indecision. The next candle confirms the direction. Bullish candle after Doji = potential reversal up.',
        example: 'Doji forms at support. Next candle is bullish. Enter long on close of confirmation candle.'
      }
    ],
    howItWorks: [
      {
        step: 'Identify the Doji',
        detail: 'Look for candles where open and close are at or very close to the same price. The body should be minimal.'
      },
      {
        step: 'Check the Context',
        detail: 'Is this Doji after a strong trend? At a key support/resistance level? At a Fibonacci level? Context determines significance.'
      },
      {
        step: 'Note the Doji Type',
        detail: 'Standard (indecision), Dragonfly (bullish implications), or Gravestone (bearish implications).'
      },
      {
        step: 'Wait for Confirmation',
        detail: 'Don\'t trade the Doji alone. Wait for the next candle to show which side wins.'
      },
      {
        step: 'Enter with the Confirmation',
        detail: 'If next candle is bullish, go long. If bearish, go short. Place stop beyond the Doji\'s extreme.'
      }
    ],
    signals: [
      {
        signal: 'Doji at Support + Bullish Candle',
        meaning: 'Indecision at support resolved in favor of bulls - potential reversal up',
        action: 'buy'
      },
      {
        signal: 'Doji at Resistance + Bearish Candle',
        meaning: 'Indecision at resistance resolved in favor of bears - potential reversal down',
        action: 'sell'
      },
      {
        signal: 'Dragonfly Doji after Downtrend',
        meaning: 'Sellers tried but buyers defended - bullish reversal potential',
        action: 'buy'
      },
      {
        signal: 'Gravestone Doji after Uptrend',
        meaning: 'Buyers tried but sellers rejected - bearish reversal potential',
        action: 'sell'
      },
      {
        signal: 'Multiple Dojis in Row',
        meaning: 'Extended indecision often precedes explosive move - wait for breakout',
        action: 'caution'
      }
    ],
    strengths: [
      'Easy to identify visually',
      'Provides early warning of potential reversals',
      'Works across all markets and timeframes',
      'Clear entry trigger (confirmation candle)',
      'Natural stop loss level (Doji extreme)'
    ],
    limitations: [
      'Meaningless without context (trend, S/R level)',
      'Requires confirmation - not a standalone signal',
      'Many Dojis don\'t lead to reversals',
      'Definition can be subjective (how small is small?)',
      'In choppy markets, produces many false signals'
    ],
    practicalTips: [
      'Only trade Dojis at significant levels - support, resistance, round numbers, Fibonacci',
      'Combine with other indicators like RSI divergence for higher probability',
      'Use the Doji\'s high/low as your stop loss placement',
      'Enter after the confirmation candle closes, not during',
      'In strong trends, Dojis often just mark brief pauses, not reversals'
    ],
    commonMistakes: [
      'Trading every Doji regardless of context',
      'Not waiting for confirmation candle',
      'Expecting Dojis to signal reversals in strong trends',
      'Placing stops too tight (should be beyond Doji extreme)',
      'Ignoring the type of Doji and its specific implications'
    ],
    relatedStrategies: [
      { name: 'Hammer/Hanging Man', relationship: 'Similar reversal patterns' },
      { name: 'Engulfing Patterns', relationship: 'Stronger reversal patterns' },
      { name: 'RSI Divergence', relationship: 'Confirmation tool' }
    ]
  },

  // ===== ENGULFING PATTERNS =====
  'engulfing-patterns': {
    strategyName: 'Engulfing Candlestick Patterns',
    category: 'candlestick',
    difficulty: 'beginner',
    whatIsIt: 'An engulfing pattern is a two-candle reversal pattern where the second candle\'s body completely engulfs (covers) the first candle\'s body. A bullish engulfing occurs at the bottom of a downtrend: a small bearish candle followed by a larger bullish candle. A bearish engulfing occurs at the top of an uptrend: a small bullish candle followed by a larger bearish candle.',
    whyItMatters: 'Engulfing patterns are among the strongest candlestick reversal signals because they show a dramatic shift in control. The second candle literally overwhelms the first, demonstrating that the new side has taken over with conviction. These patterns have high accuracy when combined with other technical factors.',
    history: {
      origin: 'Part of the Japanese candlestick tradition developed for rice trading. Engulfing patterns represent a "change of guard" between bulls and bears.',
      developer: 'Japanese rice traders',
      yearIntroduced: '1700s'
    },
    analogy: 'An engulfing pattern is like a hostile takeover in business. The first candle represents the current management (old trend), and the second candle is the new owner coming in and completely overwhelming the previous regime. The size of the takeover (engulfing candle) shows how decisive the change is.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'Indices'],
      bestTimeframes: ['Daily', '4H', 'Weekly'],
      marketConditions: 'Most powerful after extended trends and at key support/resistance levels. Less meaningful in choppy or sideways markets.'
    },
    prerequisites: [
      {
        title: 'Candlestick Anatomy',
        description: 'Know the difference between body and wick. The engulfing requires the body to engulf, not just the wicks.',
        importance: 'essential'
      },
      {
        title: 'Trend Recognition',
        description: 'Engulfing patterns are only reversal signals if there\'s a trend to reverse. No trend = no signal.',
        importance: 'essential'
      },
      {
        title: 'Volume Analysis',
        description: 'High volume on the engulfing candle confirms the conviction behind the move.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'Bullish Engulfing',
        explanation: 'After a downtrend, a small red candle is followed by a large green candle that completely covers the red body. Shows buyers have overwhelmed sellers.',
        example: 'Stock falls from $50 to $40. A small red candle ($40.50 to $40) is followed by a big green candle ($39.80 to $41.50) - bullish engulfing.'
      },
      {
        concept: 'Bearish Engulfing',
        explanation: 'After an uptrend, a small green candle is followed by a large red candle that completely covers the green body. Shows sellers have overwhelmed buyers.',
        example: 'Stock rises from $30 to $40. A small green candle ($39.50 to $40) is followed by a big red candle ($40.20 to $38) - bearish engulfing.'
      },
      {
        concept: 'The "Quality" of the Pattern',
        explanation: 'Bigger engulfing candles (larger body) and higher volume make for stronger signals. Engulfing just the body vs. the entire range also matters.',
        example: 'An engulfing candle that is 3x the size of the prior candle with 2x average volume is a high-quality setup.'
      },
      {
        concept: 'Location Matters',
        explanation: 'Engulfing at major support/resistance, round numbers, or after extended moves are much more significant than random engulfing patterns.',
        example: 'Bullish engulfing at the 200-day MA after a 20% decline is more meaningful than one in the middle of a range.'
      }
    ],
    howItWorks: [
      {
        step: 'Identify the Trend',
        detail: 'There must be a clear uptrend or downtrend. In a downtrend, look for bullish engulfing. In uptrend, look for bearish engulfing.'
      },
      {
        step: 'Spot the Two-Candle Pattern',
        detail: 'First candle is small and in the direction of the trend. Second candle opens beyond first candle\'s close and closes beyond first candle\'s open.'
      },
      {
        step: 'Verify the Engulfing',
        detail: 'The second candle\'s body must completely cover the first candle\'s body. Wicks don\'t count for the basic pattern.'
      },
      {
        step: 'Check Volume',
        detail: 'Ideally, the engulfing candle has higher volume than average, confirming conviction.'
      },
      {
        step: 'Enter the Trade',
        detail: 'Enter on the close of the engulfing candle or on a slight pullback. Stop loss below/above the engulfing candle\'s extreme.'
      }
    ],
    signals: [
      {
        signal: 'Bullish Engulfing at Support',
        meaning: 'Sellers exhausted at support, buyers taking control - reversal up likely',
        action: 'buy'
      },
      {
        signal: 'Bearish Engulfing at Resistance',
        meaning: 'Buyers exhausted at resistance, sellers taking control - reversal down likely',
        action: 'sell'
      },
      {
        signal: 'Engulfing with High Volume',
        meaning: 'Strong conviction behind the reversal - higher probability signal',
        action: 'buy'
      },
      {
        signal: 'Engulfing after Extended Trend',
        meaning: 'Trend exhaustion confirmed by reversal pattern - mean reversion likely',
        action: 'caution'
      }
    ],
    strengths: [
      'One of the most reliable candlestick reversal patterns',
      'Provides clear entry (close of engulfing) and stop (beyond the pattern)',
      'Visual and easy to identify',
      'Works across all timeframes and markets',
      'Shows actual shift in buying/selling pressure'
    ],
    limitations: [
      'Requires a prior trend - doesn\'t work in choppy markets',
      'Can fail in strong trending markets where pullbacks don\'t reverse the trend',
      'Needs additional confirmation (S/R, volume, indicators) for reliability',
      'Stop loss can be wide if the engulfing candle is large',
      'Many patterns don\'t lead to sustained reversals'
    ],
    practicalTips: [
      'Trade engulfing patterns at key levels (S/R, MAs, Fibonacci) for higher probability',
      'Look for RSI divergence with the engulfing pattern for extra confirmation',
      'The bigger the engulfing candle relative to recent candles, the stronger the signal',
      'Enter on a slight pullback rather than chasing if the engulfing candle is very large',
      'On daily charts, wait for the day to close to confirm the pattern is valid'
    ],
    commonMistakes: [
      'Trading engulfing patterns without a preceding trend',
      'Ignoring the location - random engulfing patterns have low accuracy',
      'Not waiting for the candle to close before entering',
      'Setting stops too tight (should be beyond the engulfing extreme)',
      'Expecting every engulfing to lead to a major reversal'
    ],
    relatedStrategies: [
      { name: 'Doji Patterns', relationship: 'Indecision signals' },
      { name: 'Piercing/Dark Cloud', relationship: 'Similar reversal patterns' },
      { name: 'Support/Resistance', relationship: 'Context for patterns' }
    ]
  },

  // Add alias mappings for common variations
  'macd-strategy': {
    strategyName: 'MACD Strategy',
    category: 'indicator',
    difficulty: 'beginner',
    whatIsIt: 'MACD (Moving Average Convergence Divergence) strategy uses the relationship between fast and slow moving averages to identify trend changes and momentum. It provides clear crossover signals that indicate when to enter and exit positions based on shifting momentum.',
    whyItMatters: 'MACD is one of the most widely-used indicators because it effectively combines trend and momentum analysis. Professional traders use MACD crossovers, divergences, and histogram readings as core components of their decision-making process.',
    history: {
      origin: 'Developed in the late 1970s, MACD has become a staple indicator in technical analysis.',
      developer: 'Gerald Appel',
      yearIntroduced: '1979'
    },
    analogy: 'MACD is like comparing your current speed to your average speed. When you\'re accelerating faster than your average (bullish crossover), momentum is building. When you\'re slowing down relative to your average (bearish crossover), momentum is fading.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'ETFs'],
      bestTimeframes: ['Daily', '4H', '1H'],
      marketConditions: 'Best in trending markets. Avoid using during extended sideways periods.'
    },
    prerequisites: [
      { title: 'Moving Averages', description: 'MACD is built from EMAs', importance: 'essential' },
      { title: 'Trend Recognition', description: 'Use signals with the trend', importance: 'essential' }
    ],
    coreConcepts: [
      { concept: 'MACD Crossover', explanation: 'When MACD line crosses above signal line, it indicates bullish momentum; below indicates bearish momentum.' },
      { concept: 'Histogram', explanation: 'Shows the difference between MACD and signal lines - expanding bars mean strengthening momentum.' },
      { concept: 'Divergence', explanation: 'When price and MACD move in opposite directions, it often precedes reversals.' }
    ],
    howItWorks: [
      { step: 'Calculate MACD Line', detail: '12-period EMA minus 26-period EMA' },
      { step: 'Add Signal Line', detail: '9-period EMA of MACD line' },
      { step: 'Watch for Crossovers', detail: 'Bullish when MACD crosses above signal, bearish when below' }
    ],
    strengths: ['Easy to interpret', 'Combines trend and momentum', 'Versatile across markets'],
    limitations: ['Lagging indicator', 'False signals in ranges', 'Needs confirmation'],
    practicalTips: ['Trade crossovers in trend direction', 'Watch for divergences', 'Combine with S/R levels'],
    commonMistakes: ['Trading every crossover', 'Ignoring trend context', 'Using alone without confirmation']
  },

  'rsi-indicator': {
    strategyName: 'RSI Indicator',
    category: 'indicator',
    difficulty: 'beginner',
    whatIsIt: 'The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and magnitude of price changes on a scale of 0-100. Readings above 70 indicate overbought conditions, while readings below 30 suggest oversold conditions.',
    whyItMatters: 'RSI helps traders identify when assets are potentially overextended and due for a reversal or pullback. It\'s essential for timing entries and exits and spotting divergences that precede trend changes.',
    history: {
      origin: 'RSI was introduced in the 1978 book "New Concepts in Technical Trading Systems".',
      developer: 'J. Welles Wilder Jr.',
      yearIntroduced: '1978'
    },
    analogy: 'RSI is like a pressure gauge. When pressure (momentum) gets too high (overbought), something has to give. When it\'s too low (oversold), a bounce often follows. The gauge helps you see when extreme conditions are building.',
    marketContext: {
      bestMarkets: ['Stocks', 'Forex', 'Crypto', 'ETFs'],
      bestTimeframes: ['Daily', '4H', '1H', '15min'],
      marketConditions: 'Works in both trending and ranging markets, but interpretation differs.'
    },
    prerequisites: [
      { title: 'Price Action', description: 'Context for RSI readings', importance: 'essential' },
      { title: 'Trend vs Range', description: 'RSI works differently in each', importance: 'essential' }
    ],
    coreConcepts: [
      { concept: 'Overbought (>70)', explanation: 'Price has risen rapidly and may be due for a pullback.' },
      { concept: 'Oversold (<30)', explanation: 'Price has fallen rapidly and may be due for a bounce.' },
      { concept: 'RSI Divergence', explanation: 'Price and RSI moving in opposite directions signals potential reversal.' }
    ],
    howItWorks: [
      { step: 'Calculate Average Gains/Losses', detail: 'Compare up days to down days over the RSI period' },
      { step: 'Watch Extreme Levels', detail: 'Look for readings above 70 or below 30' },
      { step: 'Confirm with Price', detail: 'Wait for candlestick confirmation before acting' }
    ],
    strengths: ['Easy to read', 'Versatile', 'Divergences are powerful', 'Works in all markets'],
    limitations: ['Can stay overbought/oversold in trends', 'Needs confirmation', 'Not a timing tool alone'],
    practicalTips: ['In uptrends, buy RSI pullbacks to 40-50', 'Look for divergences at key levels', 'Combine with support/resistance'],
    commonMistakes: ['Selling every overbought reading', 'Not waiting for confirmation', 'Fighting strong trends']
  },

  // ===== CRYPTO ARBITRAGE =====
  'crypto-arbitrage': {
    strategyName: 'Crypto Arbitrage',
    category: 'trading-style',
    difficulty: 'advanced',
    whatIsIt: 'Crypto arbitrage is a trading strategy that profits from price differences of the same cryptocurrency across different exchanges or trading pairs. Because cryptocurrency markets are fragmented across hundreds of exchanges worldwide, each with different liquidity, user bases, and regional dynamics, the same Bitcoin or Ethereum can trade at different prices simultaneously. Arbitrageurs buy the asset on the cheaper exchange and sell on the more expensive one, capturing the spread as profit.',
    whyItMatters: 'Unlike directional trading strategies that require predicting price movements, arbitrage is theoretically "risk-free" profit—you\'re not betting on whether Bitcoin goes up or down, only that the price difference between two exchanges will close. In traditional markets, such opportunities are rare and quickly eliminated by professional traders. In crypto, the 24/7 market, hundreds of exchanges, and transfer delays create persistent inefficiencies that can be exploited with the right infrastructure and knowledge.',
    history: {
      origin: 'Arbitrage has existed since ancient times when merchants noticed price differences between city-states. The 2017-2018 crypto bull run made crypto arbitrage famous with the "Kimchi Premium" where Bitcoin traded up to 50% higher on South Korean exchanges due to capital controls and local demand.',
      developer: 'No single inventor - ancient trading practice',
      yearIntroduced: 'Ancient (crypto-specific: 2013+)'
    },
    analogy: 'Imagine you discover that apples cost $1 at the farmer\'s market but $1.50 at the grocery store across the street. You buy 100 apples at the market ($100) and immediately sell them at the grocery store ($150), pocketing $50. In crypto arbitrage, you\'re doing exactly this, but with Bitcoin instead of apples, and exchanges instead of markets. The catch? The "walk across the street" (blockchain transfer) takes time, and prices can change while you\'re walking.',
    marketContext: {
      bestMarkets: ['Bitcoin', 'Ethereum', 'Major altcoins', 'Stablecoins'],
      bestTimeframes: ['Real-time', 'Minutes', 'Seconds'],
      marketConditions: 'High volatility periods create larger spreads. Lower liquidity exchanges often have bigger price discrepancies. News events and sudden market moves create temporary mispricings.'
    },
    prerequisites: [
      {
        title: 'Multiple Exchange Accounts',
        description: 'You need verified accounts on multiple exchanges with funds pre-positioned on each. KYC verification can take days to weeks.',
        importance: 'essential'
      },
      {
        title: 'Understanding of Blockchain Transfer Times',
        description: 'Bitcoin confirmations take 10-60 minutes, Ethereum 15 seconds to minutes. This delay is your biggest risk—prices change while you transfer.',
        importance: 'essential'
      },
      {
        title: 'Fee Structure Knowledge',
        description: 'You must know all fees: trading fees (0.1-0.5%), withdrawal fees ($5-50), deposit fees, network gas fees. A 1% spread minus 0.8% in fees = 0.2% profit.',
        importance: 'essential'
      },
      {
        title: 'Capital Requirements',
        description: 'Arbitrage profits are small percentages. To make meaningful money, you need significant capital ($10,000+) spread across exchanges.',
        importance: 'essential'
      },
      {
        title: 'API and Automation Skills',
        description: 'Manual arbitrage is slow and error-prone. Serious arbitrageurs use bots that monitor prices and execute trades in milliseconds.',
        importance: 'helpful'
      }
    ],
    coreConcepts: [
      {
        concept: 'Spatial Arbitrage (Cross-Exchange)',
        explanation: 'The simplest form: buy Bitcoin at $42,000 on Exchange A, sell at $42,300 on Exchange B. The $300 difference (0.71%) minus fees is your profit.',
        example: 'BTC is $42,000 on Binance and $42,300 on Kraken. You have $42,000 in USDT on Binance and 1 BTC on Kraken. You buy 1 BTC on Binance while simultaneously selling 1 BTC on Kraken for $42,300. Net gain: $300 minus trading fees (~$84) = $216 profit.'
      },
      {
        concept: 'Triangular Arbitrage',
        explanation: 'Exploiting price differences between three trading pairs on the SAME exchange. No transfer risk, but opportunities are smaller and faster to disappear.',
        example: 'On one exchange: BTC/USD = $42,000, ETH/BTC = 0.05, ETH/USD = $2,150. Mathematically: 0.05 BTC × $42,000 = $2,100 (implied ETH price). But ETH/USD shows $2,150! You could buy ETH with BTC, sell ETH for USD, buy BTC with USD, and end up with more BTC than you started.'
      },
      {
        concept: 'Futures-Spot Basis Trade',
        explanation: 'When Bitcoin futures trade at a premium or discount to spot price, you can lock in the difference. Long spot + short futures captures the premium as it converges to zero at expiry.',
        example: 'BTC spot is $42,000 but March futures are $43,500 (3.5% premium). Buy 1 BTC spot, short 1 BTC futures. At expiration, futures converge to spot. You keep the $1,500 difference regardless of where BTC ends up.'
      },
      {
        concept: 'DEX-CEX Arbitrage',
        explanation: 'Decentralized exchanges (Uniswap, SushiSwap) and centralized exchanges often have different prices. DEXs use automated market makers that can deviate from CEX prices.',
        example: 'ETH is $2,100 on Coinbase but $2,050 on Uniswap due to a large sell order. Buy ETH on Uniswap, transfer to Coinbase, sell for $50 profit per ETH minus gas fees and trading fees.'
      },
      {
        concept: 'The Pre-Positioning Strategy',
        explanation: 'To avoid transfer delays, keep funds (both crypto and stablecoins) on multiple exchanges simultaneously. This lets you execute both legs instantly without waiting for blockchain confirmations.',
        example: 'You have $50,000 USDT on Binance and 1.2 BTC on Kraken. When a spread appears, you buy BTC on Binance with USDT while simultaneously selling BTC on Kraken for USDT. No transfers needed—you rebalance later when convenient.'
      }
    ],
    howItWorks: [
      {
        step: 'Step 1: Set Up Infrastructure',
        detail: 'Open and verify accounts on 3-5 major exchanges (Binance, Coinbase, Kraken, Bybit, OKX). Complete KYC verification. Enable API access for faster execution. Pre-fund each exchange with both crypto and stablecoins.'
      },
      {
        step: 'Step 2: Monitor Price Spreads',
        detail: 'Use aggregator tools or build your own to monitor BTC/USDT prices across all exchanges in real-time. Calculate the spread after ALL fees: (Higher Price - Lower Price) / Lower Price - Trading Fees - Withdrawal Fees - Deposit Fees = Net Profit %.'
      },
      {
        step: 'Step 3: Calculate Profitability Threshold',
        detail: 'Example: Binance fee 0.1% × 2 legs = 0.2%. Kraken fee 0.16% × 2 legs = 0.32%. Total fees = 0.52%. You need a spread of at least 0.6-0.7% to make the trade worthwhile after accounting for slippage.'
      },
      {
        step: 'Step 4: Execute Simultaneously',
        detail: 'When a profitable spread appears, you must execute BOTH legs at the same time. If you buy on Exchange A but delay selling on Exchange B, the price could move against you. Use limit orders at the displayed prices, not market orders which may slip.'
      },
      {
        step: 'Step 5: Rebalance Positions',
        detail: 'After the trade, one exchange has more crypto and the other has more stablecoins. You\'ll need to rebalance by transferring funds. Do this during low-volatility periods to minimize risk during transfer. Some traders only rebalance once per day or week.'
      },
      {
        step: 'Step 6: Track Everything',
        detail: 'Maintain a spreadsheet or database of every trade: timestamp, exchanges, prices, amounts, fees, profit. This helps you identify which exchange pairs are most profitable and refine your strategy.'
      }
    ],
    signals: [
      {
        signal: 'Large Spread (>0.5%)',
        meaning: 'Price difference between exchanges exceeds typical fees',
        action: 'buy'
      },
      {
        signal: 'High Volatility Event',
        meaning: 'News causes rapid price moves, creating temporary mispricings',
        action: 'buy'
      },
      {
        signal: 'Regional Premium (Kimchi, Grayscale)',
        meaning: 'Geographic or structural factors create persistent spreads',
        action: 'buy'
      },
      {
        signal: 'Futures Premium >3%',
        meaning: 'Futures trading at significant premium to spot',
        action: 'buy'
      },
      {
        signal: 'DEX Pool Imbalance',
        meaning: 'Large trade pushed DEX price away from market',
        action: 'buy'
      }
    ],
    strengths: [
      'Direction-neutral: profit regardless of whether market goes up or down',
      'Relatively low risk when executed correctly with pre-positioned funds',
      'Can be automated with bots for 24/7 operation',
      'Crypto markets have more opportunities than traditional markets due to fragmentation',
      'Profits are predictable per trade (unlike directional trading)'
    ],
    limitations: [
      'Requires significant capital spread across multiple exchanges',
      'Exchange risk: if an exchange is hacked or goes bankrupt, you lose funds',
      'Transfer time risk: prices can move while crypto is in transit',
      'Competition: professional firms with faster systems capture most opportunities',
      'Spreads have narrowed significantly since 2017-2018 as markets mature',
      'Regulatory risk: some arbitrage between regions may have legal implications'
    ],
    practicalTips: [
      'Start with stablecoin pairs (USDT/USDC) to learn without price volatility risk',
      'Never transfer 100% of funds—always keep enough on each exchange to capture the next opportunity',
      'Use VIP fee tiers: higher trading volume = lower fees = more profitable arbitrage',
      'Focus on 2-3 exchange pairs rather than trying to monitor 20 exchanges',
      'Set alerts for spreads above your profitability threshold',
      'Consider tax implications: frequent trading creates many taxable events',
      'Keep detailed records for tax purposes—every trade is a taxable event in most jurisdictions'
    ],
    commonMistakes: [
      'Forgetting to include ALL fees in profit calculations (network fees, deposit fees, withdrawal fees)',
      'Using market orders instead of limit orders, causing slippage',
      'Not pre-positioning funds and trying to transfer during the arbitrage window',
      'Underestimating transfer time: that "10-minute" Bitcoin transfer can take an hour during network congestion',
      'Concentrating too much capital on a single exchange (counterparty risk)',
      'Chasing small spreads that don\'t cover fees after slippage',
      'Not accounting for order book depth—large orders can\'t be filled at the displayed price'
    ],
    relatedStrategies: [
      { name: 'Statistical Arbitrage', relationship: 'Uses statistics to find mean-reverting pairs' },
      { name: 'Triangular Arbitrage', relationship: 'Same-exchange, multi-pair arbitrage' },
      { name: 'Futures Basis Trading', relationship: 'Exploits spot-futures price differences' },
      { name: 'Market Making', relationship: 'Profits from bid-ask spread instead of cross-exchange spread' }
    ]
  }
};

/**
 * Get the strategy primer configuration for a given article slug
 */
export function getStrategyPrimer(slug: string): StrategyPrimerData | null {
  return STRATEGY_PRIMER_MAPPING[slug] || null;
}

/**
 * Check if an article has a strategy primer
 */
export function hasStrategyPrimer(slug: string): boolean {
  return slug in STRATEGY_PRIMER_MAPPING;
}
