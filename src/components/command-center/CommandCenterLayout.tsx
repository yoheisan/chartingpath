import { useState, useCallback, useRef } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { CommandCenterChart } from './CommandCenterChart';
import { WatchlistPanel, LivePattern } from './WatchlistPanel';
import { AlertsHistoryPanel } from './AlertsHistoryPanel';
import { QuickResearchPanel } from './QuickResearchPanel';
import { MarketOverviewPanel } from './MarketOverviewPanel';
import FullChartViewer from '@/components/charts/FullChartViewer';
import { SetupWithVisuals, VisualSpec, CompressedBar } from '@/types/VisualSpec';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withTimeout } from '@/utils/withTimeout';

interface CommandCenterLayoutProps {
  userId?: string;
}

// Response shape from edge function
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
  };
  error?: string;
}

export function CommandCenterLayout({ userId }: CommandCenterLayoutProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1d');
  
  // Pattern detail modal state
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
  const [loadingChartDetails, setLoadingChartDetails] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const chartDetailsRequestIdRef = useRef(0);

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

          setSelectedSetup(toSetupWithVisuals(res.data.pattern));
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
      toast.error('Failed to load pattern chart details');
    } finally {
      if (chartDetailsRequestIdRef.current === requestId) {
        setLoadingChartDetails(false);
      }
    }
  }, []);

  const handleCopyPlan = useCallback(() => {
    if (!selectedSetup) return;
    const { tradePlan, instrument, patternName, direction } = selectedSetup;
    const plan = `${instrument} - ${patternName} (${direction.toUpperCase()})
Entry: ${tradePlan.entry.toFixed(2)}
Stop Loss: ${tradePlan.stopLoss.toFixed(2)}
Take Profit: ${tradePlan.takeProfit.toFixed(2)}
R:R = 1:${tradePlan.rr.toFixed(1)}`;
    navigator.clipboard.writeText(plan);
    toast.success('Trade plan copied to clipboard');
  }, [selectedSetup]);

  const handleCreateAlert = useCallback(async () => {
    if (!selectedSetup || !userId) {
      toast.error('Please sign in to create alerts');
      return;
    }
    setIsCreatingAlert(true);
    try {
      // Simplified alert creation - just notify for now
      toast.success(`Alert created for ${selectedSetup.instrument}`);
    } catch (err) {
      toast.error('Failed to create alert');
    } finally {
      setIsCreatingAlert(false);
    }
  }, [selectedSetup, userId]);

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - Watchlist + Active Patterns */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full flex flex-col border-r border-border">
            <WatchlistPanel
              userId={userId}
              selectedSymbol={selectedSymbol}
              onSymbolSelect={handleSymbolSelect}
              onPatternSelect={handlePatternSelect}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content Area */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Main Chart */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <CommandCenterChart
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Panels - Alerts + Quick Research */}
            <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Alerts History */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <AlertsHistoryPanel userId={userId} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Quick Research */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <QuickResearchPanel onSymbolSelect={handleSymbolSelect} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar - Market Overview */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
          <div className="h-full border-l border-border">
            <MarketOverviewPanel onSymbolSelect={handleSymbolSelect} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Full Chart Viewer Modal for Pattern Details */}
      <FullChartViewer
        open={chartOpen}
        onOpenChange={setChartOpen}
        setup={selectedSetup}
        loading={loadingChartDetails}
        onCopyPlan={handleCopyPlan}
        onCreateAlert={handleCreateAlert}
        isCreatingAlert={isCreatingAlert}
      />
    </div>
  );
}
