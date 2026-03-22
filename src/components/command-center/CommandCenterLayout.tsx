import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { CommandCenterChart } from './CommandCenterChart';
import { PatternOverlayChart } from './PatternOverlayChart';
import { WatchlistPanel, LivePattern } from './WatchlistPanel';
import { AlertsHistoryPanel } from './AlertsHistoryPanel';
import { PaperTradingPanel } from './PaperTradingPanel';
import { MorningBriefingPanel } from './MorningBriefingPanel';
import { ForwardPerformancePanel } from './ForwardPerformancePanel';

import { PatternOccurrence } from './PatternOccurrencesPanel';
import { DashboardPatternStudy } from './DashboardPatternStudy';
import { MarketOverviewPanel } from './MarketOverviewPanel';
const FullChartViewer = lazy(() => import('@/components/charts/FullChartViewer'));
import { SetupWithVisuals, VisualSpec, CompressedBar } from '@/types/VisualSpec';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { withTimeout } from '@/utils/withTimeout';
import { deriveSetupOutcome } from '@/utils/deriveLiveOutcome';
import { useDashboardSettings } from '@/hooks/useDashboardSettings';
import { useDashboardPrefetch } from '@/hooks/useDashboardPrefetch';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useMasterPlan } from '@/hooks/useMasterPlan';
import { AuthGateDialog } from '@/components/AuthGateDialog';
import { DashboardAuthNudge } from './DashboardAuthNudge';
import { PanelRightOpen, PanelRightClose, Eye, Bell, Globe, ChevronDown, ChevronUp, Wallet, Activity, Sunrise } from 'lucide-react';
import { DashboardCopilotBar, DashboardAIStrip } from './DashboardCopilotStrip';


// Lazy load mobile layout for code splitting
const MobileCommandCenter = lazy(() => 
  import('./MobileCommandCenter').then(m => ({ default: m.MobileCommandCenter }))
);

/** Playback pattern passed from route state */
interface PlaybackPatternContext {
  occurrenceId: string;
  symbol: string;
  timeframe: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  setup: SetupWithVisuals;
  enablePlayback: boolean;
}

interface CommandCenterLayoutProps {
  userId?: string;
  /** Initial pattern to load for playback (from route state) */
  initialPlaybackPattern?: PlaybackPatternContext;
  /** Initial symbol to display (from /study/:symbol redirect) */
  initialSymbol?: string;
}

// Response shape from edge functions (live and historical)
interface PatternDetailsResponse {
  success: boolean;
  pattern?: {
    id: string;
    instrument: string;
    pattern_name: string;
    direction: string;
    quality_score: string | null;
    entry_price: number;
    stop_loss_price: number;
    take_profit_price: number;
    risk_reward_ratio: number;
    timeframe: string;
    first_detected_at: string;
    bars: CompressedBar[];
    visual_spec: VisualSpec;
    current_price?: number;
    prev_close?: number;
    change_percent?: number;
    trend_alignment?: string;
    trend_indicators?: Record<string, unknown>;
    // Historical-specific fields
    outcome?: string;
    outcome_pnl_percent?: number;
    outcome_date?: string;
    bars_to_outcome?: number | null;
  };
  error?: string;
}

