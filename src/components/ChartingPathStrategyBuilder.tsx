import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign, 
  Target, 
  Settings,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  Globe,
  CheckCircle,
  Layers,
  Crosshair,
  Shield,
  Play,
  Download
} from 'lucide-react';
import { MarketStep } from './guided-strategy/MarketStep';
import { PatternLibrary } from './chartingpath/PatternLibrary';
import { TargetStopLossSettings } from './chartingpath/TargetStopLossSettings';
import { EnhancedBacktestEngine } from './chartingpath/EnhancedBacktestEngine';
import { ExportPanel } from './chartingpath/ExportPanel';
import { PatternRulesEditor } from './PatternRulesEditor';
import { PositionManagementSettings } from './PositionManagementSettings';
import { TradeDisciplineFilters, DisciplineFilters, DEFAULT_DISCIPLINE_FILTERS } from './chartingpath/TradeDisciplineFilters';
import { DEFAULT_POSITION_MANAGEMENT, PositionManagementRules, PatternRules as ProfessionalPatternRules } from '@/utils/ProfessionalPatternRules';
import { PATTERN_DETAILS } from '@/utils/PatternDetails';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface PatternRules {
  entry: string;
  stopLoss: string;
  target: string;
}

export interface ChartingPathStrategy {
  id?: string;
  name: string;
  description?: string;
  market?: {
    instrumentCategory: string;
    instrument: string;
    timeframes: string[];
    tradingHours: string;
  };
  patterns: any[];
  patternRules?: Record<string, PatternRules>;
  targetGainPercent: number;
  stopLossPercent: number;
  positionSizing: {
    method: 'fixed_percent' | 'fixed_amount' | 'risk_based';
    riskPerTrade: number;
    maxPositions: number;
  };
  positionManagement?: PositionManagementRules;
  disciplineFilters?: DisciplineFilters;
  backtestPeriod?: {
    startDate: string;
    endDate: string;
    preset?: string;
  };
  backtestResults?: any;
  created_at?: Date;
  updated_at?: Date;
}

interface ChartingPathStrategyBuilderProps {
  initialStrategy?: ChartingPathStrategy | null;
  onSave?: (strategy: ChartingPathStrategy) => void;
  onBacktest?: (strategy: ChartingPathStrategy) => Promise<any>;
  isBacktesting?: boolean;
  backtestProgress?: number;
  backtestPhase?: string;
}

export const STRATEGY_STEPS = [
  { id: 'market', title: 'Asset & Timeframe', description: 'Select financial instrument & chart period', icon: Globe },
  { id: 'patterns', title: 'Chart Patterns', description: 'Select patterns to trade', icon: Layers },
  { id: 'rules', title: 'Entry & Exit Rules', description: 'Configure trading rules with AI', icon: Crosshair },
  { id: 'discipline', title: 'Trade Discipline', description: 'Professional filters to avoid mistakes', icon: Shield },
  { id: 'position', title: 'Position Management', description: 'Max trades & overlap prevention', icon: Settings },
  { id: 'targets', title: 'Target & Stop Loss', description: 'Set profit target % and stop loss %', icon: Target },
  { id: 'backtest', title: 'Backtest', description: 'Test pattern performance', icon: Play },
  { id: 'export', title: 'Export', description: 'Generate trading code', icon: Download }
];

export interface ChartingPathStrategyBuilderRef {
  getStrategy: () => ChartingPathStrategy;
  setStrategy: (strategy: ChartingPathStrategy) => void;
  getCurrentStep: () => number;
  setCurrentStep: (step: number) => void;
  getStepCompletion: (stepIndex: number) => boolean;
  canProceedToStep: (stepIndex: number) => boolean;
  getCompletedStepsCount: () => number;
  getTotalStepsCount: () => number;
  getBacktestResults: () => any;
}

