import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Info, X, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReseedProgress {
  isReseeding: boolean;
  currentBatch: string | null;
  patternsAffected: string[];
  estimatedCompletion: string | null;
  completedBatches: string[];
  totalBatches: number;
}

interface PlatformVersion {
  version: number;
  label: string;
  description: string | null;
  changes_summary: string[] | null;
  is_active: boolean;
  activated_at: string | null;
}

const BATCH_LABELS = [
  'Symmetrical Triangle + Donchian',
  'Bull/Bear Flag + Cup/Handle + Wedges',
  'Triple Top/Bottom',
  'Forex bracket recalculation',
  'Stocks/Indices ATR fix',
  'Score recalculation',
  '4H/8H verification',
  'Final validation',
];

/** Banner auto-hides 7 days after v2.0 activation */
const BANNER_EXPIRY_DAYS = 7;

export function DataQualityBanner() {
  const [progress, setProgress] = useState<ReseedProgress | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [version, setVersion] = useState<PlatformVersion | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetchVersionAndProgress();

    const sub = supabase
      .channel('reseed-progress')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reseed_audit_log',
      }, () => fetchVersionAndProgress())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchVersionAndProgress = async () => {
    const [versionsRes, auditRes] = await Promise.all([
      supabase
        .from('platform_data_version')
        .select('*')
        .order('version', { ascending: false })
        .limit(2),
      supabase
        .from('reseed_audit_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20),
    ]);

    const versions = versionsRes.data;
    const auditLogs = auditRes.data;

    if (!versions?.length || !auditLogs) return;

    const activeVersion = versions.find((v: any) => v.is_active);
    setVersion(activeVersion ?? null);

    // Check if v2.0 is active and all batches are done — completion state
    const v2Active = activeVersion?.version === 2;
    const hasFinalEntry = auditLogs.some((l: any) =>
      l.reseed_batch?.includes('FINAL') && l.status === 'completed'
    );

    if (v2Active && hasFinalEntry) {
      // Check if banner has expired (7 days after activation)
      const activatedAt = activeVersion?.activated_at;
      if (activatedAt) {
        const expiryDate = new Date(activatedAt);
        expiryDate.setDate(expiryDate.getDate() + BANNER_EXPIRY_DAYS);
        if (new Date() > expiryDate) {
          setIsExpired(true);
          return;
        }
      }

      setIsComplete(true);
      const completedBatches = auditLogs
        .filter((l: any) => l.status === 'completed')
        .map((l: any) => l.reseed_batch);

      setProgress({
        isReseeding: false,
        currentBatch: null,
        patternsAffected: [],
        estimatedCompletion: null,
        completedBatches,
        totalBatches: 8,
      });
      return;
    }

    const runningBatches = auditLogs.filter((l: any) => l.status === 'running');
    const completedBatches = auditLogs.filter((l: any) => l.status === 'completed');
    const isReseeding = runningBatches.length > 0;

    if (isReseeding || (completedBatches.length > 0 && !v2Active)) {
      setProgress({
        isReseeding,
        currentBatch: runningBatches[0]?.reseed_batch ?? null,
        patternsAffected: [...new Set(auditLogs.map((l: any) => l.pattern_id).filter(Boolean))] as string[],
        estimatedCompletion: null,
        completedBatches: completedBatches.map((l: any) => l.reseed_batch),
        totalBatches: 8,
      });
    }
  };

  if (dismissed || isExpired || !progress) return null;

  return (
    <div className="border-b border-border bg-muted/50">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isComplete ? (
                <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              ) : progress.isReseeding ? (
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              ) : (
                <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              )}

              <p className="text-sm text-foreground">
                {isComplete
                  ? "Detection accuracy upgrade complete — pattern detection methodology has been improved across 8 pattern types. Win rates and statistics now reflect more accurate historical analysis."
                  : progress.isReseeding
                    ? `Improving detection accuracy — updating ${progress.currentBatch} data. Win rates may shift slightly as methodology improves.`
                    : `Detection accuracy upgrade complete — ${progress.completedBatches.length} pattern types now use improved methodology.`
                }
              </p>

              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 flex-shrink-0"
              >
                {expanded ? 'Less' : 'What changed?'}
                {expanded
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />
                }
              </button>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {expanded && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm border-t border-border pt-3">
            <div>
              <h4 className="font-medium mb-1.5 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                {isComplete ? 'What improved?' : 'Why are win rates changing?'}
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {isComplete
                  ? "We improved 8 areas of our pattern detection methodology: corrected ATR calculations for stocks, fixed Symmetrical Triangle short breakouts, tightened Cup/Handle retracement limits, improved Triple Top/Bottom pivot detection, widened Forex stop levels, and enhanced quality scoring with multi-timeframe confirmation and symmetry analysis. All historical data has been recalculated to reflect these improvements."
                  : "We identified 8 areas where our pattern detection methodology could be more accurate. The improvements fix issues like incorrect ATR calculations for stocks, missed Symmetrical Triangle short breakouts, and overly tight stop levels on Forex. The historical data is being recalculated to reflect these improvements — this is the data becoming more accurate, not less reliable."
                }
              </p>
              {!isComplete && progress.currentBatch?.includes('Triple') && (
                <p className="text-muted-foreground text-xs leading-relaxed mt-2 border-t border-border pt-2">
                  <strong>Triple Top/Bottom:</strong> These patterns are being recalculated with a stricter detection filter. You may see fewer Triple Top/Bottom signals going forward — this is intentional. The remaining signals are higher quality.
                </p>
              )}
              {!isComplete && progress.currentBatch?.includes('Forex') && (
                <p className="text-muted-foreground text-xs leading-relaxed mt-2 border-t border-border pt-2">
                  <strong>Forex Brackets:</strong> Forex pattern stop levels are being recalculated with more appropriate minimum distances. This may cause Forex win rates to increase slightly — the previous data slightly underestimated performance due to stops that were too tight for normal market conditions.
                </p>
              )}
              {!isComplete && progress.currentBatch?.includes('Stocks') && (
                <p className="text-muted-foreground text-xs leading-relaxed mt-2 border-t border-border pt-2">
                  <strong>Stocks/Indices/Commodities ATR:</strong> Pattern statistics are being recalculated with a more accurate volatility measurement. The previous calculation didn't account for overnight gaps — this fix gives a more realistic picture of pattern performance for these asset classes.
                </p>
              )}
              {!isComplete && progress.currentBatch?.includes('Score') && (
                <p className="text-muted-foreground text-xs leading-relaxed mt-2 border-t border-border pt-2">
                  <strong>Score Recalculation:</strong> Pattern quality grades are being recalculated with improved scoring factors including multi-timeframe confirmation, more accurate volume handling for Forex, and better symmetry assessment. Some patterns may shift by one grade in either direction.
                </p>
              )}
              {!isComplete && progress.currentBatch?.includes('4H/8H') && (
                <p className="text-muted-foreground text-xs leading-relaxed mt-2 border-t border-border pt-2">
                  <strong>4H/8H OHLC Reseed:</strong> 4H and 8H pattern data is being fully recalculated following the detection of an OHLC data accuracy issue. This process takes several hours. 1H and 1D data is completely unaffected.
                </p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-1.5">
                {isComplete
                  ? `All ${progress.totalBatches} batches complete ✓`
                  : `Progress (${progress.completedBatches.length}/${progress.totalBatches} batches)`
                }
              </h4>
              <div className="space-y-1">
                {BATCH_LABELS.map((batch, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      'h-1.5 w-1.5 rounded-full flex-shrink-0',
                      isComplete || progress.completedBatches.some(b => b.includes(batch.split(' ')[0]))
                        ? 'bg-emerald-400'
                        : progress.currentBatch?.includes(batch.split(' ')[0])
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-muted-foreground/30'
                    )} />
                    <span className={cn(
                      'text-muted-foreground',
                      isComplete && 'line-through opacity-70'
                    )}>{batch}</span>
                  </div>
                ))}
              </div>
              {isComplete && version?.activated_at && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  v2.0 activated {new Date(version.activated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
