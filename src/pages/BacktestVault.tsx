import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MemberNavigation from "@/components/MemberNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Star, 
  Eye, 
  GitCompare, 
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Database,
  BarChart3
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface BacktestRun {
  id: string;
  strategy_name: string;
  instrument: string;
  timeframe: string;
  from_date: string;
  to_date: string;
  win_rate?: number;
  profit_factor?: number;
  net_pnl?: number;
  max_drawdown?: number;
  total_trades?: number;
  created_at: string;
  is_starred: boolean;
  tags: string[];
}

const BacktestVault = () => {
  const { user, profile, hasFeatureAccess } = useUserProfile();
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<BacktestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInstrument, setFilterInstrument] = useState<string>("");
  const [filterTimeframe, setFilterTimeframe] = useState<string>("");
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const canAccessVault = hasFeatureAccess('backtesting') || profile?.subscription_plan !== 'free';
  const maxRuns = getMaxRuns(profile?.subscription_plan || 'free');

  useEffect(() => {
    if (user && canAccessVault) {
      fetchBacktestRuns();
    }
  }, [user, canAccessVault]);

  useEffect(() => {
    filterRuns();
  }, [runs, searchQuery, filterInstrument, filterTimeframe]);

  const fetchBacktestRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRuns(data || []);
    } catch (error) {
      console.error('Error fetching backtest runs:', error);
      toast.error("Failed to load backtest history");
    } finally {
      setLoading(false);
    }
  };

  const filterRuns = () => {
    let filtered = [...runs];

    if (searchQuery) {
      filtered = filtered.filter(run => 
        run.strategy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.instrument.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterInstrument && filterInstrument !== "all") {
      filtered = filtered.filter(run => run.instrument === filterInstrument);
    }

    if (filterTimeframe && filterTimeframe !== "all") {
      filtered = filtered.filter(run => run.timeframe === filterTimeframe);
    }

    setFilteredRuns(filtered);
  };

  const toggleStar = async (runId: string) => {
    try {
      const run = runs.find(r => r.id === runId);
      if (!run) return;

      const { error } = await supabase
        .from('backtest_runs')
        .update({ is_starred: !run.is_starred })
        .eq('id', runId);

      if (error) throw error;

      setRuns(prev => prev.map(r => 
        r.id === runId ? { ...r, is_starred: !r.is_starred } : r
      ));
      
      toast.success(run.is_starred ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Error updating star:', error);
      toast.error("Failed to update favorites");
    }
  };

  const deleteRun = async (runId: string) => {
    try {
      const { error } = await supabase
        .from('backtest_runs')
        .delete()
        .eq('id', runId);

      if (error) throw error;

      setRuns(prev => prev.filter(r => r.id !== runId));
      toast.success("Backtest run deleted");
    } catch (error) {
      console.error('Error deleting run:', error);
      toast.error("Failed to delete run");
    }
  };

  const formatPnL = (pnl?: number) => {
    if (pnl === undefined || pnl === null) return "N/A";
    return `$${pnl.toFixed(2)}`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    return `${value.toFixed(1)}%`;
  };

  const getUniqueInstruments = () => {
    return [...new Set(runs.map(run => run.instrument))];
  };

  const getUniqueTimeframes = () => {
    return [...new Set(runs.map(run => run.timeframe))];
  };

  function getMaxRuns(plan: string): number {
    switch (plan) {
      case 'free': return 0;
      case 'starter': return 50;
      case 'pro': return 1000;
      case 'pro_plus': return 5000;
      case 'elite': return Infinity;
      default: return 0;
    }
  }

  if (!canAccessVault) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="p-12">
              <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Upgrade to Access Results Vault</h2>
              <p className="text-muted-foreground mb-6">
                Save, organize, and compare your backtest results with the Results Vault. 
                Available for Pro subscribers and above.
              </p>
              <Button>Upgrade to Pro</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <MemberNavigation />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Backtest Results Vault
            </h1>
            <p className="text-muted-foreground mt-2">
              {maxRuns === Infinity 
                ? "Unlimited storage for all your backtest results"
                : `Store up to ${maxRuns} backtest results`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="default">
              {runs.length}{maxRuns !== Infinity && `/${maxRuns}`} Runs
            </Badge>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Backtest
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search strategies, instruments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={filterInstrument} onValueChange={setFilterInstrument}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Instruments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instruments</SelectItem>
                  {getUniqueInstruments().map(instrument => (
                    <SelectItem key={instrument} value={instrument}>
                      {instrument}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Timeframes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timeframes</SelectItem>
                  {getUniqueTimeframes().map(timeframe => (
                    <SelectItem key={timeframe} value={timeframe}>
                      {timeframe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p>Loading backtest results...</p>
            </CardContent>
          </Card>
        ) : filteredRuns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Backtest Results</h3>
              <p className="text-muted-foreground mb-6">
                Run your first backtest to see results here
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Run Your First Backtest
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Max DD</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStar(run.id)}
                        >
                          <Star 
                            className={`h-4 w-4 ${run.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {run.strategy_name}
                      </TableCell>
                      <TableCell>{run.instrument}</TableCell>
                      <TableCell>{run.timeframe}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {formatPercentage(run.win_rate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          (run.net_pnl || 0) >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {(run.net_pnl || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPnL(run.net_pnl)}
                        </div>
                      </TableCell>
                      <TableCell>{formatPercentage(run.max_drawdown)}</TableCell>
                      <TableCell>{run.total_trades || 0}</TableCell>
                      <TableCell>
                        {format(new Date(run.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteRun(run.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BacktestVault;