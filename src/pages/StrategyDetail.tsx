import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, TrendingUp, TrendingDown, AlertCircle, Code, Copy, Check } from "lucide-react";
import { useState } from "react";
import { tradingStrategies, Strategy } from "@/utils/TradingStrategiesData";
import { EXPORT_TEMPLATES, DISCLAIMER_TEXT } from "@/components/StrategyExportTemplates";
import { PineScriptEngine } from "@/components/PineScriptEngine";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

const EXPORT_PLATFORMS = {
  "TradingView - Pine Script v6": { extension: "pine" },
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
  const { strategyId } = useParams();
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [confirmTimeframe, setConfirmTimeframe] = useState("4h");
  const [selectedExportPlatform, setSelectedExportPlatform] = useState<string>("TradingView - Pine Script v6");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const strategy = tradingStrategies.find(s => s.id === parseInt(strategyId || "0"));

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
    const blob = new Blob([content], { type: 'application/octet-stream;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Delay revocation to ensure download starts in all browsers/iframes
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleExport = async () => {
    if (!selectedExportPlatform) return;

    try {
      const template = EXPORT_TEMPLATES[selectedExportPlatform as keyof typeof EXPORT_TEMPLATES];
      if (!template) {
        toast({
          title: "Template Not Found",
          description: "The selected platform template is not available",
          variant: "destructive",
        });
        return;
      }

      const platform = EXPORT_PLATFORMS[selectedExportPlatform as keyof typeof EXPORT_PLATFORMS];
      const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');

      // Generate content
      const code = template.generateCode(strategy, selectedTimeframe);
      if (!code) {
        toast({
          title: "Export Failed",
          description: "Failed to generate code for export",
          variant: "destructive",
        });
        return;
      }
      const readme = template.generateReadme(strategy);
      const disclaimer = DISCLAIMER_TEXT;

      // Build ZIP bundle (single download to avoid browser blocking)
      const zip = new JSZip();
      zip.file(`${cleanName}.${platform.extension}`, code);
      zip.file(`${cleanName}_README.txt`, readme);
      zip.file(`${cleanName}_DISCLAIMER.txt`, disclaimer);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanName}_${selectedExportPlatform.replace(/[^a-zA-Z0-9]/g, '_')}_bundle.zip`;
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      toast({
        title: "Export Complete",
        description: `${strategy.name} bundle downloaded for ${selectedExportPlatform}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error", 
        description: "An error occurred during export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCode = () => {
    if (!selectedExportPlatform) return;

    try {
      const template = EXPORT_TEMPLATES[selectedExportPlatform as keyof typeof EXPORT_TEMPLATES];
      if (!template) {
        toast({
          title: "Template Not Found",
          description: "The selected platform template is not available",
          variant: "destructive",
        });
        return;
      }

      // Generate code with timeout protection
      const code = template.generateCode(strategy, selectedTimeframe);
      
      if (!code || code.trim() === '') {
        toast({
          title: "Generation Failed", 
          description: "Failed to generate code for the selected strategy",
          variant: "destructive",
        });
        return;
      }

      setGeneratedCode(code);
      
      toast({
        title: "Code Generated",
        description: `${strategy.name} script generated for ${selectedExportPlatform}`,
      });
    } catch (error) {
      console.error('Code generation error:', error);
      toast({
        title: "Generation Error",
        description: "An error occurred while generating the code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Code Copied",
        description: "Script code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleExportCodeFile = () => {
    if (!generatedCode) return;

    const platform = EXPORT_PLATFORMS[selectedExportPlatform as keyof typeof EXPORT_PLATFORMS];
    const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    downloadFile(generatedCode, `${cleanName}.${platform.extension}`);

    toast({
      title: "File Exported",
      description: `${strategy.name}.${platform.extension} downloaded`,
    });
  };

  const handleDownloadPineScript = (variant: "indicator" | "strategy") => {
    try {
      console.log('Starting Pine Script download for variant:', variant);
      const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Generate Pine Script code
      const pineCode = variant === "indicator" 
        ? PineScriptEngine.generateIndicatorVersion(strategy)
        : PineScriptEngine.generateStrategyVersion(strategy);
      
      console.log('Generated Pine Script code:', pineCode?.length > 0 ? 'SUCCESS' : 'FAILED');
      
      // Generate README
      const readme = PineScriptEngine.generateReadme(strategy, variant);
      
      // Generate disclaimer
      const disclaimer = PineScriptEngine.generateDisclaimer();
      
      // Create bundle with sequential downloads to avoid browser blocking
      const timestamp = new Date().toISOString().slice(0, 10);
      const prefix = `${cleanName}_${variant}_${timestamp}`;
      
      // Download files with small delays to prevent browser blocking
      console.log('Starting file downloads...');
      
      // Download Pine Script immediately
      downloadFile(pineCode, `${prefix}.pine`);
      
      // Download README after short delay
      setTimeout(() => {
        downloadFile(readme, `${prefix}_README.txt`);
      }, 100);
      
      // Download disclaimer after longer delay
      setTimeout(() => {
        downloadFile(disclaimer, `${prefix}_DISCLAIMER.txt`);
      }, 200);
      
      toast({
        title: "Pine Script Downloaded",
        description: `${strategy.name} ${variant} version exported with documentation (3 files)`,
      });
    } catch (error) {
      console.error('Pine Script export error:', error);
      toast({
        title: "Export Error",
        description: "An error occurred during Pine Script export. Please try again.",
        variant: "destructive",
      });
    }
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

        {/* Pine Script Downloads */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Pine Script v6 Downloads</CardTitle>
            <CardDescription>
              Download ready-to-use Pine Script files following uniform engine standards
            </CardDescription>
          </CardHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-primary">Indicator Version</div>
                <p className="text-sm text-muted-foreground">
                  Visual signals and alerts only. No trade execution.
                  Perfect for manual trading and signal confirmation.
                </p>
                <Button 
                  onClick={() => handleDownloadPineScript("indicator")}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Indicator
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-2 border-dashed border-accent/20 hover:border-accent/40 transition-colors">
              <div className="text-center space-y-3">
                <div className="text-lg font-semibold text-accent">Strategy Version</div>
                <p className="text-sm text-muted-foreground">
                  Full backtesting strategy with automated entries, exits, and risk management.
                  Includes opposite-close rules and uniform filters.
                </p>
                <Button 
                  onClick={() => handleDownloadPineScript("strategy")}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Strategy
                </Button>
              </div>
            </Card>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <h4 className="font-medium text-accent mb-2">Uniform Engine Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <li>• EMA trend filter (configurable)</li>
              <li>• Volume confirmation (optional)</li>
              <li>• ATR or % based risk management</li>
              <li>• No overlapping positions</li>
              <li>• Real-time alerts support</li>
              <li>• Date range backtesting</li>
            </ul>
          </div>
        </Card>

        {/* Legacy Export Section */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Multi-Platform Export</CardTitle>
            <CardDescription>
              Generate code for other trading platforms (MetaTrader, cTrader, etc.)
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

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateCode}
                disabled={!selectedExportPlatform || COMING_SOON_PLATFORMS.includes(selectedExportPlatform)}
                className="flex-1"
              >
                <Code className="h-4 w-4 mr-2" />
                Generate Code
              </Button>
              
              <Button 
                onClick={handleExport}
                disabled={!selectedExportPlatform || COMING_SOON_PLATFORMS.includes(selectedExportPlatform)}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Bundle
              </Button>
            </div>
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

        {/* Global Disclaimer */}
        <Card className="p-6 border-2 border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-500 mb-2">Important Disclaimer</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All scripts are provided for educational purposes only and follow uniform Pine Script v6 standards. 
                Each download includes detailed documentation and disclaimers.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Educational use only - not financial advice</li>
                <li>• Always test strategies thoroughly before live trading</li>
                <li>• Past performance does not guarantee future results</li>
                <li>• Use proper risk management and position sizing</li>
                <li>• Comply with all applicable laws and regulations</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Script Code Window */}
        {generatedCode && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Generated Script Code
                  </CardTitle>
                  <CardDescription>
                    {strategy.name} - {selectedExportPlatform} ({selectedTimeframe})
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    onClick={handleExportCodeFile}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export File
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <Textarea
                  value={generatedCode}
                  readOnly
                  className="min-h-[400px] font-mono text-sm bg-muted/30 border-muted resize-none"
                  placeholder="Generated script will appear here..."
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};