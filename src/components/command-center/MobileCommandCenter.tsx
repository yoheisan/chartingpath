import { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CommandCenterChart } from './CommandCenterChart';
import { PatternOverlayChart } from './PatternOverlayChart';
import { WatchlistPanel, LivePattern } from './WatchlistPanel';
import { PatternOccurrencesPanel, PatternOccurrence } from './PatternOccurrencesPanel';
import { QuickResearchPanel } from './QuickResearchPanel';
import { AlertsHistoryPanel } from './AlertsHistoryPanel';
import { MarketOverviewPanel } from './MarketOverviewPanel';
import FullChartViewer from '@/components/charts/FullChartViewer';
import { SetupWithVisuals, VisualSpec, CompressedBar } from '@/types/VisualSpec';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withTimeout } from '@/utils/withTimeout';
import { deriveSetupOutcome } from '@/utils/deriveLiveOutcome';
import { useDashboardSettings } from '@/hooks/useDashboardSettings';
import { useUnreadAlerts } from '@/hooks/useUnreadAlerts';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { 
  BarChart3, 
  Star, 
  History, 
  FlaskConical,
  Bell,
  TrendingUp,
} from 'lucide-react';
 
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
 
 interface MobileCommandCenterProps {
   userId?: string;
   initialPlaybackPattern?: PlaybackPatternContext;
 }
 
 // Response shape from edge functions
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
     outcome?: string;
     outcome_pnl_percent?: number;
     outcome_date?: string;
     bars_to_outcome?: number | null;
   };
   error?: string;
 }
 
