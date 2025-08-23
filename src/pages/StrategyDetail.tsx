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
      
      console.log('Generated Pine Script code length:', pineCode?.length || 0);
      console.log('Pine Script preview:', pineCode?.substring(0, 100) + '...');
      
      if (!pineCode || pineCode.trim().length === 0) {
        console.error('Pine Script generation failed - empty content');
        toast({
          title: "Generation Failed",
          description: "Pine Script code generation returned empty content",
          variant: "destructive",
        });
        return;
      }
      
      // Generate README
      const readme = PineScriptEngine.generateReadme(strategy, variant);
      console.log('Generated README length:', readme?.length || 0);
      
      // Generate disclaimer
      const disclaimer = PineScriptEngine.generateDisclaimer();
      console.log('Generated disclaimer length:', disclaimer?.length || 0);
      
      // Force download with user interaction
      const timestamp = new Date().toISOString().slice(0, 10);
      const prefix = `${cleanName}_${variant}_${timestamp}`;
      
      console.log('Attempting to download files...');
      
      // Try direct download with user gesture
      const downloadWithFallback = (content: string, filename: string) => {
        console.log(`Downloading ${filename}, content length: ${content.length}`);
        
        try {
          // Method 1: Direct blob download
          const blob = new Blob([content], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          
          // Create and click download link
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up after delay
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          
          console.log(`Successfully triggered download for ${filename}`);
        } catch (downloadError) {
          console.error(`Failed to download ${filename}:`, downloadError);
          
          // Fallback: Show content in new window
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`<pre>${content}</pre>`);
            newWindow.document.title = filename;
          }
        }
      };
      
      // Download all files
      downloadWithFallback(pineCode, `${prefix}.pine`);
      downloadWithFallback(readme, `${prefix}_README.txt`);
      downloadWithFallback(disclaimer, `${prefix}_DISCLAIMER.txt`);
      
      toast({
        title: "Download Triggered",
        description: `${strategy.name} ${variant} files prepared for download`,
      });
      
    } catch (error) {
      console.error('Pine Script export error:', error);
      toast({
        title: "Export Error",
        description: `Error: ${error.message}`,
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

        {/* Code Preview & Generation - Main Section */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Code className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Code Preview & Generation</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Generate and preview trading code for your preferred platform
            </CardDescription>
          </CardHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform:</label>
                <Select value={selectedExportPlatform} onValueChange={setSelectedExportPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EXPORT_PLATFORMS).map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeframe:</label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map(tf => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerateCode} className="w-full md:w-auto">
              <Code className="h-4 w-4 mr-2" />
              Generate Code Preview
            </Button>

            {generatedCode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Generated Code:</h4>
                  <div className="flex gap-2">
                    <Button onClick={handleCopyCode} variant="outline" size="sm">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button onClick={handleExportCodeFile} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export File
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generatedCode}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Generated code will appear here..."
                />
              </div>
            )}
          </div>
        </Card>

        {/* Strategy Downloads */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Download className="h-6 w-6 text-accent" />
              <CardTitle className="text-2xl">Download Options</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Download complete trading packages with comprehensive documentation
            </CardDescription>
          </CardHeader>
          
          {/* Download Options */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Download Package</h3>
              <p className="text-muted-foreground mb-4">
                Select the type of code package that best fits your trading needs:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Indicator Version */}
              <Card className="p-4 border-2 border-primary/30 bg-primary/5">
                <div className="space-y-4">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="text-lg font-semibold text-primary">Indicator Version</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Visual signals only</strong> - Perfect for manual trading
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">What you get:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Buy/Sell signal arrows on chart</li>
                      <li>• Real-time alerts and notifications</li>
                      <li>• No automatic trade execution</li>
                      <li>• Entry/exit confirmation tools</li>
                      <li>• Perfect for discretionary trading</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => handleDownloadPineScript("indicator")}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Indicator (Pine Script)
                  </Button>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    Downloads: .pine + README + DISCLAIMER
                  </div>
                </div>
              </Card>

              {/* Strategy Version */}
              <Card className="p-4 border-2 border-accent/30 bg-accent/5">
                <div className="space-y-4">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
                    <h4 className="text-lg font-semibold text-accent">Strategy Version</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Full backtesting</strong> - Automated trading with risk management
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">What you get:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Complete backtesting framework</li>
                      <li>• Automated entry/exit execution</li>
                      <li>• Built-in risk management</li>
                      <li>• Performance metrics & statistics</li>
                      <li>• Opposite-close position rules</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => handleDownloadPineScript("strategy")}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Strategy (Pine Script)
                  </Button>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    Downloads: .pine + README + DISCLAIMER
                  </div>
                </div>
              </Card>

              {/* Multi-Platform Export */}
              <Card className="p-4 border-2 border-secondary/30 bg-secondary/5">
                <div className="space-y-4">
                  <div className="text-center">
                    <Code className="h-8 w-8 text-foreground mx-auto mb-2" />
                    <h4 className="text-lg font-semibold">Multi-Platform Export</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Cross-platform bundle</strong> - Multiple formats in one package
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">What you get:</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• MetaTrader 4/5 (MQL)</li>
                      <li>• cTrader (C#)</li>
                      <li>• NinjaTrader 8 (C#)</li>
                      <li>• TradingView (Pine Script)</li>
                      <li>• Complete documentation bundle</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timeframe:</label>
                      <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEFRAMES.map(tf => (
                            <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleExport} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Multi-Platform Bundle
                    </Button>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      Downloads: ZIP with all platform files
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Features Information */}
            <div className="bg-muted/30 border rounded-lg p-4">
              <h4 className="font-medium mb-3">All Downloads Include:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Technical Features:</div>
                  <ul className="space-y-1">
                    <li>• EMA trend filter (configurable)</li>
                    <li>• Volume confirmation (optional)</li>
                    <li>• ATR or percentage-based risk management</li>
                    <li>• No overlapping positions rule</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Documentation:</div>
                  <ul className="space-y-1">
                    <li>• Complete setup instructions</li>
                    <li>• Parameter configuration guide</li>
                    <li>• Risk management guidelines</li>
                    <li>• Educational use disclaimer</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Coming Soon Platforms */}
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