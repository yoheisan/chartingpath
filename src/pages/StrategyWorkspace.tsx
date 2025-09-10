import React from 'react';
import Navigation from '@/components/Navigation';
import { StrategyWorkspaceInterface } from '@/components/StrategyWorkspaceInterface';

const StrategyWorkspace = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <StrategyWorkspaceInterface />
      </div>
    </div>
  );
};

export default StrategyWorkspace;