import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, TrendingUp, Coins, DollarSign, BarChart3, Building2, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import InstrumentLogo from './InstrumentLogo';

// Asset type configuration
type AssetType = 'all' | 'stocks' | 'crypto' | 'fx' | 'commodities' | 'indices' | 'etfs';

interface AssetTypeConfig {
  id: AssetType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel: string;
}

const ASSET_TYPES: AssetTypeConfig[] = [
  { id: 'all', label: 'All', icon: Layers, shortLabel: 'All' },
  { id: 'stocks', label: 'Stocks', icon: Building2, shortLabel: 'Stocks' },
  { id: 'crypto', label: 'Crypto', icon: Coins, shortLabel: 'Crypto' },
  { id: 'fx', label: 'Forex', icon: DollarSign, shortLabel: 'FX' },
  { id: 'commodities', label: 'Commodities', icon: BarChart3, shortLabel: 'Comm' },
  { id: 'indices', label: 'Indices', icon: TrendingUp, shortLabel: 'Index' },
  { id: 'etfs', label: 'ETFs', icon: Layers, shortLabel: 'ETFs' },
];

// Instrument data by category
interface Instrument {
  symbol: string;
  name: string;
  category: Exclude<AssetType, 'all'>;
}

// Comprehensive instrument list (using the screener instruments)
const ALL_INSTRUMENTS: Instrument[] = [
  // Stocks - Mega Cap Tech
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'stocks' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stocks' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stocks' },
  { symbol: 'META', name: 'Meta Platforms Inc.', category: 'stocks' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', category: 'stocks' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', category: 'stocks' },
  { symbol: 'JPM', name: 'JPMorgan Chase', category: 'stocks' },
  { symbol: 'V', name: 'Visa Inc.', category: 'stocks' },
  { symbol: 'MA', name: 'Mastercard Inc.', category: 'stocks' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'stocks' },
  { symbol: 'UNH', name: 'UnitedHealth Group', category: 'stocks' },
  { symbol: 'HD', name: 'Home Depot', category: 'stocks' },
  { symbol: 'PG', name: 'Procter & Gamble', category: 'stocks' },
  { symbol: 'XOM', name: 'Exxon Mobil', category: 'stocks' },
  { symbol: 'BAC', name: 'Bank of America', category: 'stocks' },
  { symbol: 'DIS', name: 'Walt Disney', category: 'stocks' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'stocks' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'stocks' },
  { symbol: 'INTC', name: 'Intel Corporation', category: 'stocks' },
  { symbol: 'CRM', name: 'Salesforce Inc.', category: 'stocks' },
  { symbol: 'ORCL', name: 'Oracle Corporation', category: 'stocks' },
  { symbol: 'ADBE', name: 'Adobe Inc.', category: 'stocks' },
  { symbol: 'PYPL', name: 'PayPal Holdings', category: 'stocks' },
  { symbol: 'UBER', name: 'Uber Technologies', category: 'stocks' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', category: 'stocks' },
  { symbol: 'COIN', name: 'Coinbase Global', category: 'stocks' },
  { symbol: 'SQ', name: 'Block Inc.', category: 'stocks' },
  { symbol: 'SHOP', name: 'Shopify Inc.', category: 'stocks' },
  { symbol: 'SPOT', name: 'Spotify Technology', category: 'stocks' },
  { symbol: 'WMT', name: 'Walmart Inc.', category: 'stocks' },
  { symbol: 'COST', name: 'Costco Wholesale', category: 'stocks' },
  { symbol: 'TGT', name: 'Target Corporation', category: 'stocks' },
  { symbol: 'NKE', name: 'Nike Inc.', category: 'stocks' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', category: 'stocks' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', category: 'stocks' },
  { symbol: 'KO', name: 'Coca-Cola Company', category: 'stocks' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', category: 'stocks' },
  { symbol: 'BA', name: 'Boeing Company', category: 'stocks' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', category: 'stocks' },
  { symbol: 'GE', name: 'GE Aerospace', category: 'stocks' },
  { symbol: 'LMT', name: 'Lockheed Martin', category: 'stocks' },
  { symbol: 'HON', name: 'Honeywell International', category: 'stocks' },
  { symbol: 'UPS', name: 'United Parcel Service', category: 'stocks' },
  { symbol: 'FDX', name: 'FedEx Corporation', category: 'stocks' },
  { symbol: 'CVX', name: 'Chevron Corporation', category: 'stocks' },
  { symbol: 'GS', name: 'Goldman Sachs', category: 'stocks' },
  { symbol: 'MS', name: 'Morgan Stanley', category: 'stocks' },
  
  // Crypto - Top 30
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', category: 'crypto' },
  { symbol: 'SOL-USD', name: 'Solana', category: 'crypto' },
  { symbol: 'BNB-USD', name: 'Binance Coin', category: 'crypto' },
  { symbol: 'XRP-USD', name: 'Ripple', category: 'crypto' },
  { symbol: 'ADA-USD', name: 'Cardano', category: 'crypto' },
  { symbol: 'DOGE-USD', name: 'Dogecoin', category: 'crypto' },
  { symbol: 'AVAX-USD', name: 'Avalanche', category: 'crypto' },
  { symbol: 'LINK-USD', name: 'Chainlink', category: 'crypto' },
  { symbol: 'DOT-USD', name: 'Polkadot', category: 'crypto' },
  { symbol: 'MATIC-USD', name: 'Polygon', category: 'crypto' },
  { symbol: 'LTC-USD', name: 'Litecoin', category: 'crypto' },
  { symbol: 'UNI-USD', name: 'Uniswap', category: 'crypto' },
  { symbol: 'ATOM-USD', name: 'Cosmos', category: 'crypto' },
  { symbol: 'XLM-USD', name: 'Stellar', category: 'crypto' },
  { symbol: 'NEAR-USD', name: 'NEAR Protocol', category: 'crypto' },
  { symbol: 'APT-USD', name: 'Aptos', category: 'crypto' },
  { symbol: 'ARB-USD', name: 'Arbitrum', category: 'crypto' },
  { symbol: 'OP-USD', name: 'Optimism', category: 'crypto' },
  { symbol: 'INJ-USD', name: 'Injective', category: 'crypto' },
  { symbol: 'AAVE-USD', name: 'Aave', category: 'crypto' },
  { symbol: 'MKR-USD', name: 'Maker', category: 'crypto' },
  { symbol: 'FIL-USD', name: 'Filecoin', category: 'crypto' },
  { symbol: 'PEPE-USD', name: 'Pepe', category: 'crypto' },
  { symbol: 'SHIB-USD', name: 'Shiba Inu', category: 'crypto' },
  
  // Forex - Major & Cross Pairs
  { symbol: 'EURUSD=X', name: 'Euro / US Dollar', category: 'fx' },
  { symbol: 'GBPUSD=X', name: 'British Pound / US Dollar', category: 'fx' },
  { symbol: 'USDJPY=X', name: 'US Dollar / Japanese Yen', category: 'fx' },
  { symbol: 'AUDUSD=X', name: 'Australian Dollar / US Dollar', category: 'fx' },
  { symbol: 'USDCAD=X', name: 'US Dollar / Canadian Dollar', category: 'fx' },
  { symbol: 'USDCHF=X', name: 'US Dollar / Swiss Franc', category: 'fx' },
  { symbol: 'NZDUSD=X', name: 'New Zealand Dollar / US Dollar', category: 'fx' },
  { symbol: 'EURGBP=X', name: 'Euro / British Pound', category: 'fx' },
  { symbol: 'EURJPY=X', name: 'Euro / Japanese Yen', category: 'fx' },
  { symbol: 'GBPJPY=X', name: 'British Pound / Japanese Yen', category: 'fx' },
  { symbol: 'AUDJPY=X', name: 'Australian Dollar / Japanese Yen', category: 'fx' },
  { symbol: 'EURAUD=X', name: 'Euro / Australian Dollar', category: 'fx' },
  { symbol: 'EURCHF=X', name: 'Euro / Swiss Franc', category: 'fx' },
  { symbol: 'CADJPY=X', name: 'Canadian Dollar / Japanese Yen', category: 'fx' },
  { symbol: 'CHFJPY=X', name: 'Swiss Franc / Japanese Yen', category: 'fx' },
  { symbol: 'GBPAUD=X', name: 'British Pound / Australian Dollar', category: 'fx' },
  { symbol: 'GBPCAD=X', name: 'British Pound / Canadian Dollar', category: 'fx' },
  { symbol: 'AUDCAD=X', name: 'Australian Dollar / Canadian Dollar', category: 'fx' },
  { symbol: 'EURCAD=X', name: 'Euro / Canadian Dollar', category: 'fx' },
  { symbol: 'AUDNZD=X', name: 'Australian Dollar / New Zealand Dollar', category: 'fx' },
  
  // Commodities
  { symbol: 'GC=F', name: 'Gold', category: 'commodities' },
  { symbol: 'SI=F', name: 'Silver', category: 'commodities' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)', category: 'commodities' },
  { symbol: 'BZ=F', name: 'Brent Crude', category: 'commodities' },
  { symbol: 'NG=F', name: 'Natural Gas', category: 'commodities' },
  { symbol: 'HG=F', name: 'Copper', category: 'commodities' },
  { symbol: 'PL=F', name: 'Platinum', category: 'commodities' },
  { symbol: 'PA=F', name: 'Palladium', category: 'commodities' },
  { symbol: 'ZC=F', name: 'Corn', category: 'commodities' },
  { symbol: 'ZW=F', name: 'Wheat', category: 'commodities' },
  { symbol: 'ZS=F', name: 'Soybeans', category: 'commodities' },
  { symbol: 'KC=F', name: 'Coffee', category: 'commodities' },
  { symbol: 'CC=F', name: 'Cocoa', category: 'commodities' },
  { symbol: 'SB=F', name: 'Sugar', category: 'commodities' },
  { symbol: 'CT=F', name: 'Cotton', category: 'commodities' },
  
  // Indices
  { symbol: '^GSPC', name: 'S&P 500', category: 'indices' },
  { symbol: '^DJI', name: 'Dow Jones Industrial', category: 'indices' },
  { symbol: '^IXIC', name: 'NASDAQ Composite', category: 'indices' },
  { symbol: '^RUT', name: 'Russell 2000', category: 'indices' },
  { symbol: '^VIX', name: 'VIX Volatility', category: 'indices' },
  { symbol: '^FTSE', name: 'FTSE 100', category: 'indices' },
  { symbol: '^GDAXI', name: 'DAX', category: 'indices' },
  { symbol: '^FCHI', name: 'CAC 40', category: 'indices' },
  { symbol: '^N225', name: 'Nikkei 225', category: 'indices' },
  { symbol: '^HSI', name: 'Hang Seng', category: 'indices' },
  
  // ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'etfs' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'etfs' },
  { symbol: 'IWM', name: 'iShares Russell 2000', category: 'etfs' },
  { symbol: 'DIA', name: 'SPDR Dow Jones ETF', category: 'etfs' },
  { symbol: 'GLD', name: 'SPDR Gold Trust', category: 'etfs' },
  { symbol: 'SLV', name: 'iShares Silver Trust', category: 'etfs' },
  { symbol: 'USO', name: 'US Oil Fund', category: 'etfs' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury', category: 'etfs' },
  { symbol: 'XLF', name: 'Financial Select Sector', category: 'etfs' },
  { symbol: 'XLK', name: 'Technology Select Sector', category: 'etfs' },
  { symbol: 'XLE', name: 'Energy Select Sector', category: 'etfs' },
  { symbol: 'XLV', name: 'Health Care Select Sector', category: 'etfs' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', category: 'etfs' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market', category: 'etfs' },
  { symbol: 'VOO', name: 'Vanguard S&P 500', category: 'etfs' },
];

interface UniversalSymbolSearchProps {
  onSelect: (symbol: string, name: string, category: string) => void;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function UniversalSymbolSearch({ onSelect, trigger, defaultOpen = false }: UniversalSymbolSearchProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Filter instruments based on search and type
  const filteredInstruments = useMemo(() => {
    let results = ALL_INSTRUMENTS;
    
    // Filter by type
    if (selectedType !== 'all') {
      results = results.filter(i => i.category === selectedType);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(i => 
        i.symbol.toLowerCase().includes(query) || 
        i.name.toLowerCase().includes(query)
      );
    }
    
    return results.slice(0, 50); // Limit results for performance
  }, [searchQuery, selectedType]);

  const handleSelect = (instrument: Instrument) => {
    onSelect(instrument.symbol, instrument.name, instrument.category);
    setOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stocks': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'crypto': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'fx': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'commodities': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'indices': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'etfs': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Search Symbol
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-3xl w-[95vw] p-0 gap-0 bg-card border-border overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="p-5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search symbols, companies, or instruments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg bg-background border-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Asset Type Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-border bg-muted/30 overflow-x-auto">
          {ASSET_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = selectedType === type.id;
            return (
              <Button
                key={type.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedType(type.id)}
                className={`gap-2 flex-shrink-0 h-9 px-4 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
                <span className="sm:hidden">{type.shortLabel}</span>
              </Button>
            );
          })}
        </div>

        {/* Results */}
        <ScrollArea className="h-[500px]">
          {filteredInstruments.length > 0 ? (
            <div className="p-2">
              {filteredInstruments.map((instrument) => (
                <button
                  key={instrument.symbol}
                  onClick={() => handleSelect(instrument)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  <InstrumentLogo 
                    instrument={instrument.symbol} 
                    size="md" 
                    showName={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {instrument.symbol.replace('=X', '').replace('=F', '').replace('-USD', '')}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 capitalize ${getCategoryColor(instrument.category)}`}
                      >
                        {instrument.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {instrument.name}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      Study
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No instruments found</p>
              <p className="text-sm">Try a different search term or category</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30 text-sm text-muted-foreground flex items-center justify-between">
          <span>{filteredInstruments.length} instruments available • Search across 200+ global markets</span>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
            <span>select</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">esc</kbd>
            <span>close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UniversalSymbolSearch;
