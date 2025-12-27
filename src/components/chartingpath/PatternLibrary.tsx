import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { wedgeConfig, isPatternIdSupportedInWedge, SUPPORTED_WEDGE_PATTERN_IDS } from '@/config/wedge';
import { track } from '@/services/analytics';
import { 
  Search, 
  TrendingUp, 
  Target,
  Zap,
  Settings,
  Eye,
  Trash2,
  Star,
  AlertTriangle,
  BarChart3,
  Activity,
  GripVertical
} from 'lucide-react';

// Session-level deduplication key for analytics
const WEDGE_FILTERED_EVENT_KEY = 'wedge_pattern_ui_filtered_fired';

// Helper: Check if a pattern ID is allowed in current mode
const isWedgePatternAllowed = (patternId: string): boolean => {
  if (!wedgeConfig.wedgeEnabled) return true;
  return SUPPORTED_WEDGE_PATTERN_IDS.has(patternId);
};

const showWedgeModeBlockedToast = () => {
  toast({
    title: "Pattern Not Available",
    description: "This pattern isn't available in Wedge Mode.",
    variant: "destructive",
  });
};
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Direction types for patterns
type PatternDirection = 'bullish' | 'bearish' | 'neutral';

// Pattern Categories
const PATTERN_CATEGORIES = {
  classical: {
    name: 'Classical Patterns',
    icon: TrendingUp,
    description: 'Reversal and continuation patterns',
    patterns: [
      {
        id: 'head_shoulders',
        name: 'Head & Shoulders',
        type: 'reversal',
        direction: 'bearish' as PatternDirection,
        description: 'Three-peak reversal pattern with neckline break confirmation',
        parameters: {
          tolerance: { value: 2.0, min: 0.5, max: 5.0, step: 0.1, unit: '%' },
          minHeight: { value: 50, min: 20, max: 200, step: 5, unit: 'pips' },
          necklineBuffer: { value: 1.5, min: 0.5, max: 3.0, step: 0.1, unit: 'ATR' },
          volumeConfirmation: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'Identify three peaks with middle peak highest',
          confirm: 'Wait for neckline break with volume',
          enter: 'Enter on neckline break or retest',
          manage: 'Trail stop below neckline support',
          invalidate: 'New high above right shoulder'
        }
      },
      {
        id: 'inverse_head_shoulders',
        name: 'Inverse Head & Shoulders',
        type: 'reversal',
        direction: 'bullish' as PatternDirection,
        description: 'Bullish reversal pattern with three valleys',
        parameters: {
          tolerance: { value: 2.0, min: 0.5, max: 5.0, step: 0.1, unit: '%' },
          minDepth: { value: 50, min: 20, max: 200, step: 5, unit: 'pips' },
          necklineBuffer: { value: 1.5, min: 0.5, max: 3.0, step: 0.1, unit: 'ATR' },
          volumeConfirmation: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'Identify three valleys with middle valley lowest',
          confirm: 'Wait for neckline break with volume',
          enter: 'Enter on neckline break or retest',
          manage: 'Trail stop above neckline resistance',
          invalidate: 'New low below right shoulder'
        }
      },
      {
        id: 'double_top',
        name: 'Double Top',
        type: 'reversal',
        direction: 'bearish' as PatternDirection,
        description: 'Bearish reversal with two equal peaks',
        parameters: {
          tolerance: { value: 1.5, min: 0.5, max: 3.0, step: 0.1, unit: '%' },
          minDistance: { value: 10, min: 5, max: 50, step: 1, unit: 'bars' },
          valleyDepth: { value: 30, min: 10, max: 100, step: 5, unit: 'pips' }
        },
        framework: {
          detect: 'Two peaks at similar levels with valley between',
          confirm: 'Break below valley support level',
          enter: 'Enter on support break or retest',
          manage: 'Measured move target = valley depth',
          invalidate: 'New high above peaks'
        }
      },
      {
        id: 'double_bottom',
        name: 'Double Bottom',
        type: 'reversal',
        direction: 'bullish' as PatternDirection,
        description: 'Bullish reversal with two equal valleys',
        parameters: {
          tolerance: { value: 1.5, min: 0.5, max: 3.0, step: 0.1, unit: '%' },
          minDistance: { value: 10, min: 5, max: 50, step: 1, unit: 'bars' },
          peakHeight: { value: 30, min: 10, max: 100, step: 5, unit: 'pips' }
        },
        framework: {
          detect: 'Two valleys at similar levels with peak between',
          confirm: 'Break above peak resistance level',
          enter: 'Enter on resistance break or retest',
          manage: 'Measured move target = peak height',
          invalidate: 'New low below valleys'
        }
      },
      {
        id: 'ascending_triangle',
        name: 'Ascending Triangle',
        type: 'continuation',
        direction: 'bullish' as PatternDirection,
        description: 'Bullish continuation with horizontal resistance',
        parameters: {
          minTouches: { value: 3, min: 2, max: 5, step: 1, unit: 'touches' },
          slopeAngle: { value: 15, min: 5, max: 45, step: 1, unit: 'degrees' },
          resistanceBuffer: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, unit: 'ATR' }
        },
        framework: {
          detect: 'Rising support line meets horizontal resistance',
          confirm: 'Volume contraction during formation',
          enter: 'Breakout above resistance with volume',
          manage: 'Target = triangle height added to breakout',
          invalidate: 'Break below ascending support'
        }
      },
      {
        id: 'descending_triangle',
        name: 'Descending Triangle',
        type: 'continuation',
        direction: 'bearish' as PatternDirection,
        description: 'Bearish continuation with horizontal support',
        parameters: {
          minTouches: { value: 3, min: 2, max: 5, step: 1, unit: 'touches' },
          slopeAngle: { value: 15, min: 5, max: 45, step: 1, unit: 'degrees' },
          supportBuffer: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, unit: 'ATR' }
        },
        framework: {
          detect: 'Falling resistance line meets horizontal support',
          confirm: 'Volume contraction during formation',
          enter: 'Breakdown below support with volume',
          manage: 'Target = triangle height subtracted from breakdown',
          invalidate: 'Break above descending resistance'
        }
      },
      {
        id: 'flag',
        name: 'Flag Pattern',
        type: 'continuation',
        direction: 'neutral' as PatternDirection,
        description: 'Brief consolidation after strong move (bullish or bearish)',
        parameters: {
          flagAngle: { value: 30, min: 10, max: 60, step: 5, unit: 'degrees' },
          maxDuration: { value: 20, min: 5, max: 50, step: 1, unit: 'bars' },
          retracement: { value: 38.2, min: 23.6, max: 61.8, step: 0.1, unit: '%' }
        },
        framework: {
          detect: 'Strong move followed by counter-trend consolidation',
          confirm: 'Low volume during consolidation',
          enter: 'Breakout in direction of initial move',
          manage: 'Target = flagpole height from breakout',
          invalidate: 'Deep retracement beyond 61.8%'
        }
      },
      {
        id: 'wedge_rising',
        name: 'Rising Wedge',
        type: 'reversal',
        direction: 'bearish' as PatternDirection,
        description: 'Bearish pattern with converging trend lines',
        parameters: {
          convergenceAngle: { value: 45, min: 20, max: 70, step: 5, unit: 'degrees' },
          minTouches: { value: 4, min: 3, max: 6, step: 1, unit: 'touches' },
          volumeDecline: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'Two converging ascending trend lines',
          confirm: 'Declining volume throughout formation',
          enter: 'Break below lower trend line',
          manage: 'Target = wedge apex to breakout point',
          invalidate: 'Strong breakout above upper line'
        }
      },
      {
        id: 'cup_handle',
        name: 'Cup & Handle',
        type: 'continuation',
        direction: 'bullish' as PatternDirection,
        description: 'Bullish continuation after consolidation',
        parameters: {
          cupDepth: { value: 20, min: 10, max: 50, step: 5, unit: '%' },
          handleDepth: { value: 10, min: 5, max: 20, step: 1, unit: '%' },
          minDuration: { value: 30, min: 15, max: 100, step: 5, unit: 'bars' }
        },
        framework: {
          detect: 'U-shaped cup followed by small handle',
          confirm: 'Volume expansion on cup formation',
          enter: 'Breakout above handle high',
          manage: 'Target = cup depth added to breakout',
          invalidate: 'Handle breaks below cup mid-point'
        }
      }
    ]
  },
  candlestick: {
    name: 'Candlestick Patterns',
    icon: BarChart3,
    description: '1-3 bar reversal patterns',
    patterns: [
      {
        id: 'bullish_engulfing',
        name: 'Bullish Engulfing',
        type: 'reversal',
        direction: 'bullish' as PatternDirection,
        description: 'Large green candle engulfs previous red candle',
        parameters: {
          minBodyRatio: { value: 1.2, min: 1.1, max: 2.0, step: 0.1, unit: 'ratio' },
          wickTolerance: { value: 0.1, min: 0.0, max: 0.3, step: 0.05, unit: 'ATR' },
          volumeConfirmation: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'Green candle body completely engulfs previous red',
          confirm: 'Higher volume on engulfing candle',
          enter: 'Enter above engulfing candle high',
          manage: 'Stop below engulfing candle low',
          invalidate: 'Close below engulfed candle low'
        }
      },
      {
        id: 'bearish_engulfing',
        name: 'Bearish Engulfing',
        type: 'reversal',
        direction: 'bearish' as PatternDirection,
        description: 'Large red candle engulfs previous green candle',
        parameters: {
          minBodyRatio: { value: 1.2, min: 1.1, max: 2.0, step: 0.1, unit: 'ratio' },
          wickTolerance: { value: 0.1, min: 0.0, max: 0.3, step: 0.05, unit: 'ATR' },
          volumeConfirmation: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'Red candle body completely engulfs previous green',
          confirm: 'Higher volume on engulfing candle',
          enter: 'Enter below engulfing candle low',
          manage: 'Stop above engulfing candle high',
          invalidate: 'Close above engulfed candle high'
        }
      },
      {
        id: 'hammer',
        name: 'Hammer',
        type: 'reversal',
        direction: 'bullish' as PatternDirection,
        description: 'Bullish reversal with long lower shadow',
        parameters: {
          bodyRatio: { value: 0.3, min: 0.1, max: 0.5, step: 0.05, unit: 'ratio' },
          shadowRatio: { value: 2.0, min: 1.5, max: 3.0, step: 0.1, unit: 'ratio' },
          upperWickMax: { value: 0.1, min: 0.0, max: 0.2, step: 0.05, unit: 'ratio' }
        },
        framework: {
          detect: 'Small body at top with long lower shadow',
          confirm: 'Occurs at support or downtrend low',
          enter: 'Enter above hammer high',
          manage: 'Stop below hammer low',
          invalidate: 'Break below hammer low'
        }
      },
      {
        id: 'shooting_star',
        name: 'Shooting Star',
        type: 'reversal',
        direction: 'bearish' as PatternDirection,
        description: 'Bearish reversal with long upper shadow',
        parameters: {
          bodyRatio: { value: 0.3, min: 0.1, max: 0.5, step: 0.05, unit: 'ratio' },
          shadowRatio: { value: 2.0, min: 1.5, max: 3.0, step: 0.1, unit: 'ratio' },
          lowerWickMax: { value: 0.1, min: 0.0, max: 0.2, step: 0.05, unit: 'ratio' }
        },
        framework: {
          detect: 'Small body at bottom with long upper shadow',
          confirm: 'Occurs at resistance or uptrend high',
          enter: 'Enter below shooting star low',
          manage: 'Stop above shooting star high',
          invalidate: 'Break above shooting star high'
        }
      },
      {
        id: 'morning_star',
        name: 'Morning Star',
        type: 'reversal',
        direction: 'bullish' as PatternDirection,
        description: 'Three-candle bullish reversal pattern',
        parameters: {
          gapSize: { value: 0.5, min: 0.1, max: 1.5, step: 0.1, unit: 'ATR' },
          starBodyRatio: { value: 0.5, min: 0.2, max: 0.8, step: 0.1, unit: 'ratio' },
          thirdCandleEngulf: { value: 0.5, min: 0.3, max: 0.8, step: 0.1, unit: 'ratio' }
        },
        framework: {
          detect: 'Red candle, small star, strong green candle',
          confirm: 'Third candle closes above first candle midpoint',
          enter: 'Enter above third candle high',
          manage: 'Stop below pattern low',
          invalidate: 'Break below star candle low'
        }
      },
      {
        id: 'evening_star',
        name: 'Evening Star',
        type: 'reversal',
        direction: 'bearish' as PatternDirection,
        description: 'Three-candle bearish reversal pattern',
        parameters: {
          gapSize: { value: 0.5, min: 0.1, max: 1.5, step: 0.1, unit: 'ATR' },
          starBodyRatio: { value: 0.5, min: 0.2, max: 0.8, step: 0.1, unit: 'ratio' },
          thirdCandleEngulf: { value: 0.5, min: 0.3, max: 0.8, step: 0.1, unit: 'ratio' }
        },
        framework: {
          detect: 'Green candle, small star, strong red candle',
          confirm: 'Third candle closes below first candle midpoint',
          enter: 'Enter below third candle low',
          manage: 'Stop above pattern high',
          invalidate: 'Break above star candle high'
        }
      },
      {
        id: 'doji',
        name: 'Doji',
        type: 'reversal',
        direction: 'neutral' as PatternDirection,
        description: 'Indecision candle - direction depends on context',
        parameters: {
          bodyTolerance: { value: 0.05, min: 0.01, max: 0.1, step: 0.01, unit: 'ATR' },
          contextRequired: { value: true, type: 'boolean' },
          minVolume: { value: 1.2, min: 1.0, max: 2.0, step: 0.1, unit: 'avg' }
        },
        framework: {
          detect: 'Open and close prices nearly equal',
          confirm: 'Occurs at key support/resistance level',
          enter: 'Enter on break of doji high/low',
          manage: 'Stop at opposite extreme of doji',
          invalidate: 'No follow-through within 3 bars'
        }
      },
      {
        id: 'inside_bar',
        name: 'Inside Bar',
        type: 'continuation',
        direction: 'neutral' as PatternDirection,
        description: 'Consolidation bar - breakout direction determines trade',
        parameters: {
          strictInside: { value: true, type: 'boolean' },
          minMotherBarSize: { value: 1.0, min: 0.5, max: 2.0, step: 0.1, unit: 'ATR' },
          maxInsideRatio: { value: 0.8, min: 0.5, max: 0.9, step: 0.05, unit: 'ratio' }
        },
        framework: {
          detect: 'Current bar high/low within previous bar range',
          confirm: 'Previous bar shows strong directional move',
          enter: 'Breakout above/below inside bar range',
          manage: 'Target = mother bar size from breakout',
          invalidate: 'Multiple inside bars without breakout'
        }
      }
    ]
  },
  harmonic: {
    name: 'Harmonic Patterns',
    icon: Target,
    description: 'Fibonacci-based geometric patterns',
    patterns: [
      {
        id: 'gartley',
        name: 'Gartley Pattern',
        type: 'reversal',
        direction: 'neutral' as PatternDirection,
        description: 'XABCD pattern - bullish or bearish based on formation',
        parameters: {
          abRetracement: { value: 61.8, min: 58.0, max: 65.0, step: 0.5, unit: '%' },
          bcRetracement: { value: 38.2, min: 35.0, max: 42.0, step: 0.5, unit: '%' },
          cdExtension: { value: 127.2, min: 124.0, max: 130.0, step: 0.5, unit: '%' },
          xdRetracement: { value: 78.6, min: 76.0, max: 81.0, step: 0.5, unit: '%' }
        },
        framework: {
          detect: 'Five-point XABCD structure with Fibonacci ratios',
          confirm: 'Point D within PRZ (Potential Reversal Zone)',
          enter: 'Enter at D point with confirmation candle',
          manage: 'Stop beyond X point, targets at Fibonacci levels',
          invalidate: 'Break beyond 88.6% XA retracement'
        }
      },
      {
        id: 'bat',
        name: 'Bat Pattern',
        type: 'reversal',
        direction: 'neutral' as PatternDirection,
        description: 'Precise Gartley variant - bullish or bearish based on formation',
        parameters: {
          abRetracement: { value: 38.2, min: 35.0, max: 42.0, step: 0.5, unit: '%' },
          bcRetracement: { value: 38.2, min: 35.0, max: 42.0, step: 0.5, unit: '%' },
          cdExtension: { value: 161.8, min: 158.0, max: 165.0, step: 0.5, unit: '%' },
          xdRetracement: { value: 88.6, min: 86.0, max: 91.0, step: 0.5, unit: '%' }
        },
        framework: {
          detect: 'XABCD with 88.6% XA retracement at D',
          confirm: 'Strong rejection at D point PRZ',
          enter: 'Enter with reversal confirmation at D',
          manage: 'Tight stop beyond D, multiple targets',
          invalidate: 'Close beyond 91.3% XA level'
        }
      },
      {
        id: 'butterfly',
        name: 'Butterfly Pattern',
        type: 'reversal',
        direction: 'neutral' as PatternDirection,
        description: 'Extension pattern - bullish or bearish based on formation',
        parameters: {
          abRetracement: { value: 78.6, min: 76.0, max: 81.0, step: 0.5, unit: '%' },
          bcRetracement: { value: 38.2, min: 35.0, max: 42.0, step: 0.5, unit: '%' },
          cdExtension: { value: 161.8, min: 158.0, max: 165.0, step: 0.5, unit: '%' },
          xdExtension: { value: 127.2, min: 124.0, max: 130.0, step: 0.5, unit: '%' }
        },
        framework: {
          detect: 'XABCD with D point beyond X (127.2% extension)',
          confirm: 'Strong momentum into PRZ at D point',
          enter: 'Enter on reversal signal at D completion',
          manage: 'Stop beyond D, targets at key Fibonacci levels',
          invalidate: 'Extension beyond 161.8% XA level'
        }
      },
      {
        id: 'crab',
        name: 'Crab Pattern',
        type: 'reversal',
        direction: 'neutral' as PatternDirection,
        description: 'Extreme extension - bullish or bearish based on formation',
        parameters: {
          abRetracement: { value: 38.2, min: 35.0, max: 42.0, step: 0.5, unit: '%' },
          bcRetracement: { value: 61.8, min: 58.0, max: 65.0, step: 0.5, unit: '%' },
          cdExtension: { value: 224.0, min: 220.0, max: 228.0, step: 0.5, unit: '%' },
          xdExtension: { value: 161.8, min: 158.0, max: 165.0, step: 0.5, unit: '%' }
        },
        framework: {
          detect: 'XABCD with extreme 161.8% XA extension at D',
          confirm: 'Exhaustion signals at extreme PRZ level',
          enter: 'Enter on strong reversal confirmation',
          manage: 'Wide stop, high reward potential',
          invalidate: 'Break beyond 200% XA extension'
        }
      },
      {
        id: 'cypher',
        name: 'Cypher Pattern',
        type: 'reversal',
        direction: 'neutral' as PatternDirection,
        description: 'Modern harmonic - bullish or bearish based on formation',
        parameters: {
          abRetracement: { value: 38.2, min: 35.0, max: 42.0, step: 0.5, unit: '%' },
          bcExtension: { value: 127.2, min: 124.0, max: 130.0, step: 0.5, unit: '%' },
          cdRetracement: { value: 78.6, min: 76.0, max: 81.0, step: 0.5, unit: '%' },
          xdRetracement: { value: 78.6, min: 76.0, max: 81.0, step: 0.5, unit: '%' }
        },
        framework: {
          detect: 'XABCD with BC extension and CD retracement',
          confirm: 'D point at 78.6% XC retracement level',
          enter: 'Enter at D completion with confirmation',
          manage: 'Stop beyond D, targets at AB=CD completion',
          invalidate: 'Break beyond 88.6% XC level'
        }
      }
    ]
  },
  breakout: {
    name: 'Breakout & Volatility',
    icon: Zap,
    description: 'Momentum and volatility-based patterns',
    patterns: [
      {
        id: 'opening_range_breakout',
        name: 'Opening Range Breakout',
        type: 'momentum',
        direction: 'neutral' as PatternDirection,
        description: 'Breakout direction determines long or short',
        parameters: {
          rangePeriod: { value: 60, min: 30, max: 120, step: 15, unit: 'minutes' },
          minRangeSize: { value: 20, min: 10, max: 50, step: 5, unit: 'pips' },
          breakoutBuffer: { value: 2, min: 1, max: 5, step: 0.5, unit: 'pips' },
          volumeThreshold: { value: 1.5, min: 1.2, max: 2.0, step: 0.1, unit: 'avg' }
        },
        framework: {
          detect: 'Identify first hour high/low range',
          confirm: 'Volume expansion on breakout attempt',
          enter: 'Enter on break above/below range with buffer',
          manage: 'Target = range size projected from breakout',
          invalidate: 'Return inside range within 15 minutes'
        }
      },
      {
        id: 'nr7',
        name: 'NR7 (Narrow Range 7)',
        type: 'volatility',
        direction: 'neutral' as PatternDirection,
        description: 'Breakout direction determines long or short',
        parameters: {
          lookbackPeriod: { value: 7, min: 5, max: 10, step: 1, unit: 'bars' },
          rangeThreshold: { value: 0.5, min: 0.3, max: 0.8, step: 0.05, unit: 'ATR' },
          breakoutMinMove: { value: 1.0, min: 0.5, max: 2.0, step: 0.1, unit: 'ATR' }
        },
        framework: {
          detect: 'Current bar has narrowest range in lookback period',
          confirm: 'Low volatility indicates pending expansion',
          enter: 'Enter on breakout above/below NR7 bar',
          manage: 'Target = average daily range from entry',
          invalidate: 'Multiple NR bars without expansion'
        }
      },
      {
        id: 'donchian_breakout',
        name: 'Donchian Breakout',
        type: 'momentum',
        direction: 'neutral' as PatternDirection,
        description: 'Breakout direction determines long or short',
        parameters: {
          channelPeriod: { value: 20, min: 10, max: 50, step: 5, unit: 'periods' },
          exitPeriod: { value: 10, min: 5, max: 25, step: 1, unit: 'periods' },
          atrMultiplier: { value: 2.0, min: 1.0, max: 3.0, step: 0.1, unit: 'ATR' },
          trendFilter: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'New high/low beyond N-period channel',
          confirm: 'Strong momentum with ATR expansion',
          enter: 'Enter on channel breakout confirmation',
          manage: 'Exit on opposite channel break or stop',
          invalidate: 'False breakout back into channel'
        }
      },
      {
        id: 'bollinger_squeeze',
        name: 'Bollinger Band Squeeze',
        type: 'volatility',
        direction: 'neutral' as PatternDirection,
        description: 'Breakout direction determines long or short',
        parameters: {
          squeezePeriod: { value: 20, min: 15, max: 30, step: 1, unit: 'periods' },
          standardDeviation: { value: 2.0, min: 1.5, max: 2.5, step: 0.1, unit: 'StdDev' },
          squeezeThreshold: { value: 0.1, min: 0.05, max: 0.2, step: 0.01, unit: 'ratio' },
          momentumFilter: { value: true, type: 'boolean' }
        },
        framework: {
          detect: 'Bollinger Bands at historically narrow width',
          confirm: 'Momentum oscillator shows direction bias',
          enter: 'Enter on band expansion breakout',
          manage: 'Ride momentum until opposite band touch',
          invalidate: 'Squeeze continues without resolution'
        }
      }
    ]
  }
};

