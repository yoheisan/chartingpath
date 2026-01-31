import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Search, Filter, Code, ArrowLeft, Lock, Crown, Eye, AlertCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import MemberNavigation from "@/components/MemberNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Pattern to strategy mapping for deep-linking from Screener/PatternLab
const PATTERN_TO_STRATEGY_MAP: Record<string, string> = {
  'double-top': 'Reversal',
  'double-bottom': 'Reversal',
  'head-shoulders': 'Reversal',
  'inverse-head-shoulders': 'Reversal',
  'rising-wedge': 'Reversal',
  'falling-wedge': 'Reversal',
  'ascending-triangle': 'Breakout',
  'descending-triangle': 'Breakout',
  'symmetric-triangle': 'Breakout',
  'bull-flag': 'Trend Following',
  'bear-flag': 'Trend Following',
  'bullish-pennant': 'Trend Following',
  'bearish-pennant': 'Trend Following',
  'cup-handle': 'Breakout',
  'rectangle': 'Breakout',
  'channel-up': 'Trend Following',
  'channel-down': 'Trend Following',
};

const MemberScripts = () => {
  const [searchParams] = useSearchParams();
  const patternParam = searchParams.get('pattern');
  const symbolParam = searchParams.get('symbol');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const [previewScript, setPreviewScript] = useState<typeof scripts[0] | null>(null);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Apply pattern-based filtering when navigating from Screener/PatternLab
  useEffect(() => {
    if (patternParam) {
      const mappedStrategy = PATTERN_TO_STRATEGY_MAP[patternParam];
      if (mappedStrategy) {
        setSelectedStrategy(mappedStrategy);
        const patternName = patternParam.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setContextMessage(`Showing scripts relevant to "${patternName}" pattern${symbolParam ? ` for ${symbolParam}` : ''}`);
      }
    }
  }, [patternParam, symbolParam]);

  const scripts = [
    {
      id: 1,
      name: "Moving Average Crossover",
      description: "A classic trend-following strategy that generates signals when short-term and long-term moving averages cross. Works on any timeframe with built-in risk management, stop loss and take profit included.",
      language: "Pine Script",
      strategy: "Trend Following",
      downloads: 2847,
      rating: 4.9,
      premium: false,
      code: `//@version=5
strategy("Moving Average Crossover", overlay=true)

// Inputs
fastLength = input.int(9, "Fast MA Length", minval=1)
slowLength = input.int(21, "Slow MA Length", minval=1)
riskPercent = input.float(2.0, "Risk %", minval=0.1, maxval=100)

// Calculate Moving Averages
fastMA = ta.sma(close, fastLength)
slowMA = ta.sma(close, slowLength)

// Plot MAs
plot(fastMA, "Fast MA", color=color.blue, linewidth=2)
plot(slowMA, "Slow MA", color=color.red, linewidth=2)

// Entry Conditions
longCondition = ta.crossover(fastMA, slowMA)
shortCondition = ta.crossunder(fastMA, slowMA)

// Position Sizing
accountSize = strategy.equity
riskAmount = accountSize * (riskPercent / 100)
stopLoss = ta.atr(14) * 2
positionSize = riskAmount / stopLoss

// Execute Trades
if longCondition
    strategy.entry("Long", strategy.long, qty=positionSize)
    strategy.exit("Exit Long", "Long", stop=close - stopLoss, limit=close + stopLoss * 2)

if shortCondition
    strategy.entry("Short", strategy.short, qty=positionSize)
    strategy.exit("Exit Short", "Short", stop=close + stopLoss, limit=close - stopLoss * 2)`
    },
    {
      id: 2,
      name: "RSI Overbought/Oversold",
      description: "Identify potential reversal points using the Relative Strength Index indicator. Customizable RSI periods with alert system included, works on multiple markets.",
      language: "Pine Script",
      strategy: "Reversal",
      downloads: 2134,
      rating: 4.8,
      premium: false,
      code: `//@version=5
strategy("RSI Overbought/Oversold", overlay=false)

// Inputs
rsiLength = input.int(14, "RSI Length", minval=1)
rsiOverbought = input.int(70, "Overbought Level", minval=50, maxval=100)
rsiOversold = input.int(30, "Oversold Level", minval=0, maxval=50)
riskPercent = input.float(2.0, "Risk %", minval=0.1, maxval=100)

// Calculate RSI
rsi = ta.rsi(close, rsiLength)

// Plot RSI
plot(rsi, "RSI", color=color.purple, linewidth=2)
hline(rsiOverbought, "Overbought", color=color.red, linestyle=hline.style_dashed)
hline(rsiOversold, "Oversold", color=color.green, linestyle=hline.style_dashed)
hline(50, "Middle", color=color.gray, linestyle=hline.style_dotted)

// Entry Conditions
longCondition = ta.crossover(rsi, rsiOversold)
shortCondition = ta.crossunder(rsi, rsiOverbought)

// Risk Management
stopLoss = ta.atr(14) * 1.5
accountSize = strategy.equity
riskAmount = accountSize * (riskPercent / 100)
positionSize = riskAmount / stopLoss

// Execute Trades
if longCondition
    strategy.entry("Long", strategy.long, qty=positionSize)
    strategy.exit("Exit Long", "Long", stop=close - stopLoss, limit=close + stopLoss * 2)

if shortCondition
    strategy.entry("Short", strategy.short, qty=positionSize)
    strategy.exit("Exit Short", "Short", stop=close + stopLoss, limit=close - stopLoss * 2)

// Alerts
alertcondition(longCondition, "RSI Buy Signal", "RSI crossed above oversold level")
alertcondition(shortCondition, "RSI Sell Signal", "RSI crossed below overbought level")`
    },
    {
      id: 3,
      name: "Support & Resistance Breakout",
      description: "Automatically identify and trade key support and resistance level breakouts. Features dynamic level detection, breakout confirmation, and position sizing calculator.",
      language: "Pine Script",
      strategy: "Breakout",
      downloads: 1956,
      rating: 4.7,
      premium: false,
      code: `//@version=5
strategy("Support & Resistance Breakout", overlay=true)

// Inputs
lookbackPeriod = input.int(20, "Lookback Period", minval=5)
breakoutConfirmation = input.int(2, "Confirmation Candles", minval=1)
riskPercent = input.float(2.0, "Risk %", minval=0.1, maxval=100)

// Calculate Support and Resistance
resistance = ta.highest(high, lookbackPeriod)
support = ta.lowest(low, lookbackPeriod)

// Plot Levels
plot(resistance, "Resistance", color=color.red, linewidth=2, style=plot.style_stepline)
plot(support, "Support", color=color.green, linewidth=2, style=plot.style_stepline)

// Breakout Detection
var int bullishCount = 0
var int bearishCount = 0

if close > resistance[1]
    bullishCount := bullishCount + 1
else
    bullishCount := 0

if close < support[1]
    bearishCount := bearishCount + 1
else
    bearishCount := 0

// Entry Conditions
longCondition = bullishCount >= breakoutConfirmation
shortCondition = bearishCount >= breakoutConfirmation

// Position Sizing
accountSize = strategy.equity
stopDistance = ta.atr(14) * 2
riskAmount = accountSize * (riskPercent / 100)
positionSize = riskAmount / stopDistance

// Execute Trades
if longCondition
    strategy.entry("Long", strategy.long, qty=positionSize)
    strategy.exit("Exit Long", "Long", stop=support, limit=close + (close - support) * 2)

if shortCondition
    strategy.entry("Short", strategy.short, qty=positionSize)
    strategy.exit("Exit Short", "Short", stop=resistance, limit=close - (resistance - close) * 2)`
    },
    {
      id: 4,
      name: "Golden Cross Strategy",
      description: "Moving average crossover with RSI confirmation",
      language: "Pine Script",
      strategy: "Trend Following",
      downloads: 1247,
      rating: 4.8,
      premium: false,
      code: "// Golden Cross strategy code available after download"
    },
    {
      id: 5,
      name: "Bollinger Band Squeeze",
      description: "Volatility breakout strategy with volume confirmation",
      language: "Python",
      strategy: "Breakout",
      downloads: 892,
      rating: 4.6,
      premium: true,
      code: "# Bollinger Band Squeeze Python code available for Premium members"
    },
    {
      id: 6,
      name: "RSI Divergence Detector",
      description: "Automatic divergence detection and alert system",
      language: "MQL5",
      strategy: "Reversal",
      downloads: 634,
      rating: 4.9,
      premium: true,
      code: "// RSI Divergence MQL5 code available for Premium members"
    }
  ];

  const filteredScripts = scripts.filter(script => {
    return (
      script.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedLanguage === "all" || script.language === selectedLanguage) &&
      (selectedStrategy === "all" || script.strategy === selectedStrategy)
    );
  });

  const handleDownload = (script: typeof scripts[0]) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'script_downloaded', {
        event_category: 'Members',
        event_label: script.name,
        value: script.id
      });
    }

    // Create download
    const element = document.createElement('a');
    const file = new Blob([script.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${script.name.replace(/\s+/g, '_')}.${script.language === 'Pine Script' ? 'pine' : script.language === 'Python' ? 'py' : 'mq5'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Download Started",
      description: `${script.name} has been downloaded successfully.`,
    });
  };

  const handlePreview = (script: typeof scripts[0]) => {
    setPreviewScript(script);
  };

  const upgradeToElite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upgrade",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-change-membership', {
        body: {
          user_id: user.id,
          new_plan: 'elite',
          reason: 'Dev upgrade to elite',
          is_free_assignment: true
        }
      });

      if (error) throw error;

      toast({
        title: "Upgraded to Elite!",
        description: "Your account has been upgraded to Elite membership",
      });

      // Refresh the page to see changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade membership",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <MemberNavigation />
        
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Context Message - shows when navigating from Screener/PatternLab */}
        {contextMessage && (
          <Alert className="mb-6 border-primary/30 bg-primary/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{contextMessage}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setContextMessage(null);
                  setSelectedStrategy("all");
                }}
              >
                Clear Filter
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Script Library
            </h1>
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access your complete collection of ready-to-use trading scripts. Download, customize, and deploy instantly.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Scripts</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="Pine Script">Pine Script</SelectItem>
                    <SelectItem value="Python">Python</SelectItem>
                    <SelectItem value="MQL5">MQL5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Strategy Type</label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    <SelectItem value="Trend Following">Trend Following</SelectItem>
                    <SelectItem value="Breakout">Breakout</SelectItem>
                    <SelectItem value="Reversal">Reversal</SelectItem>
                    <SelectItem value="Scalping">Scalping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedLanguage("all");
                    setSelectedStrategy("all");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scripts Grid */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Scripts ({filteredScripts.length})</h2>
            <div className="text-sm text-muted-foreground">
              Total Downloads: {scripts.reduce((sum, script) => sum + script.downloads, 0)}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScripts.map((script) => (
              <Card key={script.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{script.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{script.language}</Badge>
                        <Badge variant="outline">{script.strategy}</Badge>
                        {script.premium && (
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription>{script.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{script.downloads} downloads</span>
                    <div className="flex items-center gap-1">
                      <span>★ {script.rating}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleDownload(script)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={() => handlePreview(script)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Access Notice */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Member Access Required</h3>
                <p className="text-muted-foreground">
                  This script library is available to active subscribers. Your current plan provides access to {scripts.length} scripts 
                  with unlimited downloads and updates.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/pricing">Upgrade Plan</Link>
                  </Button>
                  <Button variant="ghost" size="sm">
                    View Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewScript} onOpenChange={() => setPreviewScript(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {previewScript?.name}
            </DialogTitle>
            <DialogDescription>
              {previewScript?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="secondary">{previewScript?.language}</Badge>
              <Badge variant="outline">{previewScript?.strategy}</Badge>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{previewScript?.code}</code>
              </pre>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => previewScript && handleDownload(previewScript)} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Script
              </Button>
              <Button variant="outline" onClick={() => setPreviewScript(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberScripts;