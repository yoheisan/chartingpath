import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Zap, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface DetectionRow {
  id: string;
  instrument: string;
  pattern_name: string | null;
  timeframe: string | null;
  direction: string | null;
  entry_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  total_trades: number | null;
  win_rate_pct: number | null;
  expectancy_r: number | null;
  expectancy_r_net: number | null;
  cell_status: string | null;
  qualifies: boolean | null;
  edge_points: number | null;
  baseline_win_rate_pct: number | null;
  is_validated: boolean | null;
}

const MIN_SAMPLE = 100;

function fmtPrice(v: number | null): string {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1) return v.toFixed(2);
  if (a >= 0.01) return v.toFixed(4);
  return v.toFixed(6);
}

export function FiringNowSection() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DetectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  // `failed` covers both a query error and a zero-row response. A zero-row
  // response is never a legitimate product state here — the detections table is
  // continuously populated — so rendering "0 patterns are firing" off the back
  // of it would publish a false claim about our own data.
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('v_live_detections_with_edge')
        .select('id,instrument,pattern_name,timeframe,direction,entry_price,stop_loss_price,take_profit_price,total_trades,win_rate_pct,expectancy_r,expectancy_r_net,cell_status,qualifies,edge_points,baseline_win_rate_pct,is_validated')
        .limit(1000);
      if (cancelled) return;
      if (error) {
        console.error('[FiringNowSection] failed to load v_live_detections_with_edge', error);
        trackEvent('firing_now.load_failed', { reason: 'query_error', message: error.message, code: (error as any).code ?? null });
        setFailed(true);
      } else if (!data || data.length === 0) {
        console.error('[FiringNowSection] v_live_detections_with_edge returned zero rows');
        trackEvent('firing_now.load_failed', { reason: 'empty_result' });
        setFailed(true);
      } else {
        setRows(data as DetectionRow[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const { qualifying, suppressed, instrumentCount } = useMemo(() => {
    const q = rows.filter(r => r.qualifies);
    // Sorted by sample size descending, deliberately NOT by expectancy.
    // Train/test correlation on cell expectancy is 0.181, so ordering by
    // expectancy would imply a precision the data does not support. Sample
    // size is the only ordering we can defend.
    q.sort((a, b) => (b.total_trades ?? 0) - (a.total_trades ?? 0));
    return {
      qualifying: q,
      suppressed: rows.filter(r => !r.qualifies),
      instrumentCount: new Set(rows.map(r => r.instrument)).size,
    };
  }, [rows]);

  useEffect(() => {
    if (loading || failed || tracked.current) return;
    tracked.current = true;
    trackEvent('firing_now.view', {
      active: rows.length,
      qualifying: qualifying.length,
      suppressed: suppressed.length,
    });
  }, [loading, failed, rows.length, qualifying.length, suppressed.length]);

  const suppressionReason = (r: DetectionRow): string => {
    if (r.cell_status && r.cell_status !== 'active') {
      return t('firingNow.reasonSuspended', 'Suspended — edge stopped holding forward');
    }
    if ((r.total_trades ?? 0) < MIN_SAMPLE) {
      return t('firingNow.reasonSample', 'Insufficient sample (n={{n}})', { n: r.total_trades ?? 0 });
    }
    if ((r.edge_points ?? 0) <= 0) {
      // The random-walk null comes first: at this R:R a coin flip would do as well.
      return t('firingNow.reasonChance', 'No edge versus chance ({{pts}} pts)', {
        pts: (r.edge_points ?? 0).toFixed(2),
      });
    }
    if ((r.expectancy_r ?? 0) <= 0) {
      return t('firingNow.reasonNegative', 'Negative expectancy');
    }
    if ((r.expectancy_r_net ?? 0) <= 0) {
      return t('firingNow.reasonNegativeNet', 'Negative after costs');
    }
    if (!r.is_validated) {
      return t('firingNow.reasonNotValidated', 'Not yet validated out of sample');
    }
    return t('firingNow.reasonOther', 'No measured edge');
  };

  if (loading) {
    return (
      <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-border/20">
        <div className="container mx-auto space-y-4">
          <Skeleton className="h-8 w-2/3 max-w-xl" />
          <Skeleton className="h-40 w-full" />
        </div>
      </section>
    );
  }

  // Query failed or came back empty — render nothing rather than a false claim.
  if (failed || rows.length === 0) return null;

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-border/20">
      <div className="container mx-auto">
        <Badge variant="secondary" className="mb-4 gap-1.5">
          <Zap className="h-3 w-3" />
          {t('firingNow.badge', 'Live right now')}
        </Badge>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 max-w-3xl">
          {t('firingNow.headline', '{{active}} patterns are firing right now. {{qualifying}} have a measured edge after costs.', {
            active: rows.length,
            qualifying: qualifying.length,
          })}
        </h2>
        <p className="text-muted-foreground max-w-2xl mb-8">
          {t('firingNow.subhead', "Here they are — and here's why we're ignoring the other {{suppressed}}. Across {{instruments}} instruments.", {
            suppressed: suppressed.length,
            instruments: instrumentCount,
          })}
        </p>

        {/* Qualifying vs suppressed given equal visual weight — the suppressed
            count is the proof that the filter actually does something. */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8 max-w-2xl">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{qualifying.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('firingNow.qualifyingLabel', 'Qualify after costs')}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
            <div className="text-4xl font-bold text-foreground">{suppressed.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('firingNow.suppressedLabel', 'Suppressed — no measured edge')}
            </div>
          </div>
        </div>

        {qualifying.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/50 p-8 text-center mb-8">
            <p className="text-lg font-semibold text-foreground">
              {t('firingNow.emptyTitle', 'Nothing meets our bar right now.')}
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              {t('firingNow.emptyBody', 'Every live detection failed either the sample-size floor or the after-cost expectancy test. We would rather show you nothing than show you a setup we cannot support.')}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('firingNow.colInstrument', 'Instrument')}</TableHead>
                  <TableHead>{t('firingNow.colPattern', 'Pattern')}</TableHead>
                  <TableHead>{t('firingNow.colTimeframe', 'TF')}</TableHead>
                  <TableHead className="text-right">{t('firingNow.colEntry', 'Entry')}</TableHead>
                  <TableHead className="text-right">{t('firingNow.colStop', 'Stop')}</TableHead>
                  <TableHead className="text-right">{t('firingNow.colTarget', 'Target')}</TableHead>
                  <TableHead className="text-right">{t('firingNow.colWinRate', 'Win rate')}</TableHead>
                  <TableHead className="text-right">{t('firingNow.colSample', 'n')}</TableHead>
                  <TableHead className="text-right">{t('firingNow.colNet', 'Net expectancy')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualifying.slice(0, 6).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.instrument}</TableCell>
                    <TableCell className="text-muted-foreground">{r.pattern_name ?? '—'}</TableCell>
                    <TableCell className="uppercase text-muted-foreground">{r.timeframe ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPrice(r.entry_price)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPrice(r.stop_loss_price)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPrice(r.take_profit_price)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.win_rate_pct != null ? `${Number(r.win_rate_pct).toFixed(0)}%` : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.total_trades ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {r.expectancy_r_net != null ? `${Number(r.expectancy_r_net).toFixed(2)}R` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Honest counterpart to the winners list */}
        {suppressed.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card/40 mb-8">
            <button
              type="button"
              onClick={() => {
                const next = !expanded;
                setExpanded(next);
                if (next) trackEvent('firing_now.suppressed_expand', { suppressed: suppressed.length });
              }}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
              aria-expanded={expanded}
            >
              <span className="text-sm font-medium text-foreground">
                {t('firingNow.suppressedToggle', '{{count}} detections suppressed — no measured edge after costs', { count: suppressed.length })}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
              <div className="border-t border-border/60 divide-y divide-border/40">
                {suppressed.slice(0, 12).map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="font-medium text-foreground">
                      {r.instrument} <span className="text-muted-foreground font-normal">· {r.pattern_name ?? '—'} · {(r.timeframe ?? '').toUpperCase()}</span>
                    </span>
                    <span className="text-muted-foreground">{suppressionReason(r)}</span>
                  </div>
                ))}
                {suppressed.length > 12 && (
                  <div className="px-4 py-2.5 text-xs text-muted-foreground">
                    {t('firingNow.suppressedMore', 'Showing 12 of {{count}}.', { count: suppressed.length })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Button asChild size="lg" className="px-8">
          <Link
            to="/auth?mode=signup&source=firing_now"
            onClick={() => trackEvent('firing_now.cta_click', { source: 'firing_now' })}
          >
            {t('firingNow.cta', 'Get alerted when these fire')}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export default FiringNowSection;
