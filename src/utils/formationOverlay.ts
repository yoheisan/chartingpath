/**
 * Formation Overlay Utility
 * 
 * Derives ZigZag polylines and trendlines from pattern pivots
 * for rendering on Lightweight Charts live pattern views.
 */

import { ZigZagPivot, CompressedBar } from '@/types/VisualSpec';
import { Time } from 'lightweight-charts';
import { calculateDonchianChannels } from '@/utils/chartIndicators';

export interface FormationLineData {
  time: Time;
  value: number;
}

export interface FormationOverlayData {
  /** ZigZag polyline connecting all pivots in chronological order */
  zigzag: FormationLineData[];
  /** Upper trendline through high pivots */
  upperTrend: FormationLineData[];
  /** Lower trendline through low pivots */
  lowerTrend: FormationLineData[];
  /** Whether formation zone can be drawn (needs both upper + lower with 2+ pts) */
  hasZone: boolean;
}

/**
 * Derive formation overlay data from pattern pivots and bars.
 */
export function deriveFormationOverlay(
  pivots: ZigZagPivot[] | undefined,
  bars: CompressedBar[],
  patternId?: string
): FormationOverlayData | null {
  if (!pivots || pivots.length < 2 || bars.length === 0) return null;

  // Sort pivots by index
  const sorted = [...pivots].sort((a, b) => a.index - b.index);

  // Build ZigZag polyline — snap pivot prices to actual candle extremes
  const zigzag: FormationLineData[] = [];
  for (const p of sorted) {
    const resolved = pivotToTimeAndPrice(p, bars);
    if (resolved !== null) {
      zigzag.push({ time: resolved.time, value: resolved.price });
    }
  }

  // Separate high and low pivots
  const highs = sorted.filter(p => p.type === 'high');
  const lows = sorted.filter(p => p.type === 'low');

  const upperTrend: FormationLineData[] = [];
  const lowerTrend: FormationLineData[] = [];

  // For patterns with clear upper/lower structure, extend trendlines
  for (const p of highs) {
    const resolved = pivotToTimeAndPrice(p, bars);
    if (resolved !== null) upperTrend.push({ time: resolved.time, value: resolved.price });
  }
  for (const p of lows) {
    const resolved = pivotToTimeAndPrice(p, bars);
    if (resolved !== null) lowerTrend.push({ time: resolved.time, value: resolved.price });
  }

  // For donchian patterns, compute the 20-period channel as upper/lower zone
  const isDonchian = patternId?.includes('donchian');

  let finalUpper = upperTrend;
  let finalLower = lowerTrend;
  let hasZone = false;

  if (isDonchian && bars.length >= 20) {
    const channel = calculateDonchianChannels(bars, 20);
    finalUpper = channel.map(p => ({ time: p.time as unknown as Time, value: p.upper }));
    finalLower = channel.map(p => ({ time: p.time as unknown as Time, value: p.lower }));
    hasZone = finalUpper.length >= 2 && finalLower.length >= 2;
  } else {
    hasZone = upperTrend.length >= 2 && lowerTrend.length >= 2;
  }

  return {
    zigzag,
    upperTrend: finalUpper,
    lowerTrend: finalLower,
    hasZone,
  };
}

/**
 * Resolve a pivot to a chart Time and snap its price to the actual candle extreme.
 * High pivots snap to bar.h, low pivots snap to bar.l.
 */
function pivotToTimeAndPrice(
  pivot: ZigZagPivot,
  bars: CompressedBar[]
): { time: Time; price: number } | null {
  const barIdx = findPivotBarIndex(pivot, bars);
  if (barIdx < 0) return null;

  const bar = bars[barIdx];
  const time = Math.floor(new Date(bar.t).getTime() / 1000) as unknown as Time;

  // Snap price to candle extreme based on pivot type
  let price = pivot.price;
  if (pivot.type === 'high' && bar.h != null) {
    price = bar.h;
  } else if (pivot.type === 'low' && bar.l != null) {
    price = bar.l;
  }

  return { time, price };
}

/**
 * Convert a pivot point to a chart Time value (legacy, used externally).
 */
function pivotToTime(pivot: ZigZagPivot, bars: CompressedBar[]): Time | null {
  const result = pivotToTimeAndPrice(pivot, bars);
  return result ? result.time : null;
}

/**
 * Find the bar index for a given pivot point.
 */
