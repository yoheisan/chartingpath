import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  TrendingUp, 
  Target, 
  Clock, 
  BarChart3, 
  AlertTriangle,
  Info,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export interface DisciplineFilters {
  // Trend Alignment
  trendAlignmentEnabled: boolean;
  trendTimeframe: '4h' | 'daily' | 'weekly';
  trendIndicator: 'ema50' | 'ema200' | 'sma50' | 'sma200';
  
  // Risk/Reward
  minRiskRewardEnabled: boolean;
  minRiskReward: number;
  
  // Volume Confirmation
  volumeConfirmationEnabled: boolean;
  volumeMultiplier: number;
  
  // Pattern Limits
  maxPatternsEnabled: boolean;
  maxPatterns: number;
  
  // Max Concurrent Trades
  maxConcurrentTradesEnabled: boolean;
  maxConcurrentTrades: number;
  
  // Time Filters
  timeFilterEnabled: boolean;
  avoidLowLiquidity: boolean;
  avoidNewsEvents: boolean;
  
  // ATR Stop Validation
  atrStopValidationEnabled: boolean;
  minAtrMultiplier: number;
  
  // Cooldown Period
  cooldownEnabled: boolean;
  cooldownBars: number;
}

export const DEFAULT_DISCIPLINE_FILTERS: DisciplineFilters = {
  trendAlignmentEnabled: true,
  trendTimeframe: 'daily',
  trendIndicator: 'ema50',
  
  minRiskRewardEnabled: true,
  minRiskReward: 2.0,
  
  volumeConfirmationEnabled: true,
  volumeMultiplier: 1.5,
  
  maxPatternsEnabled: true,
  maxPatterns: 3,
  
  maxConcurrentTradesEnabled: true,
  maxConcurrentTrades: 2,
  
  timeFilterEnabled: true,
  avoidLowLiquidity: true,
  avoidNewsEvents: true,
  
  atrStopValidationEnabled: true,
  minAtrMultiplier: 1.0,
  
  cooldownEnabled: true,
  cooldownBars: 5,
};

interface TradeDisciplineFiltersProps {
  filters: DisciplineFilters;
  onChange: (filters: DisciplineFilters) => void;
}

interface FilterRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  guidance: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: React.ReactNode;
}

