import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Copy, Check, AlertTriangle, FileCode, Info, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ChartingPathStrategy } from '@/components/ChartingPathStrategyBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/hooks/useAuthGate';
import { AuthGateDialog } from '@/components/auth/AuthGateDialog';
import { 
  chartingPathToPlaybook, 
  PlaybookAST, 
  VALID_TIMEFRAMES,
  assertNoMTF 
} from '@/types/PlaybookAST';
import { 
  generatePineScriptV6, 
  generateMT4EA, 
  generateMT5EA,
  generatePlaybookReadme,
  lintPineForMTF,
  lintMQLForMTF
} from '@/utils/PlaybookExportUtils';

interface ExportPanelProps {
  strategy: ChartingPathStrategy;
}

type ExportFormat = 'pine' | 'mt4' | 'mt5';

export const ExportPanel: React.FC<ExportPanelProps> = ({ strategy }) => {
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);
  const [generating, setGenerating] = useState<ExportFormat | null>(null);

  // Validate strategy has required timeframe
  const validationResult = useMemo(() => {
    const timeframes = strategy.market?.timeframes || [];
    
    if (timeframes.length === 0) {
      return { 
        valid: false, 
        error: 'No timeframe selected. Select exactly one timeframe in Market Setup.',
        timeframe: null 
      };
    }
    
    if (timeframes.length > 1) {
      return { 
        valid: false, 
        error: `Multiple timeframes selected (${timeframes.join(', ')}). Playbooks support exactly one timeframe for executable parity.`,
        timeframe: null 
      };
    }

    const tf = timeframes[0];
    if (!VALID_TIMEFRAMES.includes(tf as any)) {
      return { 
        valid: false, 
        error: `Invalid timeframe "${tf}". Supported: ${VALID_TIMEFRAMES.join(', ')}`,
        timeframe: null 
      };
    }

    return { valid: true, error: null, timeframe: tf };
  }, [strategy.market?.timeframes]);

  // Convert to PlaybookAST
  const playbook = useMemo((): PlaybookAST | null => {
    if (!validationResult.valid || !validationResult.timeframe) return null;
    
    try {
      return chartingPathToPlaybook(strategy, validationResult.timeframe);
    } catch (err) {
      console.error('Failed to convert strategy to PlaybookAST:', err);
      return null;
    }
  }, [strategy, validationResult]);

  // Pre-validate PlaybookAST for MTF violations
  const mtfCheck = useMemo(() => {
    if (!playbook) return { valid: true, errors: [] };
    
    try {
      assertNoMTF(playbook);
      return { valid: true, errors: [] };
    } catch (err: any) {
      return { valid: false, errors: [err.message] };
    }
  }, [playbook]);

  const generateAndDownload = async (format: ExportFormat) => {
    if (!playbook) {
      toast({
        title: "Export Failed",
        description: "Strategy could not be converted. Check timeframe selection.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(format);

    try {
      let code: string;
      let filename: string;
      let lintErrors: string[] = [];

      switch (format) {
        case 'pine':
          code = generatePineScriptV6(playbook);
          filename = `${playbook.name.replace(/\s+/g, '_')}_strategy.pine`;
          const pineLint = lintPineForMTF(code);
          if (!pineLint.valid) lintErrors = pineLint.violations;
          break;
        case 'mt4':
          code = generateMT4EA(playbook);
          filename = `${playbook.name.replace(/\s+/g, '_')}_EA.mq4`;
          const mt4Lint = lintMQLForMTF(code);
          if (!mt4Lint.valid) lintErrors = mt4Lint.violations;
          break;
        case 'mt5':
          code = generateMT5EA(playbook);
          filename = `${playbook.name.replace(/\s+/g, '_')}_EA.mq5`;
          const mt5Lint = lintMQLForMTF(code);
          if (!mt5Lint.valid) lintErrors = mt5Lint.violations;
          break;
      }

      // Fail if MTF constructs detected
      if (lintErrors.length > 0) {
        toast({
          title: "Export Blocked",
          description: `MTF constructs detected: ${lintErrors.join(', ')}. Single-timeframe only in v1.`,
          variant: "destructive"
        });
        return;
      }

      // Download file
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filename}`,
      });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({
        title: "Export Failed",
        description: err.message || "Unknown error during export",
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = async (format: ExportFormat) => {
    if (!playbook) return;

    try {
      let code: string;
      switch (format) {
        case 'pine':
          code = generatePineScriptV6(playbook);
          break;
        case 'mt4':
          code = generateMT4EA(playbook);
          break;
        case 'mt5':
          code = generateMT5EA(playbook);
          break;
      }

      await navigator.clipboard.writeText(code);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);

      toast({
        title: "Copied to Clipboard",
        description: `${format.toUpperCase()} code copied`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadReadme = (exportType: ExportFormat = 'pine') => {
    if (!playbook) return;

    const readme = generatePlaybookReadme(playbook, exportType);
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playbook.name.replace(/\s+/g, '_')}_README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render validation error state
  if (!validationResult.valid) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cannot Export:</strong> {validationResult.error}
          </AlertDescription>
        </Alert>
        
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Single-Timeframe Playbooks (v1)</p>
                <p>
                  Playbooks execute on exactly one timeframe to ensure backtest ↔ export parity. 
                  Multi-timeframe support is planned for v2.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render MTF violation error
  if (!mtfCheck.valid) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>MTF Violation:</strong> {mtfCheck.errors.join('; ')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          Timeframe: {validationResult.timeframe}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Fill Model: Next-Bar Open
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Single-TF v1
        </Badge>
      </div>

      {/* Pine Script Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                TradingView Pine Script v6
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Strategy script with bar-close evaluation
              </CardDescription>
            </div>
            <Badge>Recommended</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={() => generateAndDownload('pine')}
              disabled={generating === 'pine'}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating === 'pine' ? 'Generating...' : 'Download .pine'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard('pine')}
            >
              {copiedFormat === 'pine' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MT4 Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            MetaTrader 4 Expert Advisor
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            EA with new-bar detection and risk guardrails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={() => generateAndDownload('mt4')}
              disabled={generating === 'mt4'}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating === 'mt4' ? 'Generating...' : 'Download .mq4'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard('mt4')}
            >
              {copiedFormat === 'mt4' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MT5 Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            MetaTrader 5 Expert Advisor
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            EA with position management and max drawdown kill switch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={() => generateAndDownload('mt5')}
              disabled={generating === 'mt5'}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating === 'mt5' ? 'Generating...' : 'Download .mq5'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard('mt5')}
            >
              {copiedFormat === 'mt5' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">Export Documentation</p>
              <p className="text-muted-foreground text-xs">README with parity notes and usage</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => downloadReadme('pine')}>
              <Download className="w-4 h-4 mr-1" />
              README.md
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parity Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Execution Parity:</strong> All exports use bar-close signal evaluation with next-bar-open fills. 
          Ensure your chart/broker timeframe matches <strong>{validationResult.timeframe}</strong>.
        </AlertDescription>
      </Alert>
    </div>
  );
};
