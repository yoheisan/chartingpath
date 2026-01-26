import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw, 
  ChevronUp, ChevronDown, ArrowUpDown, Clock, Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LiveSetup {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: { score: string; reasons: string[] };
  tradePlan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
  };
  bars: any[];
  visualSpec: any;
  // Price data
  currentPrice?: number;
  prevClose?: number;
  changePercent?: number | null;
}

interface ScanResult {
  success: boolean;
  patterns: LiveSetup[];
  scannedAt: string;
  instrumentsScanned: number;
  assetType: string;
  marketOpen?: boolean;
  marketStatus?: 'open' | 'closed';
}

type AssetType = 'fx' | 'crypto' | 'stocks' | 'commodities';
type DirectionFilter = 'all' | 'long' | 'short';
type SortKey = 'instrument' | 'direction' | 'rr' | 'signal';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fx: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
};

// Universe coverage - what instruments are scanned per asset type
const UNIVERSE_INFO: Record<AssetType, { count: number; description: string; examples: string }> = {
  fx: {
    count: 25,
    description: '25 major & cross currency pairs',
    examples: 'EUR/USD, GBP/USD, USD/JPY, EUR/GBP, AUD/JPY, and 20 more',
  },
  crypto: {
    count: 25,
    description: '25 top cryptocurrencies by market cap',
    examples: 'BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, and 16 more',
  },
  stocks: {
    count: 25,
    description: '25 major US equities',
    examples: 'AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA, JPM, and 17 more',
  },
  commodities: {
    count: 20,
    description: '20 futures contracts (metals, energy, agriculture)',
    examples: 'Gold, Silver, Crude Oil, Natural Gas, Corn, Wheat, and 14 more',
  },
};


function cleanInstrumentName(instrument: string): string {
  return instrument.replace('-USD', '').replace('=X', '').replace('/USD', '').replace('=F', '');
}

// Full instrument metadata: name, category, and logo
interface InstrumentMeta {
  name: string;
  category?: 'crypto' | 'commodity' | 'stock' | 'fx';
}