export function CommandCenterLayout({ userId, initialPlaybackPattern, initialSymbol }: CommandCenterLayoutProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Auth gate for write actions
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthGate('dashboard features');

  // Persisted dashboard settings — skip writes for anonymous users
  const { settings, updateSettings: _updateSettings } = useDashboardSettings();
  
  // Prefetch watchlist symbols for instant chart switching
  useDashboardPrefetch(userId, settings.selectedTimeframe);
  
  const updateSettings = useCallback((updates: Parameters<typeof _updateSettings>[0]) => {
    if (!userId) return; // silently skip for anon
    _updateSettings(updates);
  }, [userId, _updateSettings]);
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initialPlaybackPattern?.symbol || initialSymbol || settings.selectedSymbol
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(
    initialPlaybackPattern?.timeframe || settings.selectedTimeframe
  );
  
  // Persist symbol/timeframe changes
  useEffect(() => {
    if (!initialPlaybackPattern) {
      updateSettings({ selectedSymbol, selectedTimeframe });
    }
  }, [selectedSymbol, selectedTimeframe, updateSettings, initialPlaybackPattern]);
  
  // Pattern detail modal state
  const [watchlistVersion, setWatchlistVersion] = useState(0);
  
  // Callback to refresh watchlist when chart adds/removes symbols
  const handleWatchlistChange = useCallback(() => {
    setWatchlistVersion(v => v + 1);
  }, []);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
  const [loadingChartDetails, setLoadingChartDetails] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const chartDetailsRequestIdRef = useRef(0);
  
  // Pattern overlay chart state (inline view, not modal)
  const [selectedOccurrence, setSelectedOccurrence] = useState<PatternOccurrence | null>(null);
  const [occurrenceSetup, setOccurrenceSetup] = useState<SetupWithVisuals | null>(null);
  const [loadingOccurrence, setLoadingOccurrence] = useState(false);
  const occurrenceRequestIdRef = useRef(0);
  
  // Track if we've processed the initial playback pattern
  const hasProcessedInitialPlayback = useRef(false);
  

  // Handle initial playback pattern from route state - loads directly into inline chart (not modal)
  useEffect(() => {
    if (initialPlaybackPattern && !hasProcessedInitialPlayback.current) {
      hasProcessedInitialPlayback.current = true;
      
      console.debug('[CommandCenter] Processing initial playback pattern (inline)', {
        symbol: initialPlaybackPattern.symbol,
        patternName: initialPlaybackPattern.patternName,
        enablePlayback: initialPlaybackPattern.enablePlayback,
      });
      
      // Set the symbol and timeframe
      setSelectedSymbol(initialPlaybackPattern.symbol);
      setSelectedTimeframe(initialPlaybackPattern.timeframe);
      
      // Load directly into the inline PatternOverlayChart (not modal)
      // Create a synthetic occurrence for the inline view matching PatternOccurrence interface
      setStudyPanelCollapsed(true); // Auto-collapse to maximize chart space for replay
      setSelectedOccurrence({
        id: initialPlaybackPattern.occurrenceId,
        pattern_name: initialPlaybackPattern.patternName,
        direction: initialPlaybackPattern.direction,
        detected_at: initialPlaybackPattern.setup.signalTs,
        entry_price: initialPlaybackPattern.setup.tradePlan.entry,
        stop_loss_price: initialPlaybackPattern.setup.tradePlan.stopLoss,
        take_profit_price: initialPlaybackPattern.setup.tradePlan.takeProfit,
        risk_reward_ratio: initialPlaybackPattern.setup.tradePlan.rr,
        quality_score: initialPlaybackPattern.setup.quality.grade,
        outcome: initialPlaybackPattern.setup.outcome || null,
        isActive: false, // Historical occurrence
      });
      setOccurrenceSetup(initialPlaybackPattern.setup);
      setLoadingOccurrence(false);
      
      
      
      toast.success(t('commandCenter.tradePlayback', { symbol: initialPlaybackPattern.symbol, patternName: initialPlaybackPattern.patternName }), {
        description: t('commandCenter.usePlaybackControls'),
        duration: 4000,
      });
    }
  }, [initialPlaybackPattern]);

  const handleSymbolSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
  }, []);

  // Build default quality object
  const buildDefaultQuality = (scoreStr: string | null): SetupWithVisuals['quality'] => {
    const gradeMap: Record<string, 'A' | 'B' | 'C' | 'D' | 'F'> = {
      'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'F': 'F'
    };
    const grade = gradeMap[scoreStr || 'C'] || 'C';
    const scoreNum = grade === 'A' ? 9 : grade === 'B' ? 7 : grade === 'C' ? 5 : grade === 'D' ? 3 : 1;
    return {
      score: scoreNum,
      grade,
      confidence: scoreNum * 10,
      reasons: [],
      warnings: [],
      tradeable: scoreNum >= 5,
    };
  };

  // Convert LivePattern to SetupWithVisuals
  const toSetupWithVisuals = (
    pattern: NonNullable<PatternDetailsResponse['pattern']>
  ): SetupWithVisuals => {
    const entry = pattern.entry_price;
    const stopLoss = pattern.stop_loss_price;
    const takeProfit = pattern.take_profit_price;
    
    // Map outcome string to typed outcome
    const mapOutcome = (o?: string): 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null => {
      if (!o) return null;
      if (o === 'hit_tp' || o === 'win') return 'hit_tp';
      if (o === 'hit_sl' || o === 'loss') return 'hit_sl';
      if (o === 'timeout') return 'timeout';
      if (o === 'pending') return 'pending';
      return null;
    };
    
    return {
      instrument: pattern.instrument,
      patternId: pattern.pattern_name.replace(/\s+/g, '-').toLowerCase(),
      patternName: pattern.pattern_name,
      direction: pattern.direction as 'long' | 'short',
      signalTs: pattern.first_detected_at,
      quality: buildDefaultQuality(pattern.quality_score),
      tradePlan: {
        entryType: 'bar_close',
        entry,
        stopLoss,
        takeProfit,
        rr: pattern.risk_reward_ratio,
        stopDistance: Math.abs(entry - stopLoss),
        tpDistance: Math.abs(takeProfit - entry),
        timeStopBars: 100,
        bracketLevelsVersion: '1.0.0',
        priceRounding: { priceDecimals: 2, rrDecimals: 1 },
      },
      bars: pattern.bars || [],
      visualSpec: pattern.visual_spec || {
        version: '2.0.0',
        symbol: pattern.instrument,
        timeframe: pattern.timeframe,
        patternId: pattern.pattern_name.replace(/\s+/g, '-').toLowerCase(),
        signalTs: pattern.first_detected_at,
        window: { startTs: pattern.first_detected_at, endTs: pattern.first_detected_at },
        yDomain: { min: entry, max: entry },
        overlays: [],
      },
      // Historical outcome data
      outcome: mapOutcome(pattern.outcome),
      outcomePnlPercent: pattern.outcome_pnl_percent ?? null,
      barsToOutcome: pattern.bars_to_outcome ?? null,
      entryBarIndex: pattern.visual_spec?.entryBarIndex,
    };
  };

  // Build a minimal fallback setup while loading
  const buildMinimalSetup = (pattern: LivePattern): SetupWithVisuals => {
    const entry = pattern.current_price || 0;
    return {
      instrument: pattern.instrument,
      patternId: pattern.pattern_name.replace(/\s+/g, '-').toLowerCase(),
      patternName: pattern.pattern_name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      direction: pattern.direction as 'long' | 'short',
      signalTs: new Date().toISOString(),
      quality: buildDefaultQuality(pattern.quality_score),
      tradePlan: {
        entryType: 'bar_close',
        entry,
        stopLoss: entry,
        takeProfit: entry,
        rr: 2,
        stopDistance: 0,
        tpDistance: 0,
        timeStopBars: 100,
        bracketLevelsVersion: '1.0.0',
        priceRounding: { priceDecimals: 2, rrDecimals: 1 },
      },
      bars: [],
      visualSpec: {
        version: '2.0.0',
        symbol: pattern.instrument,
        timeframe: pattern.timeframe,
        patternId: pattern.pattern_name,
        signalTs: new Date().toISOString(),
        window: { startTs: new Date().toISOString(), endTs: new Date().toISOString() },
        yDomain: { min: entry, max: entry },
        overlays: [],
      },
    };
  };

  const handlePatternSelect = useCallback(async (pattern: LivePattern) => {
    const requestId = ++chartDetailsRequestIdRef.current;
    
    console.debug('[CommandCenter] Open pattern chart', {
      requestId,
      id: pattern.id,
      instrument: pattern.instrument,
      patternName: pattern.pattern_name,
    });

    // Open immediately with loading state
    setChartOpen(true);
    setLoadingChartDetails(true);
    setSelectedSetup(buildMinimalSetup(pattern));
    
    // Also update the main chart to show this symbol
    setSelectedSymbol(pattern.instrument);
    setSelectedTimeframe(pattern.timeframe);

    try {
      const timeouts = [25_000, 45_000] as const;
      let lastErr: any = null;

      for (let i = 0; i < timeouts.length; i++) {
        try {
          const res = await withTimeout(
            supabase.functions.invoke<PatternDetailsResponse>('get-live-pattern-details', {
              body: { id: pattern.id },
            }),
            timeouts[i],
            'get-live-pattern-details'
          );

          console.debug('[CommandCenter] Details response', {
            requestId,
            attempt: i + 1,
            ok: !res.error,
            hasData: Boolean(res.data),
          });

          if (res.error) throw res.error;

          if (!res.data?.success || !res.data.pattern) {
            throw new Error(res.data?.error || 'Failed to load pattern details');
          }

          // Ignore stale responses
          if (chartDetailsRequestIdRef.current !== requestId) return;

          const builtSetup = toSetupWithVisuals(res.data.pattern);
          const derived = deriveSetupOutcome(builtSetup);
          if (derived) {
            builtSetup.outcome = derived as any;
          }
          setSelectedSetup(builtSetup);
          return;
        } catch (err: any) {
          lastErr = err;
          console.warn('[CommandCenter] Details attempt failed', {
            requestId,
            attempt: i + 1,
            message: err?.message || String(err),
          });
          if (i < timeouts.length - 1) {
            await new Promise(r => setTimeout(r, 750));
          }
        }
      }

      throw lastErr;
    } catch (err: any) {
      console.error('[CommandCenter] Failed to load chart details:', err?.message || err);
      toast.error(t('commandCenter.failedToLoadChartDetails'));
    } finally {
      if (chartDetailsRequestIdRef.current === requestId) {
        setLoadingChartDetails(false);
      }
    }
  }, []);

  // Handle pattern occurrence selection from the bottom panel
  const handleOccurrenceSelect = useCallback(async (occurrence: PatternOccurrence) => {
    const requestId = ++occurrenceRequestIdRef.current;
    
    console.debug('[CommandCenter] Selected occurrence for inline view', {
      requestId,
      id: occurrence.id,
      pattern_name: occurrence.pattern_name,
      isActive: occurrence.isActive,
    });

    setSelectedOccurrence(occurrence);
    setStudyPanelCollapsed(true); // Auto-collapse to maximize chart space for replay
    setLoadingOccurrence(true);
    setOccurrenceSetup(null);

    try {
      // Fetch pattern details based on whether it's active or historical
      const endpoint = occurrence.isActive 
        ? 'get-live-pattern-details' 
        : 'get-historical-pattern-details';
      
      // Try with longer timeout and one retry on failure
      let res: Awaited<ReturnType<typeof supabase.functions.invoke<PatternDetailsResponse>>> | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await withTimeout(
            supabase.functions.invoke<PatternDetailsResponse>(endpoint, {
              body: { id: occurrence.id },
            }),
            40_000,
            endpoint
          );
          break; // success
        } catch (retryErr) {
          if (attempt === 0) {
            console.warn(`[CommandCenter] ${endpoint} attempt 1 failed, retrying...`);
            continue;
          }
          throw retryErr;
        }
      }
      if (!res) throw new Error('No response received');

      if (res.error) throw res.error;
      
      if (!res.data?.success || !res.data.pattern) {
        throw new Error(res.data?.error || 'Failed to load pattern details');
      }

      // Ignore stale responses
      if (occurrenceRequestIdRef.current !== requestId) return;

      const builtOccSetup = toSetupWithVisuals(res.data.pattern);
      const derivedOcc = deriveSetupOutcome(builtOccSetup);
      if (derivedOcc) {
        builtOccSetup.outcome = derivedOcc as any;
      }
      setOccurrenceSetup(builtOccSetup);
    } catch (err: any) {
      console.error('[CommandCenter] Failed to load occurrence details:', err?.message || err);
      toast.error(t('commandCenter.failedToLoadPatternDetails'));
      // Clear selection on error
      setSelectedOccurrence(null);
    } finally {
      if (occurrenceRequestIdRef.current === requestId) {
        setLoadingOccurrence(false);
      }
    }
  }, []);

  const handleCloseOccurrence = useCallback(() => {
    // Bump request id to cancel any in-flight fetch so its finally-block
    // doesn't overwrite the reset we're doing here.
    ++occurrenceRequestIdRef.current;
    setSelectedOccurrence(null);
    setOccurrenceSetup(null);
    setLoadingOccurrence(false);
  }, []);

  const handleOpenFullChartFromOccurrence = useCallback(() => {
    if (occurrenceSetup) {
      setSelectedSetup(occurrenceSetup);
      setChartOpen(true);
    }
  }, [occurrenceSetup]);

  const handleCopyPlan = useCallback(() => {
    if (!selectedSetup) return;
    const { tradePlan, instrument, patternName, direction } = selectedSetup;
    const plan = `${instrument} - ${patternName} (${direction.toUpperCase()})
Entry: ${tradePlan.entry.toFixed(2)}
Stop Loss: ${tradePlan.stopLoss.toFixed(2)}
Take Profit: ${tradePlan.takeProfit.toFixed(2)}
R:R = 1:${tradePlan.rr.toFixed(1)}`;
    navigator.clipboard.writeText(plan);
    toast.success(t('commandCenter.tradePlanCopied'));
  }, [selectedSetup]);

  const handleCreateAlert = useCallback(async () => {
    if (!selectedSetup) return;
    requireAuth(() => {
      if (!userId) return;
      setIsCreatingAlert(true);
      try {
        toast.success(t('commandCenter.alertCreated', { instrument: selectedSetup.instrument }));
      } catch (err) {
        toast.error(t('commandCenter.failedToLoadPatternDetails'));
      } finally {
        setIsCreatingAlert(false);
      }
    });
  }, [selectedSetup, userId, requireAuth]);

  // Panel resize handlers
  const handleHorizontalResize = useCallback((sizes: number[]) => {
    if (sizes.length === 3) {
      updateSettings({
        leftPanelSize: sizes[0],
        mainPanelSize: sizes[1],
        rightPanelSize: sizes[2],
      });
    }
  }, [updateSettings]);

  const handleVerticalResize = useCallback((sizes: number[]) => {
    if (sizes.length === 2) {
      updateSettings({
        topChartSize: sizes[0],
        bottomPanelSize: sizes[1],
      });
    }
  }, [updateSettings]);

  const handleRightPanelResize = useCallback((sizes: number[]) => {
    if (sizes.length === 2) {
      updateSettings({
        alertsPanelSize: sizes[0],
        marketOverviewSize: sizes[1],
      });
    }
  }, [updateSettings]);

  // Right panel tab state
  const [rightPanelTab, setRightPanelTab] = useState<string>(
    settings.watchlistTab === 'alerts' ? 'alerts' : settings.watchlistTab === 'paper' ? 'paper' : 'watchlist'
  );

  // Auto-collapse sidebar on smaller screens (< 1440px)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 1440;
  });
  
  // Study panel collapsed state — closed by default
  const [studyPanelCollapsed, setStudyPanelCollapsed] = useState(true);

  // Dispatch resize event after sidebar transition so charts re-fit
  const toggleSidebar = useCallback((collapsed: boolean) => {
    setRightSidebarCollapsed(collapsed);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
  }, []);

  // Render mobile layout for small screens
  if (isMobile) {
    return (
      <Suspense fallback={
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>
      }>
        <MobileCommandCenter 
          userId={userId} 
          initialPlaybackPattern={initialPlaybackPattern} 
        />
      </Suspense>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-background">
      {/* Copilot Context Bar + AI Strip */}
      <DashboardCopilotBar />
      <DashboardAIStrip />

      {/* Minimal auth nudge */}
      {!userId && <DashboardAuthNudge />}
      
      {/* Auth gate dialog */}
      <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="dashboard features" />
      
      <div className="flex-1 min-h-0 flex">
        {/* Main Content — chart-first, takes maximum available space */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full flex flex-col">

            {/* Main Chart — dominates viewport */}
            <div className={cn("relative overflow-hidden", studyPanelCollapsed ? "flex-1 min-h-0" : "h-[40%] min-h-[200px] shrink-0")}>
              {selectedOccurrence ? (
                <PatternOverlayChart
                  setup={occurrenceSetup}
                  loading={loadingOccurrence}
                  onClose={handleCloseOccurrence}
                  onOpenFullChart={handleOpenFullChartFromOccurrence}
                />
              ) : (
                <CommandCenterChart
                  symbol={selectedSymbol}
                  timeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                  onSymbolChange={handleSymbolSelect}
                  onWatchlistChange={handleWatchlistChange}
                />
              )}
            </div>
            
            {/* Bottom panel toggle — TradingView SuperChart style panel header */}
            <button
              onClick={() => setStudyPanelCollapsed(prev => !prev)}
              className={cn(
                "flex items-center justify-center gap-1.5 w-full border-t border-border/60 hover:bg-muted/40 transition-colors shrink-0",
                studyPanelCollapsed
                  ? "h-8 text-xs font-medium text-muted-foreground/80 hover:text-foreground"
                  : "h-9 text-xs font-semibold text-foreground/90 hover:text-foreground bg-muted/20"
              )}
            >
              {studyPanelCollapsed ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>{t('commandCenter.showPatternsMetrics')}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>{t('commandCenter.hidePatternsMetrics')}</span>
                </>
              )}
            </button>

            {/* Study panel — TradingView-style bottom panel with generous height */}
            <div className={cn(
              "min-h-0 overflow-auto border-t border-border/60",
              studyPanelCollapsed ? "hidden" : "flex-1"
            )}>
              <DashboardPatternStudy
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                onPatternSelect={handleOccurrenceSelect}
                selectedPatternId={selectedOccurrence?.id}
                active={!studyPanelCollapsed}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar — auto-collapse on smaller screens, TradingView-style icon strip */}
        <div className={cn(
          "flex h-full border-l border-border/60 shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out",
          rightSidebarCollapsed ? "w-10" : "w-[280px]"
        )}>
          {rightSidebarCollapsed ? (
            /* Icon strip — minimal, like TradingView right toolbar */
            <div className="flex flex-col items-center w-10 py-2 gap-0.5">
              <button
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => toggleSidebar(false)}
                title={t('commandCenter.expandSidebar')}
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </button>
              <div className="w-5 h-px bg-border/40 my-1" />
              <button
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                  rightPanelTab === 'watchlist' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                onClick={() => { setRightPanelTab('watchlist'); toggleSidebar(false); }}
                title={t('commandCenter.watchlist')}
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                  rightPanelTab === 'alerts' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                onClick={() => { setRightPanelTab('alerts'); toggleSidebar(false); }}
                title={t('commandCenter.alerts')}
              >
                <Bell className="h-3.5 w-3.5" />
              </button>
              <button
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                  rightPanelTab === 'paper' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                onClick={() => { setRightPanelTab('paper'); toggleSidebar(false); }}
                title="Paper Trading"
              >
                <Wallet className="h-3.5 w-3.5" />
              </button>
              <button
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                  rightPanelTab === 'forward' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                onClick={() => { setRightPanelTab('forward'); toggleSidebar(false); }}
                title="Forward Performance"
              >
                <Activity className="h-3.5 w-3.5" />
              </button>
              <button
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                  rightPanelTab === 'briefing' ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                onClick={() => { setRightPanelTab('briefing'); toggleSidebar(false); }}
                title={t('morningBriefing.title', 'Morning Briefing')}
              >
                <Sunrise className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1" />
              <button
                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                onClick={() => { toggleSidebar(false); }}
                title={t('commandCenter.marketOverview')}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full">
              {/* Sidebar header with collapse */}
              <div className="flex items-center justify-start px-1 py-0.5 border-b border-border/60 shrink-0">
                <button
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                  onClick={() => toggleSidebar(true)}
                  title={t('commandCenter.collapseSidebar')}
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </button>
              </div>
              <ResizablePanelGroup direction="vertical" className="flex-1" onLayout={handleRightPanelResize}>
                {/* Watchlist & Alerts — tabbed */}
                <ResizablePanel defaultSize={settings.alertsPanelSize} minSize={30}>
                  <Tabs value={rightPanelTab} onValueChange={(tab) => {
                    setRightPanelTab(tab);
                    updateSettings({ watchlistTab: tab });
                  }} className="h-full flex flex-col">
                    <TabsList className="w-full justify-start rounded-none border-b border-border/60 bg-transparent h-8 px-1.5 overflow-x-auto overflow-y-hidden scrollbar-none flex-nowrap">
                      <TabsTrigger value="watchlist" className="text-[13px] font-semibold px-2 h-6 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground">
                        {t('commandCenter.watchlist')}
                      </TabsTrigger>
                      <TabsTrigger value="alerts" className="text-[13px] font-semibold px-2 h-6 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground">
                        {t('commandCenter.alerts')}
                      </TabsTrigger>
                      <TabsTrigger value="paper" className="text-[13px] font-semibold px-2 h-6 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground">
                        Paper
                      </TabsTrigger>
                      <TabsTrigger value="forward" className="text-[13px] font-semibold px-2 h-6 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground">
                        Forward
                      </TabsTrigger>
                      <TabsTrigger value="briefing" className="text-[13px] font-semibold px-2 h-6 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-muted-foreground data-[state=active]:text-foreground">
                        {t('morningBriefing.tabLabel', 'Briefing')}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="watchlist" className="flex-1 m-0 overflow-hidden">
                      <WatchlistPanel
                        userId={userId}
                        selectedSymbol={selectedSymbol}
                        onSymbolSelect={handleSymbolSelect}
                        onPatternSelect={handlePatternSelect}
                        refreshTrigger={watchlistVersion}
                        defaultTab={settings.watchlistTab}
                        onTabChange={(tab) => updateSettings({ watchlistTab: tab })}
                      />
                    </TabsContent>
                    <TabsContent value="alerts" className="flex-1 m-0 overflow-hidden">
                      {rightPanelTab === 'alerts' && (
                        <AlertsHistoryPanel userId={userId} onSymbolSelect={handleSymbolSelect} />
                      )}
                    </TabsContent>
                    <TabsContent value="paper" className="flex-1 m-0 overflow-hidden">
                      {rightPanelTab === 'paper' && (
                        <PaperTradingPanel userId={userId} onSymbolSelect={handleSymbolSelect} />
                      )}
                    </TabsContent>
                    <TabsContent value="forward" className="flex-1 m-0 overflow-hidden">
                      {rightPanelTab === 'forward' && (
                        <ForwardPerformancePanel userId={userId} />
                      )}
                    </TabsContent>
                    <TabsContent value="briefing" className="flex-1 m-0 overflow-hidden">
                      {rightPanelTab === 'briefing' && (
                        <MorningBriefingPanel userId={userId} onSymbolSelect={handleSymbolSelect} />
                      )}
                    </TabsContent>
                  </Tabs>
                </ResizablePanel>

                <ResizableHandle className="data-[panel-group-direction=vertical]:h-px" />

                {/* Market Overview */}
                <ResizablePanel defaultSize={settings.marketOverviewSize} minSize={20}>
                  <MarketOverviewPanel 
                    onSymbolSelect={handleSymbolSelect} 
                    defaultTab={settings.marketOverviewTab}
                    onTabChange={(tab) => updateSettings({ marketOverviewTab: tab })}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          )}
        </div>

        {/* Full Chart Viewer Modal */}
        <Suspense fallback={null}>
          <FullChartViewer
            open={chartOpen}
            onOpenChange={setChartOpen}
            setup={selectedSetup}
            loading={loadingChartDetails}
            onCreateAlert={handleCreateAlert}
            isCreatingAlert={isCreatingAlert}
          />
        </Suspense>
      </div>
    </div>
  );
}
