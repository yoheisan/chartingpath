// Client-side SVG chart renderer for signal posts
// Ported from supabase/functions/pre-generate-pattern-images/index.ts

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

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toPrecision(5);
  return price.toPrecision(4);
}

export function renderSignalSVG(opts: {
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

  const W = 800;
  const H = 420;
  const CHART_LEFT = 50;
  const CHART_RIGHT = W - 70;
  const CHART_TOP = 90;
  const CHART_BOTTOM = H - 70;
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
  const barWidth = Math.min(Math.max(CHART_W / barCount * 0.6, 3), 14);
  const barSpacing = CHART_W / barCount;
  const xForBar = (i: number) => CHART_LEFT + i * barSpacing + barSpacing / 2;

  const isBullish = direction?.toLowerCase() === 'bullish' || direction === 'long';
  const dirColor = isBullish ? '#22c55e' : '#ef4444';
  const dirEmoji = isBullish ? '▲' : '▼';

  // Pattern zone + ZigZag
  let patternOverlaySvg = '';
  if (pivots && pivots.length >= 2) {
    const validPivots = pivots.filter(p => p.index >= 0 && p.index < barCount);
    if (validPivots.length >= 2) {
      const firstIdx = validPivots[0].index;
      const lastIdx = validPivots[validPivots.length - 1].index;
      const zoneX = xForBar(firstIdx) - barSpacing / 2;
      const zoneW = xForBar(lastIdx) - zoneX + barSpacing / 2;

      patternOverlaySvg += `<rect x="${zoneX}" y="${CHART_TOP}" width="${zoneW}" height="${CHART_H}" fill="#38bdf8" opacity="0.06" rx="4"/>`;
      patternOverlaySvg += `<text x="${zoneX + zoneW / 2}" y="${CHART_TOP + 14}" text-anchor="middle" fill="#38bdf8" font-size="9" font-family="Arial,sans-serif" font-weight="600" opacity="0.5">PATTERN</text>`;

      const points = validPivots.map(p => `${xForBar(p.index).toFixed(1)},${yForPrice(p.price).toFixed(1)}`).join(' ');
      patternOverlaySvg += `<polyline points="${points}" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linejoin="round" opacity="0.7"/>`;

      for (const p of validPivots) {
        const cx = xForBar(p.index);
        const cy = yForPrice(p.price);
        patternOverlaySvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="#38bdf8" opacity="0.8"/>`;
      }
    }
  }

  // Signal arrow + projected move line
  const lastBarX = xForBar(barCount - 1);
  const lastBar = bars[barCount - 1];
  const lastClose = lastBar?.close ?? entry;
  const lastCloseY = yForPrice(lastClose);
  const entryYArrow = yForPrice(entry);

  // Projected move: short dashed line from last close toward entry level (same x)
  const projectedMoveSvg = Math.abs(lastCloseY - entryYArrow) > 4
    ? `<line x1="${lastBarX}" y1="${lastCloseY}" x2="${lastBarX}" y2="${entryYArrow}" stroke="${dirColor}" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.4"/>`
    : '';

  const arrowY = isBullish
    ? yForPrice(lastBar?.low ?? entry) + 14
    : yForPrice(lastBar?.high ?? entry) - 14;
  const arrowPath = isBullish
    ? `M${lastBarX - 6},${arrowY + 10} L${lastBarX},${arrowY} L${lastBarX + 6},${arrowY + 10} Z`
    : `M${lastBarX - 6},${arrowY - 10} L${lastBarX},${arrowY} L${lastBarX + 6},${arrowY - 10} Z`;
  const signalArrowSvg = `<path d="${arrowPath}" fill="${dirColor}" opacity="0.9"/>
  ${projectedMoveSvg}`;

  // Candlesticks
  let candleSvg = '';
  bars.forEach((bar, i) => {
    const x = xForBar(i);
    const isGreen = bar.close >= bar.open;
    const fill = isGreen ? '#22c55e' : '#ef4444';
    const bodyTop = yForPrice(Math.max(bar.open, bar.close));
    const bodyBot = yForPrice(Math.min(bar.open, bar.close));
    const bodyH = Math.max(bodyBot - bodyTop, 1);
    candleSvg += `<line x1="${x}" y1="${yForPrice(bar.high)}" x2="${x}" y2="${yForPrice(bar.low)}" stroke="${fill}" stroke-width="1" opacity="0.8"/>`;
    candleSvg += `<rect x="${x - barWidth / 2}" y="${bodyTop}" width="${barWidth}" height="${bodyH}" fill="${fill}" rx="1"/>`;
  });

  const levelLine = (price: number, color: string, label: string, dashArray = '') => {
    const y = yForPrice(price);
    const priceStr = formatPrice(price);
    return `
      <line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="${color}" stroke-width="1" stroke-dasharray="${dashArray}" opacity="0.6"/>
      <rect x="${CHART_RIGHT + 3}" y="${y - 10}" width="${W - CHART_RIGHT - 8}" height="20" rx="3" fill="${color}" opacity="0.85"/>
      <text x="${CHART_RIGHT + 8}" y="${y + 4}" fill="white" font-size="9" font-family="Courier,monospace" font-weight="600">${label} ${priceStr}</text>
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
  <rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>
  <rect x="0" y="0" width="${W}" height="3" fill="url(#accent)" rx="8"/>
  ${Array.from({ length: 5 }, (_, i) => {
    const y = CHART_TOP + (CHART_H / 4) * i;
    return `<line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="#ffffff" stroke-width="0.5" opacity="0.06"/>`;
  }).join('\n  ')}
  <text x="30" y="38" fill="#ffffff" font-size="20" font-family="Arial,sans-serif" font-weight="700">${displayPattern}</text>
  <text x="30" y="60" fill="#94a3b8" font-size="13" font-family="Arial,sans-serif">${displayInstrument} · ${timeframe.toUpperCase()}</text>
  <rect x="${W - 160}" y="18" width="130" height="28" rx="14" fill="${dirColor}" opacity="0.15"/>
  <text x="${W - 95}" y="37" fill="${dirColor}" font-size="13" font-family="Arial,sans-serif" font-weight="700" text-anchor="middle">${dirEmoji} ${isBullish ? 'BULLISH' : 'BEARISH'}</text>
  <rect x="${W - 160}" y="52" width="55" height="22" rx="11" fill="#3b82f6" opacity="0.2"/>
  <text x="${W - 133}" y="67" fill="#60a5fa" font-size="11" font-family="Arial,sans-serif" font-weight="600" text-anchor="middle">${grade}</text>
  <rect x="${W - 98}" y="52" width="68" height="22" rx="11" fill="#8b5cf6" opacity="0.2"/>
  <text x="${W - 64}" y="67" fill="#a78bfa" font-size="11" font-family="Arial,sans-serif" font-weight="600" text-anchor="middle">R:R ${rr}</text>
  <rect x="${CHART_LEFT}" y="${CHART_TOP}" width="${CHART_W}" height="${CHART_H}" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.08" rx="4"/>
  <rect x="${CHART_LEFT}" y="${Math.min(entryY, tpY)}" width="${CHART_W}" height="${Math.abs(tpY - entryY)}" fill="#22c55e" opacity="0.06"/>
  <rect x="${CHART_LEFT}" y="${Math.min(entryY, slY)}" width="${CHART_W}" height="${Math.abs(slY - entryY)}" fill="#ef4444" opacity="0.06"/>
  ${patternOverlaySvg}
  ${candleSvg}
  ${signalArrowSvg}
  ${levelLine(entry, '#3b82f6', 'ENT', '')}
  ${levelLine(sl, '#ef4444', 'SL', '6,4')}
  ${levelLine(tp, '#22c55e', 'TP', '6,4')}
  <rect x="0" y="${H - 36}" width="${W}" height="36" fill="#0a0e14" opacity="0.8" rx="0"/>
  <text x="30" y="${H - 12}" fill="#ff6633" font-size="12" font-family="Arial,sans-serif" font-weight="700">ChartingPath</text>
  <text x="150" y="${H - 12}" fill="#64748b" font-size="10" font-family="Arial,sans-serif">chartingpath.com</text>
</svg>`;
}

// Parse bars from DB row
export function parseBarsFromDetection(detection: any): Bar[] {
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

// Parse pivots from visual_spec
export function parsePivotsFromDetection(detection: any): Pivot[] {
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
