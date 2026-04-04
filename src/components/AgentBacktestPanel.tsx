import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Shield, Clock, Briefcase, Loader2, Zap, Settings2, Info, RotateCcw, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentWeightsFAQ } from './agent-backtest/AgentWeightsFAQ';
import { toast } from 'sonner';
import { AgentWeights, DEFAULT_WEIGHTS, DEFAULT_CUTOFFS } from '../../engine/backtester-v2/agents/types';
import { Slider } from '@/components/ui/slider';
import { TradeOpportunityTable, AssetClassFilter, TradeSetup, deriveRawScores, ScoringContext, buildDetectionSelectionKey } from './agent-backtest/TradeOpportunityTable';
import { AgentGauges } from './agent-backtest/AgentGauges';
import { VerdictZoneBar } from './agent-backtest/VerdictZoneBar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAgentScoringDetections, useAgentScores, TimeframeFilter } from '@/hooks/useAgentScoringDetections';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { InstrumentSubFilters } from './agent-backtest/InstrumentSubFilters';
import { SettingsManager } from './agent-backtest/SettingsManager';
import { SubFilters, AgentScoringSettingsData } from '@/hooks/useAgentScoringSettings';
import { useUpcomingEconomicEvents } from '@/hooks/useUpcomingEconomicEvents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  registerPanel,
  unregisterPanel,
  buildDiffSummary,
  ScoringUpdatePayload,
} from '@/lib/copilotEvents';
const GUEST_BACKTEST_KEY = 'agent_scoring_guest_backtest';

function hasUsedGuestBacktest(): boolean {
  try {
    return localStorage.getItem(GUEST_BACKTEST_KEY) === 'used';
  } catch { return false; }
}

function markGuestBacktestUsed(): void {
  try {
    localStorage.setItem(GUEST_BACKTEST_KEY, 'used');
  } catch {}
}

const PRESETS_KEYS = ['balanced', 'conservative', 'aggressive', 'momentum'] as const;

const PRESETS: Record<string, { weights: AgentWeights; cutoffs: { take: number; watch: number } }> = {
  balanced: { weights: { analyst: 25, risk: 25, timing: 25, portfolio: 25 }, cutoffs: { take: 70, watch: 50 } },
  conservative: { weights: { analyst: 20, risk: 35, timing: 25, portfolio: 20 }, cutoffs: { take: 80, watch: 60 } },
  aggressive: { weights: { analyst: 35, risk: 15, timing: 25, portfolio: 25 }, cutoffs: { take: 60, watch: 40 } },
  momentum: { weights: { analyst: 30, risk: 20, timing: 30, portfolio: 20 }, cutoffs: { take: 65, watch: 45 } },
};

const PRESET_EMOJIS: Record<string, string> = {
  balanced: '⚖️',
  conservative: '🛡️',
  aggressive: '🔥',
  momentum: '⚡',
};

