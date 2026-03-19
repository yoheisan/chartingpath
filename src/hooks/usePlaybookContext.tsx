import { useState, useEffect, useCallback } from 'react';

// Playbook context for preserving strategy state across auth redirects
export interface PlaybookContext {
  symbol: string;
  pattern: string;
  timeframe: string;
  instrumentCategory: string;
  // Deploy-as-Alert extensions
  autoPaperTrade?: boolean;
  riskPercent?: number;
  winRate?: number;
  totalTrades?: number;
  source?: 'pattern-lab' | 'strategy-workspace' | 'agent-scoring';
}

const STORAGE_KEY = 'chartingpath_playbook_context';

export const usePlaybookContext = () => {
  const [playbookContext, setPlaybookContextState] = useState<PlaybookContext | null>(null);

  // Load context from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPlaybookContextState(parsed);
      }
    } catch (e) {
      console.error('Error loading playbook context:', e);
    }
  }, []);

  // Save context to sessionStorage
  const savePlaybookContext = useCallback((context: PlaybookContext) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
      setPlaybookContextState(context);
    } catch (e) {
      console.error('Error saving playbook context:', e);
    }
  }, []);

  // Clear context from sessionStorage
  const clearPlaybookContext = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setPlaybookContextState(null);
    } catch (e) {
      console.error('Error clearing playbook context:', e);
    }
  }, []);

  // Get context without state (for one-time reads)
  const getPlaybookContext = useCallback((): PlaybookContext | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error getting playbook context:', e);
    }
    return null;
  }, []);

  return {
    playbookContext,
    savePlaybookContext,
    clearPlaybookContext,
    getPlaybookContext,
  };
};

// Static helpers for use outside of React components
export const savePlaybookContextStatic = (context: PlaybookContext) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch (e) {
    console.error('Error saving playbook context:', e);
  }
};

export const getPlaybookContextStatic = (): PlaybookContext | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error getting playbook context:', e);
  }
  return null;
};

export const clearPlaybookContextStatic = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing playbook context:', e);
  }
};
