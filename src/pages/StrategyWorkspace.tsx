import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { StrategyWorkspaceInterface } from '@/components/StrategyWorkspaceInterface';

const StrategyWorkspace = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'builder';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <StrategyWorkspaceInterface initialTab={initialTab} />
      </div>
    </div>
  );
};

export default StrategyWorkspace;