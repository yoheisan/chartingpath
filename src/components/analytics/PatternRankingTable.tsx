/**
 * Pattern Ranking Table Component
 * 
 * Displays patterns ranked by Strength Score with reliability indicators.
 * Research-grade transparency with full component breakdown.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Info,
  TrendingUp,
  Shield,
  Clock,
  Target,
} from 'lucide-react';
import {
  PatternStrengthScore,
  SAMPLE_SIZE_THRESHOLDS,
  getSampleSizeTier,
} from '@/types/RegimeAnalytics';

interface PatternRankingTableProps {
  patterns: PatternStrengthScore[];
  sortBy?: 'score' | 'trades' | 'edge' | 'reliability';
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

import { GRADE_CONFIG, GradeLetter, getGradeConfig } from '@/components/ui/GradeBadge';

// Use unified grade config - map to solid variant for this table's design
const GRADE_COLORS: Record<string, string> = {
  A: GRADE_CONFIG.A.solid,
  B: GRADE_CONFIG.B.solid,
  C: GRADE_CONFIG.C.solid,
  D: GRADE_CONFIG.D.solid,
  F: GRADE_CONFIG.F.solid,
  INSUFFICIENT: 'bg-muted text-muted-foreground',
};

const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Weak',
  F: 'Poor',
  INSUFFICIENT: 'Insufficient Data',
};

export function PatternRankingTable({
  patterns,
  sortBy = 'score',
  sortDirection = 'desc',
  onSort,
  className,
}: PatternRankingTableProps) {
  const sortedPatterns = [...patterns].sort((a, b) => {
    const multiplier = sortDirection === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'score':
        return (a.overallScore - b.overallScore) * multiplier;
      case 'trades':
        return (a.totalTrades - b.totalTrades) * multiplier;
      case 'edge':
        return (a.components.edgeScore - b.components.edgeScore) * multiplier;
      case 'reliability':
        return (a.components.reliabilityScore - b.components.reliabilityScore) * multiplier;
      default:
        return 0;
    }
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortDirection === 'desc' 
      ? <ChevronDown className="h-3 w-3 inline ml-1" />
      : <ChevronUp className="h-3 w-3 inline ml-1" />;
  };

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Research Disclaimer */}
      <div className="px-4 py-2 border-b bg-amber-500/10 dark:bg-amber-900/20">
        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            <strong>Research insight</strong> — Historical analysis only. 
            Not a trading recommendation. Past performance ≠ future results.
          </span>
        </p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Pattern</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort?.('score')}
            >
              Score <SortIcon column="score" />
            </TableHead>
            <TableHead>Grade</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort?.('trades')}
            >
              Trades <SortIcon column="trades" />
            </TableHead>
            <TableHead>Components</TableHead>
            <TableHead>Best Regime</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPatterns.map((pattern, index) => (
            <PatternRow 
              key={pattern.patternId} 
              pattern={pattern} 
              rank={index + 1} 
            />
          ))}
        </TableBody>
      </Table>
      
      {patterns.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No pattern data available. Run backtests to generate analytics.</p>
        </div>
      )}
    </div>
  );
}

