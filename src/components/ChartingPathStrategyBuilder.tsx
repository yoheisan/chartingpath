import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Activity, 
  TrendingUp,
  TrendingDown,
  Shield, 
  DollarSign, 
  Target, 
  Download,
  Play,
  Settings,
  Zap,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Globe,
  CheckCircle
} from 'lucide-react';
import { MarketStep } from './guided-strategy/MarketStep';
import { PatternLibrary } from './chartingpath/PatternLibrary';
import { TargetStopLossSettings } from './chartingpath/TargetStopLossSettings';
import { EnhancedBacktestEngine } from './chartingpath/EnhancedBacktestEngine';
import { ExportPanel } from './chartingpath/ExportPanel';
import { PatternRulesEditor } from './PatternRulesEditor';
import { PositionManagementSettings } from './PositionManagementSettings';
import { DEFAULT_POSITION_MANAGEMENT, PositionManagementRules, PatternRules as ProfessionalPatternRules } from '@/utils/ProfessionalPatternRules';
import { PATTERN_DETAILS } from '@/utils/PatternDetails';
import { toast } from 'sonner';

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
    timeframes: string[]; // Array to match MarketStep component
    tradingHours: string;
  };
  patterns: any[]; // Selected chart patterns to trade (uses PatternConfig from PatternLibrary with optional custom TP/SL)
  patternRules?: Record<string, PatternRules>; // Custom rules per pattern
  targetGainPercent: number; // Target profit in %
  stopLossPercent: number; // Stop loss in %
  positionSizing: {
    method: 'fixed_percent' | 'fixed_amount' | 'risk_based';
    riskPerTrade: number; // % of account to risk per trade
    maxPositions: number; // Max concurrent positions
  };
  positionManagement?: PositionManagementRules; // Position and overlap management
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
}

export interface ChartingPathStrategyBuilderRef {
  getStrategy: () => ChartingPathStrategy;
  setStrategy: (strategy: ChartingPathStrategy) => void;
}

