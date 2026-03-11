import { useState, useCallback } from 'react';

const STORAGE_KEY = 'chartingpath_onboarding_completed';

export function useOnboardingState() {
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

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
