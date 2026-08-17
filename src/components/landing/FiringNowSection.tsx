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
  asset_type: string | null;
  direction: string | null;
  entry_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  first_detected_at: string | null;
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

function fmtAge(ts: string | null): string {
  if (!ts) return '—';
  const mins = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

/**
 * A cell = pattern / timeframe / asset class / direction. Every edge figure we
 * publish is measured at this level, never per instrument, so the display
 * groups by cell and shows the evidence once in the group header. Listing
 * identical win rate / n / edge on each instrument row would read as an
 * instrument-level claim we have not measured and would not stand behind.
 */
interface CellGroup {
  key: string;
  patternName: string;
  timeframe: string;
  assetType: string;
  direction: string;
  totalTrades: number | null;
  winRate: number | null;
  expectancyRNet: number | null;
  edgePoints: number | null;
  rows: DetectionRow[];
}

const ASSET_LABEL: Record<string, string> = {
  fx: 'FX', stocks: 'Stocks', crypto: 'Crypto',
  commodities: 'Commodities', indices: 'Indices', etfs: 'ETFs',
};

function groupByCell(rows: DetectionRow[]): CellGroup[] {
  const map = new Map<string, CellGroup>();
  for (const r of rows) {
    const key = [r.pattern_name ?? '—', r.timeframe ?? '—', r.asset_type ?? '—', r.direction ?? '—'].join('|');
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        patternName: r.pattern_name ?? '—',
        timeframe: (r.timeframe ?? '').toLowerCase(),
        assetType: r.asset_type ?? '',
        direction: r.direction ?? '',
        totalTrades: r.total_trades,
        winRate: r.win_rate_pct != null ? Number(r.win_rate_pct) : null,
        expectancyRNet: r.expectancy_r_net != null ? Number(r.expectancy_r_net) : null,
        edgePoints: r.edge_points != null ? Number(r.edge_points) : null,
        rows: [],
      };
      map.set(key, g);
    }
    g.rows.push(r);
  }
  // Ranked by net expectancy after costs — what the cell actually pays. Edge
  // points stay visible as evidence, but ranking by them promotes cells that
  // beat chance while earning almost nothing. Sample size breaks ties.
  return [...map.values()].sort((a, b) => {
    const d = (b.expectancyRNet ?? -999) - (a.expectancyRNet ?? -999);
    return d !== 0 ? d : (b.totalTrades ?? 0) - (a.totalTrades ?? 0);
  });
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
        .select('id,instrument,pattern_name,timeframe,asset_type,direction,entry_price,stop_loss_price,take_profit_price,first_detected_at,total_trades,win_rate_pct,expectancy_r,expectancy_r_net,cell_status,qualifies,edge_points,baseline_win_rate_pct,is_validated')
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

  const { qualifyingGroups, qualifyingCount, suppressed, instrumentCount } = useMemo(() => {
    const q = rows.filter(r => r.qualifies);
    return {
      qualifyingGroups: groupByCell(q),
      qualifyingCount: q.length,
      suppressed: rows.filter(r => !r.qualifies),
      instrumentCount: new Set(rows.map(r => r.instrument)).size,
    };
  }, [rows]);

  useEffect(() => {
    if (loading || failed || tracked.current) return;
    tracked.current = true;
    trackEvent('firing_now.view', {
      active: rows.length,
      qualifying: qualifyingCount,
      suppressed: suppressed.length,
      cells: qualifyingGroups.length,
    });
  }, [loading, failed, rows.length, qualifyingCount, suppressed.length, qualifyingGroups.length]);

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
            qualifying: qualifyingCount,
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
            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{qualifyingCount}</div>
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

        {qualifyingGroups.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/50 p-8 text-center mb-8">
            <p className="text-lg font-semibold text-foreground">
              {t('firingNow.emptyTitle', 'Nothing meets our bar right now.')}
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              {t('firingNow.emptyBody', 'Every live detection failed either the sample-size floor or the after-cost expectancy test. We would rather show you nothing than show you a setup we cannot support.')}
            </p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {qualifyingGroups.slice(0, 4).map((g) => (
              <div key={g.key} className="rounded-xl border border-border/60 overflow-hidden">
                {/* The group header IS the evidence. Nothing below repeats it. */}
                <div className="bg-muted/40 px-4 py-3 border-b border-border/60">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-semibold text-foreground">
                      {g.patternName} · {g.timeframe} · {ASSET_LABEL[g.assetType] ?? g.assetType} · {g.direction === 'long'
                        ? t('screener.long', 'Long')
                        : t('screener.short', 'Short')}
                    </span>
                    {(() => {
                      const band = expectancyBand(g.expectancyRNet);
                      return band ? (
                        <Badge variant="outline" className={`text-xs ${EXPECTANCY_BAND_CLASS[band]}`}>
                          {t(`cellEvidence.band.${band}`, EXPECTANCY_BAND_LABEL[band])}
                        </Badge>
                      ) : null;
                    })()}
                    <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      {t('firingNow.cellEdge', 'edge {{pts}} pts vs chance', { pts: (g.edgePoints ?? 0).toFixed(2) })}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {t('firingNow.cellSample', 'n={{n}}', { n: (g.totalTrades ?? 0).toLocaleString() })}
                      {' · '}
                      {t('firingNow.cellWinRate', 'win rate {{wr}}%', { wr: (g.winRate ?? 0).toFixed(0) })}
                      {' · '}
                      {t('firingNow.cellExpectancy', 'net expectancy {{r}}R after costs', {
                        r: ((g.expectancyRNet ?? 0) >= 0 ? '+' : '') + (g.expectancyRNet ?? 0).toFixed(2),
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {t('firingNow.cellAttribution', 'These figures describe the pattern/timeframe/asset combination, not the individual instrument.')}
                  </p>
                </div>

                {/* Instrument rows carry instrument-specific fields only. */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('firingNow.colInstrument', 'Instrument')}</TableHead>
                        <TableHead className="text-right">{t('firingNow.colEntry', 'Entry')}</TableHead>
                        <TableHead className="text-right">{t('firingNow.colStop', 'Stop')}</TableHead>
                        <TableHead className="text-right">{t('firingNow.colTarget', 'Target')}</TableHead>
                        <TableHead className="text-right">{t('firingNow.colAge', 'Age')}</TableHead>
                        <TableHead className="text-right">{t('firingNow.colGate', 'Gate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.rows.slice(0, 8).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.instrument}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtPrice(r.entry_price)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtPrice(r.stop_loss_price)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtPrice(r.take_profit_price)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{fmtAge(r.first_detected_at)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                              {t('firingNow.gatePassed', 'Passed')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {g.rows.length > 8 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border/40">
                      {t('firingNow.moreInstruments', 'Showing 8 of {{count}} instruments in this combination.', { count: g.rows.length })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {qualifyingGroups.length > 4 && (
              <p className="text-xs text-muted-foreground">
                {t('firingNow.moreCells', 'Showing 4 of {{count}} qualifying combinations.', { count: qualifyingGroups.length })}
              </p>
            )}
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
