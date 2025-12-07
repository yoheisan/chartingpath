import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Info, BookOpen, RotateCcw, Edit2, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PROFESSIONAL_PATTERN_RULES, PatternRules } from '@/utils/ProfessionalPatternRules';

export interface SelectedPattern {
  id: string;
  patternType?: string; // Original pattern ID without timestamp
  name: string;
  enabled: boolean;
  customTarget?: number; // Per-pattern override
  customStopLoss?: number; // Per-pattern override
  useCustomTPSL?: boolean; // Toggle to use custom or default
}

interface TargetStopLossSettingsProps {
  targetGainPercent: number;
  stopLossPercent: number;
  positionSizing: {
    method: 'fixed_percent' | 'fixed_amount' | 'risk_based';
    riskPerTrade: number;
    maxPositions: number;
  };
  selectedPatterns?: SelectedPattern[];
  onChange: (data: any) => void;
  onPatternChange?: (patternId: string, updates: Partial<SelectedPattern>) => void;
}

// Pattern-specific default targets and stop losses (based on professional rules)
const PATTERN_DEFAULTS: Record<string, { target: number; stopLoss: number; methodology: string }> = {
  // Classical Patterns
  'head_shoulders': { 
    target: 8.0, 
    stopLoss: 3.0, 
    methodology: 'Measured move from neckline to head, projected downward. Target 1 at 61.8%, Target 2 at 100% of measured move.' 
  },
  'inverse_head_shoulders': { 
    target: 8.0, 
    stopLoss: 3.0, 
    methodology: 'Measured move from head to neckline, projected upward. Exit 50% at 1:1 R:R, trail remainder.' 
  },
  'double_top': { 
    target: 6.0, 
    stopLoss: 2.5, 
    methodology: 'Pattern height (peak to support) subtracted from support. Target 1 at 61.8%, Target 2 at 100%.' 
  },
  'double_bottom': { 
    target: 6.0, 
    stopLoss: 2.5, 
    methodology: 'Pattern height (trough to resistance) added to resistance. Exit 50% at 1:1.5 R:R.' 
  },
  'ascending_triangle': { 
    target: 7.0, 
    stopLoss: 2.0, 
    methodology: 'Triangle height added to breakout. 72-75% probability of reaching target.' 
  },
  'descending_triangle': { 
    target: 7.0, 
    stopLoss: 2.0, 
    methodology: 'Triangle height subtracted from breakdown. 72-75% probability of measured move.' 
  },
  'flag': { 
    target: 5.0, 
    stopLoss: 1.5, 
    methodology: 'Flagpole length added to breakout. 68-72% probability. Exit 50% at 1:2 R:R.' 
  },
  'wedge_rising': { 
    target: 6.0, 
    stopLoss: 2.5, 
    methodology: 'Wedge height (widest point) projected down. Bearish pattern despite rising price.' 
  },
  'cup_handle': { 
    target: 10.0, 
    stopLoss: 4.0, 
    methodology: 'Cup depth added to breakout. Target 1 at 50%, Target 2 at 100% of cup depth. Trail with 50-day MA.' 
  },
  // Candlestick Patterns
  'bullish_engulfing': { 
    target: 3.0, 
    stopLoss: 1.5, 
    methodology: 'Target at nearest resistance. Stop below engulfing candle low.' 
  },
  'bearish_engulfing': { 
    target: 3.0, 
    stopLoss: 1.5, 
    methodology: 'Target at nearest support. Stop above engulfing candle high.' 
  },
  'hammer': { 
    target: 3.0, 
    stopLoss: 1.0, 
    methodology: 'Target 2-3x the hammer body. Stop below hammer low.' 
  },
  'shooting_star': { 
    target: 3.0, 
    stopLoss: 1.0, 
    methodology: 'Target 2-3x the star body. Stop above shooting star high.' 
  },
  'morning_star': { 
    target: 4.0, 
    stopLoss: 2.0, 
    methodology: 'Target at prior swing high. Stop below star candle low.' 
  },
  'evening_star': { 
    target: 4.0, 
    stopLoss: 2.0, 
    methodology: 'Target at prior swing low. Stop above star candle high.' 
  },
  'doji': { 
    target: 2.5, 
    stopLoss: 1.0, 
    methodology: 'Wait for confirmation candle. Target based on context.' 
  },
  'inside_bar': { 
    target: 3.0, 
    stopLoss: 1.5, 
    methodology: 'Target = mother bar range projected from breakout.' 
  },
  // Harmonic Patterns
  'gartley': { 
    target: 6.0, 
    stopLoss: 2.0, 
    methodology: 'Target at 61.8% retracement of AD leg. Stop beyond X point.' 
  },
  'bat': { 
    target: 6.0, 
    stopLoss: 2.0, 
    methodology: 'Target at 61.8% of AD. Stop below X (bullish) or above X (bearish).' 
  },
  'butterfly': { 
    target: 7.0, 
    stopLoss: 2.5, 
    methodology: 'Target at 61.8-78.6% of CD leg. Extended pattern allows larger targets.' 
  },
  'crab': { 
    target: 8.0, 
    stopLoss: 3.0, 
    methodology: 'Extreme extension pattern. Target at 61.8% of CD leg.' 
  },
  'cypher': { 
    target: 5.0, 
    stopLoss: 2.0, 
    methodology: 'Target at 38.2-61.8% of CD leg. Tighter stops than other harmonics.' 
  },
  // Volatility/Breakout Patterns
  'opening_range_breakout': { 
    target: 4.0, 
    stopLoss: 1.5, 
    methodology: 'Target = opening range height. Stop at opposite side of range.' 
  },
  'nr7': { 
    target: 4.0, 
    stopLoss: 1.0, 
    methodology: 'Breakout target = average of prior 7 bars range. Tight stop inside NR7 bar.' 
  },
  'donchian_breakout': { 
    target: 5.0, 
    stopLoss: 2.0, 
    methodology: 'Trail stop using opposite Donchian band. Let winners run.' 
  },
  'bollinger_squeeze': { 
    target: 5.0, 
    stopLoss: 2.0, 
    methodology: 'Volatility expansion target. Stop at middle band or opposite band.' 
  }
};

