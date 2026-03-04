import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Coins, DollarSign, BarChart3, Building2, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import InstrumentLogo from './InstrumentLogo';
import { supabase } from '@/integrations/supabase/client';

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

interface Instrument {
  symbol: string;
  name: string | null;
  asset_type: string;
  exchange: string;
  country: string | null;
  currency: string | null;
}

interface UniversalSymbolSearchProps {
  onSelect: (symbol: string, name: string, category: string) => void;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

const EXCHANGE_SHORT: Record<string, string> = {
  NYSE: 'NYSE',
  NASDAQ: 'NASDAQ',
  HKEX: 'HKEX',
  SGX: 'SGX',
  SET: 'SET',
  SSE: 'SSE',
  SZSE: 'SZSE',
  BINANCE: 'Binance',
  FOREX: 'Forex',
  COMEX: 'COMEX',
  NYMEX: 'NYMEX',
  CBOT: 'CBOT',
  ICE: 'ICE',
  CME: 'CME',
  US_ETF: 'US ETF',
  US_INDEX: 'US Index',
  LSE: 'LSE',
  XETRA: 'XETRA',
  EURONEXT: 'Euronext',
  JPX: 'JPX',
  KRX: 'KRX',
  ASX: 'ASX',
  NSE_INDIA: 'NSE',
  MIL: 'MIL',
  INDEX: 'Index',
  OTHER: 'Other',
};

function getExchangeColor(exchange: string): string {
  switch (exchange) {
    case 'NYSE': return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    case 'NASDAQ': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case 'BINANCE': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
    case 'HKEX': return 'bg-red-500/15 text-red-400 border-red-500/25';
    case 'JPX': return 'bg-rose-500/15 text-rose-400 border-rose-500/25';
    case 'LSE': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25';
    case 'COMEX': case 'NYMEX': case 'CBOT': case 'CME': case 'ICE':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    case 'FOREX': return 'bg-green-500/15 text-green-400 border-green-500/25';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'stocks': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'crypto': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'fx': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'commodities': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'indices': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'etfs': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function UniversalSymbolSearch({ onSelect, trigger, defaultOpen = false }: UniversalSymbolSearchProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType>('all');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load instruments from DB when dialog opens
  useEffect(() => {
    if (!open || allLoaded) return;
    setLoading(true);

    const loadInstruments = async () => {
      // Paginate to get all instruments (beyond 1000-row default)
      let all: Instrument[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('instruments')
          .select('symbol, name, asset_type, exchange, country, currency')
          .eq('is_active', true)
          .order('symbol')
          .range(from, from + PAGE - 1);
        if (error) { console.error('Instrument load error:', error); break; }
        if (!data || data.length === 0) break;
        all = all.concat(data as Instrument[]);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      setInstruments(all);
      setAllLoaded(true);
      setLoading(false);
    };

    loadInstruments();
  }, [open, allLoaded]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filteredInstruments = useMemo(() => {
    let results = instruments;

    if (selectedType !== 'all') {
      results = results.filter(i => i.asset_type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(i =>
        i.symbol.toLowerCase().includes(query) ||
        (i.name && i.name.toLowerCase().includes(query)) ||
        i.exchange.toLowerCase().includes(query)
      );
    }

    return results.slice(0, 80);
  }, [searchQuery, selectedType, instruments]);

  const handleSelect = useCallback((inst: Instrument) => {
    onSelect(inst.symbol, inst.name || inst.symbol, inst.asset_type);
    setOpen(false);
    setSearchQuery('');
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
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
              placeholder="Search by symbol, name, or exchange..."
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
          {loading ? (
            <div className="flex items-center justify-center h-full py-12 text-muted-foreground">
              <p className="text-sm">Loading instruments...</p>
            </div>
          ) : filteredInstruments.length > 0 ? (
            <div className="p-2">
              {filteredInstruments.map((inst) => (
                <button
                  key={inst.symbol}
                  onClick={() => handleSelect(inst)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  <InstrumentLogo
                    instrument={inst.symbol}
                    size="md"
                    showName={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {inst.symbol.replace('=X', '').replace('=F', '').replace('-USD', '')}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${getExchangeColor(inst.exchange)}`}
                      >
                        {EXCHANGE_SHORT[inst.exchange] || inst.exchange}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 capitalize ${getCategoryColor(inst.asset_type)}`}
                      >
                        {inst.asset_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {inst.name || inst.symbol}
                      {inst.currency && <span className="ml-1.5 text-xs opacity-60">• {inst.currency}</span>}
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
          <span>{filteredInstruments.length} of {instruments.length} instruments • Search by name, symbol, or exchange</span>
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
