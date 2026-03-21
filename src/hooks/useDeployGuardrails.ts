import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GuardrailCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export function useDeployGuardrails(userId?: string) {
  const [checks, setChecks] = useState<GuardrailCheck[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  const evaluate = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      // Check 1: >= 20 closed paper trades
      const { count: closedCount } = await supabase
        .from('paper_trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'open');

      const tradeCount = closedCount ?? 0;
      const check1: GuardrailCheck = {
        label: '20+ closed paper trades',
        passed: tradeCount >= 20,
        detail: tradeCount >= 20
          ? `${tradeCount} closed trades ✓`
          : `${tradeCount}/20 closed trades needed`,
      };

      // Check 2: positive expectancy on AI trades
      const { data: aiTrades } = await supabase
        .from('paper_trades')
        .select('outcome_r')
        .eq('user_id', userId)
        .eq('attribution', 'ai_approved')
        .neq('status', 'open');

      const avgR = aiTrades && aiTrades.length > 0
        ? aiTrades.reduce((s: number, t: any) => s + (t.outcome_r ?? 0), 0) / aiTrades.length
        : 0;

      const check2: GuardrailCheck = {
        label: 'Positive AI expectancy',
        passed: avgR > 0,
        detail: avgR > 0
          ? `Avg ${avgR.toFixed(2)}R per trade ✓`
          : `Avg ${avgR.toFixed(2)}R — needs to be positive`,
      };

      // Check 3: active Master Plan
      const { data: planData } = await supabase
        .from('master_plans' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const check3: GuardrailCheck = {
        label: 'Active Master Plan',
        passed: !!planData,
        detail: planData ? 'Master Plan set ✓' : 'Set a Master Plan first',
      };

      const all = [check1, check2, check3];
      setChecks(all);
      setAllPassed(all.every(c => c.passed));
    } catch (err) {
      console.error('[DeployGuardrails]', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { evaluate(); }, [evaluate]);

  return { checks, allPassed, loading, refetch: evaluate };
}
