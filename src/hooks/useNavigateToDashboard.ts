import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Returns a click handler that navigates to the Dashboard with a symbol pre-selected.
 * Supports Ctrl/Cmd+click to open in a new tab.
 */
export function useNavigateToDashboard() {
  const navigate = useNavigate();

  const goToSymbol = useCallback((symbol: string, e?: React.MouseEvent) => {
    const path = '/members/dashboard';
    const state = { initialSymbol: symbol };

    if (e && (e.metaKey || e.ctrlKey)) {
      // Open in new tab — encode symbol as query param for stateless fallback
      window.open(`${path}?symbol=${encodeURIComponent(symbol)}`, '_blank');
    } else {
      navigate(path, { state });
    }
  }, [navigate]);

  return goToSymbol;
}
