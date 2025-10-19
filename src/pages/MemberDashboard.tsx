import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Database, 
  Code, 
  BookOpen, 
  Download, 
  Bell, 
  BarChart3,
  Crown,
  ArrowRight,
  Calendar,
  Trophy,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MemberNavigation from "@/components/MemberNavigation";
import { useToast } from "@/hooks/use-toast";

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
  achievements: number;
}

const MemberDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageStats>({
    backtestRuns: 0,
    paperTrades: 0,
    alerts: 0,
    achievements: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
        await fetchUsageStats(user.id);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      toast({
        title: "Authentication Error",
        description: "Please log in to access your dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchUsageStats = async (userId: string) => {
    try {
      // Fetch backtest runs count
      const { count: backtestCount } = await supabase
        .from('backtest_runs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Fetch paper trades count
      const { count: tradesCount } = await supabase
        .from('paper_trades')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Fetch alerts count
      const { count: alertsCount } = await supabase
        .from('alerts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Fetch achievements count
      const { count: achievementsCount } = await supabase
        .from('trading_achievements')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      setUsage({
        backtestRuns: backtestCount || 0,
        paperTrades: tradesCount || 0,
        alerts: alertsCount || 0,
        achievements: achievementsCount || 0
      });
    } catch (error) {
      console.error('Usage stats fetch error:', error);
    }
  };

  const getFeatureAccess = (plan: string) => {
    const features = {
      free: ['Paper Trading', 'Basic Scripts', 'Community'],
      starter: ['Paper Trading', 'Scripts Library', 'Basic Backtesting', 'Community', 'Courses'],
      pro: ['Paper Trading', 'Full Scripts', 'Advanced Backtesting', 'Results Vault', 'Alerts', 'Priority Support', 'Community', 'Courses', 'Downloads'],
      elite: ['All Pro Features', 'Premium Scripts', 'Advanced Analytics', 'Custom Indicators', 'VIP Support', 'Early Access']
    };
    return features[plan as keyof typeof features] || features.free;
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      elite: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to access your member dashboard.</p>
          <Button asChild>
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const features = getFeatureAccess(profile.subscription_plan);
  const memberSince = new Date(profile.created_at).toLocaleDateString();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <MemberNavigation />

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground">
                Member since {memberSince} • {profile.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`px-3 py-1 font-semibold ${getPlanColor(profile.subscription_plan)}`}>
                {profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1)} Plan
              </Badge>
              {profile.subscription_plan === 'elite' && (
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
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage.achievements}</div>
              <p className="text-xs text-muted-foreground">Trading milestones</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Features */}
          <div className="lg:col-span-2">
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
                    <Link to="/members/trading">
                      <TrendingUp className="h-6 w-6" />
                      <span>Paper Trading</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-20 flex-col gap-2">
                    <Link to="/backtest">
                      <BarChart3 className="h-6 w-6" />
                      <span>Backtesting</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-20 flex-col gap-2">
                    <Link to="/members/scripts">
                      <Code className="h-6 w-6" />
                      <span>Scripts Library</span>
                    </Link>
                  </Button>

                  {(profile.subscription_plan === 'pro' || profile.subscription_plan === 'elite') && (
                    <Button asChild variant="outline" className="h-20 flex-col gap-2">
                      <Link to="/vault">
                        <Database className="h-6 w-6" />
                        <span>Results Vault</span>
                      </Link>
                    </Button>
                  )}

                  <Button asChild variant="outline" className="h-20 flex-col gap-2">
                    <Link to="/members/courses">
                      <BookOpen className="h-6 w-6" />
                      <span>Courses</span>
                    </Link>
                  </Button>

                  {(profile.subscription_plan === 'pro' || profile.subscription_plan === 'elite') && (
                    <Button asChild variant="outline" className="h-20 flex-col gap-2">
                      <Link to="/members/alerts">
                        <Bell className="h-6 w-6" />
                        <span>Alerts</span>
                      </Link>
                    </Button>
                  )}
                </div>
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
                
                {profile.subscription_plan !== 'elite' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/pricing">
                        Upgrade Plan
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-4">
                  No recent activity to display
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;