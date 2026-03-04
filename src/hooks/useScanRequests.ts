import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScanRequest {
  id: string;
  symbol: string;
  status: string;
  patterns_found: number | null;
  notified: boolean;
  requested_at: string;
  completed_at: string | null;
}

export function useScanRequests(userId?: string) {
  const [requests, setRequests] = useState<ScanRequest[]>([]);
  const [completedUnnotified, setCompletedUnnotified] = useState<ScanRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('scan_requests')
      .select('id, symbol, status, patterns_found, notified, requested_at, completed_at')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setRequests(data as ScanRequest[]);
      const unnotified = (data as ScanRequest[]).filter(r => r.status === 'completed' && !r.notified);
      setCompletedUnnotified(unnotified);
    }
  }, [userId]);

  // Check for completed scans on mount and show toasts
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Show toast for newly completed scans
  useEffect(() => {
    if (completedUnnotified.length === 0) return;
    
    completedUnnotified.forEach(async (req) => {
      toast.success(`Scan complete: ${req.symbol}`, {
        description: `${req.patterns_found || 0} historical patterns found. View results now.`,
        duration: 8000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/instruments/${req.symbol}`;
          },
        },
      });

      // Mark as notified
      await supabase
        .from('scan_requests')
        .update({ notified: true })
        .eq('id', req.id);
    });

    setCompletedUnnotified([]);
  }, [completedUnnotified]);

  const requestScan = useCallback(async (symbol: string, assetType?: string) => {
    if (!userId) {
      toast.error('Please sign in to request a scan');
      return false;
    }

    setLoading(true);
    try {
      // Check rate limit
      const { data: limitCheck } = await supabase.rpc('check_scan_request_limit', { p_user_id: userId });
      const limit = limitCheck as unknown as { allowed: boolean; used: number; limit: number; plan: string } | null;
      
      if (limit && !limit.allowed) {
        toast.error('Daily scan limit reached', {
          description: `You've used ${limit.used}/${limit.limit} scans today. Upgrade for more.`,
        });
        return false;
      }

      const { error } = await supabase.from('scan_requests').insert({
        user_id: userId,
        symbol,
        asset_type: assetType || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('Scan already requested', {
            description: `A scan for ${symbol} is already in the queue.`,
          });
        } else {
          toast.error('Failed to request scan', { description: error.message });
        }
        return false;
      }

      toast.success('Scan requested!', {
        description: `${symbol} will be analyzed overnight. You'll be notified when results are ready.`,
      });

      await fetchRequests();
      return true;
    } finally {
      setLoading(false);
    }
  }, [userId, fetchRequests]);

  const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'processing').length;

  return { requests, requestScan, loading, pendingCount, completedUnnotified: completedUnnotified.length };
}
