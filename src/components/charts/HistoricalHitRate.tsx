import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  Clock,
  Award,
  AlertTriangle,
  Info,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface PatternHitRate {
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  avgRMultiple: number;
  expectancy: number;
  profitFactor: number;
  avgHoldingBars: number;
  lastUpdated: string;
  regimeBreakdown?: {
    regimeKey: string;
    winRate: number;
    avgR: number;
    n: number;
    recommendation: 'trade' | 'caution' | 'avoid';
  }[];
  reliabilityScore: number; // 0-100 based on sample size
}

interface HistoricalHitRateProps {
  patternId: string;
  patternName: string;
  timeframe: string;
  direction: 'long' | 'short';
  compact?: boolean;
  className?: string;
}

// Mock historical data (in production, fetch from pattern_hit_rates table)
const getMockHitRate = (patternId: string, direction: 'long' | 'short'): PatternHitRate => {
  // Deterministic mock based on patternId hash
  const hash = patternId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseWinRate = 0.4 + (hash % 30) / 100;
  const totalSignals = 50 + (hash % 200);
  const wins = Math.round(totalSignals * baseWinRate);
  const losses = totalSignals - wins;
  const avgRMultiple = (hash % 20) / 10 - 0.5 + baseWinRate;
  
  return {
    patternId,
    patternName: patternId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    direction,
    totalSignals,
    wins,
    losses,
    winRate: baseWinRate,
    avgRMultiple,
    expectancy: avgRMultiple,
    profitFactor: avgRMultiple > 0 ? 1 + avgRMultiple : 0.5,
    avgHoldingBars: 15 + (hash % 30),
    lastUpdated: new Date().toISOString(),
    reliabilityScore: Math.min(100, Math.round((totalSignals / 100) * 100)),
    regimeBreakdown: [
      { regimeKey: 'UP_HIGH', winRate: baseWinRate + 0.1, avgR: 0.5, n: 25, recommendation: 'trade' },
      { regimeKey: 'UP_MED', winRate: baseWinRate + 0.05, avgR: 0.3, n: 40, recommendation: 'trade' },
      { regimeKey: 'DOWN_HIGH', winRate: baseWinRate - 0.1, avgR: -0.2, n: 15, recommendation: 'avoid' },
      { regimeKey: 'SIDEWAYS_MED', winRate: baseWinRate, avgR: 0.1, n: 30, recommendation: 'caution' },
    ]
  };
};

