import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export const useBacktesterV2Usage = () => {
  const { user, getBacktesterV2Quota } = useUserProfile();
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quota = getBacktesterV2Quota();
  const hasUnlimited = quota === -1;
  const canRunBacktest = hasUnlimited || currentUsage < quota;
  const usagePercentage = hasUnlimited ? 0 : (currentUsage / quota) * 100;

  const fetchUsage = async () => {
    if (!user) {
      setCurrentUsage(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_backtester_v2_usage', { p_user_id: user.id });

      if (error) throw error;
      
      setCurrentUsage(data || 0);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching V2 usage:', err);
      setError(err.message);
      setCurrentUsage(0);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (): Promise<number> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .rpc('increment_backtester_v2_usage', { p_user_id: user.id });

      if (error) throw error;
      
      const newUsage = data || 0;
      setCurrentUsage(newUsage);
      return newUsage;
    } catch (err: any) {
      console.error('Error incrementing V2 usage:', err);
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  return {
    currentUsage,
    quota,
    hasUnlimited,
    canRunBacktest,
    usagePercentage,
    loading,
    error,
    incrementUsage,
    refreshUsage: fetchUsage
  };
};