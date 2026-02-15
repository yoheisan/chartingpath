import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Download, Code, ArrowLeft, Lock, ArrowRight, Copy, Check,
  FileCode, FlaskConical, Zap, Trash2, Clock, Save, LayoutGrid, List,
  ChevronDown, ChevronUp, ScanSearch
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuthGate } from "@/hooks/useAuthGate";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { useToast } from "@/hooks/use-toast";
import { PlatformImportGuide } from "@/components/scripts/PlatformImportGuide";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  generateScannerScript,
  generateDiagnosticPineScript,
  SCANNER_PATTERNS,
  DEFAULT_SCANNER_CONFIG,
  type ScannerConfig,
} from "@/utils/exports/PatternScannerGenerator";
import {
  getScriptFileExtension,
  type ScriptType,
} from "@/utils/exports/PatternScriptExporter";

type Platform = 'pine' | 'mql4' | 'mql5';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'pine', label: 'TradingView (Pine Script v5)' },
  { value: 'mql4', label: 'MetaTrader 4 (MQL4)' },
  { value: 'mql5', label: 'MetaTrader 5 (MQL5)' },
];

interface SavedScript {
  id: string;
  name: string;
  patternNames: string;
  platform: Platform;
  config: ScannerConfig;
  code: string;
  createdAt: string;
}

const STORAGE_KEY = 'chartingpath_saved_scanner_scripts';

// Group patterns by category
const PATTERN_CATEGORIES = [
  { label: 'Reversal', patterns: SCANNER_PATTERNS.filter(p => p.category === 'Reversal') },
  { label: 'Continuation', patterns: SCANNER_PATTERNS.filter(p => p.category === 'Continuation') },
  { label: 'Triangle', patterns: SCANNER_PATTERNS.filter(p => p.category === 'Triangle') },
  { label: 'Bilateral', patterns: SCANNER_PATTERNS.filter(p => p.category === 'Bilateral') },
  { label: 'Breakout', patterns: SCANNER_PATTERNS.filter(p => p.category === 'Breakout') },
];

