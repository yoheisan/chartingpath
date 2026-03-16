import { useState, useEffect, useMemo } from "react";
import { trackEvent } from '@/lib/analytics';
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
  ChevronDown, ChevronUp, ScanSearch, Shield, Search
} from "lucide-react";
import { EdgeInsightsPanel, useEdgeData } from "@/components/scripts/EdgeInsightsPanel";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canDownload } = useUserProfile();
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthGate("script generation");
  
  // URL params from Pattern Lab / Screener / Active Patterns
  const patternParam = searchParams.get('pattern');
  const patternsParam = searchParams.get('patterns');
  const platformParam = searchParams.get('platform') as Platform | null;
  const directionParam = searchParams.get('direction'); // 'all' | 'long' | 'short'
  const rrParam = searchParams.get('rr');
  const timeframeParam = searchParams.get('timeframe');
  const instrumentsParam = searchParams.get('instruments');
  const instrumentParam = searchParams.get('instrument'); // single instrument context
  const symbolParam = searchParams.get('symbol'); // ticker for edge insights
  const winnersParam = searchParams.get('winners');
  const losersParam = searchParams.get('losers');
  
  // Determine initial patterns from URL
  const initialPatterns = useMemo(() => {
    if (patternsParam) return patternsParam.split(',').filter(Boolean);
    if (patternParam) return [patternParam];
    return DEFAULT_SCANNER_CONFIG.selectedPatterns;
  }, [patternsParam, patternParam]);
  
  const isFromPatternLab = !!(patternsParam || platformParam || directionParam);
  
  // Scanner config state
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(initialPatterns);
  const [platform, setPlatform] = useState<Platform>(platformParam || 'pine');
  const [scriptType, setScriptType] = useState<ScriptType>('strategy');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'long' | 'short'>(
    (directionParam as 'all' | 'long' | 'short') || 'all'
  );
  const [slMethod, setSLMethod] = useState<ScannerConfig['stopLossMethod']>('atr');
  const [atrMultiplier, setAtrMultiplier] = useState(2.0);
  const [fixedSlPips, setFixedSlPips] = useState(50);
  const [tpMethod, setTPMethod] = useState<ScannerConfig['takeProfitMethod']>('rr_ratio');
  const [rrRatio, setRrRatio] = useState(rrParam ? parseInt(rrParam) : 3);
  const [fixedTpPips, setFixedTpPips] = useState(150);
  const [riskPercent, setRiskPercent] = useState(2.0);
  const [maxBarsInTrade, setMaxBarsInTrade] = useState(100);
  const [qualityFilterADX, setQualityFilterADX] = useState(true);
  const [adxThreshold, setAdxThreshold] = useState(20);
  const [qualityFilterVolume, setQualityFilterVolume] = useState(true);
  const [qualityFilterTrend, setQualityFilterTrend] = useState(true);
  
  // Pattern Lab context
  const [repeatableWinners] = useState<string[]>(winnersParam ? winnersParam.split(',') : []);
  const [repeatableLosers] = useState<string[]>(losersParam ? losersParam.split(',') : []);
  const [labInstruments] = useState<string[]>(instrumentsParam ? instrumentsParam.split(',') : []);
  const [labTimeframe] = useState<string>(timeframeParam || '');
  
  // UI state
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [scriptsView, setScriptsView] = useState<'grid' | 'list'>('grid');
  const [patternsOpen, setPatternsOpen] = useState(!isFromPatternLab); // Collapse if pre-filled
  const [riskOpen, setRiskOpen] = useState(false);
  
  // Ticker for edge insights
  const [edgeTicker, setEdgeTicker] = useState(instrumentParam || symbolParam || '');
  const edgeData = useEdgeData(edgeTicker || null);
  
  const handleSelectWinners = (patternIds: string[]) => {
    setSelectedPatterns(patternIds);
    toast({ title: 'Winners Selected', description: `${patternIds.length} patterns with positive edge selected` });
  };
  const handleDeselectLosers = (loserIds: string[]) => {
    setSelectedPatterns(prev => prev.filter(p => !loserIds.includes(p)));
    toast({ title: 'Losers Removed', description: `${loserIds.length} patterns with negative edge deselected` });
  };
  
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
    qualityFilterADX,
    adxThreshold,
    qualityFilterVolume,
    qualityFilterTrend,
    directionFilter,
    repeatableWinners: repeatableWinners.length > 0 ? repeatableWinners : undefined,
    repeatableLosers: repeatableLosers.length > 0 ? repeatableLosers : undefined,
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
    trackEvent('script.generate', {
      platform,
      patterns: selectedPatterns.join(','),
      patterns_count: selectedPatterns.length,
      instruments: labInstruments.join(','),
      direction: directionFilter,
    });
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
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Back Navigation */}
      <div className="mb-6">
         <Link to={isFromPatternLab ? "/projects/pattern-lab/new" : "/"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
           <ArrowLeft className="h-4 w-4" />
           {isFromPatternLab ? t('scripts.backToPatternLab') : t('common.backToHome')}
        </Link>
      </div>

      {/* Instrument Context Banner */}
      {(instrumentParam || (patternParam && !isFromPatternLab)) && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-3">
          <ScanSearch className="h-5 w-5 text-primary shrink-0" />
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-muted-foreground">{t('memberScripts.generatingFor', 'Generating scripts for')}</span>
            {instrumentParam && (
              <Badge variant="secondary" className="font-mono font-semibold text-sm">{instrumentParam.replace(/=X$|=F$/, '')}</Badge>
            )}
            {patternParam && (
              <Badge variant="outline" className="text-xs capitalize">{patternParam.replace(/-/g, ' ')}</Badge>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ScanSearch className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">{t('scripts.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {t('scripts.subtitle')}
        </p>
      </div>

      {/* Pattern Lab Context Banner */}
      {isFromPatternLab ? (
        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FlaskConical className="h-5 w-5 text-primary" />
                </div>
                <div>
                   <h3 className="font-semibold">{t('scripts.importedFromLab')}</h3>
                   <p className="text-sm text-muted-foreground">
                     {t('scripts.importedFromLabDesc')}
                   </p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="outline" className="text-xs">
                   {t('scripts.platform')}: {platform === 'pine' ? 'TradingView' : platform === 'mql4' ? 'MT4' : 'MT5'}
                 </Badge>
                 <Badge variant="outline" className="text-xs">
                   {t('scripts.direction')}: {directionFilter === 'all' ? t('scripts.both') : directionFilter === 'long' ? t('scripts.long') : t('scripts.short')}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono">
                  R:R 1:{rrRatio}
                </Badge>
                {labTimeframe && (
                  <Badge variant="outline" className="text-xs">
                    TF: {labTimeframe}
                  </Badge>
                )}
                {labInstruments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {labInstruments.length <= 2
                      ? labInstruments.join(' · ')
                      : `${labInstruments.slice(0, 2).join(' · ')} +${labInstruments.length - 2} more`}
                  </Badge>
                )}
                {repeatableWinners.length > 0 && (
                  <Badge variant="secondary" className="text-xs text-emerald-500 border-emerald-500/30">
                    {t('scripts.repeatableWinners', { count: repeatableWinners.length })}
                  </Badge>
                )}
                {repeatableLosers.length > 0 && (
                  <Badge variant="secondary" className="text-xs text-destructive border-destructive/30">
                    {t('scripts.excludedLosers', { count: repeatableLosers.length })}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FlaskConical className="h-5 w-5 text-primary" />
                </div>
                <div>
                   <h3 className="font-semibold">{t('scripts.validateWithLab')}</h3>
                   <p className="text-sm text-muted-foreground">
                     {t('scripts.validateWithLabDesc')}
                   </p>
                 </div>
              </div>
               <Button onClick={() => navigate('/projects/pattern-lab')} className="gap-2">
                 <FlaskConical className="h-4 w-4" />
                 {t('scripts.openPatternLab')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
           <TabsTrigger value="generate" className="gap-2">
             <Zap className="h-4 w-4" />
             {t('scripts.generateScanner')}
          </TabsTrigger>
           <TabsTrigger value="my-scripts" className="gap-2">
             <FileCode className="h-4 w-4" />
             {t('scripts.myScripts')}
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
              {/* Ticker Input for Edge Insights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Instrument Edge
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enter a ticker to see which patterns work best
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. AAPL, EURUSD, BTC"
                      value={edgeTicker}
                      onChange={(e) => setEdgeTicker(e.target.value.toUpperCase())}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Edge Insights Panel */}
              {edgeTicker && (
                <EdgeInsightsPanel
                  symbol={edgeTicker}
                  onSelectWinners={handleSelectWinners}
                  onDeselectLosers={handleDeselectLosers}
                />
              )}

              {/* Pattern Selection */}
              <Collapsible open={patternsOpen} onOpenChange={setPatternsOpen}>
                <Card className={patternsOpen ? '' : 'border-primary/40'}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                           <CardTitle className="text-base flex items-center gap-2">
                             <ScanSearch className="h-4 w-4" />
                             {t('scripts.patternSelection')}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {t('scripts.patternsSelected', { count: selectedPatterns.length, total: SCANNER_PATTERNS.length })}
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
                           {t('scripts.selectAll')}
                         </Button>
                         <Button variant="outline" size="sm" className="h-7 text-xs" onClick={selectNone}>
                           {t('scripts.clear')}
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
                              {t(`scripts.categories.${cat.label}`)}
                            </button>
                            <div className="space-y-1.5 ml-1">
                              {cat.patterns.map(p => (
                                <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2">
                                  <Checkbox
                                    checked={selectedPatterns.includes(p.id)}
                                    onCheckedChange={() => togglePattern(p.id)}
                                    className="h-3.5 w-3.5"
                                  />
                                  <span className="text-sm flex-1">{t(`patternNames.${p.name}`, p.name)}</span>
                                  {/* Edge badge */}
                                  {edgeTicker && (() => {
                                    const edge = edgeData.get(p.id);
                                    if (!edge || !edge.sufficient) return <Badge variant="outline" className="text-[10px] px-1.5 text-muted-foreground border-muted">No data</Badge>;
                                    return (
                                      <Badge variant="outline" className={`text-[10px] px-1.5 ${edge.hasEdge ? 'text-emerald-600 border-emerald-500/30' : 'text-destructive border-destructive/30'}`}>
                                        {edge.win_rate_pct}% WR
                                      </Badge>
                                    );
                                  })()}
                                  <Badge variant="outline" className={`text-[10px] px-1.5 ${
                                    p.direction === 'long' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'
                                  }`}>
                                    {p.direction === 'long' ? t('scripts.long') : t('scripts.short')}
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
                            {t('scripts.riskExitRules')}
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
                        <Label className="text-sm font-medium">{t('scripts.stopLossMethod')}</Label>
                        <Select value={slMethod} onValueChange={(v) => setSLMethod(v as ScannerConfig['stopLossMethod'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="atr">{t('scripts.atrBased')}</SelectItem>
                             <SelectItem value="pattern">{t('scripts.patternStructure')}</SelectItem>
                             <SelectItem value="fixed_pips">{t('scripts.fixedPips')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {slMethod === 'atr' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{t('scripts.atrMultiplier')}</span>
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
                        <Label className="text-sm font-medium">{t('scripts.takeProfitMethod')}</Label>
                        <Select value={tpMethod} onValueChange={(v) => setTPMethod(v as ScannerConfig['takeProfitMethod'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="rr_ratio">{t('scripts.rrRatio')}</SelectItem>
                             <SelectItem value="pattern">{t('scripts.patternMeasuredMove')}</SelectItem>
                             <SelectItem value="fixed_pips">{t('scripts.fixedPips')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {tpMethod === 'rr_ratio' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{t('scripts.rrRatio')}</span>
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
                          <Label className="text-sm font-medium">{t('scripts.riskPerTrade')}</Label>
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
                        <Label className="text-sm font-medium">{t('scripts.timeStopBars')}</Label>
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

              {/* Quality Filters */}
              <Collapsible defaultOpen={true}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {t('scripts.signalQualityFilters')}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {[qualityFilterADX && `ADX>${adxThreshold}`, qualityFilterVolume && 'Volume', qualityFilterTrend && '200 EMA'].filter(Boolean).join(' · ') || 'None active'}
                        </CardDescription>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                       <p className="text-xs text-muted-foreground">
                         {t('scripts.qualityGradeNote')}
                      </p>

                      {/* ADX Filter */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="filter-adx"
                          checked={qualityFilterADX}
                          onCheckedChange={(v) => setQualityFilterADX(!!v)}
                        />
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="filter-adx" className="text-sm font-medium cursor-pointer">
                            {t('scripts.adxTrendStrength')}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t('scripts.adxTrendDesc')}
                          </p>
                          {qualityFilterADX && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs text-muted-foreground">{t('scripts.minAdx')}:</span>
                              <Slider
                                value={[adxThreshold]}
                                onValueChange={([v]) => setAdxThreshold(v)}
                                min={10} max={50} step={5}
                                className="flex-1"
                              />
                              <span className="text-xs font-mono w-6 text-right">{adxThreshold}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Volume Filter */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="filter-volume"
                          checked={qualityFilterVolume}
                          onCheckedChange={(v) => setQualityFilterVolume(!!v)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="filter-volume" className="text-sm font-medium cursor-pointer">
                            {t('scripts.volumeConfirmation')}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t('scripts.volumeConfirmDesc')}
                          </p>
                        </div>
                      </div>

                      {/* Trend Alignment Filter */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="filter-trend"
                          checked={qualityFilterTrend}
                          onCheckedChange={(v) => setQualityFilterTrend(!!v)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="filter-trend" className="text-sm font-medium cursor-pointer">
                            {t('scripts.emaAlignment')}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t('scripts.emaAlignDesc')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Platform & Generate */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('scripts.platform')}</Label>
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
                      <Label className="text-sm font-medium">{t('scripts.scriptType')}</Label>
                      <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="strategy">{t('scripts.strategyBacktestable')}</SelectItem>
                           <SelectItem value="indicator">{t('scripts.indicatorAlertsOnly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Direction Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('scripts.direction')}</Label>
                    <div className="flex rounded-lg border border-border/50 overflow-hidden">
                      {(['all', 'long', 'short'] as const).map(dir => (
                        <Button
                          key={dir}
                          variant={directionFilter === dir ? 'secondary' : 'ghost'}
                          size="sm"
                          className="rounded-none h-8 px-3 flex-1"
                          onClick={() => setDirectionFilter(dir)}
                        >
                          {dir === 'all' ? t('scripts.both') : dir === 'long' ? `↑ ${t('scripts.long')}` : `↓ ${t('scripts.short')}`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1">
                     <p className="font-medium text-foreground">{t('scripts.scannerContract')}</p>
                     <p>• {t('scripts.scannerContractP1')}</p>
                     <p>• {t('scripts.scannerContractP2')}</p>
                     <p>• {t('scripts.scannerContractP3')}</p>
                     <p>• {t('scripts.scannerContractP4', { bars: maxBarsInTrade })}</p>
                  </div>

                  <Button onClick={() => requireAuth(handleGenerate)} className="w-full gap-2" size="lg">
                    <ScanSearch className="h-4 w-4" />
                    {t('scripts.generateScannerScript')}
                  </Button>
                   <Button onClick={handleGenerateDiagnostic} variant="outline" className="w-full gap-2" size="sm">
                     {t('scripts.generateDiagnostic')}
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
                      {t('scripts.generatedScanner')}
                    </CardTitle>
                    <CardDescription>
                      {generatedCode 
                        ? `${selectedPatterns.length} pattern${selectedPatterns.length > 1 ? 's' : ''} • ${PLATFORMS.find(p => p.value === platform)?.label}`
                        : t('scripts.selectAndConfigure')
                      }
                    </CardDescription>
                  </div>
                  {generatedCode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveScript}>
                        <Save className="h-4 w-4 mr-1" /> {t('scripts.save')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? t('scripts.copied') : t('scripts.copy')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload} disabled={!canDownload()}>
                        <Download className="h-4 w-4 mr-1" /> {t('scripts.download')}
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
                         <p className="text-muted-foreground font-medium">{t('scripts.patternScannerGenerator')}</p>
                         <p className="text-sm text-muted-foreground mt-1">
                           {t('scripts.patternScannerGeneratorDesc')}
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
                     <h3 className="text-lg font-semibold">{t('scripts.noSavedScripts')}</h3>
                     <p className="text-muted-foreground">
                       {t('scripts.noSavedScriptsDesc')}
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab("generate")} variant="outline">
                    {t('scripts.generateFirstScanner')}
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
                             {t('scripts.load')}
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
                              <Button size="sm" variant="outline" onClick={() => handleLoadScript(script)}>{t('scripts.load')}</Button>
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
           <strong>{t('common.disclaimer')}</strong> {t('scripts.disclaimer')}
         </p>
       </div>
    </div>
  );
};

export default MemberScripts;
