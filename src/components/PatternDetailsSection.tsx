import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, RotateCcw, Target, Shield, Volume2, Brain, AlertTriangle, Lightbulb, ExternalLink, Info } from "lucide-react";
import { getPatternDetails } from "@/utils/PatternDetails";
import { useState } from "react";
import { PatternDetailModal } from "@/components/PatternDetailModal";

interface PatternDetailsSectionProps {
  patternKey: string;
}

export const PatternDetailsSection = ({ patternKey }: PatternDetailsSectionProps) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const patternDetail = getPatternDetails(patternKey);

  if (!patternDetail) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reversal":
        return <RotateCcw className="h-4 w-4" />;
      case "continuation":
        return <TrendingUp className="h-4 w-4" />;
      case "candlestick":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "reversal":
        return "destructive";
      case "continuation":
        return "default";
      case "candlestick":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-bullish text-bullish-foreground";
      case "Intermediate":
        return "bg-primary text-primary-foreground";
      case "Advanced":
        return "bg-bearish text-bearish-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <TooltipProvider>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(patternDetail.type)}
              <h3 className="text-xl font-semibold">{patternDetail.name} Details</h3>
              <Badge variant={getTypeColor(patternDetail.type) as any} className="capitalize">
                {patternDetail.type}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailModal(true)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Details
            </Button>
          </div>

          <Separator />

          {/* Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Success Rate</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Success rate represents the historical percentage of times this pattern correctly predicted price movement based on Thomas Bulkowski's extensive market research. This is educational data and does not guarantee future performance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-bullish">{patternDetail.accuracy}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Difficulty</span>
              </div>
              <Badge className={`${getDifficultyColor(patternDetail.difficulty)} w-fit`}>
                {patternDetail.difficulty}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Timeframe</span>
              </div>
              <p className="text-sm text-muted-foreground">{patternDetail.timeframe}</p>
            </div>
          </div>

          <Separator />

          {/* Target Price Methodologies Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Target Price Methodologies
            </h4>
            <div className="bg-gradient-to-r from-primary/5 to-bullish/5 p-4 rounded-lg border border-primary/20">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-primary mb-1">Primary Target Method</h5>
                  <p className="text-sm text-muted-foreground">{patternDetail.targetPriceMethodologies.primary}</p>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm text-bullish mb-2">Alternative Target Calculations</h5>
                  <div className="grid gap-1">
                    {patternDetail.targetPriceMethodologies.alternative.slice(0, 3).map((target, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-primary font-medium">•</span>
                        {target}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-primary/10">
                  <div>
                    <h6 className="text-xs font-medium text-muted-foreground">Risk/Reward</h6>
                    <p className="text-xs text-primary font-medium">{patternDetail.targetPriceMethodologies.riskReward}</p>
                  </div>
                  <div>
                    <h6 className="text-xs font-medium text-muted-foreground">Success Rate</h6>
                    <p className="text-xs text-bullish font-medium">{patternDetail.accuracy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Risk Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-bullish" />
                Entry & Confirmation
              </h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Entry: </span>
                  <span className="text-muted-foreground">{patternDetail.entry}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Confirmation: </span>
                  <span className="text-muted-foreground">{patternDetail.confirmation}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-bearish" />
                Risk Management
              </h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Stop Loss: </span>
                  <span className="text-muted-foreground">{patternDetail.stopLoss}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Target Method: </span>
                  <span className="text-muted-foreground">{patternDetail.targetMethodology.substring(0, 80)}...</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Key Characteristics Preview */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Key Characteristics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {patternDetail.characteristics.slice(0, 4).map((char, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {char}
                </div>
              ))}
            </div>
            {patternDetail.characteristics.length > 4 && (
              <p className="text-sm text-muted-foreground italic">
                +{patternDetail.characteristics.length - 4} more characteristics - view full details for complete information
              </p>
            )}
          </div>

          <Separator />

          {/* Quick Success Factors */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Success Factors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {patternDetail.keyFactors.slice(0, 3).map((factor, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-bullish mt-2 flex-shrink-0" />
                  {factor}
                </div>
              ))}
            </div>
          </div>

          {/* Psychology Insight */}
          <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Market Psychology
            </h4>
            <p className="text-sm text-muted-foreground italic">
              {patternDetail.psychology.substring(0, 200)}...
            </p>
          </div>
        </div>
      </Card>

      <PatternDetailModal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        patternKey={patternKey}
      />
    </TooltipProvider>
  );
};