const INSTRUMENT_METADATA: Record<string, InstrumentMeta> = {
  // Commodities - Metals
  'GC': { name: 'Gold', category: 'commodity' },
  'SI': { name: 'Silver', category: 'commodity' },
  'HG': { name: 'Copper', category: 'commodity' },
  'PL': { name: 'Platinum', category: 'commodity' },
  'PA': { name: 'Palladium', category: 'commodity' },
  // Commodities - Energy
  'CL': { name: 'Crude Oil (WTI)', category: 'commodity' },
  'NG': { name: 'Natural Gas', category: 'commodity' },
  'RB': { name: 'Gasoline', category: 'commodity' },
  'HO': { name: 'Heating Oil', category: 'commodity' },
  // Commodities - Agriculture
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
  // Commodities - Livestock
  'LE': { name: 'Live Cattle', category: 'commodity' },
  'HE': { name: 'Lean Hogs', category: 'commodity' },
  'GF': { name: 'Feeder Cattle', category: 'commodity' },
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
  // US Stocks - Top 25
  'AAPL': { name: 'Apple Inc.', category: 'stock' },
  'MSFT': { name: 'Microsoft Corporation', category: 'stock' },
  'GOOGL': { name: 'Alphabet Inc.', category: 'stock' },
  'AMZN': { name: 'Amazon.com Inc.', category: 'stock' },
  'META': { name: 'Meta Platforms Inc.', category: 'stock' },
  'TSLA': { name: 'Tesla Inc.', category: 'stock' },
  'NVDA': { name: 'NVIDIA Corporation', category: 'stock' },
  'JPM': { name: 'JPMorgan Chase & Co.', category: 'stock' },
  'V': { name: 'Visa Inc.', category: 'stock' },
  'JNJ': { name: 'Johnson & Johnson', category: 'stock' },
  'WMT': { name: 'Walmart Inc.', category: 'stock' },
  'PG': { name: 'Procter & Gamble Co.', category: 'stock' },
  'MA': { name: 'Mastercard Inc.', category: 'stock' },
  'UNH': { name: 'UnitedHealth Group', category: 'stock' },
  'HD': { name: 'The Home Depot Inc.', category: 'stock' },
  'DIS': { name: 'The Walt Disney Co.', category: 'stock' },
  'BAC': { name: 'Bank of America Corp.', category: 'stock' },
  'XOM': { name: 'Exxon Mobil Corp.', category: 'stock' },
  'PFE': { name: 'Pfizer Inc.', category: 'stock' },
  'KO': { name: 'Coca-Cola Company', category: 'stock' },
  'PEP': { name: 'PepsiCo Inc.', category: 'stock' },
  'CSCO': { name: 'Cisco Systems Inc.', category: 'stock' },
  'NFLX': { name: 'Netflix Inc.', category: 'stock' },
  'INTC': { name: 'Intel Corporation', category: 'stock' },
  'AMD': { name: 'Advanced Micro Devices', category: 'stock' },
  'CRM': { name: 'Salesforce Inc.', category: 'stock' },
  'ORCL': { name: 'Oracle Corporation', category: 'stock' },
  'ADBE': { name: 'Adobe Inc.', category: 'stock' },
  'AVGO': { name: 'Broadcom Inc.', category: 'stock' },
  'QCOM': { name: 'Qualcomm Inc.', category: 'stock' },
  'TXN': { name: 'Texas Instruments', category: 'stock' },
  'NOW': { name: 'ServiceNow Inc.', category: 'stock' },
  'INTU': { name: 'Intuit Inc.', category: 'stock' },
  'IBM': { name: 'IBM Corporation', category: 'stock' },
  'PYPL': { name: 'PayPal Holdings', category: 'stock' },
  'UBER': { name: 'Uber Technologies', category: 'stock' },
  'ABNB': { name: 'Airbnb Inc.', category: 'stock' },
  'MU': { name: 'Micron Technology', category: 'stock' },
  'COIN': { name: 'Coinbase Global', category: 'stock' },
  'GS': { name: 'Goldman Sachs', category: 'stock' },
  'MS': { name: 'Morgan Stanley', category: 'stock' },
  'C': { name: 'Citigroup Inc.', category: 'stock' },
  'WFC': { name: 'Wells Fargo & Co.', category: 'stock' },
  'AXP': { name: 'American Express', category: 'stock' },
  'BLK': { name: 'BlackRock Inc.', category: 'stock' },
  'ABBV': { name: 'AbbVie Inc.', category: 'stock' },
  'MRK': { name: 'Merck & Co.', category: 'stock' },
  'LLY': { name: 'Eli Lilly & Co.', category: 'stock' },
  'TMO': { name: 'Thermo Fisher Scientific', category: 'stock' },
  'ABT': { name: 'Abbott Laboratories', category: 'stock' },
  'CVS': { name: 'CVS Health Corp.', category: 'stock' },
  'MRNA': { name: 'Moderna Inc.', category: 'stock' },
  'COST': { name: 'Costco Wholesale', category: 'stock' },
  'TGT': { name: 'Target Corporation', category: 'stock' },
  'LOW': { name: 'Lowe\'s Companies', category: 'stock' },
  'NKE': { name: 'Nike Inc.', category: 'stock' },
  'SBUX': { name: 'Starbucks Corp.', category: 'stock' },
  'MCD': { name: 'McDonald\'s Corp.', category: 'stock' },
  'BA': { name: 'Boeing Company', category: 'stock' },
  'CAT': { name: 'Caterpillar Inc.', category: 'stock' },
  'HON': { name: 'Honeywell International', category: 'stock' },
  'UPS': { name: 'United Parcel Service', category: 'stock' },
  'FDX': { name: 'FedEx Corporation', category: 'stock' },
  'LMT': { name: 'Lockheed Martin', category: 'stock' },
  'GE': { name: 'General Electric', category: 'stock' },
  'CVX': { name: 'Chevron Corporation', category: 'stock' },
  'COP': { name: 'ConocoPhillips', category: 'stock' },
  'T': { name: 'AT&T Inc.', category: 'stock' },
  'VZ': { name: 'Verizon Communications', category: 'stock' },
  'TMUS': { name: 'T-Mobile US', category: 'stock' },
  'F': { name: 'Ford Motor Company', category: 'stock' },
  'GM': { name: 'General Motors', category: 'stock' },
  // Forex pairs
  'EURUSD': { name: 'Euro / US Dollar', category: 'fx' },
  'GBPUSD': { name: 'British Pound / US Dollar', category: 'fx' },
  'USDJPY': { name: 'US Dollar / Japanese Yen', category: 'fx' },
  'AUDUSD': { name: 'Australian Dollar / US Dollar', category: 'fx' },
  'USDCAD': { name: 'US Dollar / Canadian Dollar', category: 'fx' },
  'USDCHF': { name: 'US Dollar / Swiss Franc', category: 'fx' },
  'NZDUSD': { name: 'New Zealand Dollar / US Dollar', category: 'fx' },
  'EURGBP': { name: 'Euro / British Pound', category: 'fx' },
  'EURJPY': { name: 'Euro / Japanese Yen', category: 'fx' },
  'GBPJPY': { name: 'British Pound / Japanese Yen', category: 'fx' },
  'AUDJPY': { name: 'Australian Dollar / Japanese Yen', category: 'fx' },
  'EURAUD': { name: 'Euro / Australian Dollar', category: 'fx' },
  'EURCHF': { name: 'Euro / Swiss Franc', category: 'fx' },
  'GBPCHF': { name: 'British Pound / Swiss Franc', category: 'fx' },
  'CADJPY': { name: 'Canadian Dollar / Japanese Yen', category: 'fx' },
  'CHFJPY': { name: 'Swiss Franc / Japanese Yen', category: 'fx' },
  'AUDNZD': { name: 'Australian Dollar / New Zealand Dollar', category: 'fx' },
  'AUDCAD': { name: 'Australian Dollar / Canadian Dollar', category: 'fx' },
  'NZDJPY': { name: 'New Zealand Dollar / Japanese Yen', category: 'fx' },
  'GBPAUD': { name: 'British Pound / Australian Dollar', category: 'fx' },
  'EURCAD': { name: 'Euro / Canadian Dollar', category: 'fx' },
  'AUDCHF': { name: 'Australian Dollar / Swiss Franc', category: 'fx' },
  'EURNZD': { name: 'Euro / New Zealand Dollar', category: 'fx' },
  'GBPNZD': { name: 'British Pound / New Zealand Dollar', category: 'fx' },
  'GBPCAD': { name: 'British Pound / Canadian Dollar', category: 'fx' },
};

