import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Zap, 
  ExternalLink, 
  Share2, 
  Check, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Target,
  Percent,
  Activity,
  ChevronDown,
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/services/analytics';
import { savePlaybookContextStatic } from '@/hooks/usePlaybookContext';

// Wedge Summary type for UX display
export interface WedgeSummary {
  patternCount: number;
  acceptedCount: number;
  rejectedCount: number;
  resolvedFromPatternIdCount: number;
  resolvedFromIdCount: number;
  acceptedBaseIds: string[];
  rejectedBaseIds: string[];
}

// Wedge Warnings type for detailed debugging
export interface WedgeWarnings {
  rejectedPatternIds: string[];
  rejectedBaseIds: string[];
  acceptedBaseIds: string[];
  rejectedCount: number;
  acceptedCount: number;
  reasons: Array<{
    rawPatternId: string;
    basePatternId: string;
    reason: string;
    patternName: string;
    sourceField: string;
  }>;
  message: string;
}

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
  runId: string; // Unique backtest run identifier
  wedgeEnabled: boolean;
  enabledPatternsCount: number;
  wedgeSummary?: WedgeSummary;
  wedgeWarnings?: WedgeWarnings;
  // Test context for transparency
  startDate?: string;
  endDate?: string;
  dataPoints?: number;
  onCreateAlert: () => void;
  onOpenTradingView: () => void;
  onShareBacktest: () => void;
  isSharing: boolean;
  linkCopied: boolean;
  shareToCommunity?: boolean;
  onShareToCommunityChange?: (value: boolean) => void;
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
  return `Mixed signals. Review risk-reward and consider demo trading first.`;
};

const AgentScoreButton: React.FC<{ symbol: string; pattern: string }> = ({ symbol, pattern }) => {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => navigate(`/tools/agent-scoring?symbol=${encodeURIComponent(symbol)}&pattern=${encodeURIComponent(pattern)}`)}
      variant="outline"
      className="flex-1 gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
      size="lg"
    >
      <Bot className="h-4 w-4" />
      Score with AI Agents
    </Button>
  );
};

