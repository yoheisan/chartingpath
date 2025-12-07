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
            <Badge variant="outline">{rules.maxTotalRisk}% total</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Hard limit on total account risk across all open positions. Institutional standard: 6-10%
          </p>
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
              <Label className="text-sm font-semibold">Your Selected Patterns Priority</Label>
              <p className="text-xs text-muted-foreground">
                When conflicts occur, patterns are prioritized in this order (1 = highest priority, traded first). 
                The score reflects historical reliability based on backtesting data.
              </p>
              <div className="grid gap-2">
                {selectedPatterns
                  .sort((a, b) => (rules.patternPriority[b] || 0) - (rules.patternPriority[a] || 0))
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