interface PatternConfig {
  id: string;
  patternType: string; // Original pattern ID without timestamp
  name: string; // Display name for the pattern
  category: string;
  enabled: boolean;
  priority: number;
  direction: 'bullish' | 'bearish' | 'neutral'; // Trading direction
  intendedDirection?: 'long' | 'short'; // User's intended direction for neutral patterns
  parameters: Record<string, any>;
  riskSettings: {
    riskPerTrade: number;
    stopLossMethod: 'pattern' | 'atr' | 'fixed';
    takeProfitMethod: 'pattern' | 'ratio' | 'fixed';
    maxConcurrentTrades: number;
  };
  // Per-pattern TP/SL overrides
  customTarget?: number;
  customStopLoss?: number;
  useCustomTPSL?: boolean;
}

interface PatternLibraryProps {
  patterns: PatternConfig[];
  onChange: (patterns: PatternConfig[]) => void;
}

export const PatternLibrary: React.FC<PatternLibraryProps> = ({
  patterns,
  onChange
}) => {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [directionDialog, setDirectionDialog] = useState<{
    open: boolean;
    categoryKey: string;
    patternId: string;
    patternName: string;
  } | null>(null);

  // Track whether we've already fired the analytics event this session
  const hasLoggedFilteredPatterns = useRef(false);

  // Derive visible categories based on wedge mode
  // When wedge is enabled, filter to only show supported patterns
  const { visibleCategories, filteredOutPatterns } = React.useMemo(() => {
    if (!wedgeConfig.wedgeEnabled) {
      return { visibleCategories: PATTERN_CATEGORIES, filteredOutPatterns: [] as string[] };
    }
    
    const removedIds: string[] = [];
    
    // Filter each category to only include supported patterns
    const filtered: Record<string, {
      name: string;
      icon: any;
      description: string;
      patterns: any[];
    }> = {};
    
    for (const [categoryKey, category] of Object.entries(PATTERN_CATEGORIES)) {
      const supportedPatterns = category.patterns.filter(p => {
        const isSupported = SUPPORTED_WEDGE_PATTERN_IDS.has(p.id);
        if (!isSupported) {
          removedIds.push(p.id);
        }
        return isSupported;
      });
      
      // Only include category if it has at least one supported pattern
      if (supportedPatterns.length > 0) {
        filtered[categoryKey] = {
          ...category,
          patterns: supportedPatterns,
        };
      }
    }
    
    return { visibleCategories: filtered, filteredOutPatterns: removedIds };
  }, []);

  // Dev assertion: warn if unsupported patterns leak into state
  useEffect(() => {
    if (!wedgeConfig.wedgeEnabled) return;
    
    const leakedPatterns = patterns.filter(p => !isWedgePatternAllowed(p.patternType));
    if (leakedPatterns.length > 0) {
      if (import.meta.env.DEV) {
        console.warn(
          `[WEDGE ASSERT] Unsupported pattern leaked into PatternLibrary state:`,
          leakedPatterns.map(p => p.patternType)
        );
      }
    }
  }, [patterns]);

  // Analytics: fire event if patterns were filtered out (once per session)
  useEffect(() => {
    if (!wedgeConfig.wedgeEnabled) return;
    if (filteredOutPatterns.length === 0) return;
    if (hasLoggedFilteredPatterns.current) return;
    
    // Check sessionStorage for deduplication
    const alreadyFired = sessionStorage.getItem(WEDGE_FILTERED_EVENT_KEY);
    if (alreadyFired) {
      hasLoggedFilteredPatterns.current = true;
      return;
    }
    
    // Fire the analytics event
    track('unsupported_pattern_ui_filtered', {
      removed_count: filteredOutPatterns.length,
      removed_ids: filteredOutPatterns.slice(0, 20),
      source: 'pattern_library_render',
    });
    
    sessionStorage.setItem(WEDGE_FILTERED_EVENT_KEY, 'true');
    hasLoggedFilteredPatterns.current = true;
  }, [filteredOutPatterns]);

  const addPattern = (categoryKey: string, patternId: string, intendedDirection?: 'long' | 'short') => {
    const category = PATTERN_CATEGORIES[categoryKey as keyof typeof PATTERN_CATEGORIES];
    const pattern = category.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    // Check if pattern is already added
    const alreadyExists = patterns.some(p => p.patternType === patternId || p.id.startsWith(patternId));
    if (alreadyExists) return;

    // Wedge mode guard: block unsupported patterns
    if (wedgeConfig.wedgeEnabled && !isPatternIdSupportedInWedge(patternId)) {
      showWedgeModeBlockedToast();
      return;
    }

    const newPattern: PatternConfig = {
      id: `${patternId}_${Date.now()}`,
      patternType: patternId,
      name: pattern.name,
      category: categoryKey,
      enabled: true,
      priority: patterns.length + 1,
      direction: pattern.direction,
      intendedDirection: pattern.direction === 'neutral' ? intendedDirection : undefined,
      parameters: Object.fromEntries(
        Object.entries(pattern.parameters).map(([key, param]) => [
          key, 
          (param as any).type === 'boolean' ? (param as any).value : (param as any).value
        ])
      ),
      riskSettings: {
        riskPerTrade: 2.0,
        stopLossMethod: 'pattern',
        takeProfitMethod: 'pattern',
        maxConcurrentTrades: 1
      }
    };

    return newPattern;
  };

  const addSinglePattern = (categoryKey: string, patternId: string, intendedDirection?: 'long' | 'short') => {
    const newPattern = addPattern(categoryKey, patternId, intendedDirection);
    if (newPattern) {
      onChange([...patterns, newPattern]);
    }
  };

  // Helper to get all pattern IDs of a certain type (respects wedge mode filtering)
  const getAllLongPatternIds = () => {
    const ids: string[] = [];
    Object.entries(visibleCategories).forEach(([_, category]) => {
      category.patterns.forEach((pattern) => {
        if (pattern.direction === 'bullish' || pattern.direction === 'neutral') {
          ids.push(pattern.id);
        }
      });
    });
    return ids;
  };

  const getAllShortPatternIds = () => {
    const ids: string[] = [];
    Object.entries(visibleCategories).forEach(([_, category]) => {
      category.patterns.forEach((pattern) => {
        if (pattern.direction === 'bearish' || pattern.direction === 'neutral') {
          ids.push(pattern.id);
        }
      });
    });
    return ids;
  };

  const getAllBidirectionalPatternIds = () => {
    const ids: string[] = [];
    Object.entries(visibleCategories).forEach(([_, category]) => {
      category.patterns.forEach((pattern) => {
        if (pattern.direction === 'neutral') {
          ids.push(pattern.id);
        }
      });
    });
    return ids;
  };

  // Check if any visible patterns exist for each direction (for button disable state)
  const hasVisibleLongPatterns = getAllLongPatternIds().length > 0;
  const hasVisibleShortPatterns = getAllShortPatternIds().length > 0;
  const hasVisibleBidirectionalPatterns = getAllBidirectionalPatternIds().length > 0;

  // Check if all patterns of a type are selected
  const allLongsSelected = () => {
    const longIds = getAllLongPatternIds();
    return longIds.every(id => patterns.some(p => p.patternType === id || p.id.startsWith(id)));
  };

  const allShortsSelected = () => {
    const shortIds = getAllShortPatternIds();
    return shortIds.every(id => patterns.some(p => p.patternType === id || p.id.startsWith(id)));
  };

  const allBidirectionalSelected = () => {
    const biIds = getAllBidirectionalPatternIds();
    return biIds.every(id => patterns.some(p => p.patternType === id || p.id.startsWith(id)));
  };

  const toggleAllLongs = () => {
    if (!hasVisibleLongPatterns) return;
    
    if (allLongsSelected()) {
      // Deselect all longs (bullish + neutral with long direction)
      const longIds = getAllLongPatternIds();
      onChange(patterns.filter(p => !longIds.includes(p.patternType)));
    } else {
      // Select all longs - use visibleCategories to respect wedge mode
      const newPatterns: PatternConfig[] = [];
      let priority = patterns.length;
      
      Object.entries(visibleCategories).forEach(([categoryKey, category]) => {
        category.patterns.forEach((pattern) => {
          const alreadyExists = patterns.some(p => p.patternType === pattern.id || p.id.startsWith(pattern.id));
          if (alreadyExists) return;
          
          if (pattern.direction === 'bullish') {
            priority++;
            newPatterns.push({
              id: `${pattern.id}_${Date.now()}_${priority}`,
              patternType: pattern.id,
              name: pattern.name,
              category: categoryKey,
              enabled: true,
              priority,
              direction: pattern.direction,
              parameters: Object.fromEntries(
                Object.entries(pattern.parameters).map(([key, param]) => [
                  key, 
                  (param as any).type === 'boolean' ? (param as any).value : (param as any).value
                ])
              ),
              riskSettings: {
                riskPerTrade: 2.0,
                stopLossMethod: 'pattern',
                takeProfitMethod: 'pattern',
                maxConcurrentTrades: 1
              }
            });
          } else if (pattern.direction === 'neutral') {
            priority++;
            newPatterns.push({
              id: `${pattern.id}_${Date.now()}_${priority}`,
              patternType: pattern.id,
              name: pattern.name,
              category: categoryKey,
              enabled: true,
              priority,
              direction: pattern.direction,
              intendedDirection: 'long',
              parameters: Object.fromEntries(
                Object.entries(pattern.parameters).map(([key, param]) => [
                  key, 
                  (param as any).type === 'boolean' ? (param as any).value : (param as any).value
                ])
              ),
              riskSettings: {
                riskPerTrade: 2.0,
                stopLossMethod: 'pattern',
                takeProfitMethod: 'pattern',
                maxConcurrentTrades: 1
              }
            });
          }
        });
      });
      
      if (newPatterns.length > 0) {
        onChange([...patterns, ...newPatterns]);
      }
    }
  };

  const toggleAllShorts = () => {
    if (!hasVisibleShortPatterns) return;
    
    if (allShortsSelected()) {
      // Deselect all shorts (bearish + neutral with short direction)
      const shortIds = getAllShortPatternIds();
      onChange(patterns.filter(p => !shortIds.includes(p.patternType)));
    } else {
      // Select all shorts - use visibleCategories to respect wedge mode
      const newPatterns: PatternConfig[] = [];
      let priority = patterns.length;
      
      Object.entries(visibleCategories).forEach(([categoryKey, category]) => {
        category.patterns.forEach((pattern) => {
          const alreadyExists = patterns.some(p => p.patternType === pattern.id || p.id.startsWith(pattern.id));
          if (alreadyExists) return;
          
          if (pattern.direction === 'bearish') {
            priority++;
            newPatterns.push({
              id: `${pattern.id}_${Date.now()}_${priority}`,
              patternType: pattern.id,
              name: pattern.name,
              category: categoryKey,
              enabled: true,
              priority,
              direction: pattern.direction,
              parameters: Object.fromEntries(
                Object.entries(pattern.parameters).map(([key, param]) => [
                  key, 
                  (param as any).type === 'boolean' ? (param as any).value : (param as any).value
                ])
              ),
              riskSettings: {
                riskPerTrade: 2.0,
                stopLossMethod: 'pattern',
                takeProfitMethod: 'pattern',
                maxConcurrentTrades: 1
              }
            });
          } else if (pattern.direction === 'neutral') {
            priority++;
            newPatterns.push({
              id: `${pattern.id}_${Date.now()}_${priority}`,
              patternType: pattern.id,
              name: pattern.name,
              category: categoryKey,
              enabled: true,
              priority,
              direction: pattern.direction,
              intendedDirection: 'short',
              parameters: Object.fromEntries(
                Object.entries(pattern.parameters).map(([key, param]) => [
                  key, 
                  (param as any).type === 'boolean' ? (param as any).value : (param as any).value
                ])
              ),
              riskSettings: {
                riskPerTrade: 2.0,
                stopLossMethod: 'pattern',
                takeProfitMethod: 'pattern',
                maxConcurrentTrades: 1
              }
            });
          }
        });
      });
      
      if (newPatterns.length > 0) {
        onChange([...patterns, ...newPatterns]);
      }
    }
  };

  const toggleAllBidirectional = () => {
    if (!hasVisibleBidirectionalPatterns) return;
    
    if (allBidirectionalSelected()) {
      // Deselect all bidirectional (neutral only)
      const biIds = getAllBidirectionalPatternIds();
      onChange(patterns.filter(p => !biIds.includes(p.patternType)));
    } else {
      // Select all bidirectional - use visibleCategories to respect wedge mode
      const newPatterns: PatternConfig[] = [];
      let priority = patterns.length;
      
      Object.entries(visibleCategories).forEach(([categoryKey, category]) => {
        category.patterns.forEach((pattern) => {
          if (pattern.direction !== 'neutral') return;
          
          const alreadyExists = patterns.some(p => p.patternType === pattern.id || p.id.startsWith(pattern.id));
          if (alreadyExists) return;
          
          priority++;
          newPatterns.push({
            id: `${pattern.id}_${Date.now()}_${priority}`,
            patternType: pattern.id,
            name: pattern.name,
            category: categoryKey,
            enabled: true,
            priority,
            direction: pattern.direction,
            intendedDirection: 'long',
            parameters: Object.fromEntries(
              Object.entries(pattern.parameters).map(([key, param]) => [
                key, 
                (param as any).type === 'boolean' ? (param as any).value : (param as any).value
              ])
            ),
            riskSettings: {
              riskPerTrade: 2.0,
              stopLossMethod: 'pattern',
              takeProfitMethod: 'pattern',
              maxConcurrentTrades: 1
            }
          });
        });
      });
      
      if (newPatterns.length > 0) {
        onChange([...patterns, ...newPatterns]);
      }
    }
  };

  const togglePatternDirection = (id: string) => {
    const pattern = patterns.find(p => p.id === id);
    if (pattern && pattern.direction === 'neutral') {
      const newDirection = pattern.intendedDirection === 'long' ? 'short' : 'long';
      updatePattern(id, { intendedDirection: newDirection });
    }
  };

  const handlePatternClick = (categoryKey: string, patternId: string) => {
    const category = PATTERN_CATEGORIES[categoryKey as keyof typeof PATTERN_CATEGORIES];
    const pattern = category.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    // Wedge mode guard: block unsupported patterns at click time
    if (wedgeConfig.wedgeEnabled && !isPatternIdSupportedInWedge(patternId)) {
      showWedgeModeBlockedToast();
      return;
    }

    if (pattern.direction === 'neutral') {
      setDirectionDialog({
        open: true,
        categoryKey,
        patternId,
        patternName: pattern.name
      });
    } else {
      addSinglePattern(categoryKey, patternId);
    }
  };

  const confirmDirectionAndAdd = (direction: 'long' | 'short') => {
    if (directionDialog) {
      addSinglePattern(directionDialog.categoryKey, directionDialog.patternId, direction);
      setDirectionDialog(null);
    }
  };

  const updatePattern = (id: string, updates: Partial<PatternConfig>) => {
    onChange(patterns.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePattern = (id: string) => {
    onChange(patterns.filter(p => p.id !== id));
    if (selectedPattern === id) {
      setSelectedPattern(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = patterns.findIndex(p => p.id === active.id);
      const newIndex = patterns.findIndex(p => p.id === over.id);

      const reorderedPatterns = arrayMove(patterns, oldIndex, newIndex);
      
      // Update priorities based on new order
      const patternsWithUpdatedPriority = reorderedPatterns.map((pattern, index) => ({
        ...pattern,
        priority: index + 1
      }));

      onChange(patternsWithUpdatedPriority);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sortable Pattern Component
  const SortablePattern: React.FC<{
    pattern: PatternConfig;
    patternInfo: any;
  }> = ({ pattern, patternInfo }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: pattern.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="flex items-center justify-between bg-card border rounded-md px-3 py-2"
      >
        <div className="flex items-center gap-2 flex-1">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
          <Switch
            checked={pattern.enabled}
            onCheckedChange={(checked) => {
              // Wedge mode guard: block enabling unsupported patterns
              if (checked && wedgeConfig.wedgeEnabled && !isPatternIdSupportedInWedge(pattern.patternType)) {
                showWedgeModeBlockedToast();
                return;
              }
              updatePattern(pattern.id, { enabled: checked });
            }}
            className="scale-75"
          />
          <span className="text-sm font-medium">{patternInfo.name}</span>
          
          {/* Direction toggle for neutral patterns */}
          {pattern.direction === 'neutral' && (
            <Button
              size="sm"
              variant="outline"
              className={`h-6 px-2 text-xs ${
                pattern.intendedDirection === 'long' 
                  ? 'border-green-500/50 text-green-600 hover:bg-green-500/10' 
                  : 'border-red-500/50 text-red-600 hover:bg-red-500/10'
              }`}
              onClick={() => togglePatternDirection(pattern.id)}
            >
              {pattern.intendedDirection === 'long' ? (
                <>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Long
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                  Short
                </>
              )}
            </Button>
          )}
          
          <Badge variant="outline" className="text-xs">{pattern.priority}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => {
              setSelectedPattern(pattern.id);
              setConfigDialogOpen(true);
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => removePattern(pattern.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  const getPatternInfo = (categoryKey: string, patternId: string, patternType?: string) => {
    const category = PATTERN_CATEGORIES[categoryKey as keyof typeof PATTERN_CATEGORIES];
    // Use patternType if provided, otherwise try to extract by removing the timestamp suffix (10+ digits)
    const basePatternId = patternType || patternId.replace(/_\d{10,}$/, '');
    return category?.patterns.find(p => p.id === basePatternId);
  };


  const selectedPatternData = patterns.find(p => p.id === selectedPattern);
  const selectedPatternInfo = selectedPatternData ? 
    getPatternInfo(selectedPatternData.category, selectedPatternData.id, selectedPatternData.patternType) : null;

  // Pattern detail dialog state
  const [detailPattern, setDetailPattern] = useState<{ categoryKey: string; pattern: any } | null>(null);

  return (
    <div className="space-y-4">
      {/* Quick Select Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={allLongsSelected() ? "default" : "outline"}
          className={allLongsSelected() 
            ? "bg-green-600 text-white hover:bg-green-700" 
            : "border-green-500/50 text-green-600 hover:bg-green-500/10"
          }
          onClick={toggleAllLongs}
          disabled={!hasVisibleLongPatterns}
          title={!hasVisibleLongPatterns ? "No long patterns available in wedge mode" : undefined}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          {allLongsSelected() ? "Deselect All Longs" : "Select All Longs"}
        </Button>
        <Button
          size="sm"
          variant={allShortsSelected() ? "default" : "outline"}
          className={allShortsSelected() 
            ? "bg-red-600 text-white hover:bg-red-700" 
            : "border-red-500/50 text-red-600 hover:bg-red-500/10"
          }
          onClick={toggleAllShorts}
          disabled={!hasVisibleShortPatterns}
          title={!hasVisibleShortPatterns ? "No short patterns available in wedge mode" : undefined}
        >
          <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
          {allShortsSelected() ? "Deselect All Shorts" : "Select All Shorts"}
        </Button>
        <Button
          size="sm"
          variant={allBidirectionalSelected() ? "default" : "outline"}
          className={allBidirectionalSelected() 
            ? "bg-yellow-600 text-white hover:bg-yellow-700" 
            : "border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
          }
          onClick={toggleAllBidirectional}
          disabled={!hasVisibleBidirectionalPatterns}
          title={!hasVisibleBidirectionalPatterns ? "No bidirectional patterns available in wedge mode" : undefined}
        >
          <Activity className="w-4 h-4 mr-1" />
          {allBidirectionalSelected() ? "Deselect Bidirectional" : "Select Bidirectional"}
        </Button>
      </div>

      {/* Compact Pattern Grid - All patterns easily discoverable */}
      <div className="space-y-4">
        {Object.entries(visibleCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <category.icon className="w-4 h-4 text-primary" />
              {category.name}
              <Badge variant="outline" className="ml-auto text-xs">
                {patterns.filter(p => p.category === categoryKey && p.enabled).length} active
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.patterns.map((pattern) => {
                const isActive = patterns.some(p => p.patternType === pattern.id || p.id.startsWith(pattern.id));
                const directionIcon = pattern.direction === 'bullish' ? '↑' : pattern.direction === 'bearish' ? '↓' : '↕';
                const directionColor = pattern.direction === 'bullish' ? 'text-green-500' : pattern.direction === 'bearish' ? 'text-red-500' : 'text-yellow-500';
                
                return (
                  <div key={pattern.id} className="flex items-center gap-1">
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        if (!isActive) {
                          handlePatternClick(categoryKey, pattern.id);
                        }
                      }}
                    >
                      <span className={`mr-1 ${isActive ? '' : directionColor}`}>{directionIcon}</span>
                      {pattern.name}
                      {isActive && <span className="ml-1">✓</span>}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setDetailPattern({ categoryKey, pattern })}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Direction Confirmation Dialog for Neutral Patterns */}
        <Dialog open={directionDialog?.open || false} onOpenChange={(open) => !open && setDirectionDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Confirm Trading Direction
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{directionDialog?.patternName}</strong> can be used for both long and short positions. 
                Please confirm your intended direction:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4 border-green-500/50 hover:bg-green-500/10 hover:border-green-500"
                  onClick={() => confirmDirectionAndAdd('long')}
                >
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <span className="font-semibold">Long Position</span>
                  <span className="text-xs text-muted-foreground">Buy / Bullish</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4 border-red-500/50 hover:bg-red-500/10 hover:border-red-500"
                  onClick={() => confirmDirectionAndAdd('short')}
                >
                  <TrendingUp className="w-6 h-6 text-red-500 rotate-180" />
                  <span className="font-semibold">Short Position</span>
                  <span className="text-xs text-muted-foreground">Sell / Bearish</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Patterns - Compact List */}
      {patterns.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Active Patterns ({patterns.length})</span>
              <span className="text-xs text-muted-foreground font-normal">Drag to reorder</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={patterns.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {patterns.map((pattern) => {
                    const patternInfo = getPatternInfo(pattern.category, pattern.id, pattern.patternType);
                    if (!patternInfo) return null;

                    return (
                      <SortablePattern
                        key={pattern.id}
                        pattern={pattern}
                        patternInfo={patternInfo}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Pattern Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Pattern: {selectedPatternInfo?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedPatternData && selectedPatternInfo && (
            <div className="space-y-6">
              {/* Framework Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detection Framework</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><strong>Detect:</strong> {selectedPatternInfo.framework.detect}</div>
                  <div><strong>Confirm:</strong> {selectedPatternInfo.framework.confirm}</div>
                  <div><strong>Enter:</strong> {selectedPatternInfo.framework.enter}</div>
                  <div><strong>Manage:</strong> {selectedPatternInfo.framework.manage}</div>
                  <div><strong>Invalidate:</strong> {selectedPatternInfo.framework.invalidate}</div>
                </CardContent>
              </Card>

              {/* Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pattern Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedPatternInfo.parameters).map(([key, param]) => (
                      <div key={key}>
                        <Label className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        {(param as any).type === 'boolean' ? (
                          <Switch
                            checked={selectedPatternData.parameters[key]}
                            onCheckedChange={(checked) => updatePattern(selectedPatternData.id, {
                              parameters: { ...selectedPatternData.parameters, [key]: checked }
                            })}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={selectedPatternData.parameters[key]}
                              onChange={(e) => updatePattern(selectedPatternData.id, {
                                parameters: { ...selectedPatternData.parameters, [key]: parseFloat(e.target.value) || (param as any).value }
                              })}
                              min={(param as any).min}
                              max={(param as any).max}
                              step={(param as any).step}
                              className="flex-1"
                            />
                            <span className="text-xs text-muted-foreground min-w-0">
                              {(param as any).unit}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Risk Per Trade (%)</Label>
                      <Input
                        type="number"
                        value={selectedPatternData.riskSettings.riskPerTrade}
                        onChange={(e) => updatePattern(selectedPatternData.id, {
                          riskSettings: { 
                            ...selectedPatternData.riskSettings, 
                            riskPerTrade: parseFloat(e.target.value) || 2.0 
                          }
                        })}
                        min="0.1"
                        max="10"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label>Max Concurrent Trades</Label>
                      <Input
                        type="number"
                        value={selectedPatternData.riskSettings.maxConcurrentTrades}
                        onChange={(e) => updatePattern(selectedPatternData.id, {
                          riskSettings: { 
                            ...selectedPatternData.riskSettings, 
                            maxConcurrentTrades: parseInt(e.target.value) || 1 
                          }
                        })}
                        min="1"
                        max="5"
                      />
                    </div>

                    <div>
                      <Label>Stop Loss Method</Label>
                      <Select
                        value={selectedPatternData.riskSettings.stopLossMethod}
                        onValueChange={(value) => updatePattern(selectedPatternData.id, {
                          riskSettings: { 
                            ...selectedPatternData.riskSettings, 
                            stopLossMethod: value as 'pattern' | 'atr' | 'fixed'
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-card border border-border shadow-lg">
                          <SelectItem value="pattern">Pattern-Based</SelectItem>
                          <SelectItem value="atr">ATR-Based</SelectItem>
                          <SelectItem value="fixed">Fixed Pips</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Take Profit Method</Label>
                      <Select
                        value={selectedPatternData.riskSettings.takeProfitMethod}
                        onValueChange={(value) => updatePattern(selectedPatternData.id, {
                          riskSettings: { 
                            ...selectedPatternData.riskSettings, 
                            takeProfitMethod: value as 'pattern' | 'ratio' | 'fixed'
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-card border border-border shadow-lg">
                          <SelectItem value="pattern">Pattern Target</SelectItem>
                          <SelectItem value="ratio">Risk-Reward Ratio</SelectItem>
                          <SelectItem value="fixed">Fixed Pips</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pattern Detail Dialog - View Only */}
      <Dialog open={!!detailPattern} onOpenChange={(open) => !open && setDetailPattern(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailPattern?.pattern.name}
              <Badge 
                variant={detailPattern?.pattern.type === 'reversal' ? 'destructive' : 
                        detailPattern?.pattern.type === 'continuation' ? 'default' : 'secondary'}
              >
                {detailPattern?.pattern.type}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {detailPattern && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {detailPattern.pattern.description}
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Detection Framework</h4>
                <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                  <div><strong className="text-primary">Detect:</strong> {detailPattern.pattern.framework.detect}</div>
                  <div><strong className="text-primary">Confirm:</strong> {detailPattern.pattern.framework.confirm}</div>
                  <div><strong className="text-primary">Enter:</strong> {detailPattern.pattern.framework.enter}</div>
                  <div><strong className="text-primary">Manage:</strong> {detailPattern.pattern.framework.manage}</div>
                  <div><strong className="text-primary">Invalidate:</strong> {detailPattern.pattern.framework.invalidate}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Parameters</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(detailPattern.pattern.parameters).map(([key, param]) => (
                    <div key={key} className="flex justify-between bg-muted/30 px-2 py-1 rounded">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                      <span className="font-medium">
                        {(param as any).type === 'boolean' 
                          ? ((param as any).value ? 'Yes' : 'No')
                          : `${(param as any).value} ${(param as any).unit || ''}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => {
                  // Wedge mode guard: block unsupported patterns
                  if (wedgeConfig.wedgeEnabled && !isPatternIdSupportedInWedge(detailPattern.pattern.id)) {
                    showWedgeModeBlockedToast();
                    setDetailPattern(null);
                    return;
                  }
                  
                  const isActive = patterns.some(p => p.patternType === detailPattern.pattern.id || p.id.startsWith(detailPattern.pattern.id));
                  if (!isActive) {
                    addSinglePattern(detailPattern.categoryKey, detailPattern.pattern.id);
                  }
                  setDetailPattern(null);
                }}
                disabled={
                  patterns.some(p => p.patternType === detailPattern.pattern.id || p.id.startsWith(detailPattern.pattern.id)) ||
                  (wedgeConfig.wedgeEnabled && !isPatternIdSupportedInWedge(detailPattern.pattern.id))
                }
              >
                {patterns.some(p => p.patternType === detailPattern.pattern.id || p.id.startsWith(detailPattern.pattern.id)) 
                  ? 'Already Added' 
                  : (wedgeConfig.wedgeEnabled && !isPatternIdSupportedInWedge(detailPattern.pattern.id))
                    ? 'Not Available in Wedge Mode'
                    : 'Add to Strategy'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};