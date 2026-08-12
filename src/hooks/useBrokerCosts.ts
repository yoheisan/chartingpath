import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrokerProfile {
  id: string;
  name: string;
  account_type: string;
  asset_class: string;
  typical_spread_pips: number;
  commission_per_lot_roundtrip: number;
  notes: string | null;
  source_url: string | null;
  is_custom: boolean;
  is_default: boolean;
  updated_at: string;
}

export interface BrokerCostSelection {
  brokerProfileId: string | null;
  customSpreadPips: number | null;
  customCommissionPerLot: number | null;
}

/**
 * The user's broker cost assumptions. Cost is per-user by design: the same cell
 * can carry an edge for a raw-spread account and none for a wide-spread one, so
 * every edge statement in the UI has to be qualified by whose costs it assumes.
 */
export function useBrokerCosts() {
  const [profiles, setProfiles] = useState<BrokerProfile[]>([]);
  const [selection, setSelection] = useState<BrokerCostSelection>({
    brokerProfileId: null,
    customSpreadPips: null,
    customCommissionPerLot: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: rows }, { data: sessionData }] = await Promise.all([
        supabase
          .from('broker_profiles')
          .select('*')
          .eq('asset_class', 'fx')
          .order('typical_spread_pips', { ascending: true }),
        supabase.auth.getSession(),
      ]);

      setProfiles((rows ?? []) as BrokerProfile[]);

      const userId = sessionData?.session?.user?.id;
      if (userId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('broker_profile_id, custom_spread_pips, custom_commission_per_lot')
          .eq('user_id', userId)
          .maybeSingle();
        setSelection({
          brokerProfileId: prof?.broker_profile_id ?? null,
          customSpreadPips: prof?.custom_spread_pips === null || prof?.custom_spread_pips === undefined
            ? null : Number(prof.custom_spread_pips),
          customCommissionPerLot: prof?.custom_commission_per_lot === null || prof?.custom_commission_per_lot === undefined
            ? null : Number(prof.custom_commission_per_lot),
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (next: BrokerCostSelection) => {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return false;
      const { error } = await supabase
        .from('profiles')
        .update({
          broker_profile_id: next.brokerProfileId,
          custom_spread_pips: next.customSpreadPips,
          custom_commission_per_lot: next.customCommissionPerLot,
        })
        .eq('user_id', userId);
      if (error) return false;
      setSelection(next);
      return true;
    } finally {
      setSaving(false);
    }
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selection.brokerProfileId) ?? null;
  const defaultProfile = profiles.find((p) => p.is_default) ?? null;

  return { profiles, selection, selectedProfile, defaultProfile, loading, saving, save, reload: load };
}
