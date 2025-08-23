import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Download, TrendingUp, TrendingDown, AlertCircle, Code, Copy, Check, Info } from "lucide-react";
import { useState } from "react";
import { tradingStrategies, Strategy } from "@/utils/TradingStrategiesData";
import { EXPORT_TEMPLATES, DISCLAIMER_TEXT } from "@/components/StrategyExportTemplates";
import { PineScriptEngine } from "@/components/PineScriptEngine";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

const EXPORT_PLATFORMS = {
  "TradingView - Pine Script v6": { 
    extension: "pine", 
    indicatorName: "Indicator", 
    strategyName: "Strategy",
    supportsExport: true,
    supportsIndicator: true,
    supportsStrategy: true
  },
  "MetaTrader 4 - MQL4": { 
    extension: "mq4", 
    indicatorName: "Indicator", 
    strategyName: "Expert Advisor",
    supportsExport: true,
    supportsIndicator: true,
    supportsStrategy: true
  },
  "MetaTrader 5 - MQL5": { 
    extension: "mq5", 
    indicatorName: "Indicator", 
    strategyName: "Expert Advisor",
    supportsExport: true,
    supportsIndicator: true,
    supportsStrategy: true
  },
  "cTrader - C#": { 
    extension: "cs", 
    indicatorName: "Indicator", 
    strategyName: "Robot (cBot)",
    supportsExport: true,
    supportsIndicator: true,
    supportsStrategy: true
  },
  "NinjaTrader 8 - C#": { 
    extension: "cs", 
    indicatorName: "Indicator", 
    strategyName: "Strategy",
    supportsExport: true,
    supportsIndicator: true,
    supportsStrategy: true
  }
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
  const [selectedPlatform, setSelectedPlatform] = useState<string>("TradingView - Pine Script v6");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const currentPlatform = EXPORT_PLATFORMS[selectedPlatform as keyof typeof EXPORT_PLATFORMS];

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

  const downloadFile = (content: string, filename: string): boolean => {
    try {
      if (!content || content.trim().length === 0) {
        console.error(`downloadFile: empty content for ${filename}`);
        return false;
      }
      const ext = filename.split('.').pop()?.toLowerCase();
      const textExts = ['txt','pine','mq4','mq5','cs','el','ts','js','json'];
      const mime = textExts.includes(ext || '') ? 'text/plain;charset=utf-8' : 'application/octet-stream';

      const blob = new Blob([content], { type: mime });
      if (blob.size === 0) {
        console.error(`downloadFile: zero-size blob for ${filename}`);
        return false;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      return true;
    } catch (e) {
      console.error('downloadFile error:', e);
      // Fallback: open in a new window so user can save manually
      try {
        const nw = window.open('', '_blank');
        if (nw) {
          const safe = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          nw.document.write(`<pre>${safe}</pre>`);
          nw.document.title = filename;
          nw.document.close();
          return true;
        }
      } catch {}
      return false;
    }
  };

  const handleExport = async () => {
    if (!selectedPlatform) return;

    try {
      const template = EXPORT_TEMPLATES[selectedPlatform as keyof typeof EXPORT_TEMPLATES];
      if (!template) {
        toast({
          title: "Template Not Found",
          description: "The selected platform template is not available",
          variant: "destructive",
        });
        return;
      }

      const platform = EXPORT_PLATFORMS[selectedPlatform as keyof typeof EXPORT_PLATFORMS];
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
      a.download = `${cleanName}_${selectedPlatform.replace(/[^a-zA-Z0-9]/g, '_')}_bundle.zip`;
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      toast({
        title: "Export Complete",
        description: `${strategy.name} bundle downloaded for ${selectedPlatform}`,
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
    if (!selectedPlatform) return;

    try {
      const template = EXPORT_TEMPLATES[selectedPlatform as keyof typeof EXPORT_TEMPLATES];
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
        description: `${strategy.name} script generated for ${selectedPlatform}`,
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

    const platform = EXPORT_PLATFORMS[selectedPlatform as keyof typeof EXPORT_PLATFORMS];
    const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    const ok = downloadFile(generatedCode, `${cleanName}.${platform.extension}`);

    toast({
      title: ok ? "File Exported" : "Download Blocked",
      description: ok
        ? `${strategy.name}.${platform.extension} downloaded`
        : `Your browser blocked the download. Please allow downloads/pop-ups and try again.`,
      variant: ok ? "default" : "destructive",
    });
  };

  const handleDownloadVersioned = (variant: "indicator" | "strategy", platform: string) => {
    try {
      console.log(`Starting ${variant} download for platform:`, platform);
      const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
      const platformInfo = EXPORT_PLATFORMS[platform as keyof typeof EXPORT_PLATFORMS];
      
      let code: string;
      let readme: string;
      let disclaimer: string;
      
      if (platform === "TradingView - Pine Script v6") {
        // Use existing Pine Script engine
        code = variant === "indicator" 
          ? PineScriptEngine.generateIndicatorVersion(strategy)
          : PineScriptEngine.generateStrategyVersion(strategy);
        readme = PineScriptEngine.generateReadme(strategy, variant);
        disclaimer = PineScriptEngine.generateDisclaimer();
      } else {
        // Use export templates for other platforms
        const template = EXPORT_TEMPLATES[platform as keyof typeof EXPORT_TEMPLATES];
        if (!template) {
          toast({
            title: "Template Not Found",
            description: `The ${platform} template is not available`,
            variant: "destructive",
          });
          return;
        }
        
        code = template.generateCode(strategy, selectedTimeframe);
        readme = template.generateReadme(strategy);
        disclaimer = DISCLAIMER_TEXT;
        
        // Modify code generation for indicator vs strategy variants
        if (variant === "indicator") {
          // Customize for indicator-only functionality
          code = code.replace(/strategy\(/g, 'indicator(').replace(/strategy\./g, '');
        }
      }
      
      if (!code || code.trim().length === 0) {
        console.error('Code generation failed - empty content');
        toast({
          title: "Generation Failed",
          description: `${platformInfo.indicatorName} code generation returned empty content`,
          variant: "destructive",
        });
        return;
      }
      
      // Force download with user interaction
      const timestamp = new Date().toISOString().slice(0, 10);
      const variantName = variant === "indicator" ? platformInfo.indicatorName : platformInfo.strategyName;
      const prefix = `${cleanName}_${variantName.replace(/\s+/g, '_')}_${timestamp}`;
      
      console.log('Attempting to download files...');
      
      // Enhanced download with integrity checks
      const downloadWithFallback = (content: string, filename: string) => {
        console.log(`Downloading ${filename}, content length: ${content.length}`);
        
        // Validate content integrity
        if (!content || content.trim().length === 0) {
          console.error(`Cannot download ${filename}: Empty content`);
          toast({
            title: "Download Error",
            description: `${filename} contains no content`,
            variant: "destructive",
          });
          return false;
        }
        
        try {
          // Use proper MIME type for different file extensions
          const mimeType = filename.endsWith('.txt') ? 'text/plain' : 'application/octet-stream';
          const blob = new Blob([content], { type: mimeType });
          
          // Verify blob was created successfully
          if (blob.size === 0) {
            throw new Error('Blob creation failed - zero size');
          }
          
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.style.display = 'none';
          
          // Add to DOM, trigger download, then cleanup
          document.body.appendChild(link);
          
          // Trigger download immediately within user gesture
          link.click();
          console.log(`Successfully triggered download for ${filename}`);
          
          // Cleanup after download
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
          }, 1000);
          
          return true;
        } catch (downloadError) {
          console.error(`Failed to download ${filename}:`, downloadError);
          
          // Enhanced fallback - show content in new window with better formatting
          try {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              const html = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>${filename}</title>
                  <style>
                    body { font-family: monospace; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
                    pre { white-space: pre-wrap; word-wrap: break-word; }
                    .header { background: #2d2d30; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h3>${filename}</h3>
                    <p>Right-click and "Save As" to download this file.</p>
                  </div>
                  <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </body>
                </html>
              `;
              newWindow.document.write(html);
              newWindow.document.close();
              return true;
            }
          } catch (fallbackError) {
            console.error(`Fallback also failed for ${filename}:`, fallbackError);
          }
          
          return false;
        }
      };
      
      // Package files into a single ZIP to ensure browser allows download
      const zip = new JSZip();
      zip.file(`${prefix}.${platformInfo.extension}`, code);
      zip.file(`${prefix}_README.txt`, readme);
      zip.file(`${prefix}_DISCLAIMER.txt`, disclaimer);

      zip.generateAsync({ type: "blob" }).then((zipBlob) => {
        const zipName = `${prefix}.zip`;
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = zipName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        const variantDescription = variant === "indicator" ? platformInfo.indicatorName : platformInfo.strategyName;
        toast({
          title: "Download Ready",
          description: `${strategy.name} ${variantDescription} ZIP downloaded`,
        });
      }).catch((zipErr) => {
        console.error('ZIP generation failed:', zipErr);
        toast({
          title: "Export Error",
          description: "Failed to create ZIP file for download",
          variant: "destructive",
        });
        // Fallback to single primary file download to salvage action
        downloadWithFallback(code, `${prefix}.${platformInfo.extension}`);
      });
      
    } catch (error) {
      console.error(`${variant} export error:`, error);
      toast({
        title: "Export Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
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
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
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
                        {currentPlatform?.supportsExport && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={handleExportCodeFile} variant="outline" size="sm" className="relative">
                                <Download className="h-4 w-4 mr-2" />
                                <Info className="h-3 w-3 absolute -top-1 -right-1 text-muted-foreground" />
                                Export File
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Downloads the generated code as a file for {selectedPlatform}. Perfect for importing directly into your trading platform.</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {currentPlatform?.supportsIndicator && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={() => handleDownloadVersioned("indicator", selectedPlatform)} variant="outline" size="sm" className="relative">
                                <Download className="h-4 w-4 mr-2" />
                                <Info className="h-3 w-3 absolute -top-1 -right-1 text-muted-foreground" />
                                {currentPlatform.indicatorName} Version
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Downloads {selectedPlatform} {currentPlatform.indicatorName.toLowerCase()} version with visual buy/sell signals, alerts, and chart overlays. No automatic trading - perfect for manual analysis.</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {currentPlatform?.supportsStrategy && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={() => handleDownloadVersioned("strategy", selectedPlatform)} variant="outline" size="sm" className="relative">
                                <Download className="h-4 w-4 mr-2" />
                                <Info className="h-3 w-3 absolute -top-1 -right-1 text-muted-foreground" />
                                {currentPlatform.strategyName} Version
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Downloads complete {selectedPlatform} {currentPlatform.strategyName.toLowerCase()} with backtesting framework, automatic position management, and performance analytics.</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
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

        </div>
      </div>
    </TooltipProvider>
  );
};