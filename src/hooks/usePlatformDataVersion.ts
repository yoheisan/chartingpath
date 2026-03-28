import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformDataVersion {
  version: number;
  label: string;
  activated_at: string | null;
}

export function usePlatformDataVersion() {
  const [data, setData] = useState<PlatformDataVersion | null>(null);

  useEffect(() => {
    supabase
      .from('platform_data_version')
      .select('version, label, activated_at')
      .eq('is_active', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setData(data as PlatformDataVersion);
      });
  }, []);

  return data;
}
