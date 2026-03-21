import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw, 
  ChevronUp, ChevronDown, ArrowUpDown, Clock, Info, Lock, Crown, List, ExternalLink
} from 'lucide-react';
import { getTradingViewAffiliateUrl, getInstrumentCategory } from '@/utils/tradingViewLinks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { useScreenerCaps, PATTERN_DISPLAY_NAMES, ALL_PATTERN_IDS } from '@/hooks/useScreenerCaps';
import { withTimeout } from '@/utils/withTimeout';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { SupportedPatternsList } from '@/components/screener/SupportedPatternsList';
import { EdgeMetricsInline, EdgeMetrics } from '@/components/screener/EdgeMetricsBadge';
import { cn } from '@/lib/utils';
import { 
  ScreenerFilters, 
  ScreenerFiltersState, 
  DEFAULT_SCREENER_FILTERS,
  calculateAgeStats,
  filterByAge,
  recalculateTradePlan,
  DEFAULT_RR,
} from '@/components/screener/ScreenerFilters';

import type { LiveSetup, ScanResult } from '@/types/screener';
import { GRADE_ORDER, getPatternGrade, ASSET_TYPE_LABELS } from '@/types/screener';
import { GradeBadge } from '@/components/ui/GradeBadge';

type AssetType = 'fx' | 'crypto' | 'stocks' | 'commodities';
type SortKey = 'instrument' | 'direction' | 'rr' | 'signal' | 'grade';

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
    count: 25,
    description: '25 futures contracts (metals, energy, agriculture)',
    examples: 'Gold, Silver, Crude Oil, Natural Gas, Corn, Wheat, and 19 more',
  },
};