function getInstrumentMeta(instrument: string): InstrumentMeta | null {
  const ticker = cleanInstrumentName(instrument);
  return INSTRUMENT_METADATA[ticker] || null;
}

// Comprehensive stock domain mapping for Clearbit logos
const STOCK_DOMAINS: Record<string, string> = {
  // Tech Giants
  'AAPL': 'apple.com', 'MSFT': 'microsoft.com', 'GOOGL': 'google.com', 'GOOG': 'google.com',
  'AMZN': 'amazon.com', 'META': 'meta.com', 'TSLA': 'tesla.com', 'NVDA': 'nvidia.com',
  'NFLX': 'netflix.com', 'AMD': 'amd.com', 'INTC': 'intel.com', 'CSCO': 'cisco.com',
  'ORCL': 'oracle.com', 'IBM': 'ibm.com', 'ADBE': 'adobe.com', 'CRM': 'salesforce.com',
  'AVGO': 'broadcom.com', 'QCOM': 'qualcomm.com', 'TXN': 'ti.com', 'NOW': 'servicenow.com',
  'INTU': 'intuit.com', 'PYPL': 'paypal.com', 'SQ': 'squareup.com', 'SHOP': 'shopify.com',
  'UBER': 'uber.com', 'LYFT': 'lyft.com', 'ABNB': 'airbnb.com', 'SPOT': 'spotify.com',
  'SNAP': 'snap.com', 'PINS': 'pinterest.com', 'TWTR': 'twitter.com', 'ZM': 'zoom.us',
  'DOCU': 'docusign.com', 'OKTA': 'okta.com', 'CRWD': 'crowdstrike.com', 'NET': 'cloudflare.com',
  'SNOW': 'snowflake.com', 'PLTR': 'palantir.com', 'COIN': 'coinbase.com', 'RBLX': 'roblox.com',
  'MU': 'micron.com', 'AMAT': 'appliedmaterials.com', 'LRCX': 'lamresearch.com', 'KLAC': 'kla.com',
  'MRVL': 'marvell.com', 'TEAM': 'atlassian.com', 'WDAY': 'workday.com', 'SPLK': 'splunk.com',
  'DDOG': 'datadoghq.com', 'MDB': 'mongodb.com', 'ZS': 'zscaler.com', 'PANW': 'paloaltonetworks.com',
  // Financial
  'JPM': 'jpmorganchase.com', 'BAC': 'bankofamerica.com', 'WFC': 'wellsfargo.com',
  'GS': 'goldmansachs.com', 'MS': 'morganstanley.com', 'C': 'citigroup.com',
  'V': 'visa.com', 'MA': 'mastercard.com', 'AXP': 'americanexpress.com',
  'BLK': 'blackrock.com', 'SCHW': 'schwab.com', 'USB': 'usbank.com',
  'PNC': 'pnc.com', 'TFC': 'truist.com', 'COF': 'capitalone.com',
  // Healthcare
  'JNJ': 'jnj.com', 'UNH': 'unitedhealthgroup.com', 'PFE': 'pfizer.com',
  'ABBV': 'abbvie.com', 'MRK': 'merck.com', 'LLY': 'lilly.com',
  'BMY': 'bms.com', 'AMGN': 'amgen.com', 'GILD': 'gilead.com',
  'TMO': 'thermofisher.com', 'ABT': 'abbott.com', 'DHR': 'danaher.com',
  'CVS': 'cvs.com', 'CI': 'cigna.com', 'HUM': 'humana.com',
  'ISRG': 'intuitive.com', 'REGN': 'regeneron.com', 'VRTX': 'vrtx.com',
  'MRNA': 'modernatx.com', 'BIIB': 'biogen.com',
  // Consumer
  'WMT': 'walmart.com', 'HD': 'homedepot.com', 'COST': 'costco.com',
  'TGT': 'target.com', 'LOW': 'lowes.com', 'DIS': 'disney.com',
  'NKE': 'nike.com', 'SBUX': 'starbucks.com', 'MCD': 'mcdonalds.com',
  'KO': 'coca-colacompany.com', 'PEP': 'pepsico.com', 'PG': 'pg.com',
  'PM': 'pmi.com', 'MO': 'altria.com', 'KHC': 'kraftheinzcompany.com',
  'MDLZ': 'mondelezinternational.com', 'CL': 'colgatepalmolive.com', 'EL': 'esteelauder.com',
  // Energy
  'XOM': 'exxonmobil.com', 'CVX': 'chevron.com', 'COP': 'conocophillips.com',
  'SLB': 'slb.com', 'EOG': 'eogresources.com', 'PXD': 'pxd.com',
  'OXY': 'oxy.com', 'VLO': 'valero.com', 'PSX': 'phillips66.com',
  // Industrial
  'BA': 'boeing.com', 'CAT': 'cat.com', 'HON': 'honeywell.com',
  'UPS': 'ups.com', 'FDX': 'fedex.com', 'UNP': 'up.com',
  'RTX': 'rtx.com', 'LMT': 'lockheedmartin.com', 'GE': 'ge.com',
  'MMM': '3m.com', 'DE': 'deere.com', 'EMR': 'emerson.com',
  // Telecom & Media
  'T': 'att.com', 'VZ': 'verizon.com', 'TMUS': 't-mobile.com',
  'CMCSA': 'comcast.com', 'CHTR': 'charter.com', 'WBD': 'wbd.com',
  // Auto
  'F': 'ford.com', 'GM': 'gm.com', 'TM': 'toyota.com', 'HMC': 'honda.com',
  'RIVN': 'rivian.com', 'LCID': 'lucidmotors.com',
};

