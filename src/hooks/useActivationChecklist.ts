import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivationState {
  viewed_signal: boolean;
  ran_backtest: boolean;
  set_alert: boolean;
  dismissed: boolean;
  completed_at: string | null;
}

const defaultState: ActivationState = {
  viewed_signal: false,
  ran_backtest: false,
  set_alert: false,
  dismissed: false,
  completed_at: null,
};

export function useActivationChecklist() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<ActivationState>(defaultState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from('user_activation' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setState(data as any);
      } else {
        // Create initial record
        await supabase.from('user_activation' as any).insert({ user_id: user.id } as any);
      }
      setLoading(false);
    };

    load();
  }, [isAuthenticated, user]);

  const markStep = useCallback(async (step: keyof Pick<ActivationState, 'viewed_signal' | 'ran_backtest' | 'set_alert'>) => {
    if (!user || state[step]) return;

    const update: Record<string, any> = { [step]: true, updated_at: new Date().toISOString() };

    // Check if all steps will be complete
    const newState = { ...state, [step]: true };
    if (newState.viewed_signal && newState.ran_backtest && newState.set_alert) {
      update.completed_at = new Date().toISOString();
    }

    setState(prev => ({ ...prev, ...update }));

    await supabase
      .from('user_activation' as any)
      .update(update)
      .eq('user_id', user.id);
  }, [user, state]);

  const dismiss = useCallback(async () => {
    if (!user) return;
    setState(prev => ({ ...prev, dismissed: true }));
    await supabase
      .from('user_activation' as any)
      .update({ dismissed: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  }, [user]);

  const isComplete = state.viewed_signal && state.ran_backtest && state.set_alert;
  const completedCount = [state.viewed_signal, state.ran_backtest, state.set_alert].filter(Boolean).length;
  const shouldShow = isAuthenticated && !loading && !state.dismissed && !isComplete;

  return { state, loading, markStep, dismiss, isComplete, completedCount, shouldShow };
}
