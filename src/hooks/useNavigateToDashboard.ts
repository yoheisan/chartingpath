import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface DashboardNavOptions {
  /** Override the chart timeframe (e.g. '1h', '1d') */
  timeframe?: string;
  /** Pattern detection ID to highlight on the chart */
  detectionId?: string;
}

/**
 * Returns a click handler that navigates to the Dashboard with a symbol pre-selected.
 * Supports Ctrl/Cmd+click to open in a new tab.
 * Optionally pass timeframe & detectionId for trade-context navigation from Copilot.
 */
export function useNavigateToDashboard() {
  const navigate = useNavigate();

  const goToSymbol = useCallback((symbol: string, e?: React.MouseEvent, options?: DashboardNavOptions) => {
    const path = '/members/dashboard';
    const state: Record<string, any> = { initialSymbol: symbol };

    if (options?.timeframe) state.initialTimeframe = options.timeframe;
    if (options?.detectionId) state.initialDetectionId = options.detectionId;

    if (e && (e.metaKey || e.ctrlKey)) {
      // Open in new tab — encode params for stateless fallback
      const params = new URLSearchParams({ symbol });
      if (options?.timeframe) params.set('timeframe', options.timeframe);
      if (options?.detectionId) params.set('detectionId', options.detectionId);
      window.open(`${path}?${params.toString()}`, '_blank');
    } else {
      navigate(path, { state });
    }
  }, [navigate]);

  return goToSymbol;
}
