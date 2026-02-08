import { createContext, useContext, ReactNode, useState, useCallback, useRef } from 'react';

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
  pendingContext: string | null;
  consumePendingContext: () => string | null;
  setChartContext: (data: ChartContextData | null) => void;
  getChartContext: () => ChartContextData | null;
}

const TradingCopilotContext = createContext<TradingCopilotContextValue | null>(null);

export function TradingCopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingContext, setPendingContext] = useState<string | null>(null);
  const contextRef = useRef<ChartContextData | null>(null);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openWithContext = useCallback((context: string, chartData?: ChartContextData) => {
    if (chartData) {
      contextRef.current = chartData;
    }
    setPendingContext(context);
    setIsOpen(true);
  }, []);

  const consumePendingContext = useCallback(() => {
    const context = pendingContext;
    setPendingContext(null);
    return context;
  }, [pendingContext]);

  const setChartContext = useCallback((data: ChartContextData | null) => {
    contextRef.current = data;
  }, []);

  const getChartContext = useCallback(() => {
    return contextRef.current;
  }, []);

  return (
    <TradingCopilotContext.Provider value={{
      isOpen,
      toggle,
      open,
      close,
      openWithContext,
      pendingContext,
      consumePendingContext,
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
  pendingContext: null,
  consumePendingContext: () => null,
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
