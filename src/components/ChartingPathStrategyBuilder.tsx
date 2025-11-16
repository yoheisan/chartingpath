import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity, 
  TrendingUp,
  TrendingDown,
  Shield, 
  DollarSign, 
  Target, 
  Download,
  Play,
  Save,
  Share,
  Settings,
  Zap,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle,
  MoreVertical,
  SaveAll,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  patterns: any[]; // Selected chart patterns to trade
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
  initialStrategy?: ChartingPathStrategy;
  onSave?: (strategy: ChartingPathStrategy) => void;
  onBacktest?: (strategy: ChartingPathStrategy) => Promise<any>;
}

export const ChartingPathStrategyBuilder: React.FC<ChartingPathStrategyBuilderProps> = ({
  initialStrategy,
  onSave,
  onBacktest
}) => {
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
      positionManagement: DEFAULT_POSITION_MANAGEMENT,
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
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [renameName, setRenameName] = useState('');
  const stepContentRef = useRef<HTMLDivElement>(null);

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

  const handleSaveAs = () => {
    if (!saveAsName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }
    const newStrategy = {
      ...strategy,
      id: undefined, // Remove ID to create new strategy
      name: saveAsName,
      created_at: new Date(),
      updated_at: new Date()
    };
    onSave?.(newStrategy);
    setShowSaveAsDialog(false);
    setSaveAsName('');
    toast.success(`Strategy saved as "${saveAsName}"!`);
  };

  const handleRename = () => {
    if (!renameName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }
    const renamedStrategy = {
      ...strategy,
      name: renameName,
      updated_at: new Date()
    };
    setStrategy(renamedStrategy);
    onSave?.(renamedStrategy);
    setShowRenameDialog(false);
    setRenameName('');
    toast.success(`Strategy renamed to "${renameName}"!`);
  };

  const openSaveAsDialog = () => {
    setSaveAsName(strategy.name + ' (Copy)');
    setShowSaveAsDialog(true);
  };

  const openRenameDialog = () => {
    setRenameName(strategy.name);
    setShowRenameDialog(true);
  };

  const getStepCompletion = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Market & Timeframe
        return strategy.market?.instrument && strategy.market?.timeframes?.length > 0 && strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled);
      case 1: // Entry & Exit Rules (optional - always marked complete)
        return true; // Rules are optional, default rules are always available
      case 2: // Position Management
        return strategy.positionManagement !== undefined;
      case 3: // Target & Stop Loss
        return strategy.targetGainPercent > 0 && strategy.stopLossPercent > 0;
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

      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                Chart Pattern Strategy Builder
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Build pattern-based strategies by selecting chart patterns, setting target % gains and stop loss %, then backtest and export
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">
                Professional v2.0
              </Badge>
              <Badge 
                variant={getCompletionPercentage() === 100 ? "default" : "secondary"}
                className="px-3"
              >
                {Math.round(getCompletionPercentage())}% Complete
              </Badge>
              
              {/* Save Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="ml-2">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                    <MoreVertical className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Strategy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openSaveAsDialog}>
                    <SaveAll className="w-4 h-4 mr-2" />
                    Save As...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openRenameDialog}>
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Strategy Configuration Progress</span>
              <span>{Math.round(getCompletionPercentage())}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step-Based Builder Interface */}
      <Card ref={stepContentRef}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Professional Strategy Builder</CardTitle>
          <p className="text-sm text-muted-foreground">
            Follow the step-by-step process to build your professional trading strategy
          </p>
        </CardHeader>
        <CardContent>
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
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold uppercase tracking-wider">STEP 1</h3>
                </div>
                
                {/* Instrument & Timeframe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold uppercase">INSTRUMENT & TIMEFRAME</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarketStep
                      answers={{ market: strategy.market }}
                      onAnswersChange={(_, data) => updateStrategy('market', data)}
                      subscriptionPlan="professional"
                    />
                  </CardContent>
                </Card>

                {/* Pattern Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold uppercase">SELECT CHART PATTERN</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Choose at least one pattern to enable the Next button
                    </p>
                  </CardHeader>
                  <CardContent>
                    <PatternLibrary
                      patterns={strategy.patterns}
                      onChange={(patterns) => updateStrategy('patterns', patterns)}
                    />
                  </CardContent>
                </Card>

                {/* Validation Notice */}
                {(!strategy.market?.instrument || !strategy.patterns.some(p => p.enabled)) && (
                  <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="font-medium">
                          {!strategy.market?.instrument && 'Select an instrument'}
                          {!strategy.market?.instrument && !strategy.patterns.some(p => p.enabled) && ' and '}
                          {!strategy.patterns.some(p => p.enabled) && 'enable at least one pattern'}
                          {' to proceed'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 2: Configure Entry & Exit Rules</h3>
                </div>
                {strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled) ? (
                  <div className="space-y-4">
                    {strategy.patterns
                      .filter(p => p.enabled)
                      .map((pattern) => {
                        // Extract base pattern name (remove timestamp suffix)
                        const basePatternId = pattern.id.replace(/_\d+$/, '');
                        // Convert underscores to hyphens and "inverse" to "inverted"
                        const patternKey = basePatternId
                          .replace(/_/g, '-')
                          .replace(/^inverse-/, 'inverted-');
                        const patternDetails = PATTERN_DETAILS[patternKey];
                        
                        if (!patternDetails) {
                          console.warn('No pattern details found for:', patternKey, 'from pattern ID:', pattern.id);
                          return null;
                        }

                        const defaultRules = {
                          entry: patternDetails.entry,
                          stopLoss: patternDetails.stopLoss,
                          target: patternDetails.targetMethodology
                        };

                        const customRules = strategy.patternRules?.[pattern.id];

                        return (
                          <div key={pattern.id} className="space-y-4 p-6 border border-border rounded-lg bg-card">
                            <div className="flex items-center gap-3 pb-3 border-b border-border">
                              <TrendingUp className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-semibold text-foreground">
                                {pattern.name}
                              </h3>
                            </div>
                            <PatternRulesEditor
                              patternName={pattern.name}
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 3: Position Management</h3>
                </div>
                <PositionManagementSettings
                  rules={strategy.positionManagement || DEFAULT_POSITION_MANAGEMENT}
                  onChange={(rules) => updateStrategy('positionManagement', rules)}
                  selectedPatterns={strategy.patterns.filter(p => p.enabled).map(p => p.id)}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 4: Set Target % Gain & Stop Loss %</h3>
                </div>
                {strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled) ? (
                  <TargetStopLossSettings
                    targetGainPercent={strategy.targetGainPercent}
                    stopLossPercent={strategy.stopLossPercent}
                    positionSizing={strategy.positionSizing}
                    onChange={(data) => {
                      updateStrategy('targetGainPercent', data.targetGainPercent);
                      updateStrategy('stopLossPercent', data.stopLossPercent);
                      updateStrategy('positionSizing', data.positionSizing);
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
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 5: Backtest Strategy</h3>
                </div>
                {canBacktest() ? (
                  <div className="space-y-4">
                    {/* Backtest Period Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Backtest Period</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Select the time period for testing your strategy
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Preset Options */}
                        <div>
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
                        </div>

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
                      </CardContent>
                    </Card>

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
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 6: Export Strategy</h3>
                </div>
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

      {/* Save As Dialog */}
      <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Strategy As</DialogTitle>
            <DialogDescription>
              Create a copy of this strategy with a new name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter strategy name"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAs()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveAsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAs}>
              <SaveAll className="w-4 h-4 mr-2" />
              Save As
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Strategy</DialogTitle>
            <DialogDescription>
              Give this strategy a new name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter new name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};