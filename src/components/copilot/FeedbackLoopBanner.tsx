import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackLoopBannerProps {
  onFocusNLBar: (prefill?: string) => void;
}

interface OverridePattern {
  setup_type: string;
  count: number;
}

export function FeedbackLoopBanner({ onFocusNLBar }: FeedbackLoopBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [overridePattern, setOverridePattern] = useState<OverridePattern | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchOverrides = async () => {
      try {
        const { data } = await supabase
          .from('paper_trades' as any)
          .select('setup_type, user_action')
          .eq('user_id', user.id)
          .eq('user_action', 'overwrite');

        if (!data || data.length === 0) return;

        const counts: Record<string, number> = {};
        (data as any[]).forEach((tr) => {
          const st = tr.setup_type || 'unknown';
          counts[st] = (counts[st] || 0) + 1;
        });

        const top = Object.entries(counts)
          .filter(([, c]) => c >= 3)
          .sort((a, b) => b[1] - a[1])[0];

        if (top) {
          setOverridePattern({ setup_type: top[0], count: top[1] });
        }
      } catch {
        // silently fail
      }
    };

    fetchOverrides();
  }, [user?.id]);

  if (dismissed || !overridePattern) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
      <p className="text-sm leading-[1.6] text-amber-200/90">
        {t('copilotPage.overridePatternBanner', { setupType: overridePattern.setup_type, count: overridePattern.count })}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onFocusNLBar(`Update my plan to also include ${overridePattern.setup_type} setups`)}
          className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-1 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors whitespace-nowrap"
        >
          {t('copilotPage.updatePlan')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md border border-border/40 bg-secondary/50 px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          {t('copilotPage.keepMyRules')}
        </button>
      </div>
    </div>
  );
}