function findPivotBarIndex(pivot: ZigZagPivot, bars: CompressedBar[]): number {
  // First try using the index to find the bar
  if (Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < bars.length) {
    return pivot.index;
  }
  
  // Fallback to timestamp — find nearest bar
  if (pivot.timestamp) {
    const targetTs = Math.floor(new Date(pivot.timestamp).getTime() / 1000);
    if (!Number.isFinite(targetTs)) return -1;

    let bestIdx = 0;
    let bestDiff = Math.abs(Math.floor(new Date(bars[0].t).getTime() / 1000) - targetTs);
    for (let i = 1; i < bars.length; i++) {
      const barTs = Math.floor(new Date(bars[i].t).getTime() / 1000);
      const diff = Math.abs(barTs - targetTs);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      } else if (diff > bestDiff) {
        break;
      }
    }
    return bestIdx;
  }

  return -1;
}

/**
 * Build interpolated zone polygon points from upper and lower trendlines.
 * Returns pairs of {upper, lower} at each time point for canvas drawing.
 */
/**
 * Snap all formation overlay times to the nearest chart candle time.
 * This prevents zigzag lines and markers from floating in empty space
 * when pattern bar timestamps don't exactly match chart bar timestamps.
 */
/**
 * Find the nearest candle time in sorted chart data to a target unix timestamp.
 * Centralised here so every chart renderer uses the same snapping logic.
 */
export function findNearestCandleTime(data: Array<{ time: unknown }>, targetTs: number): number {
  if (data.length === 0) return targetTs;
  let bestTime = data[0].time as number;
  let bestDiff = Math.abs(bestTime - targetTs);
  for (let i = 1; i < data.length; i++) {
    const t = data[i].time as number;
    const diff = Math.abs(t - targetTs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestTime = t;
    } else if (diff > bestDiff) {
      break; // sorted data, past the minimum
    }
  }
  return bestTime;
}

export function snapFormationToChartTimes(
  formation: FormationOverlayData,
  chartData: Array<{ time: unknown }>
): FormationOverlayData {
  if (chartData.length === 0) return formation;

  const snapTime = (t: Time): Time => {
    const target = t as number;
    let bestTime = chartData[0].time as number;
    let bestDiff = Math.abs(bestTime - target);
    for (let i = 1; i < chartData.length; i++) {
      const ct = chartData[i].time as number;
      const diff = Math.abs(ct - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestTime = ct;
      } else if (diff > bestDiff) {
        break;
      }
    }
    return bestTime as unknown as Time;
  };

  const snapLine = (line: FormationLineData[]): FormationLineData[] =>
    line.map(p => ({ time: snapTime(p.time), value: p.value }));

  return {
    zigzag: snapLine(formation.zigzag),
    upperTrend: snapLine(formation.upperTrend),
    lowerTrend: snapLine(formation.lowerTrend),
    hasZone: formation.hasZone,
  };
}

export function buildZonePoints(
  upperTrend: FormationLineData[],
  lowerTrend: FormationLineData[]
): { time: number; upper: number; lower: number }[] {
  if (upperTrend.length < 2 || lowerTrend.length < 2) return [];

  // Collect all unique time points
  const allTimes = new Set<number>();
  upperTrend.forEach(p => allTimes.add(p.time as number));
  lowerTrend.forEach(p => allTimes.add(p.time as number));
  
  const sortedTimes = [...allTimes].sort((a, b) => a - b);

  // Only include times within the overlapping range
  const upperStart = upperTrend[0].time as number;
  const upperEnd = upperTrend[upperTrend.length - 1].time as number;
  const lowerStart = lowerTrend[0].time as number;
  const lowerEnd = lowerTrend[lowerTrend.length - 1].time as number;

  const rangeStart = Math.max(upperStart, lowerStart);
  const rangeEnd = Math.min(upperEnd, lowerEnd);

  return sortedTimes
    .filter(t => t >= rangeStart && t <= rangeEnd)
    .map(t => ({
      time: t,
      upper: interpolateValue(upperTrend, t),
      lower: interpolateValue(lowerTrend, t),
    }));
}

/**
 * Linear interpolation of value at a given time within a line series.
 */
function interpolateValue(line: FormationLineData[], targetTime: number): number {
  if (line.length === 0) return 0;
  if (line.length === 1) return line[0].value;

  const first = line[0].time as number;
  const last = line[line.length - 1].time as number;

  if (targetTime <= first) return line[0].value;
  if (targetTime >= last) return line[line.length - 1].value;

  // Find surrounding points
  for (let i = 0; i < line.length - 1; i++) {
    const t0 = line[i].time as number;
    const t1 = line[i + 1].time as number;
    if (targetTime >= t0 && targetTime <= t1) {
      const ratio = (targetTime - t0) / (t1 - t0);
      return line[i].value + ratio * (line[i + 1].value - line[i].value);
    }
  }

  return line[line.length - 1].value;
}
