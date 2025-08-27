import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import Navigation from '@/components/Navigation';
import MemberNavigation from '@/components/MemberNavigation';
import { TradingChart } from '@/components/TradingChart';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { ActiveTrades } from '@/components/ActiveTrades';
import { TradeForm } from '@/components/TradeForm';
import { MarketOverview } from '@/components/MarketOverview';
import { TradingAchievements } from '@/components/TradingAchievements';
import { StrategyEditor } from '@/components/StrategyEditor';
import { StrategyList } from '@/components/StrategyList';
import { StrategyExecution } from '@/components/StrategyExecution';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Trophy,
  BookOpen,
  AlertCircle,
  Activity,
  Code,
  Zap,
  Plus,
  BarChart3
} from 'lucide-react';

interface Portfolio {
  id: string;
  initial_balance: number;
  current_balance: number;
  total_pnl: number;
}

interface Trade {
  id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  status: 'open' | 'closed' | 'cancelled';
  pnl?: number;
  created_at: string;
}

const MAJOR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP'
];

const PaperTrading = () => {
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [marketData, setMarketData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('trading');
  const [strategies, setStrategies] = useState<Array<{id: string; name: string; description: string; is_active: boolean}>>([]);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
  const [showStrategyEditor, setShowStrategyEditor] = useState(false);

  // Initialize or fetch portfolio
  useEffect(() => {
    if (user) {
      fetchPortfolio();
      fetchActiveTrades();
      fetchStrategies();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    if (!user) return;

    try {
      let { data: portfolioData, error } = await supabase
        .from('paper_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no portfolio exists, it will be created by the trigger
      if (!portfolioData) {
        // Wait a moment for trigger to execute, then fetch again
        setTimeout(async () => {
          const { data: newPortfolio } = await supabase
            .from('paper_portfolios')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (newPortfolio) {
            setPortfolio(newPortfolio);
          }
        }, 1000);
      } else {
        setPortfolio(portfolioData);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      });
    }
  };

  const fetchActiveTrades = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('paper_trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveTrades((data || []).map(trade => ({
        ...trade,
        trade_type: trade.trade_type as 'buy' | 'sell',
        status: trade.status as 'open' | 'closed' | 'cancelled'
      })));
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const fetchStrategies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    }
  };

  const handleTrade = async (tradeData: {
    symbol: string;
    type: 'buy' | 'sell';
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => {
    if (!user || !portfolio) return;

    setLoading(true);
    try {
      // Get current market price (mock for now)
      const currentPrice = Math.random() * 2 + 0.8; // Mock price between 0.8-2.8
      
      const { error } = await supabase
        .from('paper_trades')
        .insert({
          user_id: user.id,
          portfolio_id: portfolio.id,
          symbol: tradeData.symbol,
          trade_type: tradeData.type,
          quantity: tradeData.quantity,
          entry_price: currentPrice,
          stop_loss: tradeData.stopLoss,
          take_profit: tradeData.takeProfit,
        });

      if (error) throw error;

      toast({
        title: "Trade Executed",
        description: `${tradeData.type.toUpperCase()} ${tradeData.quantity} ${tradeData.symbol} at ${currentPrice.toFixed(4)}`,
      });

      fetchActiveTrades();
    } catch (error) {
      console.error('Error executing trade:', error);
      toast({
        title: "Error",
        description: "Failed to execute trade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeTrade = async (tradeId: string, exitPrice: number) => {
    if (!user) return;

    try {
      const trade = activeTrades.find(t => t.id === tradeId);
      if (!trade) return;

      // Calculate P&L
      const pnl = trade.trade_type === 'buy' 
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity;

      const { error } = await supabase
        .from('paper_trades')
        .update({
          status: 'closed',
          exit_price: exitPrice,
          pnl: pnl,
          closed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade Closed",
        description: `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        variant: pnl < 0 ? "destructive" : "default",
      });

      fetchActiveTrades();
      fetchPortfolio();
    } catch (error) {
      console.error('Error closing trade:', error);
      toast({
        title: "Error",
        description: "Failed to close trade",
        variant: "destructive",
      });
    }
  };

  const handleStrategyEditComplete = () => {
    setEditingStrategy(null);
    setShowStrategyEditor(false);
    fetchStrategies();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access Paper Trading</h1>
          <p className="text-muted-foreground">You need to be logged in to practice trading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <MemberNavigation />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Paper Trading Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Practice your trading skills with virtual money and algorithmic strategies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Live Market Data
              </Badge>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio?.current_balance?.toLocaleString() || '10,000.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Starting: ${portfolio?.initial_balance?.toLocaleString() || '10,000.00'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {(portfolio?.total_pnl || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(portfolio?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(portfolio?.total_pnl || 0) >= 0 ? '+' : ''}${portfolio?.total_pnl?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {((portfolio?.total_pnl || 0) / (portfolio?.initial_balance || 10000) * 100).toFixed(2)}% return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTrades.length}</div>
              <p className="text-xs text-muted-foreground">
                Open positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3/10</div>
              <Progress value={30} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Achievements earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Algo Execution
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="trading">
            {/* Main Trading Interface */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Trading & Chart */}
              <div className="lg:col-span-2 space-y-6">
                {/* Market Overview */}
                <MarketOverview />
                
                {/* Trading Chart */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Price Chart</CardTitle>
                      <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAJOR_PAIRS.map((pair) => (
                            <SelectItem key={pair} value={pair}>
                              {pair}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TradingChart symbol={selectedSymbol} />
                  </CardContent>
                </Card>

                {/* Active Trades */}
                <ActiveTrades 
                  trades={activeTrades} 
                  onCloseTrade={closeTrade}
                />
              </div>

              {/* Right Column - Trade Form & Info */}
              <div className="space-y-6">
                {/* Trade Form */}
                <TradeForm 
                  symbol={selectedSymbol}
                  onTrade={handleTrade}
                  loading={loading}
                  availableBalance={portfolio?.current_balance || 0}
                />

                {/* Educational Integration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Pattern Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-primary">Double Bottom Detected</p>
                          <p className="text-sm text-muted-foreground">
                            EUR/USD is showing a potential double bottom pattern. This could signal a bullish reversal.
                          </p>
                          <Button variant="link" className="p-0 h-auto text-primary" asChild>
                            <a href="/chart-patterns/library">Learn about Double Bottom →</a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <TradingAchievements />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategies">
            <div className="space-y-6">
              {/* Strategy Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Trading Strategies</h2>
                  <p className="text-muted-foreground">Create and manage your algorithmic trading strategies</p>
                </div>
                <Button onClick={() => setShowStrategyEditor(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Strategy
                </Button>
              </div>

              {/* Strategy Editor */}
              {showStrategyEditor && (
                <StrategyEditor
                  strategy={editingStrategy}
                  onSave={handleStrategyEditComplete}
                  onCancel={() => {
                    setShowStrategyEditor(false);
                    setEditingStrategy(null);
                  }}
                />
              )}

              {/* Strategy List */}
              {!showStrategyEditor && (
                <StrategyList
                  onEdit={(strategy) => {
                    setEditingStrategy(strategy);
                    setShowStrategyEditor(true);
                  }}
                  onRefresh={fetchStrategies}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="execution">
            <StrategyExecution 
              strategies={strategies}
              onRefresh={fetchStrategies}
            />
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>
                    Detailed performance metrics and analytics coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                    <p>Comprehensive strategy performance analysis, backtesting results, and optimization suggestions will be available here.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PaperTrading;