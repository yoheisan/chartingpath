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
  leftPanelSize: 20,
  mainPanelSize: 55,
  rightPanelSize: 25,
  topChartSize: 70,
  bottomPanelSize: 30,
  alertsPanelSize: 50,
  marketOverviewSize: 50,
};

function loadSettings(): DashboardSettings {
  if (!hasPersistentBrowserStorage()) {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new fields added in updates
    return { ...DEFAULT_SETTINGS, ...parsed };
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
