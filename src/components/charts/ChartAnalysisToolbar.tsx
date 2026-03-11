import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Sparkles, 
  Loader2,
  MessageSquare,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectionMode } from '@/hooks/useChartAnalysis';
import { ChartCaptureButton } from '@/components/capture';

interface ChartAnalysisToolbarProps {
  selectionMode: SelectionMode;
  isAnalyzing: boolean;
  hasSelection: boolean;
  hasAnalysis: boolean;
  showOverlay: boolean;
  onToggleOverlay: (show: boolean) => void;
  onStartRangeSelection: () => void;
  onSelectVisible: () => void;
  onSelectPattern: () => void;
  onAnalyze: () => void;
  onSendToCopilot: () => void;
  onClear: () => void;
  chartContainerRef?: React.RefObject<HTMLElement>;
  symbol?: string;
  timeframe?: string;
  pattern?: string;
  className?: string;
}

/**
 * Simplified toolbar for chart analysis actions
 * - Analyze visible chart (primary action)
 * - Toggle overlay visualization
 * - Send to Trading Copilot
 */
const ChartAnalysisToolbar = memo(({
  selectionMode,
  isAnalyzing,
  hasSelection,
  hasAnalysis,
  showOverlay,
  onToggleOverlay,
  onSelectVisible,
  onSendToCopilot,
  onClear,
  className
}: ChartAnalysisToolbarProps) => {
  const { t } = useTranslation();
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "flex items-center gap-1.5 p-1.5 rounded-lg bg-background/95 border shadow-lg backdrop-blur-sm",
        className
      )}>
        {/* Main Analyze Button - Always visible and functional */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasAnalysis ? "secondary" : "default"}
              size="sm"
              className="gap-1.5"
              disabled={isAnalyzing}
              onClick={onSelectVisible}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="text-xs sm:text-sm">
                {isAnalyzing ? t('chartToolbar.analyzing') : hasAnalysis ? t('chartToolbar.reAnalyze') : t('chartToolbar.analyze')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t('chartToolbar.aiAnalysis')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Overlay Toggle - Shows after analysis */}
        {hasAnalysis && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <Layers className={cn("h-3.5 w-3.5", showOverlay ? "text-primary" : "text-muted-foreground")} />
                <Switch
                  checked={showOverlay}
                  onCheckedChange={onToggleOverlay}
                  className="scale-75"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{showOverlay ? t('chartToolbar.hideLevels') : t('chartToolbar.showLevels')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Send to Copilot Button - Shows after analysis */}
        {hasAnalysis && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSendToCopilot}
                disabled={isAnalyzing}
                className="gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">{t('chartToolbar.askCopilot')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t('chartToolbar.discussAnalysis')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Clear button when analysis exists */}
        {hasAnalysis && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t('chartToolbar.clearAnalysis')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

ChartAnalysisToolbar.displayName = 'ChartAnalysisToolbar';

export { ChartAnalysisToolbar };
