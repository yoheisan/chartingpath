import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Bell, Plus, Pause, Play, Trash2, ArrowLeft, Crown, Zap, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserProfile {
  subscription_plan: 'starter' | 'pro' | 'elite';
  subscription_status: string;
}

interface Alert {
  id: string;
  symbol: string;
  timeframe: string;
  pattern: string;
  status: string;
  created_at: string;
}

const MemberAlerts = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [pattern, setPattern] = useState("");

  const patternOptions = [
    { value: 'hammer', label: 'Hammer' },
    { value: 'inverted_hammer', label: 'Inverted Hammer' },
    { value: 'bullish_engulfing', label: 'Bullish Engulfing' },
    { value: 'bearish_engulfing', label: 'Bearish Engulfing' },
    { value: 'doji', label: 'Doji' },
    { value: 'morning_star', label: 'Morning Star' },
    { value: 'evening_star', label: 'Evening Star' },
    { value: 'ema_cross_bullish', label: 'EMA Cross (Bullish)' },
    { value: 'ema_cross_bearish', label: 'EMA Cross (Bearish)' },
    { value: 'rsi_divergence_bullish', label: 'RSI Divergence (Bullish)' },
    { value: 'rsi_divergence_bearish', label: 'RSI Divergence (Bearish)' },
  ];

  const timeframeOptions = [
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await fetchProfile(user.id);
        await fetchAlerts(user.id);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        return;
      }

      setProfile(data || { subscription_plan: 'starter', subscription_status: 'active' });
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchAlerts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Alerts fetch error:', error);
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      console.error('Alerts fetch error:', error);
    }
  };

  const createAlert = async () => {
    if (!user || !symbol || !timeframe || !pattern) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          timeframe: timeframe as any,
          pattern: pattern as any,
          status: 'active' as any
        } as any);

      if (error) {
        toast({
          title: "Error Creating Alert",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alert Created",
        description: `Alert for ${symbol.toUpperCase()} ${pattern} pattern created successfully`,
      });

      // Reset form
      setSymbol("");
      setTimeframe("");
      setPattern("");

      // Refresh alerts
      await fetchAlerts(user.id);
    } catch (error) {
      console.error('Create alert error:', error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleAlert = async (alertId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alert Updated",
        description: `Alert ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      await fetchAlerts(user.id);
    } catch (error) {
      console.error('Toggle alert error:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'deleted' })
        .eq('id', alertId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alert Deleted",
        description: "Alert deleted successfully",
      });

      await fetchAlerts(user.id);
    } catch (error) {
      console.error('Delete alert error:', error);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Star className="h-4 w-4" />;
      case 'elite': return <Crown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case 'pro': return { max: 3, name: 'Pro' };
      case 'elite': return { max: 999999, name: 'Elite' };
      default: return { max: 0, name: 'Starter' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to access chart pattern alerts.
            </p>
            <Button asChild>
              <Link to="/auth">Log In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const planLimits = getPlanLimits(profile?.subscription_plan || 'starter');
  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const canCreateMore = planLimits.max === 999999 || activeAlerts.length < planLimits.max;

  // Upsell screen for Starter users
  if (profile?.subscription_plan === 'starter') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Chart Pattern Alerts
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant email notifications when chart patterns form on your favorite instruments.
            </p>
          </div>

          {/* Upsell Card */}
          <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Upgrade to Access Alerts</CardTitle>
              <CardDescription className="text-base">
                Chart Pattern Email Alerts are available for Pro and Elite subscribers only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Pro Plan</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      $79/month - 3 active alerts
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Email alerts for 11 chart patterns</li>
                      <li>• 4 timeframe options</li>
                      <li>• Real-time pattern detection</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Elite Plan</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      $199/month - Unlimited alerts
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Everything in Pro</li>
                      <li>• Unlimited active alerts</li>
                      <li>• Priority alert processing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/pricing">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/pricing">View All Plans</Link>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  <strong>Disclaimer:</strong> Alerts are for educational use only and do not constitute financial advice. Trading involves risk of loss.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Chart Pattern Alerts
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Get instant email notifications when chart patterns form on your favorite instruments.
          </p>
          
          {/* Plan Status */}
          <div className="flex items-center justify-center gap-2">
            <Badge className="flex items-center gap-1">
              {getPlanIcon(profile?.subscription_plan || 'starter')}
              {planLimits.name} Plan
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({activeAlerts.length}/{planLimits.max === 999999 ? '∞' : planLimits.max} active alerts)
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Create Alert Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Alert
              </CardTitle>
              <CardDescription>
                Set up email notifications for chart pattern formations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., AAPL, EURUSD, BTCUSDT"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern">Chart Pattern</Label>
                <Select value={pattern} onValueChange={setPattern}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {patternOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={createAlert} 
                disabled={creating || !canCreateMore}
                className="w-full"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Alert...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </>
                )}
              </Button>

              {!canCreateMore && (
                <p className="text-sm text-muted-foreground text-center">
                  Alert limit reached. 
                  <Link to="/pricing" className="text-primary hover:underline ml-1">
                    Upgrade to create more alerts
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Alerts ({alerts.length})</CardTitle>
              <CardDescription>
                Manage your active chart pattern alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts created yet</p>
                  <p className="text-sm text-muted-foreground">Create your first alert to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.symbol}</span>
                          <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patternOptions.find(p => p.value === alert.pattern)?.label} on {timeframeOptions.find(t => t.value === alert.timeframe)?.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAlert(alert.id, alert.status)}
                        >
                          {alert.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this alert? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAlert(alert.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Chart Pattern Alerts Work</CardTitle>
            <CardDescription>
              Understanding our automated pattern detection system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Monitor Markets</h4>
                <p className="text-sm text-muted-foreground">
                  Our system continuously monitors market data for your selected instruments and timeframes
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Pattern Detection</h4>
                <p className="text-sm text-muted-foreground">
                  When a candle closes and forms your selected pattern, our algorithms detect it instantly
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Email Alert</h4>
                <p className="text-sm text-muted-foreground">
                  You receive an instant email with pattern details and a link to view the chart
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 mb-1">Important Disclaimer</p>
                <p className="text-amber-700">
                  Chart pattern alerts are for educational purposes only and do not constitute financial advice. 
                  Trading involves substantial risk of loss. Always conduct your own research and consider your risk tolerance before making trading decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberAlerts;