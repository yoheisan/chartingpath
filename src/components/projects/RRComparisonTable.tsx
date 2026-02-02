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
import { Target, TrendingUp, Clock, Zap } from 'lucide-react';
import { RR_TIERS, formatRR, type RRTier } from '@/utils/rrCalculator';

export interface RRTierStats {
  rrTier: RRTier;
  winRate: number;
  avgHoldBars: number;
  expectancy: number;
  sampleSize: number;
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
  const optimalTier = stats.reduce((best, current) => 
    current.expectancy > best.expectancy ? current : best
  );

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
                  <div className="flex items-center justify-end gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Expectancy
                  </div>
                </TableHead>
                <TableHead className="text-right">Sample</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((tier) => {
                const isOptimal = tier.rrTier === optimalTier.rrTier;
                return (
                  <TableRow 
                    key={tier.rrTier}
                    className={isOptimal ? 'bg-primary/5 border-primary/20' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatRR(tier.rrTier)}</span>
                        {isOptimal && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            Optimal
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(tier.winRate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {tier.avgHoldBars.toFixed(0)} bars
                    </TableCell>
                    <TableCell className={`text-right font-semibold font-mono ${
                      tier.expectancy >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatExpectancy(tier.expectancy)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tier.sampleSize}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Insight callout */}
        {optimalTier.expectancy > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold text-primary">{formatRR(optimalTier.rrTier)}</span>
              {' '}shows the highest expectancy at{' '}
              <span className="font-semibold">{formatExpectancy(optimalTier.expectancy)}</span>
              {' '}with a{' '}
              <span className="font-semibold">{formatPercent(optimalTier.winRate)}</span>
              {' '}win rate over {optimalTier.sampleSize} trades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RRComparisonTable;
