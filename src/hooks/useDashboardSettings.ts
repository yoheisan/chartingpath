import { useState, useEffect, useCallback } from 'react';
import { hasPersistentBrowserStorage } from '@/utils/safeStorage';

const STORAGE_KEY = 'cp-dashboard-settings';

export interface DashboardSettings {
  // Main layout
  selectedSymbol: string;
  selectedTimeframe: string;
  bottomPanelAccordion: string | null; // 'pattern-history' | 'research' | null
  
  // Watchlist panel
  watchlistTab: string;
  
  // Market overview panel
  marketOverviewTab: string;
  
  // Economic calendar filters
  calendarRegions: string[];
  calendarImpacts: string[];
  
  // Panel sizes (percentages)
  leftPanelSize: number;
  mainPanelSize: number;
  rightPanelSize: number;
  topChartSize: number;
  bottomPanelSize: number;
  alertsPanelSize: number;
  marketOverviewSize: number;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  selectedSymbol: 'AAPL',
  selectedTimeframe: '1d',
  bottomPanelAccordion: 'pattern-history',
  watchlistTab: 'watchlist',
  marketOverviewTab: 'indices',
  calendarRegions: ['US', 'EU', 'UK', 'JP'],
  calendarImpacts: ['high', 'medium'],
  leftPanelSize: 0, // deprecated - left panel removed
  mainPanelSize: 75, // main chart area
  rightPanelSize: 25, // right sidebar (watchlist/alerts + market overview)
  topChartSize: 70,
  bottomPanelSize: 30,
  alertsPanelSize: 50,
  marketOverviewSize: 50,
};

/**
 * Normalize panel sizes to ensure they sum to 100%.
 * Handles legacy settings from when there were 3 horizontal panels.
 */
function normalizeHorizontalPanels(settings: DashboardSettings): DashboardSettings {
  const { mainPanelSize, rightPanelSize } = settings;
  const total = mainPanelSize + rightPanelSize;
  
  // If they already sum to ~100%, no need to normalize
  if (Math.abs(total - 100) < 1) {
    return settings;
  }
  
  // Normalize proportionally
  const normalizedMain = Math.round((mainPanelSize / total) * 100);
  const normalizedRight = 100 - normalizedMain;
  
  return {
    ...settings,
    mainPanelSize: normalizedMain,
    rightPanelSize: normalizedRight,
  };
}

function loadSettings(): DashboardSettings {
  if (!hasPersistentBrowserStorage()) {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new fields added in updates
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    
    // Normalize horizontal panel sizes to fix legacy 3-panel settings
    return normalizeHorizontalPanels(merged);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: DashboardSettings): void {
  if (!hasPersistentBrowserStorage()) return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('[DashboardSettings] Failed to save:', err);
  }
}

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(loadSettings);
  
  // Persist whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  
  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);
  
  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

// Individual hooks for specific components
export function useCalendarSettings() {
  const { settings, updateSettings } = useDashboardSettings();
  
  return {
    regions: settings.calendarRegions,
    impacts: settings.calendarImpacts,
    setRegions: (regions: string[]) => updateSettings({ calendarRegions: regions }),
    setImpacts: (impacts: string[]) => updateSettings({ calendarImpacts: impacts }),
  };
}
