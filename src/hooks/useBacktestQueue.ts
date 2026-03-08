import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface BacktestQueueRow {
  id: string;
  user_id: string;
  instrument: string;
  pattern_id: string;
  timeframe: string;
  composite_score: number | null;
  verdict: string | null;
  status: 'queued' | 'running' | 'complete' | 'failed';
  run_id: string | null;
  error_message: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export function useBacktestQueue() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prevQueueRef = useRef<BacktestQueueRow[]>([]);

  const query = useQuery({
    queryKey: ['backtest-queue'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      const { data } = await supabase
        .from('backtest_queue')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['queued', 'running', 'complete', 'failed'])
        .order('queued_at', { ascending: false })
        .limit(20);

      return (data ?? []) as BacktestQueueRow[];
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.some(
        (d) => d.status === 'queued' || d.status === 'running'
      );
      return hasActive ? 8_000 : false;
    },
  });

  // Poll project_runs for running rows that have a run_id, mark complete when done
  useEffect(() => {
    const runningRows = (query.data ?? []).filter(
      (r) => r.status === 'running' && r.run_id
    );
    if (runningRows.length === 0) return;

    const checkRuns = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      for (const row of runningRows) {
        try {
          const res = await fetch(
            `https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/result?runId=${row.run_id}`,
            {
              headers: { Authorization: `Bearer ${session.access_token}` },
            }
          );
          if (!res.ok) continue;
          const data = await res.json();
          const status = data?.run?.status;

          if (status === 'succeeded') {
            await supabase
              .from('backtest_queue')
              .update({ status: 'complete', completed_at: new Date().toISOString() })
              .eq('id', row.id);
            queryClient.invalidateQueries({ queryKey: ['backtest-queue'] });
          } else if (status === 'failed') {
            await supabase
              .from('backtest_queue')
              .update({
                status: 'failed',
                error_message: data?.run?.errorMessage ?? 'Run failed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', row.id);
            queryClient.invalidateQueries({ queryKey: ['backtest-queue'] });
          }
        } catch {
          // Silently ignore — will retry on next poll
        }
      }
    };

    checkRuns();
  }, [query.data, queryClient]);

  // Fire completion toasts for newly completed rows
  useEffect(() => {
    const current = query.data ?? [];

    const newlyCompleted = current.filter(
      (row) =>
        row.status === 'complete' &&
        !prevQueueRef.current.find(
          (p) => p.id === row.id && p.status === 'complete'
        )
    );

    const newlyFailed = current.filter(
      (row) =>
        row.status === 'failed' &&
        !prevQueueRef.current.find(
          (p) => p.id === row.id && p.status === 'failed'
        )
    );

    newlyCompleted.forEach((row) => {
      toast.success(
        `✅ ${row.instrument} · ${row.pattern_id} · ${row.timeframe} backtest complete`,
        {
          action: row.run_id
            ? {
                label: 'View Results',
                onClick: () => navigate(`/projects/runs/${row.run_id}`),
              }
            : undefined,
          duration: 10_000,
        }
      );
    });

    newlyFailed.forEach((row) => {
      toast.error(
        `❌ ${row.instrument} · ${row.pattern_id} backtest failed: ${row.error_message ?? 'unknown error'}`
      );
    });

    prevQueueRef.current = current;
  }, [query.data, navigate]);

  const activeCount = (query.data ?? []).filter(
    (r) => r.status === 'queued' || r.status === 'running'
  ).length;

  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    activeCount,
    refetch: query.refetch,
  };
}
