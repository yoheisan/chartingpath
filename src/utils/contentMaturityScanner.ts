/**
 * Content Maturity Scanner
 * Analyzes blog/educational content pages for visualization quality and educational depth
 */

export interface ContentMaturityScore {
  page: string;
  overallScore: number; // 0-100
  categories: {
    chartVisualization: number;
    volumeContext: number;
    tradeExecution: number;
    interactivity: number;
    professionalDepth: number;
  };
  recommendations: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ContentFeatures {
  hasDynamicChart: boolean;
  hasEducationalChart: boolean;
  hasVolumeAnalysis: boolean;
  hasVolumeContextVisualization: boolean;
  hasTradeExecutionPlan: boolean;
  hasEntryExitAnnotations: boolean;
  hasStepByStepGuide: boolean;
  hasInteractiveElements: boolean;
  hasProfessionalTips: boolean;
  hasRiskManagement: boolean;
  hasMultiTimeframeAnalysis: boolean;
  hasIndicatorOverlays: boolean;
}

// Content pages with their expected features based on topic
export const CONTENT_REQUIREMENTS: Record<string, Partial<ContentFeatures>> = {
  'VolumeAnalysis': {
    hasDynamicChart: true,
    hasVolumeContextVisualization: true,
    hasVolumeAnalysis: true,
    hasStepByStepGuide: true,
    hasInteractiveElements: true,
  },
  'HeadAndShoulders': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
    hasVolumeAnalysis: true,
  },
  'DoubleTopBottom': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
    hasVolumeAnalysis: true,
  },
  'TrianglePatterns': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
  },
  'MovingAverages': {
    hasDynamicChart: true,
    hasIndicatorOverlays: true,
    hasMultiTimeframeAnalysis: true,
    hasTradeExecutionPlan: true,
  },
  'RSIIndicator': {
    hasDynamicChart: true,
    hasIndicatorOverlays: true,
    hasTradeExecutionPlan: true,
    hasVolumeAnalysis: true,
  },
  'MACDIndicator': {
    hasDynamicChart: true,
    hasIndicatorOverlays: true,
    hasTradeExecutionPlan: true,
  },
  'SupportResistance': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
  },
  'FibonacciRetracements': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
  },
  'BreakoutTrading': {
    hasDynamicChart: true,
    hasVolumeContextVisualization: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
  },
  'CandlestickPatterns': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasVolumeAnalysis: true,
    hasTradeExecutionPlan: true,
  },
  'TrendAnalysis': {
    hasDynamicChart: true,
    hasMultiTimeframeAnalysis: true,
    hasIndicatorOverlays: true,
  },
  'WedgePatterns': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasVolumeAnalysis: true,
  },
  'CupAndHandle': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasVolumeAnalysis: true,
  },
  'FlagPennant': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
  },
  'RectanglePattern': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
  },
  'PinBarStrategy': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasTradeExecutionPlan: true,
    hasVolumeAnalysis: true,
  },
  'PriceActionBasics': {
    hasDynamicChart: true,
    hasEducationalChart: true,
    hasStepByStepGuide: true,
  },
};

// Feature weights for scoring
const FEATURE_WEIGHTS: Record<keyof ContentFeatures, number> = {
  hasDynamicChart: 15,
  hasEducationalChart: 20,
  hasVolumeAnalysis: 10,
  hasVolumeContextVisualization: 15,
  hasTradeExecutionPlan: 15,
  hasEntryExitAnnotations: 10,
  hasStepByStepGuide: 5,
  hasInteractiveElements: 5,
  hasProfessionalTips: 3,
  hasRiskManagement: 5,
  hasMultiTimeframeAnalysis: 5,
  hasIndicatorOverlays: 7,
};

