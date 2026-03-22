import { MasterPlan } from './useMasterPlan';

export interface PlanAlignment {
  aligned: boolean;
  reasons: string[];
}

/**
 * Check if an instrument/pattern is within a master plan's universe.
 * Returns { aligned: true } if it matches, or { aligned: false, reasons: [...] } if not.
 */
export function checkPlanAlignment(
  plan: MasterPlan | null,
  instrument: {
    symbol: string;
    assetType?: string;
    exchange?: string;
    patternName?: string;
    direction?: string;
  }
): PlanAlignment {
  if (!plan) return { aligned: true, reasons: [] };

  const reasons: string[] = [];

  // 1. Asset class filter
  if (plan.asset_classes?.length > 0 && instrument.assetType) {
    const normalizedAssetType = instrument.assetType.toLowerCase();
    const assetMap: Record<string, string[]> = {
      stocks: ['stock', 'stocks', 'equity'],
      forex: ['fx', 'forex', 'currency'],
      crypto: ['crypto', 'cryptocurrency'],
      commodities: ['commodity', 'commodities'],
      indices: ['index', 'indices'],
      etfs: ['etf', 'etfs'],
    };

    const matched = plan.asset_classes.some((ac) => {
      const aliases = assetMap[ac.toLowerCase()] || [ac.toLowerCase()];
      return aliases.includes(normalizedAssetType);
    });

    if (!matched) {
      reasons.push(`Asset type "${instrument.assetType}" outside plan universe`);
    }
  }

  // 2. Stock exchange filter
  if (plan.stock_exchanges?.length > 0 && instrument.exchange) {
    const normalizedExchange = instrument.exchange.toUpperCase();
    const matched = plan.stock_exchanges.some(
      (ex) => ex.toUpperCase() === normalizedExchange
    );
    if (!matched) {
      reasons.push(`Exchange "${instrument.exchange}" not in plan`);
    }
  }

  // 3. Preferred patterns filter
  if (plan.preferred_patterns?.length > 0 && instrument.patternName) {
    const normalizedPattern = instrument.patternName.toLowerCase().replace(/[-_]/g, ' ');
    const matched = plan.preferred_patterns.some(
      (p) => p.toLowerCase().replace(/[-_]/g, ' ') === normalizedPattern
    );
    if (!matched) {
      reasons.push(`Pattern "${instrument.patternName}" not preferred`);
    }
  }

  // 4. Trend direction filter
  if (
    plan.trend_direction &&
    plan.trend_direction !== 'both' &&
    instrument.direction
  ) {
    const planDir = plan.trend_direction.toLowerCase();
    const instrDir = instrument.direction.toLowerCase();
    // Map bullish->long_only, bearish->short_only
    const dirMatch =
      (planDir === 'long_only' && (instrDir === 'bullish' || instrDir === 'long')) ||
      (planDir === 'short_only' && (instrDir === 'bearish' || instrDir === 'short')) ||
      planDir === instrDir;

    if (!dirMatch) {
      reasons.push(`Direction "${instrument.direction}" conflicts with plan`);
    }
  }

  return {
    aligned: reasons.length === 0,
    reasons,
  };
}

/**
 * Simple helper to determine if a symbol likely belongs to an asset class
 * based on common naming conventions.
 */
export function guessAssetType(symbol: string): string | undefined {
  if (!symbol) return undefined;
  const s = symbol.toUpperCase();
  if (s.endsWith('=X')) return 'forex';
  if (s.endsWith('-USD') || s.endsWith('USDT')) return 'crypto';
  if (s.endsWith('=F')) return 'commodities';
  if (s.startsWith('^')) return 'indices';
  return 'stocks';
}
