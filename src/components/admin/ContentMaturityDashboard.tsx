import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, TrendingUp, Eye, Play, Target, 
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContentMaturityScore,
  ContentFeatures,
  calculateContentMaturity,
  CONTENT_REQUIREMENTS
} from "@/utils/contentMaturityScanner";

// Current implementation status of each blog page
// This should be updated as pages are enhanced
const CURRENT_IMPLEMENTATIONS: Record<string, ContentFeatures> = {
  'VolumeAnalysis': {
    hasDynamicChart: false,
    hasEducationalChart: true,
    hasVolumeAnalysis: true,
    hasVolumeContextVisualization: true,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: true,
    hasStepByStepGuide: true,
    hasInteractiveElements: true,
    hasProfessionalTips: true,
    hasRiskManagement: true,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'HeadAndShoulders': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: true,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: true,
    hasRiskManagement: true,
    hasMultiTimeframeAnalysis: true,
    hasIndicatorOverlays: false,
  },
  'DoubleTopBottom': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: true,
    hasRiskManagement: true,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'TrianglePatterns': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: true,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'MovingAverages': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: true,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'RSIIndicator': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: true,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'MACDIndicator': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: true,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'BreakoutTrading': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: true,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'SupportResistance': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'FibonacciRetracements': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'CandlestickPatterns': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'TrendAnalysis': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'WedgePatterns': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'CupAndHandle': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'FlagPennant': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'RectanglePattern': {
    hasDynamicChart: true,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'PinBarStrategy': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
  'PriceActionBasics': {
    hasDynamicChart: false,
    hasEducationalChart: false,
    hasVolumeAnalysis: false,
    hasVolumeContextVisualization: false,
    hasTradeExecutionPlan: false,
    hasEntryExitAnnotations: false,
    hasStepByStepGuide: false,
    hasInteractiveElements: false,
    hasProfessionalTips: false,
    hasRiskManagement: false,
    hasMultiTimeframeAnalysis: false,
    hasIndicatorOverlays: false,
  },
};

const priorityConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-500', label: 'Critical' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-500', label: 'High' },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'Medium' },
  low: { color: 'bg-green-500', textColor: 'text-green-500', label: 'Low' },
};

export function ContentMaturityDashboard() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Calculate scores for all pages
  const scores = useMemo(() => {
    const results: ContentMaturityScore[] = [];
    
    for (const page of Object.keys(CONTENT_REQUIREMENTS)) {
      const features = CURRENT_IMPLEMENTATIONS[page] || {
        hasDynamicChart: false,
        hasEducationalChart: false,
        hasVolumeAnalysis: false,
        hasVolumeContextVisualization: false,
        hasTradeExecutionPlan: false,
        hasEntryExitAnnotations: false,
        hasStepByStepGuide: false,
        hasInteractiveElements: false,
        hasProfessionalTips: false,
        hasRiskManagement: false,
        hasMultiTimeframeAnalysis: false,
        hasIndicatorOverlays: false,
      };
      
      results.push(calculateContentMaturity(page, features));
    }
    
    return results.sort((a, b) => a.overallScore - b.overallScore);
  }, []);

  const filteredScores = filter === 'all' 
    ? scores 
    : scores.filter(s => s.priority === filter);

  const averageScore = Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length);

  const priorityCounts = {
    critical: scores.filter(s => s.priority === 'critical').length,
    high: scores.filter(s => s.priority === 'high').length,
    medium: scores.filter(s => s.priority === 'medium').length,
    low: scores.filter(s => s.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold mb-1">{averageScore}%</div>
            <p className="text-sm text-muted-foreground">Overall Maturity</p>
          </CardContent>
        </Card>
        
        {Object.entries(priorityCounts).map(([priority, count]) => (
          <Card 
            key={priority}
            className={cn(
              "cursor-pointer transition-all",
              filter === priority && "ring-2 ring-primary"
            )}
            onClick={() => setFilter(filter === priority ? 'all' : priority as any)}
          >
            <CardContent className="pt-4 text-center">
              <div className={cn("text-2xl font-bold", priorityConfig[priority as keyof typeof priorityConfig].textColor)}>
                {count}
              </div>
              <p className="text-xs text-muted-foreground capitalize">{priority}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Page List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Visualization Maturity
          </CardTitle>
          <Badge variant="outline">
            {filteredScores.length} pages
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredScores.map((score) => {
            const isExpanded = expanded === score.page;
            const config = priorityConfig[score.priority];
            
            return (
              <div key={score.page} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : score.page)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", config.color)} />
                    <span className="font-medium">{score.page}</span>
                    <Badge variant="outline" className={config.textColor}>
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={score.overallScore} className="h-2" />
                      <span className="text-sm font-mono w-10">{score.overallScore}%</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-muted/20">
                    <div className="pt-4 space-y-4">
                      {/* Category Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                        {Object.entries(score.categories).map(([cat, val]) => (
                          <div key={cat} className="p-2 bg-background rounded-lg">
                            <div className="text-lg font-bold">{val}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {cat.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Recommendations */}
                      {score.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Improvement Recommendations
                          </h4>
                          <ul className="space-y-1">
                            {score.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0 text-orange-500" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {score.recommendations.length === 0 && (
                        <div className="flex items-center gap-2 text-green-500 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          This page meets all visualization requirements!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h4 className="text-sm font-semibold mb-3">Feature Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>Dynamic Chart (15pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-3 w-3" />
              <span>Educational Chart (20pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              <span>Volume Context (15pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              <span>Trade Execution (15pts)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContentMaturityDashboard;