export const ChartingPathStrategyBuilder = forwardRef<ChartingPathStrategyBuilderRef, ChartingPathStrategyBuilderProps>(({
  initialStrategy,
  onSave,
  onBacktest
}, ref) => {
  const [strategy, setStrategy] = useState<ChartingPathStrategy>(
    initialStrategy || {
      name: 'New Chart Pattern Strategy',
      description: 'Pattern-based trading strategy',
      patterns: [],
      patternRules: {}, // Initialize empty pattern rules
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
      positionManagement: DEFAULT_POSITION_MANAGEMENT, // Initialize with defaults
      backtestPeriod: {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
        endDate: new Date().toISOString().split('T')[0], // Today
        preset: '1year'
      }
    }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(new Set());
  const [expandedPatternRules, setExpandedPatternRules] = useState<Set<string>>(new Set());
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Expose strategy getter/setter to parent
  useImperativeHandle(ref, () => ({
    getStrategy: () => strategy,
    setStrategy: (newStrategy: ChartingPathStrategy) => setStrategy(newStrategy)
  }), [strategy]);

  // Update strategy when initialStrategy changes (e.g., loading from library)
  useEffect(() => {
    if (initialStrategy) {
      setStrategy(initialStrategy);
      // Reset step to beginning when loading a new strategy
      setCurrentStep(0);
      // Mark completed steps based on loaded data
      const completedSteps = new Set<number>();
      if (initialStrategy.market?.instrument) completedSteps.add(0);
      if (initialStrategy.patterns?.some(p => p.enabled)) completedSteps.add(1);
      if (initialStrategy.positionManagement) completedSteps.add(2);
      if (initialStrategy.targetGainPercent > 0 || initialStrategy.stopLossPercent > 0) completedSteps.add(3);
      setConfirmedSteps(completedSteps);
    }
  }, [initialStrategy]);

  // Scroll to top of step content when step changes
  useEffect(() => {
    if (stepContentRef.current) {
      stepContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  const steps = [
    { id: 'market', title: 'Asset & Timeframe', description: 'Select financial instrument & chart period' },
    { id: 'rules', title: 'Entry & Exit Rules', description: 'Configure trading rules with AI' },
    { id: 'position', title: 'Position Management', description: 'Max trades & overlap prevention' },
    { id: 'targets', title: 'Target & Stop Loss', description: 'Set profit target % and stop loss %' },
    { id: 'backtest', title: 'Backtest', description: 'Test pattern performance' },
    { id: 'export', title: 'Export', description: 'Generate trading code' }
  ];

  const updateStrategy = (section: keyof ChartingPathStrategy, data: any) => {
    setStrategy(prev => ({
      ...prev,
      [section]: data,
      updated_at: new Date()
    }));
  };

  const handleBacktest = async (strategyOverride?: ChartingPathStrategy) => {
    setIsBacktesting(true);
    try {
      // Use the override strategy if provided (from EnhancedBacktestEngine), otherwise use current strategy
      const strategyToTest = strategyOverride || strategy;
      // Use pattern detection service to validate patterns in backtest
      const results = await onBacktest?.(strategyToTest);
      setBacktestResults(results);
      updateStrategy('backtestResults', results);
    } catch (error) {
      console.error('Backtest failed:', error);
      toast.error('Backtest failed. Please check your pattern configuration.');
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleSave = () => {
    onSave?.(strategy);
    toast.success('Strategy saved successfully!');
  };


  const getStepCompletion = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Market & Timeframe
        return strategy.market?.instrument && strategy.market?.timeframes?.length > 0 && strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled);
      case 1: // Entry & Exit Rules - requires user confirmation
        return confirmedSteps.has(1);
      case 2: // Position Management - requires user confirmation
        return confirmedSteps.has(2) && strategy.positionManagement !== undefined;
      case 3: // Target & Stop Loss - check per-pattern TP/SL (all enabled patterns must have valid values)
        const enabledPatterns = strategy.patterns.filter(p => p.enabled);
        if (enabledPatterns.length === 0) return false;
        // Each pattern has default TP/SL, so just need at least one enabled pattern
        return true;
      case 4: // Backtest
        return strategy.backtestResults != null;
      case 5: // Export
        return getStepCompletion(0) && getStepCompletion(3);
      default:
        return false;
    }
  };

  const canProceedToStep = (stepIndex: number) => {
    if (stepIndex === 0) return true;
    return getStepCompletion(stepIndex - 1);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (canProceedToStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const getCompletionPercentage = () => {
    const completedSteps = steps.filter((_, index) => getStepCompletion(index)).length;
    return (completedSteps / steps.length) * 100;
  };

  const canBacktest = () => {
    return getStepCompletion(0) && getStepCompletion(2); // Market + Targets
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

  return (
    <div className="space-y-6">
      {/* Selected Pattern Display */}
      {strategy.patterns.filter(p => p.enabled).length > 0 && (
        <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Active Chart Pattern{strategy.patterns.filter(p => p.enabled).length > 1 ? 's' : ''}
                  </h3>
                  <Badge className="bg-green-600 text-white">
                    {strategy.patterns.filter(p => p.enabled).length} Selected
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {strategy.patterns.filter(p => p.enabled).map((pattern, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-green-200 dark:border-green-800">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">{pattern.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {pattern.category}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Strategy will generate signals based on these patterns
                </p>
              </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(0)}
                  className="ml-4 flex items-center gap-2 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Settings className="w-4 h-4" />
                  Change Asset/Timeframe
                </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Step-Based Builder Interface */}
      <Card ref={stepContentRef}>
        <CardContent className="pt-6">
          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <Button
                    variant={index === currentStep ? "default" : getStepCompletion(index) ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => goToStep(index)}
                    disabled={!canProceedToStep(index)}
                    className={`flex items-center gap-2 ${
                      index === currentStep ? 'bg-primary text-primary-foreground' : 
                      getStepCompletion(index) ? 'bg-green-50 border-green-200 text-green-700' : 
                      'text-muted-foreground'
                    }`}
                  >
                    {getStepCompletion(index) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                    )}
                    <span className="hidden md:inline">{step.title}</span>
                  </Button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* Instrument & Timeframe */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Instrument & Timeframe</h3>
                  <MarketStep
                    answers={{ market: strategy.market }}
                    onAnswersChange={(_, data) => updateStrategy('market', data)}
                    subscriptionPlan="professional"
                  />
                </div>

                {/* Pattern Selection */}
                <div className="pt-4">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Chart Patterns</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Select patterns to trade
                  </p>
                  <PatternLibrary
                    patterns={strategy.patterns}
                    onChange={(patterns) => updateStrategy('patterns', patterns)}
                  />
                </div>

                {/* Validation Notice */}
                {(!strategy.market?.instrument || !strategy.patterns.some(p => p.enabled)) && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {!strategy.market?.instrument && 'Select an instrument'}
                      {!strategy.market?.instrument && !strategy.patterns.some(p => p.enabled) && ' and '}
                      {!strategy.patterns.some(p => p.enabled) && 'enable at least one pattern'}
                      {' to continue'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Entry & Exit Rules</h3>
                {strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled) ? (
                  <div className="space-y-4">
                    {strategy.patterns
                      .filter(p => p.enabled)
                      .map((pattern) => {
                        // Extract base pattern name (remove timestamp suffix)
                        const basePatternId = pattern.id.replace(/_\d+$/, '');
                        // Convert underscores to hyphens and handle naming variations
                        let patternKey = basePatternId
                          .replace(/_/g, '-')
                          .replace(/^inverse-/, 'inverted-');
                        
                        // Handle reversed naming conventions
                        if (patternKey === 'wedge-rising') patternKey = 'rising-wedge';
                        if (patternKey === 'wedge-falling') patternKey = 'falling-wedge';
                        
                        const patternDetails = PATTERN_DETAILS[patternKey];
                        
                        // Get pattern name from library or use formatted base ID
                        const getPatternName = () => {
                          // Search through all categories in PATTERN_CATEGORIES to find the pattern
                          const allCategories = Object.values({
                            classical: { patterns: [] },
                            triangles: { patterns: [] },
                            // Add other categories as needed
                          });
                          
                          // Try to find pattern name from the pattern definitions
                          // Convert base ID to readable name (e.g., 'head_shoulders' -> 'Head & Shoulders')
                          return basePatternId
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        };
                        
                        const patternName = getPatternName();
                        
                        // Provide generic defaults for patterns not in PATTERN_DETAILS
                        const defaultRules = patternDetails ? {
                          entry: patternDetails.entry,
                          stopLoss: patternDetails.stopLoss,
                          target: patternDetails.targetMethodology
                        } : {
                          entry: "Define your entry criteria for this pattern",
                          stopLoss: "Set stop loss based on pattern structure and risk tolerance",
                          target: "Determine target based on pattern measurement and risk-reward ratio"
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
                            className="border border-border rounded-lg bg-card overflow-hidden"
                          >
                            <CollapsibleTrigger asChild>
                              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                  <TrendingUp className="h-5 w-5 text-primary" />
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {patternName}
                                  </h3>
                                  {customRules && (
                                    <Badge variant="secondary" className="text-xs">Customized</Badge>
                                  )}
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="px-6 pb-6 pt-2 border-t border-border">
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
                  </div>
                ) : (
                  <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please select chart patterns from the Pattern Library first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Confirmation Button for Entry & Exit Rules */}
                {strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled) && (
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={() => {
                        setConfirmedSteps(prev => new Set([...prev, 1]));
                        toast.success('Entry & Exit Rules confirmed');
                      }}
                      disabled={confirmedSteps.has(1)}
                      size="lg"
                    >
                      {confirmedSteps.has(1) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Rules Confirmed
                        </>
                      ) : (
                        'Confirm Entry & Exit Rules'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Position Management</h3>
                <PositionManagementSettings
                  rules={strategy.positionManagement || DEFAULT_POSITION_MANAGEMENT}
                  onChange={(rules) => updateStrategy('positionManagement', rules)}
                  selectedPatterns={strategy.patterns.filter(p => p.enabled).map(p => p.id)}
                />
                
                {/* Confirmation Button for Position Management */}
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => {
                      setConfirmedSteps(prev => new Set([...prev, 2]));
                      toast.success('Position Management settings confirmed');
                    }}
                    disabled={confirmedSteps.has(2)}
                    size="lg"
                  >
                    {confirmedSteps.has(2) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Settings Confirmed
                      </>
                    ) : (
                      'Confirm Position Management'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Target & Stop Loss</h3>
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
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please select chart patterns from the Pattern Library first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Backtest</h3>
                {canBacktest() ? (
                  <div className="space-y-4">
                    {/* Backtest Period Selection */}
                    <div className="space-y-4">
                      <Label>Quick Select Period</Label>
                      <Select
                        value={strategy.backtestPeriod?.preset || '1year'}
                        onValueChange={handlePresetChange}
                      >
                        <SelectTrigger>
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

                      {/* Custom Date Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={strategy.backtestPeriod?.startDate || ''}
                            onChange={(e) => updateStrategy('backtestPeriod', {
                              ...strategy.backtestPeriod,
                              startDate: e.target.value,
                              preset: 'custom'
                            })}
                            max={strategy.backtestPeriod?.endDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date">End Date</Label>
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
                          />
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <strong>Testing Period:</strong> {strategy.backtestPeriod?.startDate} to {strategy.backtestPeriod?.endDate}
                        {strategy.backtestPeriod?.startDate && strategy.backtestPeriod?.endDate && (
                          <span className="ml-2">
                            ({Math.ceil((new Date(strategy.backtestPeriod.endDate).getTime() - new Date(strategy.backtestPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24))} days)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Backtest Engine */}
                    <EnhancedBacktestEngine
                      strategy={strategy}
                      results={backtestResults}
                      isRunning={isBacktesting}
                      onBacktest={handleBacktest}
                    />

                    {backtestResults && (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Backtest Complete
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Return</p>
                              <p className="text-2xl font-bold text-green-600">
                                {backtestResults.totalReturn > 0 ? '+' : ''}{backtestResults.totalReturn?.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Win Rate</p>
                              <p className="text-2xl font-bold">
                                {backtestResults.winRate?.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Trades</p>
                              <p className="text-2xl font-bold">
                                {backtestResults.totalTrades || backtestResults.trades?.length || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Profit Factor</p>
                              <p className="text-2xl font-bold">
                                {backtestResults.profitFactor?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please complete all previous steps first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Export Strategy</h3>
                {getStepCompletion(1) && getStepCompletion(2) && getStepCompletion(3) && getStepCompletion(4) ? (
                  <ExportPanel strategy={strategy} />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please complete all previous steps first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <Button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1 || !getStepCompletion(currentStep)}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>{strategy.patterns.length} Patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Target: {strategy.targetGainPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span>Stop: {strategy.stopLossPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Risk: {strategy.positionSizing.riskPerTrade}% / trade</span>
              </div>
              {backtestResults && (
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <span>Backtest Complete</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Last updated: {strategy.updated_at ? new Date(strategy.updated_at).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
});