import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

interface QuickTestResult {
  strategy: string;
  asset: string;
  period: string;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  confidence: 'High' | 'Medium' | 'Low';
  recommendation: string;
  nextSteps: string[];
}

interface QuickTestResultsProps {
  results: QuickTestResult;
  onRunFullBacktest: () => void;
  onOptimize: () => void;
  onNewTest: () => void;
}

export const QuickTestResults: React.FC<QuickTestResultsProps> = ({
  results,
  onRunFullBacktest,
  onOptimize,
  onNewTest
}) => {
  const getPerformanceColor = (value: number, type: 'return' | 'drawdown' | 'ratio') => {
    if (type === 'return') {
      return value > 15 ? 'text-green-600' : value > 0 ? 'text-blue-600' : 'text-red-600';
    }
    if (type === 'drawdown') {
      return value < 5 ? 'text-green-600' : value < 15 ? 'text-yellow-600' : 'text-red-600';
    }
    if (type === 'ratio') {
      return value > 1.5 ? 'text-green-600' : value > 1.0 ? 'text-blue-600' : 'text-red-600';
    }
    return '';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Low': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return '';
    }
  };

  const overallScore = Math.round(
    (Math.max(0, Math.min(100, results.totalReturn * 2)) +
     results.winRate +
     Math.max(0, Math.min(100, (100 - results.maxDrawdown) * 2)) +
     Math.max(0, Math.min(100, results.profitFactor * 20))) / 4
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Test Results: {results.strategy} on {results.asset}
            <Badge className={getConfidenceColor(results.confidence)}>
              {results.confidence} Confidence
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {results.period} test period • {results.totalTrades} trades executed
          </p>
        </CardHeader>
      </Card>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={overallScore} className="h-3" />
            </div>
            <div className="text-2xl font-bold">
              {overallScore}/100
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {overallScore >= 75 ? 'Excellent performance - ready for full testing' :
             overallScore >= 60 ? 'Good performance - consider optimization' :
             overallScore >= 40 ? 'Fair performance - needs refinement' :
             'Poor performance - strategy needs significant adjustments'}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${getPerformanceColor(results.totalReturn, 'return')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className={`font-medium ${getPerformanceColor(results.totalReturn, 'return')}`}>
                  {results.totalReturn > 0 ? '+' : ''}{results.totalReturn.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="font-medium text-blue-600">{results.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className={`w-4 h-4 ${getPerformanceColor(results.maxDrawdown, 'drawdown')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <p className={`font-medium ${getPerformanceColor(results.maxDrawdown, 'drawdown')}`}>
                  -{results.maxDrawdown.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${getPerformanceColor(results.profitFactor, 'ratio')}`} />
              <div>
                <p className="text-sm text-muted-foreground">Profit Factor</p>
                <p className={`font-medium ${getPerformanceColor(results.profitFactor, 'ratio')}`}>
                  {results.profitFactor.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Average Win:</span>
              <span className="font-medium text-green-600">+{results.avgWin.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average Loss:</span>
              <span className="font-medium text-red-600">-{results.avgLoss.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Risk-Reward Ratio:</span>
              <span className="font-medium">1:{(results.avgWin / results.avgLoss).toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Sharpe Ratio:</span>
              <span className="font-medium">{results.sharpeRatio.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {results.confidence === 'High' ? <CheckCircle className="w-4 h-4 text-green-600" /> : 
               <AlertCircle className="w-4 h-4 text-yellow-600" />}
              Analysis & Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{results.recommendation}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Next Steps:</p>
              <ul className="text-sm space-y-1">
                {results.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onRunFullBacktest} className="flex-1">
          <BarChart3 className="w-4 h-4 mr-2" />
          Run Full Backtest
        </Button>
        <Button variant="outline" onClick={onOptimize} className="flex-1">
          <Target className="w-4 h-4 mr-2" />
          Optimize Parameters
        </Button>
        <Button variant="outline" onClick={onNewTest}>
          <Clock className="w-4 h-4 mr-2" />
          Test New Strategy
        </Button>
      </div>
    </div>
  );
};