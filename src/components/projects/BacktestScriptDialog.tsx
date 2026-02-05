import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, Download, Check, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  generatePineScriptV5,
  generateMQL4,
  generateMQL5,
  getScriptFileExtension,
  type PatternExportData,
  type ScriptType,
} from '@/utils/exports/PatternScriptExporter';

interface PatternInfo {
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
}

interface TradeInfo {
  instrument: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  atrValue?: number;
}

interface BacktestScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruments: string[];
  patterns: PatternInfo[];
  timeframe: string;
  trades: TradeInfo[];
  rrTarget: number;
  optimalExitStrategy?: string;
}

type Platform = 'pine' | 'mql4' | 'mql5';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'pine', label: 'TradingView (Pine Script v5)' },
  { value: 'mql4', label: 'MetaTrader 4 (MQL4)' },
  { value: 'mql5', label: 'MetaTrader 5 (MQL5)' },
];

export function BacktestScriptDialog({
  open,
  onOpenChange,
  instruments,
  patterns,
  timeframe,
  trades,
  rrTarget,
  optimalExitStrategy,
}: BacktestScriptDialogProps) {
  const { toast } = useToast();
  const { canDownload } = useUserProfile();
  const [platform, setPlatform] = useState<Platform>('pine');
  const [scriptType, setScriptType] = useState<ScriptType>('strategy');
  const [selectedPattern, setSelectedPattern] = useState<string>(patterns[0]?.patternId || '');
  const [selectedInstrument, setSelectedInstrument] = useState<string>(instruments[0] || '');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Get the best trade data for the selected pattern/instrument combo
  const getExportData = useMemo((): PatternExportData | null => {
    const pattern = patterns.find(p => p.patternId === selectedPattern);
    if (!pattern) return null;

    // Find a trade matching the pattern and instrument
    const trade = trades.find(
      t => t.instrument === selectedInstrument
    );

    // Use defaults if no matching trade
    const baseEntry = trade?.entryPrice || 100;
    const baseSL = trade?.stopLossPrice || (pattern.direction === 'long' ? baseEntry * 0.98 : baseEntry * 1.02);
    const baseTP = trade?.takeProfitPrice || (pattern.direction === 'long' ? baseEntry * 1.04 : baseEntry * 0.96);
    const atr = trade?.atrValue || Math.abs(baseEntry - baseSL) / 2;

    return {
      patternName: pattern.patternName,
      patternId: pattern.patternId,
      instrument: selectedInstrument,
      timeframe,
      direction: pattern.direction,
      entryPrice: baseEntry,
      stopLossPrice: baseSL,
      takeProfitPrice: baseTP,
      riskRewardRatio: rrTarget,
      atrValue: atr,
      detectedAt: new Date().toISOString(),
      qualityScore: 'A',
    };
  }, [selectedPattern, selectedInstrument, patterns, trades, timeframe, rrTarget]);

  const handleGenerate = () => {
    if (!getExportData) {
      toast({
        title: 'Selection Required',
        description: 'Please select a pattern and instrument.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    
    try {
      let code = '';
      switch (platform) {
        case 'pine':
          code = generatePineScriptV5(getExportData, scriptType);
          break;
        case 'mql4':
          code = generateMQL4(getExportData);
          break;
        case 'mql5':
          code = generateMQL5(getExportData);
          break;
      }
      setGeneratedCode(code);
      
      toast({
        title: 'Script Generated',
        description: `${getExportData.patternName} script ready for ${PLATFORMS.find(p => p.value === platform)?.label}`,
      });
    } catch (error) {
      console.error('Script generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate script. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Script copied to clipboard',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!canDownload()) {
      toast({
        title: 'Download Restricted',
        description: 'File download is available for Pro+ subscribers only. You can copy the code.',
        variant: 'destructive',
      });
      return;
    }

    if (!generatedCode || !getExportData) return;

    const ext = getScriptFileExtension(platform);
    const filename = `${getExportData.patternName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedInstrument}${ext}`;
    
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `${filename} saved`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Generate Trading Script
          </DialogTitle>
          <DialogDescription>
            Export your validated pattern as executable code for your trading platform
            {optimalExitStrategy && (
              <span className="block mt-1 text-primary">
                Optimal exit strategy: {optimalExitStrategy}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="code" disabled={!generatedCode}>
              Code {generatedCode && <Check className="h-3 w-3 ml-1 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4 py-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Trading Platform</Label>
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
                <Label>Script Type</Label>
                <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategy">Strategy (with backtesting)</SelectItem>
                    <SelectItem value="indicator">Indicator (visual only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pattern Selection */}
            <div className="space-y-2">
              <Label>Pattern</Label>
              <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern..." />
                </SelectTrigger>
                <SelectContent>
                  {patterns.map(p => (
                    <SelectItem key={p.patternId} value={p.patternId}>
                      <span className="flex items-center gap-2">
                        {p.patternName}
                        <Badge variant="outline" className={p.direction === 'long' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}>
                          {p.direction}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instrument Selection */}
            <div className="space-y-2">
              <Label>Instrument</Label>
              <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument..." />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map(inst => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* R:R Target Display */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Label className="text-muted-foreground">R:R Target:</Label>
              <Badge variant="secondary" className="font-mono">1:{rrTarget}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                from your backtest configuration
              </span>
            </div>

            {/* Execution Notes */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-sm">
              <p className="font-medium text-primary mb-1">Execution Contract</p>
              <ul className="text-muted-foreground text-xs space-y-1">
                <li>• Entry at current market price (not detection price)</li>
                <li>• SL/TP recalculated to maintain {rrTarget}:1 R:R ratio</li>
                <li>• Warning shown if original SL was breached</li>
                <li>• 100-bar time stop to match backtest assumptions</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedPattern || !selectedInstrument}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="code" className="py-4">
            {generatedCode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{PLATFORMS.find(p => p.value === platform)?.label}</Badge>
                    <Badge variant="secondary">{selectedInstrument}</Badge>
                  </div>
                  <div className="flex gap-2">
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
                </div>
                
                <Textarea
                  value={generatedCode}
                  readOnly
                  className="font-mono text-xs min-h-[300px] bg-muted/30"
                />
                
                <p className="text-xs text-muted-foreground text-center">
                  Copy this code and paste it into your {platform === 'pine' ? 'TradingView Pine Editor' : platform === 'mql4' ? 'MetaEditor 4' : 'MetaEditor 5'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Scripts use the Repeatable Execution Contract for consistency
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BacktestScriptDialog;
