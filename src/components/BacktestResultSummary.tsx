import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Bell, 
  ExternalLink, 
  Share2, 
  Check, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Target,
  Percent,
  Activity
} from 'lucide-react';
import { track } from '@/services/analytics';

// Minimum trades for statistical significance
export const MIN_TRADES_THRESHOLD = 20;

export interface BacktestResultData {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy?: number;
  avgReturn?: number;
  totalReturn?: number;
  sharpeRatio?: number;
  regimeBest?: string;
  regimeWorst?: string;
}

interface BacktestResultSummaryProps {
  results: BacktestResultData;
  symbol: string;
  timeframe: string;
  pattern: string;
  onCreateAlert: () => void;
  onOpenTradingView: () => void;
  onShareBacktest: () => void;
  isSharing: boolean;
  linkCopied: boolean;
}

export const BacktestResultSummary: React.FC<BacktestResultSummaryProps> = ({
  results,
  symbol,
  timeframe,
  pattern,
  onCreateAlert,
  onOpenTradingView,
  onShareBacktest,
  isSharing,
  linkCopied,
}) => {
  const isLowSample = results.totalTrades < MIN_TRADES_THRESHOLD;
  const expectancy = results.expectancy ?? results.avgReturn ?? (results.totalReturn ? results.totalReturn / results.totalTrades : null);

  // Track result summary viewed on mount
  useEffect(() => {
    track('result_summary_viewed', {
      symbol,
      timeframe,
      pattern,
      trades_count: results.totalTrades,
      low_sample: isLowSample,
    });
  }, [symbol, timeframe, pattern, results.totalTrades, isLowSample]);

  // Track low sample warning if shown
  useEffect(() => {
    if (isLowSample) {
      track('low_sample_warning_shown', {
        symbol,
        timeframe,
        pattern,
        trades_count: results.totalTrades,
      });
    }
  }, [isLowSample, symbol, timeframe, pattern, results.totalTrades]);

  const handleCreateAlert = () => {
    track('create_alert_clicked', { source: 'result_summary', symbol });
    onCreateAlert();
  };

  const handleOpenTradingView = () => {
    track('tradingview_opened', { symbol, context: 'backtest' });
    onOpenTradingView();
  };

  const handleShare = () => {
    track('share_clicked', { symbol, timeframe, pattern });
    onShareBacktest();
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Backtest Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{symbol}</Badge>
            <Badge variant="outline">{timeframe}</Badge>
            <Badge variant="outline">{pattern}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Low Sample Warning */}
        {isLowSample && (
          <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700">Not Enough Trades</AlertTitle>
            <AlertDescription className="text-yellow-600 space-y-2">
              <p>
                Only {results.totalTrades} trades found. Results with fewer than {MIN_TRADES_THRESHOLD} trades 
                are not statistically significant and should not be trusted.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-yellow-700 border-yellow-500">
                  Try: Extend lookback to 90+ days
                </Badge>
                <Badge variant="outline" className="text-yellow-700 border-yellow-500">
                  Try: Use a higher-signal pattern (Breakout)
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className={`text-xl font-bold ${isLowSample ? 'text-yellow-600' : ''}`}>
              {results.totalTrades}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Percent className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className={`text-xl font-bold ${results.winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
              {results.winRate?.toFixed(1)}%
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Profit Factor</p>
            <p className={`text-xl font-bold ${results.profitFactor >= 1 ? 'text-green-600' : 'text-red-500'}`}>
              {results.profitFactor?.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <TrendingDown className="h-4 w-4 mx-auto mb-1 text-red-400" />
            <p className="text-xs text-muted-foreground">Max DD</p>
            <p className="text-xl font-bold text-red-500">
              {results.maxDrawdown?.toFixed(1)}%
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Expectancy</p>
            <p className={`text-xl font-bold ${(expectancy ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {expectancy !== null ? `${expectancy > 0 ? '+' : ''}${expectancy.toFixed(2)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Regime Info (if available) */}
        {(results.regimeBest || results.regimeWorst) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
            {results.regimeBest && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Best regime: <strong className="text-foreground">{results.regimeBest}</strong></span>
              </div>
            )}
            {results.regimeWorst && (
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span>Worst regime: <strong className="text-foreground">{results.regimeWorst}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Primary CTAs - in order: Create Alert, Open TradingView, Share */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t">
          <Button 
            onClick={handleCreateAlert} 
            className="flex-1 gap-2"
            size="lg"
          >
            <Bell className="h-4 w-4" />
            Create Alert
          </Button>
          
          <Button 
            onClick={handleOpenTradingView} 
            variant="outline" 
            className="flex-1 gap-2"
            size="lg"
          >
            <ExternalLink className="h-4 w-4" />
            Open in TradingView
          </Button>
          
          <Button 
            onClick={handleShare} 
            variant="outline" 
            className="flex-1 gap-2" 
            disabled={isSharing}
            size="lg"
          >
            {linkCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {linkCopied ? 'Link Copied!' : 'Share Backtest'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BacktestResultSummary;
