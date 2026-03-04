import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Radar, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useScanRequests } from '@/hooks/useScanRequests';
import { useAuth } from '@/contexts/AuthContext';

interface RequestScanButtonProps {
  symbol: string;
  assetType?: string;
  hasPatternData: boolean;
}

export function RequestScanButton({ symbol, assetType, hasPatternData }: RequestScanButtonProps) {
  const { user } = useAuth();
  const { requestScan, loading, requests } = useScanRequests(user?.id);
  
  // Check if there's already a request for this symbol
  const existingRequest = requests.find(r => r.symbol === symbol);
  const isPending = existingRequest?.status === 'pending' || existingRequest?.status === 'processing';
  const isCompleted = existingRequest?.status === 'completed';

  if (hasPatternData && !isCompleted) return null;

  const handleClick = async () => {
    await requestScan(symbol, assetType);
  };

  if (isPending) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Clock className="h-4 w-4 animate-pulse" />
        Scan Queued
      </Button>
    );
  }

  if (isCompleted) {
    return (
      <Button variant="outline" disabled className="gap-2 text-green-500 border-green-500/30">
        <CheckCircle2 className="h-4 w-4" />
        Scan Complete ({existingRequest.patterns_found || 0} patterns)
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
      Request Pattern Scan
    </Button>
  );
}