export function calculateContentMaturity(
  page: string,
  currentFeatures: ContentFeatures
): ContentMaturityScore {
  const requirements = CONTENT_REQUIREMENTS[page] || {};
  const recommendations: string[] = [];
  
  let totalWeight = 0;
  let earnedWeight = 0;

  // Category scores
  const categoryScores = {
    chartVisualization: 0,
    volumeContext: 0,
    tradeExecution: 0,
    interactivity: 0,
    professionalDepth: 0,
  };

  // Chart visualization features
  const chartFeatures: (keyof ContentFeatures)[] = ['hasDynamicChart', 'hasEducationalChart', 'hasIndicatorOverlays'];
  chartFeatures.forEach(feature => {
    if (requirements[feature] || currentFeatures[feature]) {
      totalWeight += FEATURE_WEIGHTS[feature];
      if (currentFeatures[feature]) {
        earnedWeight += FEATURE_WEIGHTS[feature];
        categoryScores.chartVisualization += FEATURE_WEIGHTS[feature];
      } else if (requirements[feature]) {
        recommendations.push(getRecommendation(feature));
      }
    }
  });

  // Volume context features
  const volumeFeatures: (keyof ContentFeatures)[] = ['hasVolumeAnalysis', 'hasVolumeContextVisualization'];
  volumeFeatures.forEach(feature => {
    if (requirements[feature] || currentFeatures[feature]) {
      totalWeight += FEATURE_WEIGHTS[feature];
      if (currentFeatures[feature]) {
        earnedWeight += FEATURE_WEIGHTS[feature];
        categoryScores.volumeContext += FEATURE_WEIGHTS[feature];
      } else if (requirements[feature]) {
        recommendations.push(getRecommendation(feature));
      }
    }
  });

  // Trade execution features
  const executionFeatures: (keyof ContentFeatures)[] = ['hasTradeExecutionPlan', 'hasEntryExitAnnotations', 'hasRiskManagement'];
  executionFeatures.forEach(feature => {
    if (requirements[feature] || currentFeatures[feature]) {
      totalWeight += FEATURE_WEIGHTS[feature];
      if (currentFeatures[feature]) {
        earnedWeight += FEATURE_WEIGHTS[feature];
        categoryScores.tradeExecution += FEATURE_WEIGHTS[feature];
      } else if (requirements[feature]) {
        recommendations.push(getRecommendation(feature));
      }
    }
  });

  // Interactivity features
  const interactiveFeatures: (keyof ContentFeatures)[] = ['hasStepByStepGuide', 'hasInteractiveElements'];
  interactiveFeatures.forEach(feature => {
    if (requirements[feature] || currentFeatures[feature]) {
      totalWeight += FEATURE_WEIGHTS[feature];
      if (currentFeatures[feature]) {
        earnedWeight += FEATURE_WEIGHTS[feature];
        categoryScores.interactivity += FEATURE_WEIGHTS[feature];
      } else if (requirements[feature]) {
        recommendations.push(getRecommendation(feature));
      }
    }
  });

  // Professional depth features
  const professionalFeatures: (keyof ContentFeatures)[] = ['hasProfessionalTips', 'hasMultiTimeframeAnalysis'];
  professionalFeatures.forEach(feature => {
    if (requirements[feature] || currentFeatures[feature]) {
      totalWeight += FEATURE_WEIGHTS[feature];
      if (currentFeatures[feature]) {
        earnedWeight += FEATURE_WEIGHTS[feature];
        categoryScores.professionalDepth += FEATURE_WEIGHTS[feature];
      } else if (requirements[feature]) {
        recommendations.push(getRecommendation(feature));
      }
    }
  });

  const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;

  // Determine priority
  let priority: 'critical' | 'high' | 'medium' | 'low';
  if (overallScore < 40) priority = 'critical';
  else if (overallScore < 60) priority = 'high';
  else if (overallScore < 80) priority = 'medium';
  else priority = 'low';

  return {
    page,
    overallScore,
    categories: categoryScores,
    recommendations,
    priority,
  };
}

function getRecommendation(feature: keyof ContentFeatures): string {
  const recommendations: Record<keyof ContentFeatures, string> = {
    hasDynamicChart: 'Add an interactive DynamicPatternChart component to visualize the concept',
    hasEducationalChart: 'Add an EducationalChart with step-by-step annotations explaining the pattern formation',
    hasVolumeAnalysis: 'Include volume analysis section showing how volume confirms the pattern',
    hasVolumeContextVisualization: 'Add chart showing volume series against price movement with average volume line',
    hasTradeExecutionPlan: 'Add detailed trade execution plan with Entry, Stop Loss, and Target levels',
    hasEntryExitAnnotations: 'Add visual annotations (arrows, callouts) showing entry/exit points on the chart',
    hasStepByStepGuide: 'Create an interactive step-by-step guide walking through the concept',
    hasInteractiveElements: 'Add interactive elements (playable animations, hover tooltips) to engage users',
    hasProfessionalTips: 'Include professional trader tips and edge techniques',
    hasRiskManagement: 'Add risk management section with position sizing and R:R calculations',
    hasMultiTimeframeAnalysis: 'Include multi-timeframe analysis showing concept across different timeframes',
    hasIndicatorOverlays: 'Add indicator overlays (MA, RSI, MACD) showing how they complement the concept',
  };
  return recommendations[feature];
}

