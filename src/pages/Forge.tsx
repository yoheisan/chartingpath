import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Copy, Save, Upload, RefreshCw, TestTube, Code2, Lock, Crown, Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { forgeToSite, siteToForge } from "@/adapters/forge";

const Forge = () => {
  const location = useLocation();
  const { profile, hasFeatureAccess, getGenerationQuota, isAuthenticated } = useUserProfile();
  const [activeTab, setActiveTab] = useState("generate");
  const [quotaUsed, setQuotaUsed] = useState(0);
  
  // Generate tab state
  const [prompt, setPrompt] = useState("");
  const [strategyJson, setStrategyJson] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("pine_v6");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Refactor tab state
  const [uploadedCode, setUploadedCode] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState("");
  const [parsedAST, setParsedAST] = useState<any>(null);
  const [isRefactoring, setIsRefactoring] = useState(false);
  
  // Test tab state
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  // Check for imported strategy from AI Builder
  useEffect(() => {
    if (location.state?.strategyAST) {
      setStrategyJson(location.state.strategyAST);
      setActiveTab("generate");
    }
  }, [location.state]);

  const platforms = {
    pine_v6: { name: "Pine Script v6", extension: ".pine", tier: "pro" },
    pine_v5: { name: "Pine Script v5", extension: ".pine", tier: "pro" },
    mql4: { name: "MQL4 (MetaTrader 4)", extension: ".mq4", tier: "pro_plus" },
    mql5: { name: "MQL5 (MetaTrader 5)", extension: ".mq5", tier: "pro_plus" },
    ctrader: { name: "cTrader C#", extension: ".cs", tier: "elite" },
    ninja: { name: "NinjaTrader 8 C#", extension: ".cs", tier: "elite" }
  };

  const quickPresets = [
    { label: "SMA 21 xup SMA 50", value: '{"conditions":[{"type":"crossover","lhs":{"ind":"SMA","params":{"len":21}},"rhs":{"ind":"SMA","params":{"len":50}}}]}' },
    { label: "RSI xup 50", value: '{"conditions":[{"type":"crossover","lhs":{"ind":"RSI","params":{"len":14}},"rhs":{"threshold":50}}]}' },
    { label: "MACD xup Signal", value: '{"conditions":[{"type":"crossover","lhs":{"ind":"MACD","params":{"fast":12,"slow":26,"signal":9,"mode":"macd"}},"rhs":{"ind":"MACD","params":{"fast":12,"slow":26,"signal":9,"mode":"signal"}}}]}' },
    { label: "Price > VWAP", value: '{"conditions":[{"type":"above","lhs":{"ind":"price","params":{"src":"close"}},"rhs":{"ind":"VWAP","params":{}}}]}' },
    { label: "SMA(15) was below SMA(200) 5 bars ago", value: '{"conditions":[{"type":"relative","lhs":{"ind":"SMA","params":{"len":15}},"op":"was_below","rhs":{"ind":"SMA","params":{"len":200}},"point":{"mode":"n_bars_ago","n":5}}]}' }
  ];

  const getTierGateInfo = (platform: string) => {
    const platformInfo = platforms[platform as keyof typeof platforms];
    if (!platformInfo) return null;
    
    const hasAccess = profile?.subscription_plan === "starter" ? false : 
      platformInfo.tier === "pro" ? ["pro", "pro_plus", "elite"].includes(profile?.subscription_plan || "") :
      platformInfo.tier === "pro_plus" ? ["pro_plus", "elite"].includes(profile?.subscription_plan || "") :
      profile?.subscription_plan === "elite";
      
    return { hasAccess, requiredTier: platformInfo.tier };
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to generate code");
      return;
    }

    const quota = getGenerationQuota();
    if (quotaUsed >= quota) {
      toast.error(`Daily quota exceeded (${quota}/day). Resets at 00:00 JST.`);
      return;
    }

    const gateInfo = getTierGateInfo(selectedPlatform);
    if (!gateInfo?.hasAccess) {
      toast.error(`${platforms[selectedPlatform as keyof typeof platforms].name} requires ${gateInfo?.requiredTier.toUpperCase()} plan or higher`);
      return;
    }

    setIsGenerating(true);
    try {
      // Mock generation - in real implementation, call AI generation endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockCode = `// Generated ${platforms[selectedPlatform as keyof typeof platforms].name} Code
// Strategy: ${prompt || "Custom Strategy"}
// Generated at: ${new Date().toISOString()}

//@version=6
strategy("Generated Strategy", overlay=true)

// Strategy logic would be generated here based on AST
length = input.int(14, "Length")
src = input.source(close, "Source")

// Entry conditions
longCondition = ta.crossover(ta.sma(src, 21), ta.sma(src, 50))
shortCondition = ta.crossunder(ta.sma(src, 21), ta.sma(src, 50))

// Risk management
atrLength = input.int(14, "ATR Length")
atrMultiplier = input.float(1.5, "ATR Stop Loss Multiplier")
atr = ta.atr(atrLength)

if longCondition
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=close - atr * atrMultiplier, limit=close + atr * atrMultiplier * 2)

if shortCondition
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=close + atr * atrMultiplier, limit=close - atr * atrMultiplier * 2)

