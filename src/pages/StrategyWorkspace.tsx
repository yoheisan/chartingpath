import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { StrategyWorkspaceInterface } from '@/components/StrategyWorkspaceInterface';

const StrategyWorkspace = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'quick-select';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <StrategyWorkspaceInterface initialTab={initialTab} />
      </div>
    </div>
  );
};

export default StrategyWorkspace;