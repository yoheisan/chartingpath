import React, { useState } from 'react';
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
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Triangle, 
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
        description: 'Brief consolidation after strong move',
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
        description: 'Indecision candle with equal open/close',
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
        description: 'Consolidation bar within previous bar range',
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
        description: 'XABCD pattern with specific Fibonacci ratios',
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
        description: 'More precise Gartley variant',
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
        description: 'Extension pattern beyond X point',
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
        description: 'Extreme extension harmonic pattern',
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
        description: 'Modern harmonic pattern with unique ratios',
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
        description: 'Breakout from first hour trading range',
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
        description: 'Narrowest range in 7 periods',
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
        description: 'Breakout from N-period high/low channel',
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
        description: 'Low volatility before expansion',
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
  category: string;
  enabled: boolean;
  priority: number;
  parameters: Record<string, any>;
  riskSettings: {
    riskPerTrade: number;
    stopLossMethod: 'pattern' | 'atr' | 'fixed';
    takeProfitMethod: 'pattern' | 'ratio' | 'fixed';
    maxConcurrentTrades: number;
  };
}

interface PatternLibraryProps {
  patterns: PatternConfig[];
  onChange: (patterns: PatternConfig[]) => void;
}

export const PatternLibrary: React.FC<PatternLibraryProps> = ({
  patterns,
  onChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const addPattern = (categoryKey: string, patternId: string) => {
    const category = PATTERN_CATEGORIES[categoryKey as keyof typeof PATTERN_CATEGORIES];
    const pattern = category.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    const newPattern: PatternConfig = {
      id: `${patternId}_${Date.now()}`,
      category: categoryKey,
      enabled: true,
      priority: patterns.length + 1,
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

    onChange([...patterns, newPattern]);
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
      <Card 
        ref={setNodeRef} 
        style={style} 
        className="p-3 cursor-default"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
            <Switch
              checked={pattern.enabled}
              onCheckedChange={(checked) => updatePattern(pattern.id, { enabled: checked })}
            />
            <div>
              <div className="font-medium text-sm">{patternInfo.name}</div>
              <div className="text-xs text-muted-foreground">
                Priority: {pattern.priority}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
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
              onClick={() => removePattern(pattern.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Risk: {pattern.riskSettings.riskPerTrade}% • 
          Stop: {pattern.riskSettings.stopLossMethod} • 
          Target: {pattern.riskSettings.takeProfitMethod}
        </div>
      </Card>
    );
  };

  const getPatternInfo = (categoryKey: string, patternId: string) => {
    const category = PATTERN_CATEGORIES[categoryKey as keyof typeof PATTERN_CATEGORIES];
    return category?.patterns.find(p => p.id === patternId.split('_')[0]);
  };

  const filteredCategories = Object.entries(PATTERN_CATEGORIES).filter(([key, category]) => {
    if (selectedCategory !== 'all' && key !== selectedCategory) return false;
    if (!searchTerm) return true;
    
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.patterns.some(p => 
             p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.description.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  const selectedPatternData = patterns.find(p => p.id === selectedPattern);
  const selectedPatternInfo = selectedPatternData ? 
    getPatternInfo(selectedPatternData.category, selectedPatternData.id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Professional Pattern Library
              <Badge variant="outline">{patterns.length} Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search patterns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-card border border-border shadow-lg">
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(PATTERN_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pattern Categories */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCategories.map(([categoryKey, category]) => (
            <Card key={categoryKey}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="w-5 h-5" />
                  {category.name}
                  <Badge variant="secondary">{category.patterns.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.patterns
                    .filter(pattern => 
                      !searchTerm || 
                      pattern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      pattern.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((pattern) => {
                      const isActive = patterns.some(p => p.id.startsWith(pattern.id));
                      
                      return (
                        <Card key={pattern.id} className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-sm">{pattern.name}</h4>
                                <Badge 
                                  variant={pattern.type === 'reversal' ? 'destructive' : 
                                          pattern.type === 'continuation' ? 'default' : 'secondary'} 
                                  className="text-xs mt-1"
                                >
                                  {pattern.type}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant={isActive ? "secondary" : "outline"}
                                onClick={() => addPattern(categoryKey, pattern.id)}
                                disabled={isActive}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {pattern.description}
                            </p>
                            
                            {/* Framework Preview */}
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-primary">Detection Framework:</div>
                              <div className="text-xs text-muted-foreground">
                                <div><strong>Detect:</strong> {pattern.framework.detect}</div>
                                <div><strong>Enter:</strong> {pattern.framework.enter}</div>
                                <div><strong>Target:</strong> {pattern.framework.manage}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Patterns Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Patterns</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag patterns to reorder priority, toggle to enable/disable
              </p>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No patterns selected</p>
                  <p className="text-xs">Add patterns from the library to start building your strategy</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={patterns.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {patterns.map((pattern) => {
                        const patternInfo = getPatternInfo(pattern.category, pattern.id);
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
};