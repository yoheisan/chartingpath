import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { DISCLAIMERS, PERFORMANCE_LABELS } from "@/constants/disclaimers";

interface BacktestData {
  winRate: string;
  riskReward: string;
  testPeriod: string;
  totalTrades: number;
  maxDrawdown: string;
  instrument: string;
  timeframe: string;
}

interface PerformanceSnapshotProps {
  backtestData: BacktestData;
  compact?: boolean;
  showFullDisclaimer?: boolean;
}

export const PerformanceSnapshot = ({ 
  backtestData, 
  compact = false, 
  showFullDisclaimer = false 
}: PerformanceSnapshotProps) => {
  const winRateValue = parseInt(backtestData.winRate);
  const isHighWinRate = winRateValue >= 70;
  
  const formatContext = () => {
    return `${backtestData.instrument}, ${backtestData.timeframe}, ${backtestData.testPeriod}, ${backtestData.totalTrades} trades, max DD ${backtestData.maxDrawdown}`;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            {isHighWinRate ? (
              <TrendingUp className="h-4 w-4 text-bullish" />
            ) : (
              <TrendingDown className="h-4 w-4 text-bearish" />
            )}
            <span className="font-medium text-foreground">
              {PERFORMANCE_LABELS.SUCCESS_RATE}: {backtestData.winRate}
            </span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-medium mb-2">Backtest Context:</p>
                <p className="text-xs">{formatContext()}</p>
                <div className="border-t mt-2 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {showFullDisclaimer ? DISCLAIMERS.LONG : DISCLAIMERS.SHORT}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-xs text-muted-foreground">
          ({formatContext()})
        </p>
        
        <div className="bg-warning/10 border border-warning/20 rounded-md p-2">
          <p className="text-xs text-warning-foreground">
            {DISCLAIMERS.SHORT}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-muted/30 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          Backtested Results
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                <div className="space-y-2">
                  <p className="font-medium">Important Disclaimer:</p>
                  <p className="text-xs">
                    {showFullDisclaimer ? DISCLAIMERS.LONG : DISCLAIMERS.SHORT}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{PERFORMANCE_LABELS.WIN_RATE}</p>
            <div className="flex items-center gap-2">
              {isHighWinRate ? (
                <TrendingUp className="h-4 w-4 text-bullish" />
              ) : (
                <TrendingDown className="h-4 w-4 text-bearish" />
              )}
              <span className="text-lg font-bold text-foreground">
                {backtestData.winRate}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{PERFORMANCE_LABELS.RISK_REWARD}</p>
            <p className="text-lg font-bold text-accent">
              {backtestData.riskReward}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{PERFORMANCE_LABELS.TEST_PERIOD}</p>
            <p className="text-sm font-medium text-foreground">
              {backtestData.testPeriod}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{PERFORMANCE_LABELS.TOTAL_TRADES}</p>
            <p className="text-sm font-medium text-foreground">
              {backtestData.totalTrades}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{PERFORMANCE_LABELS.MAX_DRAWDOWN}</p>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-bearish" />
              <p className="text-sm font-medium text-bearish">
                {backtestData.maxDrawdown}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Context</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {backtestData.instrument}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {backtestData.timeframe}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
          <p className="text-xs text-warning-foreground">
            {DISCLAIMERS.SHORT}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};