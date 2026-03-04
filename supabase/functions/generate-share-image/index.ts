import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let resvgModule: any = null;
let fontBuffer: Uint8Array | null = null;

async function ensureResvg() {
  if (resvgModule) return;
  const mod = await import("https://esm.sh/@resvg/resvg-wasm@2.6.2");
  const wasmResp = await fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
  if (!wasmResp.ok) throw new Error(`Failed to fetch resvg WASM: ${wasmResp.status}`);
  await mod.initWasm(wasmResp);
  resvgModule = mod;
}

async function ensureFont(): Promise<Uint8Array> {
  if (fontBuffer) return fontBuffer;
  const fontUrl = "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2";
  const resp = await fetch(fontUrl);
  if (!resp.ok) throw new Error(`Failed to fetch font: ${resp.status}`);
  fontBuffer = new Uint8Array(await resp.arrayBuffer());
  return fontBuffer;
}

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

// ─── EMA Calculation ────────────────────────────────────────────────────────

function calculateEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length < period) return closes.map(() => null);
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (closes[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
}

// ─── SVG Rendering ──────────────────────────────────────────────────────────

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

  const FONT = 'Inter, sans-serif';

  const W = 1200;
  const H = 630;
  const CHART_LEFT = 90;
  const CHART_RIGHT = W - 140;
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

  // ── Y-axis price labels ──
  const yAxisSteps = 5;
  let yAxisSvg = '';
  for (let i = 0; i <= yAxisSteps; i++) {
    const price = pMin + (pRange / yAxisSteps) * i;
    const y = yForPrice(price);
    yAxisSvg += `<text x="${CHART_LEFT - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="11" font-family="${FONT}">${formatPrice(price)}</text>`;
    yAxisSvg += `<line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="#ffffff" stroke-width="0.5" opacity="0.06"/>`;
  }

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

      patternOverlaySvg += `<rect x="${zoneX}" y="${CHART_TOP}" width="${zoneW}" height="${CHART_H}" fill="#38bdf8" opacity="0.06" rx="4"/>`;
      patternOverlaySvg += `<text x="${zoneX + zoneW / 2}" y="${CHART_TOP + 16}" text-anchor="middle" fill="#38bdf8" font-size="10" font-family="${FONT}" font-weight="600" opacity="0.5">PATTERN</text>`;

      const points = validPivots.map(p => `${xForBar(p.index).toFixed(1)},${yForPrice(p.price).toFixed(1)}`).join(' ');
      patternOverlaySvg += `<polyline points="${points}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round" opacity="0.7"/>`;

      for (const p of validPivots) {
        const cx = xForBar(p.index);
        const cy = yForPrice(p.price);
        patternOverlaySvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="#38bdf8" opacity="0.8"/>`;
        patternOverlaySvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.4"/>`;
      }
    }
  }

  // ── EMA 50 & EMA 200 Lines ──
  const closes = bars.map(b => b.close);
  const ema50Values = calculateEMA(closes, 50);
  const ema200Values = calculateEMA(closes, 200);

  const renderEmaLine = (values: (number | null)[], color: string) => {
    const points: string[] = [];
    values.forEach((val, i) => {
      if (val !== null) {
        points.push(`${xForBar(i).toFixed(1)},${yForPrice(val).toFixed(1)}`);
      }
    });
    if (points.length < 2) return '';
    return `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6"/>`;
  };

  const ema50Svg = renderEmaLine(ema50Values, '#f59e0b');
  const ema200Svg = renderEmaLine(ema200Values, '#a855f7');

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
      <rect x="${CHART_RIGHT + 6}" y="${y - 13}" width="${W - CHART_RIGHT - 12}" height="26" rx="4" fill="${color}" opacity="0.9"/>
      <text x="${CHART_RIGHT + 14}" y="${y + 5}" fill="white" font-size="12" font-family="${FONT}" font-weight="700">${label} ${priceStr}</text>
    `;
  };

  const entryY = yForPrice(entry);
  const tpY = yForPrice(tp);
  const slY = yForPrice(sl);

  const zoneSvg = `
    <rect x="${CHART_LEFT}" y="${Math.min(entryY, tpY)}" width="${CHART_W}" height="${Math.abs(tpY - entryY)}" fill="#22c55e" opacity="0.06"/>
    <rect x="${CHART_LEFT}" y="${Math.min(entryY, slY)}" width="${CHART_W}" height="${Math.abs(slY - entryY)}" fill="#ef4444" opacity="0.06"/>
  `;

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

  <!-- Header -->
  <text x="40" y="48" fill="#ffffff" font-size="32" font-family="${FONT}" font-weight="800">${displayInstrument}</text>
  <text x="${40 + displayInstrument.length * 20 + 12}" y="48" fill="#64748b" font-size="20" font-family="${FONT}" font-weight="500">${timeframe.toUpperCase()}</text>
  <text x="40" y="78" fill="#94a3b8" font-size="16" font-family="${FONT}" font-weight="500">${displayPattern}</text>

  <!-- Direction badge -->
  <rect x="${W - 200}" y="18" width="160" height="40" rx="20" fill="${dirColor}" opacity="0.18"/>
  <text x="${W - 120}" y="44" fill="${dirColor}" font-size="18" font-family="${FONT}" font-weight="800" text-anchor="middle">${dirEmoji} ${isBullish ? 'BULLISH' : 'BEARISH'}</text>

  <!-- Grade + R:R badges -->
  <rect x="${W - 200}" y="68" width="70" height="30" rx="15" fill="#3b82f6" opacity="0.25"/>
  <text x="${W - 165}" y="88" fill="#60a5fa" font-size="14" font-family="${FONT}" font-weight="700" text-anchor="middle">${grade}</text>
  <rect x="${W - 120}" y="68" width="80" height="30" rx="15" fill="#8b5cf6" opacity="0.25"/>
  <text x="${W - 80}" y="88" fill="#a78bfa" font-size="14" font-family="${FONT}" font-weight="700" text-anchor="middle">R:R ${rr}</text>

  <!-- Chart area border -->
  <rect x="${CHART_LEFT}" y="${CHART_TOP}" width="${CHART_W}" height="${CHART_H}" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.08" rx="4"/>

  ${yAxisSvg}
  ${zoneSvg}
  ${ema200Svg}
  ${ema50Svg}
  ${patternOverlaySvg}
  ${candleSvg}
  ${signalArrowSvg}
  ${levelLine(entry, '#3b82f6', 'ENTRY', '')}
  ${levelLine(sl, '#ef4444', 'SL', '6,4')}
  ${levelLine(tp, '#22c55e', 'TP', '6,4')}

  <!-- Footer -->
  <rect x="0" y="${H - 54}" width="${W}" height="54" fill="#0a0e14" opacity="0.9"/>
  <line x1="40" y1="${H - 38}" x2="60" y2="${H - 38}" stroke="#f59e0b" stroke-width="2" opacity="0.8"/>
  <text x="64" y="${H - 34}" fill="#94a3b8" font-size="11" font-family="${FONT}">EMA 50</text>
  <line x1="120" y1="${H - 38}" x2="140" y2="${H - 38}" stroke="#a855f7" stroke-width="2" opacity="0.8"/>
  <text x="144" y="${H - 34}" fill="#94a3b8" font-size="11" font-family="${FONT}">EMA 200</text>
  <text x="40" y="${H - 14}" fill="#ff6633" font-size="18" font-family="${FONT}" font-weight="800">ChartingPath</text>
  <text x="220" y="${H - 14}" fill="#64748b" font-size="14" font-family="${FONT}">chartingpath.com</text>
  <text x="${W - 40}" y="${H - 14}" fill="#94a3b8" font-size="13" font-family="${FONT}" font-weight="600" text-anchor="end">Entry: ${formatPrice(entry)} | SL: ${formatPrice(sl)} | TP: ${formatPrice(tp)}</text>
</svg>`;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toPrecision(5);
  return price.toPrecision(4);
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
  } catch {
    console.warn('[generate-share-image] Could not parse bars');
  }

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
  } catch {
    console.warn('[generate-share-image] Could not parse pivots from visual_spec');
  }
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
    const { token, pattern_id } = await req.json();

    if (!token && !pattern_id) {
      return new Response(JSON.stringify({ error: 'token or pattern_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase.from('live_pattern_detections').select('*');
    if (token) {
      query = query.eq('share_token', token);
    } else {
      query = query.eq('id', pattern_id);
    }

    const { data: detection, error } = await query.single();
    if (error || !detection) {
      return new Response(JSON.stringify({ error: 'Detection not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shareToken = detection.share_token || token;
    if (!shareToken) {
      return new Response(JSON.stringify({ error: 'No share token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bars = parseBars(detection);
    const pivots = parsePivots(detection);

    // Init resvg WASM and fetch font in parallel
    const [font] = await Promise.all([
      ensureFont(),
      ensureResvg(),
    ]);

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

    // Render SVG to PNG using resvg-wasm with custom font
    const resvgInstance = new resvgModule.Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        fontBuffers: [font],
        loadSystemFonts: false,
        defaultFontFamily: 'Inter',
      },
    });
    const pngData = resvgInstance.render();
    const pngBuffer = pngData.asPng();

    const pngPath = `${shareToken}.png`;
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

    const { error: pngUploadError } = await supabase.storage
      .from('share-images')
      .upload(pngPath, pngBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (pngUploadError) {
      console.error('[generate-share-image] PNG upload error:', pngUploadError);
      throw pngUploadError;
    }

    const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/share-images/${pngPath}`;

    await supabase
      .from('live_pattern_detections')
      .update({ share_image_url: publicUrl })
      .eq('id', detection.id);

    console.log(`[generate-share-image] ✅ Generated PNG ${pngPath} for ${detection.instrument} (${pivots.length} pivots, resvg+Inter font)`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, token: shareToken, format: 'png' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[generate-share-image] Error:', err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
