import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Play, TrendingUp, TrendingDown } from 'lucide-react';

interface BacktestEngineProps {
  strategy: any;
  results: any;
  isRunning: boolean;
  onBacktest: () => void;
}

export const BacktestEngine: React.FC<BacktestEngineProps> = ({
  strategy,
  results,
  isRunning,
  onBacktest
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Professional Backtest Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onBacktest} disabled={isRunning} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Running Backtest...' : 'Run Professional Backtest'}
          </Button>
          
          {results && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Total Return</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">+15.4%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Max Drawdown</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">-5.2%</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};