export const BacktestResultSummary: React.FC<BacktestResultSummaryProps> = ({
  results,
  symbol,
  timeframe,
  pattern,
  runId,
  wedgeEnabled,
  enabledPatternsCount,
  wedgeSummary,
  wedgeWarnings,
  startDate,
  endDate,
  dataPoints,
  onCreateAlert,
  onOpenTradingView,
  onShareBacktest,
  isSharing,
  linkCopied,
  shareToCommunity,
  onShareToCommunityChange,
}) => {
  const isLowSample = results.totalTrades < MIN_TRADES_THRESHOLD;
  const expectancy = results.expectancy ?? results.avgReturn ?? (results.totalReturn ? results.totalReturn / results.totalTrades : null);
  const interpretation = useMemo(() => generateInterpretation(results), [results]);
  const [wedgeDetailsOpen, setWedgeDetailsOpen] = useState(false);

  // Track result summary viewed ONCE per runId (not on every prop change)
  const trackedRunIdRef = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    if (runId && runId !== trackedRunIdRef.current) {
      trackedRunIdRef.current = runId;
      track('result_summary_viewed', {
        symbol,
        timeframe,
        pattern,
        run_id: runId,
        wedge_enabled: wedgeEnabled,
        enabled_patterns_count: enabledPatternsCount,
        trades_count: results.totalTrades,
        low_sample: isLowSample,
        win_rate: results.winRate,
        profit_factor: results.profitFactor,
        max_drawdown: results.maxDrawdown,
      });
    }
  }, [runId, symbol, timeframe, pattern, wedgeEnabled, enabledPatternsCount, results.totalTrades, results.winRate, results.profitFactor, results.maxDrawdown, isLowSample]);

  // Track low sample warning ONCE per runId
  const trackedLowSampleRef = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    if (isLowSample && runId && runId !== trackedLowSampleRef.current) {
      trackedLowSampleRef.current = runId;
      track('low_sample_warning_shown', {
        symbol,
        timeframe,
        pattern,
        run_id: runId,
        wedge_enabled: wedgeEnabled,
        enabled_patterns_count: enabledPatternsCount,
        trades_count: results.totalTrades,
      });
    }
  }, [isLowSample, runId, symbol, timeframe, pattern, wedgeEnabled, enabledPatternsCount, results.totalTrades]);

  const handleCreateAlert = () => {
    // Save playbook context so alerts page pre-fills with validated params
    savePlaybookContextStatic({
      symbol,
      pattern,
      timeframe,
      instrumentCategory: '',
      autoPaperTrade: true,
      riskPercent: 1.0,
      winRate: results.winRate,
      totalTrades: results.totalTrades,
      source: 'pattern-lab',
    });
    track('deploy_as_alert_clicked', { 
      source: 'result_summary', 
      symbol,
      timeframe,
      run_id: runId,
      wedge_enabled: wedgeEnabled,
      enabled_patterns_count: enabledPatternsCount,
      win_rate: results.winRate,
      trades_count: results.totalTrades,
    });
    onCreateAlert();
  };

  const handleOpenTradingView = () => {
    track('tradingview_opened', { 
      source: 'result_summary',
      symbol,
      timeframe,
      run_id: runId,
      wedge_enabled: wedgeEnabled,
      enabled_patterns_count: enabledPatternsCount,
      trades_count: results.totalTrades,
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
      run_id: runId,
      wedge_enabled: wedgeEnabled,
      enabled_patterns_count: enabledPatternsCount,
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
        {/* Test Context Banner - What was actually tested */}
        {(startDate || endDate || dataPoints) && (
          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Date range not specified'
                  }
                </span>
              </div>
              {dataPoints && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{dataPoints.toLocaleString()} bars</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>{pattern}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Wedge Mode Banner */}
        {wedgeEnabled && wedgeSummary && (
          <div className={`rounded-lg border p-3 ${
            wedgeSummary.acceptedCount === 0
              ? 'border-destructive/50 bg-destructive/10' 
              : wedgeSummary.rejectedCount > 0 
                ? 'border-yellow-500/50 bg-yellow-500/10' 
                : 'border-primary/30 bg-primary/5'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Wedge Mode</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={`flex items-center gap-1 ${wedgeSummary.acceptedCount === 0 ? 'text-destructive' : 'text-green-600'}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {wedgeSummary.acceptedCount}/{wedgeSummary.patternCount} accepted
                </span>
                {wedgeSummary.rejectedCount > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {wedgeSummary.rejectedCount} rejected
                  </span>
                )}
              </div>
            </div>

            {/* Resolved from stats line */}
            <div className="mt-2 text-xs text-muted-foreground">
              Resolved from patternId: {wedgeSummary.resolvedFromPatternIdCount}, id: {wedgeSummary.resolvedFromIdCount}
            </div>

            {/* No patterns accepted warning - HARD WARNING */}
            {wedgeSummary.acceptedCount === 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded bg-destructive/20 border border-destructive/40">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm font-semibold text-destructive">
                  No wedge patterns were accepted — strategy may generate no signals.
                </p>
              </div>
            )}

            {/* Expandable details - show when there are rejections or patterns to display */}
            {(wedgeSummary.rejectedCount > 0 || wedgeSummary.acceptedCount > 0) && (
              <Collapsible open={wedgeDetailsOpen} onOpenChange={setWedgeDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs gap-1 w-full justify-center">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${wedgeDetailsOpen ? 'rotate-180' : ''}`} />
                    {wedgeDetailsOpen ? 'Hide details' : 'View details'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 text-xs">
                  {/* Accepted patterns - capped to 20 with "+N more" */}
                  {wedgeSummary.acceptedBaseIds.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1">Accepted patterns:</p>
                      <div className="flex flex-wrap gap-1">
                        {wedgeSummary.acceptedBaseIds.slice(0, 20).map((id) => (
                          <Badge key={id} variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                            {id}
                          </Badge>
                        ))}
                        {wedgeSummary.acceptedCount > 20 && (
                          <span className="text-muted-foreground text-xs self-center">
                            +{wedgeSummary.acceptedCount - 20} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejected patterns - capped to 20 with "+N more" */}
                  {wedgeSummary.rejectedBaseIds.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1">Rejected patterns:</p>
                      <div className="flex flex-wrap gap-1">
                        {wedgeSummary.rejectedBaseIds.slice(0, 20).map((id) => (
                          <Badge key={id} variant="outline" className="text-xs border-yellow-500/50 text-yellow-700">
                            {id}
                          </Badge>
                        ))}
                        {wedgeSummary.rejectedCount > 20 && (
                          <span className="text-muted-foreground text-xs self-center">
                            +{wedgeSummary.rejectedCount - 20} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection reasons from wedgeWarnings */}
                  {wedgeWarnings && wedgeWarnings.reasons.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1">Rejection reasons:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {wedgeWarnings.reasons.slice(0, 20).map((r, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-yellow-600">
                            <Badge variant="outline" className="text-xs border-yellow-500/50 flex-shrink-0">
                              {r.patternName || r.basePatternId}
                            </Badge>
                            <span className="text-muted-foreground text-xs">{r.reason}</span>
                          </div>
                        ))}
                        {wedgeWarnings.reasons.length > 20 && (
                          <p className="text-muted-foreground text-xs">
                            +{wedgeWarnings.reasons.length - 20} more reasons
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

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

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3">
          <Button 
            onClick={handleCreateAlert} 
            className="flex-1 gap-2"
            size="lg"
          >
            <Zap className="h-4 w-4" />
            {t('alerts.deployAsAlert', 'Deploy as Alert')}
          </Button>
          
          <AgentScoreButton symbol={symbol} pattern={pattern} />
          
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

        {/* Share to Community toggle */}
        {onShareToCommunityChange && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="share-to-community"
              checked={shareToCommunity ?? true}
              onChange={(e) => onShareToCommunityChange(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="share-to-community" className="text-xs text-muted-foreground cursor-pointer">
              Also post to Community Feed (public, verified stats only)
            </label>
          </div>
        )}

        {/* Conversion micro-copy */}
        <p className="text-xs text-muted-foreground text-center pt-1">
          Most traders validate performance before creating alerts.
        </p>
      </CardContent>
    </Card>
  );
};

export default BacktestResultSummary;