export const ChartingPathStrategyBuilder = forwardRef<ChartingPathStrategyBuilderRef, ChartingPathStrategyBuilderProps>(({
  initialStrategy,
  onSave,
  onBacktest,
  isBacktesting: isBacktestingProp = false,
  backtestProgress = 0,
  backtestPhase = ''
}, ref) => {
  const [strategy, setStrategy] = useState<ChartingPathStrategy>(
    initialStrategy || {
      name: 'New Chart Pattern Strategy',
      description: 'Pattern-based trading strategy',
      patterns: [],
      patternRules: {},
      targetGainPercent: 0,
      stopLossPercent: 0,
      market: {
        instrumentCategory: 'stocks',
        instrument: '',
        timeframes: ['1H'],
        tradingHours: 'london-ny'
      },
      positionSizing: {
        method: 'risk_based',
        riskPerTrade: 2.0,
        maxPositions: 3
      },
      positionManagement: DEFAULT_POSITION_MANAGEMENT,
      disciplineFilters: DEFAULT_DISCIPLINE_FILTERS,
      backtestPeriod: {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        preset: '1year'
      }
    }
  );

  const [currentStep, setCurrentStep] = useState(0);
  // Use prop if provided, otherwise manage locally
  const isBacktesting = isBacktestingProp;
  const [backtestResults, setBacktestResults] = useState(null);
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(new Set());
  const [expandedPatternRules, setExpandedPatternRules] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<string[]>(['market', 'patterns']);

  // Step completion logic
  const getStepCompletion = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Market
        return !!(strategy.market?.instrument && strategy.market?.timeframes?.length > 0);
      case 1: // Patterns
        return strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled);
      case 2: // Entry & Exit Rules
        return confirmedSteps.has(2);
      case 3: // Trade Discipline
        return strategy.disciplineFilters !== undefined;
      case 4: // Position Management
        return confirmedSteps.has(4) && strategy.positionManagement !== undefined;
      case 5: // Target & Stop Loss
        const enabledPatterns = strategy.patterns.filter(p => p.enabled);
        if (enabledPatterns.length === 0) return false;
        return true;
      case 6: // Backtest
        return strategy.backtestResults != null;
      case 7: // Export
        return getStepCompletion(0) && getStepCompletion(1) && getStepCompletion(5);
      default:
        return false;
    }
  };

  const canProceedToStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true;
    return getStepCompletion(stepIndex - 1);
  };

  useImperativeHandle(ref, () => ({
    getStrategy: () => strategy,
    setStrategy: (newStrategy: ChartingPathStrategy) => setStrategy(newStrategy),
    getCurrentStep: () => currentStep,
    setCurrentStep: (step: number) => {
      if (canProceedToStep(step)) {
        setCurrentStep(step);
      }
    },
    getStepCompletion,
    canProceedToStep,
    getCompletedStepsCount: () => STRATEGY_STEPS.filter((_, i) => getStepCompletion(i)).length,
    getTotalStepsCount: () => STRATEGY_STEPS.length,
    getBacktestResults: () => backtestResults
  }), [strategy, currentStep, confirmedSteps, backtestResults]);

  useEffect(() => {
    if (initialStrategy) {
      setStrategy(initialStrategy);
      const completedSteps = new Set<number>();
      if (initialStrategy.market?.instrument) completedSteps.add(0);
      if (initialStrategy.patterns?.some(p => p.enabled)) completedSteps.add(1);
      if (initialStrategy.positionManagement) completedSteps.add(3);
      setConfirmedSteps(completedSteps);
    }
  }, [initialStrategy]);

  const updateStrategy = (section: keyof ChartingPathStrategy, data: any) => {
    setStrategy(prev => ({
      ...prev,
      [section]: data,
      updated_at: new Date()
    }));
  };

  const handleBacktest = async (strategyOverride?: ChartingPathStrategy) => {
    try {
      const strategyToTest = strategyOverride || strategy;
      const results = await onBacktest?.(strategyToTest);
      setBacktestResults(results);
      updateStrategy('backtestResults', results);
    } catch (error) {
      console.error('Backtest failed:', error);
      toast.error('Backtest failed. Please check your pattern configuration.');
    }
  };

  const handlePresetChange = (preset: string) => {
    const today = new Date();
    let startDate = new Date();
    
    switch(preset) {
      case '3months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case '2years':
        startDate.setFullYear(today.getFullYear() - 2);
        break;
      case '5years':
        startDate.setFullYear(today.getFullYear() - 5);
        break;
      default:
        startDate.setFullYear(today.getFullYear() - 1);
    }
    
    updateStrategy('backtestPeriod', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      preset
    });
  };

  const canBacktest = () => {
    return getStepCompletion(0) && getStepCompletion(1) && getStepCompletion(3);
  };

  const getSectionStatus = (sectionId: string): 'complete' | 'incomplete' | 'locked' => {
    const stepIndex = STRATEGY_STEPS.findIndex(s => s.id === sectionId);
    if (getStepCompletion(stepIndex)) return 'complete';
    if (!canProceedToStep(stepIndex)) return 'locked';
    return 'incomplete';
  };

  const renderSectionHeader = (step: typeof STRATEGY_STEPS[0], index: number) => {
    const status = getSectionStatus(step.id);
    const IconComponent = step.icon;
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            status === 'complete' 
              ? 'bg-green-500/20 text-green-600' 
              : status === 'locked' 
                ? 'bg-muted text-muted-foreground' 
                : 'bg-primary/10 text-primary'
          }`}>
            {status === 'complete' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <IconComponent className="w-4 h-4" />
            )}
          </div>
          <div className="text-left">
            <div className="font-medium">{step.title}</div>
            <div className="text-xs text-muted-foreground">{step.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'complete' && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              Complete
            </Badge>
          )}
          {status === 'locked' && (
            <Badge variant="outline" className="text-muted-foreground">
              Locked
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Accordion Sections */}
      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-3"
      >
        {/* Section 1: Asset & Timeframe */}
        <AccordionItem value="market" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[0], 0)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              <MarketStep
                answers={{ market: strategy.market }}
                onAnswersChange={(_, data) => updateStrategy('market', data)}
                subscriptionPlan="professional"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Chart Patterns */}
        <AccordionItem value="patterns" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[1], 1)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              <PatternLibrary
                patterns={strategy.patterns}
                onChange={(patterns) => updateStrategy('patterns', patterns)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Entry & Exit Rules */}
        <AccordionItem 
          value="rules" 
          className={`border rounded-lg bg-card ${getSectionStatus('rules') === 'locked' ? 'opacity-50' : ''}`}
          disabled={getSectionStatus('rules') === 'locked'}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[2], 2)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-4">
              {strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled) ? (
                <>
                  {strategy.patterns
                    .filter(p => p.enabled)
                    .map((pattern) => {
                      const basePatternId = pattern.id.replace(/_\d+$/, '');
                      let patternKey = basePatternId
                        .replace(/_/g, '-')
                        .replace(/^inverse-/, 'inverted-');
                      
                      if (patternKey === 'wedge-rising') patternKey = 'rising-wedge';
                      if (patternKey === 'wedge-falling') patternKey = 'falling-wedge';
                      
                      const patternDetails = PATTERN_DETAILS[patternKey];
                      const patternName = basePatternId
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      
                      const defaultRules = patternDetails ? {
                        entry: patternDetails.entry,
                        stopLoss: patternDetails.stopLoss,
                        target: patternDetails.targetMethodology
                      } : {
                        entry: "Define your entry criteria for this pattern",
                        stopLoss: "Set stop loss based on pattern structure",
                        target: "Determine target based on pattern measurement"
                      };

                      const customRules = strategy.patternRules?.[pattern.id];
                      const isExpanded = expandedPatternRules.has(pattern.id);
                      const toggleExpanded = () => {
                        setExpandedPatternRules(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(pattern.id)) {
                            newSet.delete(pattern.id);
                          } else {
                            newSet.add(pattern.id);
                          }
                          return newSet;
                        });
                      };

                      return (
                        <Collapsible 
                          key={pattern.id} 
                          open={isExpanded} 
                          onOpenChange={toggleExpanded}
                          className="border border-border rounded-lg bg-muted/30 overflow-hidden"
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left">
                              <div className="flex items-center gap-3">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{patternName}</span>
                                {customRules && (
                                  <Badge variant="secondary" className="text-xs">Customized</Badge>
                                )}
                              </div>
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-2 border-t border-border">
                              <PatternRulesEditor
                                patternName={patternName}
                                patternId={pattern.id}
                                defaultRules={defaultRules}
                                customRules={customRules}
                                onRulesChange={(rules) => {
                                  const updatedRules = {
                                    ...strategy.patternRules,
                                    [pattern.id]: rules
                                  };
                                  updateStrategy('patternRules', updatedRules);
                                }}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        setConfirmedSteps(prev => new Set([...prev, 2]));
                        toast.success('Entry & Exit Rules confirmed');
                      }}
                      disabled={confirmedSteps.has(2)}
                      size="sm"
                    >
                      {confirmedSteps.has(2) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmed
                        </>
                      ) : (
                        'Confirm Rules'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Select chart patterns first</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Trade Discipline Filters */}
        <AccordionItem 
          value="discipline" 
          className={`border rounded-lg bg-card ${getSectionStatus('discipline') === 'locked' ? 'opacity-50' : ''}`}
          disabled={getSectionStatus('discipline') === 'locked'}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[3], 3)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              <TradeDisciplineFilters
                filters={strategy.disciplineFilters || DEFAULT_DISCIPLINE_FILTERS}
                onChange={(filters) => updateStrategy('disciplineFilters', filters)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Position Management */}
        <AccordionItem 
          value="position" 
          className={`border rounded-lg bg-card ${getSectionStatus('position') === 'locked' ? 'opacity-50' : ''}`}
          disabled={getSectionStatus('position') === 'locked'}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[4], 4)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-4">
              <PositionManagementSettings
                rules={strategy.positionManagement || DEFAULT_POSITION_MANAGEMENT}
                onChange={(rules) => updateStrategy('positionManagement', rules)}
                selectedPatterns={strategy.patterns.filter(p => p.enabled).map(p => p.id)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    setConfirmedSteps(prev => new Set([...prev, 4]));
                    toast.success('Position Management confirmed');
                  }}
                  disabled={confirmedSteps.has(4)}
                  size="sm"
                >
                  {confirmedSteps.has(4) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmed
                    </>
                  ) : (
                    'Confirm Settings'
                  )}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Target & Stop Loss */}
        <AccordionItem 
          value="targets" 
          className={`border rounded-lg bg-card ${getSectionStatus('targets') === 'locked' ? 'opacity-50' : ''}`}
          disabled={getSectionStatus('targets') === 'locked'}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[5], 5)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              {strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled) ? (
                <TargetStopLossSettings
                  targetGainPercent={strategy.targetGainPercent}
                  stopLossPercent={strategy.stopLossPercent}
                  positionSizing={strategy.positionSizing}
                  selectedPatterns={strategy.patterns}
                  onChange={(data) => {
                    updateStrategy('targetGainPercent', data.targetGainPercent);
                    updateStrategy('stopLossPercent', data.stopLossPercent);
                    updateStrategy('positionSizing', data.positionSizing);
                  }}
                  onPatternChange={(patternId, updates) => {
                    const updatedPatterns = strategy.patterns.map(p => 
                      p.id === patternId ? { ...p, ...updates } : p
                    );
                    updateStrategy('patterns', updatedPatterns);
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Select chart patterns first</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 7: Backtest */}
        <AccordionItem 
          value="backtest" 
          className={`border rounded-lg bg-card ${!canBacktest() ? 'opacity-50' : ''}`}
          disabled={!canBacktest()}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[6], 6)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2 space-y-4">
              {canBacktest() ? (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm">Test Period</Label>
                    <Select
                      value={strategy.backtestPeriod?.preset || '1year'}
                      onValueChange={handlePresetChange}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                        <SelectItem value="1year">Last 1 Year</SelectItem>
                        <SelectItem value="2years">Last 2 Years</SelectItem>
                        <SelectItem value="5years">Last 5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={strategy.backtestPeriod?.startDate || ''}
                          onChange={(e) => updateStrategy('backtestPeriod', {
                            ...strategy.backtestPeriod,
                            startDate: e.target.value,
                            preset: 'custom'
                          })}
                          max={strategy.backtestPeriod?.endDate}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date" className="text-xs">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={strategy.backtestPeriod?.endDate || ''}
                          onChange={(e) => updateStrategy('backtestPeriod', {
                            ...strategy.backtestPeriod,
                            endDate: e.target.value,
                            preset: 'custom'
                          })}
                          min={strategy.backtestPeriod?.startDate}
                          max={new Date().toISOString().split('T')[0]}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <EnhancedBacktestEngine
                    strategy={strategy}
                    results={backtestResults}
                    isRunning={isBacktesting}
                    onBacktest={handleBacktest}
                    onStrategyUpdate={(updates) => setStrategy(prev => ({ ...prev, ...updates }))}
                    progress={backtestProgress}
                    progressPhase={backtestPhase}
                  />
                  {backtestResults && (
                    <Card className="border-green-500/30 bg-green-500/10">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Return</p>
                            <p className="text-lg font-bold text-green-600">
                              {backtestResults.totalReturn > 0 ? '+' : ''}{backtestResults.totalReturn?.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Win Rate</p>
                            <p className="text-lg font-bold">{backtestResults.winRate?.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total Trades</p>
                            <p className="text-lg font-bold">{backtestResults.totalTrades || backtestResults.trades?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Profit Factor</p>
                            <p className="text-lg font-bold">{backtestResults.profitFactor?.toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Complete previous steps to enable backtesting</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 8: Export */}
        <AccordionItem 
          value="export" 
          className={`border rounded-lg bg-card ${getSectionStatus('export') === 'locked' ? 'opacity-50' : ''}`}
          disabled={getSectionStatus('export') === 'locked'}
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            {renderSectionHeader(STRATEGY_STEPS[7], 7)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              {getStepCompletion(2) && getStepCompletion(3) && getStepCompletion(5) ? (
                <ExportPanel strategy={strategy} />
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Complete all previous steps to export</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});

ChartingPathStrategyBuilder.displayName = 'ChartingPathStrategyBuilder';
