import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgentWeights, DEFAULT_WEIGHTS, DEFAULT_CUTOFFS } from '../../engine/backtester-v2/agents/types';
import { AssetClassFilter } from '@/components/agent-backtest/TradeOpportunityTable';
import { TimeframeFilter } from '@/hooks/useAgentScoringDetections';

export interface SubFilters {
  fxCategory?: 'all' | 'major' | 'minor' | 'exotic';
  stockExchanges?: string[];
  cryptoCategory?: 'all' | 'major' | 'alt';
}

export interface AgentScoringSettingsData {
  id?: string;
  name: string;
  weights: AgentWeights;
  takeCutoff: number;
  watchCutoff: number;
  assetClassFilter: AssetClassFilter;
  timeframeFilter: TimeframeFilter;
  subFilters: SubFilters;
  isDefault: boolean;
}

const LOCAL_KEY = 'agent_scoring_settings';
const LOCAL_LAST_KEY = 'agent_scoring_last_setting_id';

function saveToLocal(settings: AgentScoringSettingsData[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(settings)); } catch {}
}

function loadFromLocal(): AgentScoringSettingsData[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useAgentScoringSettings() {
  const qc = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['agent-scoring-settings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return loadFromLocal();

      const { data, error } = await supabase
        .from('agent_scoring_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: AgentScoringSettingsData[] = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        weights: r.weights as AgentWeights,
        takeCutoff: r.take_cutoff,
        watchCutoff: r.watch_cutoff,
        assetClassFilter: r.asset_class_filter as AssetClassFilter,
        timeframeFilter: r.timeframe_filter as TimeframeFilter,
        subFilters: (r.sub_filters || {}) as SubFilters,
        isDefault: r.is_default,
      }));

      saveToLocal(mapped);
      return mapped;
    },
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (setting: AgentScoringSettingsData) => {
      const { data: { session } } = await supabase.auth.getSession();

      const row = {
        name: setting.name,
        weights: setting.weights as any,
        take_cutoff: setting.takeCutoff,
        watch_cutoff: setting.watchCutoff,
        asset_class_filter: setting.assetClassFilter,
        timeframe_filter: setting.timeframeFilter,
        sub_filters: setting.subFilters as any,
        is_default: setting.isDefault,
      };

      if (session?.user) {
        if (setting.id) {
          const { error } = await supabase
            .from('agent_scoring_settings')
            .update({ ...row, updated_at: new Date().toISOString() })
            .eq('id', setting.id);
          if (error) throw error;
          return setting.id;
        } else {
          const { data, error } = await supabase
            .from('agent_scoring_settings')
            .insert({ ...row, user_id: session.user.id })
            .select('id')
            .single();
          if (error) throw error;
          return data.id;
        }
      } else {
        // Local only
        const local = loadFromLocal();
        if (setting.id) {
          const idx = local.findIndex(s => s.id === setting.id);
          if (idx >= 0) local[idx] = setting;
        } else {
          setting.id = crypto.randomUUID();
          local.push(setting);
        }
        saveToLocal(local);
        return setting.id;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-scoring-settings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase.from('agent_scoring_settings').delete().eq('id', id);
        if (error) throw error;
      } else {
        const local = loadFromLocal().filter(s => s.id !== id);
        saveToLocal(local);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-scoring-settings'] }),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase.from('agent_scoring_settings').update({ name, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      } else {
        const local = loadFromLocal();
        const s = local.find(s => s.id === id);
        if (s) { s.name = name; saveToLocal(local); }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-scoring-settings'] }),
  });

  return {
    settings,
    isLoading,
    save: saveMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    rename: renameMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

export function useStockExchanges() {
  return useQuery({
    queryKey: ['stock-exchanges'],
    queryFn: async () => {
      // Try instruments table first
      const { data, error } = await supabase
        .from('instruments')
        .select('exchange')
        .eq('asset_type', 'stock')
        .eq('is_active', true);
      
      let exchanges: string[] = [];
      if (!error && data && data.length > 0) {
        exchanges = [...new Set(data.map((r: any) => r.exchange).filter(Boolean))].sort();
      }
      
      // Fallback: derive from live_pattern_detections if instruments table has no stocks
      if (exchanges.length === 0) {
        const { data: lpd } = await supabase
          .from('live_pattern_detections')
          .select('exchange')
          .eq('asset_type', 'stock')
          .eq('status', 'active');
        if (lpd && lpd.length > 0) {
          exchanges = [...new Set(lpd.map((r: any) => r.exchange).filter(Boolean))].sort();
        }
      }

      // Final fallback: hardcoded common exchanges
      if (exchanges.length === 0) {
        exchanges = ['NYSE', 'NASDAQ', 'LSE', 'HKEX', 'TSE', 'SET'];
      }
      
      return exchanges;
    },
    staleTime: 300_000,
  });
}
