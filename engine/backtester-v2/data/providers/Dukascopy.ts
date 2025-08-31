import { PriceProvider } from "../provider";
import { PriceFrame } from "../types";

// NOTE: For MVP, implement a minimal loader that reads locally cached CSVs
// produced by an offline Dukascopy downloader job. (Direct .bi5 parsing is out of scope here.)
export class DukascopyProvider implements PriceProvider {
  constructor(private dataDir: string) {}

  async loadEOD(_symbols: string[], _start: string, _end: string): Promise<PriceFrame> {
    throw new Error("DukascopyProvider.loadEOD not supported");
  }

  async loadIntraday(pair: string, start: string, end: string, interval: "1m"|"5m"): Promise<PriceFrame> {
    // Expect files like: ${dataDir}/${pair}_${interval}.csv with columns: datetime,close
    // For tests, this can be mocked.
    throw new Error("DukascopyProvider.loadIntraday not implemented in stub");
  }

  async loadFX(pair: string, start: string, end: string, interval: "1m"|"5m"|"1h" = "1m"): Promise<PriceFrame> {
    // In a real implementation, this would read CSV files from dataDir
    // For now, return a minimal stub
    throw new Error("DukascopyProvider.loadFX not implemented in stub");
  }
}