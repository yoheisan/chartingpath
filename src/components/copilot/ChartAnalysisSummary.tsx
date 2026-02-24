import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Shield,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartAnalysisResult } from "@/hooks/useChartAnalysis";
import { useTranslation } from "react-i18next";

interface ChartAnalysisSummaryProps {
  analysis: ChartAnalysisResult;
  compact?: boolean;
}

export function ChartAnalysisSummary({ analysis, compact = false }: ChartAnalysisSummaryProps) {
  const { t } = useTranslation();
  const { priceAnalysis, indicators, volumeAnalysis, patterns, riskAssessment } = analysis;
  
  const trendIcon = priceAnalysis.trend === 'bullish' 
    ? <TrendingUp className="h-4 w-4" />
    : priceAnalysis.trend === 'bearish'
    ? <TrendingDown className="h-4 w-4" />
    : <Minus className="h-4 w-4" />;
    
  const trendColor = priceAnalysis.trend === 'bullish' 
    ? 'text-emerald-500'
    : priceAnalysis.trend === 'bearish'
    ? 'text-red-500'
    : 'text-muted-foreground';

  const getRiskColor = (risk: string) => {
    if (risk.includes('low')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (risk.includes('high')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  const getIndicatorStatus = (interpretation: string) => {
    const lower = interpretation.toLowerCase();
    if (lower.includes('bullish') || lower.includes('oversold')) return 'bullish';
    if (lower.includes('bearish') || lower.includes('overbought')) return 'bearish';
    return 'neutral';
  };

  const translateTrend = (trend: string) => {
    if (trend === 'bullish') return t('chartAnalysisDialog.bullish');
    if (trend === 'bearish') return t('chartAnalysisDialog.bearish');
    return t('chartAnalysisDialog.neutral');
  };

  const translateVolumeTrend = (trend: string) => {
    const lower = trend.toLowerCase();
    if (lower.includes('increas')) return t('chartAnalysisDialog.increasing');
    if (lower.includes('decreas')) return t('chartAnalysisDialog.decreasing');
    return t('chartAnalysisDialog.stable');
  };

  const formatPrice = (price: number) => {
    return price >= 1 ? `$${price.toFixed(2)}` : `$${price.toFixed(4)}`;
  };

  if (compact) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className={cn("flex items-center gap-1 font-medium", trendColor)}>
            {trendIcon}
            {translateTrend(priceAnalysis.trend)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className={priceAnalysis.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}>
            {priceAnalysis.priceChangePercent >= 0 ? '+' : ''}{priceAnalysis.priceChangePercent.toFixed(1)}%
          </span>
          <Badge variant="outline" className={cn("text-xs", getRiskColor(riskAssessment.overallRisk))}>
            {riskAssessment.overallRisk}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          RSI {indicators.rsi.current.toFixed(0)} · {indicators.macd.interpretation} · {translateVolumeTrend(volumeAnalysis.volumeTrend)} {t('chartAnalysisDialog.volume').toLowerCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with symbol and trend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{analysis.symbol}</h4>
          <Badge variant="secondary" className="text-xs">{analysis.timeframe}</Badge>
        </div>
        <Badge variant="outline" className={cn("text-xs", getRiskColor(riskAssessment.overallRisk))}>
          {riskAssessment.overallRisk} {t('chartAnalysisDialog.risk')}
        </Badge>
      </div>

      {/* Trend & Price */}
      <Card className="p-3 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full bg-background", trendColor)}>
              {trendIcon}
            </div>
            <div>
              <div className={cn("font-medium", trendColor)}>
                {translateTrend(priceAnalysis.trend)}
              </div>
              <div className="text-xs text-muted-foreground">
                {priceAnalysis.trendStrength} {t('chartAnalysisDialog.strength')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("font-semibold", priceAnalysis.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {priceAnalysis.priceChangePercent >= 0 ? '+' : ''}{priceAnalysis.priceChangePercent.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {analysis.barCount} {t('chartAnalysisDialog.bars')}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span className="text-muted-foreground">{t('chartAnalysisDialog.support')}:</span>
            <span className="font-medium">{formatPrice(priceAnalysis.support)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-red-500" />
            <span className="text-muted-foreground">{t('chartAnalysisDialog.resistance')}:</span>
            <span className="font-medium">{formatPrice(priceAnalysis.resistance)}</span>
          </div>
        </div>
      </Card>

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 gap-2">
        <IndicatorItem 
          label="RSI" 
          value={indicators.rsi.current.toFixed(0)}
          status={getIndicatorStatus(indicators.rsi.interpretation)}
          detail={indicators.rsi.interpretation}
        />
        <IndicatorItem 
          label="MACD" 
          value={indicators.macd.histogram > 0 ? '+' : '-'}
          status={getIndicatorStatus(indicators.macd.interpretation)}
          detail={indicators.macd.interpretation}
        />
        <IndicatorItem 
          label="ADX" 
          value={indicators.adx?.adx.toFixed(0) || 'N/A'}
          status={indicators.adx && indicators.adx.adx > 25 ? 'bullish' : 'neutral'}
          detail={indicators.adx?.interpretation || t('chartAnalysisDialog.trendStrength')}
        />
        <IndicatorItem 
          label="ATR" 
          value={indicators.atr.volatilityLevel}
          status="neutral"
          detail={t('chartAnalysisDialog.volatility')}
        />
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 text-sm">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{t('chartAnalysisDialog.volume')}:</span>
        <span className="font-medium">{translateVolumeTrend(volumeAnalysis.volumeTrend)}</span>
        <span className="text-muted-foreground">({volumeAnalysis.volumeRatio.toFixed(2)}x avg)</span>
      </div>

      {/* Active Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('chartAnalysisDialog.activePatterns')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {patterns.map((p, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={cn(
                  "text-xs",
                  p.direction === 'long' ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'
                )}
              >
                {p.name} ({p.quality})
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IndicatorItem({ 
  label, 
  value, 
  status, 
  detail 
}: { 
  label: string; 
  value: string; 
  status: 'bullish' | 'bearish' | 'neutral';
  detail: string;
}) {
  const statusIcon = status === 'bullish' 
    ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
    : status === 'bearish'
    ? <AlertTriangle className="h-3 w-3 text-red-500" />
    : <Info className="h-3 w-3 text-muted-foreground" />;

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-xs">
      {statusIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
        <div className="text-[10px] text-muted-foreground truncate capitalize">
          {detail}
        </div>
      </div>
    </div>
  );
}