// Generate logo URL based on asset type - using reliable public sources
function getLogoUrls(ticker: string, category?: 'crypto' | 'commodity' | 'stock' | 'fx'): string[] {
  if (category === 'crypto') {
    // CoinGecko-style public CDN - very reliable
    const coinId = getCryptoLogoName(ticker);
    return [
      `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`, // Will be mapped per coin
      `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${ticker.toLowerCase()}.png`,
    ];
  }
  if (category === 'stock') {
    const domain = STOCK_DOMAINS[ticker];
    if (domain) {
      // Use Google favicon as primary - always works and has good quality at 128px
      return [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://logo.clearbit.com/${domain}`,
      ];
    }
  }
  return []; // No logo for FX/commodities - use fallback initials
}

// Helper for crypto logo filenames
function getCryptoLogoName(ticker: string): string {
  const names: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'BNB': 'bnb',
    'XRP': 'xrp', 'ADA': 'cardano', 'AVAX': 'avalanche', 'DOGE': 'dogecoin',
    'LINK': 'chainlink', 'MATIC': 'polygon', 'DOT': 'polkadot', 'SHIB': 'shiba-inu',
    'LTC': 'litecoin', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'XLM': 'stellar',
  };
  return names[ticker] || ticker.toLowerCase();
}

// InstrumentLogo component with multi-source fallback
function InstrumentLogo({ instrument }: { instrument: string }) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);
  
  const ticker = cleanInstrumentName(instrument);
  const meta = getInstrumentMeta(instrument);
  const logoUrls = meta ? getLogoUrls(ticker, meta.category) : [];
  
  const handleError = () => {
    if (logoIndex < logoUrls.length - 1) {
      setLogoIndex(prev => prev + 1);
    } else {
      setLogoFailed(true);
    }
  };
  
  const currentLogoUrl = !logoFailed && logoUrls.length > 0 ? logoUrls[logoIndex] : null;
  
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
        {currentLogoUrl && !logoFailed ? (
          <img 
            src={currentLogoUrl} 
            alt={ticker}
            className="w-full h-full object-cover"
            onError={handleError}
          />
        ) : (
          <span className="text-[10px] font-bold text-primary">
            {ticker.slice(0, 2)}
          </span>
        )}
      </div>
      {meta?.name && (
        <span className="text-sm text-foreground truncate">
          {meta.name}
        </span>
      )}
    </div>
  );
}

