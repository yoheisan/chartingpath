import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, RotateCcw, Target, Shield, Volume2, Brain, AlertTriangle, Lightbulb, Info, XCircle } from "lucide-react";
import { getPatternDetails } from "@/utils/PatternDetails";

interface PatternDetailsSectionProps {
  patternKey: string;
}

export const PatternDetailsSection = ({ patternKey }: PatternDetailsSectionProps) => {
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
      {/* Educational Disclaimer */}
      <Card className="p-4 bg-muted/30 border-primary/20 mb-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Educational Research Data</p>
            <p className="text-xs text-muted-foreground">
              Pattern statistics based on Thomas N. Bulkowski's research from "Encyclopedia of Chart Patterns" (2nd Edition). 
              Historical accuracy rates are for educational purposes only. Past performance does not guarantee future results. 
              Always conduct your own analysis and risk no more than 1-2% of trading capital per trade.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getTypeIcon(patternDetail.type)}
            <h3 className="text-xl font-semibold">{patternDetail.name}</h3>
            <Badge variant={getTypeColor(patternDetail.type) as any} className="capitalize">
              {patternDetail.type}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Trade Setup</span>
              <span className="sm:hidden">Setup</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Risk Factors</span>
              <span className="sm:hidden">Risk</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Pattern Analysis</span>
              <span className="sm:hidden">Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* TRADE SETUP TAB */}
          <TabsContent value="setup" className="space-y-6 mt-0">
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
                        Success rate represents the historical percentage of times this pattern correctly predicted price movement based on Thomas Bulkowski's extensive market research.
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

            {/* Entry & Risk Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-bullish" />
                  Entry & Confirmation
                </h4>
                <div className="bg-bullish/5 p-4 rounded-lg border border-bullish/20 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Entry Point: </span>
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
                <div className="bg-bearish/5 p-4 rounded-lg border border-bearish/20 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Stop Loss: </span>
                    <span className="text-muted-foreground">{patternDetail.stopLoss}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Risk/Reward: </span>
                    <span className="text-muted-foreground">{patternDetail.targetPriceMethodologies.riskReward}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Target Price Methodologies */}
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
                </div>
              </div>
            </div>
          </TabsContent>

          {/* RISK FACTORS TAB */}
          <TabsContent value="risk" className="space-y-6 mt-0">
            {/* Common Mistakes - CRITICAL */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-bearish">
                <XCircle className="h-4 w-4" />
                Common Mistakes to Avoid
              </h4>
              <div className="bg-bearish/5 p-4 rounded-lg border border-bearish/20">
                <div className="space-y-2">
                  {patternDetail.commonMistakes.map((mistake, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-bearish mt-0.5 flex-shrink-0" />
                      <span>{mistake}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Critical Success Factors */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Success Factors
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {patternDetail.keyFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-bullish mt-2 flex-shrink-0" />
                    {factor}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Volume Profile */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Volume Profile & Confirmation
              </h4>
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground">{patternDetail.volumeProfile}</p>
              </div>
            </div>
          </TabsContent>

          {/* PATTERN ANALYSIS TAB */}
          <TabsContent value="analysis" className="space-y-6 mt-0">
            {/* Key Characteristics */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Characteristics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {patternDetail.characteristics.map((char, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Pattern Formation */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                How This Pattern Forms
              </h4>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">{patternDetail.formation}</p>
              </div>
            </div>

            <Separator />

            {/* Market Psychology */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Market Psychology
              </h4>
              <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground italic">
                  {patternDetail.psychology}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </TooltipProvider>
  );
};