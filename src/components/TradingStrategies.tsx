import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search, Filter, ExternalLink, Grid3X3, List } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { tradingStrategies, Strategy, STRATEGY_PACKS } from "@/utils/TradingStrategiesData";
import { useTranslation } from "react-i18next";

export const TradingStrategies = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [selectedPack, setSelectedPack] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  // Filter out hidden strategies and get unique categories, difficulties, and timeframes
  const visibleStrategies = tradingStrategies.filter(s => !s.hidden);
  const categories = Array.from(new Set(visibleStrategies.map(s => s.category))).sort();
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const timeframes = Array.from(new Set(visibleStrategies.flatMap(s => s.timeframes || []))).sort();
  const packs = Object.keys(STRATEGY_PACKS);

  // Filter strategies
  const filteredStrategies = visibleStrategies.filter(strategy => {
    const matchesSearch = strategy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.indicators?.some(ind => ind?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || strategy.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || strategy.difficulty === selectedDifficulty;
    const matchesTimeframe = selectedTimeframe === "all" || strategy.timeframes?.includes(selectedTimeframe);
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
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('tradingStrategiesPage.headerTitle')}</h2>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          {t('tradingStrategiesPage.headerDesc')}
        </p>
      </div>

      {/* Trading Setup Guide */}
      <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            {t('tradingStrategiesPage.setupGuideTitle')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('tradingStrategiesPage.waitForSetup')}</h4>
              <p className="text-sm text-muted-foreground">{t('tradingStrategiesPage.waitForSetupDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-accent">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('tradingStrategiesPage.confirmEntry')}</h4>
              <p className="text-sm text-muted-foreground">{t('tradingStrategiesPage.confirmEntryDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-bullish/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-bullish">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('tradingStrategiesPage.executeTrade')}</h4>
              <p className="text-sm text-muted-foreground">{t('tradingStrategiesPage.executeTradeDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-bearish/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-bearish">4</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">{t('tradingStrategiesPage.manageExit')}</h4>
              <p className="text-sm text-muted-foreground">{t('tradingStrategiesPage.manageExitDesc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                {t('tradingStrategiesPage.waitingTitle')}
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.neverForce')}</strong> - {t('tradingStrategiesPage.neverForceDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.checkMultiple')}</strong> - {t('tradingStrategiesPage.checkMultipleDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.verifyConditions')}</strong> - {t('tradingStrategiesPage.verifyConditionsDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.considerContext')}</strong> - {t('tradingStrategiesPage.considerContextDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.waitConfirmation')}</strong> - {t('tradingStrategiesPage.waitConfirmationDesc')}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                {t('tradingStrategiesPage.entryRulesTitle')}
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.positionSizing')}</strong> - {t('tradingStrategiesPage.positionSizingDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.setStopLoss')}</strong> - {t('tradingStrategiesPage.setStopLossDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.useLimitOrders')}</strong> - {t('tradingStrategiesPage.useLimitOrdersDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.documentReasoning')}</strong> - {t('tradingStrategiesPage.documentReasoningDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bullish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.checkCalendar')}</strong> - {t('tradingStrategiesPage.checkCalendarDesc')}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                {t('tradingStrategiesPage.exitTitle')}
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.planExits')}</strong> - {t('tradingStrategiesPage.planExitsDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.trailingStops')}</strong> - {t('tradingStrategiesPage.trailingStopsDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.scaleOut')}</strong> - {t('tradingStrategiesPage.scaleOutDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.followPlan')}</strong> - {t('tradingStrategiesPage.followPlanDesc')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bearish font-bold">•</span>
                  <span><strong>{t('tradingStrategiesPage.reviewTrade')}</strong> - {t('tradingStrategiesPage.reviewTradeDesc')}</span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="font-semibold text-foreground mb-3 text-center">{t('tradingStrategiesPage.goldenRulesTitle')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>{t('tradingStrategiesPage.patienceOverProfit')}</strong> - {t('tradingStrategiesPage.patienceOverProfitDesc')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>{t('tradingStrategiesPage.riskManagement')}</strong> - {t('tradingStrategiesPage.riskManagementDesc')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span><strong>{t('tradingStrategiesPage.keepJournal')}</strong> - {t('tradingStrategiesPage.keepJournalDesc')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span><strong>{t('tradingStrategiesPage.startSmall')}</strong> - {t('tradingStrategiesPage.startSmallDesc')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span><strong>{t('tradingStrategiesPage.stickToStrategy')}</strong> - {t('tradingStrategiesPage.stickToStrategyDesc')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span><strong>{t('tradingStrategiesPage.practiceDemo')}</strong> - {t('tradingStrategiesPage.practiceDemoDesc')}</span>
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
              placeholder={t('tradingStrategiesPage.searchStrategies')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedPack} onValueChange={setSelectedPack}>
            <SelectTrigger>
              <SelectValue placeholder={t('tradingStrategiesPage.strategyPack')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradingStrategiesPage.allPacks')}</SelectItem>
              {packs.map(pack => (
                <SelectItem key={pack} value={pack}>
                  {pack.replace(" Strategy Pack", "").replace(" & ", " & ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t('tradingStrategiesPage.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradingStrategiesPage.allCategories')}</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder={t('tradingStrategiesPage.difficulty')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradingStrategiesPage.allLevels')}</SelectItem>
              {difficulties.map(difficulty => (
                <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder={t('tradingStrategiesPage.timeframe')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradingStrategiesPage.allTimeframes')}</SelectItem>
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
            {t('tradingStrategiesPage.reset')}
          </Button>
        </div>
      </Card>

      {/* Results Summary and View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {t('tradingStrategiesPage.showing', { filtered: filteredStrategies.length, total: visibleStrategies.length })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Strategy Display */}
      {viewMode === "cards" ? (
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
                </div>
              </CardHeader>
              
              <CardContent className="p-0 space-y-4">
                <CardDescription className="text-sm line-clamp-2">
                  {strategy.description}
                </CardDescription>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-medium text-foreground">{t('tradingStrategiesPage.indicators')}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {strategy.indicators?.map((indicator, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-foreground">{t('tradingStrategiesPage.timeframes')}</span>
                    <div className="flex gap-1 mt-1">
                      {strategy.timeframes?.map((tf, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tf}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-foreground">{t('tradingStrategiesPage.riskReward')}</span>
                      <div className="text-accent font-medium">{strategy.riskReward}</div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-bullish">{t('tradingStrategiesPage.entry')}</span>
                    <p className="text-muted-foreground line-clamp-2">{strategy.entry}</p>
                  </div>
                  <div>
                    <span className="font-medium text-bearish">{t('tradingStrategiesPage.exit')}</span>
                    <p className="text-muted-foreground line-clamp-2">{strategy.exit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStrategies.map((strategy) => (
            <Card key={strategy.id} className="p-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link 
                      to={`/strategy/${strategy.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                    >
                      {strategy.name}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                    <Badge className={getDifficultyColor(strategy.difficulty)}>
                      {strategy.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {strategy.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {strategy.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{t('tradingStrategiesPage.rr')}</span>
                      <span className="text-accent font-medium">{strategy.riskReward}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{t('tradingStrategiesPage.timeframes')}</span>
                      <span className="text-muted-foreground">
                        {strategy.timeframes?.slice(0, 2).join(", ")}
                        {strategy.timeframes && strategy.timeframes.length > 2 && ` ${t('tradingStrategiesPage.more', { count: strategy.timeframes.length - 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs min-w-[200px]">
                  <div>
                    <span className="font-medium text-bullish">{t('tradingStrategiesPage.entry')}</span>
                    <p className="text-muted-foreground line-clamp-1">{strategy.entry}</p>
                  </div>
                  <div>
                    <span className="font-medium text-bearish">{t('tradingStrategiesPage.exit')}</span>
                    <p className="text-muted-foreground line-clamp-1">{strategy.exit}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredStrategies.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('tradingStrategiesPage.noStrategiesFound')}</h3>
            <p>{t('tradingStrategiesPage.tryAdjusting')}</p>
          </div>
        </Card>
      )}
    </div>
  );
};