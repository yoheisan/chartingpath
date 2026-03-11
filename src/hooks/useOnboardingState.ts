import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'chartingpath_onboarding_completed';

export function useOnboardingState() {
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Re-check localStorage after a short delay to catch the async
  // returning-user flag set by AuthContext's setTimeout callback
  useEffect(() => {
    if (isCompleted) return;
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === 'true') {
          setIsCompleted(true);
        }
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [isCompleted]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* ignore */ }
    setIsCompleted(true);
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    setIsCompleted(false);
  }, []);

  return { isCompleted, complete, reset };
}
