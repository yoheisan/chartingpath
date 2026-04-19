import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanKey =
  | 'lite_monthly' | 'lite_annual'
  | 'pro_monthly'  | 'pro_annual'
  | 'elite_monthly'| 'elite_annual';

export function useCheckout() {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (planKey: PlanKey, email?: string) => {
    setLoading(planKey);
    setError(null);
    try {
      // Always call the edge function — it accepts both authenticated
      // and anonymous requests. Supabase JS automatically attaches the
      // user's session token if logged in, otherwise the anon key.
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: { planKey, email },
      });

      if (fnError || !data?.checkout_url) {
        throw new Error(fnError?.message || 'Failed to create checkout session');
      }

      window.location.href = data.checkout_url;
    } catch (err: any) {
      setError(err.message);
      console.error('[useCheckout]', err.message);
    } finally {
      setLoading(null);
    }
  };

  return { startCheckout, loading, error };
}
