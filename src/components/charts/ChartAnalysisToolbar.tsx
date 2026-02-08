import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Sparkles, 
  Loader2,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectionMode } from '@/hooks/useChartAnalysis';

interface ChartAnalysisToolbarProps {
  selectionMode: SelectionMode;
  isAnalyzing: boolean;
  hasSelection: boolean;
  hasAnalysis: boolean;
  onStartRangeSelection: () => void;
  onSelectVisible: () => void;
  onSelectPattern: () => void;
  onAnalyze: () => void;
  onSendToCopilot: () => void;
  onClear: () => void;
  className?: string;
}

/**
 * Simplified toolbar for chart analysis actions
 * - Analyze visible chart (primary action)
 * - Send to Trading Copilot
 */
const ChartAnalysisToolbar = memo(({
  selectionMode,
  isAnalyzing,
  hasSelection,
  hasAnalysis,
  onSelectVisible,
  onSendToCopilot,
  onClear,
  className
}: ChartAnalysisToolbarProps) => {
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
                {isAnalyzing ? 'Analyzing...' : hasAnalysis ? 'Re-analyze' : 'Analyze'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>AI analysis of visible chart</p>
          </TooltipContent>
        </Tooltip>

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
                <span className="hidden sm:inline text-xs sm:text-sm">Ask Copilot</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Discuss analysis with Trading Copilot</p>
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
              <p>Clear analysis</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

ChartAnalysisToolbar.displayName = 'ChartAnalysisToolbar';

export { ChartAnalysisToolbar };
