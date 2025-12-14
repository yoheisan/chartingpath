import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const STORAGE_KEY = 'charting_path_strategy_draft';
const AUTO_SAVE_INTERVAL = 15000; // 15 seconds

interface StrategyData {
  id?: string;
  name: string;
  description?: string;
  market?: any;
  patterns: any[];
  patternRules?: Record<string, any>;
  targetGainPercent: number;
  stopLossPercent: number;
  positionSizing: any;
  positionManagement?: any;
  disciplineFilters?: any;
  backtestPeriod?: any;
  backtestResults?: any;
  updated_at?: Date;
}

export const useStrategyAutoSave = (
  strategy: StrategyData,
  onStrategyRestore: (strategy: StrategyData) => void
) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedStrategyRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserId(user?.id || null);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
      setUserId(session?.user?.id || null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage (for session persistence)
  const saveToLocalStorage = useCallback((data: StrategyData) => {
    try {
      const serialized = JSON.stringify({
        strategy: data,
        savedAt: new Date().toISOString(),
        userId: userId
      });
      localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }, [userId]);

  // Save to database (for logged-in users)
  const saveToDatabase = useCallback(async (data: StrategyData): Promise<boolean> => {
    if (!isAuthenticated || !userId) return false;
    
    try {
      // First check if draft exists
      const { data: existing } = await supabase
        .from('guided_strategies')
        .select('id')
        .eq('user_id', userId)
        .eq('name', '__AUTO_SAVE_DRAFT__')
        .maybeSingle();
      
      const strategyJson = JSON.parse(JSON.stringify({
        ...data,
        isDraft: true,
        autoSavedAt: new Date().toISOString()
      })) as Json;
      
      if (existing) {
        // Update existing draft
        const { error } = await supabase
          .from('guided_strategies')
          .update({
            answers: strategyJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await supabase
          .from('guided_strategies')
          .insert({
            user_id: userId,
            name: '__AUTO_SAVE_DRAFT__',
            description: 'Auto-saved draft strategy',
            answers: strategyJson
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save to database:', error);
      return false;
    }
  }, [isAuthenticated, userId]);

  // Main save function
  const saveStrategy = useCallback(async (showToast = false) => {
    const currentStrategyString = JSON.stringify(strategy);
    
    // Skip if nothing changed
    if (currentStrategyString === lastSavedStrategyRef.current) {
      return;
    }
    
    setIsSaving(true);
    
    // Always save to localStorage for session persistence
    const localSaved = saveToLocalStorage(strategy);
    
    // Also save to database if authenticated
    let dbSaved = false;
    if (isAuthenticated) {
      dbSaved = await saveToDatabase(strategy);
    }
    
    if (localSaved || dbSaved) {
      lastSavedStrategyRef.current = currentStrategyString;
      setLastSaved(new Date());
      
      if (showToast) {
        toast.success('Strategy auto-saved', {
          description: isAuthenticated ? 'Saved to your account' : 'Saved to session',
          duration: 2000
        });
      }
    }
    
    setIsSaving(false);
  }, [strategy, isAuthenticated, saveToLocalStorage, saveToDatabase]);

  // Auto-save every 15 seconds
  useEffect(() => {
    saveTimeoutRef.current = setInterval(() => {
      saveStrategy(false); // Silent save
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [saveStrategy]);

  // Save on unmount
  useEffect(() => {
    return () => {
      // Synchronous save to localStorage on unmount
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          strategy,
          savedAt: new Date().toISOString(),
          userId
        }));
      } catch (e) {
        console.error('Failed to save on unmount:', e);
      }
    };
  }, [strategy, userId]);

  // Restore strategy on mount
  const restoreStrategy = useCallback(async () => {
    if (hasRestoredRef.current) return false;
    hasRestoredRef.current = true;
    
    // First try localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { strategy: savedStrategy, savedAt, userId: savedUserId } = JSON.parse(stored);
        
        // Check if this is a recent save (within last 24 hours)
        const savedDate = new Date(savedAt);
        const hoursSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSave < 24 && savedStrategy?.patterns) {
          // For non-authenticated users, always restore from localStorage
          if (!isAuthenticated) {
            onStrategyRestore(savedStrategy as StrategyData);
            setLastSaved(savedDate);
            lastSavedStrategyRef.current = JSON.stringify(savedStrategy);
            toast.info('Restored your previous session', {
              description: `Last saved ${formatTimeAgo(savedDate)}`,
              duration: 3000
            });
            return true;
          }
          
          // For authenticated users, check if the saved strategy belongs to them
          if (savedUserId === userId) {
            // Try to get more recent from database
            const { data } = await supabase
              .from('guided_strategies')
              .select('*')
              .eq('user_id', userId)
              .eq('name', '__AUTO_SAVE_DRAFT__')
              .maybeSingle();
            
            if (data?.answers && typeof data.answers === 'object' && !Array.isArray(data.answers)) {
              const dbStrategy = data.answers as unknown as StrategyData;
              const dbSavedAt = new Date(data.updated_at);
              
              // Use whichever is more recent
              if (dbSavedAt > savedDate && dbStrategy.patterns) {
                onStrategyRestore(dbStrategy);
                setLastSaved(dbSavedAt);
                lastSavedStrategyRef.current = JSON.stringify(dbStrategy);
                toast.info('Restored your draft strategy', {
                  description: `Last saved ${formatTimeAgo(dbSavedAt)}`,
                  duration: 3000
                });
                return true;
              }
            }
            
            // Use localStorage version
            onStrategyRestore(savedStrategy as StrategyData);
            setLastSaved(savedDate);
            lastSavedStrategyRef.current = JSON.stringify(savedStrategy);
            toast.info('Restored your previous session', {
              description: `Last saved ${formatTimeAgo(savedDate)}`,
              duration: 3000
            });
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore from localStorage:', error);
    }
    
    // For authenticated users, try database
    if (isAuthenticated && userId) {
      try {
        const { data } = await supabase
          .from('guided_strategies')
          .select('*')
          .eq('user_id', userId)
          .eq('name', '__AUTO_SAVE_DRAFT__')
          .maybeSingle();
        
        if (data?.answers && typeof data.answers === 'object' && !Array.isArray(data.answers)) {
          const dbStrategy = data.answers as unknown as StrategyData;
          if (dbStrategy.patterns) {
            onStrategyRestore(dbStrategy);
            setLastSaved(new Date(data.updated_at));
            lastSavedStrategyRef.current = JSON.stringify(dbStrategy);
            toast.info('Restored your draft strategy', {
              description: `Last saved ${formatTimeAgo(new Date(data.updated_at))}`,
              duration: 3000
            });
            return true;
          }
        }
      } catch (error) {
        console.error('Failed to restore from database:', error);
      }
    }
    
    return false;
  }, [isAuthenticated, userId, onStrategyRestore]);

  // Clear saved data
  const clearSavedStrategy = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    lastSavedStrategyRef.current = '';
    setLastSaved(null);
    
    if (isAuthenticated && userId) {
      await supabase
        .from('guided_strategies')
        .delete()
        .eq('user_id', userId)
        .eq('name', '__AUTO_SAVE_DRAFT__');
    }
  }, [isAuthenticated, userId]);

  // Force save now
  const forceSave = useCallback(() => {
    saveStrategy(true);
  }, [saveStrategy]);

  return {
    lastSaved,
    isSaving,
    restoreStrategy,
    clearSavedStrategy,
    forceSave,
    isAuthenticated
  };
};

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
