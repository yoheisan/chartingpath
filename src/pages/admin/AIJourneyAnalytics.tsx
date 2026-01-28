import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, RefreshCw, BarChart3, Zap, AlertTriangle, 
  TrendingUp, Users, Activity, Brain, Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchJourneyAnalytics, type JourneyAnalytics } from '@/services/journeyAnalyticsService';
import { JourneyFlowVisualization } from '@/components/admin/JourneyFlowVisualization';
import { BrokenPathsAnalysis } from '@/components/admin/BrokenPathsAnalysis';
import { AIInsightsPanel } from '@/components/admin/AIInsightsPanel';
import { UserSegmentsCard } from '@/components/admin/UserSegmentsCard';
import { KPIEmailSubscription } from '@/components/admin/KPIEmailSubscription';

type TimeWindow = '7d' | '30d' | '90d';

const AIJourneyAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [analytics, setAnalytics] = useState<JourneyAnalytics | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, timeWindow]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: adminCheck, error } = await supabase
        .rpc('is_admin', { _user_id: user.id });

      if (error || !adminCheck) {
        toast({
          title: 'Access Denied',
          description: 'Admin privileges required',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Admin access check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setRefreshing(true);
    try {
      const days = timeWindow === '7d' ? 7 : timeWindow === '30d' ? 30 : 90;
      const data = await fetchJourneyAnalytics(days);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Link>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">AI Journey Analytics</h1>
                <Badge variant="outline" className="ml-2">CTO View</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeWindow} onValueChange={(v) => setTimeWindow(v as TimeWindow)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {analytics && (
                <span className="text-sm text-muted-foreground">
                  Updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {analytics && (
          <>
            {/* Health Score + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className={`col-span-1 ${getHealthScoreBg(analytics.healthScore)}`}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Journey Health Score</p>
                  <p className={`text-5xl font-bold ${getHealthScoreColor(analytics.healthScore)}`}>
                    {analytics.healthScore}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">out of 100</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Total Sessions</span>
                  </div>
                  <p className="text-3xl font-bold">{analytics.flow.totalSessions.toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Unique Users</span>
                  </div>
                  <p className="text-3xl font-bold">{analytics.flow.uniqueUsers.toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Issues Detected</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {analytics.brokenPaths.filter(p => p.severity !== 'info').length}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="destructive" className="text-xs">
                      {analytics.brokenPaths.filter(p => p.severity === 'critical').length} critical
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {analytics.brokenPaths.filter(p => p.severity === 'warning').length} warnings
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
<Tabs defaultValue="insights" className="space-y-6">
              <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="flow" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  User Flow
                </TabsTrigger>
                <TabsTrigger value="broken" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Broken Paths
                </TabsTrigger>
                <TabsTrigger value="segments" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Segments
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Email Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights">
                <AIInsightsPanel insights={analytics.aiInsights} />
              </TabsContent>

              <TabsContent value="flow">
                <JourneyFlowVisualization 
                  flow={analytics.flow} 
                  funnel={analytics.conversionFunnel}
                />
              </TabsContent>

              <TabsContent value="broken">
                <BrokenPathsAnalysis brokenPaths={analytics.brokenPaths} />
              </TabsContent>

              <TabsContent value="segments">
                <UserSegmentsCard 
                  segments={analytics.userSegments}
                  trafficSources={analytics.trafficSources}
                />
              </TabsContent>

              <TabsContent value="email">
                <KPIEmailSubscription />
              </TabsContent>
            </Tabs>

            {/* Conversion Summary Card */}
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Free-to-Paid Conversion Summary
                </CardTitle>
                <CardDescription>
                  Key metrics for monetization funnel optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {analytics.conversionFunnel.map(stage => (
                    <div key={stage.stage} className="text-center p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">{stage.displayName}</p>
                      <p className="text-2xl font-bold">{stage.count.toLocaleString()}</p>
                      {stage.rate < 100 && (
                        <p className={`text-xs ${
                          stage.performance === 'above' ? 'text-green-500' :
                          stage.performance === 'below' ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {stage.rate.toFixed(1)}% conv
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!analytics && !refreshing && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              Analytics data could not be loaded. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default AIJourneyAnalytics;
