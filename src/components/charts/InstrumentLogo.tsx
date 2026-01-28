import { useState } from 'react';

// Domain mapping for stock logos
const STOCK_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  GOOGL: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  TSLA: 'tesla.com',
  NVDA: 'nvidia.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  JNJ: 'jnj.com',
  WMT: 'walmart.com',
  PG: 'pg.com',
  UNH: 'unitedhealthgroup.com',
  HD: 'homedepot.com',
  BAC: 'bankofamerica.com',
  MA: 'mastercard.com',
  DIS: 'disney.com',
  NFLX: 'netflix.com',
  INTC: 'intel.com',
  AMD: 'amd.com',
  CRM: 'salesforce.com',
  ORCL: 'oracle.com',
  ADBE: 'adobe.com',
  AVGO: 'broadcom.com',
  QCOM: 'qualcomm.com',
  TXN: 'ti.com',
  NOW: 'servicenow.com',
  INTU: 'intuit.com',
  IBM: 'ibm.com',
  PYPL: 'paypal.com',
  UBER: 'uber.com',
  ABNB: 'airbnb.com',
  MU: 'micron.com',
  COIN: 'coinbase.com',
  GS: 'goldmansachs.com',
  MS: 'morganstanley.com',
  C: 'citigroup.com',
  WFC: 'wellsfargo.com',
  AXP: 'americanexpress.com',
  BLK: 'blackrock.com',
  ABBV: 'abbvie.com',
  MRK: 'merck.com',
  LLY: 'lilly.com',
  TMO: 'thermofisher.com',
  ABT: 'abbott.com',
  CVS: 'cvs.com',
  MRNA: 'modernatx.com',
  COST: 'costco.com',
  TGT: 'target.com',
  LOW: 'lowes.com',
  NKE: 'nike.com',
  SBUX: 'starbucks.com',
  MCD: 'mcdonalds.com',
  BA: 'boeing.com',
  CAT: 'caterpillar.com',
  HON: 'honeywell.com',
  UPS: 'ups.com',
  FDX: 'fedex.com',
  LMT: 'lockheedmartin.com',
  GE: 'ge.com',
  CVX: 'chevron.com',
  COP: 'conocophillips.com',
  T: 'att.com',
  VZ: 'verizon.com',
  TMUS: 't-mobile.com',
  F: 'ford.com',
  GM: 'gm.com',
  PFE: 'pfizer.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  CSCO: 'cisco.com',
};

// Instrument metadata with names and categories
interface InstrumentMeta {
  name: string;
  category?: 'crypto' | 'commodity' | 'stock' | 'fx';
}

