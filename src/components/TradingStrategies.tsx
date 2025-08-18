import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search, Filter, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { tradingStrategies, Strategy } from "@/utils/TradingStrategiesData";

export const TradingStrategies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");

  // Get unique categories, difficulties, and timeframes
  const categories = Array.from(new Set(tradingStrategies.map(s => s.category))).sort();
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const timeframes = Array.from(new Set(tradingStrategies.flatMap(s => s.timeframes))).sort();

  // Filter strategies
  const filteredStrategies = tradingStrategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.indicators.some(ind => ind.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || strategy.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || strategy.difficulty === selectedDifficulty;
    const matchesTimeframe = selectedTimeframe === "all" || strategy.timeframes.includes(selectedTimeframe);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTimeframe;
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

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
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
          Showing {filteredStrategies.length} of {tradingStrategies.length} strategies
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
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {strategy.successRate.includes("7") || strategy.successRate.includes("8") ? (
                    <TrendingUp className="h-3 w-3 text-bullish" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-bearish" />
                  )}
                  {strategy.successRate}
                </div>
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
                    <span className="font-medium text-foreground">Success Rate:</span>
                    <div className="text-bullish font-medium">{strategy.successRate}</div>
                  </div>
                </div>
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