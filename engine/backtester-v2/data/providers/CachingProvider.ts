import { CacheStore, PriceProvider, keyOf } from "../provider";
import { PriceFrame } from "../types";

export class MemoryCache implements CacheStore {
  private m = new Map<string, { v: PriceFrame, exp: number }>();
  
  async get(key: string): Promise<PriceFrame | null> {
    const hit = this.m.get(key);
    if (!hit) return null;
    if (hit.exp < Date.now()) { 
      this.m.delete(key); 
      return null; 
    }
    return hit.v;
  }
  
  async set(key: string, value: PriceFrame, ttlSec: number): Promise<void> {
    this.m.set(key, { v: value, exp: Date.now() + ttlSec * 1000 });
  }
}

export class CachingProvider implements PriceProvider {
  constructor(
    private inner: PriceProvider, 
    private cache: CacheStore = new MemoryCache(), 
    private ttlSec = 6 * 3600
  ) {}

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    const key = keyOf("EOD", { symbols, start, end });
    const cached = await this.cache.get(key);
    if (cached) return cached;
    const fresh = await this.inner.loadEOD(symbols, start, end);
    await this.cache.set(key, fresh, this.ttlSec);
    return fresh;
  }

  async loadIntraday(symbol: string, start: string, end: string, interval: "1m"|"5m"): Promise<PriceFrame> {
    const key = keyOf("INTRA", { symbol, start, end, interval });
    const cached = await this.cache.get(key);
    if (cached) return cached;
    const fresh = await this.inner.loadIntraday(symbol, start, end, interval);
    await this.cache.set(key, fresh, this.ttlSec);
    return fresh;
  }

  async loadFX(pair: string, start: string, end: string, interval: "1m"|"5m"|"1h" = "1m"): Promise<PriceFrame> {
    const key = keyOf("FX", { pair, start, end, interval });
    const cached = await this.cache.get(key);
    if (cached) return cached;
    if (!this.inner.loadFX) throw new Error("Underlying provider does not implement loadFX");
    const fresh = await this.inner.loadFX(pair, start, end, interval);
    await this.cache.set(key, fresh, this.ttlSec);
    return fresh;
  }
}