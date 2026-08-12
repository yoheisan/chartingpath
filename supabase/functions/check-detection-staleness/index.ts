/**
 * check-detection-staleness
 *
 * Silent failure of a whole asset class must be visible. FX produced no new
 * detections between 2026-07-31 and 2026-08-12 and nothing noticed, because the
 * only symptom was an absence.
 *
 * Per asset_type this compares the newest ACTIVE detection against now and writes
 * a row to `asset_class_health` with status ok | warn | dead. Run daily via cron.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASSET_TYPES = ['fx', 'crypto', 'stocks', 'commodities', 'indices', 'etfs'];

// Threshold per asset class, matched to its scan cadence. Intraday-scanned classes
// should produce something within a day; if they do not, the pipeline is broken.
const THRESHOLD_HOURS: Record<string, number> = {
  fx: 24,
  crypto: 24,
  stocks: 48,      // weekends + holidays
  commodities: 48,
  indices: 48,
  etfs: 48,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const rows: any[] = [];
  const alarms: string[] = [];

  for (const assetType of ASSET_TYPES) {
    const thresholdHours = THRESHOLD_HOURS[assetType] ?? 24;

    const { count } = await supabase
      .from('live_pattern_detections')
      .select('id', { count: 'exact', head: true })
      .eq('asset_type', assetType)
      .eq('status', 'active');

    const { data: newest } = await supabase
      .from('live_pattern_detections')
      .select('first_detected_at')
      .eq('asset_type', assetType)
      .eq('status', 'active')
      .order('first_detected_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newestAt = newest?.first_detected_at ? new Date(newest.first_detected_at) : null;
    const hoursSince = newestAt ? (Date.now() - newestAt.getTime()) / 3_600_000 : null;

    let status = 'ok';
    let detail = `${count ?? 0} active detections, newest ${newestAt?.toISOString() ?? 'none'}`;

    if (!newestAt || (count ?? 0) === 0) {
      status = 'dead';
      detail = `NO ACTIVE DETECTIONS for ${assetType}. Asset class is dark — check the price refresher and the scanner for this class.`;
    } else if (hoursSince! > thresholdHours) {
      status = 'warn';
      detail = `${assetType} has produced no new detection for ${hoursSince!.toFixed(1)}h (threshold ${thresholdHours}h).`;
    }

    if (status !== 'ok') {
      alarms.push(`[${status.toUpperCase()}] ${detail}`);
      console.error(`[check-detection-staleness] ${status.toUpperCase()}: ${detail}`);
    } else {
      console.log(`[check-detection-staleness] ok: ${assetType} — ${detail}`);
    }

    rows.push({
      asset_type: assetType,
      active_detection_count: count ?? 0,
      newest_detection_at: newestAt?.toISOString() ?? null,
      hours_since_newest: hoursSince === null ? null : Number(hoursSince.toFixed(2)),
      threshold_hours: thresholdHours,
      status,
      detail,
    });
  }

  const { error: insertErr } = await supabase.from('asset_class_health').insert(rows);
  if (insertErr) console.error('[check-detection-staleness] Failed to persist health rows:', insertErr.message);

  return new Response(JSON.stringify({ success: true, checked: rows.length, alarms, rows }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
