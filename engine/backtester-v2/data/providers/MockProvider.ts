import { PriceProvider } from "../provider";
import { PriceFrame } from "../types";

export class MockProvider implements PriceProvider {
  constructor(private frames: Record<string, PriceFrame>) {}
  
  async loadEOD(symbols: string[], _s: string, _e: string): Promise<PriceFrame> {
    // Merge by dates into wide frame
    const first = this.frames[symbols[0]];
    if (!first) throw new Error(`Mock data not found for ${symbols[0]}`);
    
    const allDates = first.index;
    const data = allDates.map((_, i) => symbols.map(sym => {
      const frame = this.frames[sym];
      return frame ? frame.data[i][0] : NaN;
    }));
    return { index: allDates, columns: symbols, data };
  }
  
  async loadIntraday(symbol: string, _s: string, _e: string): Promise<PriceFrame> {
    const frame = this.frames[symbol];
    if (!frame) throw new Error(`Mock data not found for ${symbol}`);
    return frame;
  }

  async loadFX(pair: string, _start: string, _end: string, _interval?: "1m"|"5m"|"1h"): Promise<PriceFrame> {
    const frame = this.frames[pair];
    if (!frame) throw new Error(`Mock data not found for ${pair}`);
    return frame;
  }
}