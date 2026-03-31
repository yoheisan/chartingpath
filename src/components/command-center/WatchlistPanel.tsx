import { useState, useEffect, useCallback } from 'react';
import { translatePatternName } from '@/utils/translatePatternName';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Activity,
  X,
  Lock,
  Crown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CardCaptureButton } from '@/components/capture';
import { MasterPlan } from '@/hooks/useMasterPlan';
import { checkPlanAlignment, guessAssetType } from '@/hooks/useMasterPlanFilter';

interface WatchlistPanelProps {
  userId?: string;
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
  onPatternSelect?: (pattern: LivePattern) => void;
  refreshTrigger?: number;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  activePlan?: MasterPlan | null;
}

export interface LivePattern {
  id: string;
  instrument: string;
  pattern_name: string;
  direction: string;
  quality_score: string | null;
  current_price: number | null;
  change_percent: number | null;
  timeframe: string;
}

interface WatchlistItem {
  id?: string;
  symbol: string;
  name?: string;
  asset_type?: string;
}

const DEFAULT_UNIVERSE_SAMPLES = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'BTC-USD', 'ETH-USD', 'EURUSD=X', 'GC=F'
];

export function WatchlistPanel({
  userId,
  selectedSymbol,
  onSymbolSelect,
  onPatternSelect,
  refreshTrigger,
  defaultTab = 'watchlist',
  onTabChange,
  activePlan,
}: WatchlistPanelProps) {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
  const [activePatterns, setActivePatterns] = useState<LivePattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState(false);

  const isPaidUser = profile?.subscription_plan && 
    !['free', 'starter'].includes(profile.subscription_plan);

  // Fetch user's personal watchlist (paid users only)
  const fetchUserWatchlist = useCallback(async () => {
    if (!userId || !isPaidUser) return;
    
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id, symbol, name, asset_type')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setUserWatchlist(data || []);
    } catch (err) {
      console.error('[WatchlistPanel] fetch watchlist error:', err);
    }
  }, [userId, isPaidUser]);

  // Fetch active patterns
  const fetchActivePatterns = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, direction, quality_score, current_price, change_percent, timeframe')
        .eq('status', 'active')
        .order('last_confirmed_at', { ascending: false });

      if (isPaidUser && userWatchlist.length > 0) {
        const watchlistSymbols = userWatchlist.map(w => w.symbol);
        query = query.in('instrument', watchlistSymbols);
      } else {
        query = query.in('instrument', DEFAULT_UNIVERSE_SAMPLES).limit(20);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivePatterns(data || []);
    } catch (err) {
      console.error('[WatchlistPanel] fetch patterns error:', err);
    } finally {
      setLoading(false);
    }
  }, [isPaidUser, userWatchlist]);

  useEffect(() => {
    fetchUserWatchlist();
  }, [fetchUserWatchlist, refreshTrigger]);

  useEffect(() => {
    fetchActivePatterns();
  }, [fetchActivePatterns]);

  // Add symbol to watchlist
  const addToWatchlist = async (symbol: string) => {
    if (!userId || !isPaidUser) {
      toast.error(t('commandCenter.upgradeToAddCustom'));
      return;
    }

    setAddingSymbol(true);
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(t('commandCenter.symbolAlreadyInWatchlist'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('commandCenter.addedToWatchlist', { symbol }));
        fetchUserWatchlist();
      }
    } catch (err) {
      console.error('[WatchlistPanel] add error:', err);
      toast.error(t('commandCenter.failedToAdd'));
    } finally {
      setAddingSymbol(false);
    }
  };

  // Remove symbol from watchlist
  const removeFromWatchlist = async (symbol: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol);

      if (error) throw error;
      toast.success(t('commandCenter.removedFromWatchlist', { symbol }));
      fetchUserWatchlist();
    } catch (err) {
      console.error('[WatchlistPanel] remove error:', err);
      toast.error(t('commandCenter.failedToRemove'));
    }
  };

  const displayList = isPaidUser 
    ? userWatchlist 
    : DEFAULT_UNIVERSE_SAMPLES.map(s => ({ symbol: s }));

  const formatPatternName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Check alignment for a watchlist item
  const getWatchlistAlignment = (symbol: string, assetType?: string) => {
    if (!activePlan || !activePlan.asset_classes?.length) return null;
    return checkPlanAlignment(activePlan, {
      symbol,
      assetType: assetType || guessAssetType(symbol),
    });
  };

  // Check alignment for a pattern
  const getPatternAlignment = (pattern: LivePattern) => {
    if (!activePlan) return null;
    return checkPlanAlignment(activePlan, {
      symbol: pattern.instrument,
      assetType: guessAssetType(pattern.instrument),
      patternName: pattern.pattern_name,
      direction: pattern.direction,
    });
  };

  return (
    <div className="h-full flex flex-col" data-capture-target>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {t('commandCenter.watchlist')}
            {isPaidUser && (
              <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                {t('commandCenter.custom')}
              </Badge>
            )}
          </h3>
          <CardCaptureButton label="Watchlist" />
        </div>

        {/* Plan filter indicator */}
        {activePlan && activePlan.asset_classes?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 px-1">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            <span className="truncate">
              Filtered by <span className="font-medium text-foreground">{activePlan.name}</span>
            </span>
          </div>
        )}

        {isPaidUser ? (
          <UniversalSymbolSearch
            onSelect={(symbol) => addToWatchlist(symbol)}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 justify-start text-xs text-muted-foreground"
                disabled={addingSymbol}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t('commandCenter.addSymbol')}
              </Button>
            }
          />
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2 rounded-md bg-muted/50 border border-dashed">
            <Lock className="h-3 w-3" />
            <span>{t('commandCenter.upgradeToAdd')}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b px-2 h-8">
          <TabsTrigger value="watchlist" className="text-sm h-6 px-2">
            <Star className="h-3 w-3 mr-1" />
            {isPaidUser ? t('commandCenter.myList') : t('commandCenter.universe')}
          </TabsTrigger>
          <TabsTrigger value="patterns" className="text-sm h-6 px-2">
            <Activity className="h-3 w-3 mr-1" />
            {t('commandCenter.active')}
            {activePatterns.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                {activePatterns.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-1">
              {!isPaidUser && (
                <div className="mx-1 mb-2 p-2 rounded-md bg-muted/50 border border-dashed">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>{t('commandCenter.upgradeToMonitor')}</span>
                  </div>
                </div>
              )}
              {displayList.map((item) => {
                const alignment = getWatchlistAlignment(item.symbol, 'asset_type' in item ? (item.asset_type as string) : undefined);
                const isOutside = alignment && !alignment.aligned;

                return (
                  <div
                    key={item.symbol}
                    className={cn(
                      'group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-muted/50 transition-colors',
                      selectedSymbol === item.symbol && 'bg-muted',
                      isOutside && 'opacity-60'
                    )}
                  >
                    <button
                      onClick={() => onSymbolSelect(item.symbol)}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <InstrumentLogo instrument={item.symbol} size="sm" showName={false} />
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">{item.symbol}</span>
                          {isOutside && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        {'name' in item && item.name && (
                          <div className="text-xs text-muted-foreground truncate">{String(item.name)}</div>
                        )}
                      </div>
                    </button>
                    {isPaidUser && 'id' in item && item.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromWatchlist(item.symbol)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {displayList.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {isPaidUser 
                    ? t('commandCenter.noSymbolsYet')
                    : t('commandCenter.noInstruments')}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Active Patterns Tab */}
        <TabsContent value="patterns" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-1">
              {!isPaidUser && (
                <div className="mx-1 mb-2 p-2 rounded-md bg-muted/50 border border-dashed">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>{t('commandCenter.showingDefault')}</span>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {t('commandCenter.loadingPatterns')}
                </div>
              ) : activePatterns.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {isPaidUser && userWatchlist.length === 0
                    ? t('commandCenter.addToWatchlistFirst')
                    : t('commandCenter.noActivePatterns')}
                </div>
              ) : (
                activePatterns.map((pattern) => {
                  const alignment = getPatternAlignment(pattern);
                  const isAligned = !alignment || alignment.aligned;

                  return (
                    <button
                      key={pattern.id}
                      onClick={() => onPatternSelect ? onPatternSelect(pattern) : onSymbolSelect(pattern.instrument)}
                      className={cn(
                        'w-full flex flex-col gap-1 px-2 py-2 rounded-md text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0',
                        selectedSymbol === pattern.instrument && 'bg-muted',
                        !isAligned && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <InstrumentLogo instrument={pattern.instrument} size="sm" showName={false} />
                        <span className="text-sm font-medium">{pattern.instrument}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs px-1 py-0',
                            pattern.direction === 'bullish'
                              ? 'border-emerald-500/50 text-emerald-600'
                              : 'border-red-500/50 text-red-600'
                          )}
                        >
                          {pattern.direction === 'bullish' ? (
                            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {pattern.direction}
                        </Badge>
                        {/* Alignment badge */}
                        {alignment && (
                          isAligned ? (
                            <Badge variant="secondary" className="text-xs px-1 py-0 bg-emerald-500/10 text-emerald-500 border-0">
                              Aligned
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs px-1 py-0 bg-amber-500/10 text-amber-500 border-0">
                              Outside
                            </Badge>
                          )
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {translatePatternName(pattern.pattern_name)}
                        </span>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {pattern.timeframe}
                        </Badge>
                      </div>
                      {pattern.current_price && (
                        <div className="flex items-center justify-between text-xs">
                          <span>${pattern.current_price.toFixed(2)}</span>
                          {pattern.change_percent !== null && (
                            <span
                              className={
                                pattern.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'
                              }
                            >
                              {pattern.change_percent >= 0 ? '+' : ''}
                              {pattern.change_percent.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
