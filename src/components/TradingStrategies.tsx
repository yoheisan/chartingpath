import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search, Filter, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { tradingStrategies, Strategy, STRATEGY_PACKS } from "@/utils/TradingStrategiesData";
import { PERFORMANCE_LABELS } from "@/constants/disclaimers";

export const TradingStrategies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [selectedPack, setSelectedPack] = useState<string>("all");

  // Filter out hidden strategies and get unique categories, difficulties, and timeframes
  const visibleStrategies = tradingStrategies.filter(s => !s.hidden);
  const categories = Array.from(new Set(visibleStrategies.map(s => s.category))).sort();
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const timeframes = Array.from(new Set(visibleStrategies.flatMap(s => s.timeframes))).sort();
  const packs = Object.keys(STRATEGY_PACKS);

  // Filter strategies
  const filteredStrategies = visibleStrategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.indicators.some(ind => ind.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || strategy.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || strategy.difficulty === selectedDifficulty;
    const matchesTimeframe = selectedTimeframe === "all" || strategy.timeframes.includes(selectedTimeframe);
    const matchesPack = selectedPack === "all" || strategy.pack === selectedPack;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTimeframe && matchesPack;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-600/20 text-green-400 border-green-600/30";
      case "Intermediate": return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
      case "Advanced": return "bg-orange-600/20 text-orange-400 border-orange-600/30";
      case "Expert": return "bg-red-600/20 text-red-400 border-red-600/30";
      default: return "bg-gray-600/20 text-gray-400 border-gray-600/30";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Professional Trading Strategies</h2>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          Discover 100+ proven trading strategies used by professionals worldwide. Each strategy includes detailed entry/exit rules, 
          risk-reward ratios, success rates, and recommended indicators. Click on any strategy title to view its detailed chart analysis.
        </p>
      </div>

      {/* Trading Setup Guide */}
      <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            🎯 How to Execute a Perfect Trading Setup
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Wait for Setup</h4>
              <p className="text-sm text-muted-foreground">Patience is key. Wait for all your strategy conditions to align perfectly.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-accent">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Confirm Entry</h4>
              <p className="text-sm text-muted-foreground">Double-check all indicators and ensure the setup meets your criteria.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-bullish/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-bullish">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Execute Trade</h4>
              <p className="text-sm text-muted-foreground">Enter your position with predetermined position size and stop loss.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-bearish/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-bearish">4</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Manage Exit</h4>
              <p className="text-sm text-muted-foreground">Follow your exit rules strictly - whether profit target or stop loss.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                ⏰ Waiting for the Perfect Setup
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Never force trades</strong> - The market will always provide opportunities</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Check multiple timeframes</strong> - Ensure alignment across 3 timeframes minimum</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Verify all conditions</strong> - Every indicator must confirm the signal</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Consider market context</strong> - Is it trending, ranging, or volatile?</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Wait for confirmation</strong> - Don't enter on the first signal candle</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                🎯 Entry Execution Rules
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>Position sizing first</strong> - Never risk more than 1-2% per trade</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>Set stop loss immediately</strong> - Before you even enter the trade</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>Use limit orders</strong> - Better execution and avoid slippage</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>Document your reasoning</strong> - Write why you're taking this trade</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>Check economic calendar</strong> - Avoid major news events</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                🚪 Exit Strategy Mastery
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>Plan exits before entry</strong> - Know your targets and stops in advance</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>Use trailing stops</strong> - Lock in profits as trade moves in your favor</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>Scale out positions</strong> - Take partial profits at key levels</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>Follow the plan religiously</strong> - Emotions are your enemy</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>Review every trade</strong> - Learn from both wins and losses</span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="font-semibold text-foreground mb-3 text-center">⚠️ Golden Rules for New Traders</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Patience over profit</strong> - Wait for A+ setups only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Risk management is everything</strong> - Protect capital at all costs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>Keep a trading journal</strong> - Track every decision and outcome</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span><strong>Start small, grow gradually</strong> - Master the process first</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span><strong>Stick to your strategy</strong> - Don't chase shiny new methods</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span><strong>Practice with paper trading</strong> - Perfect your execution first</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedPack} onValueChange={setSelectedPack}>
            <SelectTrigger>
              <SelectValue placeholder="Strategy Pack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packs</SelectItem>
              {packs.map(pack => (
                <SelectItem key={pack} value={pack}>
                  {pack.replace(" Strategy Pack", "").replace(" & ", " & ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {difficulties.map(difficulty => (
                <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timeframes</SelectItem>
              {timeframes.map(timeframe => (
                <SelectItem key={timeframe} value={timeframe}>{timeframe}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setSelectedDifficulty("all");
              setSelectedTimeframe("all");
              setSelectedPack("all");
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {filteredStrategies.length} of {visibleStrategies.length} strategies
        </p>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStrategies.map((strategy) => (
          <Card key={strategy.id} className="p-6 hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  <Link 
                    to={`/strategy/${strategy.id}`}
                    className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {strategy.name}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                </CardTitle>
                <Badge className={getDifficultyColor(strategy.difficulty)}>
                  {strategy.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {strategy.category}
                </Badge>
                {strategy.backtestData ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {strategy.backtestData.winRate.includes("7") || strategy.backtestData.winRate.includes("8") ? (
                      <TrendingUp className="h-3 w-3 text-bullish" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-bearish" />
                    )}
                    {PERFORMANCE_LABELS.SUCCESS_RATE}: {strategy.backtestData.winRate}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {strategy.successRate.includes("7") || strategy.successRate.includes("8") ? (
                      <TrendingUp className="h-3 w-3 text-bullish" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-bearish" />
                    )}
                    {PERFORMANCE_LABELS.SUCCESS_RATE}: {strategy.successRate}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0 space-y-4">
              <CardDescription className="text-sm line-clamp-2">
                {strategy.description}
              </CardDescription>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-medium text-foreground">Indicators:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strategy.indicators.map((indicator, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-foreground">Timeframes:</span>
                  <div className="flex gap-1 mt-1">
                    {strategy.timeframes.map((tf, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tf}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-foreground">Risk:Reward:</span>
                    <div className="text-accent font-medium">{strategy.riskReward}</div>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{PERFORMANCE_LABELS.SUCCESS_RATE}:</span>
                    <div className="text-bullish font-medium">{strategy.successRate}</div>
                  </div>
                </div>
                
                {/* Show backtest context if available */}
                {strategy.backtestData && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>({strategy.backtestData.instrument}, {strategy.backtestData.timeframe}, {strategy.backtestData.testPeriod}, {strategy.backtestData.totalTrades} trades)</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-3 space-y-2 text-xs">
                <div>
                  <span className="font-medium text-bullish">Entry:</span>
                  <p className="text-muted-foreground line-clamp-2">{strategy.entry}</p>
                </div>
                <div>
                  <span className="font-medium text-bearish">Exit:</span>
                  <p className="text-muted-foreground line-clamp-2">{strategy.exit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStrategies.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No strategies found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        </Card>
      )}
    </div>
  );
};