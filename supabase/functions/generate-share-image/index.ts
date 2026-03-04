import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { svg2png, initialize } from "https://esm.sh/svg2png-wasm@0.6.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmUrl = "https://unpkg.com/svg2png-wasm@0.6.1/svg2png_wasm_bg.wasm";
  const resp = await fetch(wasmUrl);
  if (!resp.ok) throw new Error(`Failed to fetch WASM: ${resp.status}`);
  await initialize(await resp.arrayBuffer());
  wasmInitialized = true;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Bar { open: number; high: number; low: number; close: number; }
interface Pivot { index: number; price: number; type: 'high' | 'low'; }

// ─── EMA Calculation ────────────────────────────────────────────────────────

function calculateEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length < period) return closes.map(() => null);
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) result.push(null);
    else if (i === period - 1) result.push(ema);
    else { ema = (closes[i] - ema) * multiplier + ema; result.push(ema); }
  }
  return result;
}

// ─── SVG Rendering ──────────────────────────────────────────────────────────
// NOTE: svg2png-wasm in Supabase Edge Runtime cannot render SVG <text> elements
// because no system fonts are available. All text info is conveyed via OG meta
// tags in the og-share function instead. This SVG produces a clean chart-only PNG.

function renderCandlestickSVG(opts: {
  bars: Bar[]; entry: number; sl: number; tp: number;
  direction: string; patternName: string; instrument: string;
  timeframe: string; grade: string; rr: string; pivots?: Pivot[];
}): string {
  const { bars, entry, sl, tp, direction, instrument, grade, rr, pivots } = opts;

  const W = 1200, H = 630;
  const CHART_LEFT = 20, CHART_RIGHT = W - 20;
  const CHART_TOP = 60, CHART_BOTTOM = H - 60;
  const CHART_W = CHART_RIGHT - CHART_LEFT;
  const CHART_H = CHART_BOTTOM - CHART_TOP;

  const allPrices = [...bars.flatMap(b => [b.high, b.low]), entry, sl, tp];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  const PADDING = priceRange * 0.05;
  const pMin = minPrice - PADDING, pMax = maxPrice + PADDING, pRange = pMax - pMin;

  const yForPrice = (p: number) => CHART_TOP + (1 - (p - pMin) / pRange) * CHART_H;
  const barCount = bars.length;
  const barWidth = Math.min(Math.max(CHART_W / barCount * 0.6, 3), 16);
  const barSpacing = CHART_W / barCount;
  const xForBar = (i: number) => CHART_LEFT + i * barSpacing + barSpacing / 2;

  const isBullish = direction?.toLowerCase() === 'bullish' || direction === 'long';
  const dirColor = isBullish ? '#22c55e' : '#ef4444';

  // Pattern zone + ZigZag
  let patternOverlaySvg = '';
  if (pivots && pivots.length >= 2) {
    const vp = pivots.filter(p => p.index >= 0 && p.index < barCount);
    if (vp.length >= 2) {
      const zoneX = xForBar(vp[0].index) - barSpacing / 2;
      const zoneW = xForBar(vp[vp.length - 1].index) - zoneX + barSpacing / 2;
      patternOverlaySvg += `<rect x="${zoneX}" y="${CHART_TOP}" width="${zoneW}" height="${CHART_H}" fill="#38bdf8" opacity="0.06" rx="4"/>`;
      const pts = vp.map(p => `${xForBar(p.index).toFixed(1)},${yForPrice(p.price).toFixed(1)}`).join(' ');
      patternOverlaySvg += `<polyline points="${pts}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round" opacity="0.7"/>`;
      for (const p of vp) {
        patternOverlaySvg += `<circle cx="${xForBar(p.index).toFixed(1)}" cy="${yForPrice(p.price).toFixed(1)}" r="4" fill="#38bdf8" opacity="0.8"/>`;
      }
    }
  }

  // EMA lines
  const closes = bars.map(b => b.close);
  const renderEmaLine = (values: (number | null)[], color: string) => {
    const points = values.map((v, i) => v !== null ? `${xForBar(i).toFixed(1)},${yForPrice(v).toFixed(1)}` : '').filter(Boolean);
    return points.length < 2 ? '' : `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6"/>`;
  };
  const ema50Svg = renderEmaLine(calculateEMA(closes, 50), '#f59e0b');
  const ema200Svg = renderEmaLine(calculateEMA(closes, 200), '#a855f7');

  // Signal arrow
  const lastBarX = xForBar(barCount - 1);
  const arrowY = isBullish ? yForPrice(bars[barCount - 1]?.low ?? entry) + 18 : yForPrice(bars[barCount - 1]?.high ?? entry) - 18;
  const arrowPath = isBullish
    ? `M${lastBarX - 8},${arrowY + 12} L${lastBarX},${arrowY} L${lastBarX + 8},${arrowY + 12} Z`
    : `M${lastBarX - 8},${arrowY - 12} L${lastBarX},${arrowY} L${lastBarX + 8},${arrowY - 12} Z`;
  const signalArrowSvg = `<path d="${arrowPath}" fill="${isBullish ? '#22c55e' : '#ef4444'}" opacity="0.9"/>`;

  // Candlesticks
  let candleSvg = '';
  bars.forEach((bar, i) => {
    const x = xForBar(i);
    const isGreen = bar.close >= bar.open;
    const fill = isGreen ? '#22c55e' : '#ef4444';
    const bodyTop = yForPrice(Math.max(bar.open, bar.close));
    const bodyBot = yForPrice(Math.min(bar.open, bar.close));
    candleSvg += `<line x1="${x}" y1="${yForPrice(bar.high)}" x2="${x}" y2="${yForPrice(bar.low)}" stroke="${fill}" stroke-width="1.5" opacity="0.8"/>`;
    candleSvg += `<rect x="${x - barWidth / 2}" y="${bodyTop}" width="${barWidth}" height="${Math.max(bodyBot - bodyTop, 1)}" fill="${fill}" rx="1"/>`;
  });

  // Level lines (entry, SL, TP) — colored lines with small color-coded rectangles as labels (no text)
  const levelLine = (price: number, color: string, dash = '') => {
    const y = yForPrice(price);
    return `
      <line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="${color}" stroke-width="2" stroke-dasharray="${dash}" opacity="0.8"/>
      <rect x="${CHART_RIGHT - 60}" y="${y - 4}" width="60" height="8" rx="4" fill="${color}" opacity="0.9"/>`;
  };

  const entryY = yForPrice(entry), tpY = yForPrice(tp), slY = yForPrice(sl);
  const zoneSvg = `
    <rect x="${CHART_LEFT}" y="${Math.min(entryY, tpY)}" width="${CHART_W}" height="${Math.abs(tpY - entryY)}" fill="#22c55e" opacity="0.07"/>
    <rect x="${CHART_LEFT}" y="${Math.min(entryY, slY)}" width="${CHART_W}" height="${Math.abs(slY - entryY)}" fill="#ef4444" opacity="0.07"/>`;

  // Direction badge (colored pill shape, no text)
  const badgeSvg = `
    <rect x="${W - 180}" y="12" width="160" height="36" rx="18" fill="${dirColor}" opacity="0.25"/>
    <rect x="${W - 100}" y="12" width="8" height="36" rx="4" fill="${dirColor}" opacity="0.6"/>
    <rect x="${W - 180}" y="56" width="60" height="24" rx="12" fill="#3b82f6" opacity="0.3"/>
    <rect x="${W - 110}" y="56" width="90" height="24" rx="12" fill="#8b5cf6" opacity="0.3"/>`;

  // Brand accent bar at top
  const brandBar = `<rect x="0" y="0" width="${W}" height="4" fill="url(#accent)"/>`;
  // Brand accent bar at bottom
  const footerBar = `
    <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#accent)"/>
    <rect x="30" y="${H - 40}" width="120" height="28" rx="4" fill="#ff6633" opacity="0.15"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1419"/><stop offset="100%" stop-color="#1a1f2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff6633"/><stop offset="100%" stop-color="#ff8c00"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${brandBar}
  ${badgeSvg}
  ${zoneSvg}
  ${ema200Svg}
  ${ema50Svg}
  ${patternOverlaySvg}
  ${candleSvg}
  ${signalArrowSvg}
  ${levelLine(entry, '#3b82f6', '')}
  ${levelLine(sl, '#ef4444', '6,4')}
  ${levelLine(tp, '#22c55e', '6,4')}
  ${footerBar}
</svg>`;
}