function PatternRow({ pattern, rank }: { pattern: PatternStrengthScore; rank: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasWarnings = pattern.warnings.length > 0;
  const sampleTier = getSampleSizeTier(pattern.totalTrades);
  
  return (
    <>
      <TableRow 
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          pattern.grade === 'INSUFFICIENT' && 'opacity-60'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="font-medium text-muted-foreground">
          {rank}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{pattern.patternName}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {pattern.patternId}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg">
              {pattern.overallScore}
            </span>
            <Progress 
              value={pattern.overallScore} 
              className="w-16 h-1.5"
            />
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn('text-xs font-medium', GRADE_COLORS[pattern.grade])}>
            {pattern.grade}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-mono">{pattern.totalTrades}</span>
            <span className={cn(
              'text-sm',
              sampleTier === 'insufficient' && 'text-red-500',
              sampleTier === 'low' && 'text-amber-500',
              sampleTier === 'moderate' && 'text-muted-foreground',
              (sampleTier === 'high' || sampleTier === 'excellent') && 'text-emerald-500',
            )}>
              {sampleTier}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <ComponentBadge 
              icon={TrendingUp} 
              label="Edge" 
              value={pattern.components.edgeScore} 
            />
            <ComponentBadge 
              icon={Shield} 
              label="Rel" 
              value={pattern.components.reliabilityScore} 
            />
            <ComponentBadge 
              icon={Clock} 
              label="Stab" 
              value={pattern.components.stabilityScore} 
            />
            <ComponentBadge 
              icon={Target} 
              label="Risk" 
              value={pattern.components.riskScore} 
            />
          </div>
        </TableCell>
        <TableCell>
          {pattern.optimalRegime ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">
                    {pattern.optimalRegime.regimeKey.replace('_', ' ')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{pattern.optimalRegime.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Score: {pattern.optimalRegime.score}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          {hasWarnings && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <ul className="text-xs space-y-1">
                    {pattern.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </TableCell>
      </TableRow>
      
      {/* Expanded Row */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-4">
            <ExpandedPatternDetails pattern={pattern} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ComponentBadge({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
}) {
  const color = value >= 70 ? 'text-emerald-500' : value >= 40 ? 'text-amber-500' : 'text-red-500';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('flex items-center gap-0.5 text-xs', color)}>
            <Icon className="h-3 w-3" />
            <span className="font-mono">{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {value}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ExpandedPatternDetails({ pattern }: { pattern: PatternStrengthScore }) {
  const { components } = pattern;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Edge Details */}
      <div className="space-y-2">
        <h5 className="font-medium text-sm flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          Edge Analysis
        </h5>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg R-Multiple:</span>
            <span className="font-mono">
              {components.edgeRaw.avgRMultiple >= 0 ? '+' : ''}
              {components.edgeRaw.avgRMultiple.toFixed(2)}R
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win Rate:</span>
            <span className="font-mono">
              {(components.edgeRaw.winRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payoff Ratio:</span>
            <span className="font-mono">
              {components.edgeRaw.payoffRatio.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Reliability Details */}
      <div className="space-y-2">
        <h5 className="font-medium text-sm flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Reliability
        </h5>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sample Size:</span>
            <span className="font-mono">{components.reliabilityRaw.sampleSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Standard Error:</span>
            <span className="font-mono">
              ±{components.reliabilityRaw.standardError.toFixed(3)}R
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">95% CI Width:</span>
            <span className="font-mono">
              {components.reliabilityRaw.ciWidth.toFixed(2)}R
            </span>
          </div>
        </div>
      </div>
      
      {/* Stability Details */}
      <div className="space-y-2">
        <h5 className="font-medium text-sm flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Time Stability
        </h5>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">First Half Avg R:</span>
            <span className="font-mono">
              {components.stabilityRaw.firstHalfAvgR >= 0 ? '+' : ''}
              {components.stabilityRaw.firstHalfAvgR.toFixed(2)}R
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Second Half Avg R:</span>
            <span className="font-mono">
              {components.stabilityRaw.secondHalfAvgR >= 0 ? '+' : ''}
              {components.stabilityRaw.secondHalfAvgR.toFixed(2)}R
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Correlation:</span>
            <span className="font-mono">
              {components.stabilityRaw.timeSplitCorrelation.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Regime Scores */}
      {Object.keys(pattern.regimeScores).length > 0 && (
        <div className="md:col-span-3 space-y-2">
          <h5 className="font-medium text-sm">Performance by Regime</h5>
          <div className="flex flex-wrap gap-2">
            {Object.entries(pattern.regimeScores)
              .sort((a, b) => b[1].score - a[1].score)
              .map(([regime, data]) => (
                <Badge 
                  key={regime}
                  variant={data.isReliable ? 'default' : 'outline'}
                  className={cn(
                    'text-xs',
                    !data.isReliable && 'opacity-50'
                  )}
                >
                  {regime.replace('_', ' ')}: {data.score}
                  {!data.isReliable && ' (low n)'}
                </Badge>
              ))}
          </div>
        </div>
      )}
      
      {/* Warnings */}
      {pattern.warnings.length > 0 && (
        <div className="md:col-span-3 space-y-2">
          <h5 className="font-medium text-sm text-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Warnings
          </h5>
          <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
            {pattern.warnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
