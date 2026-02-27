/**
 * PrescriptivePatternSVG — Client-side inline SVG renderer
 * Matches the share-image prescriptive style: candlesticks, zigzag pivots,
 * TP/SL/Entry zones, signal arrow, branded footer.
 */

import { PatternCalculator } from "@/utils/PatternCalculator";

interface PrescriptivePatternSVGProps {
  patternType: string;
  className?: string;
}

interface Bar {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Pivot {
  index: number;
  price: number;
  type: "high" | "low";
}

// ─── Pattern metadata ────────────────────────────────────────────────────────

const PATTERN_META: Record<string, { name: string; direction: "bullish" | "bearish"; category: string }> = {
  "head-shoulders":          { name: "Head and Shoulders",        direction: "bearish", category: "R" },
  "head-and-shoulders":      { name: "Head and Shoulders",        direction: "bearish", category: "R" },
  "inverted-head-shoulders": { name: "Inverted Head & Shoulders", direction: "bullish", category: "R" },
  "inverse-head-shoulders":  { name: "Inverted Head & Shoulders", direction: "bullish", category: "R" },
  "double-top":              { name: "Double Top",                direction: "bearish", category: "R" },
  "double-bottom":           { name: "Double Bottom",             direction: "bullish", category: "R" },
  "triple-top":              { name: "Triple Top",                direction: "bearish", category: "R" },
  "triple-bottom":           { name: "Triple Bottom",             direction: "bullish", category: "R" },
  "rising-wedge":            { name: "Rising Wedge",              direction: "bearish", category: "R" },
  "falling-wedge":           { name: "Falling Wedge",             direction: "bullish", category: "R" },
  "bump-run-reversal":       { name: "Bump-and-Run Reversal",     direction: "bearish", category: "R" },
  "island-reversal":         { name: "Island Reversal",           direction: "bullish", category: "R" },
  "ascending-triangle":      { name: "Ascending Triangle",        direction: "bullish", category: "C" },
  "descending-triangle":     { name: "Descending Triangle",       direction: "bearish", category: "C" },
  "symmetrical-triangle":    { name: "Symmetrical Triangle",      direction: "bullish", category: "C" },
  "bull-flag":               { name: "Bull Flag",                 direction: "bullish", category: "C" },
  "bear-flag":               { name: "Bear Flag",                 direction: "bearish", category: "C" },
  "pennant":                 { name: "Pennant",                   direction: "bullish", category: "C" },
  "cup-handle":              { name: "Cup with Handle",           direction: "bullish", category: "C" },
  "cup-and-handle":          { name: "Cup with Handle",           direction: "bullish", category: "C" },
  "rectangle":               { name: "Rectangle",                 direction: "bullish", category: "C" },
  // Candlestick patterns
  "hammer":                  { name: "Hammer",                    direction: "bullish", category: "K" },
  "hanging-man":             { name: "Hanging Man",               direction: "bearish", category: "K" },
  "shooting-star":           { name: "Shooting Star",             direction: "bearish", category: "K" },
  "doji":                    { name: "Doji",                      direction: "bullish", category: "K" },
  "standard-doji":           { name: "Standard Doji",             direction: "bullish", category: "K" },
  "dragonfly-doji":          { name: "Dragonfly Doji",            direction: "bullish", category: "K" },
  "gravestone-doji":         { name: "Gravestone Doji",           direction: "bearish", category: "K" },
  "long-legged-doji":        { name: "Long-Legged Doji",         direction: "bullish", category: "K" },
  "four-price-doji":         { name: "Four-Price Doji",           direction: "bullish", category: "K" },
  "bullish-harami":          { name: "Bullish Harami",            direction: "bullish", category: "K" },
  "bearish-harami":          { name: "Bearish Harami",            direction: "bearish", category: "K" },
  "bullish-engulfing":       { name: "Bullish Engulfing",         direction: "bullish", category: "K" },
  "bearish-engulfing":       { name: "Bearish Engulfing",         direction: "bearish", category: "K" },
  "spinning-top":            { name: "Spinning Top",              direction: "bullish", category: "K" },
  "morning-star":            { name: "Morning Star",              direction: "bullish", category: "K" },
  "evening-star":            { name: "Evening Star",              direction: "bearish", category: "K" },
  "three-white-soldiers":    { name: "Three White Soldiers",      direction: "bullish", category: "K" },
  "three-black-crows":       { name: "Three Black Crows",         direction: "bearish", category: "K" },
  "piercing-line":           { name: "Piercing Line",             direction: "bullish", category: "K" },
  "dark-cloud-cover":        { name: "Dark Cloud Cover",          direction: "bearish", category: "K" },
  "tweezer-top":             { name: "Tweezer Top",               direction: "bearish", category: "K" },
  "tweezer-bottom":          { name: "Tweezer Bottom",            direction: "bullish", category: "K" },
  "kicker-bullish":          { name: "Bullish Kicker",            direction: "bullish", category: "K" },
  "kicker-bearish":          { name: "Bearish Kicker",            direction: "bearish", category: "K" },
  "marubozu-bullish":        { name: "Bullish Marubozu",          direction: "bullish", category: "K" },
  "marubozu-bearish":        { name: "Bearish Marubozu",          direction: "bearish", category: "K" },
  "abandoned-baby-bullish":  { name: "Abandoned Baby Bullish",    direction: "bullish", category: "K" },
  "abandoned-baby-bearish":  { name: "Abandoned Baby Bearish",    direction: "bearish", category: "K" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(2);
  return price.toPrecision(4);
}

interface FormationLine {
  points: { x: number; y: number }[];
  label?: string;
  role: "upper" | "lower" | "neckline";
}

/** Derive pivots from PatternCalculator's 'peak' annotations */
function derivePivots(
  annotations: { type: string; points: { x: number; y: number }[]; label?: string }[]
): Pivot[] {
  return annotations
    .filter(a => a.type === "peak")
    .map(a => ({
      index: a.points[0].x,
      price: a.points[0].y,
      type: "high" as const,
    }))
    .sort((a, b) => a.index - b.index)
    .map((p, i, arr) => {
      const prev = arr[i - 1];
      const next = arr[i + 1];
      const isLow = (prev && p.price < prev.price) || (next && p.price < next.price);
      return { ...p, type: isLow ? ("low" as const) : ("high" as const) };
    });
}

/** Extract formation lines (trendlines, support, resistance) for geometric shape overlays */
function deriveFormationLines(
  annotations: { type: string; points: { x: number; y: number }[]; label?: string }[]
): FormationLine[] {
  const lines: FormationLine[] = [];
  for (const a of annotations) {
    if (a.points.length < 2) continue;
    if (a.type === "resistance") {
      lines.push({ points: a.points, label: a.label, role: "upper" });
    } else if (a.type === "support") {
      lines.push({ points: a.points, label: a.label, role: "lower" });
    } else if (a.type === "trendline") {
      // Classify by label or slope
      const lbl = (a.label || "").toLowerCase();
      if (lbl.includes("resist") || lbl.includes("upper") || lbl.includes("descend")) {
        lines.push({ points: a.points, label: a.label, role: "upper" });
      } else if (lbl.includes("support") || lbl.includes("lower") || lbl.includes("ascend")) {
        lines.push({ points: a.points, label: a.label, role: "lower" });
      } else {
        // Determine by slope relative to other trendlines
        const slope = (a.points[a.points.length - 1].y - a.points[0].y) /
                      (a.points[a.points.length - 1].x - a.points[0].x || 1);
        lines.push({ points: a.points, label: a.label, role: slope <= 0 ? "upper" : "lower" });
      }
    } else if (a.type === "neckline") {
      lines.push({ points: a.points, label: a.label, role: "neckline" });
    }
  }
  return lines;
}

/** Interpolate a formation line's price at a given x index */
function interpolateLine(points: { x: number; y: number }[], atX: number): number {
  if (points.length === 1) return points[0].y;
  // Clamp to line extent
  if (atX <= points[0].x) return points[0].y;
  if (atX >= points[points.length - 1].x) return points[points.length - 1].y;
  // Find segment
  for (let i = 0; i < points.length - 1; i++) {
    if (atX >= points[i].x && atX <= points[i + 1].x) {
      const t = (atX - points[i].x) / (points[i + 1].x - points[i].x);
      return points[i].y + t * (points[i + 1].y - points[i].y);
    }
  }
  return points[points.length - 1].y;
}

/** Check if pattern is a cup shape */
function isCupPattern(patternType: string): boolean {
  return patternType.includes("cup");
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PrescriptivePatternSVG = ({ patternType, className = "" }: PrescriptivePatternSVGProps) => {
  const patternData = PatternCalculator.getPatternData(patternType);
  if (!patternData || !patternData.candles || patternData.candles.length === 0) return null;

  const { candles, annotations, keyLevels } = patternData;
  const meta = PATTERN_META[patternType] || { name: patternType, direction: "bullish", category: "?" };
  const isBullish = meta.direction === "bullish";

  const bars: Bar[] = candles.map(c => ({ open: c.open, high: c.high, low: c.low, close: c.close }));
  const pivots = derivePivots(annotations);

  // Dimensions
  const W = 1200, H = 630;
  const CL = 60, CR = W - 80, CT = 120, CB = H - 100;
  const CW = CR - CL, CH = CB - CT;

  // Price scale
  const entry = keyLevels.entry ?? keyLevels.breakout ?? bars[bars.length - 1].close;
  const sl = keyLevels.stopLoss ?? (isBullish ? entry * 0.97 : entry * 1.03);
  const tp = keyLevels.target ?? (isBullish ? entry * 1.06 : entry * 0.94);

  const allPrices = [...bars.flatMap(b => [b.high, b.low]), entry, sl, tp];
  const pMin_ = Math.min(...allPrices), pMax_ = Math.max(...allPrices);
  const pad = (pMax_ - pMin_) * 0.05 || 1;
  const pMin = pMin_ - pad, pMax = pMax_ + pad, pRange = pMax - pMin;

  const yP = (p: number) => CT + (1 - (p - pMin) / pRange) * CH;
  const barSpacing = CW / bars.length;
  const barW = Math.min(Math.max(barSpacing * 0.6, 3), 16);
  const xB = (i: number) => CL + i * barSpacing + barSpacing / 2;

  const dirColor = isBullish ? "#22c55e" : "#ef4444";
  const dirEmoji = isBullish ? "▲" : "▼";
  const rr = Math.abs(tp - entry) / (Math.abs(sl - entry) || 1);

  // Build SVG parts
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = CT + (CH / 4) * i;
    return <line key={i} x1={CL} y1={y} x2={CR} y2={y} stroke="#ffffff" strokeWidth={0.5} opacity={0.06} />;
  });

  const candleElements = bars.map((bar, i) => {
    const x = xB(i);
    const isGreen = bar.close >= bar.open;
    const fill = isGreen ? "#22c55e" : "#ef4444";
    const bodyTop = yP(Math.max(bar.open, bar.close));
    const bodyBot = yP(Math.min(bar.open, bar.close));
    const bodyH = Math.max(bodyBot - bodyTop, 1);
    return (
      <g key={i}>
        <line x1={x} y1={yP(bar.high)} x2={x} y2={yP(bar.low)} stroke={fill} strokeWidth={1.5} opacity={0.8} />
        <rect x={x - barW / 2} y={bodyTop} width={barW} height={bodyH} fill={fill} rx={1} />
      </g>
    );
  });

  // Formation lines (trendlines, support, resistance) for geometric shapes
  const formationLines = deriveFormationLines(annotations);
  const upperLine = formationLines.find(l => l.role === "upper");
  const lowerLine = formationLines.find(l => l.role === "lower");
  const necklineLine = formationLines.find(l => l.role === "neckline");

  // Pattern zone + zigzag
  const validPivots = pivots.filter(p => p.index >= 0 && p.index < bars.length);

  // Build formation shape overlay
  let formationShapeOverlay = null;
  if (upperLine && lowerLine) {
    // Determine shared x range for the filled shape
    const xStart = Math.max(upperLine.points[0].x, lowerLine.points[0].x);
    const xEnd = Math.min(
      upperLine.points[upperLine.points.length - 1].x,
      lowerLine.points[lowerLine.points.length - 1].x
    );
    const steps = 20;
    const dx = (xEnd - xStart) / steps;
    
    // Build upper contour left→right, then lower contour right→left
    const upperPath: string[] = [];
    const lowerPath: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const xi = xStart + s * dx;
      const uPrice = interpolateLine(upperLine.points, xi);
      const lPrice = interpolateLine(lowerLine.points, xi);
      upperPath.push(`${xB(xi).toFixed(1)},${yP(uPrice).toFixed(1)}`);
      lowerPath.unshift(`${xB(xi).toFixed(1)},${yP(lPrice).toFixed(1)}`);
    }
    const shapePath = [...upperPath, ...lowerPath].join(" ");

    // Draw the trendlines themselves
    const upperLinePath = upperLine.points.map(p => `${xB(p.x).toFixed(1)},${yP(p.y).toFixed(1)}`).join(" ");
    const lowerLinePath = lowerLine.points.map(p => `${xB(p.x).toFixed(1)},${yP(p.y).toFixed(1)}`).join(" ");

    formationShapeOverlay = (
      <g>
        {/* Filled formation zone */}
        <polygon points={shapePath} fill="#38bdf8" opacity={0.08} />
        {/* Upper trendline */}
        <polyline points={upperLinePath} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6} />
        {/* Lower trendline */}
        <polyline points={lowerLinePath} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6} />
      </g>
    );
  } else if (upperLine && !lowerLine) {
    // Single horizontal line (e.g. rectangle resistance only, or neckline)
    const linePath = upperLine.points.map(p => `${xB(p.x).toFixed(1)},${yP(p.y).toFixed(1)}`).join(" ");
    formationShapeOverlay = (
      <polyline points={linePath} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6} />
    );
  }

  // Cup curve for cup-and-handle
  let cupCurveOverlay = null;
  if (isCupPattern(patternType) && upperLine) {
    const rimPrice = upperLine.points[0].y;
    const rimStartX = upperLine.points[0].x;
    const rimEndX = upperLine.points[upperLine.points.length - 1].x;
    // Find cup bottom from support annotation or lowest bar in cup range
    const cupBars = bars.slice(Math.floor(rimStartX), Math.ceil(rimEndX) + 1);
    const cupBottom = Math.min(...cupBars.map(b => b.low));
    const midX = (rimStartX + rimEndX) / 2;
    
    // Quadratic bezier: start at left rim, curve down to cup bottom, back up to right rim
    const sx = xB(rimStartX), sy = yP(rimPrice);
    const ex = xB(rimEndX), ey = yP(rimPrice);
    const cx = xB(midX), cy = yP(cupBottom);
    
    cupCurveOverlay = (
      <g>
        <path
          d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2}
          strokeDasharray="8,4"
          opacity={0.7}
        />
        {/* Cup fill */}
        <path
          d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey} L${ex},${sy} L${sx},${sy} Z`}
          fill="#38bdf8"
          opacity={0.05}
        />
      </g>
    );
  }

  // Neckline overlay (H&S patterns)
  let necklineOverlay = null;
  if (necklineLine) {
    const nlPath = necklineLine.points.map(p => `${xB(p.x).toFixed(1)},${yP(p.y).toFixed(1)}`).join(" ");
    necklineOverlay = (
      <polyline points={nlPath} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="8,4" opacity={0.7} />
    );
  }

  let pivotOverlay = null;
  if (validPivots.length >= 2) {
    const firstIdx = validPivots[0].index;
    const lastIdx = validPivots[validPivots.length - 1].index;
    const zoneX = xB(firstIdx) - barSpacing / 2;
    const zoneW = xB(lastIdx) - zoneX + barSpacing / 2;
    const points = validPivots.map(p => `${xB(p.index).toFixed(1)},${yP(p.price).toFixed(1)}`).join(" ");

    pivotOverlay = (
      <g>
        {/* Zone background only if no formation shape already drawn */}
        {!formationShapeOverlay && !cupCurveOverlay && (
          <rect x={zoneX} y={CT} width={zoneW} height={CH} fill="#38bdf8" opacity={0.06} rx={4} />
        )}
        <text x={zoneX + zoneW / 2} y={CT + 16} textAnchor="middle" fill="#38bdf8" fontSize={10} fontFamily="Arial, Helvetica, sans-serif" fontWeight={600} opacity={0.5}>PATTERN</text>
        <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinejoin="round" opacity={0.7} />
        {validPivots.map((p, i) => (
          <g key={i}>
            <circle cx={xB(p.index)} cy={yP(p.price)} r={4} fill="#38bdf8" opacity={0.8} />
            <circle cx={xB(p.index)} cy={yP(p.price)} r={4} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.4} />
          </g>
        ))}
      </g>
    );
  }

  // Signal arrow
  const lastX = xB(bars.length - 1);
  const lastBar = bars[bars.length - 1];
  const arrowY = isBullish ? yP(lastBar.low) + 18 : yP(lastBar.high) - 18;
  const arrowPath = isBullish
    ? `M${lastX - 8},${arrowY + 12} L${lastX},${arrowY} L${lastX + 8},${arrowY + 12} Z`
    : `M${lastX - 8},${arrowY - 12} L${lastX},${arrowY} L${lastX + 8},${arrowY - 12} Z`;

  // Level lines
  const LevelLine = ({ price, color, label, dash }: { price: number; color: string; label: string; dash?: string }) => {
    const y = yP(price);
    return (
      <g>
        <line x1={CL} y1={y} x2={CR} y2={y} stroke={color} strokeWidth={1.5} strokeDasharray={dash} opacity={0.7} />
        <rect x={CR + 4} y={y - 12} width={W - CR - 10} height={24} rx={4} fill={color} opacity={0.9} />
        <text x={CR + 10} y={y + 4} fill="white" fontSize={11} fontFamily="Courier, monospace" fontWeight={600}>{label} {formatPrice(price)}</text>
      </g>
    );
  };

  const entryY = yP(entry);
  const tpY = yP(tp);
  const slY = yP(sl);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className={className} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id={`bg-${patternType}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1419" />
          <stop offset="100%" stopColor="#1a1f2e" />
        </linearGradient>
        <linearGradient id={`accent-${patternType}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6633" />
          <stop offset="100%" stopColor="#ff8c00" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill={`url(#bg-${patternType})`} />
      <rect x={0} y={0} width={W} height={4} fill={`url(#accent-${patternType})`} />

      {/* Grid */}
      {gridLines}

      {/* Header */}
      <text x={40} y={50} fill="#ffffff" fontSize={28} fontFamily="Arial, Helvetica, sans-serif" fontWeight={700}>{meta.name}</text>
      <text x={40} y={82} fill="#94a3b8" fontSize={18} fontFamily="Arial, Helvetica, sans-serif">Educational · Pattern Study</text>

      {/* Badges */}
      <rect x={W - 200} y={26} width={160} height={36} rx={18} fill={dirColor} opacity={0.15} />
      <text x={W - 120} y={50} fill={dirColor} fontSize={16} fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} textAnchor="middle">{dirEmoji} {isBullish ? "BULLISH" : "BEARISH"}</text>
      <rect x={W - 200} y={72} width={70} height={28} rx={14} fill="#3b82f6" opacity={0.2} />
      <text x={W - 165} y={91} fill="#60a5fa" fontSize={13} fontFamily="Arial, Helvetica, sans-serif" fontWeight={600} textAnchor="middle">{meta.category}</text>
      <rect x={W - 120} y={72} width={80} height={28} rx={14} fill="#8b5cf6" opacity={0.2} />
      <text x={W - 80} y={91} fill="#a78bfa" fontSize={13} fontFamily="Arial, Helvetica, sans-serif" fontWeight={600} textAnchor="middle">R:R {rr.toFixed(1)}</text>

      {/* Chart frame */}
      <rect x={CL} y={CT} width={CW} height={CH} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.08} rx={4} />

      {/* TP/SL zones */}
      <rect x={CL} y={Math.min(entryY, tpY)} width={CW} height={Math.abs(tpY - entryY)} fill="#22c55e" opacity={0.06} />
      <rect x={CL} y={Math.min(entryY, slY)} width={CW} height={Math.abs(slY - entryY)} fill="#ef4444" opacity={0.06} />

      {/* Pattern overlay */}
      {patternOverlay}

      {/* Candlesticks */}
      {candleElements}

      {/* Signal arrow */}
      <path d={arrowPath} fill={dirColor} opacity={0.9} />

      {/* Level lines */}
      <LevelLine price={entry} color="#3b82f6" label="ENTRY" />
      <LevelLine price={sl} color="#ef4444" label="SL" dash="6,4" />
      <LevelLine price={tp} color="#22c55e" label="TP" dash="6,4" />

      {/* Footer */}
      <rect x={0} y={H - 50} width={W} height={50} fill="#0a0e14" opacity={0.8} />
      <text x={40} y={H - 20} fill="#ff6633" fontSize={16} fontFamily="Arial, Helvetica, sans-serif" fontWeight={700}>ChartingPath</text>
      <text x={200} y={H - 20} fill="#64748b" fontSize={13} fontFamily="Arial, Helvetica, sans-serif">chartingpath.com · Live Pattern Detection</text>
      <text x={W - 40} y={H - 20} fill="#475569" fontSize={12} fontFamily="Courier, monospace" textAnchor="end">Entry: {formatPrice(entry)} | SL: {formatPrice(sl)} | TP: {formatPrice(tp)}</text>
    </svg>
  );
};
