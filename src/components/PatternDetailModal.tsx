import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, RotateCcw, Target, Shield, Clock, Volume2, Brain, AlertTriangle, Lightbulb } from "lucide-react";
import { getPatternDetails } from "@/utils/PatternDetails";

interface PatternDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patternKey: string;
}

export const PatternDetailModal = ({ isOpen, onClose, patternKey }: PatternDetailModalProps) => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getTypeIcon(patternDetail.type)}
            <DialogTitle className="text-2xl">{patternDetail.name}</DialogTitle>
            <Badge variant={getTypeColor(patternDetail.type) as any} className="capitalize">
              {patternDetail.type}
            </Badge>
          </div>
          <DialogDescription className="text-base">
            {patternDetail.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-bullish">{patternDetail.accuracy}</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Badge className={`${getDifficultyColor(patternDetail.difficulty)} text-sm`}>
                  {patternDetail.difficulty}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Difficulty</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">{patternDetail.timeframe}</div>
              </div>
            </div>

            <Separator />

            {/* Pattern Formation */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Pattern Formation & Psychology
              </h3>
              <p className="text-sm leading-relaxed">{patternDetail.formation}</p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm italic">{patternDetail.psychology}</p>
              </div>
            </div>

            <Separator />

            {/* Key Characteristics */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Key Characteristics</h3>
              <ul className="space-y-2">
                {patternDetail.characteristics.map((char, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {char}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Target Price Methodologies */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Price Methodologies
              </h3>
              <div className="bg-gradient-to-r from-primary/5 to-bullish/5 p-4 rounded-lg border-l-4 border-primary">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-primary mb-2">Primary Target Method</h4>
                    <p className="text-sm font-medium">{patternDetail.targetPriceMethodologies.primary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-bullish mb-2">Alternative Target Calculations</h4>
                    <ul className="space-y-2">
                      {patternDetail.targetPriceMethodologies.alternative.map((target, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {target}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Risk/Reward Ratio</h5>
                      <p className="text-sm font-medium text-primary">{patternDetail.targetPriceMethodologies.riskReward}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Pattern Success Rate</h5>
                      <p className="text-sm font-medium text-bullish">{patternDetail.accuracy}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h5 className="text-sm font-medium mb-1">Calculation Method</h5>
                    <p className="text-sm text-muted-foreground italic">{patternDetail.targetPriceMethodologies.calculation}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Trading Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Entry & Targets
                </h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-bullish pl-3">
                    <h4 className="font-medium text-sm text-bullish">Entry Signal</h4>
                    <p className="text-sm text-muted-foreground">{patternDetail.entry}</p>
                  </div>
                  <div className="border-l-4 border-primary pl-3">
                    <h4 className="font-medium text-sm">Target Methodology</h4>
                    <p className="text-sm text-muted-foreground">{patternDetail.targetMethodology}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Management
                </h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-bearish pl-3">
                    <h4 className="font-medium text-sm text-bearish">Stop Loss</h4>
                    <p className="text-sm text-muted-foreground">{patternDetail.stopLoss}</p>
                  </div>
                  <div className="border-l-4 border-primary pl-3">
                    <h4 className="font-medium text-sm">Confirmation</h4>
                    <p className="text-sm text-muted-foreground">{patternDetail.confirmation}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Volume Analysis */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Volume Profile
              </h3>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{patternDetail.volumeProfile}</p>
              </div>
            </div>

            <Separator />

            {/* Success Factors */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Success Factors
              </h3>
              <ul className="space-y-2">
                {patternDetail.keyFactors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-bullish mt-2 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Common Mistakes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Common Mistakes to Avoid
              </h3>
              <ul className="space-y-2">
                {patternDetail.commonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-bearish mt-2 flex-shrink-0" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>

            {patternDetail.additionalNotes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Additional Notes</h3>
                  <div className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary">
                    <p className="text-sm">{patternDetail.additionalNotes}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};