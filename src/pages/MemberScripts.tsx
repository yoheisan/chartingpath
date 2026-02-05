import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, Code, ArrowLeft, Lock, ArrowRight, Copy, Check,
  FileCode, FlaskConical, Zap, Trash2, Clock, Save, LayoutGrid, List
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlatformImportGuide } from "@/components/scripts/PlatformImportGuide";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  generatePineScriptV5,
  generateMQL4,
  generateMQL5,
  getScriptFileExtension,
  type PatternExportData,
  type ScriptType,
} from "@/utils/exports/PatternScriptExporter";

// Supported patterns for script generation
const SUPPORTED_PATTERNS = [
  { id: 'double-top', name: 'Double Top', direction: 'short' as const },
  { id: 'double-bottom', name: 'Double Bottom', direction: 'long' as const },
  { id: 'head-shoulders', name: 'Head & Shoulders', direction: 'short' as const },
  { id: 'inverse-head-shoulders', name: 'Inverse Head & Shoulders', direction: 'long' as const },
  { id: 'rising-wedge', name: 'Rising Wedge', direction: 'short' as const },
  { id: 'falling-wedge', name: 'Falling Wedge', direction: 'long' as const },
  { id: 'ascending-triangle', name: 'Ascending Triangle', direction: 'long' as const },
  { id: 'descending-triangle', name: 'Descending Triangle', direction: 'short' as const },
  { id: 'symmetric-triangle', name: 'Symmetric Triangle', direction: 'long' as const },
  { id: 'bull-flag', name: 'Bull Flag', direction: 'long' as const },
  { id: 'bear-flag', name: 'Bear Flag', direction: 'short' as const },
  { id: 'cup-handle', name: 'Cup & Handle', direction: 'long' as const },
  { id: 'triple-top', name: 'Triple Top', direction: 'short' as const },
  { id: 'triple-bottom', name: 'Triple Bottom', direction: 'long' as const },
];

type Platform = 'pine' | 'mql4' | 'mql5';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'pine', label: 'TradingView (Pine Script v5)' },
  { value: 'mql4', label: 'MetaTrader 4 (MQL4)' },
  { value: 'mql5', label: 'MetaTrader 5 (MQL5)' },
];

interface SavedScript {
  id: string;
  name: string;
  patternName: string;
  platform: Platform;
  instrument: string;
  timeframe: string;
  rrTarget: number;
  code: string;
  createdAt: string;
}

const STORAGE_KEY = 'chartingpath_saved_scripts';

