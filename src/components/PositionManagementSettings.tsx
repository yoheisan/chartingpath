import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, AlertTriangle, Info, Target } from 'lucide-react';
import { PositionManagementRules } from '@/utils/ProfessionalPatternRules';
import { Separator } from '@/components/ui/separator';

interface PositionManagementSettingsProps {
  rules: PositionManagementRules;
  onChange: (rules: PositionManagementRules) => void;
  selectedPatterns?: string[];
}

export const PositionManagementSettings: React.FC<PositionManagementSettingsProps> = ({
  rules,
  onChange,
  selectedPatterns = []
}) => {
  const handleChange = (field: keyof PositionManagementRules, value: any) => {
    onChange({ ...rules, [field]: value });
  };

  const totalRiskUsed = rules.maxSimultaneousTrades * rules.maxRiskPerTrade;
  const isRiskExceeded = totalRiskUsed > rules.maxTotalRisk;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Position Management & Risk Control
        </CardTitle>
        <CardDescription>
          Professional rules to manage multiple trades and prevent overlapping patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Risk Warning */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            These settings prevent over-trading and ensure disciplined position sizing across multiple chart patterns.
            <span className="block mt-1 font-medium">In backtesting, the Maximum Total Risk triggers auto-exit of all positions when the loss threshold is reached.</span>
          </AlertDescription>
        </Alert>

        {/* Maximum Simultaneous Trades */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Maximum Simultaneous Trades</Label>
            <Badge variant="outline">{rules.maxSimultaneousTrades} trades</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Limit how many patterns can be actively traded at once. Prevents over-exposure.
          </p>
          <Slider
            value={[rules.maxSimultaneousTrades]}
            onValueChange={([value]) => handleChange('maxSimultaneousTrades', value)}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative (1-3)</span>
            <span>Moderate (4-6)</span>
            <span>Aggressive (7-10)</span>
          </div>
        </div>

        <Separator />

        {/* Risk Per Trade */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Risk Per Trade (%)</Label>
            <Badge variant="outline">{rules.maxRiskPerTrade}% per trade</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum account risk per individual pattern trade. Professional standard: 1-2%
          </p>
          <Slider
            value={[rules.maxRiskPerTrade]}
            onValueChange={([value]) => handleChange('maxRiskPerTrade', value)}
            min={0.5}
            max={5.0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative (0.5-1%)</span>
            <span>Standard (1.5-2%)</span>
            <span>Aggressive (3-5%)</span>
          </div>
        </div>

        <Separator />

        {/* Total Risk Cap */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Maximum Total Risk (%)</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{rules.maxTotalRisk}% total</Badge>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Auto-Exit Trigger
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Hard limit on total account risk across all open positions. Institutional standard: 6-10%
          </p>
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Backtesting Behavior:</strong> When combined losses from all open trades reach this threshold, 
              ALL positions are automatically closed. New trades will still be entered when the next valid pattern 
              confirms, allowing the backtest to continue.
            </AlertDescription>
          </Alert>
          <Slider
            value={[rules.maxTotalRisk]}
            onValueChange={([value]) => handleChange('maxTotalRisk', value)}
            min={2}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative (2-6%)</span>
            <span>Moderate (7-12%)</span>
            <span>Aggressive (13-20%)</span>
          </div>
        </div>

        <Separator />

        {/* Max Account Drawdown - Stops ALL Trading */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Max Account Drawdown (%)</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{rules.maxAccountDrawdown || 20}% limit</Badge>
              <Badge variant="destructive" className="text-xs">
                Stops Trading
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum cumulative loss allowed before halting all trading. This is the "circuit breaker" for the entire backtest.
          </p>
          <Alert className="bg-destructive/10 border-destructive/30">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-xs text-destructive dark:text-destructive-foreground">
              <strong>Backtest Circuit Breaker:</strong> When total realized losses from the initial capital reach this threshold, 
              NO new trades will be entered for the remainder of the backtest. Unlike Maximum Total Risk (which exits positions 
              but allows new trades), this completely halts trading activity.
            </AlertDescription>
          </Alert>
          <Slider
            value={[rules.maxAccountDrawdown || 20]}
            onValueChange={([value]) => handleChange('maxAccountDrawdown', value)}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative (5-15%)</span>
            <span>Moderate (20-30%)</span>
            <span>Aggressive (35-50%)</span>
          </div>
        </div>

        {/* Risk Calculation Display */}
        <Alert variant={isRiskExceeded ? "destructive" : "default"}>
          {isRiskExceeded ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-semibold">
                Current Risk Configuration:
              </div>
              <div className="text-sm">
                {rules.maxSimultaneousTrades} trades × {rules.maxRiskPerTrade}% = {totalRiskUsed.toFixed(1)}% potential exposure
              </div>
              {isRiskExceeded && (
                <div className="text-sm font-semibold mt-2">
                  ⚠️ Warning: Potential exposure ({totalRiskUsed.toFixed(1)}%) exceeds your maximum total risk ({rules.maxTotalRisk}%)
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Pattern Conflict Resolution */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Pattern Overlap/Conflict Resolution</Label>
          <p className="text-xs text-muted-foreground">
            When multiple patterns form in the same price zone, which one should be traded?
          </p>
          <Select
            value={rules.conflictResolution}
            onValueChange={(value) => handleChange('conflictResolution', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first-formed">
                <div className="flex flex-col">
                  <span className="font-medium">First Formed (Chronological)</span>
                  <span className="text-xs text-muted-foreground">Trade the pattern that formed earliest</span>
                </div>
              </SelectItem>
              <SelectItem value="higher-priority">
                <div className="flex flex-col">
                  <span className="font-medium">Higher Priority (Recommended)</span>
                  <span className="text-xs text-muted-foreground">Trade based on pattern reliability/success rate</span>
                </div>
              </SelectItem>
              <SelectItem value="higher-quality">
                <div className="flex flex-col">
                  <span className="font-medium">Higher Quality Score</span>
                  <span className="text-xs text-muted-foreground">Trade the pattern with best formation quality</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pattern Priority Display */}
        {selectedPatterns.length > 1 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Your Selected Patterns Priority</Label>
                <Badge variant="secondary" className="text-xs">
                  {selectedPatterns.length} pattern{selectedPatterns.length !== 1 ? 's' : ''} enabled
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                When conflicts occur and max trades ({rules.maxSimultaneousTrades}) is reached, patterns are prioritized in this order (1 = highest priority, traded first).
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Reliability Score (1-10):</strong> Based on historical backtesting data measuring pattern success rate,
                average risk-reward ratio, and consistency across market conditions. Higher scores indicate more dependable patterns.
              </p>
              <div className="grid gap-2">
                {selectedPatterns
                  .sort((a, b) => {
                    const priorityDiff = (rules.patternPriority[b] || 0) - (rules.patternPriority[a] || 0);
                    // If same priority (including both being 0), sort alphabetically for consistent ordering
                    return priorityDiff !== 0 ? priorityDiff : a.localeCompare(b);
                  })
                  .map((patternId, index) => {
                    const priority = rules.patternPriority[patternId] || 0;
                    const hasNoPriority = priority === 0;
                    return (
                      <div key={patternId} className={`flex items-center justify-between p-2 rounded ${hasNoPriority ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/30'}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-8 justify-center">{index + 1}</Badge>
                          <span className="text-sm capitalize">{patternId.replace(/-/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Reliability:</span>
                          {hasNoPriority ? (
                            <Badge variant="destructive" className="text-xs">
                              Not rated
                            </Badge>
                          ) : (
                            <Badge variant={priority >= 8 ? "default" : priority >= 6 ? "secondary" : "outline"}>
                              {priority}/10
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {selectedPatterns.some(p => (rules.patternPriority[p] || 0) === 0) && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Some patterns have no reliability rating. They will be lowest priority when "Higher Priority" conflict resolution is selected.
                    {selectedPatterns.every(p => (rules.patternPriority[p] || 0) === 0) && (
                      <span className="block mt-1 font-medium">When all patterns have zero reliability, they are sorted alphabetically for consistent execution order.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Overlap Prevention Info */}
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <div className="font-semibold mb-1">Automatic Overlap Prevention:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Patterns in the same price zone (within 10%) are detected</li>
              <li>Only one pattern per price zone is traded based on your resolution rule</li>
              <li>Prevents double exposure to the same price movement</li>
              <li>If a pattern morphs into another, the original trade continues (no new entry)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
