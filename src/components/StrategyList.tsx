import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Clock,
  Code
} from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  strategy_code: string;
  strategy_type: 'custom' | 'template';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StrategyPerformance {
  strategy_id: string;
  total_trades: number;
  winning_trades: number;
  total_pnl: number;
  win_rate: number;
}

interface StrategyListProps {
  onEdit?: (strategy: Strategy) => void;
  onRefresh?: () => void;
}

export const StrategyList = ({ onEdit, onRefresh }: StrategyListProps) => {
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [performance, setPerformance] = useState<{[key: string]: StrategyPerformance}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStrategies();
      fetchPerformance();
    }
  }, [user]);

  const fetchStrategies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies((data || []).map(strategy => ({
        ...strategy,
        strategy_type: strategy.strategy_type as 'custom' | 'template'
      })));
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast({
        title: "Error",
        description: "Failed to load strategies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('strategy_performance')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const perfMap: {[key: string]: StrategyPerformance} = {};
      data?.forEach(perf => {
        perfMap[perf.strategy_id] = perf;
      });
      setPerformance(perfMap);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const toggleStrategy = async (strategyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_strategies')
        .update({ is_active: isActive })
        .eq('id', strategyId);

      if (error) throw error;

      setStrategies(prev => 
        prev.map(s => 
          s.id === strategyId ? { ...s, is_active: isActive } : s
        )
      );

      toast({
        title: isActive ? "Strategy Activated" : "Strategy Deactivated",
        description: `Strategy is now ${isActive ? 'running' : 'stopped'}`,
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error toggling strategy:', error);
      toast({
        title: "Error",
        description: "Failed to update strategy status",
        variant: "destructive",
      });
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_strategies')
        .delete()
        .eq('id', strategyId);

      if (error) throw error;

      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      
      toast({
        title: "Strategy Deleted",
        description: "Strategy has been permanently deleted",
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error deleting strategy:', error);
      toast({
        title: "Error",
        description: "Failed to delete strategy",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading strategies...</div>
        </CardContent>
      </Card>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <Code className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Strategies Yet</h3>
            <p className="text-muted-foreground">
              Create your first algorithmic trading strategy to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => {
        const perf = performance[strategy.id];
        const winRate = perf?.win_rate || 0;
        const totalPnL = perf?.total_pnl || 0;
        
        return (
          <Card key={strategy.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{strategy.name}</h3>
                    <Badge variant={strategy.strategy_type === 'template' ? 'secondary' : 'outline'}>
                      {strategy.strategy_type}
                    </Badge>
                    <Badge variant={strategy.is_active ? 'default' : 'secondary'}>
                      {strategy.is_active ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {strategy.description || 'No description provided'}
                  </p>

                  {/* Performance Metrics */}
                  {perf && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{perf.total_trades}</div>
                        <div className="text-xs text-muted-foreground">Total Trades</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total P&L</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{perf.winning_trades}</div>
                        <div className="text-xs text-muted-foreground">Winning Trades</div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(strategy.created_at).toLocaleDateString()}
                    {strategy.updated_at !== strategy.created_at && (
                      <> • Updated: {new Date(strategy.updated_at).toLocaleDateString()}</>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={strategy.is_active}
                      onCheckedChange={(checked) => toggleStrategy(strategy.id, checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {strategy.is_active ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(strategy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStrategy(strategy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};