export function MobileCommandCenter({ userId, initialPlaybackPattern }: MobileCommandCenterProps) {
  const { settings, updateSettings } = useDashboardSettings();
  const { count: alertCount, watchlistCount } = useUnreadAlerts(userId);
  
  const [activeTab, setActiveTab] = useState<string>('chart');
   const [selectedSymbol, setSelectedSymbol] = useState<string>(
     initialPlaybackPattern?.symbol || settings.selectedSymbol
   );
   const [selectedTimeframe, setSelectedTimeframe] = useState<string>(
     initialPlaybackPattern?.timeframe || settings.selectedTimeframe
   );
   
   // Pattern states
   const [watchlistVersion, setWatchlistVersion] = useState(0);
   const [chartOpen, setChartOpen] = useState(false);
   const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
   const [loadingChartDetails, setLoadingChartDetails] = useState(false);
   const [isCreatingAlert, setIsCreatingAlert] = useState(false);
   const chartDetailsRequestIdRef = useRef(0);
   
   // Pattern overlay state
   const [selectedOccurrence, setSelectedOccurrence] = useState<PatternOccurrence | null>(null);
   const [occurrenceSetup, setOccurrenceSetup] = useState<SetupWithVisuals | null>(null);
   const [loadingOccurrence, setLoadingOccurrence] = useState(false);
   const occurrenceRequestIdRef = useRef(0);
   
   const hasProcessedInitialPlayback = useRef(false);
 
   // Persist symbol/timeframe changes
   useEffect(() => {
     if (!initialPlaybackPattern) {
       updateSettings({ selectedSymbol, selectedTimeframe });
     }
   }, [selectedSymbol, selectedTimeframe, updateSettings, initialPlaybackPattern]);
 
   // Handle initial playback pattern
   useEffect(() => {
     if (initialPlaybackPattern && !hasProcessedInitialPlayback.current) {
       hasProcessedInitialPlayback.current = true;
       
       setSelectedSymbol(initialPlaybackPattern.symbol);
       setSelectedTimeframe(initialPlaybackPattern.timeframe);
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
         isActive: false,
       });
       setOccurrenceSetup(initialPlaybackPattern.setup);
       setLoadingOccurrence(false);
       setActiveTab('chart');
       
       toast.success(`Trade Playback: ${initialPlaybackPattern.symbol}`, {
         description: initialPlaybackPattern.patternName,
         duration: 3000,
       });
     }
   }, [initialPlaybackPattern]);
 
   const handleWatchlistChange = useCallback(() => {
     setWatchlistVersion(v => v + 1);
   }, []);
 
   const handleSymbolSelect = useCallback((symbol: string) => {
     setSelectedSymbol(symbol);
     setActiveTab('chart');
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
 
   // Convert API response to SetupWithVisuals
   const toSetupWithVisuals = (
     pattern: NonNullable<PatternDetailsResponse['pattern']>
   ): SetupWithVisuals => {
     const entry = pattern.entry_price;
     const stopLoss = pattern.stop_loss_price;
     const takeProfit = pattern.take_profit_price;
     
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
       outcome: mapOutcome(pattern.outcome),
       outcomePnlPercent: pattern.outcome_pnl_percent ?? null,
       barsToOutcome: pattern.bars_to_outcome ?? null,
       entryBarIndex: pattern.visual_spec?.entryBarIndex,
     };
   };
 
   // Build minimal setup for loading state
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
     
     setChartOpen(true);
     setLoadingChartDetails(true);
     setSelectedSetup(buildMinimalSetup(pattern));
     setSelectedSymbol(pattern.instrument);
     setSelectedTimeframe(pattern.timeframe);
 
     try {
       const res = await withTimeout(
         supabase.functions.invoke<PatternDetailsResponse>('get-live-pattern-details', {
           body: { id: pattern.id },
         }),
         25_000,
         'get-live-pattern-details'
       );
 
       if (res.error) throw res.error;
       if (!res.data?.success || !res.data.pattern) {
         throw new Error(res.data?.error || 'Failed to load pattern details');
       }
 
       if (chartDetailsRequestIdRef.current !== requestId) return;
        setSelectedSetup(toSetupWithVisuals(res.data.pattern));
        // Derive outcome from bars if not already resolved
        const builtSetup = toSetupWithVisuals(res.data.pattern);
        const derived = deriveSetupOutcome(builtSetup);
        if (derived) {
          builtSetup.outcome = derived as any;
        }
        setSelectedSetup(builtSetup);
     } catch (err: any) {
       console.error('[MobileCommandCenter] Failed to load pattern:', err?.message || err);
       toast.error('Failed to load pattern details');
     } finally {
       if (chartDetailsRequestIdRef.current === requestId) {
         setLoadingChartDetails(false);
       }
     }
   }, []);
 
   const handleOccurrenceSelect = useCallback(async (occurrence: PatternOccurrence) => {
     const requestId = ++occurrenceRequestIdRef.current;
     
     setSelectedOccurrence(occurrence);
     setLoadingOccurrence(true);
     setOccurrenceSetup(null);
     setActiveTab('chart');
 
     try {
       const endpoint = occurrence.isActive 
         ? 'get-live-pattern-details' 
         : 'get-historical-pattern-details';
       
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
           break;
         } catch (retryErr) {
           if (attempt === 0) {
             console.warn(`[MobileCommandCenter] ${endpoint} attempt 1 failed, retrying...`);
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
 
       if (occurrenceRequestIdRef.current !== requestId) return;
        const builtOccSetup = toSetupWithVisuals(res.data.pattern);
        const derivedOcc = deriveSetupOutcome(builtOccSetup);
        if (derivedOcc) {
          builtOccSetup.outcome = derivedOcc as any;
        }
        setOccurrenceSetup(builtOccSetup);
     } catch (err: any) {
       console.error('[MobileCommandCenter] Failed to load occurrence:', err?.message || err);
       toast.error('Failed to load pattern details');
       setSelectedOccurrence(null);
     } finally {
       if (occurrenceRequestIdRef.current === requestId) {
         setLoadingOccurrence(false);
       }
     }
   }, []);
 
   const handleCloseOccurrence = useCallback(() => {
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
     toast.success('Trade plan copied');
   }, [selectedSetup]);
 
   const handleCreateAlert = useCallback(async () => {
     if (!selectedSetup || !userId) {
       toast.error('Please sign in to create alerts');
       return;
     }
     setIsCreatingAlert(true);
     try {
       toast.success(`Alert created for ${selectedSetup.instrument}`);
     } catch (err) {
       toast.error('Failed to create alert');
     } finally {
       setIsCreatingAlert(false);
     }
   }, [selectedSetup, userId]);
 
   return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-background">
       {/* Main Content - Takes all space except bottom nav */}
       <div className="flex-1 min-h-0 overflow-hidden">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
           {/* Chart Tab */}
           <TabsContent value="chart" className="flex-1 m-0 data-[state=inactive]:hidden">
             <div className="h-full">
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
                   onWatchlistChange={handleWatchlistChange}
                 />
               )}
             </div>
           </TabsContent>
 
           {/* Watchlist Tab */}
           <TabsContent value="watchlist" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
             <WatchlistPanel
               userId={userId}
               selectedSymbol={selectedSymbol}
               onSymbolSelect={handleSymbolSelect}
               onPatternSelect={handlePatternSelect}
               refreshTrigger={watchlistVersion}
             />
           </TabsContent>
 
           {/* Patterns Tab */}
           <TabsContent value="patterns" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
             <div className="h-full flex flex-col">
               <div className="px-3 py-2 border-b border-border bg-muted/30">
                 <h3 className="font-semibold text-sm flex items-center gap-1.5">
                   <History className="h-4 w-4" />
                   Pattern History
                 </h3>
                 <p className="text-xs text-muted-foreground mt-0.5">
                   {selectedSymbol} · {selectedTimeframe}
                 </p>
               </div>
               <div className="flex-1 overflow-hidden">
                 <PatternOccurrencesPanel
                   symbol={selectedSymbol}
                   timeframe={selectedTimeframe}
                   onPatternSelect={handleOccurrenceSelect}
                   selectedPatternId={selectedOccurrence?.id}
                 />
               </div>
             </div>
           </TabsContent>
 
           {/* Research Tab */}
           <TabsContent value="research" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
             <div className="h-full overflow-auto">
               <QuickResearchPanel onSymbolSelect={handleSymbolSelect} />
               <div className="border-t border-border">
                 <MarketOverviewPanel onSymbolSelect={handleSymbolSelect} />
               </div>
             </div>
           </TabsContent>
 
           {/* Alerts Tab */}
           <TabsContent value="alerts" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
             <AlertsHistoryPanel userId={userId} onSymbolSelect={handleSymbolSelect} />
           </TabsContent>
 
           {/* Bottom Navigation Bar */}
          <TabsList className="w-full h-14 rounded-none border-t border-border bg-background justify-around shrink-0 px-1 pb-safe">
             <TabsTrigger 
               value="chart" 
              className="flex-1 flex-col gap-0.5 h-11 data-[state=active]:bg-primary/10 rounded-lg"
             >
              <BarChart3 className="h-4 w-4" />
               <span className="text-[11px]">Chart</span>
              </TabsTrigger>
             <TabsTrigger 
               value="watchlist" 
               className="flex-1 flex-col gap-0.5 h-11 data-[state=active]:bg-primary/10 rounded-lg relative"
             >
               <span className="relative">
                 <Star className="h-4 w-4" />
                 <NotificationBadge count={watchlistCount} size="sm" position="top-right" variant="warning" />
               </span>
               <span className="text-[11px]">Watchlist</span>
             </TabsTrigger>
              <TabsTrigger 
                value="patterns" 
               className="flex-1 flex-col gap-0.5 h-11 data-[state=active]:bg-primary/10 rounded-lg"
              >
               <TrendingUp className="h-4 w-4" />
                <span className="text-[11px]">Patterns</span>
              </TabsTrigger>
              <TabsTrigger 
                value="research" 
               className="flex-1 flex-col gap-0.5 h-11 data-[state=active]:bg-primary/10 rounded-lg"
              >
               <FlaskConical className="h-4 w-4" />
                <span className="text-[11px]">Research</span>
              </TabsTrigger>
             <TabsTrigger 
               value="alerts" 
               className="flex-1 flex-col gap-0.5 h-11 data-[state=active]:bg-primary/10 rounded-lg relative"
             >
               <span className="relative">
                 <Bell className="h-4 w-4" />
                 <NotificationBadge count={alertCount} size="sm" position="top-right" />
               </span>
               <span className="text-[11px]">Alerts</span>
            </TabsTrigger>
           </TabsList>
         </Tabs>
       </div>
 
       {/* Full Chart Viewer Modal */}
       <FullChartViewer
         open={chartOpen}
         onOpenChange={setChartOpen}
         setup={selectedSetup}
          loading={loadingChartDetails}
          onCreateAlert={handleCreateAlert}
         isCreatingAlert={isCreatingAlert}
       />
     </div>
   );
 }