const MemberScripts = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canDownload } = useUserProfile();
  
  // URL params from Pattern Lab / Screener
  const patternParam = searchParams.get('pattern');
  const symbolParam = searchParams.get('symbol');
  const timeframeParam = searchParams.get('timeframe');
  
  // Form state
  const [selectedPattern, setSelectedPattern] = useState(patternParam || SUPPORTED_PATTERNS[0].id);
  const [instrument, setInstrument] = useState(symbolParam || "");
  const [timeframe, setTimeframe] = useState(timeframeParam || "1h");
  const [platform, setPlatform] = useState<Platform>('pine');
  const [scriptType, setScriptType] = useState<ScriptType>('strategy');
  const [rrTarget, setRrTarget] = useState(2);
  
  // Generated code
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Saved scripts
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [scriptsView, setScriptsView] = useState<'grid' | 'list'>('grid');
  
  // Load saved scripts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedScripts(JSON.parse(stored));
      } catch {
        console.error('Failed to load saved scripts');
      }
    }
  }, []);

  const handleGenerate = () => {
    const pattern = SUPPORTED_PATTERNS.find(p => p.id === selectedPattern);
    if (!pattern) {
      toast({
        title: 'Pattern Required',
        description: 'Please select a pattern to generate a script.',
        variant: 'destructive',
      });
      return;
    }

    const symbolToUse = instrument.trim() || 'BTCUSD';
    
    const exportData: PatternExportData = {
      patternName: pattern.name,
      patternId: pattern.id,
      instrument: symbolToUse.toUpperCase(),
      timeframe,
      direction: pattern.direction,
      entryPrice: 100,
      stopLossPrice: pattern.direction === 'long' ? 98 : 102,
      takeProfitPrice: pattern.direction === 'long' ? 100 + (2 * rrTarget) : 100 - (2 * rrTarget),
      riskRewardRatio: rrTarget,
      atrValue: 1,
      detectedAt: new Date().toISOString(),
      qualityScore: 'A',
    };

    let code = '';
    switch (platform) {
      case 'pine':
        code = generatePineScriptV5(exportData, scriptType);
        break;
      case 'mql4':
        code = generateMQL4(exportData);
        break;
      case 'mql5':
        code = generateMQL5(exportData);
        break;
    }
    
    setGeneratedCode(code);
    toast({
      title: 'Script Generated',
      description: `${pattern.name} script ready for ${PLATFORMS.find(p => p.value === platform)?.label}`,
    });
  };

  const handleSaveScript = () => {
    if (!generatedCode) return;
    
    const pattern = SUPPORTED_PATTERNS.find(p => p.id === selectedPattern);
    const newScript: SavedScript = {
      id: crypto.randomUUID(),
      name: `${pattern?.name || 'Pattern'} - ${instrument || 'Generic'} (${timeframe})`,
      patternName: pattern?.name || 'Unknown',
      platform,
      instrument: instrument || 'Generic',
      timeframe,
      rrTarget,
      code: generatedCode,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newScript, ...savedScripts];
    setSavedScripts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    toast({
      title: 'Script Saved',
      description: 'Script added to My Scripts',
    });
  };

  const handleDeleteScript = (id: string) => {
    const updated = savedScripts.filter(s => s.id !== id);
    setSavedScripts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast({ title: 'Script Deleted' });
  };

  const handleLoadScript = (script: SavedScript) => {
    setGeneratedCode(script.code);
    setPlatform(script.platform);
    setActiveTab("generate");
    toast({ title: 'Script Loaded', description: script.name });
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied', description: 'Script copied to clipboard' });
    } catch {
      toast({ title: 'Copy Failed', description: 'Unable to copy', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (!canDownload()) {
      toast({
        title: 'Download Restricted',
        description: 'File download requires Pro+ subscription. You can copy the code instead.',
        variant: 'destructive',
      });
      return;
    }

    if (!generatedCode) return;

    const pattern = SUPPORTED_PATTERNS.find(p => p.id === selectedPattern);
    const ext = getScriptFileExtension(platform);
    const filename = `${pattern?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Pattern'}_${instrument || 'Script'}${ext}`;
    
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Downloaded', description: `${filename} saved` });
  };

  return (
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
          <div className="p-3 rounded-xl bg-cyan-500/10">
            <FileCode className="h-6 w-6 text-cyan-500" />
          </div>
          <h1 className="text-3xl font-bold">Pattern Scripts</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate executable trading scripts for chart patterns you've validated in Pattern Lab
        </p>
      </div>

      {/* CTA: Go to Pattern Lab */}
      <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Start with Pattern Lab</h3>
                <p className="text-sm text-muted-foreground">
                  Backtest patterns first, then export scripts with validated performance data
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/projects/pattern-lab')} className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Open Pattern Lab
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="generate" className="gap-2">
            <Zap className="h-4 w-4" />
            Generate Script
          </TabsTrigger>
          <TabsTrigger value="my-scripts" className="gap-2">
            <FileCode className="h-4 w-4" />
            My Scripts
            {savedScripts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {savedScripts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Configuration Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Script Configuration
                </CardTitle>
                <CardDescription>
                  Configure your pattern-based trading script
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pattern Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pattern</label>
                  <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_PATTERNS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            {p.name}
                            <Badge variant="outline" className={p.direction === 'long' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}>
                              {p.direction}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Instrument */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instrument (optional)</label>
                  <Input
                    placeholder="e.g., BTCUSD, AAPL, EURUSD"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Script uses market entry at deployment</p>
                </div>

                {/* Timeframe */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeframe</label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">Daily</SelectItem>
                      <SelectItem value="1w">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Script Type (Pine only) */}
                {platform === 'pine' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Script Type</label>
                    <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategy">Strategy (backtestable)</SelectItem>
                        <SelectItem value="indicator">Indicator (visual only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* R:R Target */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">R:R Target</label>
                  <Select value={rrTarget.toString()} onValueChange={(v) => setRrTarget(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">1:2</SelectItem>
                      <SelectItem value="3">1:3</SelectItem>
                      <SelectItem value="4">1:4</SelectItem>
                      <SelectItem value="5">1:5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Execution Notes */}
                <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Execution Contract:</p>
                  <p>• Entry at current market price</p>
                  <p>• SL/TP maintain {rrTarget}:1 R:R ratio</p>
                  <p>• 100-bar time stop included</p>
                </div>

                <Button onClick={handleGenerate} className="w-full gap-2">
                  <Zap className="h-4 w-4" />
                  Generate Script
                </Button>
              </CardContent>
            </Card>

            {/* Output Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Generated Script
                    </CardTitle>
                    <CardDescription>
                      {generatedCode 
                        ? `${SUPPORTED_PATTERNS.find(p => p.id === selectedPattern)?.name} - ${PLATFORMS.find(p => p.value === platform)?.label}`
                        : "Configure and generate your script"
                      }
                    </CardDescription>
                  </div>
                  {generatedCode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveScript}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={!canDownload()}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                        {!canDownload() && <Lock className="h-3 w-3 ml-1" />}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedCode ? (
                  <Textarea
                    value={generatedCode}
                    readOnly
                    className="min-h-[500px] font-mono text-sm bg-muted/30"
                  />
                ) : (
                  <div className="min-h-[500px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-muted-foreground/25">
                    <div className="text-center space-y-3">
                      <Code className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">Select a pattern and click "Generate Script"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Scripts Tab */}
        <TabsContent value="my-scripts">
          {savedScripts.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <FileCode className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">No Saved Scripts</h3>
                    <p className="text-muted-foreground">
                      Generate a script and click "Save" to add it to your collection
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab("generate")} variant="outline">
                    Generate Your First Script
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex justify-end">
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant={scriptsView === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setScriptsView('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={scriptsView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setScriptsView('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Grid View */}
              {scriptsView === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {savedScripts.map((script) => (
                    <Card key={script.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{script.patternName}</CardTitle>
                            <CardDescription className="text-xs">
                              {script.instrument} • {script.timeframe} • 1:{script.rrTarget} R:R
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {script.platform.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(script.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleLoadScript(script)}
                          >
                            Load
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteScript(script.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {scriptsView === 'list' && (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {savedScripts.map((script) => (
                        <div 
                          key={script.id} 
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              <FileCode className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{script.patternName}</h4>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {script.platform.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {script.instrument} • {script.timeframe} • 1:{script.rrTarget} R:R
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(script.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleLoadScript(script)}
                              >
                                Load
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteScript(script.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Platform Import Guide */}
      <div className="mt-8">
        <PlatformImportGuide />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          <strong>Disclaimer:</strong> Scripts are for educational purposes only and do not constitute financial advice. 
          Trading involves risk. Always test thoroughly in demo accounts before live trading.
        </p>
      </div>
    </div>
  );
};

export default MemberScripts;
