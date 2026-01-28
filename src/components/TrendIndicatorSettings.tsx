import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Settings2, Info, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorConfig {
  // MACD settings
  macd: {
    enabled: boolean;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  // EMA settings
  ema: {
    enabled: boolean;
    shortPeriod: number;
    longPeriod: number;
  };
  // RSI settings
  rsi: {
    enabled: boolean;
    period: number;
    oversoldLevel: number;
    overboughtLevel: number;
  };
  // ADX settings
  adx: {
    enabled: boolean;
    period: number;
    weakThreshold: number;
    strongThreshold: number;
  };
}

const DEFAULT_CONFIG: TrendIndicatorConfig = {
  macd: {
    enabled: true,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  },
  ema: {
    enabled: true,
    shortPeriod: 50,
    longPeriod: 200,
  },
  rsi: {
    enabled: true,
    period: 14,
    oversoldLevel: 30,
    overboughtLevel: 70,
  },
  adx: {
    enabled: true,
    period: 14,
    weakThreshold: 25,
    strongThreshold: 50,
  },
};

const STORAGE_KEY = 'chartingpath-trend-indicator-config';

export function loadTrendConfig(): TrendIndicatorConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load trend config from storage');
  }
  return DEFAULT_CONFIG;
}

export function saveTrendConfig(config: TrendIndicatorConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save trend config to storage');
  }
}

interface TrendIndicatorSettingsProps {
  onConfigChange?: (config: TrendIndicatorConfig) => void;
  trigger?: React.ReactNode;
}