function parseBars(detection: any): Bar[] {
  let bars: Bar[] = [];
  try {
    const rawBars = typeof detection.bars === 'string' ? JSON.parse(detection.bars) : detection.bars;
    if (Array.isArray(rawBars)) {
      bars = rawBars.map((b: any) => ({
        open: Number(b.open ?? b.o ?? 0), high: Number(b.high ?? b.h ?? 0),
        low: Number(b.low ?? b.l ?? 0), close: Number(b.close ?? b.c ?? 0),
      }));
    }
  } catch { console.warn('[generate-share-image] Could not parse bars'); }
  if (bars.length < 3) {
    const mid = detection.entry_price;
    const range = Math.abs(detection.take_profit_price - detection.stop_loss_price) * 0.3;
    bars = Array.from({ length: 20 }, (_, i) => {
      const noise = Math.sin(i * 0.8) * range + (Math.random() - 0.5) * range * 0.5;
      const o = mid + noise, c = o + (Math.random() - 0.5) * range * 0.4;
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
        .map((p: any) => ({ index: Number(p.index), price: Number(p.price), type: (p.type === 'high' || p.type === 'low') ? p.type : 'high' }));
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { token, pattern_id } = await req.json();
    if (!token && !pattern_id) {
      return new Response(JSON.stringify({ error: 'token or pattern_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let query = supabase.from('live_pattern_detections').select('*');
    if (token) query = query.eq('share_token', token);
    else query = query.eq('id', pattern_id);

    const { data: detection, error } = await query.single();
    if (error || !detection) {
      return new Response(JSON.stringify({ error: 'Detection not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const shareToken = detection.share_token || token;
    if (!shareToken) {
      return new Response(JSON.stringify({ error: 'No share token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const bars = parseBars(detection);
    const pivots = parsePivots(detection);

    await ensureWasm();

    const svg = renderCandlestickSVG({
      bars, entry: detection.entry_price, sl: detection.stop_loss_price,
      tp: detection.take_profit_price, direction: detection.direction,
      patternName: detection.pattern_name, instrument: detection.instrument,
      timeframe: detection.timeframe,
      grade: detection.quality_score?.toUpperCase() ?? '?',
      rr: Number(detection.risk_reward_ratio).toFixed(1), pivots,
    });

    const pngBuffer = await svg2png(svg, { width: 1200, height: 630 });

    const pngPath = `${shareToken}.png`;
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

    const { error: uploadErr } = await supabase.storage
      .from('share-images')
      .upload(pngPath, pngBlob, { contentType: 'image/png', upsert: true });

    if (uploadErr) { console.error('[generate-share-image] Upload error:', uploadErr); throw uploadErr; }

    const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/share-images/${pngPath}`;

    await supabase.from('live_pattern_detections')
      .update({ share_image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', detection.id);

    console.log(`[generate-share-image] PNG ${pngPath} for ${detection.instrument} (${pivots.length} pivots, no-text chart)`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, token: shareToken, format: 'png' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[generate-share-image] Error:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