export default function PatternScreenerTable() {
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('fx');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [sortAsc, setSortAsc] = useState(false);
  const [marketOpen, setMarketOpen] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchLivePatterns = async (isRefresh = false, selectedAssetType?: AssetType) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    const typeToFetch = selectedAssetType ?? assetType;
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke<ScanResult>('scan-live-patterns', {
        body: { assetType: typeToFetch, limit: 30 },
      });
      
      if (fnError) throw fnError;
      
      if (data?.success && data.patterns) {
        setPatterns(data.patterns);
        setLastScanned(data.scannedAt);
        setMarketOpen(data.marketOpen ?? true);
      } else {
        setPatterns([]);
        setMarketOpen(data?.marketOpen ?? true);
      }
    } catch (err: any) {
      console.error('[PatternScreenerTable] Error:', err);
      setError('Failed to load patterns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLivePatterns(false, assetType);
  }, [assetType]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Filter by direction, then group by pattern, then sort within groups
  const groupedPatterns = useMemo(() => {
    // Apply direction filter
    const filtered = directionFilter === 'all' 
      ? patterns 
      : patterns.filter(p => p.direction === directionFilter);

    const grouped = filtered.reduce((acc, setup) => {
      const key = setup.patternName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(setup);
      return acc;
    }, {} as Record<string, LiveSetup[]>);

    // Sort each group internally
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case 'instrument':
            cmp = a.instrument.localeCompare(b.instrument);
            break;
          case 'direction':
            cmp = a.direction.localeCompare(b.direction);
            break;
          case 'rr':
            cmp = a.tradePlan.rr - b.tradePlan.rr;
            break;
          case 'signal':
            cmp = new Date(b.signalTs).getTime() - new Date(a.signalTs).getTime();
            break;
          default:
            cmp = 0;
        }
        return sortAsc ? cmp : -cmp;
      });
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [patterns, directionFilter, sortKey, sortAsc]);

  const handleRowClick = (setup: LiveSetup) => {
    navigate(`/patterns/live?highlight=${encodeURIComponent(setup.instrument)}`);
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortAsc ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  if (loading) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Active Pattern Screener
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Live Pattern Signals</h2>
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
              {!marketOpen && assetType !== 'crypto' && (
                <Badge variant="secondary" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Market Closed
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {lastScanned ? `Updated ${new Date(lastScanned).toLocaleTimeString()}` : 'Just now'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Active Pattern Screener</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">{UNIVERSE_INFO[assetType].description}</p>
                    <p className="text-xs text-muted-foreground">{UNIVERSE_INFO[assetType].examples}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Scanning {UNIVERSE_INFO[assetType].count} instruments • {!marketOpen && assetType !== 'crypto' 
                ? 'Patterns from last trading session'
                : 'Click any row to view the full chart'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as DirectionFilter)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="long">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    Long
                  </span>
                </SelectItem>
                <SelectItem value="short">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    Short
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchLivePatterns(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/patterns/live">
              <Button variant="outline" size="sm">
                Full Screener
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {!error && groupedPatterns.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No patterns detected for {ASSET_TYPE_LABELS[assetType]} at this time.
              {!marketOpen && assetType !== 'crypto' && ' (Market currently closed)'}
            </p>
            <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {!error && groupedPatterns.length > 0 && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead 
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort('instrument')}
                    >
                      <div className="flex items-center">
                        Symbol
                        <SortIcon columnKey="instrument" />
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Pattern</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort('direction')}
                    >
                      <div className="flex items-center">
                        Signal
                        <SortIcon columnKey="direction" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-end gap-1 cursor-help">
                              Price
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Previous session close price. Daily data only—intraday movements are not reflected.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-end gap-1 cursor-help">
                              Chg %
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">Change from the prior session's close. Does not include today's price action.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none text-right whitespace-nowrap"
                      onClick={() => handleSort('rr')}
                    >
                      <div className="flex items-center justify-end">
                        R:R
                        <SortIcon columnKey="rr" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none text-right whitespace-nowrap"
                      onClick={() => handleSort('signal')}
                    >
                      <div className="flex items-center justify-end">
                        Age
                        <SortIcon columnKey="signal" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedPatterns.map(([patternName, setups]) => (
                    <>
                      {/* Pattern Group Header */}
                      <TableRow key={`header-${patternName}`} className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={7} className="py-2">
                          <span className="font-semibold text-sm">{patternName}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {setups.length}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {/* Pattern Rows */}
                      {setups.map((setup, idx) => {
                        const isLong = setup.direction === 'long';
                        const signalAge = formatSignalAgeSimple(setup.signalTs);
                        // Fresh if less than 2 days old
                        const isFresh = signalAge.endsWith('m') || signalAge.endsWith('h') || signalAge === '1d';
                        
                        return (
                          <TableRow 
                            key={`${setup.instrument}-${setup.patternId}-${idx}`}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleRowClick(setup)}
                          >
                            <TableCell>
                              <InstrumentLogo instrument={setup.instrument} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {setup.patternName}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={`font-medium ${
                                  isLong 
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' 
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                }`}
                              >
                                {isLong ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {isLong ? 'Long' : 'Short'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono text-sm">
                                {setup.currentPrice != null 
                                  ? setup.currentPrice.toLocaleString(undefined, { 
                                      minimumFractionDigits: setup.currentPrice < 10 ? 4 : 2,
                                      maximumFractionDigits: setup.currentPrice < 10 ? 4 : 2
                                    })
                                  : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {setup.changePercent != null ? (
                                <span className={`font-mono text-sm font-medium ${
                                  setup.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {setup.changePercent >= 0 ? '+' : ''}{setup.changePercent.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold ${
                                setup.tradePlan.rr >= 2 ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                                {setup.tradePlan.rr.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-xs ${
                                isFresh ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                              {signalAge}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            For educational purposes only. Past patterns don't guarantee future results.
          </p>
          <Link to="/patterns/live">
            <Button variant="link" size="sm" className="text-primary">
              View full screener
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