const INSTRUMENT_METADATA: Record<string, InstrumentMeta> = {
  // Forex pairs - Major
  'EURUSD': { name: 'EUR/USD', category: 'fx' },
  'GBPUSD': { name: 'GBP/USD', category: 'fx' },
  'USDJPY': { name: 'USD/JPY', category: 'fx' },
  'AUDUSD': { name: 'AUD/USD', category: 'fx' },
  'USDCAD': { name: 'USD/CAD', category: 'fx' },
  'USDCHF': { name: 'USD/CHF', category: 'fx' },
  'NZDUSD': { name: 'NZD/USD', category: 'fx' },
  // Forex pairs - Cross
  'EURGBP': { name: 'EUR/GBP', category: 'fx' },
  'EURJPY': { name: 'EUR/JPY', category: 'fx' },
  'GBPJPY': { name: 'GBP/JPY', category: 'fx' },
  'AUDJPY': { name: 'AUD/JPY', category: 'fx' },
  'EURAUD': { name: 'EUR/AUD', category: 'fx' },
  'EURCHF': { name: 'EUR/CHF', category: 'fx' },
  'GBPCHF': { name: 'GBP/CHF', category: 'fx' },
  'CADJPY': { name: 'CAD/JPY', category: 'fx' },
  'CHFJPY': { name: 'CHF/JPY', category: 'fx' },
  'AUDNZD': { name: 'AUD/NZD', category: 'fx' },
  'AUDCAD': { name: 'AUD/CAD', category: 'fx' },
  'NZDJPY': { name: 'NZD/JPY', category: 'fx' },
  'GBPAUD': { name: 'GBP/AUD', category: 'fx' },
  'EURCAD': { name: 'EUR/CAD', category: 'fx' },
  'AUDCHF': { name: 'AUD/CHF', category: 'fx' },
  'EURNZD': { name: 'EUR/NZD', category: 'fx' },
  'GBPNZD': { name: 'GBP/NZD', category: 'fx' },
  'GBPCAD': { name: 'GBP/CAD', category: 'fx' },
  'CADCHF': { name: 'CAD/CHF', category: 'fx' },
  'NZDCAD': { name: 'NZD/CAD', category: 'fx' },
  'NZDCHF': { name: 'NZD/CHF', category: 'fx' },
  // Forex pairs - Exotic
  'USDHKD': { name: 'USD/HKD', category: 'fx' },
  'USDSGD': { name: 'USD/SGD', category: 'fx' },
  'USDZAR': { name: 'USD/ZAR', category: 'fx' },
  'USDMXN': { name: 'USD/MXN', category: 'fx' },
  'USDTRY': { name: 'USD/TRY', category: 'fx' },
  'USDSEK': { name: 'USD/SEK', category: 'fx' },
  'USDNOK': { name: 'USD/NOK', category: 'fx' },
  'USDDKK': { name: 'USD/DKK', category: 'fx' },
  'USDPLN': { name: 'USD/PLN', category: 'fx' },
  'USDCZK': { name: 'USD/CZK', category: 'fx' },
  'USDHUF': { name: 'USD/HUF', category: 'fx' },
  'USDCNH': { name: 'USD/CNH', category: 'fx' },
  'USDTHB': { name: 'USD/THB', category: 'fx' },
  'USDINR': { name: 'USD/INR', category: 'fx' },
  'USDRUB': { name: 'USD/RUB', category: 'fx' },
  'EURHUF': { name: 'EUR/HUF', category: 'fx' },
  'EURPLN': { name: 'EUR/PLN', category: 'fx' },
  'EURCZK': { name: 'EUR/CZK', category: 'fx' },
  'EURSEK': { name: 'EUR/SEK', category: 'fx' },
  'EURNOK': { name: 'EUR/NOK', category: 'fx' },
  'EURTRY': { name: 'EUR/TRY', category: 'fx' },
  'EURZAR': { name: 'EUR/ZAR', category: 'fx' },
  'SGDJPY': { name: 'SGD/JPY', category: 'fx' },
  'EURCNY': { name: 'EUR/CNY', category: 'fx' },
  // Commodities
  'GC': { name: 'Gold', category: 'commodity' },
  'SI': { name: 'Silver', category: 'commodity' },
  'HG': { name: 'Copper', category: 'commodity' },
  'PL': { name: 'Platinum', category: 'commodity' },
  'PA': { name: 'Palladium', category: 'commodity' },
  'CL': { name: 'Crude Oil (WTI)', category: 'commodity' },
  'NG': { name: 'Natural Gas', category: 'commodity' },
  'RB': { name: 'Gasoline', category: 'commodity' },
  'HO': { name: 'Heating Oil', category: 'commodity' },
  'ZC': { name: 'Corn', category: 'commodity' },
  'ZW': { name: 'Wheat', category: 'commodity' },
  'ZS': { name: 'Soybeans', category: 'commodity' },
  'KC': { name: 'Coffee', category: 'commodity' },
  'SB': { name: 'Sugar', category: 'commodity' },
  'CC': { name: 'Cocoa', category: 'commodity' },
  'CT': { name: 'Cotton', category: 'commodity' },
  'ZO': { name: 'Oats', category: 'commodity' },
  'ZR': { name: 'Rice', category: 'commodity' },
  'ZL': { name: 'Soybean Oil', category: 'commodity' },
  'LE': { name: 'Live Cattle', category: 'commodity' },
  'HE': { name: 'Lean Hogs', category: 'commodity' },
  'GF': { name: 'Feeder Cattle', category: 'commodity' },
  'BZ': { name: 'Brent Crude', category: 'commodity' },
  // Crypto
  'BTC': { name: 'Bitcoin', category: 'crypto' },
  'ETH': { name: 'Ethereum', category: 'crypto' },
  'SOL': { name: 'Solana', category: 'crypto' },
  'BNB': { name: 'Binance Coin', category: 'crypto' },
  'XRP': { name: 'Ripple', category: 'crypto' },
  'ADA': { name: 'Cardano', category: 'crypto' },
  'AVAX': { name: 'Avalanche', category: 'crypto' },
  'DOGE': { name: 'Dogecoin', category: 'crypto' },
  'LINK': { name: 'Chainlink', category: 'crypto' },
  'MATIC': { name: 'Polygon', category: 'crypto' },
  'DOT': { name: 'Polkadot', category: 'crypto' },
  'SHIB': { name: 'Shiba Inu', category: 'crypto' },
  'LTC': { name: 'Litecoin', category: 'crypto' },
  'UNI': { name: 'Uniswap', category: 'crypto' },
  'ATOM': { name: 'Cosmos', category: 'crypto' },
  'XLM': { name: 'Stellar', category: 'crypto' },
  'NEAR': { name: 'NEAR Protocol', category: 'crypto' },
  'APT': { name: 'Aptos', category: 'crypto' },
  'ARB': { name: 'Arbitrum', category: 'crypto' },
  'OP': { name: 'Optimism', category: 'crypto' },
  'FIL': { name: 'Filecoin', category: 'crypto' },
  'INJ': { name: 'Injective', category: 'crypto' },
  'AAVE': { name: 'Aave', category: 'crypto' },
  'MKR': { name: 'Maker', category: 'crypto' },
  'SAND': { name: 'The Sandbox', category: 'crypto' },
  // US Stocks
  'AAPL': { name: 'Apple', category: 'stock' },
  'MSFT': { name: 'Microsoft', category: 'stock' },
  'GOOGL': { name: 'Alphabet', category: 'stock' },
  'AMZN': { name: 'Amazon', category: 'stock' },
  'META': { name: 'Meta', category: 'stock' },
  'TSLA': { name: 'Tesla', category: 'stock' },
  'NVDA': { name: 'NVIDIA', category: 'stock' },
  'JPM': { name: 'JPMorgan', category: 'stock' },
  'V': { name: 'Visa', category: 'stock' },
  'JNJ': { name: 'J&J', category: 'stock' },
  'WMT': { name: 'Walmart', category: 'stock' },
  'PG': { name: 'P&G', category: 'stock' },
  'MA': { name: 'Mastercard', category: 'stock' },
  'UNH': { name: 'UnitedHealth', category: 'stock' },
  'HD': { name: 'Home Depot', category: 'stock' },
  'DIS': { name: 'Disney', category: 'stock' },
  'BAC': { name: 'Bank of America', category: 'stock' },
  'XOM': { name: 'Exxon', category: 'stock' },
  'PFE': { name: 'Pfizer', category: 'stock' },
  'KO': { name: 'Coca-Cola', category: 'stock' },
  'PEP': { name: 'PepsiCo', category: 'stock' },
  'CSCO': { name: 'Cisco', category: 'stock' },
  'NFLX': { name: 'Netflix', category: 'stock' },
  'INTC': { name: 'Intel', category: 'stock' },
  'AMD': { name: 'AMD', category: 'stock' },
  'CRM': { name: 'Salesforce', category: 'stock' },
  'ORCL': { name: 'Oracle', category: 'stock' },
  'ADBE': { name: 'Adobe', category: 'stock' },
};