// Default values for patterns without specific rules
const DEFAULT_PATTERN_VALUES = { target: 5.0, stopLoss: 2.0, methodology: 'Standard measured move' };

export const TargetStopLossSettings: React.FC<TargetStopLossSettingsProps> = ({
  targetGainPercent,
  stopLossPercent,
  positionSizing,
  selectedPatterns = [],
  onChange,
  onPatternChange
}) => {
  const [editingPattern, setEditingPattern] = useState<string | null>(null);

  // Get enabled patterns
  const enabledPatterns = useMemo(() => 
    selectedPatterns.filter(p => p.enabled),
    [selectedPatterns]
  );

  // Calculate pattern data with defaults
  const patternData = useMemo(() => {
    return enabledPatterns.map(p => {
      // Extract pattern key from id (format: patternId_timestamp)
      let patternKey = p.patternType || p.id;
      if (!p.patternType) {
        const timestampMatch = p.id.match(/^(.+)_\d{13}$/);
        if (timestampMatch) {
          patternKey = timestampMatch[1];
        }
      }
      
      const defaults = PATTERN_DEFAULTS[patternKey] || DEFAULT_PATTERN_VALUES;
      const hasCustomDefaults = !!PATTERN_DEFAULTS[patternKey];
      
      // Use custom values if set, otherwise use defaults
      const effectiveTarget = p.customTarget ?? defaults.target;
      const effectiveStopLoss = p.customStopLoss ?? defaults.stopLoss;
      
      return { 
        ...p, 
        patternKey, 
        defaultTarget: defaults.target,
        defaultStopLoss: defaults.stopLoss,
        methodology: defaults.methodology,
        effectiveTarget,
        effectiveStopLoss,
        hasCustomDefaults,
        isModified: p.customTarget !== undefined || p.customStopLoss !== undefined
      };
    });
  }, [enabledPatterns]);

  // Calculate weighted average for summary
  const summaryValues = useMemo(() => {
    if (patternData.length === 0) {
      return { avgTarget: 5.0, avgStopLoss: 2.0 };
    }
    const avgTarget = patternData.reduce((sum, p) => sum + p.effectiveTarget, 0) / patternData.length;
    const avgStopLoss = patternData.reduce((sum, p) => sum + p.effectiveStopLoss, 0) / patternData.length;
    return {
      avgTarget: Math.round(avgTarget * 10) / 10,
      avgStopLoss: Math.round(avgStopLoss * 10) / 10
    };
  }, [patternData]);

  const handlePatternUpdate = (patternId: string, target: number, stopLoss: number) => {
    if (onPatternChange) {
      onPatternChange(patternId, { 
        customTarget: target,
        customStopLoss: stopLoss
      });
    }
    setEditingPattern(null);
  };

  const handleResetPattern = (patternId: string, defaultTarget: number, defaultStopLoss: number) => {
    if (onPatternChange) {
      onPatternChange(patternId, { 
        customTarget: undefined,
        customStopLoss: undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Per-Pattern Notice */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertTitle>Per-Pattern Take Profit & Stop Loss</AlertTitle>
        <AlertDescription>
          Each pattern has its own TP/SL based on professional methodologies. Edit individual values or use the defaults.
        </AlertDescription>
      </Alert>

      {/* No Patterns Selected */}
      {enabledPatterns.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No patterns selected</p>
              <p className="text-sm mt-1">Select patterns in Step 2 to configure their TP/SL settings</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern-Specific TP/SL Settings */}
      {patternData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Pattern TP/SL Settings
              </div>
              <Badge variant="outline" className="font-normal">
                {patternData.length} pattern{patternData.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patternData.map((pattern) => {
              const isEditing = editingPattern === pattern.id;
              const [tempTarget, setTempTarget] = React.useState(pattern.effectiveTarget);
              const [tempStopLoss, setTempStopLoss] = React.useState(pattern.effectiveStopLoss);
              
              // Reset temp values when editing starts
              React.useEffect(() => {
                if (isEditing) {
                  setTempTarget(pattern.effectiveTarget);
                  setTempStopLoss(pattern.effectiveStopLoss);
                }
              }, [isEditing, pattern.effectiveTarget, pattern.effectiveStopLoss]);
              
              return (
                <div 
                  key={pattern.id}
                  className={`p-4 rounded-lg border space-y-3 transition-all ${
                    pattern.isModified ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pattern.name}</span>
                      {!pattern.hasCustomDefaults && (
                        <Badge variant="secondary" className="text-xs">Generic</Badge>
                      )}
                      {pattern.isModified && (
                        <Badge variant="default" className="text-xs bg-primary/80">
                          Modified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <>
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                            TP: {pattern.effectiveTarget}%
                          </Badge>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                            SL: {pattern.effectiveStopLoss}%
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingPattern(pattern.id)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setEditingPattern(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handlePatternUpdate(pattern.id, tempTarget, tempStopLoss)}
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Methodology */}
                  <p className="text-xs text-muted-foreground">
                    {pattern.methodology}
                  </p>

                  {/* Edit Mode */}
                  {isEditing && (
                    <div className="pt-2 border-t border-border/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            Take Profit %
                          </Label>
                          <Input
                            type="number"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(parseFloat(e.target.value) || 0)}
                            min={0.1}
                            max={50}
                            step={0.1}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-red-500" />
                            Stop Loss %
                          </Label>
                          <Input
                            type="number"
                            value={tempStopLoss}
                            onChange={(e) => setTempStopLoss(parseFloat(e.target.value) || 0)}
                            min={0.1}
                            max={20}
                            step={0.1}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          R:R Ratio: 1:{tempStopLoss > 0 ? (tempTarget / tempStopLoss).toFixed(2) : '∞'}
                        </div>
                        {pattern.isModified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1"
                            onClick={() => handleResetPattern(pattern.id, pattern.defaultTarget, pattern.defaultStopLoss)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset to Default
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* R:R Display when not editing */}
                  {!isEditing && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">R:R Ratio</span>
                      <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                        1:{(pattern.effectiveTarget / pattern.effectiveStopLoss).toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      {patternData.length > 1 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average across {patternData.length} patterns:</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Target</p>
                  <p className="text-lg font-semibold text-green-600">{summaryValues.avgTarget}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Stop Loss</p>
                  <p className="text-lg font-semibold text-red-600">{summaryValues.avgStopLoss}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg R:R</p>
                  <p className="text-lg font-semibold text-primary">
                    1:{(summaryValues.avgTarget / summaryValues.avgStopLoss).toFixed(2)}
                  </p>
                </div>
              </div>
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Each trade uses the specific pattern's TP/SL values, not this average.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Position Sizing - Per Trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Position Sizing <span className="text-xs font-normal text-muted-foreground">(per trade)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sizing Method</Label>
            <Select
              value={positionSizing.method}
              onValueChange={(value: any) => onChange({ 
                targetGainPercent, 
                stopLossPercent, 
                positionSizing: { ...positionSizing, method: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk_based">Risk-Based (% of Account at Risk)</SelectItem>
                <SelectItem value="fixed_percent">Fixed % of Account Value</SelectItem>
                <SelectItem value="fixed_amount">Fixed Dollar Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Risk Per Trade (%)</Label>
              <span className="text-sm font-medium">{positionSizing.riskPerTrade}%</span>
            </div>
            <Slider
              value={[positionSizing.riskPerTrade]}
              onValueChange={(value) => onChange({ 
                targetGainPercent, 
                stopLossPercent, 
                positionSizing: { ...positionSizing, riskPerTrade: value[0] }
              })}
              min={0.5}
              max={5}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Professional traders typically risk 1-2% per trade. Never exceed 5%.
            </p>
            <Alert className="mt-2 bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Per-Trade vs Portfolio Risk:</strong> This sets risk per individual trade. 
                The "Maximum Total Risk" in Position Management controls when ALL trades auto-exit 
                in backtesting (e.g., 3 trades × 2% = 6% potential exposure).
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-2">
            <Label>Max Concurrent Positions</Label>
            <Input
              type="number"
              value={positionSizing.maxPositions}
              onChange={(e) => onChange({ 
                targetGainPercent, 
                stopLossPercent, 
                positionSizing: { ...positionSizing, maxPositions: parseInt(e.target.value) || 1 }
              })}
              min={1}
              max={10}
            />
            <p className="text-xs text-muted-foreground">
              Limits how many trades can be open simultaneously.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
