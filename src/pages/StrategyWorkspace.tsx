import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { StrategyWorkspaceInterface } from '@/components/StrategyWorkspaceInterface';

const StrategyWorkspace = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'builder';

  return (
    <div className="min-h-screen bg-background">
      <StrategyWorkspaceInterface initialTab={initialTab} />
    </div>
  );
};

export default StrategyWorkspace;