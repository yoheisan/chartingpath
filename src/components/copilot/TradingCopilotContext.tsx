import { createContext, useContext, ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { ChartAnalysisResult } from '@/hooks/useChartAnalysis';

export interface ChartContextData {
  symbol: string;
  timeframe: string;
  summary: string;
}

interface TradingCopilotContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  openWithContext: (context: string, chartData?: ChartContextData) => void;
  openWithAnalysis: (context: string, analysis: ChartAnalysisResult) => void;
  openPlanBuilder: () => void;
  openNewPlanBuilder: () => void;
  pendingContext: string | null;
  pendingAnalysis: ChartAnalysisResult | null;
  pendingPlanBuilder: boolean;
  pendingNewPlan: boolean;
  consumePendingContext: () => string | null;
  consumePendingPlanBuilder: () => boolean;
  consumePendingNewPlan: () => boolean;
  setChartContext: (data: ChartContextData | null) => void;
  getChartContext: () => ChartContextData | null;
}

const TradingCopilotContext = createContext<TradingCopilotContextValue | null>(null);

export function TradingCopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingContext, setPendingContext] = useState<string | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<ChartAnalysisResult | null>(null);
  const [pendingPlanBuilder, setPendingPlanBuilder] = useState(false);
  const contextRef = useRef<ChartContextData | null>(null);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    trackEvent('copilot.open', { trigger: 'manual' });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openWithContext = useCallback((context: string, chartData?: ChartContextData) => {
    if (chartData) {
      contextRef.current = chartData;
    }
    trackEvent('copilot.open', {
      trigger: 'chart_analysis',
      symbol: chartData?.symbol || null,
      timeframe: chartData?.timeframe || null,
    });
    setPendingContext(context);
    setPendingAnalysis(null);
    setIsOpen(true);
  }, []);

  const openWithAnalysis = useCallback((context: string, analysis: ChartAnalysisResult) => {
    setPendingContext(context);
    setPendingAnalysis(analysis);
    setIsOpen(true);
  }, []);

  const openPlanBuilder = useCallback(() => {
    setPendingPlanBuilder(true);
    setIsOpen(true);
  }, []);

  const consumePendingContext = useCallback(() => {
    const context = pendingContext;
    setPendingContext(null);
    setPendingAnalysis(null);
    return context;
  }, [pendingContext]);

  const consumePendingPlanBuilder = useCallback(() => {
    const val = pendingPlanBuilder;
    setPendingPlanBuilder(false);
    return val;
  }, [pendingPlanBuilder]);

  const setChartContext = useCallback((data: ChartContextData | null) => {
    contextRef.current = data;
  }, []);

  const getChartContext = useCallback(() => {
    return contextRef.current;
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <TradingCopilotContext.Provider value={{
      isOpen,
      toggle,
      open,
      close,
      openWithContext,
      openWithAnalysis,
      openPlanBuilder,
      pendingContext,
      pendingAnalysis,
      pendingPlanBuilder,
      consumePendingContext,
      consumePendingPlanBuilder,
      setChartContext,
      getChartContext
    }}>
      {children}
    </TradingCopilotContext.Provider>
  );
}

// Safe fallback for when context is not available
const NOOP_CONTEXT: TradingCopilotContextValue = {
  isOpen: false,
  toggle: () => {},
  open: () => {},
  close: () => {},
  openWithContext: () => {},
  openWithAnalysis: () => {},
  openPlanBuilder: () => {},
  pendingContext: null,
  pendingAnalysis: null,
  pendingPlanBuilder: false,
  consumePendingContext: () => null,
  consumePendingPlanBuilder: () => false,
  setChartContext: () => {},
  getChartContext: () => null
};

export function useTradingCopilotContext() {
  const context = useContext(TradingCopilotContext);
  // Return safe no-op fallback instead of throwing to prevent crashes
  return context ?? NOOP_CONTEXT;
}

// Re-export standalone hook for backward compatibility
export { useTradingCopilot } from './useTradingCopilot';