type InstrumentCategory = 'crypto' | 'stock' | 'fx' | 'commodities';

function cleanInstrumentName(instrument: string): string {
  return instrument.replace('-USD', '').replace('=X', '').replace('/USD', '').replace('=F', '');
}

function detectCategory(instrument: string): InstrumentCategory {
  const upper = instrument.toUpperCase();
  if (upper.endsWith('=F')) return 'commodities';
  if (upper.endsWith('=X')) return 'fx';
  if (upper.includes('-USD') || upper.endsWith('USDT')) return 'crypto';
  const ticker = cleanInstrumentName(upper);
  if (STOCK_DOMAINS[ticker]) return 'stock';
  if (upper.length === 6 && !upper.includes('-')) return 'fx';
  return 'stock';
}

function extractTicker(instrument: string): string {
  return instrument
    .toUpperCase()
    .replace('-USD', '')
    .replace('=X', '')
    .replace('=F', '')
    .replace('USDT', '');
}

function getInstrumentMeta(instrument: string): InstrumentMeta | null {
  const ticker = cleanInstrumentName(instrument);
  return INSTRUMENT_METADATA[ticker] || null;
}

function getLogoUrls(ticker: string, category: InstrumentCategory): string[] {
  const urls: string[] = [];

  if (category === 'crypto') {
    const lowerTicker = ticker.toLowerCase();
    urls.push(`https://assets.coingecko.com/coins/images/1/small/${lowerTicker}.png`);
    urls.push(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${lowerTicker}.png`);
    urls.push(`https://cryptologos.cc/logos/${lowerTicker}-${lowerTicker}-logo.png`);
  } else if (category === 'stock') {
    const domain = STOCK_DOMAINS[ticker];
    if (domain) {
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      urls.push(`https://logo.clearbit.com/${domain}`);
    }
  }

  return urls;
}

interface InstrumentLogoProps {
  instrument: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

const SIZES = {
  sm: 'w-5 h-5 text-[8px]',
  md: 'w-7 h-7 text-[10px]',
  lg: 'w-10 h-10 text-xs',
};

export function InstrumentLogo({ instrument, size = 'md', className = '', showName = true }: InstrumentLogoProps) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const category = detectCategory(instrument);
  const ticker = extractTicker(instrument);
  const meta = getInstrumentMeta(instrument);
  const logoUrls = getLogoUrls(ticker, category);
  const initials = ticker.slice(0, 2);
  const sizeClasses = SIZES[size];

  const handleError = () => {
    if (logoIndex < logoUrls.length - 1) {
      setLogoIndex((prev) => prev + 1);
    } else {
      setLogoFailed(true);
    }
  };

  const renderLogo = () => {
    // FX and commodities don't have good logo sources - just show initials
    if (category === 'fx' || category === 'commodities' || logoUrls.length === 0 || logoFailed) {
      return (
        <div
          className={`${sizeClasses} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0`}
        >
          {initials}
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses} rounded-full bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0`}
      >
        <img
          src={logoUrls[logoIndex]}
          alt={ticker}
          className="w-full h-full object-cover"
          onError={handleError}
          loading="lazy"
        />
      </div>
    );
  };

  // If showName is false, just return the logo
  if (!showName) {
    return <div className={className}>{renderLogo()}</div>;
  }

  // Return logo with name
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {renderLogo()}
      {meta?.name && (
        <span className="text-sm text-foreground truncate">
          {meta.name}
        </span>
      )}
      {!meta?.name && (
        <span className="text-sm text-foreground truncate">
          {ticker}
        </span>
      )}
    </div>
  );
}

export default InstrumentLogo;
