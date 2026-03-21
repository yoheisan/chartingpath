import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FlaskConical, AlertCircle, Loader2, Coins, Database, TrendingUp, TrendingDown, Lock, Search, X, Shield, Flame, Target, Info, Eye, ChevronDown, Zap, Code2, ArrowRight, CheckCircle2, Settings, Sparkles } from 'lucide-react';
import { CopilotSidebar } from '@/components/copilot/CopilotSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import { PLANS_CONFIG, TIER_DISPLAY, type PlanTier } from '@/config/plans';
import { GradeBadge, GRADE_CONFIG, type GradeLetter } from '@/components/ui/GradeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/hooks/useAuthGate';
import { AuthGateDialog } from '@/components/AuthGateDialog';
import { PageMeta } from '@/components/PageMeta';
import { 
  DATA_COVERAGE, 
  getValidLookbackOptions, 
  getDefaultLookback, 
  getCoverageInfo,
  clampLookback,
  type Timeframe 
} from '@/config/dataCoverageContract';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Pattern options - matches screener's pattern registry
const PATTERNS = [
  // Base Patterns
  { id: 'double-bottom', name: 'Double Bottom', direction: 'bullish' },
  { id: 'double-top', name: 'Double Top', direction: 'bearish' },
  { id: 'triple-bottom', name: 'Triple Bottom', direction: 'bullish' },
  { id: 'triple-top', name: 'Triple Top', direction: 'bearish' },
  { id: 'ascending-triangle', name: 'Ascending Triangle', direction: 'bullish' },
  { id: 'descending-triangle', name: 'Descending Triangle', direction: 'bearish' },
  { id: 'symmetrical-triangle', name: 'Symmetrical Triangle', direction: 'neutral' },
  // Extended Patterns
  { id: 'head-and-shoulders', name: 'Head & Shoulders', direction: 'bearish' },
  { id: 'inverse-head-and-shoulders', name: 'Inverse Head & Shoulders', direction: 'bullish' },
  { id: 'rising-wedge', name: 'Rising Wedge', direction: 'bearish' },
  { id: 'falling-wedge', name: 'Falling Wedge', direction: 'bullish' },
  // Premium Patterns
  { id: 'bullish-flag', name: 'Bull Flag', direction: 'bullish' },
  { id: 'bearish-flag', name: 'Bear Flag', direction: 'bearish' },
  { id: 'cup-and-handle', name: 'Cup & Handle', direction: 'bullish' },
  { id: 'inverse-cup-and-handle', name: 'Inverse Cup & Handle', direction: 'bearish' },
  { id: 'donchian-breakout-long', name: 'Donchian Breakout (Long)', direction: 'bullish' },
  { id: 'donchian-breakout-short', name: 'Donchian Breakout (Short)', direction: 'bearish' },
];

