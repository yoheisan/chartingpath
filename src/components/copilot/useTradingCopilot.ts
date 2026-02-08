import { useState, useCallback, useRef } from "react";

export interface ChartContextData {
  symbol: string;
  timeframe: string;
  summary: string;
}

export function useTradingCopilot() {
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

  // Open copilot with pre-filled context from chart analysis
  const openWithContext = useCallback((context: string, chartData?: ChartContextData) => {
    if (chartData) {
      contextRef.current = chartData;
    }
    setPendingContext(context);
    setIsOpen(true);
  }, []);

  // Consume the pending context (called by TradingCopilot when it renders)
  const consumePendingContext = useCallback(() => {
    const context = pendingContext;
    setPendingContext(null);
    return context;
  }, [pendingContext]);

  // Set chart context without opening (for passive context awareness)
  const setChartContext = useCallback((data: ChartContextData | null) => {
    contextRef.current = data;
  }, []);

  // Get current chart context
  const getChartContext = useCallback(() => {
    return contextRef.current;
  }, []);

  return {
    isOpen,
    toggle,
    open,
    close,
    openWithContext,
    consumePendingContext,
    pendingContext,
    setChartContext,
    getChartContext
  };
}