// Educational use only. No financial advice. Performance not guaranteed.`;
      
      setGeneratedCode(mockCode);
      setQuotaUsed(prev => prev + 1);
      toast.success("Code generated successfully!");
    } catch (error) {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefactor = async () => {
    if (!uploadedCode.trim()) {
      toast.error("Please paste or upload code to refactor");
      return;
    }

    setIsRefactoring(true);
    try {
      // Mock platform detection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let detected = "unknown";
      if (uploadedCode.includes("@version") || uploadedCode.includes("strategy(")) {
        detected = "pine";
      } else if (uploadedCode.includes("#property") || uploadedCode.includes("OnTick()")) {
        detected = "mql4";
      } else if (uploadedCode.includes("using System") || uploadedCode.includes("class")) {
        detected = "csharp";
      }
      
      setDetectedPlatform(detected);
      
      // Mock AST conversion
      const mockAST = {
        type: "strategy",
        name: "Refactored Strategy",
        conditions: [
          {
            type: "crossover",
            lhs: { ind: "SMA", params: { len: 21 } },
            rhs: { ind: "SMA", params: { len: 50 } }
          }
        ],
        execution: { mode: "long" },
        risk: { type: "atr", multiplier: 1.5 }
      };
      
      setParsedAST(mockAST);
      toast.success(`Detected ${detected.toUpperCase()} code and parsed to AST`);
    } catch (error) {
      toast.error("Refactoring failed. Code format may be unsupported.");
    } finally {
      setIsRefactoring(false);
    }
  };

  const handleTest = async () => {
    if (!strategyJson && !parsedAST) {
      toast.error("No strategy to test. Generate or refactor code first.");
      return;
    }

    setIsTesting(true);
    try {
      // Mock backtest
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = {
        totalTrades: 157,
        winRate: 68.2,
        profitFactor: 1.85,
        maxDrawdown: 12.4,
        netProfit: 23580,
        avgWin: 245,
        avgLoss: -132,
        equity: Array.from({ length: 100 }, (_, i) => 10000 + Math.random() * 5000 - 2500)
      };
      
      setBacktestResults(mockResults);
      toast.success("Backtest completed successfully!");
    } catch (error) {
      toast.error("Backtest failed. Please try again.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard!");
  };

  const handleDownloadZip = () => {
    const gateInfo = getTierGateInfo(selectedPlatform);
    if (!gateInfo?.hasAccess) {
      toast.error(`${platforms[selectedPlatform as keyof typeof platforms].name} export requires ${gateInfo?.requiredTier.toUpperCase()} plan`);
      return;
    }
    
    // Mock download
    toast.success("Download started! (Code + README + DISCLAIMER)");
  };

  const handleSaveToLibrary = () => {
    if (!hasFeatureAccess('save_library')) {
      toast.error("Save to library requires Pro+ plan or higher");
      return;
    }
    
    toast.success("Strategy saved to library!");
  };

  const renderUpsellModal = (feature: string, requiredTier: string) => (
    <div className="text-center p-6">
      <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
      <p className="text-muted-foreground mb-4">
        {feature} requires {requiredTier.toUpperCase()} plan or higher
      </p>
      <Button asChild>
        <Link to="/pricing">View Plans</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ai-builder" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to AI Builder
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Forge</h1>
          <p className="text-lg text-muted-foreground">
            Advanced code generation, refactoring & testing
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline">
              Educational use only. No financial advice. Performance not guaranteed.
            </Badge>
            {profile && (
              <Badge variant="secondary">
                {getTierGateInfo("pine_v6")?.hasAccess ? (
                  <>Quota: {quotaUsed}/{getGenerationQuota()}</>
                ) : (
                  <><Lock className="h-3 w-3 mr-1" />Read-only Demo</>
                )}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="refactor">Refactor</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input</CardTitle>
                  <CardDescription>
                    Natural language prompt or imported JSON AST
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">Strategy Description</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe your trading strategy..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>Quick Presets</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {quickPresets.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPrompt(preset.label);
                            setStrategyJson(JSON.parse(preset.value));
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {strategyJson && (
                    <div>
                      <Label>Imported AST</Label>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(strategyJson, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="platform">Target Platform</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(platforms).map(([key, platform]) => {
                          const gateInfo = getTierGateInfo(key);
                          return (
                            <SelectItem key={key} value={key} disabled={!gateInfo?.hasAccess}>
                              <div className="flex items-center gap-2">
                                {platform.name}
                                {!gateInfo?.hasAccess && <Lock className="h-3 w-3" />}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code2 className="h-4 w-4 mr-2" />
                        Generate Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generated Code</CardTitle>
                  <CardDescription>
                    {platforms[selectedPlatform as keyof typeof platforms]?.name || "Select platform"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCode ? (
                    <div className="space-y-4">
                      <Textarea
                        value={generatedCode}
                        readOnly
                        rows={15}
                        className="font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyCode}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadZip}>
                          <Download className="h-4 w-4 mr-2" />
                          Download .zip
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSaveToLibrary}>
                          <Save className="h-4 w-4 mr-2" />
                          Save to Library
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Generated code will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="refactor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Source Code</CardTitle>
                  <CardDescription>
                    Paste or upload existing trading code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="code-input">Code</Label>
                    <Textarea
                      id="code-input"
                      placeholder="Paste your Pine Script, MQL4/5, or C# code here..."
                      value={uploadedCode}
                      onChange={(e) => setUploadedCode(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleRefactor} 
                    disabled={isRefactoring || !uploadedCode.trim()}
                    className="w-full"
                  >
                    {isRefactoring ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Parse & Refactor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Normalized Strategy</CardTitle>
                  <CardDescription>
                    {detectedPlatform ? `Detected: ${detectedPlatform.toUpperCase()}` : "Analysis results"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {parsedAST ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Parsed AST</Label>
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(parsedAST, null, 2)}
                        </pre>
                      </div>
                      <Button 
                        onClick={() => {
                          setStrategyJson(parsedAST);
                          setActiveTab("generate");
                        }}
                        className="w-full"
                      >
                        Use in Generator
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Parsed strategy will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backtest Results</CardTitle>
                <CardDescription>
                  Lightweight simulation and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backtestResults ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backtestResults.totalTrades}</div>
                      <div className="text-sm text-muted-foreground">Total Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{backtestResults.winRate}%</div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backtestResults.profitFactor}</div>
                      <div className="text-sm text-muted-foreground">Profit Factor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{backtestResults.maxDrawdown}%</div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run backtest to see performance metrics</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleTest} 
                  disabled={isTesting || (!strategyJson && !parsedAST)}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Backtest
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(platforms).map(([key, platform]) => {
                const gateInfo = getTierGateInfo(key);
                return (
                  <Card key={key} className={!gateInfo?.hasAccess ? "opacity-50" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {platform.name}
                        {!gateInfo?.hasAccess && <Lock className="h-4 w-4" />}
                      </CardTitle>
                      <CardDescription>
                        {gateInfo?.hasAccess ? "Ready to export" : `Requires ${gateInfo?.requiredTier.toUpperCase()} plan`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          disabled={!gateInfo?.hasAccess}
                          onClick={handleDownloadZip}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download {platform.extension}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Forge;