import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sparkles, 
  ScanLine, 
  Target, 
  Eye,
  Loader2,
  ChevronDown,
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
 * Floating toolbar for chart analysis actions
 * - Analyze visible chart
 * - Select range for analysis
 * - Auto-detect pattern context
 * - Send to Trading Copilot
 */
const ChartAnalysisToolbar = memo(({
  selectionMode,
  isAnalyzing,
  hasSelection,
  hasAnalysis,
  onStartRangeSelection,
  onSelectVisible,
  onSelectPattern,
  onAnalyze,
  onSendToCopilot,
  onClear,
  className
}: ChartAnalysisToolbarProps) => {
  const isActive = selectionMode !== 'none';

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "flex items-center gap-1.5 p-1.5 rounded-lg bg-background/95 border shadow-lg backdrop-blur-sm",
        className
      )}>
        {/* Main Analyze Button with Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Analyze</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>AI Chart Analysis</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={onSelectVisible}>
              <Eye className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span>Analyze Visible Chart</span>
                <span className="text-xs text-muted-foreground">Quick analysis of current view</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onStartRangeSelection}>
              <ScanLine className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span>Select Range</span>
                <span className="text-xs text-muted-foreground">Click-drag to select bars</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onSelectPattern}>
              <Target className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span>Auto-detect Pattern</span>
                <span className="text-xs text-muted-foreground">Find active pattern context</span>
              </div>
            </DropdownMenuItem>

            {hasSelection && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClear} className="text-muted-foreground">
                  Clear Selection
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Run Analysis Button (visible when selection exists) */}
        {hasSelection && !hasAnalysis && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={onAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Run Analysis
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Analyze selected bars</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Send to Copilot Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasAnalysis ? "default" : "ghost"}
              size="sm"
              onClick={onSendToCopilot}
              disabled={isAnalyzing || (!hasSelection && !hasAnalysis)}
              className="gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Copilot</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Send analysis to Trading Copilot for insights</p>
          </TooltipContent>
        </Tooltip>

        {/* Selection Mode Indicator */}
        {isActive && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
            {selectionMode === 'range' && 'Selecting...'}
            {selectionMode === 'visible' && 'Visible'}
            {selectionMode === 'pattern' && 'Pattern'}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

ChartAnalysisToolbar.displayName = 'ChartAnalysisToolbar';

export { ChartAnalysisToolbar };
