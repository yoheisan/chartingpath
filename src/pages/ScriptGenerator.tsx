import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Code, Copy, Download, Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { tradingStrategies } from "@/utils/TradingStrategiesData";
import { EXPORT_TEMPLATES } from "@/components/StrategyExportTemplates";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuthGate } from "@/hooks/useAuthGate";
import { AuthGateDialog } from "@/components/AuthGateDialog";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "8h", "1d", "1w"];

const EXPORT_PLATFORMS = {
  "TradingView - Pine Script v5": { extension: "pine" },
  "MetaTrader 4 - MQL4": { extension: "mq4" },
  "MetaTrader 5 - MQL5": { extension: "mq5" },
  "cTrader - C#": { extension: "cs" },
  "NinjaTrader 8 - C#": { extension: "cs" }
};

const ScriptGenerator = () => {
  const { toast } = useToast();
  const { canDownload } = useUserProfile();
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthGate("script generation");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("TradingView - Pine Script v5");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleGenerateScript = () => {
    if (!selectedStrategy) return;

    const strategy = tradingStrategies.find(s => s.id === parseInt(selectedStrategy));
    if (!strategy) return;

    const template = EXPORT_TEMPLATES[selectedPlatform as keyof typeof EXPORT_TEMPLATES];
    if (!template) return;

    const code = template.generateCode(strategy, selectedTimeframe);
    setGeneratedCode(code);
    
    toast({
      title: "Script Generated",
      description: `${strategy.name} script generated for ${selectedPlatform}`,
    });
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

  const handleExportFile = () => {
    if (!canDownload()) {
      toast({
        title: "Download Restricted",
        description: "File download is available for Pro+ subscribers only. You can copy the code to test it.",
        variant: "destructive",
      });
      return;
    }

    if (!generatedCode || !selectedStrategy) return;

    const strategy = tradingStrategies.find(s => s.id === parseInt(selectedStrategy));
    if (!strategy) return;

    const platform = EXPORT_PLATFORMS[selectedPlatform as keyof typeof EXPORT_PLATFORMS];
    const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}.${platform.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "File Exported",
      description: `${strategy.name}.${platform.extension} downloaded`,
    });
  };

  const selectedStrategyData = tradingStrategies.find(s => s.id === parseInt(selectedStrategy || "0"));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Strategy Script Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate ready-to-use trading scripts from our strategy library for your preferred platform
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Script Configuration
              </CardTitle>
              <CardDescription>
                Select strategy, timeframe, and platform to generate your script
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Trading Strategy</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingStrategies.filter(s => !s.hidden).map(strategy => (
                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map(tf => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Export Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose platform..." />
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

              <Button 
                onClick={() => requireAuth(handleGenerateScript)}
                disabled={!selectedStrategy}
                className="w-full"
              >
                <Code className="h-4 w-4 mr-2" />
                Generate Script
              </Button>
              <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="script generation" />

              {selectedStrategyData && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">{selectedStrategyData.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{selectedStrategyData.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedStrategyData.indicators.slice(0, 3).map((indicator, index) => (
                      <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        {indicator}
                      </span>
                    ))}
                    {selectedStrategyData.indicators.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{selectedStrategyData.indicators.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Output */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Generated Script
                  </CardTitle>
                  <CardDescription>
                    {generatedCode ? `${selectedStrategyData?.name} - ${selectedPlatform}` : "Configure and generate your script"}
                  </CardDescription>
                </div>
                {generatedCode && (
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
                      onClick={handleExportFile}
                      variant="outline"
                      size="sm"
                      disabled={!canDownload()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      {!canDownload() && <Lock className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedCode ? (
                <div className="relative">
                  <Textarea
                    value={generatedCode}
                    readOnly
                    className="min-h-[500px] font-mono text-sm bg-muted/30 border-muted"
                    placeholder="Generated script will appear here..."
                  />
                </div>
              ) : (
                <div className="min-h-[500px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-muted-foreground/25">
                  <div className="text-center space-y-3">
                    <Code className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Select a strategy and click "Generate Script" to view the code</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> This code is for educational purposes only and does not constitute financial advice. 
            Trading involves risk. Past performance does not guarantee future results. 
            Always test thoroughly and use proper risk management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;