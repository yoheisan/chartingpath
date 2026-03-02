import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp,
  Loader2,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FeedbackItem {
  id: string;
  question: string;
  response: string | null;
  quality_score: number | null;
  topics: string[] | null;
  intent_category: string | null;
  content_gap_identified: boolean;
  content_gap_description: string | null;
  priority_score: number;
  resolved: boolean;
  created_at: string;
}

export function CopilotFeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'gaps' | 'high-priority' | 'resolved'>('gaps');
  const [resolvedCount, setResolvedCount] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'quality'>('recent');

  useEffect(() => {
    loadFeedback();
    loadResolvedCount();
  }, [filter, sortBy]);

  const loadResolvedCount = async () => {
    const { count } = await supabase
      .from('copilot_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', true);
    setResolvedCount(count || 0);
  };

  const loadFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('copilot_feedback')
        .select('*')
        .limit(100);

      // Apply sort
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'priority') {
        query = query.order('priority_score', { ascending: false });
      } else if (sortBy === 'quality') {
        query = query.order('quality_score', { ascending: true, nullsFirst: false });
      }

      if (filter === 'gaps') {
        query = query.eq('content_gap_identified', true).eq('resolved', false);
      } else if (filter === 'high-priority') {
        query = query.gte('priority_score', 60).eq('resolved', false);
      } else if (filter === 'resolved') {
        query = query.eq('resolved', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (id: string, currentlyResolved: boolean) => {
    const { error } = await supabase
      .from('copilot_feedback')
      .update({ resolved: !currentlyResolved })
      .eq('id', id);

    if (!error) {
      setFeedback(prev => prev.filter(f => f.id !== id));
      setResolvedCount(prev => currentlyResolved ? prev - 1 : prev + 1);
    }
  };

  const markResolved = async (id: string) => toggleResolved(id, false);

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'bg-destructive text-destructive-foreground';
    if (score >= 60) return 'bg-orange-500 text-white';
    if (score >= 40) return 'bg-yellow-500 text-black';
    return 'bg-muted text-muted-foreground';
  };

  const stats = {
    total: feedback.length,
    gaps: feedback.filter(f => f.content_gap_identified).length,
    highPriority: feedback.filter(f => f.priority_score >= 60).length,
    avgQuality: feedback.length > 0 
      ? (feedback.reduce((sum, f) => sum + (f.quality_score || 3), 0) / feedback.length).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Copilot Feedback Analytics</h2>
          <p className="text-muted-foreground">
            AI-analyzed questions to identify content gaps and priority improvements
          </p>
        </div>
        <Button variant="outline" onClick={loadFeedback} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.gaps}</span>
            </div>
            <p className="text-sm text-muted-foreground">Content Gaps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-destructive" />
              <span className="text-2xl font-bold">{stats.highPriority}</span>
            </div>
            <p className="text-sm text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.avgQuality}</span>
            </div>
            <p className="text-sm text-muted-foreground">Avg Question Quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="gaps" className="gap-2">
              <Filter className="w-4 h-4" />
              Content Gaps
            </TabsTrigger>
            <TabsTrigger value="high-priority">High Priority</TabsTrigger>
            <TabsTrigger value="all">All Feedback</TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Resolved ({resolvedCount})
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="priority">High Priority</SelectItem>
                <SelectItem value="quality">Lowest Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No items to review. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {feedback.map((item) => (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium truncate">
                            {item.question}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            {item.intent_category && (
                              <span className="ml-2 text-xs">• {item.intent_category}</span>
                            )}
                          </CardDescription>
                        </div>
                        <Badge className={getPriorityColor(item.priority_score)}>
                          Priority: {item.priority_score}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.content_gap_description && (
                        <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            📋 Content Gap Identified:
                          </p>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            {item.content_gap_description}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.topics?.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Quality Score: {item.quality_score || 'N/A'}/5
                        </span>
                        <Button 
                          size="sm" 
                          variant={item.resolved ? "secondary" : "outline"}
                          onClick={() => toggleResolved(item.id, item.resolved)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {item.resolved ? 'Reopen' : 'Mark Resolved'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
