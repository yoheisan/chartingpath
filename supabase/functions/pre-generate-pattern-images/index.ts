import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// SVG→PNG using svg2png-wasm (resvg-based, Deno-compatible)
import { svg2png, initialize } from "https://esm.sh/svg2png-wasm@0.6.1";

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmUrl = "https://unpkg.com/svg2png-wasm@0.6.1/svg2png_wasm_bg.wasm";
  const resp = await fetch(wasmUrl);
  if (!resp.ok) throw new Error(`Failed to fetch WASM: ${resp.status}`);
  await initialize(await resp.arrayBuffer());
  wasmInitialized = true;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IMAGES_PER_RUN = 5;
const ALLOWED_GRADES = ['A', 'B'];

// ─── Types ──────────────────────────────────────────────────────────────────

interface Bar {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Pivot {
  index: number;
  price: number;
  type: 'high' | 'low';
}

// ─── SVG Rendering (same as generate-share-image) ───────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toPrecision(5);
  return price.toPrecision(4);
}

function renderCandlestickSVG(opts: {
  bars: Bar[];
  entry: number;
  sl: number;
  tp: number;
  direction: string;
  patternName: string;
  instrument: string;
  timeframe: string;
  grade: string;
  rr: string;
  pivots?: Pivot[];
}): string {
  const { bars, entry, sl, tp, direction, patternName, instrument, timeframe, grade, rr, pivots } = opts;

  const W = 1200;
  const H = 630;
  const CHART_LEFT = 60;
  const CHART_RIGHT = W - 80;
  const CHART_TOP = 120;
  const CHART_BOTTOM = H - 100;
  const CHART_W = CHART_RIGHT - CHART_LEFT;
  const CHART_H = CHART_BOTTOM - CHART_TOP;

  const allPrices = [...bars.flatMap(b => [b.high, b.low]), entry, sl, tp];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  const PADDING = priceRange * 0.05;
  const pMin = minPrice - PADDING;
  const pMax = maxPrice + PADDING;
  const pRange = pMax - pMin;

  const yForPrice = (p: number) => CHART_TOP + (1 - (p - pMin) / pRange) * CHART_H;

  const barCount = bars.length;
  const barWidth = Math.min(Math.max(CHART_W / barCount * 0.6, 3), 16);
  const barSpacing = CHART_W / barCount;
  const xForBar = (i: number) => CHART_LEFT + i * barSpacing + barSpacing / 2;

  const isBullish = direction?.toLowerCase() === 'bullish' || direction === 'long';
  const dirColor = isBullish ? '#22c55e' : '#ef4444';
  const dirEmoji = isBullish ? '▲' : '▼';

  // ── Pattern zone highlight + ZigZag overlay ──
  let patternOverlaySvg = '';
  if (pivots && pivots.length >= 2) {
    const validPivots = pivots.filter(p => p.index >= 0 && p.index < barCount);
    if (validPivots.length >= 2) {
      const firstIdx = validPivots[0].index;
      const lastIdx = validPivots[validPivots.length - 1].index;
      const zoneX = xForBar(firstIdx) - barSpacing / 2;
      const zoneW = xForBar(lastIdx) - zoneX + barSpacing / 2;

      // Pattern zone background
      patternOverlaySvg += `<rect x="${zoneX}" y="${CHART_TOP}" width="${zoneW}" height="${CHART_H}" fill="#38bdf8" opacity="0.06" rx="4"/>`;
      // "PATTERN" label
      patternOverlaySvg += `<text x="${zoneX + zoneW / 2}" y="${CHART_TOP + 16}" text-anchor="middle" fill="#38bdf8" font-size="10" font-family="Arial, Helvetica, sans-serif" font-weight="600" opacity="0.5">PATTERN</text>`;

      // ZigZag polyline
      const points = validPivots.map(p => `${xForBar(p.index).toFixed(1)},${yForPrice(p.price).toFixed(1)}`).join(' ');
      patternOverlaySvg += `<polyline points="${points}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round" opacity="0.7"/>`;

      // Pivot dots
      for (const p of validPivots) {
        const cx = xForBar(p.index);
        const cy = yForPrice(p.price);
        patternOverlaySvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="#38bdf8" opacity="0.8"/>`;
        patternOverlaySvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.4"/>`;
      }
    }
  }

  // ── Signal arrow at last bar ──
  const lastBarX = xForBar(barCount - 1);
  const arrowColor = isBullish ? '#22c55e' : '#ef4444';
  const arrowY = isBullish ? yForPrice(bars[barCount - 1]?.low ?? entry) + 18 : yForPrice(bars[barCount - 1]?.high ?? entry) - 18;
  const arrowPath = isBullish
    ? `M${lastBarX - 8},${arrowY + 12} L${lastBarX},${arrowY} L${lastBarX + 8},${arrowY + 12} Z`
    : `M${lastBarX - 8},${arrowY - 12} L${lastBarX},${arrowY} L${lastBarX + 8},${arrowY - 12} Z`;
  const signalArrowSvg = `<path d="${arrowPath}" fill="${arrowColor}" opacity="0.9"/>`;

  // ── Candlesticks ──
  let candleSvg = '';
  bars.forEach((bar, i) => {
    const x = xForBar(i);
    const isGreen = bar.close >= bar.open;
    const fill = isGreen ? '#22c55e' : '#ef4444';
    const bodyTop = yForPrice(Math.max(bar.open, bar.close));
    const bodyBot = yForPrice(Math.min(bar.open, bar.close));
    const bodyH = Math.max(bodyBot - bodyTop, 1);
    candleSvg += `<line x1="${x}" y1="${yForPrice(bar.high)}" x2="${x}" y2="${yForPrice(bar.low)}" stroke="${fill}" stroke-width="1.5" opacity="0.8"/>`;
    candleSvg += `<rect x="${x - barWidth / 2}" y="${bodyTop}" width="${barWidth}" height="${bodyH}" fill="${fill}" rx="1"/>`;
  });

  const levelLine = (price: number, color: string, label: string, dashArray = '') => {
    const y = yForPrice(price);
    const priceStr = formatPrice(price);
    return `
      <line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${dashArray}" opacity="0.7"/>
      <rect x="${CHART_RIGHT + 4}" y="${y - 12}" width="${W - CHART_RIGHT - 10}" height="24" rx="4" fill="${color}" opacity="0.9"/>
      <text x="${CHART_RIGHT + 10}" y="${y + 4}" fill="white" font-size="11" font-family="Courier, monospace" font-weight="600">${label} ${priceStr}</text>
    `;
  };

  const entryY = yForPrice(entry);
  const tpY = yForPrice(tp);
  const slY = yForPrice(sl);

  const displayPattern = patternName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const displayInstrument = instrument.replace('-USD', '').replace('=X', '').replace('=F', '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1419"/>
      <stop offset="100%" stop-color="#1a1f2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff6633"/>
      <stop offset="100%" stop-color="#ff8c00"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" rx="0"/>
  <rect x="0" y="0" width="${W}" height="4" fill="url(#accent)"/>
  ${Array.from({ length: 5 }, (_, i) => {
    const y = CHART_TOP + (CHART_H / 4) * i;
    return `<line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="#ffffff" stroke-width="0.5" opacity="0.06"/>`;
  }).join('\n  ')}
  <text x="40" y="50" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${displayPattern}</text>
  <text x="40" y="82" fill="#94a3b8" font-size="18" font-family="Arial, Helvetica, sans-serif">${displayInstrument} · ${timeframe.toUpperCase()}</text>
  <rect x="${W - 200}" y="26" width="160" height="36" rx="18" fill="${dirColor}" opacity="0.15"/>
  <text x="${W - 120}" y="50" fill="${dirColor}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">${dirEmoji} ${isBullish ? 'BULLISH' : 'BEARISH'}</text>
  <rect x="${W - 200}" y="72" width="70" height="28" rx="14" fill="#3b82f6" opacity="0.2"/>
  <text x="${W - 165}" y="91" fill="#60a5fa" font-size="13" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">${grade}</text>
  <rect x="${W - 120}" y="72" width="80" height="28" rx="14" fill="#8b5cf6" opacity="0.2"/>
  <text x="${W - 80}" y="91" fill="#a78bfa" font-size="13" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">R:R ${rr}</text>
  <rect x="${CHART_LEFT}" y="${CHART_TOP}" width="${CHART_W}" height="${CHART_H}" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.08" rx="4"/>
  <rect x="${CHART_LEFT}" y="${Math.min(entryY, tpY)}" width="${CHART_W}" height="${Math.abs(tpY - entryY)}" fill="#22c55e" opacity="0.06"/>
  <rect x="${CHART_LEFT}" y="${Math.min(entryY, slY)}" width="${CHART_W}" height="${Math.abs(slY - entryY)}" fill="#ef4444" opacity="0.06"/>
  ${patternOverlaySvg}
  ${candleSvg}
  ${signalArrowSvg}
  ${levelLine(entry, '#3b82f6', 'ENTRY', '')}
  ${levelLine(sl, '#ef4444', 'SL', '6,4')}
  ${levelLine(tp, '#22c55e', 'TP', '6,4')}
  <rect x="0" y="${H - 50}" width="${W}" height="50" fill="#0a0e14" opacity="0.8"/>
  <text x="40" y="${H - 20}" fill="#ff6633" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">ChartingPath</text>
  <text x="200" y="${H - 20}" fill="#64748b" font-size="13" font-family="Arial, Helvetica, sans-serif">chartingpath.com · Live Pattern Detection</text>
  <text x="${W - 40}" y="${H - 20}" fill="#475569" font-size="12" font-family="Courier, monospace" text-anchor="end">Entry: ${formatPrice(entry)} | SL: ${formatPrice(sl)} | TP: ${formatPrice(tp)}</text>
</svg>`;
}

function parseBars(detection: any): Bar[] {
  let bars: Bar[] = [];
  try {
    const rawBars = typeof detection.bars === 'string' ? JSON.parse(detection.bars) : detection.bars;
    if (Array.isArray(rawBars)) {
      bars = rawBars.map((b: any) => ({
        open: Number(b.open ?? b.o ?? 0),
        high: Number(b.high ?? b.h ?? 0),
        low: Number(b.low ?? b.l ?? 0),
        close: Number(b.close ?? b.c ?? 0),
      }));
    }
  } catch { /* ignore */ }

  if (bars.length < 3) {
    const mid = detection.entry_price;
    const range = Math.abs(detection.take_profit_price - detection.stop_loss_price) * 0.3;
    bars = Array.from({ length: 20 }, (_, i) => {
      const noise = Math.sin(i * 0.8) * range + (Math.random() - 0.5) * range * 0.5;
      const o = mid + noise;
      const c = o + (Math.random() - 0.5) * range * 0.4;
      return { open: o, high: Math.max(o, c) + Math.random() * range * 0.2, low: Math.min(o, c) - Math.random() * range * 0.2, close: c };
    });
  }
  return bars;
}

function parsePivots(detection: any): Pivot[] {
  try {
    const spec = typeof detection.visual_spec === 'string' ? JSON.parse(detection.visual_spec) : detection.visual_spec;
    if (spec?.pivots && Array.isArray(spec.pivots)) {
      return spec.pivots
        .filter((p: any) => typeof p.index === 'number' && typeof p.price === 'number')
        .map((p: any) => ({
          index: Number(p.index),
          price: Number(p.price),
          type: (p.type === 'high' || p.type === 'low') ? p.type : 'high',
        }));
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Find A/B grade active detections without a share image
    const { data: detections, error: fetchErr } = await supabase
      .from('live_pattern_detections')
      .select('id, pattern_name, instrument, asset_type, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, bars, visual_spec, share_token, share_image_url')
      .in('quality_score', ALLOWED_GRADES)
      .in('status', ['active', 'pending'])
      .is('share_image_url', null)
      .order('last_confirmed_at', { ascending: false })
      .limit(MAX_IMAGES_PER_RUN);

    if (fetchErr) throw fetchErr;

    if (!detections || detections.length === 0) {
      console.log('[pre-gen-images] No detections need images');
      return new Response(JSON.stringify({ generated: 0, reason: 'all_images_exist' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[pre-gen-images] Processing ${detections.length} detections`);
    const results: any[] = [];

    for (const detection of detections) {
      try {
        // Ensure share token
        let shareToken = detection.share_token;
        if (!shareToken) {
          shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
          await supabase
            .from('live_pattern_detections')
            .update({ share_token: shareToken })
            .eq('id', detection.id);
        }

        const bars = parseBars(detection);
        const pivots = parsePivots(detection);

        const svg = renderCandlestickSVG({
          bars,
          entry: detection.entry_price,
          sl: detection.stop_loss_price,
          tp: detection.take_profit_price,
          direction: detection.direction,
          patternName: detection.pattern_name,
          instrument: detection.instrument,
          timeframe: detection.timeframe,
          grade: detection.quality_score?.toUpperCase() ?? '?',
          rr: Number(detection.risk_reward_ratio).toFixed(1),
          pivots,
        });

        // Initialize resvg WASM if needed
        await ensureWasm();

        // Render SVG to PNG using svg2png-wasm
        const pngBuffer = await svg2png(svg, { width: 1200, height: 630 });

        // Upload PNG (primary — for Twitter/X OG cards)
        const pngPath = `${shareToken}.png`;
        const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

        const { error: pngUploadError } = await supabase.storage
          .from('share-images')
          .upload(pngPath, pngBlob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (pngUploadError) throw pngUploadError;

        // Also upload SVG as fallback
        const svgPath = `${shareToken}.svg`;
        const uploadBlob = new Blob([svg], { type: 'image/svg+xml' });

        await supabase.storage
          .from('share-images')
          .upload(svgPath, uploadBlob, {
            contentType: 'image/svg+xml',
            upsert: true,
          });

        const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/share-images/${pngPath}`;

        // Update detection with image URL (PNG)
        await supabase
          .from('live_pattern_detections')
          .update({ share_image_url: publicUrl })
          .eq('id', detection.id);

        results.push({ id: detection.id, instrument: detection.instrument, status: 'ok', pivots: pivots.length });
        console.log(`[pre-gen-images] ✅ ${detection.instrument} → ${filePath} (${pivots.length} pivots)`);

      } catch (err: any) {
        console.error(`[pre-gen-images] ❌ ${detection.instrument}: ${err.message}`);
        results.push({ id: detection.id, instrument: detection.instrument, status: 'error', error: err.message });
      }
    }

    const generated = results.filter(r => r.status === 'ok').length;
    console.log(`[pre-gen-images] Done — ${generated}/${detections.length} generated`);

    return new Response(
      JSON.stringify({ generated, total: detections.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[pre-gen-images] Fatal:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