// Full list of instruments available per asset class (for display purposes)
const AVAILABLE_INSTRUMENTS: Record<AssetType, { symbol: string; name: string }[]> = {
  fx: [
    { symbol: 'EURUSD', name: 'Euro / US Dollar' },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar' },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen' },
    { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar' },
    { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar' },
    { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar' },
    { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc' },
    { symbol: 'EURGBP', name: 'Euro / British Pound' },
    { symbol: 'EURJPY', name: 'Euro / Japanese Yen' },
    { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen' },
    { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen' },
    { symbol: 'EURAUD', name: 'Euro / Australian Dollar' },
    { symbol: 'EURCHF', name: 'Euro / Swiss Franc' },
    { symbol: 'AUDNZD', name: 'Australian Dollar / New Zealand Dollar' },
    { symbol: 'CADJPY', name: 'Canadian Dollar / Japanese Yen' },
    { symbol: 'NZDJPY', name: 'New Zealand Dollar / Japanese Yen' },
    { symbol: 'GBPAUD', name: 'British Pound / Australian Dollar' },
    { symbol: 'GBPCAD', name: 'British Pound / Canadian Dollar' },
    { symbol: 'AUDCAD', name: 'Australian Dollar / Canadian Dollar' },
    { symbol: 'EURCAD', name: 'Euro / Canadian Dollar' },
    { symbol: 'CHFJPY', name: 'Swiss Franc / Japanese Yen' },
    { symbol: 'GBPCHF', name: 'British Pound / Swiss Franc' },
    { symbol: 'EURNZD', name: 'Euro / New Zealand Dollar' },
    { symbol: 'CADCHF', name: 'Canadian Dollar / Swiss Franc' },
    { symbol: 'AUDCHF', name: 'Australian Dollar / Swiss Franc' },
  ],
  crypto: [
    { symbol: 'BTC/USD', name: 'Bitcoin' },
    { symbol: 'ETH/USD', name: 'Ethereum' },
    { symbol: 'SOL/USD', name: 'Solana' },
    { symbol: 'BNB/USD', name: 'Binance Coin' },
    { symbol: 'XRP/USD', name: 'Ripple' },
    { symbol: 'ADA/USD', name: 'Cardano' },
    { symbol: 'AVAX/USD', name: 'Avalanche' },
    { symbol: 'DOGE/USD', name: 'Dogecoin' },
    { symbol: 'LINK/USD', name: 'Chainlink' },
    { symbol: 'MATIC/USD', name: 'Polygon' },
    { symbol: 'DOT/USD', name: 'Polkadot' },
    { symbol: 'SHIB/USD', name: 'Shiba Inu' },
    { symbol: 'LTC/USD', name: 'Litecoin' },
    { symbol: 'UNI/USD', name: 'Uniswap' },
    { symbol: 'ATOM/USD', name: 'Cosmos' },
    { symbol: 'XLM/USD', name: 'Stellar' },
    { symbol: 'NEAR/USD', name: 'NEAR Protocol' },
    { symbol: 'APT/USD', name: 'Aptos' },
    { symbol: 'ARB/USD', name: 'Arbitrum' },
    { symbol: 'OP/USD', name: 'Optimism' },
    { symbol: 'FIL/USD', name: 'Filecoin' },
    { symbol: 'INJ/USD', name: 'Injective' },
    { symbol: 'AAVE/USD', name: 'Aave' },
    { symbol: 'MKR/USD', name: 'Maker' },
    { symbol: 'SAND/USD', name: 'The Sandbox' },
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'BAC', name: 'Bank of America Corp.' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'PFE', name: 'Pfizer Inc.' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.' },
    { symbol: 'MRK', name: 'Merck & Co.' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  ],
  commodities: [
    { symbol: 'GC', name: 'Gold' },
    { symbol: 'SI', name: 'Silver' },
    { symbol: 'CL', name: 'Crude Oil (WTI)' },
    { symbol: 'NG', name: 'Natural Gas' },
    { symbol: 'HG', name: 'Copper' },
    { symbol: 'PL', name: 'Platinum' },
    { symbol: 'PA', name: 'Palladium' },
    { symbol: 'ZC', name: 'Corn' },
    { symbol: 'ZW', name: 'Wheat' },
    { symbol: 'ZS', name: 'Soybeans' },
    { symbol: 'KC', name: 'Coffee' },
    { symbol: 'SB', name: 'Sugar' },
    { symbol: 'CC', name: 'Cocoa' },
    { symbol: 'CT', name: 'Cotton' },
    { symbol: 'LE', name: 'Live Cattle' },
    { symbol: 'HE', name: 'Lean Hogs' },
    { symbol: 'GF', name: 'Feeder Cattle' },
    { symbol: 'ZO', name: 'Oats' },
    { symbol: 'ZR', name: 'Rice' },
    { symbol: 'ZL', name: 'Soybean Oil' },
    { symbol: 'RB', name: 'Gasoline' },
    { symbol: 'HO', name: 'Heating Oil' },
    { symbol: 'BZ', name: 'Brent Crude' },
    { symbol: 'ALI', name: 'Aluminum' },
    { symbol: 'ZN', name: 'US 10-Year Note' },
  ],
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
  'CADCHF': { name: 'Canadian Dollar / Swiss Franc', category: 'fx' },
  'NZDCAD': { name: 'New Zealand Dollar / Canadian Dollar', category: 'fx' },
  'NZDCHF': { name: 'New Zealand Dollar / Swiss Franc', category: 'fx' },
  'SGDJPY': { name: 'Singapore Dollar / Japanese Yen', category: 'fx' },
  'USDHKD': { name: 'US Dollar / Hong Kong Dollar', category: 'fx' },
  'USDSGD': { name: 'US Dollar / Singapore Dollar', category: 'fx' },
  'USDZAR': { name: 'US Dollar / South African Rand', category: 'fx' },
  'USDMXN': { name: 'US Dollar / Mexican Peso', category: 'fx' },
  'USDTRY': { name: 'US Dollar / Turkish Lira', category: 'fx' },
  'USDSEK': { name: 'US Dollar / Swedish Krona', category: 'fx' },
  'USDNOK': { name: 'US Dollar / Norwegian Krone', category: 'fx' },
  'USDDKK': { name: 'US Dollar / Danish Krone', category: 'fx' },
  'USDPLN': { name: 'US Dollar / Polish Zloty', category: 'fx' },
  'USDCZK': { name: 'US Dollar / Czech Koruna', category: 'fx' },
  'USDHUF': { name: 'US Dollar / Hungarian Forint', category: 'fx' },
  'EURPLN': { name: 'Euro / Polish Zloty', category: 'fx' },
  'EURSEK': { name: 'Euro / Swedish Krona', category: 'fx' },
  'EURNOK': { name: 'Euro / Norwegian Krone', category: 'fx' },
  'EURDKK': { name: 'Euro / Danish Krone', category: 'fx' },
  'EURCZK': { name: 'Euro / Czech Koruna', category: 'fx' },
  'EURHUF': { name: 'Euro / Hungarian Forint', category: 'fx' },
  'EURTRY': { name: 'Euro / Turkish Lira', category: 'fx' },
  'EURZAR': { name: 'Euro / South African Rand', category: 'fx' },
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

// InstrumentLogo is now imported from @/components/charts/InstrumentLogo

export default function PatternScreenerTable() {
  const { t } = useTranslation();
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('fx');
  const [filters, setFilters] = useState<ScreenerFiltersState>(DEFAULT_SCREENER_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [sortAsc, setSortAsc] = useState(false);
  const [marketOpen, setMarketOpen] = useState<boolean>(true);
  const [showInstrumentList, setShowInstrumentList] = useState(false);
  const navigate = useNavigate();
  
  // GRADE_ORDER imported from @/types/screener
  
  // Client-side cache for instant asset type switching
  const [cache, setCache] = useState<Record<AssetType, { patterns: LiveSetup[]; scannedAt: string; marketOpen: boolean } | null>>({
    fx: null,
    crypto: null,
    stocks: null,
    commodities: null,
  });
  
  // Get tier-based screener caps
  const { caps, tier, upgradeIncentive, lockedPatterns } = useScreenerCaps();

  const fetchLivePatterns = async (isRefresh = false, selectedAssetType?: AssetType) => {
    const typeToFetch = selectedAssetType ?? assetType;
    
    // Show cached data immediately (optimistic)
    const cachedResult = cache[typeToFetch];
    if (cachedResult && !isRefresh) {
      setPatterns(cachedResult.patterns);
      setLastScanned(cachedResult.scannedAt);
      setMarketOpen(cachedResult.marketOpen);
      setLoading(false);
      // Refresh in background
      setRefreshing(true);
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.info('[PatternScreenerTable] Fetching patterns', {
        assetType: typeToFetch,
        maxTickers: caps.maxTickersPerClass,
        allowedPatterns: caps.allowedPatterns?.length,
        isRefresh,
      });

      // Increase timeout - cold starts can take 15s+, but cached responses are <1s
      const { data, error: fnError } = await withTimeout(
        supabase.functions.invoke<ScanResult>('scan-live-patterns', {
          body: {
            assetType: typeToFetch,
            limit: 50,
            maxTickers: caps.maxTickersPerClass,
            allowedPatterns: caps.allowedPatterns,
          },
        }),
        25_000,
        'scan-live-patterns',
      );
      
      if (fnError) throw fnError;
      
      if (data?.success && data.patterns) {
        setPatterns(data.patterns);
        setLastScanned(data.scannedAt);
        setMarketOpen(data.marketOpen ?? true);
        // Update cache
        setCache(prev => ({
          ...prev,
          [typeToFetch]: {
            patterns: data.patterns,
            scannedAt: data.scannedAt,
            marketOpen: data.marketOpen ?? true,
          }
        }));
      } else {
        setPatterns([]);
        setMarketOpen(data?.marketOpen ?? true);
      }
    } catch (err: any) {
      console.error('[PatternScreenerTable] Error:', err);
      // Only show error if no cached data
      if (!cachedResult) {
        const msg = err?.message?.includes('timed out')
          ? 'Request timed out. Please check your connection and try again.'
          : 'Failed to load patterns';
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on mount and when asset type changes
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

  // getPatternGrade imported from @/types/screener

  // Get unique pattern types for filter dropdown
  const patternOptions = useMemo(() => {
    const counts = new Map<string, number>();
    patterns.forEach(p => {
      counts.set(p.patternId, (counts.get(p.patternId) || 0) + 1);
    });
    return [...new Set(patterns.map(p => p.patternId))].map(id => ({
      id,
      name: patterns.find(p => p.patternId === id)?.patternName || id,
      count: counts.get(id) || 0,
    }));
  }, [patterns]);

  // Calculate filter stats
  const filterStats = useMemo(() => {
    const longCount = patterns.filter(p => p.direction === 'long').length;
    const shortCount = patterns.filter(p => p.direction === 'short').length;
    const withTrend = patterns.filter(p => (p as any).trendAlignment === 'with_trend').length;
    const counterTrend = patterns.filter(p => (p as any).trendAlignment === 'counter_trend').length;
    const neutral = patterns.filter(p => (p as any).trendAlignment === 'neutral' || !(p as any).trendAlignment).length;
    const ageStats = calculateAgeStats(patterns);
    
    // Calculate grade counts
    const gradeA = patterns.filter(p => getPatternGrade(p) === 'A').length;
    const gradeB = patterns.filter(p => getPatternGrade(p) === 'B').length;
    const gradeC = patterns.filter(p => getPatternGrade(p) === 'C').length;
    const gradeD = patterns.filter(p => getPatternGrade(p) === 'D').length;
    const gradeF = patterns.filter(p => getPatternGrade(p) === 'F').length;
    
    return {
      total: patterns.length,
      filtered: 0, // Will be updated after filtering
      longCount,
      shortCount,
      withTrend,
      counterTrend,
      neutral,
      gradeA,
      gradeB,
      gradeC,
      gradeD,
      gradeF,
      ...ageStats,
    };
  }, [patterns]);

  // Filter patterns with advanced filter system
  const filteredPatterns = useMemo(() => {
    let result = patterns.filter(p => {
      if (filters.direction !== 'all' && p.direction !== filters.direction) return false;
      if (filters.pattern !== 'all' && p.patternId !== filters.pattern) return false;
      if (filters.trend !== 'all' && (p as any).trendAlignment !== filters.trend) return false;
      if (filters.grade !== 'all' && getPatternGrade(p) !== filters.grade) return false;
      return true;
    });
    
    // Apply age filter
    result = filterByAge(result, filters.age) as typeof result;
    
    return result;
  }, [patterns, filters]);

  // Update filtered count in stats
  const fullFilterStats = useMemo(() => ({
    ...filterStats,
    filtered: filteredPatterns.length,
  }), [filterStats, filteredPatterns.length]);

  // Group patterns and sort within groups
  const groupedPatterns = useMemo(() => {
    const grouped = filteredPatterns.reduce((acc, setup) => {
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
          case 'grade':
            const gradeA = GRADE_ORDER[getPatternGrade(a)] || 3;
            const gradeB = GRADE_ORDER[getPatternGrade(b)] || 3;
            cmp = gradeA - gradeB;
            break;
        }
        return sortAsc ? cmp : -cmp;
      });
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredPatterns, sortKey, sortAsc, GRADE_ORDER]);

  const handleRowClick = (setup: LiveSetup) => {
    navigate(`/patterns/live?highlight=${encodeURIComponent(setup.instrument)}`);
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortAsc ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  // Skeleton with full UI structure for faster perceived load
  const LoadingSkeleton = () => (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-3 border-b bg-muted/30">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-14" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableHead>
             <TableHead className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
             <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(8)].map((_, i) => (
            <TableRow key={i} className="h-14">
              <TableCell><div className="flex items-center gap-2"><Skeleton className="h-7 w-7 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
              <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <section className="py-12 px-6 bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  Loading...
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Active Pattern Screener</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Scanning {UNIVERSE_INFO[assetType].count} instruments...
              </p>
            </div>
            <div className="flex items-center gap-3">
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
              <Link to="/patterns/live">
                <Button variant="outline" size="sm">
                  Full Screener
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto">
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
              <h2 className="text-2xl font-bold">{t('screener.activePatternScreener')}</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm p-3">
                    <p className="font-medium mb-2">{t('screener.universeCoverage')}</p>
                    <p className="text-sm mb-2">{UNIVERSE_INFO[assetType].description}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">{t('screener.includes')}:</span> {UNIVERSE_INFO[assetType].examples}
                    </p>
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      {t('screener.onlyActiveInstruments')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('screener.scanning', { count: UNIVERSE_INFO[assetType].count, assetType: ASSET_TYPE_LABELS[assetType].toLowerCase() })} • 
              {patterns.length > 0 ? t('screener.showingActive', { count: patterns.length }) : t('screener.noActiveShort')} 
              {!marketOpen && assetType !== 'crypto' && ` ${t('screener.lastSession')}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
                {t('screener.fullScreener')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-6">
          <ScreenerFilters
            patterns={patternOptions}
            filters={filters}
            stats={fullFilterStats}
            onChange={(partial) => setFilters(prev => ({ ...prev, ...partial }))}
            onClear={() => setFilters(DEFAULT_SCREENER_FILTERS)}
          />
        </div>

        {/* Collapsible instrument list */}
        <Collapsible open={showInstrumentList} onOpenChange={setShowInstrumentList}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <List className="h-4 w-4 mr-2" />
              {t('screener.viewAllInstruments', { count: UNIVERSE_INFO[assetType].count, assetType: ASSET_TYPE_LABELS[assetType].toLowerCase() })}
              {showInstrumentList ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mb-6 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                {t('screener.instrumentsDesc', { assetType: ASSET_TYPE_LABELS[assetType].toLowerCase() })}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {AVAILABLE_INSTRUMENTS[assetType].map(({ symbol, name }) => (
                  <div 
                    key={symbol}
                    className="flex items-center gap-2 text-sm p-2 rounded bg-background/50 border border-border/50"
                  >
                    <span className="font-mono font-medium text-foreground">{symbol}</span>
                    <span className="text-muted-foreground text-xs truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Supported Patterns Overview */}
        <div className="mb-6 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('screener.patternsWeDetect')}</span>
              <Badge variant="secondary" className="text-sm">
                {ALL_PATTERN_IDS.length} {t('screener.types')}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {t('screener.clickToFilter')} • {t('screener.lockedPatternsRequireUpgrade')}
            </span>
          </div>
          <SupportedPatternsList
            patternCounts={ALL_PATTERN_IDS.map(patternId => {
              const matching = patterns.filter(p => p.patternId === patternId);
              return {
                patternId,
                count: matching.length,
                longCount: matching.filter(p => p.direction === 'long').length,
                shortCount: matching.filter(p => p.direction === 'short').length,
              };
            })}
            lockedPatterns={lockedPatterns}
            compact={true}
            selectedPattern={filters.pattern !== 'all' ? filters.pattern : undefined}
            blurEdgeMetrics={false}
            onPatternClick={(patternId) => {
              if (filters.pattern === patternId) {
                setFilters(prev => ({ ...prev, pattern: 'all' }));
              } else {
                setFilters(prev => ({ ...prev, pattern: patternId }));
              }
            }}
          />
        </div>

        {error && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('screener.retry')}
            </Button>
          </div>
        )}

        {!error && groupedPatterns.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {filters.pattern !== 'all' 
                ? t('screener.noActiveSignalsFor', { pattern: PATTERN_DISPLAY_NAMES[filters.pattern] || filters.pattern, assetType: ASSET_TYPE_LABELS[assetType] })
                : t('screener.noPatternsFor', { assetType: ASSET_TYPE_LABELS[assetType] })}
              {!marketOpen && assetType !== 'crypto' && ` ${t('screener.marketClosed')}`}
            </p>
            <div className="flex items-center justify-center gap-3">
              {filters.pattern !== 'all' && (
                <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, pattern: 'all' }))}>
                  {t('screener.clearFilter')}
                </Button>
              )}
              <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('screener.refresh')}
              </Button>
            </div>
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
                        {t('screener.symbol')}
                        <SortIcon columnKey="instrument" />
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">{t('screener.pattern')}</TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-center gap-1 cursor-help">
                              {t('screener.grade')}
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('screener.gradeTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort('direction')}
                    >
                      <div className="flex items-center">
                        {t('screener.signal')}
                        <SortIcon columnKey="direction" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-end gap-1 cursor-help">
                              {t('screener.price')}
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('screener.priceTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-end gap-1 cursor-help">
                              {t('screener.chgPercent')}
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('screener.chgPercentTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-end gap-1 cursor-help">
                              {t('screener.winPercent')}
                              <Crown className="h-3 w-3 text-amber-500 opacity-70" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('screener.winRateColumnTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-end gap-1 cursor-help">
                              ROT
                              <Info className="h-3 w-3 opacity-50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm whitespace-normal">
                            <p className="text-xs">Return on Time — R-multiple earned per bar of exposure (expectancy ÷ avg bars). Higher = more capital-efficient.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none text-right whitespace-nowrap"
                      onClick={() => handleSort('signal')}
                    >
                      <div className="flex items-center justify-end">
                        {t('screener.age')}
                        <SortIcon columnKey="signal" />
                      </div>
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedPatterns.map(([patternName, setups]) => (
                    <>
                      {/* Pattern Group Header */}
                      <TableRow key={`header-${patternName}`} className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={10} className="py-2">
                          <span className="font-semibold text-sm">{t(`patternNames.${patternName}`, patternName)}</span>
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
                        
                        // Recalculate trade plan based on default R:R tier
                        const recalculatedPlan = recalculateTradePlan(
                          setup.tradePlan,
                          setup.direction,
                          DEFAULT_RR
                        );
                        
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
                              {t(`patternNames.${setup.patternName}`, setup.patternName)}
                            </TableCell>
                            <TableCell className="text-center">
                              <GradeBadge quality={setup.quality} />
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
                                {isLong ? t('screener.long') : t('screener.short')}
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
                              <EdgeMetricsInline
                                metrics={setup.historicalPerformance ? {
                                  winRate: setup.historicalPerformance.winRate,
                                  avgRMultiple: setup.historicalPerformance.avgRMultiple,
                                  profitFactor: setup.historicalPerformance.profitFactor ?? null,
                                  sampleSize: setup.historicalPerformance.sampleSize,
                                } : null}
                                isLocked={false}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {(() => {
                                const perf = setup.historicalPerformance;
                                if (perf && perf.avgRMultiple && perf.avgDurationBars && perf.avgDurationBars > 0) {
                                  const rot = perf.avgRMultiple / perf.avgDurationBars;
                                  const isHighEfficiency = rot >= 0.01;
                                  return (
                                    <span className={`font-mono text-xs font-medium ${isHighEfficiency ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                      {rot.toFixed(4)}
                                    </span>
                                  );
                                }
                                return <span className="text-muted-foreground text-xs">—</span>;
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-xs ${
                                isFresh ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                              {signalAge}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <a
                                href={getTradingViewAffiliateUrl(setup.instrument)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Open in TradingView"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
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
            {t('screener.educationalDisclaimer')}
          </p>
          <Link to="/patterns/live">
            <Button variant="link" size="sm" className="text-primary">
              {t('screener.viewFullScreener')}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
