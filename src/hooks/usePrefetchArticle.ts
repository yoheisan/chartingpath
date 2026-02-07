import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Slugs that have comprehensive static pages - no DB fetch needed
const STATIC_ARTICLE_SLUGS = new Set([
  'head-and-shoulders',
  'double-top-bottom',
  'triangle-patterns',
  'wedge-patterns',
  'flag-pennant',
  'flag-pennant-patterns',
  'cup-and-handle',
  'rectangle-pattern',
  'support-resistance',
  'trend-analysis',
  'volume-analysis',
  'moving-averages',
  'rsi-indicator',
  'macd-indicator',
  'fibonacci-retracements',
  'candlestick-patterns',
  'price-action-basics',
  'breakout-trading',
  'pin-bar-strategy',
  'risk-management',
  'position-sizing',
  'money-management',
  'trading-psychology',
  'trading-discipline',
  'fear-and-greed',
  'trading-journal',
  'trading-strategies-guide',
  // Platform documentation
  'chart-types-explained',
  // Strategy articles
  'strategies/scalping',
  'strategies/day-trading',
  'strategies/trend-following',
  'strategies/breakout',
  'strategies/mean-reversion',
  'strategies/momentum',
  'strategies/swing-trading',
  'strategies/position-trading',
  'strategies/macd-strategy',
  'strategies/bollinger-bands',
  'strategies/rsi-divergence',
  'strategies/vwap',
  'strategies/fibonacci',
  'strategies/support-resistance',
  'strategies/gap-trading',
]);

/**
 * Hook for prefetching article content on hover
 * 
 * Static articles (lazy-loaded pages) trigger chunk prefetch
 * Dynamic articles (DB) trigger React Query prefetch
 */
export function usePrefetchArticle() {
  const queryClient = useQueryClient();
  
  const prefetch = useCallback((slug: string) => {
    // Static articles: trigger lazy chunk prefetch via dynamic import
    if (STATIC_ARTICLE_SLUGS.has(slug)) {
      // Prefetch the chunk for the static page component
      // This primes the browser cache for the lazy() import
      const prefetchMap: Record<string, () => Promise<unknown>> = {
        'head-and-shoulders': () => import('@/pages/blog/HeadAndShoulders'),
        'double-top-bottom': () => import('@/pages/blog/DoubleTopBottom'),
        'triangle-patterns': () => import('@/pages/blog/TrianglePatterns'),
        'wedge-patterns': () => import('@/pages/blog/WedgePatterns'),
        'flag-pennant': () => import('@/pages/blog/FlagPennant'),
        'cup-and-handle': () => import('@/pages/blog/CupAndHandle'),
        'rectangle-pattern': () => import('@/pages/blog/RectanglePattern'),
        'support-resistance': () => import('@/pages/blog/SupportResistance'),
        'trend-analysis': () => import('@/pages/blog/TrendAnalysis'),
        'volume-analysis': () => import('@/pages/blog/VolumeAnalysis'),
        'moving-averages': () => import('@/pages/blog/MovingAverages'),
        'rsi-indicator': () => import('@/pages/blog/RSIIndicator'),
        'macd-indicator': () => import('@/pages/blog/MACDIndicator'),
        'fibonacci-retracements': () => import('@/pages/blog/FibonacciRetracements'),
        'candlestick-patterns': () => import('@/pages/blog/CandlestickPatterns'),
        'price-action-basics': () => import('@/pages/blog/PriceActionBasics'),
        'breakout-trading': () => import('@/pages/blog/BreakoutTrading'),
        'pin-bar-strategy': () => import('@/pages/blog/PinBarStrategy'),
        'risk-management': () => import('@/pages/blog/RiskManagement'),
        'position-sizing': () => import('@/pages/blog/PositionSizing'),
        'money-management': () => import('@/pages/blog/MoneyManagement'),
        'trading-psychology': () => import('@/pages/blog/TradingPsychology'),
        'trading-discipline': () => import('@/pages/blog/TradingDiscipline'),
        'fear-and-greed': () => import('@/pages/blog/FearAndGreed'),
        'trading-journal': () => import('@/pages/blog/TradingJournal'),
        'trading-strategies-guide': () => import('@/pages/blog/TradingStrategiesGuide'),
        // Platform documentation
        'chart-types-explained': () => import('@/pages/blog/ChartTypesExplained'),
        // Strategy articles
        'strategies/scalping': () => import('@/pages/strategies/ScalpingStrategy'),
        'strategies/day-trading': () => import('@/pages/strategies/DayTradingStrategy'),
        'strategies/trend-following': () => import('@/pages/strategies/TrendFollowingStrategy'),
        'strategies/breakout': () => import('@/pages/strategies/BreakoutStrategy'),
        'strategies/mean-reversion': () => import('@/pages/strategies/MeanReversionStrategy'),
        'strategies/momentum': () => import('@/pages/strategies/MomentumStrategy'),
        'strategies/swing-trading': () => import('@/pages/strategies/SwingTradingStrategy'),
        'strategies/position-trading': () => import('@/pages/strategies/PositionTradingStrategy'),
        'strategies/macd-strategy': () => import('@/pages/strategies/MACDStrategy'),
        'strategies/bollinger-bands': () => import('@/pages/strategies/BollingerBandsStrategy'),
        'strategies/rsi-divergence': () => import('@/pages/strategies/RSIDivergenceStrategy'),
        'strategies/vwap': () => import('@/pages/strategies/VWAPStrategy'),
        'strategies/fibonacci': () => import('@/pages/strategies/FibonacciStrategy'),
        'strategies/support-resistance': () => import('@/pages/strategies/SupportResistanceStrategy'),
        'strategies/gap-trading': () => import('@/pages/strategies/GapTradingStrategy'),
      };
      
      const prefetchFn = prefetchMap[slug];
      if (prefetchFn) {
        prefetchFn().catch(() => {
          // Ignore prefetch errors - page may not exist or network issue
        });
      }
      return;
    }
    
    // Dynamic articles: no RPC prefetch needed since we use static pages
    // The BlogV2 list already has all necessary data for card display
  }, [queryClient]);
  
  return prefetch;
}
