import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Save, 
  Zap, 
  Crown, 
  Lock,
  Settings,
  Code2,
  History,
  TrendingUp,
  Plus,
  X,
  Move,
  Target,
  BarChart3,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Info,
  HelpCircle,
  LogIn
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

const AIBuilder = () => {
  const navigate = useNavigate();
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [instrumentCategory, setInstrumentCategory] = useState("");
  
  const [strategy, setStrategy] = useState("");
  const [baseTemplate, setBaseTemplate] = useState("");
  const [timeframe, setTimeframe] = useState("15m");
  const [confirmTimeframe, setConfirmTimeframe] = useState("");
  const [mtfEnabled, setMtfEnabled] = useState(false);
  const [riskType, setRiskType] = useState("atr");
  const [atrLength, setAtrLength] = useState("14");
  const [atrSL, setAtrSL] = useState("1.5");
  const [atrTP, setAtrTP] = useState("3.0");
  const [volumeFilter, setVolumeFilter] = useState(false);
  const [trendEmaLength, setTrendEmaLength] = useState("50");
  const [alertsOnClose, setAlertsOnClose] = useState(true);
  const [multiCondition, setMultiCondition] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Visual Condition Builder State
  const [builderMode, setBuilderMode] = useState<"natural" | "visual">("natural");
  const [starsAligned, setStarsAligned] = useState(true); // AND mode by default
  const [indicatorConditions, setIndicatorConditions] = useState<IndicatorCondition[]>([]);
  const [priceActionConditions, setPriceActionConditions] = useState<PriceActionCondition[]>([]);
  const [timeConditions, setTimeConditions] = useState<TimeCondition[]>([]);
  const [executionAction, setExecutionAction] = useState<"long" | "short">("long");
  const [useDirectionalMapping, setUseDirectionalMapping] = useState(false);
  const [trailingStop, setTrailingStop] = useState(false);
  const [trailingStopValue, setTrailingStopValue] = useState("1.5");
  const [earlyExit, setEarlyExit] = useState(false);

  // Types for condition builder
  interface IndicatorCondition {
    id: string;
    indicator: string;
    leftParams: Record<string, any>;
    operator: string;
    rightOperand: string;
    rightValue?: string;
    timeframe?: string;
    isRelativeCondition?: boolean;
    point?: {
      mode: "n_bars_ago" | "session_open" | "specific_time" | "previous_close" | "day_open";
      n?: number;
      session?: string;
      time?: string;
      tz?: string;
    };
  }

  interface PriceActionCondition {
    id: string;
    type: "close_vs_open" | "intraday_range" | "candle_pattern" | "sr_touch";
    params: Record<string, any>;
  }

  interface TimeCondition {
    id: string;
    type: "session_window" | "day_filter" | "bar_close";
    params: Record<string, any>;
  }
  
  // Real user authentication and profile data
  const { 
    user, 
    profile, 
    loading: profileLoading, 
    getTierDisplayName, 
    hasFeatureAccess, 
    getGenerationQuota,
    isAuthenticated,
    subscriptionPlan 
  } = useUserProfile();
  
  const quotaUsed = 5; // This would come from actual usage tracking
  const quotaLimit = getGenerationQuota();

  function getTierPlatforms(plan: string): string[] {
    switch (plan) {
      case "pro": return ["pine"];
      case "pro_plus": return ["pine", "mql4", "mql5"];
      case "elite": return ["pine", "mql4", "mql5", "ctrader", "ninjatrader"];
      default: return [];
    }
  }

  // Financial Instruments Data
  const instrumentCategories = {
    fx: {
      label: "Foreign Exchange (FX)",
      instruments: [
        "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
        "EURJPY", "GBPJPY", "AUDJPY", "EURGBP", "EURAUD", "EURCHF", "GBPAUD",
        "GBPCHF", "AUDCAD", "AUDCHF", "CADCHF", "CADJPY", "CHFJPY", "NZDJPY"
      ]
    },
    crypto: {
      label: "Cryptocurrency",
      instruments: [
        "BTCUSD", "ETHUSD", "ADAUSD", "SOLUSD", "DOTUSD", "AVAXUSD", "MATICUSD",
        "LINKUSD", "UNIUSD", "LTCUSD", "BCHUSD", "XLMUSD", "XRPUSD", "DOGEUSD",
        "SHIBUSD", "APEUSD", "SANDUSD", "MANAUSD", "ALGOUSD", "ATOMUSD"
      ]
    },
    stocks: {
      label: "US Major Indices & Stocks",
      instruments: [
        "SPY", "QQQ", "IWM", "DIA", "VTI", "AAPL", "MSFT", "GOOGL", "AMZN",
        "TSLA", "META", "NVDA", "NFLX", "AMD", "INTC", "CRM", "ORCL", "ADBE",
        "PYPL", "UBER", "ABNB", "COIN", "ROKU", "ZM", "SHOP", "SQ", "TWTR"
      ]
    }
  };

  const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
  const templates = [
    "MACD",
    "RSI", 
    "Bollinger Bands",
    "Moving Average",
    "Breakout",
    "Candlestick",
    "VPT",
    "Custom"
  ];

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to generate strategies.");
      return;
    }

    if (quotaUsed >= quotaLimit) {
      toast.error(`Daily quota exceeded (${quotaLimit} generations). Quota resets at 00:00 JST.`);
      return;
    }

    if (!selectedInstrument) {
      toast.error("Please select a financial instrument first.");
      return;
    }

    if (!strategy.trim()) {
      toast.error("Please describe your strategy first.");
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock generated Pine Script code
    const mockCode = `// AI Generated Strategy for ${selectedInstrument}: ${strategy.substring(0, 50)}...
// Generated by Market Leap Partners AI Builder
// Disclaimer: Educational purposes only. Not financial advice.

//@version=5
strategy("AI Strategy - ${selectedInstrument}", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=10)

// Parameters
ema_fast = input.int(50, "Fast EMA")
ema_slow = input.int(200, "Slow EMA")
rsi_length = input.int(14, "RSI Length")
atr_length = input.int(${atrLength}, "ATR Length")
atr_sl_mult = input.float(${atrSL}, "ATR SL Multiplier")
atr_tp_mult = input.float(${atrTP}, "ATR TP Multiplier")

// Indicators  
ema_fast_line = ta.ema(close, ema_fast)
ema_slow_line = ta.ema(close, ema_slow)
rsi = ta.rsi(close, rsi_length)
atr = ta.atr(atr_length)

// Entry Conditions
long_condition = ta.crossover(ema_fast_line, ema_slow_line) and rsi > 50
short_condition = ta.crossunder(ema_fast_line, ema_slow_line) and rsi < 50

// Strategy Logic
if long_condition
    if strategy.position_size < 0
        strategy.close("Short")
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=close - atr * atr_sl_mult, limit=close + atr * atr_tp_mult)

if short_condition
    if strategy.position_size > 0
        strategy.close("Long")  
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=close + atr * atr_sl_mult, limit=close - atr * atr_tp_mult)

// Alerts
${alertsOnClose ? 'alertcondition(long_condition, "Long Signal", "Long entry signal detected")' : ''}
${alertsOnClose ? 'alertcondition(short_condition, "Short Signal", "Short entry signal detected")' : ''}

// Plots
plot(ema_fast_line, "Fast EMA", color.blue)
plot(ema_slow_line, "Slow EMA", color.red)`;

    setGeneratedCode(mockCode);
    setIsGenerating(false);
    toast.success("Strategy generated successfully!");
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleDownload = () => {
    // Mock download functionality
    toast.success("Strategy bundle downloaded!");
  };

  const handleSave = () => {
    if (!hasFeatureAccess('save_library')) {
      toast.error("Save to Library is available for Pro+ and Elite tiers only.");
      return;
    }
    toast.success("Strategy saved to your library!");
  };

  const handleOpenInForge = () => {
    // Build current strategy AST from visual builder state
    const currentAST = {
      type: "strategy",
      name: strategy || `${selectedInstrument} Strategy`,
      conditions: [
        ...indicatorConditions.map(cond => ({
          id: cond.id,
          type: cond.isRelativeCondition ? "relative" : "indicator",
          lhs: {
            ind: cond.indicator,
            params: cond.leftParams,
            tf: cond.timeframe
          },
          operator: cond.operator,
          rhs: cond.rightOperand === "indicator" ? {
            ind: cond.rightValue?.split('(')[0] || "SMA",
            params: { len: parseInt(cond.rightValue?.match(/\d+/)?.[0] || "50") }
          } : {
            threshold: parseFloat(cond.rightValue || "0")
          },
          point: cond.point,
          label: `${cond.indicator} ${cond.operator} ${cond.rightValue}`
        })),
        ...priceActionConditions.map(cond => ({
          id: cond.id,
          type: "price_action",
          ...cond
        })),
        ...timeConditions.map(cond => ({
          id: cond.id,
          type: "time",
          ...cond
        }))
      ],
      logic: starsAligned ? "and" : "or",
      execution: {
        mode: useDirectionalMapping ? "directional_mapping" : executionAction
      },
      risk: {
        type: riskType as "atr" | "percentage",
        stopLoss: parseFloat(atrSL),
        takeProfit: parseFloat(atrTP),
        trailingStop,
        trailingStopValue: parseFloat(trailingStopValue)
      },
      timeframe,
      confirmTimeframe: mtfEnabled ? confirmTimeframe : undefined,
      filters: {
        volume: volumeFilter,
        trend: !!trendEmaLength,
        trendEmaLength: parseInt(trendEmaLength)
      }
    };

    // Navigate to Forge with strategy AST
    navigate('/forge', { state: { strategyAST: currentAST } });
  };

  // Condition Builder Helper Functions
  const addIndicatorCondition = () => {
    const newCondition: IndicatorCondition = {
      id: Date.now().toString(),
      indicator: "EMA",
      leftParams: { period: 15, source: "close" },
      operator: "crosses_up",
      rightOperand: "indicator",
      rightValue: "50",
      timeframe: timeframe,
      isRelativeCondition: false
    };
    setIndicatorConditions([...indicatorConditions, newCondition]);
  };

  const addRelativeCondition = (preset?: string) => {
    let newCondition: IndicatorCondition;
    
    switch (preset) {
      case "sma_cross_past":
        newCondition = {
          id: Date.now().toString(),
          indicator: "SMA",
          leftParams: { period: 15, source: "close" },
          operator: "was_below",
          rightOperand: "indicator",
          rightValue: "SMA(200)",
          timeframe: timeframe,
          isRelativeCondition: true,
          point: { mode: "n_bars_ago", n: 5 }
        };
        break;
      case "rsi_session_open":
        newCondition = {
          id: Date.now().toString(),
          indicator: "RSI",
          leftParams: { period: 14, source: "close" },
          operator: "was_above",
          rightOperand: "value",
          rightValue: "50",
          timeframe: timeframe,
          isRelativeCondition: true,
          point: { mode: "session_open", session: "ny" }
        };
        break;
      case "price_vwap_time":
        newCondition = {
          id: Date.now().toString(),
          indicator: "Price",
          leftParams: { source: "close" },
          operator: "was_below",
          rightOperand: "indicator",
          rightValue: "VWAP",
          timeframe: timeframe,
          isRelativeCondition: true,
          point: { mode: "specific_time", time: "10:00", tz: "user" }
        };
        break;
      case "ema_previous_close":
        newCondition = {
          id: Date.now().toString(),
          indicator: "EMA",
          leftParams: { period: 21, source: "close" },
          operator: "was_below",
          rightOperand: "indicator",
          rightValue: "EMA(50)",
          timeframe: timeframe,
          isRelativeCondition: true,
          point: { mode: "previous_close" }
        };
        break;
      default:
        newCondition = {
          id: Date.now().toString(),
          indicator: "SMA",
          leftParams: { period: 15, source: "close" },
          operator: "was_below",
          rightOperand: "indicator",
          rightValue: "200",
          timeframe: timeframe,
          isRelativeCondition: true,
          point: { mode: "n_bars_ago", n: 1 }
        };
    }
    
    setIndicatorConditions([...indicatorConditions, newCondition]);
  };

  const addPriceActionCondition = () => {
    const newCondition: PriceActionCondition = {
      id: Date.now().toString(),
      type: "close_vs_open",
      params: { direction: "up", threshold: 1.0, unit: "percent" }
    };
    setPriceActionConditions([...priceActionConditions, newCondition]);
  };

  const addTimeCondition = () => {
    const newCondition: TimeCondition = {
      id: Date.now().toString(),
      type: "session_window",
      params: { session: "custom", startTime: "09:30", endTime: "11:30", duration: 120 }
    };
    setTimeConditions([...timeConditions, newCondition]);
  };

  const removeIndicatorCondition = (id: string) => {
    setIndicatorConditions(indicatorConditions.filter(c => c.id !== id));
  };

  const removePriceActionCondition = (id: string) => {
    setPriceActionConditions(priceActionConditions.filter(c => c.id !== id));
  };

  const removeTimeCondition = (id: string) => {
    setTimeConditions(timeConditions.filter(c => c.id !== id));
  };

  const updateIndicatorCondition = (id: string, updates: Partial<IndicatorCondition>) => {
    setIndicatorConditions(indicatorConditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const indicators = [
    { value: "EMA", label: "EMA", params: ["period", "source"] },
    { value: "SMA", label: "SMA", params: ["period", "source"] },
    { value: "MACD", label: "MACD", params: ["fast", "slow", "signal", "line"] },
    { value: "RSI", label: "RSI", params: ["period", "source"] },
    { value: "Stochastic", label: "Stochastic", params: ["k_period", "d_period", "line"] },
    { value: "Bollinger", label: "Bollinger Bands", params: ["period", "deviation", "line"] },
    { value: "VWAP", label: "VWAP", params: [] },
    { value: "ATR", label: "ATR", params: ["period"] },
    { value: "VPT", label: "VPT", params: ["smoothing"] },
    { value: "ADX", label: "ADX", params: ["period", "line"] },
    { value: "Ichimoku", label: "Ichimoku", params: ["tenkan", "kijun", "senkou", "line"] },
    { value: "CCI", label: "CCI", params: ["period", "source"] }
  ];

  const operators = [
    { value: "crosses_up", label: "Crosses Up" },
    { value: "crosses_down", label: "Crosses Down" },
    { value: "above", label: "Above (>)" },
    { value: "below", label: "Below (<)" },
    { value: "equals", label: "Equals (=)" },
    { value: "inside_band", label: "Inside Band" },
    { value: "outside_band", label: "Outside Band" },
    { value: "slope_up", label: "Slope Up" },
    { value: "slope_down", label: "Slope Down" },
    { value: "was_above", label: "Was Above" },
    { value: "was_below", label: "Was Below" },
    { value: "was_equal", label: "Was Equal" }
  ];

  const pointModes = [
    { value: "n_bars_ago", label: "N Bars Ago" },
    { value: "session_open", label: "At Session Open" },
    { value: "specific_time", label: "At Specific Time" },
    { value: "previous_close", label: "At Previous Close" },
    { value: "day_open", label: "At Day Open" }
  ];

  const sessions = [
    { value: "tokyo", label: "Tokyo" },
    { value: "london", label: "London" },
    { value: "ny", label: "New York" },
    { value: "custom", label: "Custom" }
  ];

  // Show loading state while fetching user profile
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="text-center py-16">
            <Lock className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-8">
              Please log in to access the AI Strategy Builder and create professional trading strategies.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            
            <Badge variant="outline" className="flex items-center gap-2">
              <Crown className="h-3 w-3" />
              {getTierDisplayName} - {quotaUsed}/{quotaLimit} used today
            </Badge>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              AI Strategy Builder
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform your trading ideas into professional-grade code. Select your financial instrument and describe your strategy in plain English 
              to get Pine Script, MQL4, and MQL5 implementations instantly.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Panel A: Strategy Configuration */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Strategy Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   
                  {/* Financial Instrument Selection - Required First */}
                  <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">Select Financial Instrument</Label>
                      <Badge variant="secondary">Required</Badge>
                    </div>
                     
                    {/* Instrument Category Selection */}
                    <div>
                      <Label className="text-sm font-medium">Market Category</Label>
                      <Select value={instrumentCategory} onValueChange={setInstrumentCategory}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose market category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {Object.entries(instrumentCategories).map(([key, category]) => (
                            <SelectItem key={key} value={key}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Specific Instrument Selection */}
                    {instrumentCategory && (
                      <div>
                        <Label className="text-sm font-medium">Specific Instrument</Label>
                        <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose instrument" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50 max-h-60">
                            {instrumentCategories[instrumentCategory as keyof typeof instrumentCategories]?.instruments.map(instrument => (
                              <SelectItem key={instrument} value={instrument}>
                                {instrument}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedInstrument && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span>Selected: {selectedInstrument}</span>
                      </div>
                    )}
                  </div>

                  {!selectedInstrument && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">Select an Instrument to Continue</p>
                      <p className="text-sm">Choose your target financial instrument to build a tailored strategy</p>
                    </div>
                  )}

                  {/* Strategy Configuration - Only show when instrument is selected */}
                  {selectedInstrument && (
                    <>
                      {/* Mode Selection */}
                      <Tabs value={builderMode} onValueChange={(value: "natural" | "visual") => setBuilderMode(value)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="natural">Natural Language</TabsTrigger>
                          <TabsTrigger value="visual">Visual Builder</TabsTrigger>
                        </TabsList>
                        
                        {/* Natural Language Tab */}
                        <TabsContent value="natural" className="space-y-6 mt-6">
                          {/* Strategy Description */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Label htmlFor="strategy">Describe Your Strategy</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Describe your trading strategy in plain English. Include entry conditions, indicators, timeframes, and risk management. Example: "15m BTC strategy using EMA crossover with RSI confirmation and ATR-based stops."</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Textarea
                              id="strategy"
                              value={strategy}
                              onChange={(e) => setStrategy(e.target.value)}
                              placeholder={`Describe your ${selectedInstrument} strategy in plain English... e.g., '15m ${selectedInstrument} strategy: EMA 50/200 trend filter, MACD cross for entries, RSI > 50, ATR SL 1.5×, TP 3×, alerts on close.'`}
                              className="mt-2 min-h-[100px]"
                            />
                          </div>

                          {/* Base Template */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Base Template (Optional)</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Choose a pre-built template to start with. Templates provide common indicator setups like MACD crossovers, RSI signals, or Bollinger Band strategies as a foundation for your custom strategy.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Select value={baseTemplate} onValueChange={setBaseTemplate}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose a template" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border z-50">
                                {templates.map(template => (
                                  <SelectItem key={template} value={template.toLowerCase()}>
                                    {template}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>

                        {/* Visual Builder Tab */}
                        <TabsContent value="visual" className="space-y-6 mt-6">
                          {hasFeatureAccess('visual_builder') ? (
                            <div className="space-y-6">
                              {/* Stars Aligned Mode */}
                              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  <span className="font-medium">Stars Aligned Mode</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p><strong>Stars Aligned (AND):</strong> ALL conditions must be true for a signal. <strong>OR Mode:</strong> ANY condition can trigger a signal. Use AND for more selective entries, OR for more frequent signals.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Switch 
                                  checked={starsAligned}
                                  onCheckedChange={setStarsAligned}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground -mt-4">
                                {starsAligned ? "ALL conditions must be true (AND)" : "ANY condition can trigger (OR)"}
                              </p>

                              {/* Indicator Conditions */}
                              <Collapsible defaultOpen>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                                    <div className="flex items-center gap-2">
                                      <BarChart3 className="h-4 w-4" />
                                      <span>Indicator Conditions</span>
                                      <Badge variant="secondary">{indicatorConditions.length}</Badge>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>Add technical indicator conditions like EMA crossovers, RSI levels, MACD signals, Bollinger Band touches, etc. Each condition can use different timeframes for multi-timeframe analysis.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3">
                                   {indicatorConditions.map((condition, index) => (
                                     <Card key={condition.id} className="p-3 bg-muted/30">
                                       <div className="flex items-center gap-2 mb-2">
                                         <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                         {condition.isRelativeCondition && (
                                           <Badge variant="secondary" className="text-xs">Relative @ Point</Badge>
                                         )}
                                         <Select value={condition.indicator} onValueChange={(value) => updateIndicatorCondition(condition.id, { indicator: value })}>
                                           <SelectTrigger className="h-8 text-xs flex-1">
                                             <SelectValue />
                                           </SelectTrigger>
                                           <SelectContent className="bg-background border z-50">
                                             {indicators.map(ind => (
                                               <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                                             ))}
                                           </SelectContent>
                                         </Select>
                                         <Button 
                                           variant="ghost" 
                                           size="sm"
                                           onClick={() => removeIndicatorCondition(condition.id)}
                                         >
                                           <X className="h-3 w-3" />
                                         </Button>
                                       </div>
                                       
                                       <div className="grid grid-cols-2 gap-2 text-xs">
                                         <Input 
                                           placeholder="Period (e.g., 14)" 
                                           value={condition.leftParams?.period || ""}
                                           onChange={(e) => updateIndicatorCondition(condition.id, { 
                                             leftParams: { ...condition.leftParams, period: e.target.value } 
                                           })}
                                         />
                                         <Select 
                                           value={condition.operator} 
                                           onValueChange={(value) => updateIndicatorCondition(condition.id, { operator: value })}
                                         >
                                           <SelectTrigger className="h-8">
                                             <SelectValue />
                                           </SelectTrigger>
                                           <SelectContent className="bg-background border z-50">
                                             {operators.filter(op => condition.isRelativeCondition ? 
                                               op.value.startsWith('was_') : !op.value.startsWith('was_')
                                             ).map(op => (
                                               <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                             ))}
                                           </SelectContent>
                                         </Select>
                                       </div>
                                       
                                       <div className="flex gap-2 mt-2 text-xs">
                                         <Input 
                                           placeholder="Value/Level" 
                                           value={condition.rightValue || ""}
                                           onChange={(e) => updateIndicatorCondition(condition.id, { rightValue: e.target.value })}
                                           className="flex-1" 
                                         />
                                         <Select value={condition.timeframe || timeframe}>
                                           <SelectTrigger className="w-20 h-8">
                                             <SelectValue />
                                           </SelectTrigger>
                                           <SelectContent className="bg-background border z-50">
                                             {timeframes.map(tf => (
                                               <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                                             ))}
                                           </SelectContent>
                                         </Select>
                                       </div>

                                       {/* Point Configuration for Relative Conditions */}
                                       {condition.isRelativeCondition && (
                                         <div className="mt-3 p-2 bg-background/50 rounded border">
                                           <Label className="text-xs font-medium mb-2 block">Point Reference</Label>
                                           <div className="space-y-2">
                                             <Select 
                                               value={condition.point?.mode || "n_bars_ago"} 
                                               onValueChange={(value) => updateIndicatorCondition(condition.id, { 
                                                 point: { ...condition.point, mode: value as any }
                                               })}
                                             >
                                               <SelectTrigger className="h-8 text-xs">
                                                 <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent className="bg-background border z-50">
                                                 {pointModes.map(mode => (
                                                   <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                                                 ))}
                                               </SelectContent>
                                             </Select>

                                             {condition.point?.mode === "n_bars_ago" && (
                                               <Input
                                                 type="number"
                                                 placeholder="N (bars ago)"
                                                 value={condition.point?.n || ""}
                                                 onChange={(e) => updateIndicatorCondition(condition.id, {
                                                   point: { ...condition.point, n: parseInt(e.target.value) || 1 }
                                                 })}
                                                 className="h-8 text-xs"
                                                 min="1"
                                               />
                                             )}

                                             {condition.point?.mode === "session_open" && (
                                               <Select 
                                                 value={condition.point?.session || "ny"} 
                                                 onValueChange={(value) => updateIndicatorCondition(condition.id, {
                                                   point: { ...condition.point, session: value }
                                                 })}
                                               >
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent className="bg-background border z-50">
                                                   {sessions.map(session => (
                                                     <SelectItem key={session.value} value={session.value}>{session.label}</SelectItem>
                                                   ))}
                                                 </SelectContent>
                                               </Select>
                                             )}

                                             {condition.point?.mode === "specific_time" && (
                                               <Input
                                                 type="time"
                                                 value={condition.point?.time || ""}
                                                 onChange={(e) => updateIndicatorCondition(condition.id, {
                                                   point: { ...condition.point, time: e.target.value, tz: "user" }
                                                 })}
                                                 className="h-8 text-xs"
                                               />
                                             )}
                                           </div>
                                         </div>
                                       )}
                                     </Card>
                                   ))}

                                   {/* Quick-add chips */}
                                   <div className="space-y-2">
                                     <Label className="text-xs text-muted-foreground">Quick Add Patterns</Label>
                                     <div className="flex flex-wrap gap-1">
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         onClick={() => addRelativeCondition("sma_cross_past")}
                                         className="h-6 text-xs px-2"
                                       >
                                         SMA(15) was below SMA(200) N=5
                                       </Button>
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         onClick={() => addRelativeCondition("rsi_session_open")}
                                         className="h-6 text-xs px-2"
                                       >
                                         RSI(14) was above 50 at session open
                                       </Button>
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         onClick={() => addRelativeCondition("price_vwap_time")}
                                         className="h-6 text-xs px-2"
                                       >
                                         Price was below VWAP at 10:00
                                       </Button>
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         onClick={() => addRelativeCondition("ema_previous_close")}
                                         className="h-6 text-xs px-2"
                                       >
                                         EMA(21) was below EMA(50) at previous close
                                       </Button>
                                     </div>
                                   </div>
                                   
                                   <div className="flex gap-2">
                                     <Button 
                                       variant="outline" 
                                       size="sm" 
                                       onClick={addIndicatorCondition}
                                       className="flex-1"
                                     >
                                       <Plus className="h-3 w-3 mr-2" />
                                       Add Indicator Condition
                                     </Button>
                                     <Button 
                                       variant="outline" 
                                       size="sm" 
                                       onClick={() => addRelativeCondition()}
                                       className="flex-1"
                                     >
                                       <History className="h-3 w-3 mr-2" />
                                       Add Relative @ Point
                                     </Button>
                                   </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Price Action Conditions */}
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4" />
                                      <span>Price Action</span>
                                      <Badge variant="secondary">{priceActionConditions.length}</Badge>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>Add price action conditions like candle patterns (hammer, doji), support/resistance touches, breakouts, or price vs moving average relationships.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3">
                                  {priceActionConditions.map((condition, index) => (
                                    <Card key={condition.id} className="p-3 bg-muted/30">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                        <Select value={condition.type}>
                                          <SelectTrigger className="h-8 text-xs flex-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-background border z-50">
                                            <SelectItem value="close_vs_open">Close vs Open</SelectItem>
                                            <SelectItem value="candle_pattern">Candle Pattern</SelectItem>
                                            <SelectItem value="sr_touch">S/R Touch</SelectItem>
                                            <SelectItem value="breakout">Breakout</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => removePriceActionCondition(condition.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <Input placeholder="Direction" />
                                        <Input placeholder="Threshold %" />
                                      </div>
                                    </Card>
                                  ))}
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={addPriceActionCondition}
                                    className="w-full"
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
                                    Add Price Action
                                  </Button>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Time & Session Conditions */}
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>Time & Session</span>
                                      <Badge variant="secondary">{timeConditions.length}</Badge>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>Add time-based filters like session windows (first 2 hours of London/NY), specific time ranges (09:30-11:30), day filters (weekdays only), or bar close requirements.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3">
                                  {timeConditions.map((condition, index) => (
                                    <Card key={condition.id} className="p-3 bg-muted/30">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                        <Select value={condition.type}>
                                          <SelectTrigger className="h-8 text-xs flex-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-background border z-50">
                                            <SelectItem value="session_window">Session Window</SelectItem>
                                            <SelectItem value="day_filter">Day Filter</SelectItem>
                                            <SelectItem value="bar_close">Bar Close Only</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => removeTimeCondition(condition.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      {condition.type === "session_window" && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <Input placeholder="09:30" />
                                          <Input placeholder="11:30" />
                                        </div>
                                      )}
                                    </Card>
                                  ))}
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={addTimeCondition}
                                    className="w-full"
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
                                    Add Time Condition
                                  </Button>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Execution Panel */}
                              <Card className="p-4 bg-muted/30">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Execution & Risk
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>Configure how trades are executed when conditions are met. Set direction (long/short), enable directional mapping, add trailing stops, and configure early exit rules.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </h4>
                                 <div className="space-y-4">
                                   <div>
                                     <div className="flex items-center justify-between mb-1">
                                       <Label className="text-sm">Action on Trigger</Label>
                                       <Tooltip>
                                         <TooltipTrigger asChild>
                                           <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                         </TooltipTrigger>
                                         <TooltipContent className="max-w-xs">
                                           <p>Choose whether conditions trigger long entries, short entries, or use directional mapping where bullish conditions = long, bearish conditions = short.</p>
                                         </TooltipContent>
                                       </Tooltip>
                                     </div>
                                     {!useDirectionalMapping && (
                                       <Select value={executionAction} onValueChange={(value: "long" | "short") => setExecutionAction(value)}>
                                         <SelectTrigger>
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent className="bg-background border z-50">
                                           <SelectItem value="long">Enter Long</SelectItem>
                                           <SelectItem value="short">Enter Short</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     )}
                                     {useDirectionalMapping && (
                                       <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                         Directional mapping enabled: Cross up/Above → Long, Cross down/Below → Short
                                       </div>
                                     )}
                                   </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Directional Mapping</Label>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>When enabled, bullish indicator signals trigger long entries and bearish signals trigger short entries automatically.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <Switch 
                                      checked={useDirectionalMapping}
                                      onCheckedChange={setUseDirectionalMapping}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Trailing Stop</Label>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>Enable trailing stop-loss that follows price movement to lock in profits while protecting against reversals.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <Switch 
                                      checked={trailingStop}
                                      onCheckedChange={setTrailingStop}
                                    />
                                  </div>

                                  {trailingStop && (
                                    <div>
                                      <Label className="text-sm">Trailing Distance (ATR)</Label>
                                      <Input 
                                        type="number" 
                                        step="0.1"
                                        value={trailingStopValue}
                                        onChange={(e) => setTrailingStopValue(e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Early Exit Conditions</Label>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>Add early exit rules based on indicator signals, profit targets, or time-based exits.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <Switch 
                                      checked={earlyExit}
                                      onCheckedChange={setEarlyExit}
                                    />
                                  </div>
                                </div>
                              </Card>
                            </div>
                          ) : (
                            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                              <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                              <p className="text-lg font-medium">Visual Builder Locked</p>
                              <p className="text-sm text-muted-foreground mb-4">
                                Visual builder is available for Pro+ and Elite tiers only
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Current plan: {getTierDisplayName}
                              </p>
                              <Button asChild variant="outline" size="sm" className="mt-4">
                                <Link to="/pricing">
                                  <Crown className="h-4 w-4 mr-2" />
                                  Upgrade Plan
                                </Link>
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      {/* Generate Button */}
                      <Button 
                        onClick={handleGenerate}
                        disabled={isGenerating || quotaUsed >= quotaLimit}
                        className="w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                            Generating Strategy...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Generate Strategy
                          </>
                        )}
                      </Button>

                      {/* Open in Forge Button */}
                      <Button 
                        variant="outline"
                        onClick={handleOpenInForge}
                        className="w-full"
                        size="lg"
                      >
                        <Code2 className="h-4 w-4 mr-2" />
                        Open in Forge
                      </Button>

                      {quotaUsed >= quotaLimit && (
                        <p className="text-sm text-destructive text-center">
                          Daily quota exceeded. Resets at 00:00 JST.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel B: Generated Code */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Generated Strategy Code
                    {selectedInstrument && (
                      <Badge variant="outline" className="ml-2">
                        {selectedInstrument}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedCode ? (
                    <div className="space-y-4">
                      <div className="flex gap-2 mb-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(generatedCode)}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy Code
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDownload}
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download Bundle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSave}
                          disabled={!hasFeatureAccess('save_library')}
                        >
                          <Save className="h-3 w-3 mr-2" />
                          Save to Library
                          {!hasFeatureAccess('save_library') && <Lock className="h-3 w-3 ml-1" />}
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <pre className="bg-muted p-6 rounded-lg overflow-x-auto text-sm">
                          <code>{generatedCode}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Code2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                      <p>Select an instrument and describe your strategy to generate professional code</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-2">Important Trading Disclaimer</p>
                <p>
                  All generated strategies are for educational purposes only and do not constitute financial advice. 
                  Trading involves substantial risk of loss and is not suitable for all investors. Past performance 
                  does not guarantee future results. Always test strategies thoroughly before live trading.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AIBuilder;