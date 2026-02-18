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
import { Target, TrendingUp, Clock, Zap, Info, Star, Activity, BarChart2 } from 'lucide-react';

export interface ExitStrategyStats {
  strategyId: string;
  strategyName: string;
  description: string;
  winRate: number;
  avgHoldBars: number;
  expectancy: number;
  maxDrawdown: number;
  sampleSize: number;
  avgWinR: number;
  avgLossR: number;
}

interface ExitComparisonTableProps {
  stats: ExitStrategyStats[];
  title?: string;
  description?: string;
}

/**
 * Displays exit strategy comparison metrics from backtest simulations.
 * Highlights the optimal strategy based on expectancy.
 */
export const ExitComparisonTable = ({ 
  stats, 
  title = "Exit Strategy Comparison",
  description = "Performance metrics across different exit methods based on historical simulations"
}: ExitComparisonTableProps) => {
  if (!stats || stats.length === 0) return null;

  // Find the strategy with highest expectancy
  const optimalIdx = stats.reduce((bestIdx, current, idx, arr) => 
    current.expectancy > arr[bestIdx].expectancy ? idx : bestIdx, 0
  );
  const optimalStrategy = stats[optimalIdx];

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatExpectancy = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`;

  // Strategy category icons
  const getStrategyIcon = (strategyId: string) => {
    if (strategyId.includes('atr')) return <Activity className="h-4 w-4" />;
    if (strategyId.includes('scale')) return <BarChart2 className="h-4 w-4" />;
    if (strategyId.includes('rsi')) return <TrendingUp className="h-4 w-4" />;
    if (strategyId.includes('fib')) return <Target className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    Exit Strategy
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
                          <p><span className="text-green-500 font-mono">+0.80R</span> = Gain 0.80× risk per trade</p>
                          <p><span className="text-muted-foreground font-mono">0.00R</span> = Break-even</p>
                          <p><span className="text-red-500 font-mono">-0.50R</span> = Lose 0.50× risk per trade</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">Max DD</TableHead>
                <TableHead className="text-right">Sample</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat, idx) => {
                const isOptimal = idx === optimalIdx;
                return (
                  <TableRow 
                    key={stat.strategyId}
                    className={isOptimal ? 'bg-primary/5 border-primary/20' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {getStrategyIcon(stat.strategyId)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{stat.strategyName}</span>
                            {isOptimal && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Optimal
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {stat.description}
                          </span>
                        </div>
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
                    <TableCell className="text-right font-mono text-red-500">
                      -{stat.maxDrawdown.toFixed(1)}%
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
        {optimalStrategy.expectancy > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold text-primary">{optimalStrategy.strategyName}</span>
              {' '}shows the highest expectancy at{' '}
              <span className="font-semibold">{formatExpectancy(optimalStrategy.expectancy)}</span>
              {' '}with a{' '}
              <span className="font-semibold">{formatPercent(optimalStrategy.winRate)}</span>
              {' '}win rate and{' '}
              <span className="font-semibold text-red-500">{optimalStrategy.maxDrawdown.toFixed(1)}%</span>
              {' '}max drawdown over {optimalStrategy.sampleSize} trades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExitComparisonTable;
