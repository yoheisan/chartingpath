import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Trash2, 
  Play,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { ChartingPathStrategy } from './ChartingPathStrategyBuilder';

interface ChartingPathManagerProps {
  onLoadStrategy: (strategy: ChartingPathStrategy) => void;
}

export const ChartingPathManager: React.FC<ChartingPathManagerProps> = ({
  onLoadStrategy
}) => {
  const { user } = useUserProfile();
  const [strategies, setStrategies] = useState<ChartingPathStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStrategies();
    }
  }, [user]);

  const loadStrategies = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('strategy_type', 'charting_path')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const parsedStrategies = (data || []).map(s => ({
        ...JSON.parse(s.strategy_code),
        id: s.id,
        name: s.name,
        description: s.description,
        created_at: new Date(s.created_at),
        updated_at: new Date(s.updated_at)
      }));

      setStrategies(parsedStrategies);
    } catch (error) {
      console.error('Error loading strategies:', error);
      toast.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;

    try {
      const { error } = await supabase
        .from('user_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Strategy deleted');
      loadStrategies();
    } catch (error) {
      console.error('Error deleting strategy:', error);
      toast.error('Failed to delete strategy');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-8 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pattern Strategies Yet</h3>
          <p className="text-muted-foreground mb-4">
            Build your first chart pattern strategy using the Builder tab above
          </p>
          <Button 
            onClick={() => window.location.hash = '#builder'} 
            variant="outline"
            className="mt-2"
          >
            Go to Builder
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <Card key={strategy.id} className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  {strategy.name}
                </CardTitle>
                {strategy.description && (
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadStrategy(strategy)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(strategy.id!)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>{strategy.patterns?.filter(p => p.enabled).length || 0} Patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Target: {strategy.targetGainPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span>Stop: {strategy.stopLossPercent}%</span>
              </div>
              {strategy.backtestResults && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Backtested
                </Badge>
              )}
              <div className="flex items-center gap-2 ml-auto text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Updated {new Date(strategy.updated_at!).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
