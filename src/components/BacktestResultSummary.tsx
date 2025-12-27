import React, { useEffect, useMemo } from 'react';
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

// Generate one-sentence interpretation based on metrics
const generateInterpretation = (results: BacktestResultData): string => {
  const { winRate, profitFactor, maxDrawdown, totalTrades } = results;
  
  if (totalTrades < MIN_TRADES_THRESHOLD) {
    return `Not enough data to draw conclusions. Run with a longer lookback period.`;
  }
  
  const isStrong = winRate >= 55 && profitFactor >= 1.5 && maxDrawdown <= 15;
  const isViable = winRate >= 50 && profitFactor >= 1.2 && maxDrawdown <= 25;
  const isWeak = winRate < 45 || profitFactor < 1 || maxDrawdown > 30;
  
  if (isStrong) {
    return `Strong edge detected with ${winRate.toFixed(0)}% win rate and controlled ${maxDrawdown.toFixed(0)}% drawdown.`;
  } else if (isViable) {
    return `Viable setup showing positive expectancy. Monitor drawdown in live conditions.`;
  } else if (isWeak) {
    return `Results suggest weak or no edge. Consider adjusting parameters before trading.`;
  }
  return `Mixed signals. Review risk-reward and consider paper trading first.`;
};

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
  const interpretation = useMemo(() => generateInterpretation(results), [results]);

  // Track result summary viewed on mount
  useEffect(() => {
    track('result_summary_viewed', {
      symbol,
      timeframe,
      pattern,
      trades_count: results.totalTrades,
      low_sample: isLowSample,
      win_rate: results.winRate,
      profit_factor: results.profitFactor,
      max_drawdown: results.maxDrawdown,
    });
  }, [symbol, timeframe, pattern, results.totalTrades, results.winRate, results.profitFactor, results.maxDrawdown, isLowSample]);

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
    track('create_alert_clicked', { 
      source: 'result_summary', 
      symbol,
      win_rate: results.winRate,
      trades_count: results.totalTrades,
    });
    onCreateAlert();
  };

  const handleOpenTradingView = () => {
    track('tradingview_opened', { 
      source: 'result_summary',
      symbol, 
      context: 'backtest',
      win_rate: results.winRate,
    });
    onOpenTradingView();
  };

  const handleShare = () => {
    track('share_clicked', { 
      source: 'result_summary',
      symbol, 
      timeframe, 
      pattern,
      win_rate: results.winRate,
      trades_count: results.totalTrades,
    });
    onShareBacktest();
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Summary
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
            <AlertTitle className="text-yellow-700">Limited Sample Size</AlertTitle>
            <AlertDescription className="text-yellow-600">
              Only {results.totalTrades} trades found. Extend lookback to 90+ days for reliable results.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Grid - Simplified: Win Rate, Max DD, Sample Size */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Percent className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Win Rate</p>
            <p className={`text-2xl font-bold ${results.winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
              {results.winRate?.toFixed(1)}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-400" />
            <p className="text-xs text-muted-foreground font-medium">Max Drawdown</p>
            <p className="text-2xl font-bold text-red-500">
              {results.maxDrawdown?.toFixed(1)}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Sample Size</p>
            <p className={`text-2xl font-bold ${isLowSample ? 'text-yellow-600' : 'text-foreground'}`}>
              {results.totalTrades}
            </p>
          </div>
        </div>

        {/* One-sentence interpretation */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground text-center italic">
            {interpretation}
          </p>
        </div>

        {/* Primary CTAs - ONLY: Create Alert, Open TradingView, Share */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3">
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
            {linkCopied ? 'Link Copied!' : 'Share This Result'}
          </Button>
        </div>

        {/* Conversion micro-copy */}
        <p className="text-xs text-muted-foreground text-center pt-1">
          Most traders validate performance before creating alerts.
        </p>
      </CardContent>
    </Card>
  );
};

export default BacktestResultSummary;