// Generate sample candle data for educational charts
export function generateEducationalCandleData(
  pattern: 'uptrend-volume' | 'breakout' | 'divergence' | 'accumulation' | 'distribution',
  length: number = 50
): { open: number; high: number; low: number; close: number; volume: number }[] {
  const candles: { open: number; high: number; low: number; close: number; volume: number }[] = [];
  let price = 100;
  const baseVolume = 1000000;

  switch (pattern) {
    case 'uptrend-volume':
      // Healthy uptrend with volume confirmation
      for (let i = 0; i < length; i++) {
        const isBullish = Math.random() > 0.35;
        const move = (Math.random() * 2 + 0.5) * (isBullish ? 1 : -0.5);
        const open = price;
        const close = price + move;
        const high = Math.max(open, close) + Math.random() * 1;
        const low = Math.min(open, close) - Math.random() * 1;
        // Higher volume on up days
        const volume = baseVolume * (isBullish ? (1 + Math.random() * 0.8) : (0.4 + Math.random() * 0.3));
        candles.push({ open, high, low, close, volume });
        price = close;
      }
      break;

    case 'breakout':
      // Consolidation followed by breakout with volume spike
      const resistanceLevel = 110;
      for (let i = 0; i < length; i++) {
        const isBreakout = i > length * 0.75;
        const inConsolidation = i > length * 0.3 && i <= length * 0.75;
        
        if (inConsolidation) {
          // Low volume consolidation
          const move = (Math.random() - 0.5) * 2;
          price = Math.min(resistanceLevel - 1, Math.max(price + move, 100));
        } else if (isBreakout) {
          // Breakout with increasing volume
          price += 1 + Math.random() * 2;
        } else {
          // Initial uptrend
          price += 0.5 + Math.random();
        }

        const open = price - (Math.random() - 0.5) * 2;
        const close = price;
        const high = Math.max(open, close) + Math.random() * 0.5;
        const low = Math.min(open, close) - Math.random() * 0.5;
        const volume = isBreakout 
          ? baseVolume * (2 + Math.random()) 
          : inConsolidation 
            ? baseVolume * (0.3 + Math.random() * 0.3)
            : baseVolume * (0.6 + Math.random() * 0.4);

        candles.push({ open, high, low, close, volume });
      }
      break;

    case 'divergence':
      // Price making new highs but volume declining (bearish divergence)
      for (let i = 0; i < length; i++) {
        const isBullish = Math.random() > 0.4;
        const move = (Math.random() * 1.5 + 0.3) * (isBullish ? 1 : -0.7);
        price += move;
        
        const open = price - move;
        const close = price;
        const high = Math.max(open, close) + Math.random() * 0.8;
        const low = Math.min(open, close) - Math.random() * 0.8;
        // Volume declining as price rises
        const volumeDecline = 1 - (i / length) * 0.6;
        const volume = baseVolume * volumeDecline * (0.5 + Math.random() * 0.5);

        candles.push({ open, high, low, close, volume });
      }
      break;

    case 'accumulation':
      // Flat price with increasing volume (smart money accumulating)
      for (let i = 0; i < length; i++) {
        const move = (Math.random() - 0.5) * 1.5;
        price += move;
        price = Math.max(98, Math.min(102, price)); // Keep price flat

        const open = price - move;
        const close = price;
        const high = Math.max(open, close) + Math.random() * 0.5;
        const low = Math.min(open, close) - Math.random() * 0.5;
        // Volume gradually increasing
        const volumeIncrease = 0.5 + (i / length) * 1.5;
        const volume = baseVolume * volumeIncrease * (0.8 + Math.random() * 0.4);

        candles.push({ open, high, low, close, volume });
      }
      break;

    case 'distribution':
      // Price at highs with declining volume then breakdown
      for (let i = 0; i < length; i++) {
        const isDistribution = i < length * 0.7;
        
        if (isDistribution) {
          const move = (Math.random() - 0.5) * 1;
          price = Math.max(108, Math.min(112, price + move));
        } else {
          // Breakdown
          price -= 1 + Math.random() * 1.5;
        }

        const open = price + (isDistribution ? 0 : 1);
        const close = price;
        const high = Math.max(open, close) + Math.random() * 0.5;
        const low = Math.min(open, close) - Math.random() * 0.5;
        const volume = isDistribution
          ? baseVolume * (1 - (i / length) * 0.4) * (0.5 + Math.random() * 0.3)
          : baseVolume * (2 + Math.random()); // Breakdown volume spike

        candles.push({ open, high, low, close, volume });
      }
      break;
  }

  return candles;
}
