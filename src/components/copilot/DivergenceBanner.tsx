import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface DivergenceBannerProps {
  userId?: string;
  isLive: boolean;
}

export function DivergenceBanner({ userId, isLive }: DivergenceBannerProps) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId || !isLive) { setShow(false); return; }

    const check = async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: paperTrades } = await supabase
        .from('paper_trades')
        .select('outcome_r')
        .eq('user_id', userId)
        .neq('status', 'open')
        .gte('created_at', `${today}T00:00:00`);

      const { data: liveTrades } = await supabase
        .from('live_trades')
        .select('pnl_r')
        .eq('user_id', userId)
        .neq('outcome', 'open')
        .gte('created_at', `${today}T00:00:00`);

      if (!paperTrades?.length || !liveTrades?.length) return;

      const paperAvg = paperTrades.reduce((s, tr) => s + (tr.outcome_r ?? 0), 0) / paperTrades.length;
      const liveAvg = liveTrades.reduce((s, tr) => s + (tr.pnl_r ?? 0), 0) / liveTrades.length;

      if (paperAvg > 0 && liveAvg < paperAvg * 0.9) {
        setShow(true);
      }
    };

    check();
  }, [userId, isLive]);

  if (!show) return null;

  return (
    <div className="mx-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-300">
        {t('copilotPage.divergenceWarning')}
      </p>
    </div>
  );
}
