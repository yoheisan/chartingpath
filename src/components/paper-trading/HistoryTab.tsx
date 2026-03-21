import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaperTrade } from '@/hooks/usePaperTrading';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

interface HistoryTabProps {
  trades: PaperTrade[];
  onSymbolSelect?: (symbol: string) => void;
}

const ROWS_PER_PAGE = 20;

function getOutcome(trade: PaperTrade): { label: string; icon: string; variant: string } {
  if (trade.override_reason) return { label: 'Override', icon: '⚡', variant: 'amber' };
  if (trade.close_reason?.includes('Take profit')) return { label: 'TP', icon: '✅', variant: 'green' };
  if (trade.close_reason?.includes('Stop loss')) return { label: 'SL', icon: '❌', variant: 'red' };
  if (trade.close_reason?.includes('Timed out')) return { label: 'Timeout', icon: '⏱️', variant: 'muted' };
  if ((trade.pnl ?? 0) > 0) return { label: 'Win', icon: '✅', variant: 'green' };
  if ((trade.pnl ?? 0) < 0) return { label: 'Loss', icon: '❌', variant: 'red' };
  return { label: 'Closed', icon: '—', variant: 'muted' };
}

function extractPattern(notes: string | null): string {
  const match = notes?.match(/\[pattern:([^\]]+)\]/);
  return match?.[1]?.replace(/_/g, ' ') ?? '—';
}

function extractTimeframe(notes: string | null): string {
  const match = notes?.match(/\[timeframe:([^\]]+)\]/);
  return match?.[1] ?? '';
}

export function HistoryTab({ trades, onSymbolSelect }: HistoryTabProps) {
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = trades;
    if (outcomeFilter === 'win') result = result.filter(t => t.close_reason?.includes('Take profit') || ((t.pnl ?? 0) > 0 && !t.override_reason));
    else if (outcomeFilter === 'loss') result = result.filter(t => t.close_reason?.includes('Stop loss') || ((t.pnl ?? 0) < 0 && !t.override_reason));
    else if (outcomeFilter === 'override') result = result.filter(t => !!t.override_reason);
    else if (outcomeFilter === 'timeout') result = result.filter(t => t.close_reason?.includes('Timed out'));
    return result;
  }, [trades, outcomeFilter]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No closed trades yet</p>
          <p className="text-xs text-muted-foreground mt-1">Trades close automatically when SL or TP is hit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={outcomeFilter} onValueChange={(v) => { setOutcomeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="win">Wins ✅</SelectItem>
            <SelectItem value="loss">Losses ❌</SelectItem>
            <SelectItem value="override">Overrides ⚡</SelectItem>
            <SelectItem value="timeout">Timeouts ⏱️</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs h-9">Date</TableHead>
              <TableHead className="text-xs h-9">Instrument</TableHead>
              <TableHead className="text-xs h-9">Pattern</TableHead>
              <TableHead className="text-xs h-9">Entry → Exit</TableHead>
              <TableHead className="text-xs h-9 text-center">Outcome</TableHead>
              <TableHead className="text-xs h-9 text-right">R Result</TableHead>
              <TableHead className="text-xs h-9 text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(trade => {
              const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
              const outcome = getOutcome(trade);
              const pattern = extractPattern(trade.notes);
              const tf = extractTimeframe(trade.notes);

              const outcomeBadgeClass = outcome.variant === 'green'
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                : outcome.variant === 'red'
                  ? 'bg-red-500/15 text-red-500 border-red-500/30'
                  : outcome.variant === 'amber'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    : 'bg-muted text-muted-foreground border-border';

              return (
                <TableRow key={trade.id} className="group">
                  <TableCell className="text-xs text-muted-foreground py-2">
                    {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSymbolSelect?.(trade.symbol)}
                        className="text-xs font-semibold hover:text-primary transition-colors"
                      >
                        {trade.symbol}
                      </button>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-sm px-1 py-0 h-4',
                          isLong ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'
                        )}
                      >
                        {isLong ? 'L' : 'S'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-2 capitalize">
                    {pattern}{tf ? ` · ${tf.toUpperCase()}` : ''}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums py-2">
                    {trade.entry_price.toFixed(2)} → {trade.exit_price?.toFixed(2) ?? '—'}
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={cn('text-sm px-1.5 py-0 h-5', outcomeBadgeClass)}>
                          {outcome.icon} {outcome.label}
                        </Badge>
                      </TooltipTrigger>
                      {trade.override_reason && (
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          <p className="font-medium">{trade.override_reason}</p>
                          {trade.override_notes && <p className="text-muted-foreground mt-0.5">{trade.override_notes}</p>}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <span className={cn(
                      'text-xs font-bold tabular-nums',
                      (trade.outcome_r ?? 0) > 0 ? 'text-emerald-500' : (trade.outcome_r ?? 0) < 0 ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                      {(trade.outcome_r ?? 0) > 0 ? '+' : ''}{(trade.outcome_r ?? 0).toFixed(1)}R
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <span className={cn(
                      'text-xs font-semibold tabular-nums',
                      (trade.pnl ?? 0) > 0 ? 'text-emerald-500' : (trade.pnl ?? 0) < 0 ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                      {(trade.pnl ?? 0) >= 0 ? '+' : ''}${(trade.pnl ?? 0).toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
