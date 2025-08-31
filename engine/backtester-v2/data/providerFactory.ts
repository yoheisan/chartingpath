import { CachingProvider } from "./providers/CachingProvider";
import { EODHDProvider } from "./providers/EODHD";
import { TwelveDataProvider } from "./providers/Twelve";
import { DukascopyProvider } from "./providers/Dukascopy";
import { PriceProvider } from "./provider";

export function createProvider(): PriceProvider {
  const dataProvider = process.env.DATA_PROVIDER || "eodhd";
  const ttlSec = parseInt(process.env.CACHE_TTL_SECONDS || "21600"); // 6h default
  
  let baseProvider: PriceProvider;
  
  switch (dataProvider) {
    case "twelve":
      if (!process.env.TWELVE_API_KEY) {
        throw new Error("TWELVE_API_KEY required for twelve data provider");
      }
      baseProvider = new TwelveDataProvider(process.env.TWELVE_API_KEY);
      break;
    case "dukascopy":
      const dataDir = process.env.DUKASCOPY_DATA_DIR || "./data/dukascopy";
      baseProvider = new DukascopyProvider(dataDir);
      break;
    case "eodhd":
    default:
      if (!process.env.EODHD_API_KEY) {
        throw new Error("EODHD_API_KEY required for EODHD provider");
      }
      baseProvider = new EODHDProvider(process.env.EODHD_API_KEY);
      break;
  }
  
  return new CachingProvider(baseProvider, undefined, ttlSec);
}

export const provider = createProvider();