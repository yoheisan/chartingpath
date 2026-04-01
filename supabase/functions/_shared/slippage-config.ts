/**
 * Slippage configuration per asset class (in basis points).
 *
 * 1 bps = 0.01% = 0.0001 multiplier.
 *
 * To adjust slippage assumptions later, edit ONLY this file.
 */

export const SLIPPAGE_BPS: Record<string, number> = {
  // Crypto majors (BTC, ETH, etc.)
  crypto: 5,

  // Large-cap equities
  stock: 5,
  equity: 5,
  etf: 5,
  index: 5,

  // Mid / small-cap equities — higher spread & thinner books
  stock_smallcap: 15,

  // FX majors (EUR/USD, GBP/USD, USD/JPY, etc.)
  forex: 5,
  fx: 5,

  // FX minors / exotics — wider spreads
  forex_minor: 10,
  fx_minor: 10,

  // Commodities — similar to large-cap
  commodity: 5,
};

/** Default fallback if asset class isn't mapped above */
export const DEFAULT_SLIPPAGE_BPS = 10;

// ── Market-impact surcharge for large positions ──
/** Notional value threshold (USD) above which extra slippage applies */
export const SIZE_IMPACT_THRESHOLD_USD = 5_000;
/** Additional bps added when notional exceeds the threshold */
export const SIZE_IMPACT_EXTRA_BPS = 3;

// ── FX minor pairs for classification ──
const FX_MINOR_KEYWORDS = [
  "TRY", "ZAR", "MXN", "PLN", "HUF", "CZK", "SEK", "NOK", "DKK",
  "SGD", "HKD", "THB", "INR", "KRW", "TWD", "BRL", "CLP", "COP",
  "ILS", "RON",
];

/**
 * Determine base slippage bps for a given asset class / symbol.
 */
export function getSlippageBps(assetType: string | null, symbol: string): number {
  const at = (assetType || "").toLowerCase();

  if (at === "forex" || at === "fx" || symbol.endsWith("=X")) {
    const upper = symbol.toUpperCase().replace("=X", "");
    const isMinor = FX_MINOR_KEYWORDS.some((kw) => upper.includes(kw));
    if (isMinor) return SLIPPAGE_BPS["forex_minor"] ?? DEFAULT_SLIPPAGE_BPS;
    return SLIPPAGE_BPS["forex"] ?? DEFAULT_SLIPPAGE_BPS;
  }

  return SLIPPAGE_BPS[at] ?? DEFAULT_SLIPPAGE_BPS;
}

/**
 * Compute total slippage bps including size-based market impact.
 *
 * @param baseBps       Base slippage from getSlippageBps()
 * @param notionalUsd   Position notional value in USD (price × quantity)
 * @returns             Total slippage bps to apply
 */
export function getTotalSlippageBps(baseBps: number, notionalUsd: number): number {
  if (notionalUsd > SIZE_IMPACT_THRESHOLD_USD) {
    return baseBps + SIZE_IMPACT_EXTRA_BPS;
  }
  return baseBps;
}

/** Convert bps to a multiplier fraction (e.g. 5 bps → 0.0005) */
export function bpsToFraction(bps: number): number {
  return bps / 10_000;
}

/**
 * Apply adverse slippage to a price.
 *
 * For **buys** (entries on longs, exits on shorts covering): price goes UP (worse for buyer).
 * For **sells** (exits on longs, entries on shorts): price goes DOWN (worse for seller).
 */
export function applyAdverseSlippage(
  price: number,
  isBuySide: boolean,
  slippageBps: number,
): number {
  const frac = bpsToFraction(slippageBps);
  return isBuySide
    ? price * (1 + frac)
    : price * (1 - frac);
}
