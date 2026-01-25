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

type InstrumentCategory = 'crypto' | 'stock' | 'fx' | 'commodities';

function detectCategory(instrument: string): InstrumentCategory {
  const upper = instrument.toUpperCase();
  if (upper.endsWith('=F')) return 'commodities';
  if (upper.endsWith('=X')) return 'fx';
  if (upper.includes('-USD') || upper.endsWith('USDT')) return 'crypto';
  // Check known stock tickers
  const ticker = upper.replace('-USD', '').replace('=X', '').replace('=F', '');
  if (STOCK_DOMAINS[ticker]) return 'stock';
  // 6-char forex pairs
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
}

const SIZES = {
  sm: 'w-5 h-5 text-[8px]',
  md: 'w-7 h-7 text-[10px]',
  lg: 'w-10 h-10 text-xs',
};

export function InstrumentLogo({ instrument, size = 'md', className = '' }: InstrumentLogoProps) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const category = detectCategory(instrument);
  const ticker = extractTicker(instrument);
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

  // FX and commodities don't have good logo sources - just show initials
  if (category === 'fx' || category === 'commodities' || logoUrls.length === 0) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary ${className}`}
      >
        {initials}
      </div>
    );
  }

  if (logoFailed) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden ${className}`}
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
}

export default InstrumentLogo;
