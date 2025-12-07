import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Info, BookOpen, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PROFESSIONAL_PATTERN_RULES, PatternRules } from '@/utils/ProfessionalPatternRules';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SelectedPattern {
  id: string;
  name: string;
  enabled: boolean;
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
}

// Pattern-specific default targets and stop losses (based on professional rules)
// Pattern-specific default targets and stop losses (based on professional rules)
// Keys must match pattern IDs exactly from PatternLibrary
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

export const TargetStopLossSettings: React.FC<TargetStopLossSettingsProps> = ({
  targetGainPercent,
  stopLossPercent,
  positionSizing,
  selectedPatterns = [],
  onChange
}) => {
  const [showMethodology, setShowMethodology] = useState<string | null>(null);
  const [expandedPatterns, setExpandedPatterns] = useState(false);

  const riskRewardRatio = stopLossPercent > 0 ? targetGainPercent / stopLossPercent : 0;

  // Get enabled patterns
  const enabledPatterns = useMemo(() => 
    selectedPatterns.filter(p => p.enabled),
    [selectedPatterns]
  );

  // Calculate recommended values based on selected patterns
  const recommendedValues = useMemo(() => {
    if (enabledPatterns.length === 0) {
      return { target: 5.0, stopLoss: 2.0, patterns: [] };
    }

    const patternData = enabledPatterns.map(p => {
      const defaults = PATTERN_DEFAULTS[p.id] || { target: 5.0, stopLoss: 2.0, methodology: 'Standard measured move' };
      return { ...p, ...defaults };
    });

    // Calculate weighted average (could be improved with reliability scores)
    const avgTarget = patternData.reduce((sum, p) => sum + p.target, 0) / patternData.length;
    const avgStopLoss = patternData.reduce((sum, p) => sum + p.stopLoss, 0) / patternData.length;

    return {
      target: Math.round(avgTarget * 10) / 10,
      stopLoss: Math.round(avgStopLoss * 10) / 10,
      patterns: patternData
    };
  }, [enabledPatterns]);

  const applyPatternDefaults = () => {
    onChange({ 
      targetGainPercent: recommendedValues.target, 
      stopLossPercent: recommendedValues.stopLoss, 
      positionSizing 
    });
  };

  const isUsingDefaults = targetGainPercent === recommendedValues.target && 
                          stopLossPercent === recommendedValues.stopLoss;

  return (
    <div className="space-y-6">
      {/* Per-Trade Notice */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertTitle>Per-Trade Settings</AlertTitle>
        <AlertDescription>
          These settings apply to <strong>each individual trade</strong>. Professional traders customize targets and stops based on the specific pattern being traded.
        </AlertDescription>
      </Alert>

      {/* Pattern-Specific Recommendations */}
      {enabledPatterns.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-col gap-2 text-base">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Pattern-Specific Recommendations
                </div>
                <Button
                variant={isUsingDefaults ? "secondary" : "default"}
                size="sm"
                onClick={applyPatternDefaults}
                disabled={isUsingDefaults}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                  {isUsingDefaults ? 'Applied' : 'Apply Defaults'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {enabledPatterns.map((pattern) => (
                  <Badge key={pattern.id} variant="secondary" className="text-xs font-normal">
                    {pattern.name}
                  </Badge>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recommended Target:</span>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                {recommendedValues.target}%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recommended Stop Loss:</span>
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                {recommendedValues.stopLoss}%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Implied R:R Ratio:</span>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                1:{(recommendedValues.target / recommendedValues.stopLoss).toFixed(2)}
              </Badge>
            </div>

            {/* Pattern Methodologies (Collapsible) */}
            <Collapsible open={expandedPatterns} onOpenChange={setExpandedPatterns}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-2 gap-2">
                  {expandedPatterns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expandedPatterns ? 'Hide' : 'Show'} Pattern Methodologies ({enabledPatterns.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-3">
                {recommendedValues.patterns.map((pattern) => {
                  const hasCustomDefaults = !!PATTERN_DEFAULTS[pattern.id];
                  return (
                    <div 
                      key={pattern.id}
                      className="p-3 rounded-lg border bg-muted/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{pattern.name}</span>
                          {!hasCustomDefaults && (
                            <Badge variant="secondary" className="text-xs">Generic</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs text-green-600">
                            T: {pattern.target}%
                          </Badge>
                          <Badge variant="outline" className="text-xs text-red-600">
                            SL: {pattern.stopLoss}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pattern.methodology}
                      </p>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Profit Target - Per Trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Profit Target <span className="text-xs font-normal text-muted-foreground">(per trade)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Target Gain %</Label>
              <span className="text-sm font-medium text-primary">{targetGainPercent.toFixed(2)}%</span>
            </div>
            <Slider
              value={[targetGainPercent]}
              onValueChange={(value) => onChange({ targetGainPercent: value[0], stopLossPercent, positionSizing })}
              min={0.5}
              max={20}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5%</span>
              <span>20%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Enter exact value (%)</Label>
            <Input
              type="number"
              value={targetGainPercent}
              onChange={(e) => onChange({ targetGainPercent: parseFloat(e.target.value) || 0, stopLossPercent, positionSizing })}
              min={0.1}
              max={100}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stop Loss - Per Trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Stop Loss <span className="text-xs font-normal text-muted-foreground">(per trade)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Stop Loss %</Label>
              <span className="text-sm font-medium text-destructive">{stopLossPercent.toFixed(2)}%</span>
            </div>
            <Slider
              value={[stopLossPercent]}
              onValueChange={(value) => onChange({ targetGainPercent, stopLossPercent: value[0], positionSizing })}
              min={0.25}
              max={10}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.25%</span>
              <span>10%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Enter exact value (%)</Label>
            <Input
              type="number"
              value={stopLossPercent}
              onChange={(e) => onChange({ targetGainPercent, stopLossPercent: parseFloat(e.target.value) || 0, positionSizing })}
              min={0.1}
              max={50}
              step={0.05}
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk:Reward Analysis */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk:Reward Ratio (per trade)</span>
              <span className="text-2xl font-bold text-primary">
                1:{riskRewardRatio.toFixed(2)}
              </span>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {riskRewardRatio >= 2 
                  ? '✓ Excellent R:R ratio. Professional traders typically aim for 1:2 or better.' 
                  : riskRewardRatio >= 1.5 
                  ? '✓ Good R:R ratio. Allows profitability with 40%+ win rate.' 
                  : riskRewardRatio > 0
                  ? '⚠ Consider increasing target or decreasing stop loss. Low R:R requires high win rate.'
                  : 'Set target and stop loss values to calculate R:R ratio.'}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

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
