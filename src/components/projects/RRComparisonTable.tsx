import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Target, TrendingUp, Clock, Zap, Info } from 'lucide-react';
import { RR_TIERS, formatRR, type RRTier } from '@/utils/rrCalculator';

export interface RRTierStats {
  /** Numeric tier (2, 3, 4, 5) - preferred format */
  rrTier?: RRTier;
  /** String tier format from backend ('1:2', '1:3', etc.) */
  tier?: string;
  winRate: number;
  avgHoldBars: number;
  expectancy: number;
  sampleSize: number;
}

/** Extract numeric R:R tier from either format */
function extractRRTier(stat: RRTierStats): number {
  if (stat.rrTier !== undefined) return stat.rrTier;
  if (stat.tier) {
    // Parse '1:3' -> 3
    const parts = stat.tier.split(':');
    if (parts.length === 2) {
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return 2; // fallback
}

interface RRComparisonTableProps {
  stats: RRTierStats[];
  title?: string;
  description?: string;
}

/**
 * Displays R:R tier comparison metrics from actual backtest simulations.
 * Highlights the optimal tier based on expectancy.
 */
export const RRComparisonTable = ({ 
  stats, 
  title = "R:R Scenario Comparison",
  description = "Performance metrics across different Risk:Reward targets based on historical simulations"
}: RRComparisonTableProps) => {
  if (!stats || stats.length === 0) return null;

  // Find the tier with highest expectancy
  const optimalTierIndex = stats.reduce((bestIdx, current, idx, arr) => 
    current.expectancy > arr[bestIdx].expectancy ? idx : bestIdx, 0
  );
  const optimalRRValue = extractRRTier(stats[optimalTierIndex]);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatExpectancy = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    R:R Tier
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Win Rate
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Avg Hold
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end gap-1.5 cursor-help">
                          <Zap className="h-3.5 w-3.5" />
                          Expectancy
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-left">
                        <p className="font-semibold mb-1">Expectancy (R-multiple)</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Average profit/loss per trade measured in risk units (R).
                        </p>
                        <div className="text-xs space-y-1">
                          <p><span className="text-green-500 font-mono">+0.50R</span> = Gain 0.50× risk per trade</p>
                          <p><span className="text-muted-foreground font-mono">0.00R</span> = Break-even</p>
                          <p><span className="text-red-500 font-mono">-0.76R</span> = Lose 0.76× risk per trade</p>
                        </div>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Formula: (Win% × R:R) - (Loss% × 1)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">Sample</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat, idx) => {
                const rrValue = extractRRTier(stat);
                const isOptimal = rrValue === optimalRRValue;
                return (
                  <TableRow 
                    key={stat.tier || stat.rrTier || idx}
                    className={isOptimal ? 'bg-primary/5 border-primary/20' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatRR(rrValue)}</span>
                        {isOptimal && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            Optimal
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(stat.winRate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {stat.avgHoldBars.toFixed(0)} bars
                    </TableCell>
                    <TableCell className={`text-right font-semibold font-mono ${
                      stat.expectancy >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatExpectancy(stat.expectancy)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {stat.sampleSize}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Insight callout */}
        {stats[optimalTierIndex].expectancy > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold text-primary">{formatRR(optimalRRValue)}</span>
              {' '}shows the highest expectancy at{' '}
              <span className="font-semibold">{formatExpectancy(stats[optimalTierIndex].expectancy)}</span>
              {' '}with a{' '}
              <span className="font-semibold">{formatPercent(stats[optimalTierIndex].winRate)}</span>
              {' '}win rate over {stats[optimalTierIndex].sampleSize} trades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RRComparisonTable;