const MemberScripts = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canDownload } = useUserProfile();
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthGate("script generation");
  
  // URL params from Pattern Lab / Screener
  const patternParam = searchParams.get('pattern');
  
  // Scanner config state
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(
    patternParam ? [patternParam] : DEFAULT_SCANNER_CONFIG.selectedPatterns
  );
  const [platform, setPlatform] = useState<Platform>('pine');
  const [scriptType, setScriptType] = useState<ScriptType>('strategy');
  const [slMethod, setSLMethod] = useState<ScannerConfig['stopLossMethod']>('atr');
  const [atrMultiplier, setAtrMultiplier] = useState(2.0);
  const [fixedSlPips, setFixedSlPips] = useState(50);
  const [tpMethod, setTPMethod] = useState<ScannerConfig['takeProfitMethod']>('rr_ratio');
  const [rrRatio, setRrRatio] = useState(3);
  const [fixedTpPips, setFixedTpPips] = useState(150);
  const [riskPercent, setRiskPercent] = useState(2.0);
  const [maxBarsInTrade, setMaxBarsInTrade] = useState(100);
  
  // UI state
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [scriptsView, setScriptsView] = useState<'grid' | 'list'>('grid');
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [riskOpen, setRiskOpen] = useState(false);
  
  // Load saved scripts
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSavedScripts(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const togglePattern = (id: string) => {
    setSelectedPatterns(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedPatterns(SCANNER_PATTERNS.map(p => p.id));
  const selectNone = () => setSelectedPatterns([]);
  const selectCategory = (category: string) => {
    const ids = SCANNER_PATTERNS.filter(p => p.category === category).map(p => p.id);
    const allSelected = ids.every(id => selectedPatterns.includes(id));
    if (allSelected) {
      setSelectedPatterns(prev => prev.filter(p => !ids.includes(p)));
    } else {
      setSelectedPatterns(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const buildConfig = (): ScannerConfig => ({
    selectedPatterns,
    stopLossMethod: slMethod,
    atrMultiplier,
    fixedPips: fixedSlPips,
    takeProfitMethod: tpMethod,
    rrRatio,
    tpFixedPips: fixedTpPips,
    riskPercent,
    maxBarsInTrade,
    platform,
    scriptType,
    qualityFilterADX: true,
    adxThreshold: 20,
    qualityFilterVolume: true,
    qualityFilterTrend: true,
  });

  const handleGenerateDiagnostic = () => {
    const code = generateDiagnosticPineScript();
    setGeneratedCode(code);
    toast({
      title: 'Diagnostic Script Generated',
      description: 'Bare-minimum SMA crossover — paste into TradingView to verify Strategy Report loads.',
    });
  };

  const handleGenerate = () => {
    if (selectedPatterns.length === 0) {
      toast({ title: 'No Patterns Selected', description: 'Select at least one pattern to scan for.', variant: 'destructive' });
      return;
    }
    const config = buildConfig();
    const code = generateScannerScript(config);
    setGeneratedCode(code);
    toast({
      title: 'Scanner Script Generated',
      description: `${selectedPatterns.length} pattern${selectedPatterns.length > 1 ? 's' : ''} • ${PLATFORMS.find(p => p.value === platform)?.label}`,
    });
  };

  const handleSaveScript = () => {
    if (!generatedCode) return;
    const config = buildConfig();
    const names = SCANNER_PATTERNS.filter(p => selectedPatterns.includes(p.id)).map(p => p.name);
    const newScript: SavedScript = {
      id: crypto.randomUUID(),
      name: `Scanner - ${names.length <= 3 ? names.join(', ') : `${names.length} patterns`}`,
      patternNames: names.join(', '),
      platform,
      config,
      code: generatedCode,
      createdAt: new Date().toISOString(),
    };
    const updated = [newScript, ...savedScripts];
    setSavedScripts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast({ title: 'Script Saved' });
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
    if (script.config) {
      setSelectedPatterns(script.config.selectedPatterns);
      setSLMethod(script.config.stopLossMethod);
      setAtrMultiplier(script.config.atrMultiplier);
      setTPMethod(script.config.takeProfitMethod);
      setRrRatio(script.config.rrRatio);
      setRiskPercent(script.config.riskPercent);
      setMaxBarsInTrade(script.config.maxBarsInTrade);
    }
    setActiveTab("generate");
    toast({ title: 'Script Loaded', description: script.name });
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied' });
    } catch {
      toast({ title: 'Copy Failed', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (!canDownload()) {
      toast({ title: 'Download Restricted', description: 'File download requires Pro+. You can copy the code instead.', variant: 'destructive' });
      return;
    }
    if (!generatedCode) return;
    const ext = getScriptFileExtension(platform);
    const filename = `Pattern_Scanner_${selectedPatterns.length}p${ext}`;
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: filename });
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
          <div className="p-3 rounded-xl bg-primary/10">
            <ScanSearch className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Pattern Scanner Scripts</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate scripts that automatically detect chart patterns and execute trades with your custom SL/TP rules
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
                <h3 className="font-semibold">Validate with Pattern Lab</h3>
                <p className="text-sm text-muted-foreground">
                  Backtest pattern performance before deploying scanner scripts
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
            Generate Scanner
          </TabsTrigger>
          <TabsTrigger value="my-scripts" className="gap-2">
            <FileCode className="h-4 w-4" />
            My Scripts
            {savedScripts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{savedScripts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Pattern Selection */}
              <Collapsible open={patternsOpen} onOpenChange={setPatternsOpen}>
                <Card className={patternsOpen ? '' : 'border-primary/40'}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ScanSearch className="h-4 w-4" />
                            Pattern Selection
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {selectedPatterns.length} of {SCANNER_PATTERNS.length} patterns selected
                          </CardDescription>
                        </div>
                        {patternsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Quick actions */}
                      <div className="flex gap-2 text-xs">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={selectAll}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={selectNone}>
                          Clear
                        </Button>
                      </div>
                      
                      {PATTERN_CATEGORIES.map(cat => {
                        const catIds = cat.patterns.map(p => p.id);
                        const allCatSelected = catIds.every(id => selectedPatterns.includes(id));
                        return (
                          <div key={cat.label} className="space-y-2">
                            <button 
                              onClick={() => selectCategory(cat.label)}
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider flex items-center gap-2"
                            >
                              <Checkbox checked={allCatSelected} className="h-3 w-3" />
                              {cat.label}
                            </button>
                            <div className="space-y-1.5 ml-1">
                              {cat.patterns.map(p => (
                                <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2">
                                  <Checkbox
                                    checked={selectedPatterns.includes(p.id)}
                                    onCheckedChange={() => togglePattern(p.id)}
                                    className="h-3.5 w-3.5"
                                  />
                                  <span className="text-sm flex-1">{p.name}</span>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 ${
                                    p.direction === 'long' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'
                                  }`}>
                                    {p.direction}
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Risk & SL/TP Configuration */}
              <Collapsible open={riskOpen} onOpenChange={setRiskOpen}>
                <Card className={riskOpen ? '' : 'border-primary/40'}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Risk & Exit Rules
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            SL: {slMethod === 'atr' ? `ATR ×${atrMultiplier}` : slMethod === 'fixed_pips' ? `${fixedSlPips} pips` : 'Pattern'} • 
                            TP: {tpMethod === 'rr_ratio' ? `1:${rrRatio} R:R` : tpMethod === 'fixed_pips' ? `${fixedTpPips} pips` : 'Pattern'} • 
                            Risk: {riskPercent}%
                          </CardDescription>
                        </div>
                        {riskOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-5">
                      {/* Stop Loss Method */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Stop Loss Method</Label>
                        <Select value={slMethod} onValueChange={(v) => setSLMethod(v as ScannerConfig['stopLossMethod'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="atr">ATR-Based</SelectItem>
                            <SelectItem value="pattern">Pattern Structure</SelectItem>
                            <SelectItem value="fixed_pips">Fixed Pips</SelectItem>
                          </SelectContent>
                        </Select>
                        {slMethod === 'atr' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>ATR Multiplier</span>
                              <span>{atrMultiplier}×</span>
                            </div>
                            <Slider
                              value={[atrMultiplier]}
                              onValueChange={([v]) => setAtrMultiplier(v)}
                              min={0.5} max={5} step={0.5}
                            />
                          </div>
                        )}
                        {slMethod === 'fixed_pips' && (
                          <Input
                            type="number"
                            value={fixedSlPips}
                            onChange={(e) => setFixedSlPips(Number(e.target.value))}
                            placeholder="SL in pips"
                          />
                        )}
                      </div>

                      {/* Take Profit Method */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Take Profit Method</Label>
                        <Select value={tpMethod} onValueChange={(v) => setTPMethod(v as ScannerConfig['takeProfitMethod'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rr_ratio">R:R Ratio</SelectItem>
                            <SelectItem value="pattern">Pattern Measured Move</SelectItem>
                            <SelectItem value="fixed_pips">Fixed Pips</SelectItem>
                          </SelectContent>
                        </Select>
                        {tpMethod === 'rr_ratio' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>R:R Ratio</span>
                              <span>1:{rrRatio}</span>
                            </div>
                            <Slider
                              value={[rrRatio]}
                              onValueChange={([v]) => setRrRatio(v)}
                              min={1} max={10} step={0.5}
                            />
                          </div>
                        )}
                        {tpMethod === 'fixed_pips' && (
                          <Input
                            type="number"
                            value={fixedTpPips}
                            onChange={(e) => setFixedTpPips(Number(e.target.value))}
                            placeholder="TP in pips"
                          />
                        )}
                      </div>

                      {/* Risk % */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <Label className="text-sm font-medium">Risk Per Trade</Label>
                          <span className="text-muted-foreground">{riskPercent}%</span>
                        </div>
                        <Slider
                          value={[riskPercent]}
                          onValueChange={([v]) => setRiskPercent(v)}
                          min={0.5} max={10} step={0.5}
                        />
                      </div>

                      {/* Max bars */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Time Stop (bars)</Label>
                        <Input
                          type="number"
                          value={maxBarsInTrade}
                          onChange={(e) => setMaxBarsInTrade(Number(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Platform & Generate */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {platform === 'pine' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Script Type</Label>
                      <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strategy">Strategy (backtestable)</SelectItem>
                          <SelectItem value="indicator">Indicator (alerts only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Scanner Contract:</p>
                    <p>• Monitors chart for pattern formations</p>
                    <p>• Entry on confirmed pattern breakout</p>
                    <p>• SL/TP per your configured rules</p>
                    <p>• {maxBarsInTrade}-bar time stop included</p>
                  </div>

                  <Button onClick={() => requireAuth(handleGenerate)} className="w-full gap-2" size="lg">
                    <ScanSearch className="h-4 w-4" />
                    Generate Scanner Script
                  </Button>
                   <Button onClick={handleGenerateDiagnostic} variant="outline" className="w-full gap-2" size="sm">
                     🔧 Generate Diagnostic Script (SMA Cross — tests TV)
                   </Button>
                   <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="script generation" />
                 </CardContent>
               </Card>
             </div>

            {/* Output Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Generated Scanner
                    </CardTitle>
                    <CardDescription>
                      {generatedCode 
                        ? `${selectedPatterns.length} pattern${selectedPatterns.length > 1 ? 's' : ''} • ${PLATFORMS.find(p => p.value === platform)?.label}`
                        : "Select patterns and configure rules to generate"
                      }
                    </CardDescription>
                  </div>
                  {generatedCode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveScript}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload} disabled={!canDownload()}>
                        <Download className="h-4 w-4 mr-1" /> Download
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
                    className="min-h-[600px] font-mono text-sm bg-muted/30"
                  />
                ) : (
                  <div className="min-h-[600px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-muted-foreground/25">
                    <div className="text-center space-y-3">
                      <ScanSearch className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-muted-foreground font-medium">Pattern Scanner Generator</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Select patterns, configure SL/TP rules, and generate a script<br/>
                          that auto-detects and trades chart patterns on your chart
                        </p>
                      </div>
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
                      Generate a scanner script and click "Save" to add it here
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab("generate")} variant="outline">
                    Generate Your First Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button variant={scriptsView === 'grid' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setScriptsView('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button variant={scriptsView === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setScriptsView('list')}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {scriptsView === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {savedScripts.map((script) => (
                    <Card key={script.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{script.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">{script.patternNames}</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">{script.platform.toUpperCase()}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(script.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleLoadScript(script)}>
                            Load
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteScript(script.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {scriptsView === 'list' && (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {savedScripts.map((script) => (
                        <div key={script.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              <FileCode className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{script.name}</h4>
                                <Badge variant="outline" className="text-xs shrink-0">{script.platform.toUpperCase()}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{script.patternNames}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(script.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleLoadScript(script)}>Load</Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteScript(script.id)}>
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
      <div className="mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          <strong>Disclaimer:</strong> Scripts are for educational purposes only and do not constitute financial advice. 
          Trading involves risk. Always test thoroughly in demo accounts before live trading.
        </p>
      </div>
    </div>
  );
};

export default MemberScripts;
