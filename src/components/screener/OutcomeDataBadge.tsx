import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OutcomeDataBadge() {
  const { t } = useTranslation();
  const { data: count } = useQuery({
    queryKey: ['total-outcome-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('historical_pattern_occurrences')
        .select('*', { count: 'exact', head: true })
        .in('outcome', ['hit_tp', 'hit_sl']);
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hour cache
  });

  if (!count) return null;

  const formatted =
    count >= 1_000_000
      ? `${(count / 1_000_000).toFixed(1)}M`
      : count >= 1_000
      ? `${Math.floor(count / 1_000)}K`
      : count.toString();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
      <Database className="h-3.5 w-3.5" />
      <span>{t('outcomeData.badge', '{{value}}+ backtested outcomes', { value: formatted })}</span>
    </div>
  );
}