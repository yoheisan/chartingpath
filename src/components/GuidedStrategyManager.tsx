import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit, 
  Copy, 
  Trash2, 
  FileText, 
  Search,
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';

interface GuidedStrategy {
  id: string;
  name: string;
  description?: string;
  answers: GuidedStrategyAnswers;
  backtest_results?: any;
  created_at: string;
  updated_at: string;
}

interface GuidedStrategyManagerProps {
  onLoadStrategy: (strategy: GuidedStrategy) => void;
  onEditStrategy: (strategy: GuidedStrategy) => void;
}

export const GuidedStrategyManager: React.FC<GuidedStrategyManagerProps> = ({
  onLoadStrategy,
  onEditStrategy
}) => {
  console.log('GuidedStrategyManager component mounted');
  
  const [strategies, setStrategies] = useState<GuidedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>('updated_at');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<GuidedStrategy | null>(null);
  const [copyName, setCopyName] = useState('');

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      console.log('=== FETCHING STRATEGIES START ===');
      setLoading(true);
      
      // Check if user is authenticated
      const { data: user, error: userError } = await supabase.auth.getUser();
      console.log('User data:', user);
      console.log('User error:', userError);
      
      const { data, error } = await supabase
        .from('guided_strategies')
        .select('*')
        .order(sortBy, { ascending: false });

      console.log('Database query result:', { data, error });
      console.log('Number of strategies found:', data?.length || 0);

      if (error) throw error;
      setStrategies((data || []).map(item => ({
        ...item,
        answers: item.answers as unknown as GuidedStrategyAnswers,
        backtest_results: item.backtest_results
      })));
      console.log('=== FETCHING STRATEGIES END ===');
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;

    try {
      const { error } = await supabase
        .from('guided_strategies')
        .delete()
        .eq('id', strategyId);

      if (error) throw error;
      
      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      toast.success('Strategy deleted successfully');
    } catch (error) {
      console.error('Error deleting strategy:', error);
      toast.error('Failed to delete strategy');
    }
  };

  const handleCopyStrategy = (strategy: GuidedStrategy) => {
    setSelectedStrategy(strategy);
    setCopyName(`${strategy.name} (Copy)`);
    setShowCopyDialog(true);
  };

  const confirmCopyStrategy = async () => {
    if (!selectedStrategy || !copyName.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Please log in to copy strategies');
        return;
      }

      const { error } = await supabase
        .from('guided_strategies')
        .insert([{
          name: copyName.trim(),
          description: selectedStrategy.description,
          answers: selectedStrategy.answers as any,
          backtest_results: null, // Reset backtest results for copied strategy
          user_id: user.user.id
        }]);

      if (error) throw error;

      toast.success('Strategy copied successfully');
      setShowCopyDialog(false);
      setCopyName('');
      setSelectedStrategy(null);
      fetchStrategies(); // Refresh the list
    } catch (error) {
      console.error('Error copying strategy:', error);
      toast.error('Failed to copy strategy');
    }
  };

  const filteredStrategies = strategies.filter(strategy =>
    strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStrategyStats = (strategy: GuidedStrategy) => {
    const { answers } = strategy;
    return {
      timeframe: answers.market?.timeframes?.[0] || 'N/A',
      approach: answers.style?.approach?.replace('-', ' ') || 'N/A',
      targetReturn: answers.reward?.targetReturn ? `${answers.reward.targetReturn}%` : 'N/A'
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading strategies...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            My Guided Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search strategies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Last Modified</SelectItem>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Strategy List */}
      {sortedStrategies.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Strategies Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No strategies match your search.' : 'Create your first guided strategy to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedStrategies.map((strategy) => {
            const stats = getStrategyStats(strategy);
            return (
              <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{strategy.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {stats.approach}
                        </Badge>
                      </div>
                      
                      {strategy.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {strategy.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {stats.timeframe}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Target: {stats.targetReturn}
                        </div>
                        <div>
                          Updated: {formatDate(strategy.updated_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadStrategy(strategy)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Load
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyStrategy(strategy)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStrategy(strategy.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Copy Strategy Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="copyName">Strategy Name</Label>
              <Input
                id="copyName"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                placeholder="Enter new strategy name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCopyStrategy} disabled={!copyName.trim()}>
              Copy Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};