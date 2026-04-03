/**
 * Post-detection verification for patterns before persistence.
 * Checks ALL required structural and coherence criteria beyond
 * the primary trigger used by individual detectors.
 */

export interface VerificationInput {
  symbol: string;
  pattern_id: string;
  pattern_name?: string;
  timeframe: string;
  direction?: string;
  asset_type?: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio?: number;
  quality_score?: string;
  detected_at?: string;
  bars?: any[];
  current_price?: number;
}

export interface VerificationResult {
  passed: boolean;
  failures: string[];
}

/**
 * Runs a battery of post-detection checks on a pattern occurrence.
 * Returns { passed: true } if all checks pass, or { passed: false, failures: [...reasons] }.
 */
export function verifyPattern(input: VerificationInput): VerificationResult {
  const failures: string[] = [];
  const { entry_price, stop_loss_price, take_profit_price, direction, bars } = input;

  // 1. Price sanity: all trade plan prices must be positive and finite
  if (!isFinite(entry_price) || entry_price <= 0) {
    failures.push(`Invalid entry_price: ${entry_price}`);
  }
  if (!isFinite(stop_loss_price) || stop_loss_price <= 0) {
    failures.push(`Invalid stop_loss_price: ${stop_loss_price}`);
  }
  if (!isFinite(take_profit_price) || take_profit_price <= 0) {
    failures.push(`Invalid take_profit_price: ${take_profit_price}`);
  }

  // 2. TP Coherence Guard: TP must be on the correct side of entry
  if (entry_price > 0 && take_profit_price > 0 && stop_loss_price > 0) {
    const isLong = direction === 'long' || direction === 'bullish';
    const isShort = direction === 'short' || direction === 'bearish';

    if (isLong) {
      if (take_profit_price <= entry_price) {
        failures.push(`TP coherence: long TP (${take_profit_price}) <= entry (${entry_price})`);
      }
      if (stop_loss_price >= entry_price) {
        failures.push(`SL coherence: long SL (${stop_loss_price}) >= entry (${entry_price})`);
      }
    } else if (isShort) {
      if (take_profit_price >= entry_price) {
        failures.push(`TP coherence: short TP (${take_profit_price}) >= entry (${entry_price})`);
      }
      if (stop_loss_price <= entry_price) {
        failures.push(`SL coherence: short SL (${stop_loss_price}) <= entry (${entry_price})`);
      }
    }
  }

  // 3. Extreme Level Filter: SL or TP > 35% from entry
  if (entry_price > 0 && stop_loss_price > 0) {
    const slDrift = Math.abs(stop_loss_price - entry_price) / entry_price;
    if (slDrift > 0.35) {
      failures.push(`Extreme SL: ${(slDrift * 100).toFixed(1)}% from entry (max 35%)`);
    }
  }
  if (entry_price > 0 && take_profit_price > 0) {
    const tpDrift = Math.abs(take_profit_price - entry_price) / entry_price;
    if (tpDrift > 0.35) {
      failures.push(`Extreme TP: ${(tpDrift * 100).toFixed(1)}% from entry (max 35%)`);
    }
  }

  // 4. Risk-Reward sanity: RR must be > 0.5 and < 20
  if (entry_price > 0 && stop_loss_price > 0 && take_profit_price > 0) {
    const risk = Math.abs(entry_price - stop_loss_price);
    const reward = Math.abs(take_profit_price - entry_price);
    if (risk > 0) {
      const rr = reward / risk;
      if (rr < 0.5) {
        failures.push(`RR too low: ${rr.toFixed(2)} (min 0.5)`);
      }
      if (rr > 20) {
        failures.push(`RR implausible: ${rr.toFixed(2)} (max 20)`);
      }
    } else {
      failures.push('Zero risk distance (SL == entry)');
    }
  }

  // 5. Minimum bars: pattern must have at least 5 OHLCV bars
  if (bars && Array.isArray(bars) && bars.length < 5) {
    failures.push(`Insufficient bars: ${bars.length} (min 5)`);
  }

  // 6. Symbol sanity
  if (!input.symbol || input.symbol.trim().length === 0) {
    failures.push('Empty symbol');
  }

  // 7. Quality grade filter: reject grade F patterns
  if (input.quality_score === 'F') {
    failures.push(`Quality grade F rejected`);
  }

  return { passed: failures.length === 0, failures };
}

/**
 * Logs failed verifications to pattern_verification_failures table.
 * Fire-and-forget — does not throw on insert errors.
 */
export async function logVerificationFailures(
  supabase: any,
  failedPatterns: Array<{ input: VerificationInput; failures: string[]; source: string }>
): Promise<void> {
  if (failedPatterns.length === 0) return;

  const rows = failedPatterns.map(({ input, failures, source }) => ({
    symbol: input.symbol,
    pattern_id: input.pattern_id,
    pattern_name: input.pattern_name || null,
    timeframe: input.timeframe,
    direction: input.direction || null,
    asset_type: input.asset_type || null,
    failure_reason: failures.join('; '),
    detection_source: source,
    detection_data: {
      entry_price: input.entry_price,
      stop_loss_price: input.stop_loss_price,
      take_profit_price: input.take_profit_price,
      risk_reward_ratio: input.risk_reward_ratio,
      quality_score: input.quality_score,
    },
    detected_at: input.detected_at || null,
  }));

  try {
    const { error } = await supabase.from('pattern_verification_failures').insert(rows);
    if (error) console.warn('[patternVerification] Failed to log failures:', error.message);
  } catch (e) {
    console.warn('[patternVerification] Log insert error:', e);
  }
}
