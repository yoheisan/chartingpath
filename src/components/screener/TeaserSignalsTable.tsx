/**
 * Lightweight signals table used by the homepage teaser.
 * Extracted as a standalone component to prevent regressions
 * when the full screener table is modified independently.
 */
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { cn } from '@/lib/utils';
import type { LiveSetup } from '@/types/screener';

interface TeaserSignalsTableProps {
  patterns: LiveSetup[];
}

export function TeaserSignalsTable({ patterns }: TeaserSignalsTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="whitespace-nowrap">Symbol</TableHead>
          <TableHead className="whitespace-nowrap">Pattern</TableHead>
          <TableHead className="text-center whitespace-nowrap">Grade</TableHead>
          <TableHead className="whitespace-nowrap">Signal</TableHead>
          <TableHead className="text-right whitespace-nowrap">Win Rate</TableHead>
          <TableHead className="text-right whitespace-nowrap">Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patterns.map((setup, idx) => {
          const isLong = setup.direction === 'long';
          const signalAge = formatSignalAgeSimple(setup.signalTs);
          const winRate = setup.historicalPerformance?.winRate;

          return (
            <TableRow
              key={`${setup.instrument}-${setup.patternId}-${idx}`}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/patterns/live?highlight=${encodeURIComponent(setup.instrument)}`)}
            >
              <TableCell>
                <InstrumentLogo instrument={setup.instrument} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {setup.patternName}
              </TableCell>
              <TableCell className="text-center">
                <GradeBadge quality={setup.quality} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={isLong ? 'default' : 'destructive'}
                  className={cn(
                    'text-xs',
                    isLong
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30'
                  )}
                >
                  {isLong ? (
                    <><TrendingUp className="h-3 w-3 mr-1" /> Long</>
                  ) : (
                    <><TrendingDown className="h-3 w-3 mr-1" /> Short</>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {winRate != null ? (
                  <span className={cn(
                    'font-mono font-medium',
                    winRate >= 50 ? 'text-green-500' : winRate >= 40 ? 'text-yellow-500' : 'text-muted-foreground'
                  )}>
                    {winRate.toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {signalAge}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