export function HistoricalHitRate({ 
  patternId, 
  patternName,
  timeframe,
  direction,
  compact = false,
  className 
}: HistoricalHitRateProps) {
  const [hitRate, setHitRate] = useState<PatternHitRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const fetchHitRate = async () => {
      setLoading(true);
      
      try {
        // Use RPC or raw query since table may not be in generated types yet
        // For now, use mock data with deterministic values based on pattern
        // In production, this will fetch from pattern_hit_rates table
        const mockData = getMockHitRate(patternId, direction);
        setHitRate(mockData);
      } catch (err) {
        // Fallback to mock data
        setHitRate(getMockHitRate(patternId, direction));
      }
      
      setLoading(false);
    };
    
    fetchHitRate();
  }, [patternId, timeframe, direction]);
  
  if (loading) {
    return compact ? (
      <Skeleton className="h-6 w-24" />
    ) : (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!hitRate) return null;
  
  // Determine performance color
  const getPerformanceColor = (value: number, type: 'winRate' | 'expectancy') => {
    if (type === 'winRate') {
      if (value >= 0.55) return 'text-green-500';
      if (value >= 0.45) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (value >= 0.3) return 'text-green-500';
      if (value >= 0) return 'text-yellow-500';
      return 'text-red-500';
    }
  };
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'inline-flex items-center gap-1.5 text-xs',
              'px-2 py-1 rounded-md bg-muted/50',
              className
            )}>
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className={getPerformanceColor(hitRate.winRate, 'winRate')}>
                {(hitRate.winRate * 100).toFixed(0)}%
              </span>
              <span className="text-muted-foreground">win</span>
              <span className="mx-0.5 text-muted-foreground/50">•</span>
              <span className={getPerformanceColor(hitRate.avgRMultiple, 'expectancy')}>
                {hitRate.avgRMultiple >= 0 ? '+' : ''}{hitRate.avgRMultiple.toFixed(2)}R
              </span>
              <span className="text-muted-foreground/50">
                ({hitRate.totalSignals})
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2 text-xs">
              <div className="font-medium">{patternName} Historical Performance</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className={cn('ml-1 font-mono', getPerformanceColor(hitRate.winRate, 'winRate'))}>
                    {(hitRate.winRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expectancy:</span>
                  <span className={cn('ml-1 font-mono', getPerformanceColor(hitRate.avgRMultiple, 'expectancy'))}>
                    {hitRate.avgRMultiple.toFixed(2)}R
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sample Size:</span>
                  <span className="ml-1 font-mono">{hitRate.totalSignals}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reliability:</span>
                  <span className="ml-1 font-mono">{hitRate.reliabilityScore}%</span>
                </div>
              </div>
              {hitRate.reliabilityScore < 50 && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Limited sample size</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn('overflow-hidden', className)}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Historical Performance
                {hitRate.reliabilityScore >= 70 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Reliable
                  </Badge>
                )}
              </CardTitle>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CardContent className="pt-0">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 py-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
              <div className={cn(
                'text-lg font-bold font-mono',
                getPerformanceColor(hitRate.winRate, 'winRate')
              )}>
                {(hitRate.winRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Avg R</div>
              <div className={cn(
                'text-lg font-bold font-mono',
                getPerformanceColor(hitRate.avgRMultiple, 'expectancy')
              )}>
                {hitRate.avgRMultiple >= 0 ? '+' : ''}{hitRate.avgRMultiple.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Profit Factor</div>
              <div className="text-lg font-bold font-mono">
                {hitRate.profitFactor.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Trades</div>
              <div className="text-lg font-bold font-mono">
                {hitRate.totalSignals}
              </div>
            </div>
          </div>
          
          {/* Win/Loss Bar */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-green-500">{hitRate.wins} wins</span>
              <span className="text-red-500">{hitRate.losses} losses</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-red-500/30 flex">
              <div 
                className="bg-green-500 h-full transition-all"
                style={{ width: `${hitRate.winRate * 100}%` }}
              />
            </div>
          </div>
          
          <CollapsibleContent className="space-y-3">
            {/* Reliability Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Statistical Reliability</span>
                </div>
                <span className="font-mono">{hitRate.reliabilityScore}%</span>
              </div>
              <Progress value={hitRate.reliabilityScore} className="h-1.5" />
              {hitRate.reliabilityScore < 50 && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  More data needed for reliable statistics
                </p>
              )}
            </div>
            
            {/* Regime Breakdown */}
            {hitRate.regimeBreakdown && hitRate.regimeBreakdown.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground font-medium">
                  Performance by Market Regime
                </div>
                <div className="space-y-1.5">
                  {hitRate.regimeBreakdown.map((regime, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        {regime.regimeKey.includes('UP') ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : regime.regimeKey.includes('DOWN') ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : (
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>{regime.regimeKey.replace('_', ' ')}</span>
                        <span className="text-muted-foreground">({regime.n})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={getPerformanceColor(regime.winRate, 'winRate')}>
                          {(regime.winRate * 100).toFixed(0)}%
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs px-1.5 py-0',
                            regime.recommendation === 'trade' && 'border-green-500/50 text-green-500',
                            regime.recommendation === 'caution' && 'border-yellow-500/50 text-yellow-500',
                            regime.recommendation === 'avoid' && 'border-red-500/50 text-red-500'
                          )}
                        >
                          {regime.recommendation}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Avg Hold:</span>
                <span className="font-mono">{hitRate.avgHoldingBars} bars</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Expectancy:</span>
                <span className={cn('font-mono', getPerformanceColor(hitRate.expectancy, 'expectancy'))}>
                  {hitRate.expectancy >= 0 ? '+' : ''}{hitRate.expectancy.toFixed(3)}R
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              Last updated: {new Date(hitRate.lastUpdated).toLocaleDateString()}
            </p>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

/**
 * Inline hit rate indicator for thumbnails
 */
interface InlineHitRateProps {
  winRate: number;
  expectancy: number;
  sampleSize: number;
  className?: string;
}

export function InlineHitRate({ winRate, expectancy, sampleSize, className }: InlineHitRateProps) {
  const getColor = (value: number, threshold: number) => {
    if (value >= threshold * 1.2) return 'text-green-500';
    if (value >= threshold) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className={cn('flex items-center gap-1 text-xs', className)}>
      <span className={getColor(winRate, 0.5)}>
        {(winRate * 100).toFixed(0)}%
      </span>
      <span className="text-muted-foreground">|</span>
      <span className={getColor(expectancy, 0.2)}>
        {expectancy >= 0 ? '+' : ''}{expectancy.toFixed(2)}R
      </span>
      {sampleSize < 30 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Limited sample size ({sampleSize} trades)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
