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

// ── FX minor pairs for classification ──
const FX_MINOR_KEYWORDS = [
  "TRY", "ZAR", "MXN", "PLN", "HUF", "CZK", "SEK", "NOK", "DKK",
  "SGD", "HKD", "THB", "INR", "KRW", "TWD", "BRL", "CLP", "COP",
  "ILS", "RON",
];

/**
 * Determine slippage bps for a given trade.
 *
 * @param assetType  The raw asset_type from the detection / trade (e.g. "crypto", "stock", "forex")
 * @param symbol     The instrument symbol (used for FX minor classification)
 * @returns          Slippage in basis points
 */
export function getSlippageBps(assetType: string | null, symbol: string): number {
  const at = (assetType || "").toLowerCase();

  // FX minor / exotic classification
  if (at === "forex" || at === "fx" || symbol.endsWith("=X")) {
    const upper = symbol.toUpperCase().replace("=X", "");
    const isMinor = FX_MINOR_KEYWORDS.some((kw) => upper.includes(kw));
    if (isMinor) return SLIPPAGE_BPS["forex_minor"] ?? DEFAULT_SLIPPAGE_BPS;
    return SLIPPAGE_BPS["forex"] ?? DEFAULT_SLIPPAGE_BPS;
  }

  return SLIPPAGE_BPS[at] ?? DEFAULT_SLIPPAGE_BPS;
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
 *
 * @param price       Raw fill price before slippage
 * @param isBuySide   true if the trader is buying at this price
 * @param slippageBps Slippage in basis points
 */
export function applyAdverseSlippage(
  price: number,
  isBuySide: boolean,
  slippageBps: number,
): number {
  const frac = bpsToFraction(slippageBps);
  return isBuySide
    ? price * (1 + frac)   // buying → fill higher (worse)
    : price * (1 - frac);  // selling → fill lower (worse)
}
