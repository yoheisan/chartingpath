import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useState } from "react";
import { tradingStrategies, Strategy } from "@/utils/TradingStrategiesData";
import { EXPORT_TEMPLATES, DISCLAIMER_TEXT } from "@/components/StrategyExportTemplates";
import { useToast } from "@/hooks/use-toast";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

const EXPORT_PLATFORMS = {
  "TradingView - Pine Script v5": { extension: "pine" },
  "MetaTrader 4 - MQL4": { extension: "mq4" },
  "MetaTrader 5 - MQL5": { extension: "mq5" },
  "cTrader - C#": { extension: "cs" },
  "NinjaTrader 8 - C#": { extension: "cs" }
};

const COMING_SOON_PLATFORMS = [
  "TradeStation - EasyLanguage",
  "thinkorswim - thinkScript", 
  "AmiBroker - AFL",
  "QuantConnect Lean - C#/Python",
  "Backtrader - Python",
  "CCXT Bot Template - Python/TypeScript"
];

export const StrategyDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [confirmTimeframe, setConfirmTimeframe] = useState("4h");
  const [selectedExportPlatform, setSelectedExportPlatform] = useState<string>("");

  const strategy = tradingStrategies.find(s => s.id === parseInt(id || "0"));

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/trading-strategies" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Trading Strategies
          </Link>
          <Card className="text-center p-8">
            <CardTitle>Strategy Not Found</CardTitle>
            <CardDescription className="mt-2">The requested strategy could not be found.</CardDescription>
          </Card>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-600/20 text-green-400 border-green-600/30";
      case "Intermediate": return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
      case "Advanced": return "bg-orange-600/20 text-orange-400 border-orange-600/30";
      case "Expert": return "bg-red-600/20 text-red-400 border-red-600/30";
      default: return "bg-gray-600/20 text-gray-400 border-gray-600/30";
    }
  };

  const isMultiTimeframe = strategy.name.includes("Triple Screen") || strategy.name.includes("Multi-Timeframe");

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!selectedExportPlatform) return;

    const template = EXPORT_TEMPLATES[selectedExportPlatform as keyof typeof EXPORT_TEMPLATES];
    if (!template) return;

    const platform = EXPORT_PLATFORMS[selectedExportPlatform as keyof typeof EXPORT_PLATFORMS];
    const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Generate code file
    const code = template.generateCode(strategy, selectedTimeframe);
    downloadFile(code, `${cleanName}.${platform.extension}`);
    
    // Generate README
    const readme = template.generateReadme(strategy);
    downloadFile(readme, `${cleanName}_README.txt`);
    
    // Generate disclaimer
    downloadFile(DISCLAIMER_TEXT, `${cleanName}_DISCLAIMER.txt`);

    toast({
      title: "Export Complete",
      description: `${strategy.name} exported for ${selectedExportPlatform}`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/trading-strategies" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Trading Strategies
        </Link>

        {/* Strategy Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <CardTitle className="text-2xl mb-2">{strategy.name}</CardTitle>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={getDifficultyColor(strategy.difficulty)}>
                  {strategy.difficulty}
                </Badge>
                <Badge variant="outline">{strategy.category}</Badge>
                <div className="flex items-center gap-1">
                  {strategy.successRate.includes("7") || strategy.successRate.includes("8") ? (
                    <TrendingUp className="h-4 w-4 text-bullish" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-bearish" />
                  )}
                  <span className="font-medium">{strategy.successRate}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-accent font-semibold">
              {strategy.riskReward}
            </Badge>
          </div>
          
          <CardDescription className="text-base mb-4">
            {strategy.description}
          </CardDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Indicators</h4>
              <div className="flex flex-wrap gap-1">
                {strategy.indicators.map((indicator, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {indicator}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Timeframes</h4>
              <div className="flex flex-wrap gap-1">
                {strategy.timeframes.map((tf, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tf}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Entry and Exit Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-bullish">Entry Rules</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-muted-foreground">{strategy.entry}</p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-bearish">Exit Rules</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-muted-foreground">{strategy.exit}</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Export Strategy Code</CardTitle>
            <CardDescription>
              Generate ready-to-use code for your preferred trading platform
            </CardDescription>
          </CardHeader>
          
          {/* Timeframe Selection */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {isMultiTimeframe ? "Signal Timeframe" : "Trading Timeframe"}
                </label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map(tf => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isMultiTimeframe && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Confirmation Timeframe
                  </label>
                  <Select value={confirmTimeframe} onValueChange={setConfirmTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select confirmation timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Export Platform
              </label>
              <Select value={selectedExportPlatform} onValueChange={setSelectedExportPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose platform..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Wave 1 - Available Now</div>
                  {Object.keys(EXPORT_PLATFORMS).map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">Wave 2 & 3 - Coming Soon</div>
                  {COMING_SOON_PLATFORMS.map(platform => (
                    <SelectItem key={platform} value={platform} disabled>
                      {platform} (Coming Soon)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExport}
              disabled={!selectedExportPlatform || COMING_SOON_PLATFORMS.includes(selectedExportPlatform)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Strategy Bundle
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500 mb-1">Educational Use Only</p>
                <p className="text-muted-foreground">
                  This code is for educational purposes only and does not constitute financial advice. 
                  Trading involves risk. Past performance does not guarantee future results. 
                  Always test thoroughly and use proper risk management.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};