// Instrument universe - synced with screenerInstruments.ts
const INSTRUMENTS: Record<string, { symbol: string; yahooSymbol: string; name: string }[]> = {
  fx: [
    { symbol: 'EUR/USD', yahooSymbol: 'EURUSD=X', name: 'Euro / US Dollar' },
    { symbol: 'GBP/USD', yahooSymbol: 'GBPUSD=X', name: 'British Pound / US Dollar' },
    { symbol: 'USD/JPY', yahooSymbol: 'USDJPY=X', name: 'US Dollar / Japanese Yen' },
    { symbol: 'USD/CHF', yahooSymbol: 'USDCHF=X', name: 'US Dollar / Swiss Franc' },
    { symbol: 'AUD/USD', yahooSymbol: 'AUDUSD=X', name: 'Australian Dollar / US Dollar' },
    { symbol: 'USD/CAD', yahooSymbol: 'USDCAD=X', name: 'US Dollar / Canadian Dollar' },
    { symbol: 'NZD/USD', yahooSymbol: 'NZDUSD=X', name: 'New Zealand Dollar / US Dollar' },
    { symbol: 'EUR/GBP', yahooSymbol: 'EURGBP=X', name: 'Euro / British Pound' },
    { symbol: 'EUR/JPY', yahooSymbol: 'EURJPY=X', name: 'Euro / Japanese Yen' },
    { symbol: 'GBP/JPY', yahooSymbol: 'GBPJPY=X', name: 'British Pound / Japanese Yen' },
    { symbol: 'AUD/JPY', yahooSymbol: 'AUDJPY=X', name: 'Australian Dollar / Japanese Yen' },
    { symbol: 'EUR/AUD', yahooSymbol: 'EURAUD=X', name: 'Euro / Australian Dollar' },
  ],
  crypto: [
    { symbol: 'BTC/USD', yahooSymbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH/USD', yahooSymbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'BNB/USD', yahooSymbol: 'BNB-USD', name: 'BNB' },
    { symbol: 'XRP/USD', yahooSymbol: 'XRP-USD', name: 'XRP' },
    { symbol: 'SOL/USD', yahooSymbol: 'SOL-USD', name: 'Solana' },
    { symbol: 'ADA/USD', yahooSymbol: 'ADA-USD', name: 'Cardano' },
    { symbol: 'DOGE/USD', yahooSymbol: 'DOGE-USD', name: 'Dogecoin' },
    { symbol: 'AVAX/USD', yahooSymbol: 'AVAX-USD', name: 'Avalanche' },
    { symbol: 'LINK/USD', yahooSymbol: 'LINK-USD', name: 'Chainlink' },
    { symbol: 'DOT/USD', yahooSymbol: 'DOT-USD', name: 'Polkadot' },
    { symbol: 'MATIC/USD', yahooSymbol: 'MATIC-USD', name: 'Polygon' },
    { symbol: 'LTC/USD', yahooSymbol: 'LTC-USD', name: 'Litecoin' },
  ],
  stocks: [
    { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', yahooSymbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', yahooSymbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', yahooSymbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', yahooSymbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'JPM', yahooSymbol: 'JPM', name: 'JPMorgan Chase' },
    { symbol: 'V', yahooSymbol: 'V', name: 'Visa Inc.' },
    { symbol: 'UNH', yahooSymbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'HD', yahooSymbol: 'HD', name: 'Home Depot' },
    { symbol: 'PG', yahooSymbol: 'PG', name: 'Procter & Gamble' },
  ],
  commodities: [
    { symbol: 'GC=F', yahooSymbol: 'GC=F', name: 'Gold Futures' },
    { symbol: 'SI=F', yahooSymbol: 'SI=F', name: 'Silver Futures' },
    { symbol: 'CL=F', yahooSymbol: 'CL=F', name: 'Crude Oil WTI' },
    { symbol: 'NG=F', yahooSymbol: 'NG=F', name: 'Natural Gas' },
    { symbol: 'HG=F', yahooSymbol: 'HG=F', name: 'Copper' },
    { symbol: 'PL=F', yahooSymbol: 'PL=F', name: 'Platinum' },
    { symbol: 'PA=F', yahooSymbol: 'PA=F', name: 'Palladium' },
    { symbol: 'ZC=F', yahooSymbol: 'ZC=F', name: 'Corn Futures' },
    { symbol: 'ZW=F', yahooSymbol: 'ZW=F', name: 'Wheat Futures' },
    { symbol: 'ZS=F', yahooSymbol: 'ZS=F', name: 'Soybean Futures' },
  ],
  indices: [
    { symbol: '^GSPC', yahooSymbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', yahooSymbol: '^DJI', name: 'Dow Jones Industrial' },
    { symbol: '^IXIC', yahooSymbol: '^IXIC', name: 'NASDAQ Composite' },
    { symbol: '^RUT', yahooSymbol: '^RUT', name: 'Russell 2000' },
    { symbol: '^VIX', yahooSymbol: '^VIX', name: 'VIX Volatility' },
    { symbol: '^FTSE', yahooSymbol: '^FTSE', name: 'FTSE 100' },
    { symbol: '^GDAXI', yahooSymbol: '^GDAXI', name: 'DAX 40' },
    { symbol: '^N225', yahooSymbol: '^N225', name: 'Nikkei 225' },
    { symbol: '^HSI', yahooSymbol: '^HSI', name: 'Hang Seng' },
  ],
  etfs: [
    { symbol: 'SPY', yahooSymbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', yahooSymbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'IWM', yahooSymbol: 'IWM', name: 'iShares Russell 2000' },
    { symbol: 'DIA', yahooSymbol: 'DIA', name: 'SPDR Dow Jones ETF' },
    { symbol: 'GLD', yahooSymbol: 'GLD', name: 'SPDR Gold Shares' },
    { symbol: 'SLV', yahooSymbol: 'SLV', name: 'iShares Silver Trust' },
    { symbol: 'USO', yahooSymbol: 'USO', name: 'United States Oil Fund' },
    { symbol: 'TLT', yahooSymbol: 'TLT', name: 'iShares 20+ Year Treasury' },
    { symbol: 'XLF', yahooSymbol: 'XLF', name: 'Financial Select Sector' },
    { symbol: 'XLE', yahooSymbol: 'XLE', name: 'Energy Select Sector' },
    { symbol: 'ARKK', yahooSymbol: 'ARKK', name: 'ARK Innovation ETF' },
  ],
};

// Asset class display names
// Asset class labels will be translated via t()
const ASSET_CLASS_KEYS: Record<string, string> = {
  fx: 'Forex',
  crypto: 'Cryptocurrency',
  stocks: 'Stocks',
  commodities: 'Commodities',
  indices: 'Indices',
  etfs: 'ETFs',
};

// Timeframes - synced with seeded data (15m, 1h, 4h, 8h, 1d, 1wk)
const TIMEFRAMES = [
  { value: '15m', labelKey: 'patternLabWizard.tf15m', maxYears: 0.16, hintKey: 'patternLabWizard.yearsMax' },
  { value: '1h', labelKey: 'patternLabWizard.tf1h', maxYears: 2, hintKey: 'patternLabWizard.yearsMax' },
  { value: '4h', labelKey: 'patternLabWizard.tf4h', maxYears: 2, hintKey: 'patternLabWizard.yearsMax' },
  { value: '8h', labelKey: 'patternLabWizard.tf8h', maxYears: 2, hintKey: 'patternLabWizard.yearsMax' },
  { value: '1d', labelKey: 'patternLabWizard.tf1d', maxYears: 5, hintKey: 'patternLabWizard.yearsMax' },
  { value: '1wk', labelKey: 'patternLabWizard.tf1wk', maxYears: 7, hintKey: 'patternLabWizard.yearsMax' },
];

// LOOKBACK_OPTIONS now derived from dataCoverageContract - removed static array

// Grade filter presets for risk appetite
type GradePreset = 'conservative' | 'moderate' | 'aggressive' | 'custom';

// Grade presets - labels/descriptions resolved via t() at render time
const GRADE_PRESET_CONFIG: Record<GradePreset, { grades: GradeLetter[]; labelKey: string; descKey: string; icon: React.ElementType }> = {
  conservative: {
    grades: ['A', 'B'],
    labelKey: 'patternLabWizard.conservativePreset',
    descKey: 'patternLabWizard.conservativeDesc',
    icon: Shield,
  },
  moderate: {
    grades: ['A', 'B', 'C'],
    labelKey: 'patternLabWizard.moderatePreset',
    descKey: 'patternLabWizard.moderateDesc',
    icon: Target,
  },
  aggressive: {
    grades: ['A', 'B', 'C', 'D', 'F'],
    labelKey: 'patternLabWizard.aggressivePreset',
    descKey: 'patternLabWizard.aggressiveDesc',
    icon: Flame,
  },
  custom: {
    grades: [],
    labelKey: 'patternLabWizard.qualityFilter',
    descKey: '',
    icon: Target,
  },
};

interface EstimateResult {
  creditsEstimated: number;
  instrumentCount: number;
  patternCount: number;
  allowed: boolean;
  reason: string | null;
  errors: string[];
  creditsBalance: number;
  cacheHitRatio: number;
  tier: PlanTier;
}

// Mode: validate = confirm a live signal; automate = full backtest → script
type PatternLabMode = 'validate' | 'automate' | null;

const PatternLabWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [showCopilot, setShowCopilot] = useState(false);
  const isMobile = useIsMobile();
  
  // Check if we have prefilled state from a previous run
  const prefilledState = location.state as {
    instruments?: string[];
    patterns?: string[];
    gradeFilter?: string[];
    timeframe?: string;
    lookbackYears?: number;
    riskPerTrade?: number;
    backUrl?: string;
    backLabel?: string;
  } | null;

  // Mode selection — null = show picker, otherwise proceed to form
  const urlMode = searchParams.get('mode') as PatternLabMode;
  const [mode, setMode] = useState<PatternLabMode>(urlMode || null);

  // Also support URL query params from "Run Backtest" CTAs in chart viewers
  // ?instrument=EURUSD=X&pattern=donchian-breakout-long&timeframe=1d
  const urlInstrument = searchParams.get('instrument');
  const urlPattern = searchParams.get('pattern');
  // Normalize timeframe to lowercase to match DATA_COVERAGE keys (e.g. '1D' -> '1d', '1W' -> '1wk')
  const rawUrlTimeframe = searchParams.get('timeframe');
  const urlGrade = searchParams.get('grade')?.toUpperCase() as GradeLetter | null;
  const normalizeTimeframe = (tf: string | null): string | null => {
    if (!tf) return null;
    const map: Record<string, string> = { '1D': '1d', '1W': '1wk', '1H': '1h', '4H': '4h', '8H': '8h', '15M': '15m', '5M': '5m', '1M': '1M' };
    return map[tf] ?? tf.toLowerCase();
  };
  const urlTimeframe = normalizeTimeframe(rawUrlTimeframe);
  
  // Form state - prefer URL params > location state > defaults
  const [assetClass, setAssetClass] = useState('fx');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(
    urlInstrument ? [urlInstrument] : (prefilledState?.instruments ?? ['EURUSD=X'])
  );
  const [timeframe, setTimeframe] = useState(
    urlTimeframe ?? prefilledState?.timeframe ?? '1d'
  );
  const [lookbackYears, setLookbackYears] = useState(prefilledState?.lookbackYears ?? 3);
  // Professional risk per trade tiers: 0.5% (conservative), 1% (standard), 2% (aggressive)
  const [riskPerTrade, setRiskPerTrade] = useState(prefilledState?.riskPerTrade ?? 1);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(
    urlPattern ? [urlPattern] : (prefilledState?.patterns ?? ['double-bottom'])
  );
  
  // Grade filter state - derive preset from gradeFilter if available
  const getPresetFromGrades = (grades: string[]): GradePreset => {
    const sorted = [...grades].sort().join(',');
    if (sorted === 'A,B') return 'conservative';
    if (sorted === 'A,B,C') return 'moderate';
    if (sorted === 'A,B,C,D,F') return 'aggressive';
    return 'custom';
  };
  
  // If a specific grade came via URL (from screener/copilot), include it + grades above it
  const gradeHierarchy: GradeLetter[] = ['A', 'B', 'C', 'D', 'F'];
  const urlGradeFilter: GradeLetter[] | null = urlGrade 
    ? gradeHierarchy.slice(0, gradeHierarchy.indexOf(urlGrade as GradeLetter) + 1) as GradeLetter[]
    : null;

  const [gradePreset, setGradePreset] = useState<GradePreset>(
    urlGradeFilter ? getPresetFromGrades(urlGradeFilter) :
    prefilledState?.gradeFilter ? getPresetFromGrades(prefilledState.gradeFilter) : 'moderate'
  );
  const [selectedGrades, setSelectedGrades] = useState<GradeLetter[]>(
    urlGradeFilter ?? (prefilledState?.gradeFilter as GradeLetter[]) ?? ['A', 'B', 'C']
  );
  
  // UI state
  const [isEstimating, setIsEstimating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<PlanTier>('FREE');
  // In validate mode, collapse by default (user arrives pre-filled); in automate, expand
  const isValidate = mode === 'validate';
  const [paramsOpen, setParamsOpen] = useState(!isValidate && !urlInstrument);
  const [patternsOpen, setPatternsOpen] = useState(!isValidate && !urlPattern);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // Advanced strategy controls
  const [targetGainPercent, setTargetGainPercent] = useState(3);
  const [stopLossPercent, setStopLossPercent] = useState(1.5);
  const [maxOpenPositions, setMaxOpenPositions] = useState(3);
  const [requireVolumeConfirm, setRequireVolumeConfirm] = useState(true);
  const [avoidEarnings, setAvoidEarnings] = useState(false);
  const [minRiskReward, setMinRiskReward] = useState(2);
  
  // Use centralized auth context instead of local state
  const { isAuthenticated, isAuthLoading, session } = useAuth();
  const { showAuthDialog, setShowAuthDialog } = useAuthGate("backtesting");
  
  // Check if Pattern Lab is enabled for user's tier
  const patternLabCaps = PLANS_CONFIG.tiers[userTier].projects.pattern_lab;
  const isEnabled = patternLabCaps.enabled;
  
  // Auto-adjust lookback when timeframe changes to respect data coverage
  useEffect(() => {
    const maxLookback = DATA_COVERAGE[timeframe as Timeframe]?.maxLookbackYears ?? 5;
    const defaultLookback = getDefaultLookback(timeframe as Timeframe);
    
    if (lookbackYears > maxLookback) {
      // Clamp to maximum allowed for this timeframe
      setLookbackYears(clampLookback(timeframe as Timeframe, lookbackYears));
    } else if (lookbackYears === 0 || !lookbackYears) {
      // Set sensible default
      setLookbackYears(defaultLookback);
    }
  }, [timeframe]);
  
  // Fetch estimate when inputs change
  useEffect(() => {
    let cancelled = false;
    
    const fetchEstimate = async () => {
      // Skip estimate for anonymous users — the endpoint requires auth
      if (!session) {
        setEstimate(null);
        setEstimateError(null);
        return;
      }
      
      if (selectedPatterns.length === 0 || selectedInstruments.length === 0 || selectedGrades.length === 0) {
        setEstimate(null);
        setEstimateError(null);
        return;
      }
      
      setIsEstimating(true);
      setEstimateError(null);
      try {
        const response = await fetch(
          'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/estimate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
            body: JSON.stringify({
              projectType: 'pattern_lab',
              instruments: selectedInstruments,
              patterns: selectedPatterns,
              timeframe,
              lookbackYears,
              gradeFilter: selectedGrades,
            }),
          }
        );
        
        if (cancelled) return;
        
        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }
        
        const data = await response.json();
        if (!cancelled) {
          setEstimate(data);
          setEstimateError(null);
          if (data.tier) {
            setUserTier(data.tier);
          }
        }
      } catch (error) {
        console.error('Estimate error:', error);
        if (!cancelled) {
          setEstimateError('Could not load estimate');
        }
      } finally {
        if (!cancelled) {
          setIsEstimating(false);
        }
      }
    };
    
    const debounce = setTimeout(fetchEstimate, 300);
    return () => {
      clearTimeout(debounce);
      cancelled = true;
    };
  }, [selectedInstruments, selectedPatterns, timeframe, lookbackYears, selectedGrades, session]);
  
  // Data availability check — queries historical_prices to warn before credit spend
  interface DataCoverage { symbol: string; bars: number; earliest: string | null; latest: string | null }
  const [dataCoverage, setDataCoverage] = useState<DataCoverage[]>([]);
  const [isCheckingData, setIsCheckingData] = useState(false);

  useEffect(() => {
    if (selectedInstruments.length === 0) { setDataCoverage([]); return; }
    let cancelled = false;
    const check = async () => {
      setIsCheckingData(true);
      try {
        // Check each instrument's data availability for the selected timeframe
        const results: DataCoverage[] = [];
        for (const sym of selectedInstruments) {
          const { count, data } = await supabase
            .from('historical_prices')
            .select('date', { count: 'exact', head: false })
            .eq('symbol', sym)
            .eq('timeframe', timeframe)
            .order('date', { ascending: true })
            .limit(1);
          
          const { data: latestData } = await supabase
            .from('historical_prices')
            .select('date')
            .eq('symbol', sym)
            .eq('timeframe', timeframe)
            .order('date', { ascending: false })
            .limit(1);
          
          if (!cancelled) {
            results.push({
              symbol: sym,
              bars: count ?? 0,
              earliest: data?.[0]?.date ?? null,
              latest: latestData?.[0]?.date ?? null,
            });
          }
        }
        if (!cancelled) setDataCoverage(results);
      } catch (e) {
        console.error('Data coverage check failed:', e);
      } finally {
        if (!cancelled) setIsCheckingData(false);
      }
    };
    const debounce = setTimeout(check, 500);
    return () => { clearTimeout(debounce); cancelled = true; };
  }, [selectedInstruments, timeframe]);
  
  const hasNoData = dataCoverage.some(d => d.bars === 0);
  const hasLowData = dataCoverage.some(d => d.bars > 0 && d.bars < 50);

  // Pattern occurrence pre-check — queries historical_pattern_occurrences to warn when no patterns exist
  interface PatternCoverage { symbol: string; patternId: string; patternName: string; count: number }
  const [patternCoverage, setPatternCoverage] = useState<PatternCoverage[]>([]);
  const [isCheckingPatterns, setIsCheckingPatterns] = useState(false);

  useEffect(() => {
    if (selectedInstruments.length === 0 || selectedPatterns.length === 0) {
      setPatternCoverage([]);
      return;
    }
    let cancelled = false;
    const check = async () => {
      setIsCheckingPatterns(true);
      try {
        const results: PatternCoverage[] = [];
        // Build all symbol variants for matching (e.g. AAPL, aapl)
        for (const sym of selectedInstruments) {
          for (const patId of selectedPatterns) {
            const { count } = await supabase
              .from('historical_pattern_occurrences')
              .select('id', { count: 'exact', head: true })
              .eq('symbol', sym)
              .eq('pattern_id', patId)
              .eq('timeframe', timeframe);
            
            if (!cancelled) {
              const patInfo = PATTERNS.find(p => p.id === patId);
              results.push({
                symbol: sym,
                patternId: patId,
                patternName: patInfo?.name || patId,
                count: count ?? 0,
              });
            }
          }
        }
        if (!cancelled) setPatternCoverage(results);
      } catch (e) {
        console.error('Pattern coverage check failed:', e);
      } finally {
        if (!cancelled) setIsCheckingPatterns(false);
      }
    };
    const debounce = setTimeout(check, 700);
    return () => { clearTimeout(debounce); cancelled = true; };
  }, [selectedInstruments, selectedPatterns, timeframe]);

  const hasNoPatterns = patternCoverage.length > 0 && patternCoverage.every(p => p.count === 0);
  const hasLowPatterns = patternCoverage.some(p => p.count > 0 && p.count < 5);
  const zeroPatternCombos = patternCoverage.filter(p => p.count === 0);

  const handleInstrumentToggle = (symbol: string) => {
    setSelectedInstruments(prev => 
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };
  
  const handlePatternToggle = (patternId: string) => {
    setSelectedPatterns(prev => 
      prev.includes(patternId)
        ? prev.filter(p => p !== patternId)
        : [...prev, patternId]
    );
  };
  
  const handleRun = async () => {
    // Gate: non-authenticated users must sign in first
    if (!session) {
      setShowAuthDialog(true);
      return;
    }
    
    if (!isEnabled) {
      toast.error('Pattern Lab requires Plus plan or higher');
      navigate('/pricing');
      return;
    }
    
    if (selectedPatterns.length === 0 || selectedInstruments.length === 0) {
      toast.error('Please select at least one instrument and pattern');
      return;
    }
    
    if (selectedGrades.length === 0) {
      toast.error('Please select at least one quality grade');
      return;
    }
    
    trackEvent('pattern_lab.run_backtest', {
      mode: mode || 'unknown',
      instruments: selectedInstruments.join(','),
      patterns: selectedPatterns.join(','),
      timeframe,
      instruments_count: selectedInstruments.length,
    });
    setIsRunning(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(
        'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/run',
        {
          method: 'POST',
          headers,
           body: JSON.stringify({
            projectType: 'pattern_lab',
            inputs: {
              instruments: selectedInstruments,
              patterns: selectedPatterns,
              timeframe,
              lookbackYears,
              gradeFilter: selectedGrades,
              riskPerTrade,
              // Advanced strategy controls (when configured)
              ...(advancedOpen && {
                targetGainPercent,
                stopLossPercent,
                maxOpenPositions,
                minRiskReward,
                requireVolumeConfirm,
                avoidEarnings,
              }),
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start run');
      }
      
      
      
      toast.success('Pattern Lab backtest started!');
      // Forward mode to results page so it can render mode-aware UI
      navigate(`/projects/runs/${data.runId}`, { state: { mode } });
    } catch (error) {
      console.error('Run error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start run');
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      <PageMeta
        title="Backtest Any Chart Pattern in 60 Seconds — No Code | ChartingPath"
        description="Run a backtest on any chart pattern across any instrument and timeframe. See win rate, expectancy, and R:R from years of historical data. Free to try."
        canonicalPath="/projects/pattern-lab/new"
      />
      {/* Copilot Sidebar */}
      {showCopilot && !isMobile && (
        <div className="w-[420px] shrink-0 h-[calc(100dvh-4rem)] sticky top-16 border-r border-border animate-in slide-in-from-left-4 duration-200 overflow-hidden">
          <CopilotSidebar onClose={() => setShowCopilot(false)} context={{ domain: 'research', route: '/projects/pattern-lab', quickPrompts: [t('copilot.ctx.researchPrompt1'), t('copilot.ctx.researchPrompt2'), t('copilot.ctx.researchPrompt3')] }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
      <div className="w-full px-4 md:px-6 lg:px-8 pt-6 pb-12">
        {/* Copilot toggle */}
        {!showCopilot && !isMobile && (
          <Button
            variant="outline"
            size="sm"
            className="mb-4 gap-2 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40"
            onClick={() => setShowCopilot(true)}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{t('copilot.openSidebar', 'AI Copilot')}</span>
            <kbd className="ml-1 text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">⌘K</kbd>
          </Button>
        )}

        {isMobile && (
          <Button
            variant="default"
            size="sm"
            className="fixed bottom-20 right-4 z-40 rounded-full shadow-xl gap-1.5 bg-gradient-to-r from-primary to-accent"
            onClick={() => setShowCopilot(v => !v)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">AI</span>
          </Button>
        )}
        <div className="mb-8">
          {prefilledState?.backUrl && (
            <button
              onClick={() => navigate(prefilledState.backUrl!)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {prefilledState.backLabel || 'Back'}
            </button>
          )}
          <div className="flex items-center gap-3 mb-4">
            <Link to="/projects/pattern-lab/audit">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                {t('patternLabWizard.visualAudit')}
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <FlaskConical className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('patternLabWizard.title')}</h1>
              <p className="text-muted-foreground">
                {t('patternLabWizard.subtitle')}
              </p>
            </div>
            {!isEnabled && (
              <Badge variant="secondary" className="ml-auto">
                <Lock className="h-3 w-3 mr-1" />
                {t('patternLabWizard.plusRequired')}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Tier gate */}
        {!isEnabled && (
          <Alert className="mb-6 border-violet-500/30 bg-violet-500/5">
            <Lock className="h-4 w-4 text-violet-500" />
            <AlertDescription>
              {t('patternLabWizard.tierGateMessage')}{' '}
              <Button variant="link" className="p-0 h-auto text-violet-500" onClick={() => navigate('/pricing')}>
                {t('patternLabWizard.upgradeToUnlock')}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Mode Picker — shown when no mode selected yet */}
        {!mode && (
          <div className="mb-8">
            {/* First Analysis Nudge — for authenticated users with no pre-filled context */}
            {!urlInstrument && !urlPattern && isAuthenticated && (
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">
                    <strong>{t('patternLabWizard.firstAnalysisTitle', 'First time here?')}</strong>{' '}
                    {t('patternLabWizard.firstAnalysisDesc', 'Pick a Quick Start below to run your first backtest in one click — no setup needed.')}
                  </span>
                </AlertDescription>
              </Alert>
            )}
            {/* Quick Start Examples — when no URL params, show one-click backtests */}
            {!urlInstrument && !urlPattern && (
              <div className="mb-8">
                <p className="text-sm font-medium text-muted-foreground mb-3">{t('patternLabWizard.quickStart', 'Quick Start — try a backtest in one click')}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { instrument: 'AAPL', pattern: 'double-bottom', timeframe: '1d', labelKey: 'patternLabWizard.quickStartApple', labelFallback: 'Double Bottom on AAPL', subtitleKey: 'patternLabWizard.quickStartDaily3y', subtitleFallback: 'Daily • 3 year lookback' },
                    { instrument: 'BTC-USD', pattern: 'head-and-shoulders', timeframe: '4h', labelKey: 'patternLabWizard.quickStartBtc', labelFallback: 'H&S on Bitcoin', subtitleKey: 'patternLabWizard.quickStartDaily3y', subtitleFallback: 'Daily • 3 year lookback' },
                    { instrument: 'EURUSD=X', pattern: 'falling-wedge', timeframe: '1d', labelKey: 'patternLabWizard.quickStartEurusd', labelFallback: 'Falling Wedge on EUR/USD', subtitleKey: 'patternLabWizard.quickStartDaily3y', subtitleFallback: 'Daily • 3 year lookback' },
                  ].map((example) => (
                    <button
                      key={example.labelKey}
                      onClick={() => {
                        trackEvent('pattern_lab.quick_start', { instrument: example.instrument, pattern: example.pattern });
                        setSelectedInstruments([example.instrument]);
                        setSelectedPatterns([example.pattern]);
                        setTimeframe(example.timeframe);
                        setMode('validate');
                        setParamsOpen(false);
                        setPatternsOpen(false);
                      }}
                      className="group text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card transition-all"
                    >
                      <div className="mb-1"><InstrumentLogo instrument={example.instrument} size="sm" /></div>
                      <p className="text-sm font-medium">{t(example.labelKey, example.labelFallback)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t(example.subtitleKey, example.subtitleFallback)}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('patternLabWizard.runBacktest', 'Run backtest')} <ArrowRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4 text-center">{t('patternLabWizard.modePrompt')}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Validate Signal */}
              <button
                onClick={() => { setMode('validate'); trackEvent('pattern_lab.mode_select', { mode: 'validate' }); }}
                className="group text-left p-6 rounded-xl border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('patternLabWizard.validateSignal')}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('patternLabWizard.validateDesc')}
                    </p>
                    <div className="mt-3 space-y-1">
                      {[t('patternLabWizard.validateBullet1'), t('patternLabWizard.validateBullet2'), t('patternLabWizard.validateBullet3')].map(b => (
                        <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          {b}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                      {t('patternLabWizard.startValidating')} <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Build Automation */}
              <button
                onClick={() => { setMode('automate'); trackEvent('pattern_lab.mode_select', { mode: 'automate' }); }}
                className="group text-left p-6 rounded-xl border border-border/50 bg-card/50 hover:border-violet-500/50 hover:bg-card transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors shrink-0">
                    <Code2 className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('patternLabWizard.buildAutomation')}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('patternLabWizard.automateDesc')}
                    </p>
                    <div className="mt-3 space-y-1">
                      {[t('patternLabWizard.automateBullet1'), t('patternLabWizard.automateBullet2'), t('patternLabWizard.automateBullet3')].map(b => (
                        <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-violet-500 shrink-0" />
                          {b}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-violet-500">
                      {t('patternLabWizard.startBuilding')} <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Mode indicator when selected */}
        {mode && (
          <div className="mb-6 flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              mode === 'validate'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-violet-500/10 text-violet-500 border-violet-500/20'
            }`}>
              {mode === 'validate' ? <Zap className="h-3 w-3" /> : <Code2 className="h-3 w-3" />}
              {mode === 'validate' ? t('patternLabWizard.validateSignal') : t('patternLabWizard.buildAutomation')}
            </div>
            <button
              onClick={() => setMode(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              {t('patternLabWizard.changeGoal')}
            </button>
          </div>
        )}

        {/* Signal Context Card — Validate mode only, shows what they're confirming */}
        {isValidate && selectedInstruments.length > 0 && selectedPatterns.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{t('patternLabWizard.validatingSignal')}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {selectedInstruments[0]?.replace('=X', '').replace('=F', '').replace('-USD', '')}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {PATTERNS.find(p => p.id === selectedPatterns[0])?.name || selectedPatterns[0]}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {t(TIMEFRAMES.find(tf => tf.value === timeframe)?.labelKey || '')}
                    </span>
                    {urlGrade && <GradeBadge grade={urlGrade} size="sm" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main form — always shown, mode just adds framing context */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className={`lg:col-span-2 space-y-6 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Instruments */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t('patternLabWizard.instruments')}</CardTitle>
                <CardDescription>
                  {isValidate
                    ? t('patternLabWizard.instrumentsDescValidate')
                    : t('patternLabWizard.instrumentsDescAutomate')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Symbol Search — hidden in validate mode when instrument is locked */}
                {!isValidate && (
                  <UniversalSymbolSearch
                    onSelect={(symbol, name, category) => {
                      if (!selectedInstruments.includes(symbol)) {
                        setSelectedInstruments(prev => [...prev, symbol]);
                        const categoryMap: Record<string, string> = {
                          'stocks': 'stocks',
                          'crypto': 'crypto',
                          'fx': 'fx',
                          'commodities': 'commodities',
                          'indices': 'indices',
                          'etfs': 'etfs',
                        };
                        if (categoryMap[category]) {
                          setAssetClass(categoryMap[category]);
                        }
                      }
                    }}
                    trigger={
                      <Button variant="outline" className="w-full justify-start gap-2 h-11">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('patternLabWizard.searchInstruments')}</span>
                      </Button>
                    }
                  />
                )}
                
                {/* Selected Instruments */}
                {selectedInstruments.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {t('patternLabWizard.selected')} ({selectedInstruments.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedInstruments.map(symbol => (
                        <Badge
                          key={symbol}
                          variant="secondary"
                          className="flex items-center gap-1.5 pl-1 pr-1 py-1"
                        >
                          <InstrumentLogo instrument={symbol} size="sm" showName={false} />
                          <span className="font-medium">
                            {symbol.replace('=X', '').replace('=F', '').replace('-USD', '')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                            onClick={() => setSelectedInstruments(prev => prev.filter(s => s !== symbol))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded-lg">
                    {t('patternLabWizard.noInstruments')}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Timeframe & Lookback */}
            <Card className={`bg-card/50 backdrop-blur-sm transition-colors ${!paramsOpen ? 'border-primary/40 border' : 'border-border/50'}`}>
              <Collapsible open={paramsOpen} onOpenChange={setParamsOpen}>
                <CardHeader className="pb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="text-left">
                      <CardTitle className="text-lg">{t('patternLabWizard.backtestParameters')}</CardTitle>
                      <CardDescription>
                        {t(TIMEFRAMES.find(tf => tf.value === timeframe)?.labelKey || '')} • {t('patternLabWizard.paramSummary', { lookback: lookbackYears, risk: riskPerTrade })}
                      </CardDescription>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>{t('patternLabWizard.timeframe')}</Label>
                        <Select value={timeframe} onValueChange={setTimeframe}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEFRAMES.map(tf => (
                              <SelectItem key={tf.value} value={tf.value}>
                                {t(tf.labelKey)}
                                {tf.hintKey && (
                                  <span className="text-muted-foreground ml-2">({t(tf.hintKey, { count: tf.maxYears })})</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('patternLabWizard.lookbackPeriod')}</Label>
                        <Select 
                          value={String(lookbackYears)} 
                          onValueChange={(v) => setLookbackYears(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getValidLookbackOptions(timeframe as Timeframe).map(lb => {
                              const tierCapped = patternLabCaps.maxLookbackYears !== undefined && lb.value > patternLabCaps.maxLookbackYears;
                              const translatedLabel = lb.value < 1
                                ? t('patternLabWizard.nDays', { count: Math.round(lb.value * 365) })
                                : t('patternLabWizard.nYears', { count: lb.value });
                              return (
                                <SelectItem 
                                  key={lb.value} 
                                  value={String(lb.value)}
                                  disabled={tierCapped}
                                >
                                  {translatedLabel}
                                  {tierCapped && <span className="text-muted-foreground ml-1">(upgrade)</span>}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t('patternLabWizard.dataCoverage', { info: getCoverageInfo(timeframe as Timeframe) })}
                        </p>
                      </div>
                      
                      {/* Risk Per Trade - Professional Tiers */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label>{t('patternLabWizard.riskPerTrade')}</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm font-semibold mb-1">{t('patternLabWizard.riskPerTrade')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('patternLabWizard.riskTooltip')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select 
                          value={String(riskPerTrade)} 
                          onValueChange={(v) => setRiskPerTrade(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.5">0.5% ({t('patternLabWizard.conservative')})</SelectItem>
                            <SelectItem value="1">1.0% ({t('patternLabWizard.standard')})</SelectItem>
                            <SelectItem value="2">2.0% ({t('patternLabWizard.aggressive')})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Data coverage notice */}
                    {DATA_COVERAGE[timeframe as Timeframe]?.isIntraday && (
                      <Alert className="border-amber-500/30 bg-amber-500/5 mt-4">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-sm">
                          {t('patternLabWizard.intradayDataWarning', { timeframe, info: getCoverageInfo(timeframe as Timeframe) })}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            
            {/* Patterns */}
            <Card className={`bg-card/50 backdrop-blur-sm transition-colors ${!patternsOpen ? 'border-primary/40 border' : 'border-border/50'}`}>
              <Collapsible open={patternsOpen} onOpenChange={setPatternsOpen}>
                <CardHeader className="pb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="text-left">
                      <CardTitle className="text-lg">{t('patternLabWizard.patternSelection')}</CardTitle>
                      <CardDescription>
                        {t('patternLabWizard.patternsSelected', { count: selectedPatterns.length })}
                      </CardDescription>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      {selectedPatterns.length < PATTERNS.length && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedPatterns(PATTERNS.map(p => p.id))}
                        >
                          {t('patternLabWizard.selectAll')}
                        </Button>
                      )}
                      {selectedPatterns.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedPatterns([])}
                        >
                          {t('patternLabWizard.clearAll', { count: selectedPatterns.length })}
                          <X className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PATTERNS.map(pattern => (
                        <div
                          key={pattern.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedPatterns.includes(pattern.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border/50 hover:border-border'
                          }`}
                          onClick={() => handlePatternToggle(pattern.id)}
                        >
                          <Checkbox
                            checked={selectedPatterns.includes(pattern.id)}
                            onCheckedChange={() => handlePatternToggle(pattern.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{t(`patternNames.${pattern.name}`, pattern.name)}</div>
                          </div>
                          {pattern.direction === 'bullish' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Quality Grade Filter */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  {t('patternLabWizard.qualityFilter')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          {t('patternLabWizard.qualityTooltip')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>{t('patternLabWizard.riskAppetite')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset Buttons */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {(['conservative', 'moderate', 'aggressive'] as const).map(preset => {
                    const config = GRADE_PRESET_CONFIG[preset];
                    const Icon = config.icon;
                    const isSelected = gradePreset === preset;
                    return (
                      <div
                        key={preset}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border/50 hover:border-border hover:bg-muted/30'
                        }`}
                        onClick={() => {
                          setGradePreset(preset);
                          setSelectedGrades(config.grades);
                        }}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                          {t(config.labelKey)}
                        </span>
                        <div className="flex gap-1">
                          {config.grades.map(grade => (
                            <GradeBadge key={grade} grade={grade} size="sm" showTooltip={false} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Grade Selection */}
                <div className="pt-2 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    {t('patternLabWizard.customizeGrades')}
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {(['A', 'B', 'C', 'D', 'F'] as GradeLetter[]).map(grade => {
                      const isSelected = selectedGrades.includes(grade);
                      const config = GRADE_CONFIG[grade];
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            setGradePreset('custom');
                            setSelectedGrades(prev => 
                              prev.includes(grade) 
                                ? prev.filter(g => g !== grade)
                                : [...prev, grade]
                            );
                          }}
                          className={`px-3 py-2 rounded-md border text-sm font-medium transition-all ${
                            isSelected
                              ? `${config.bg} ${config.text} ${config.border} border`
                              : 'border-border/50 text-muted-foreground hover:border-border'
                          }`}
                        >
                          {t('patternLabWizard.grade', { grade })}
                        </button>
                      );
                    })}
                  </div>
                  {selectedGrades.length === 0 && (
                    <p className="text-xs text-destructive mt-2">
                      {t('patternLabWizard.selectAtLeastOneGrade')}
                    </p>
                  )}
                </div>

                {/* Selected Summary */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedGrades.length}</span> {t('patternLabWizard.gradesSelected', { count: selectedGrades.length })}
                  {gradePreset !== 'custom' && (
                    <span className="ml-2">• {t(GRADE_PRESET_CONFIG[gradePreset].descKey)}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Strategy Controls — collapsed by default */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-4">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        {t('patternLabWizard.advancedStrategy', 'Advanced Strategy')}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Target & Stop Loss */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {t('patternLabWizard.targetStopLoss', 'Target & Stop Loss')}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            {t('patternLabWizard.takeProfit', 'Take Profit %')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[targetGainPercent]}
                              onValueChange={([v]) => setTargetGainPercent(v)}
                              min={0.5}
                              max={20}
                              step={0.5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium text-primary w-12 text-right">
                              {targetGainPercent}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            {t('patternLabWizard.stopLoss', 'Stop Loss %')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[stopLossPercent]}
                              onValueChange={([v]) => setStopLossPercent(v)}
                              min={0.25}
                              max={10}
                              step={0.25}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium text-destructive w-12 text-right">
                              {stopLossPercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        R:R = {(targetGainPercent / stopLossPercent).toFixed(1)}:1
                      </div>
                    </div>

                    {/* Position Management */}
                    <div className="space-y-3 border-t border-border/50 pt-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {t('patternLabWizard.positionManagement', 'Position Management')}
                      </h4>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {t('patternLabWizard.maxOpenPositions', 'Max Open Positions')}
                        </Label>
                        <Select value={String(maxOpenPositions)} onValueChange={v => setMaxOpenPositions(Number(v))}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 5, 10].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {t('patternLabWizard.minRiskReward', 'Min Risk:Reward')}
                        </Label>
                        <Select value={String(minRiskReward)} onValueChange={v => setMinRiskReward(Number(v))}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 1.5, 2, 2.5, 3].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}:1</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Discipline Filters */}
                    <div className="space-y-3 border-t border-border/50 pt-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Flame className="h-4 w-4 text-muted-foreground" />
                        {t('patternLabWizard.disciplineFilters', 'Discipline Filters')}
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={requireVolumeConfirm}
                            onCheckedChange={(v) => setRequireVolumeConfirm(!!v)}
                          />
                          <span className="text-sm">{t('patternLabWizard.requireVolume', 'Require volume confirmation')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={avoidEarnings}
                            onCheckedChange={(v) => setAvoidEarnings(!!v)}
                          />
                          <span className="text-sm">{t('patternLabWizard.avoidEarnings', 'Skip trades near earnings')}</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
          
          {/* Sidebar - Credits & Run - Clean inline layout (no sticky floating) */}
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  {t('patternLabWizard.runEstimate')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEstimating ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : estimateError ? (
                  <div className="space-y-3">
                    <p className="text-sm text-destructive">{estimateError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEstimateError(null);
                        setEstimate(null);
                        // Force re-trigger by toggling a value
                        setIsEstimating(true);
                        setTimeout(() => {
                          setIsEstimating(false);
                          // The useEffect will re-fire on next render cycle
                          setSelectedInstruments(prev => [...prev]);
                        }, 50);
                      }}
                    >
                      {t('patternLabWizard.retry')}
                    </Button>
                  </div>
                ) : estimate ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {estimate.creditsEstimated}
                      </span>
                      <span className="text-muted-foreground">{t('patternLabWizard.credits')}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{t('patternLabWizard.instruments')}</span>
                        <span className="font-medium text-foreground">{selectedInstruments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('patternLabWizard.patterns')}</span>
                        <span className="font-medium text-foreground">{selectedPatterns.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('patternLabWizard.lookback')}</span>
                        <span className="font-medium text-foreground">{t('patternLabWizard.years', { count: lookbackYears })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('patternLabWizard.qualityFilter')}</span>
                        <div className="flex gap-1">
                          {selectedGrades.map(g => (
                            <span key={g} className={`text-xs font-medium ${GRADE_CONFIG[g].text}`}>{g}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span>{t('patternLabWizard.yourBalance')}</span>
                        <span className="font-medium text-foreground">{estimate.creditsBalance}</span>
                      </div>
                    </div>
                    
                    {/* Cache indicator */}
                    {estimate.cacheHitRatio > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        <Database className="h-3 w-3" />
                        <span>{t('patternLabWizard.dataCached', { percent: Math.round(estimate.cacheHitRatio * 100) })}</span>
                      </div>
                    )}
                    
                    {!estimate.allowed && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {estimate.errors?.[0] || estimate.reason || 'Cannot run this configuration'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('patternLabWizard.selectToSeeEstimate')}
                  </p>
                )}
                
                {/* Data Availability Check */}
                {dataCoverage.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Database className="h-3 w-3" />
                      Data Availability
                    </p>
                    <div className="space-y-1.5">
                      {dataCoverage.map(d => (
                        <div key={d.symbol} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground truncate max-w-[120px]">{d.symbol}</span>
                          {d.bars === 0 ? (
                            <span className="flex items-center gap-1 text-destructive font-medium">
                              <AlertCircle className="h-3 w-3" />
                              No data
                            </span>
                          ) : d.bars < 50 ? (
                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                              <AlertCircle className="h-3 w-3" />
                              {d.bars} bars
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {d.bars.toLocaleString()} bars
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {hasNoData && (
                      <Alert variant="destructive" className="mt-2 py-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <AlertDescription className="text-xs">
                          No historical data found for {dataCoverage.filter(d => d.bars === 0).map(d => d.symbol).join(', ')} on {timeframe}. Credits will not be charged but the backtest will fail. Try a different timeframe.
                        </AlertDescription>
                      </Alert>
                    )}
                    {!hasNoData && hasLowData && (
                      <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded-md px-3 py-2">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{t('patternLabWizard.lowDataWarning')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Pattern Occurrence Check */}
                {patternCoverage.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <FlaskConical className="h-3 w-3" />
                      {t('patternLabWizard.patternOccurrences')}
                    </p>
                    <div className="space-y-1.5">
                      {patternCoverage.map(p => (
                        <div key={`${p.symbol}-${p.patternId}`} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground truncate max-w-[100px]">
                            {p.symbol.replace('=X', '').replace('=F', '').replace('-USD', '')}
                          </span>
                          <span className="text-muted-foreground truncate max-w-[80px] text-[10px]">{p.patternName}</span>
                          {p.count === 0 ? (
                            <span className="flex items-center gap-1 text-destructive font-medium">
                              <AlertCircle className="h-3 w-3" />
                              {t('patternLabWizard.none')}
                            </span>
                          ) : p.count < 5 ? (
                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                              {t('patternLabWizard.found', { count: p.count })}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('patternLabWizard.found', { count: p.count })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {hasNoPatterns && (
                      <Alert variant="destructive" className="mt-2 py-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <AlertDescription className="text-xs">
                          {t('patternLabWizard.noOccurrencesFound')}
                        </AlertDescription>
                      </Alert>
                    )}
                    {!hasNoPatterns && zeroPatternCombos.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded-md px-3 py-2">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>
                          {t('patternLabWizard.zeroOccurrenceCombos', { count: zeroPatternCombos.length })}
                        </span>
                      </div>
                    )}
                    {!hasNoPatterns && hasLowPatterns && !zeroPatternCombos.length && (
                      <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded-md px-3 py-2">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{t('patternLabWizard.fewOccurrences')}</span>
                      </div>
                    )}
                  </div>
                )}
                {isCheckingPatterns && patternCoverage.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('patternLabWizard.checkingPatternOccurrences')}
                  </div>
                )}

                {isCheckingData && dataCoverage.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('patternLabWizard.checkingDataAvailability')}
                  </div>
                )}
                
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRun}
                  disabled={
                    isRunning || 
                    isAuthLoading ||
                    hasNoData ||
                    hasNoPatterns ||
                    selectedInstruments.length === 0 || 
                    selectedPatterns.length === 0 ||
                    (isAuthenticated && !isEnabled) ||
                    (isAuthenticated && estimate && !estimate.allowed)
                  }
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('patternLabWizard.starting')}
                    </>
                  ) : isAuthLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('patternLabWizard.checking')}
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      {t('patternLabWizard.signInToRun')}
                    </>
                  ) : !isEnabled ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      {t('patternLabWizard.upgradeToRun')}
                    </>
                  ) : mode === 'automate' ? (
                    <>
                      <Code2 className="h-4 w-4 mr-2" />
                      {t('patternLabWizard.runAndBuildScript')}
                    </>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      {mode === 'validate' ? t('patternLabWizard.validateSignal') : t('patternLabWizard.runBacktest')}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!hasResults}
                  onClick={() => {
                    toast.success('Added Donchian Breakout (Long) and Double Bottom to your Master Plan.');
                  }}
                >
                  Send winner patterns to Master Plan
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  {t('patternLabWizard.estimatedRuntime')}
                </p>
                
                {/* What you'll get - mode-aware */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-3">{t('patternLabWizard.whatYoullGet')}</p>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                    {(isValidate ? [
                      t('patternLabWizard.validateGet1'),
                      t('patternLabWizard.validateGet2'),
                      t('patternLabWizard.validateGet3'),
                      t('patternLabWizard.validateGet4'),
                    ] : [
                      t('patternLabWizard.automateGet1'),
                      t('patternLabWizard.automateGet2'),
                      t('patternLabWizard.automateGet3'),
                      t('patternLabWizard.automateGet4'),
                    ]).map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <div className={`h-1 w-1 rounded-full flex-shrink-0 ${isValidate ? 'bg-primary' : 'bg-green-500'}`} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="backtesting" />
      </div>

      {/* Mobile: bottom sheet copilot */}
      {showCopilot && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-background/80 backdrop-blur-sm" onClick={() => setShowCopilot(false)} />
          <div className="h-[70vh] bg-background border-t border-border rounded-t-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <CopilotSidebar onClose={() => setShowCopilot(false)} context={{ domain: 'research', route: '/projects/pattern-lab', quickPrompts: [t('copilot.ctx.researchPrompt1'), t('copilot.ctx.researchPrompt2'), t('copilot.ctx.researchPrompt3')] }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternLabWizard;