const FilterRow: React.FC<FilterRowProps> = ({
  icon,
  title,
  description,
  guidance,
  enabled,
  onToggle,
  children
}) => (
  <div className={`p-4 rounded-lg border transition-all ${enabled ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1">
        <div className={`p-2 rounded-md ${enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Label className="font-medium">{title}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{guidance}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {enabled && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {enabled && children && (
            <div className="pt-3 space-y-3">
              {children}
            </div>
          )}
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  </div>
);

export const TradeDisciplineFilters: React.FC<TradeDisciplineFiltersProps> = ({
  filters,
  onChange
}) => {
  const updateFilter = <K extends keyof DisciplineFilters>(key: K, value: DisciplineFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_DISCIPLINE_FILTERS);
  };

  const activeFiltersCount = [
    filters.trendAlignmentEnabled,
    filters.minRiskRewardEnabled,
    filters.volumeConfirmationEnabled,
    filters.maxPatternsEnabled,
    filters.maxConcurrentTradesEnabled,
    filters.timeFilterEnabled,
    filters.atrStopValidationEnabled,
    filters.cooldownEnabled
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Trade Discipline Filters</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {activeFiltersCount}/8 Active
            </Badge>
            <Button variant="ghost" size="sm" onClick={resetToDefaults} className="gap-1">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
        <CardDescription>
          Professional-grade filters to enforce trading discipline and avoid common mistakes. 
          <span className="text-primary font-medium"> Defaults are set to professional standards.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Trend Alignment Filter */}
        <FilterRow
          icon={<TrendingUp className="w-4 h-4" />}
          title="Trend Alignment"
          description="Only trade patterns that align with the higher timeframe trend direction"
          guidance="This is the #1 filter professionals use. Trading with the trend dramatically improves win rate. A bullish pattern in a downtrend is much less reliable."
          enabled={filters.trendAlignmentEnabled}
          onToggle={(v) => updateFilter('trendAlignmentEnabled', v)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Reference Timeframe</Label>
              <Select value={filters.trendTimeframe} onValueChange={(v) => updateFilter('trendTimeframe', v as any)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4h">4 Hour</SelectItem>
                  <SelectItem value="daily">Daily (Recommended)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trend Indicator</Label>
              <Select value={filters.trendIndicator} onValueChange={(v) => updateFilter('trendIndicator', v as any)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ema50">50 EMA</SelectItem>
                  <SelectItem value="ema200">200 EMA</SelectItem>
                  <SelectItem value="sma50">50 SMA</SelectItem>
                  <SelectItem value="sma200">200 SMA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterRow>

        {/* Minimum Risk/Reward */}
        <FilterRow
          icon={<Target className="w-4 h-4" />}
          title="Minimum Risk/Reward"
          description="Reject trades that don't meet the minimum reward-to-risk ratio"
          guidance="Professional traders typically require at least 2:1 R:R. This means your winners need to be twice as large as your losers. Even with a 40% win rate, you'll be profitable."
          enabled={filters.minRiskRewardEnabled}
          onToggle={(v) => updateFilter('minRiskRewardEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Minimum R:R Ratio</Label>
              <Badge variant="outline">{filters.minRiskReward}:1</Badge>
            </div>
            <Slider
              value={[filters.minRiskReward]}
              onValueChange={([v]) => updateFilter('minRiskReward', v)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1:1 (Risky)</span>
              <span>2:1 (Standard)</span>
              <span>5:1 (Conservative)</span>
            </div>
          </div>
        </FilterRow>

        {/* Volume Confirmation */}
        <FilterRow
          icon={<BarChart3 className="w-4 h-4" />}
          title="Volume Confirmation"
          description="Require above-average volume on pattern breakouts"
          guidance="Volume confirms conviction. A breakout on low volume often fails. Professionals look for volume 1.5x+ the average to confirm the move is real."
          enabled={filters.volumeConfirmationEnabled}
          onToggle={(v) => updateFilter('volumeConfirmationEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Minimum Volume Multiplier</Label>
              <Badge variant="outline">{filters.volumeMultiplier}x Average</Badge>
            </div>
            <Slider
              value={[filters.volumeMultiplier]}
              onValueChange={([v]) => updateFilter('volumeMultiplier', v)}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </FilterRow>

        {/* Pattern Limit */}
        <FilterRow
          icon={<AlertTriangle className="w-4 h-4" />}
          title="Pattern Specialization"
          description="Limit the number of patterns you trade to improve mastery"
          guidance="Jack of all trades, master of none. Professional traders often specialize in 2-3 patterns they know deeply. This forces focus and expertise over scattered attention."
          enabled={filters.maxPatternsEnabled}
          onToggle={(v) => updateFilter('maxPatternsEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Maximum Patterns Allowed</Label>
              <Badge variant="outline">{filters.maxPatterns} patterns</Badge>
            </div>
            <Slider
              value={[filters.maxPatterns]}
              onValueChange={([v]) => updateFilter('maxPatterns', v)}
              min={1}
              max={6}
              step={1}
              className="w-full"
            />
          </div>
        </FilterRow>

        {/* Max Concurrent Trades */}
        <FilterRow
          icon={<Shield className="w-4 h-4" />}
          title="Position Limits"
          description="Limit simultaneous open positions to manage overall risk"
          guidance="Overtrading is the #1 account killer. Limiting concurrent trades forces you to be selective and prevents correlation risk (multiple positions moving against you at once)."
          enabled={filters.maxConcurrentTradesEnabled}
          onToggle={(v) => updateFilter('maxConcurrentTradesEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Maximum Open Positions</Label>
              <Badge variant="outline">{filters.maxConcurrentTrades} trades</Badge>
            </div>
            <Slider
              value={[filters.maxConcurrentTrades]}
              onValueChange={([v]) => updateFilter('maxConcurrentTrades', v)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </FilterRow>

        {/* Time Filters */}
        <FilterRow
          icon={<Clock className="w-4 h-4" />}
          title="Time-Based Filters"
          description="Avoid trading during unfavorable market conditions"
          guidance="Not all hours are equal. Low liquidity periods have wider spreads and more false breakouts. News events cause unpredictable volatility that invalidates technical patterns."
          enabled={filters.timeFilterEnabled}
          onToggle={(v) => updateFilter('timeFilterEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.avoidLowLiquidity}
                  onCheckedChange={(v) => updateFilter('avoidLowLiquidity', v)}
                  className="scale-75"
                />
                <Label className="text-xs">Avoid low-liquidity hours</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.avoidNewsEvents}
                  onCheckedChange={(v) => updateFilter('avoidNewsEvents', v)}
                  className="scale-75"
                />
                <Label className="text-xs">Avoid major news events</Label>
              </div>
            </div>
          </div>
        </FilterRow>

        {/* ATR Stop Validation */}
        <FilterRow
          icon={<Target className="w-4 h-4" />}
          title="Volatility-Adjusted Stops"
          description="Ensure stop losses respect market volatility (ATR)"
          guidance="Stops that are too tight get hit by normal market noise. Your stop should be at least 1 ATR away from entry to give the trade room to breathe."
          enabled={filters.atrStopValidationEnabled}
          onToggle={(v) => updateFilter('atrStopValidationEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Minimum Stop Distance</Label>
              <Badge variant="outline">{filters.minAtrMultiplier} ATR</Badge>
            </div>
            <Slider
              value={[filters.minAtrMultiplier]}
              onValueChange={([v]) => updateFilter('minAtrMultiplier', v)}
              min={0.5}
              max={3}
              step={0.25}
              className="w-full"
            />
          </div>
        </FilterRow>

        {/* Cooldown Period */}
        <FilterRow
          icon={<Clock className="w-4 h-4" />}
          title="Trade Cooldown"
          description="Enforce minimum time between trades on the same instrument"
          guidance="Prevents revenge trading and overtrading after losses. After exiting a position, wait before re-entering to avoid emotional decisions and let the setup develop properly."
          enabled={filters.cooldownEnabled}
          onToggle={(v) => updateFilter('cooldownEnabled', v)}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Cooldown Period</Label>
              <Badge variant="outline">{filters.cooldownBars} bars</Badge>
            </div>
            <Slider
              value={[filters.cooldownBars]}
              onValueChange={([v]) => updateFilter('cooldownBars', v)}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
        </FilterRow>

        {/* Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Pro Tip:</strong> Start with all filters enabled at default settings. 
            Only disable filters after you understand their purpose and have a specific reason to do so. 
            These guardrails exist because even professionals need discipline enforcement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