export const AgentBacktestPanel: React.FC<{ onSendToBacktest?: (setup: TradeSetup) => void; onReset?: () => void }> = ({ onSendToBacktest, onReset }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weights, setWeights] = useState<AgentWeights>({ ...DEFAULT_WEIGHTS });
  const [takeCutoff, setTakeCutoff] = useState(DEFAULT_CUTOFFS.take);
  const [watchCutoff, setWatchCutoff] = useState(DEFAULT_CUTOFFS.watch);

  const [symbols, setSymbols] = useState('');
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState('2025-01-01');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [assetClassFilter, setAssetClassFilter] = useState<AssetClassFilter>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [subFilters, setSubFilters] = useState<SubFilters>({});
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [isRunning, setIsRunning] = useState(false);
  const [basketSelections, setBasketSelections] = useState<string[]>([]);
  const [activeSettingId, setActiveSettingId] = useState<string | undefined>();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const lastManualInteraction = useRef<number>(0);

  const { data: liveDetections = [], isLoading: detectionsLoading } = useAgentScoringDetections(assetClassFilter, timeframeFilter, subFilters);
  const { data: agentScores = [] } = useAgentScores();
  const { data: economicEvents = [] } = useUpcomingEconomicEvents();

  // Register/unregister panel mount for Copilot panel detection
  useEffect(() => {
    registerPanel('agentScoring');
    return () => unregisterPanel('agentScoring');
  }, []);

  // Consume pending Copilot action on mount
  useEffect(() => {
    async function consumePendingAction() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('pending_copilot_actions')
        .select('*')
        .is('applied_at', null)
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle();
      if (!data) return;
      if (data.action_type === 'scoring_update') {
        const p = data.payload as Record<string, any>;
        if (p.weights) setWeights(p.weights);
        if (p.takeCutoff !== undefined) setTakeCutoff(p.takeCutoff);
        if (p.watchCutoff !== undefined) setWatchCutoff(p.watchCutoff);
        if (p.assetClassFilter) setAssetClassFilter(p.assetClassFilter);
        if (p.timeframeFilter) setTimeframeFilter(p.timeframeFilter);
        if (p.subFilters) setSubFilters(p.subFilters);
        toast.success(`Copilot applied: ${p.description || 'settings updated'}`);
      }
      await supabase
        .from('pending_copilot_actions')
        .update({ applied_at: new Date().toISOString() })
        .eq('id', data.id);
      if (data.auto_run) {
        setTimeout(() => handleRun(), 1200);
      }
    }
    consumePendingAction();
  }, []);

  // Listen for Copilot scoring update events
  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<ScoringUpdatePayload>).detail;
      const { originatedAt, diff, description, ...settings } = payload;
      // Conflict check: skip if user has made manual changes after this event originated
      if (lastManualInteraction.current > originatedAt) {
        toast.warning('Copilot update skipped — you have unsaved manual changes. Type "apply copilot changes" to override.');
        return;
      }
      if (settings.weights) setWeights(settings.weights);
      if (settings.takeCutoff !== undefined) setTakeCutoff(settings.takeCutoff);
      if (settings.watchCutoff !== undefined) setWatchCutoff(settings.watchCutoff);
      if (settings.assetClassFilter) setAssetClassFilter(settings.assetClassFilter as AssetClassFilter);
      if (settings.timeframeFilter) setTimeframeFilter(settings.timeframeFilter as TimeframeFilter);
      if (settings.subFilters) setSubFilters(settings.subFilters);
      if (settings.presetId) setActiveSettingId(settings.presetId);
      setActivePreset('');
      const diffSummary = diff ? buildDiffSummary(diff) : '';
      toast.success(`✅ ${description ?? 'Copilot update applied'}${diffSummary ? `  ·  ${diffSummary}` : ''}`);
    };
    window.addEventListener('copilot:scoring-update', handler);
    return () => window.removeEventListener('copilot:scoring-update', handler);
  }, []);

  // Listen for Copilot run backtest events
  useEffect(() => {
    const handler = () => handleRun();
    window.addEventListener('copilot:run-backtest', handler);
    return () => window.removeEventListener('copilot:run-backtest', handler);
  }, []);

  const selectedDetections = useMemo(() => {
    const keySet = new Set(basketSelections);
    return liveDetections.filter((d) => keySet.has(buildDetectionSelectionKey(d)));
  }, [liveDetections, basketSelections]);

  const toggleBasket = (selectionKey: string) => {
    setBasketSelections((prev) => {
      const next = prev.includes(selectionKey)
        ? prev.filter((s) => s !== selectionKey)
        : [...prev, selectionKey];

      const nextKeySet = new Set(next);
      const nextSymbols = liveDetections
        .filter((d) => nextKeySet.has(buildDetectionSelectionKey(d)))
        .map((d) => d.instrument);
      const uniqueSymbols = [...new Set(nextSymbols)];
      setSymbols(uniqueSymbols.join(', '));

      return next;
    });
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setWeights({ ...p.weights });
    setTakeCutoff(p.cutoffs.take);
    setWatchCutoff(p.cutoffs.watch);
    setActivePreset(key);
  };

  const handleLoadSetting = (setting: AgentScoringSettingsData) => {
    setWeights({ ...setting.weights });
    setTakeCutoff(setting.takeCutoff);
    setWatchCutoff(setting.watchCutoff);
    setAssetClassFilter(setting.assetClassFilter);
    setTimeframeFilter(setting.timeframeFilter);
    setSubFilters(setting.subFilters || {});
    setActivePreset('');
  };

  // Reset sub-filters when asset class changes
  const handleAssetClassChange = (v: AssetClassFilter) => {
    setAssetClassFilter(v);
    setSubFilters({});
  };

  const AGENTS = [
    { key: 'analyst' as const, label: t('agentScoring.analyst'), icon: Brain, color: 'text-blue-400', barColor: 'bg-blue-500', tooltip: t('agentScoring.analystTooltip') },
    { key: 'risk' as const, label: t('agentScoring.riskMgr'), icon: Shield, color: 'text-amber-400', barColor: 'bg-amber-500', tooltip: t('agentScoring.riskTooltip') },
    { key: 'timing' as const, label: t('agentScoring.timing'), icon: Clock, color: 'text-purple-400', barColor: 'bg-purple-500', tooltip: t('agentScoring.timingTooltip') },
    { key: 'portfolio' as const, label: t('agentScoring.portfolio'), icon: Briefcase, color: 'text-emerald-400', barColor: 'bg-emerald-500', tooltip: t('agentScoring.portfolioTooltip') },
  ];

  const gaugeStats = useMemo(() => {
    if (liveDetections.length === 0) return { takeRate: 0, watchRate: 0, skipRate: 0, avgScore: 0 };

    const ctx: ScoringContext = { economicEvents, basketSelectionKeys: basketSelections, allDetections: liveDetections };
    const composites = liveDetections.map((d) => {
      const { analystRaw, riskRaw, timingRaw, portfolioRaw } = deriveRawScores(d, ctx);
      if (portfolioRaw !== null) {
        return analystRaw * weights.analyst + riskRaw * weights.risk + timingRaw * weights.timing + portfolioRaw * weights.portfolio;
      }
      const baseSum = weights.analyst + weights.risk + weights.timing;
      const scale = baseSum > 0 ? (baseSum + weights.portfolio) / baseSum : 1;
      return (analystRaw * weights.analyst + riskRaw * weights.risk + timingRaw * weights.timing) * scale;
    });
    const total = composites.length;
    const takes = composites.filter((c) => c >= takeCutoff).length;
    const watches = composites.filter((c) => c >= watchCutoff && c < takeCutoff).length;
    const skips = composites.filter((c) => c < watchCutoff).length;
    const avg = composites.reduce((a, b) => a + b, 0) / total;
    return {
      takeRate: (takes / total) * 100,
      watchRate: (watches / total) * 100,
      skipRate: (skips / total) * 100,
      avgScore: avg,
    };
  }, [liveDetections, weights, takeCutoff, watchCutoff, economicEvents, basketSelections]);

  const handleRun = useCallback(async () => {
    const symbolList = symbols.split(',').map((s) => s.trim()).filter(Boolean);
    
    if (symbolList.length === 0) {
      toast.error(t('agentScoring.addSymbolsFirst'));
      return;
    }
    
    const MAX_INSTRUMENTS = 20;
    if (symbolList.length > MAX_INSTRUMENTS) {
      toast.error(t('agentScoring.tooManyInstruments', { count: symbolList.length, max: MAX_INSTRUMENTS }));
      return;
    }
    
    const relevantDetections = liveDetections.filter((d) => symbolList.includes(d.instrument));
    const uniquePatterns = [...new Set(relevantDetections.map((d) => d.pattern_id))];
    
    if (uniquePatterns.length === 0) {
      toast.error(t('agentScoring.noActivePatterns'));
      return;
    }
    
    const instrumentPatternMap: Record<string, string[]> = {};
    relevantDetections.forEach((d) => {
      if (!instrumentPatternMap[d.instrument]) instrumentPatternMap[d.instrument] = [];
      if (!instrumentPatternMap[d.instrument].includes(d.pattern_id)) {
        instrumentPatternMap[d.instrument].push(d.pattern_id);
      }
    });
    
    const detectionTimeframes = [...new Set(relevantDetections.map((d) => d.timeframe))];
    let tf: string;
    if (timeframeFilter !== 'all') {
      tf = timeframeFilter;
    } else if (detectionTimeframes.length === 1) {
      tf = detectionTimeframes[0];
    } else {
      const tfCounts = detectionTimeframes.map(t => ({ tf: t, count: relevantDetections.filter(d => d.timeframe === t).length }));
      tfCounts.sort((a, b) => b.count - a.count);
      tf = tfCounts[0].tf;
      toast.info(`Multiple timeframes detected (${detectionTimeframes.join(', ')}). Using ${tf} for backtest. Use the Timeframe filter for precision.`);
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      // Guest: check if they already used their free backtest
      if (hasUsedGuestBacktest()) {
        setShowAuthGate(true);
        return;
      }
      // First-time guest: show auth gate with "free first backtest" messaging
      setShowAuthGate(true);
      return;
    }

    setIsRunning(true);
    try {
      
      const payload = {
        projectType: 'pattern_lab',
        inputs: {
          instruments: symbolList,
          patterns: uniquePatterns,
          instrumentPatternMap,
          timeframe: tf,
          lookbackYears: 2,
          gradeFilter: ['A', 'B', 'C'],
          riskPerTrade: 1,
        },
      };

      // Retry up to 2 times with 30s timeout per attempt
      const MAX_RETRIES = 2;
      const TIMEOUT_MS = 30_000;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
          if (attempt > 0) {
            toast.info(`Retrying backtest... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
            await new Promise(r => setTimeout(r, 2000)); // brief pause before retry
          }

          const response = await fetch(
            'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/run',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to start run');

          toast.success(t('agentScoring.backtestStarted'));
          markGuestBacktestUsed(); // Track that user has run at least one backtest
          navigate(`/projects/runs/${data.runId}`, {
            state: { fromAgentScoring: true },
          });
          return; // success — exit early
        } catch (err: any) {
          clearTimeout(timeoutId);
          lastError = err;

          if (err.name === 'AbortError') {
            console.warn(`[AgentBacktest] Attempt ${attempt + 1} timed out after ${TIMEOUT_MS}ms`);
            lastError = new Error('Request timed out — the server may be busy. Please try again.');
          } else if (attempt < MAX_RETRIES && (err.message === 'Failed to fetch' || err.message?.includes('network'))) {
            console.warn(`[AgentBacktest] Attempt ${attempt + 1} failed:`, err.message);
            continue; // retry on network errors
          } else {
            break; // don't retry on non-network errors
          }
        }
      }

      toast.error(lastError?.message || t('agentScoring.backtestFailed'));
    } catch (err: any) {
      toast.error(err.message || t('agentScoring.backtestFailed'));
    } finally {
      setIsRunning(false);
    }
  }, [symbols, liveDetections, timeframeFilter, weights, takeCutoff, watchCutoff, navigate, t]);

  return (
    <div className="space-y-5">
      {/* Title bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{t('agentScoring.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('agentScoring.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SettingsManager
            currentSettings={{
              weights,
              takeCutoff,
              watchCutoff,
              assetClassFilter,
              timeframeFilter,
              subFilters,
            }}
            onLoad={handleLoadSetting}
            activeSettingId={activeSettingId}
            setActiveSettingId={setActiveSettingId}
          />
          {totalWeight !== 100 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">{t('agentScoring.weightsLabel')}: {totalWeight}/100</Badge>
          )}
        </div>
      </div>

      {/* Controls — horizontal strip using full width */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Presets */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t('agentScoring.quickPresets')}</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                    <p className="font-medium mb-1">{t('agentScoring.presetTooltipTitle')}</p>
                    <p>{t('agentScoring.presetTooltipDesc')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS_KEYS.map((key) => (
                <Button
                  key={key}
                  variant={activePreset === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyPreset(key)}
                  className={`text-xs h-8 ${activePreset === key ? 'ring-2 ring-primary/40' : ''}`}
                >
                  {PRESET_EMOJIS[key]} {t(`agentScoring.${key}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Asset Class + Timeframe + Sub-filters */}
        <Card className="border-border bg-card col-span-2 lg:col-span-1">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t('agentScoring.assetClass')}</span>
              <ToggleGroup
                type="single"
                value={assetClassFilter}
                onValueChange={(v) => { lastManualInteraction.current = Date.now(); if (v) handleAssetClassChange(v as AssetClassFilter); }}
                className="flex flex-wrap gap-1"
              >
                {[
                  { value: 'all', label: t('agentScoring.allAssets') },
                  { value: 'stocks', label: t('agentScoring.stocks') },
                  { value: 'crypto', label: t('agentScoring.crypto') },
                  { value: 'forex', label: t('agentScoring.forex') },
                  { value: 'commodities', label: t('agentScoring.commodities') },
                ].map((ac) => (
                  <ToggleGroupItem key={ac.value} value={ac.value} size="sm" className="text-xs h-7 px-2.5">
                    {ac.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Sub-filters */}
            <InstrumentSubFilters
              assetClass={assetClassFilter}
              subFilters={subFilters}
              onChange={setSubFilters}
            />

            <div className="space-y-2.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t('agentScoring.timeframe')}</span>
              <ToggleGroup
                type="single"
                value={timeframeFilter}
                onValueChange={(v) => { lastManualInteraction.current = Date.now(); if (v) setTimeframeFilter(v as TimeframeFilter); }}
                className="flex flex-wrap gap-1"
              >
                {[
                  { value: 'all', label: t('agentScoring.allAssets') },
                  { value: '1h', label: '1H' },
                  { value: '4h', label: '4H' },
                  { value: '1d', label: '1D' },
                  { value: '1wk', label: '1W' },
                ].map((tf) => (
                  <ToggleGroupItem key={tf.value} value={tf.value} size="sm" className="text-xs h-7 px-2.5">
                    {tf.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        {/* Agent Sliders — spans 2 columns on xl */}
        <Card className="border-border bg-card col-span-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t('agentScoring.agentWeights')}</span>
                <AgentWeightsFAQ
                  trigger={
                    <button className="inline-flex items-center">
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                    </button>
                  }
                />
              </div>
              <span className={`text-sm font-mono font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-destructive'}`}>
                {totalWeight}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {AGENTS.map(({ key, label, icon: Icon, color, tooltip }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm whitespace-normal text-xs">
                            {tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className={`text-sm font-mono font-bold ${color}`}>{weights[key]}</span>
                  </div>
                  <Slider
                    value={[weights[key]]}
                    onValueChange={([v]) => { lastManualInteraction.current = Date.now(); setWeights((prev) => ({ ...prev, [key]: v })); setActivePreset(''); }}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verdict Thresholds + Backtest Basket */}
        <Card className="border-border bg-card col-span-2 xl:col-span-2">
          <CardContent className="p-4 space-y-3">
            <VerdictZoneBar
              takeCutoff={takeCutoff}
              watchCutoff={watchCutoff}
              onTakeChange={setTakeCutoff}
              onWatchChange={setWatchCutoff}
            />
            <div className="border-t border-border/40 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t('agentScoring.backtestBasket')}</span>
                </div>
                {basketSelections.length > 0 && (
                  <button
                    onClick={() => { setBasketSelections([]); setSymbols(''); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('agentScoring.clearAll')}
                  </button>
                )}
              </div>
              {basketSelections.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedDetections.map((d) => {
                    const key = buildDetectionSelectionKey(d);
                    const directionLabel = d.direction?.toLowerCase().includes('short') ? 'Short' : 'Long';
                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                        onClick={() => toggleBasket(key)}
                      >
                        {d.instrument} • {d.pattern_name} {directionLabel} ✕
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder={t('agentScoring.addSymbolsPlaceholder')} className="text-xs h-8 flex-1" />
                <Button onClick={handleRun} disabled={isRunning || totalWeight !== 100} className="h-8 text-xs px-3 shrink-0" size="sm">
                  {isRunning ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />{t('agentScoring.running')}</> : <><Zap className="h-3.5 w-3.5 mr-1" />{t('agentScoring.runBacktest')}</>}
                </Button>
              </div>
              {totalWeight !== 100 && (
                <p className="text-xs text-destructive">{t('agentScoring.weightsMustTotal', { current: totalWeight })}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gauges Row */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <AgentGauges
            takeRate={gaugeStats.takeRate}
            watchRate={gaugeStats.watchRate}
            skipRate={gaugeStats.skipRate}
            avgScore={gaugeStats.avgScore}
          />
        </CardContent>
      </Card>

      {/* Trade Opportunity Table */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {t('agentScoring.tradeOpportunities')}
              <span className="text-xs font-normal text-muted-foreground">{t('agentScoring.scoresUpdateLive')}</span>
            </CardTitle>
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground h-7">
                <RotateCcw className="h-3.5 w-3.5" />
                {t('agentScoring.reset')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <TradeOpportunityTable
            weights={weights}
            takeCutoff={takeCutoff}
            watchCutoff={watchCutoff}
            detections={liveDetections}
            isLoading={detectionsLoading}
            onSendToBacktest={onSendToBacktest}
            basketSelections={basketSelections}
            onToggleBasket={toggleBasket}
            economicEvents={economicEvents}
            agentScores={agentScores}
            lastScoredAt={agentScores[0]?.scored_at}
          />
        </CardContent>
      </Card>
      {/* Auth Gate Dialog for guest backtest */}
      <AlertDialog open={showAuthGate} onOpenChange={setShowAuthGate}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Lock className="h-5 w-5 text-primary" />
              {hasUsedGuestBacktest()
                ? t('agentScoring.authGateTitle', 'Sign in to continue backtesting')
                : t('agentScoring.authGateFreeTitle', 'Create a free account to backtest')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {hasUsedGuestBacktest()
                ? t('agentScoring.authGateDesc', 'You\'ve used your free backtest. Sign in or create a free account to unlock more backtests and save your results.')
                : t('agentScoring.authGateFreeDesc', 'Agent Scoring is free to use. Create a free account to run your first backtest and validate your trade ideas with historical data.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-muted-foreground">{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate('/auth?redirect=' + encodeURIComponent('/tools/agent-scoring'))}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('agentScoring.authGateCta', 'Sign up free')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
