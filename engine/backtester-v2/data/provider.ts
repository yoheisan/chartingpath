import { PriceFrame } from "./types";

export interface PriceProvider {
  loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame>;
  loadIntraday(symbol: string, start: string, end: string, interval: "1m"|"5m"): Promise<PriceFrame>;
  loadFX?(pair: string, start: string, end: string, interval?: "1m"|"5m"|"1h"): Promise<PriceFrame>;
}

export interface CacheStore {
  get(key: string): Promise<PriceFrame | null>;
  set(key: string, value: PriceFrame, ttlSec: number): Promise<void>;
}

export function keyOf(fn: string, args: any): string {
  return `${fn}:${JSON.stringify(args)}`;
}