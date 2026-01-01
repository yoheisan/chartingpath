import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, Info, TrendingUp, Volume2, Target, Eye, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  passed: boolean;
}

export interface PatternQuality {
  score: number;
  grade: string;
  confidence: number;
  reasons: string[];
  warnings?: string[];
  tradeable?: boolean;
  factors?: QualityFactor[];
}

interface PatternQualityBadgeProps {
  quality: PatternQuality;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const getGradeConfig = (grade: string, score: number) => {
  if (score >= 8 || grade === 'A') {
    return {
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      textClass: 'text-emerald-500',
      progressClass: 'bg-emerald-500',
      label: 'Excellent',
      icon: CheckCircle2
    };
  }
  if (score >= 6.5 || grade === 'B') {
    return {
      bgClass: 'bg-green-500/10 border-green-500/30',
      textClass: 'text-green-500',
      progressClass: 'bg-green-500',
      label: 'Good',
      icon: CheckCircle2
    };
  }
  if (score >= 5 || grade === 'C') {
    return {
      bgClass: 'bg-yellow-500/10 border-yellow-500/30',
      textClass: 'text-yellow-500',
      progressClass: 'bg-yellow-500',
      label: 'Fair',
      icon: AlertTriangle
    };
  }
  if (score >= 3.5 || grade === 'D') {
    return {
      bgClass: 'bg-orange-500/10 border-orange-500/30',
      textClass: 'text-orange-500',
      progressClass: 'bg-orange-500',
      label: 'Weak',
      icon: AlertTriangle
    };
  }
  return {
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-500',
    progressClass: 'bg-red-500',
    label: 'Poor',
    icon: XCircle
  };
};

const getFactorIcon = (name: string) => {
  if (name.toLowerCase().includes('volume')) return Volume2;
  if (name.toLowerCase().includes('trend')) return TrendingUp;
  if (name.toLowerCase().includes('target')) return Target;
  if (name.toLowerCase().includes('clarity')) return Eye;
  if (name.toLowerCase().includes('symmetry')) return BarChart3;
  return Info;
};

export function PatternQualityBadge({ 
  quality, 
  size = 'md', 
  showTooltip = true,
  className 
}: PatternQualityBadgeProps) {
  const config = getGradeConfig(quality.grade, quality.score);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };
  
  const badgeContent = (
    <Badge 
      variant="outline"
      className={cn(
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        'font-semibold border cursor-help transition-all hover:brightness-110',
        className
      )}
    >
      <Icon className={cn(iconSizes[size], 'mr-1')} />
      <span className="font-mono">{quality.score.toFixed(1)}</span>
      <span className="mx-1 opacity-50">/</span>
      <span>10</span>
    </Badge>
  );
  
  if (!showTooltip) return badgeContent;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-72 p-0">
          <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', config.textClass)} />
                <span className={cn('font-semibold', config.textClass)}>
                  Grade {quality.grade} • {config.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {quality.confidence}% confidence
              </span>
            </div>
            
            {/* Score Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Quality Score</span>
                <span className={cn('font-mono font-bold', config.textClass)}>
                  {quality.score.toFixed(1)}/10
                </span>
              </div>
              <Progress 
                value={quality.score * 10} 
                className="h-2"
              />
            </div>
            
            {/* Factors breakdown */}
            {quality.factors && quality.factors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Quality Factors</span>
                {quality.factors.map((factor, idx) => {
                  const FactorIcon = getFactorIcon(factor.name);
                  const factorConfig = getGradeConfig('', factor.score);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <FactorIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="flex-1 truncate">{factor.name}</span>
                      <span className={cn('font-mono', factorConfig.textClass)}>
                        {factor.score.toFixed(1)}
                      </span>
                      {factor.passed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Reasons */}
            {quality.reasons.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/50">
                {quality.reasons.slice(0, 3).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{reason}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Warnings */}
            {quality.warnings && quality.warnings.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/50">
                {quality.warnings.slice(0, 2).map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-600 dark:text-yellow-400">{warning}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tradeable status */}
            {quality.tradeable !== undefined && (
              <div className={cn(
                'flex items-center gap-2 text-xs px-2 py-1.5 rounded-md',
                quality.tradeable 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
              )}>
                {quality.tradeable ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Tradeable setup</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    <span>Not recommended</span>
                  </>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact score display for thumbnails
 */
interface CompactScoreProps {
  score: number;
  className?: string;
}

export function CompactQualityScore({ score, className }: CompactScoreProps) {
  const config = getGradeConfig('', score);
  
  return (
    <div 
      className={cn(
        'inline-flex items-center justify-center',
        'w-8 h-8 rounded-full font-mono font-bold text-xs',
        config.bgClass,
        config.textClass,
        'border',
        className
      )}
    >
      {score.toFixed(1)}
    </div>
  );
}

/**
 * Full quality breakdown card
 */
interface QualityBreakdownCardProps {
  quality: PatternQuality;
  className?: string;
}

export function QualityBreakdownCard({ quality, className }: QualityBreakdownCardProps) {
  const config = getGradeConfig(quality.grade, quality.score);
  
  return (
    <div className={cn('p-4 rounded-lg border', config.bgClass, className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'font-mono text-lg font-bold border-2',
              config.textClass,
              config.bgClass
            )}
          >
            {quality.score.toFixed(1)}
          </div>
          <div>
            <div className={cn('font-semibold', config.textClass)}>
              Grade {quality.grade}
            </div>
            <div className="text-xs text-muted-foreground">
              {config.label} • {quality.confidence}% confidence
            </div>
          </div>
        </div>
        
        {quality.tradeable !== undefined && (
          <Badge variant={quality.tradeable ? 'default' : 'secondary'}>
            {quality.tradeable ? 'Tradeable' : 'Caution'}
          </Badge>
        )}
      </div>
      
      {quality.factors && quality.factors.length > 0 && (
        <div className="space-y-2">
          {quality.factors.map((factor, idx) => {
            const FactorIcon = getFactorIcon(factor.name);
            const factorConfig = getGradeConfig('', factor.score);
            
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FactorIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{factor.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(factor.weight * 100)}%)
                    </span>
                  </div>
                  <span className={cn('font-mono font-semibold', factorConfig.textClass)}>
                    {factor.score.toFixed(1)}
                  </span>
                </div>
                <Progress 
                  value={factor.score * 10} 
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground">
                  {factor.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
      
      {quality.warnings && quality.warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-yellow-500 mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Warnings</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {quality.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
