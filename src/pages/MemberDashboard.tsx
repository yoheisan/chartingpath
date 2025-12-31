import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Database, 
  Code, 
  BookOpen, 
  Bell, 
  BarChart3,
  Crown,
  ArrowRight,
  Trophy,
  Activity,
  AlertTriangle,
  RefreshCw,
  FolderKanban,
  Coins
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface UserProfile {
  id: string;
  email?: string;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
}

interface UsageStats {
  backtestRuns: number;
  paperTrades: number;
  alerts: number;
  projectRuns: number;
}

interface RecentRun {
  id: string;
  project_id: string;
  status: string;
  created_at: string;
  credits_used: number;
}

const MemberDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageStats>({
    backtestRuns: 0,
    paperTrades: 0,
    alerts: 0,
    projectRuns: 0
  });
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Data fetch timeout (10 seconds)
  const DATA_TIMEOUT_MS = 10000;

  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (userId: string) => {
    setDataLoading(true);
    setFetchError(null);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DATA_TIMEOUT_MS);
    
    try {
      await Promise.all([
        fetchProfile(userId),
        fetchUsageStats(userId),
        fetchRecentRuns(userId)
      ]);
    } catch (error: any) {
      console.error('Data fetch error:', error);
      if (error.name === 'AbortError') {
        setFetchError('Request timed out. Please check your connection and try again.');
      } else {
        setFetchError(error.message || 'Failed to load dashboard data.');
      }
    } finally {
      clearTimeout(timeoutId);
      setDataLoading(false);
    }
  };

  const handleRetry = () => {
    if (user) {
      fetchData(user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchUsageStats = async (userId: string) => {
    try {
      const [backtestResult, tradesResult, alertsResult, projectRunsResult] = await Promise.all([
        supabase.from('backtest_runs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('paper_trades').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'deleted'),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ]);

      setUsage({
        backtestRuns: backtestResult.count || 0,
        paperTrades: tradesResult.count || 0,
        alerts: alertsResult.count || 0,
        projectRuns: projectRunsResult.count || 0
      });
    } catch (error) {
      console.error('Usage stats fetch error:', error);
    }
  };
  
  const fetchRecentRuns = async (userId: string) => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId);
      
      if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        const { data: runs } = await supabase
          .from('project_runs')
          .select('id, project_id, status, created_at, credits_used')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setRecentRuns(runs || []);
      }
    } catch (error) {
      console.error('Recent runs fetch error:', error);
    }
  };

  const getFeatureAccess = (plan: string) => {
    const features = {
      free: ['Paper Trading', 'Basic Scripts', 'Community'],
      starter: ['Paper Trading', 'Scripts Library', 'Basic Backtesting', 'Community', 'Courses'],
      pro: ['Paper Trading', 'Full Scripts', 'Advanced Backtesting', 'Results Vault', 'Alerts', 'Priority Support'],
      pro_plus: ['All Pro Features', 'Setup Finder', 'Pine Export', 'Advanced Analytics'],
      elite: ['All Pro+ Features', 'Unlimited Runs', 'VIP Support', 'Early Access']
    };
    return features[plan as keyof typeof features] || features.free;
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-muted text-muted-foreground',
      starter: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      pro: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      pro_plus: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      elite: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
    };
    return colors[plan] || colors.free;
  };

  // Loading state - auth check or data loading
  if (authLoading || (user && dataLoading && !profile)) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If still no user after auth check, the hook will redirect
  if (!user) {
    return null;
  }

  // Error state for data fetching
  if (fetchError) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Failed to Load Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">{fetchError}</p>
                </div>
                <Button onClick={handleRetry} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const features = getFeatureAccess(profile?.subscription_plan || 'free');
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A';
  const planName = profile?.subscription_plan || 'free';

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">

      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-muted-foreground">
              Member since {memberSince} • {user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`px-3 py-1 font-semibold ${getPlanColor(planName)}`}>
              {planName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Plan
            </Badge>
            {planName === 'elite' && (
              <Crown className="h-5 w-5 text-yellow-500" />
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backtest Runs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.backtestRuns}</div>
            <p className="text-xs text-muted-foreground">Total strategies tested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paper Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.paperTrades}</div>
            <p className="text-xs text-muted-foreground">Simulated trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.alerts}</div>
            <p className="text-xs text-muted-foreground">Market notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.projectRuns}</div>
            <p className="text-xs text-muted-foreground">Created projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Features */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/projects">
                    <FolderKanban className="h-6 w-6" />
                    <span>Projects Hub</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/projects/setup-finder/new">
                    <TrendingUp className="h-6 w-6" />
                    <span>New Setup Finder</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/members/scripts">
                    <Code className="h-6 w-6" />
                    <span>Scripts Library</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/vault">
                    <Database className="h-6 w-6" />
                    <span>Results Vault</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/members/courses">
                    <BookOpen className="h-6 w-6" />
                    <span>Courses</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/members/alerts">
                    <Bell className="h-6 w-6" />
                    <span>Alerts</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Recent Runs
              </CardTitle>
              <CardDescription>Your last 5 project runs</CardDescription>
            </CardHeader>
            <CardContent>
              {recentRuns.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No project runs yet</p>
                  <Button asChild variant="link" size="sm" className="mt-2">
                    <Link to="/projects/setup-finder/new">Start your first scan</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRuns.map((run) => (
                    <Link 
                      key={run.id} 
                      to={`/projects/runs/${run.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={run.status === 'succeeded' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                          {run.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(run.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        {run.credits_used}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              {planName !== 'elite' && (
                <div className="mt-4 pt-4 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/projects/pricing">
                      Upgrade Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
