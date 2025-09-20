import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConsolidatedBacktestEngine } from './ConsolidatedBacktestEngine';
import BacktestResults from './BacktestResults';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { 
  Play, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Target,
  Activity,
  AlertCircle
} from 'lucide-react';

interface BacktestSectionProps {
  answers: GuidedStrategyAnswers;
  currentStrategy?: any;
  onBacktestComplete?: (results: any) => void;
  onAnswersChange?: (answers: GuidedStrategyAnswers) => void;
}

export const BacktestSection: React.FC<BacktestSectionProps> = ({
  answers,
  currentStrategy,
  onBacktestComplete,
  onAnswersChange
}) => {
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
    setShowResults(true);
    onBacktestComplete?.(results);
  };

  const isStrategyComplete = () => {
    return !!(
      answers.market?.instrument && 
      answers.market?.timeframes && 
      answers.market.timeframes.length > 0 && 
      answers.style?.approach
    );
  };

  const getStrategyPreview = () => {
    return {
      instrument: answers.market?.instrument || 'Not selected',
      timeframe: answers.market?.timeframes?.[0] || 'Not selected',
      approach: answers.style?.approach?.replace('-', ' ').toUpperCase() || 'Not selected',
      riskPerTrade: answers.risk?.riskPerTrade || 2,
      maxDrawdown: answers.risk?.maxDrawdown || 10,
      initialCapital: answers.risk?.accountPrinciple || 100000
    };
  };

  const preview = getStrategyPreview();

  if (showResults && backtestResults) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Backtest Results
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                size="sm"
              >
                Back to Configuration
              </Button>
            </div>
          </CardHeader>
        </Card>
        
        <BacktestResults 
          run={backtestResults}
          strategyAnswers={answers}
          onStrategySaved={() => {
            // Handle strategy save if needed
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategy Preview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategy Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review your strategy configuration before backtesting
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Instrument</p>
              <p className="font-medium">{preview.instrument}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Timeframe</p>
              <p className="font-medium">{preview.timeframe}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Approach</p>
              <Badge variant="secondary">{preview.approach}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Risk Per Trade</p>
              <p className="font-medium">{preview.riskPerTrade}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
              <p className="font-medium">{preview.maxDrawdown}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Initial Capital</p>
              <p className="font-medium">${preview.initialCapital.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Check */}
      {!isStrategyComplete() && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Strategy Configuration Incomplete
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Please complete the required fields before running a backtest:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {!answers.market?.instrument && <li>• Select a trading instrument</li>}
                  {(!answers.market?.timeframes || answers.market.timeframes.length === 0) && <li>• Choose a timeframe</li>}
                  {!answers.style?.approach && <li>• Select a trading approach</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backtest Engine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Backtest Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConsolidatedBacktestEngine
            strategyAnswers={answers}
            currentStrategy={currentStrategy}
            onBacktestComplete={handleBacktestComplete}
            isBacktesting={isBacktesting}
            setIsBacktesting={setIsBacktesting}
            onStrategyUpdate={onAnswersChange}
            embedded={true}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Calendar className="w-4 h-4" />
              <span>Historical Data</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <DollarSign className="w-4 h-4" />
              <span>Performance Metrics</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TrendingUp className="w-4 h-4" />
              <span>Risk Analysis</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};