export function TrendIndicatorSettings({ onConfigChange, trigger }: TrendIndicatorSettingsProps) {
  const [config, setConfig] = useState<TrendIndicatorConfig>(() => loadTrendConfig());
  const [open, setOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local config
  const updateConfig = <K extends keyof TrendIndicatorConfig>(
    indicator: K,
    updates: Partial<TrendIndicatorConfig[K]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [indicator]: { ...prev[indicator], ...updates }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveTrendConfig(config);
    onConfigChange?.(config);
    setHasChanges(false);
    setOpen(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  // Count enabled indicators
  const enabledCount = [config.macd.enabled, config.ema.enabled, config.rsi.enabled, config.adx.enabled].filter(Boolean).length;
  const isCustomized = JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Trend Settings
            {isCustomized && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                Custom
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Trend Indicator Settings
          </DialogTitle>
          <DialogDescription>
            Customize the technical indicators used to determine trend alignment. These settings affect how patterns are classified as "With Trend" or "Counter Trend".
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div>
              <p className="text-sm font-medium">{enabledCount} of 4 indicators enabled</p>
              <p className="text-xs text-muted-foreground">At least 2 enabled recommended</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>
          </div>

          <Accordion type="multiple" defaultValue={['macd', 'ema']} className="space-y-2">
            {/* MACD Settings */}
            <AccordionItem value="macd" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.macd.enabled}
                    onCheckedChange={(checked) => updateConfig('macd', { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(!config.macd.enabled && "text-muted-foreground")}>
                    MACD
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">Moving Average Convergence Divergence measures momentum by comparing two EMAs. Bullish when MACD crosses above signal line.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Fast Period</Label>
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      value={config.macd.fastPeriod}
                      onChange={(e) => updateConfig('macd', { fastPeriod: parseInt(e.target.value) || 12 })}
                      disabled={!config.macd.enabled}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Slow Period</Label>
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      value={config.macd.slowPeriod}
                      onChange={(e) => updateConfig('macd', { slowPeriod: parseInt(e.target.value) || 26 })}
                      disabled={!config.macd.enabled}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Signal Period</Label>
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      value={config.macd.signalPeriod}
                      onChange={(e) => updateConfig('macd', { signalPeriod: parseInt(e.target.value) || 9 })}
                      disabled={!config.macd.enabled}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard: Fast 12, Slow 26, Signal 9. Shorter periods = more sensitive.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* EMA Settings */}
            <AccordionItem value="ema" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.ema.enabled}
                    onCheckedChange={(checked) => updateConfig('ema', { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(!config.ema.enabled && "text-muted-foreground")}>
                    EMA Crossover
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">Compares short and long Exponential Moving Averages. Bullish when price {'>'} short EMA {'>'} long EMA.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Short EMA Period</Label>
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      value={config.ema.shortPeriod}
                      onChange={(e) => updateConfig('ema', { shortPeriod: parseInt(e.target.value) || 50 })}
                      disabled={!config.ema.enabled}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Long EMA Period</Label>
                    <Input
                      type="number"
                      min={50}
                      max={500}
                      value={config.ema.longPeriod}
                      onChange={(e) => updateConfig('ema', { longPeriod: parseInt(e.target.value) || 200 })}
                      disabled={!config.ema.enabled}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard: 50/200 (Golden Cross/Death Cross). Common alternatives: 20/50, 10/30.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* RSI Settings */}
            <AccordionItem value="rsi" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.rsi.enabled}
                    onCheckedChange={(checked) => updateConfig('rsi', { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(!config.rsi.enabled && "text-muted-foreground")}>
                    RSI
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">Relative Strength Index measures overbought/oversold conditions. Values 0-100, typically {'<'}30 oversold, {'>'}70 overbought.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Period</Label>
                  <Input
                    type="number"
                    min={2}
                    max={50}
                    value={config.rsi.period}
                    onChange={(e) => updateConfig('rsi', { period: parseInt(e.target.value) || 14 })}
                    disabled={!config.rsi.enabled}
                    className="mt-1 w-24"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Oversold Level</Label>
                      <span className="text-xs font-mono">{config.rsi.oversoldLevel}</span>
                    </div>
                    <Slider
                      value={[config.rsi.oversoldLevel]}
                      onValueChange={([v]) => updateConfig('rsi', { oversoldLevel: v })}
                      min={10}
                      max={40}
                      step={5}
                      disabled={!config.rsi.enabled}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Overbought Level</Label>
                      <span className="text-xs font-mono">{config.rsi.overboughtLevel}</span>
                    </div>
                    <Slider
                      value={[config.rsi.overboughtLevel]}
                      onValueChange={([v]) => updateConfig('rsi', { overboughtLevel: v })}
                      min={60}
                      max={90}
                      step={5}
                      disabled={!config.rsi.enabled}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard: Period 14, Oversold 30, Overbought 70.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* ADX Settings */}
            <AccordionItem value="adx" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.adx.enabled}
                    onCheckedChange={(checked) => updateConfig('adx', { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(!config.adx.enabled && "text-muted-foreground")}>
                    ADX
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">Average Directional Index measures trend strength (not direction). Higher values = stronger trend.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Period</Label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={config.adx.period}
                    onChange={(e) => updateConfig('adx', { period: parseInt(e.target.value) || 14 })}
                    disabled={!config.adx.enabled}
                    className="mt-1 w-24"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Weak Trend Below</Label>
                      <span className="text-xs font-mono">{config.adx.weakThreshold}</span>
                    </div>
                    <Slider
                      value={[config.adx.weakThreshold]}
                      onValueChange={([v]) => updateConfig('adx', { weakThreshold: v })}
                      min={10}
                      max={40}
                      step={5}
                      disabled={!config.adx.enabled}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Strong Trend Above</Label>
                      <span className="text-xs font-mono">{config.adx.strongThreshold}</span>
                    </div>
                    <Slider
                      value={[config.adx.strongThreshold]}
                      onValueChange={([v]) => updateConfig('adx', { strongThreshold: v })}
                      min={40}
                      max={80}
                      step={5}
                      disabled={!config.adx.enabled}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard: Period 14, Weak {'<'}25, Strong {'>'}50. Trend-following works better in strong trends.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            Settings are saved locally and will be used for future scans.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TrendIndicatorSettings;
