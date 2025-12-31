import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemberNavigation from "@/components/MemberNavigation";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Bell, Plus, TrendingUp, ArrowLeft, Star, Crown, Zap, Pause, Play, Trash2, AlertTriangle, Lock } from "lucide-react";
import { wedgeConfig } from "@/config/wedge";
import { usePlaybookContext } from "@/hooks/usePlaybookContext";
import { trackAlertCreated, trackPaywallShown } from "@/services/analytics";

interface UserProfile {
  subscription_plan: 'free' | 'starter' | 'pro' | 'pro_plus' | 'elite';
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

const LOADING_TIMEOUT_MS = 8000;

const MemberAlerts = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { playbookContext, clearPlaybookContext } = usePlaybookContext();

  // Form state - prefilled from playbook context if available
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState(wedgeConfig.wedgeEnabled ? "1h" : "");
  const [pattern, setPattern] = useState("");

  // Pattern options aligned with wedge config
  const patternOptions = [
    { value: 'donchian_breakout_long', label: 'Donchian Breakout (Long)' },
    { value: 'donchian_breakout_short', label: 'Donchian Breakout (Short)' },
    { value: 'double_top', label: 'Double Top (Short)' },
    { value: 'double_bottom', label: 'Double Bottom (Long)' },
    { value: 'ascending_triangle', label: 'Ascending Triangle (Long)' },
    { value: 'descending_triangle', label: 'Descending Triangle (Short)' },
    { value: 'hammer', label: 'Hammer' },
    { value: 'inverted_hammer', label: 'Inverted Hammer' },
    { value: 'bullish_engulfing', label: 'Bullish Engulfing' },
    { value: 'bearish_engulfing', label: 'Bearish Engulfing' },
    { value: 'doji', label: 'Doji' },
    { value: 'morning_star', label: 'Morning Star' },
    { value: 'evening_star', label: 'Evening Star' },
    { value: 'ema_cross_bullish', label: 'EMA Cross (Bullish)' },
    { value: 'ema_cross_bearish', label: 'EMA Cross (Bearish)' },
  ];

  // Timeframe options - 1h is default for wedge mode
  const timeframeOptions = wedgeConfig.wedgeEnabled ? [
    { value: '1h', label: '1 Hour (Recommended)' },
    { value: '15m', label: '15 Minutes' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ] : [
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];

  // Get alert limits from wedgeConfig (single source of truth)
  const getAlertLimits = (plan: string) => {
    const limits = wedgeConfig.alertLimits;
    switch (plan) {
      case 'free': return { max: limits.free, name: 'Free' };
      case 'starter': return { max: limits.starter, name: 'Starter' };
      case 'pro': return { max: limits.pro, name: 'Pro' };
      case 'pro_plus': return { max: limits.pro_plus, name: 'Pro+' };
      case 'elite': return { max: limits.elite, name: 'Elite' };
      default: return { max: limits.free, name: 'Free' };
    }
  };

  // Prefill form from playbook context
  useEffect(() => {
    if (playbookContext) {
      console.log('[MemberAlerts] Prefilling from playbook context:', playbookContext);
      if (playbookContext.symbol) {
        setSymbol(playbookContext.symbol);
      }
      if (playbookContext.pattern) {
        // Map pattern names to form values - support both old and new names
        const patternMap: Record<string, string> = {
          'Donchian Breakout (Long)': 'donchian_breakout_long',
          'Donchian Breakout (Short)': 'donchian_breakout_short',
          'Double Top (Short)': 'double_top',
          'Double Bottom (Long)': 'double_bottom',
          'Ascending Triangle (Long)': 'ascending_triangle',
          'Descending Triangle (Short)': 'descending_triangle',
          // Legacy mappings for backward compatibility
          'Breakout': 'donchian_breakout_long',
          'DoubleTopBottom': 'double_top',
          'Triangle': 'ascending_triangle',
        };
        setPattern(patternMap[playbookContext.pattern] || playbookContext.pattern.toLowerCase());
      }
      if (playbookContext.timeframe) {
        setTimeframe(playbookContext.timeframe);
      }
    }
  }, [playbookContext]);

  useEffect(() => {
    checkAuth();
    
    // Timeout fallback - if loading takes too long, show error UI
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoadingTimedOut(true);
        setLoading(false);
        setFetchError('Request timed out. Please check your connection and try again.');
      }
    }, LOADING_TIMEOUT_MS);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const checkAuth = async () => {
    setFetchError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      setUser(user);

      if (user) {
        await fetchProfile(user.id);
        await fetchAlerts(user.id);
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setFetchError(error.message || 'Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = () => {
    setLoading(true);
    setLoadingTimedOut(false);
    setFetchError(null);
    checkAuth();
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

      setProfile(data || { subscription_plan: 'free', subscription_status: 'active' });
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

  // Create alert via edge function (server-side enforcement)
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
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-alert', {
        body: {
          symbol: symbol.toUpperCase(),
          pattern,
          timeframe,
          action: 'create',
          wedgeEnabled: wedgeConfig.wedgeEnabled
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.code === 'ALERT_LIMIT') {
        // Track paywall shown
        trackPaywallShown({
          context: 'alerts_limit',
          current_plan: profile?.subscription_plan || 'free',
          limit_type: 'alert_creation'
        });
        
        toast({
          title: "Alert Limit Reached",
          description: `You've reached your ${result.max} alert limit. Upgrade to create more alerts.`,
          variant: "destructive",
        });
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create alert');
      }

      // Track analytics event
      trackAlertCreated({
        symbol: symbol.toUpperCase(),
        pattern,
        timeframe,
        plan_tier: profile?.subscription_plan || 'free'
      });

      toast({
        title: "Alert Created",
        description: `Alert for ${symbol.toUpperCase()} ${pattern} pattern created successfully`,
      });

      // Clear playbook context after successful creation
      clearPlaybookContext();

      // Reset form
      setSymbol("");
      setTimeframe(wedgeConfig.wedgeEnabled ? "1h" : "");
      setPattern("");

      // Refresh alerts
      await fetchAlerts(user.id);
    } catch (error: any) {
      console.error('Create alert error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Toggle alert via edge function (to enforce limits on enable)
  const toggleAlert = async (alertId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      if (newStatus === 'active') {
        // Use edge function to check limits when enabling
        const response = await supabase.functions.invoke('create-alert', {
          body: {
            alertId,
            action: 'enable'
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const result = response.data;
        if (result.code === 'ALERT_LIMIT') {
          // Track paywall shown
          trackPaywallShown({
            context: 'alerts_limit',
            current_plan: profile?.subscription_plan || 'free',
            limit_type: 'alert_enable'
          });
          
          toast({
            title: "Alert Limit Reached",
            description: `You've reached your ${result.max} alert limit. Upgrade or pause another alert first.`,
            variant: "destructive",
          });
          return;
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to enable alert');
        }
      } else {
        // Pausing doesn't need limit check
        const { error } = await supabase
          .from('alerts')
          .update({ status: newStatus })
          .eq('id', alertId);

        if (error) throw error;
      }

      toast({
        title: "Alert Updated",
        description: `Alert ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      await fetchAlerts(user.id);
    } catch (error: any) {
      console.error('Toggle alert error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update alert",
        variant: "destructive",
      });
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
      case 'pro':
      case 'pro_plus': return <Star className="h-4 w-4" />;
      case 'elite': return <Crown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <MemberNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            {/* Loading skeleton */}
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading alerts...</p>
            <div className="space-y-3 max-w-md mx-auto">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded animate-pulse w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (including timeout)
  if (fetchError) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <MemberNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Failed to Load Alerts</h3>
                  <p className="text-sm text-muted-foreground mt-1">{fetchError}</p>
                </div>
                <Button onClick={handleRetry} className="mt-4">
                  <Bell className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <MemberNavigation />
        <div className="text-center mt-8">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            Please log in to access chart pattern alerts.
          </p>
          <Button asChild>
            <Link to="/auth?redirect=/members/alerts">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const planLimits = getAlertLimits(profile?.subscription_plan || 'free');
  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const canCreateMore = planLimits.max === 999999 || activeAlerts.length < planLimits.max;

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <MemberNavigation />
        
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
            {getPlanIcon(profile?.subscription_plan || 'free')}
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
              {playbookContext && (
                <Badge variant="secondary" className="ml-2">
                  Prefilled from playbook
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder={wedgeConfig.wedgeEnabled ? "e.g., BTC, ETH, SOL" : "e.g., AAPL, EURUSD, BTCUSDT"}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">
                Timeframe
                {wedgeConfig.wedgeEnabled && (
                  <Badge variant="outline" className="ml-2 text-xs">1H recommended</Badge>
                )}
              </Label>
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

            {!canCreateMore ? (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Alert limit reached</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You're using {activeAlerts.length}/{planLimits.max} alerts on your {planLimits.name} plan.
                </p>
                <Button asChild size="sm">
                  <Link to="/pricing">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade for More Alerts
                  </Link>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={createAlert} 
                disabled={creating}
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
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Your Alerts
            </CardTitle>
            <CardDescription>
              Manage your active chart pattern alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No alerts created yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first alert to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{alert.symbol}</span>
                          <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.pattern} • {alert.timeframe}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
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
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this alert for {alert.symbol}? This action cannot be undone.
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

      {/* How It Works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Create Alert</h3>
              <p className="text-sm text-muted-foreground">
                Set up alerts for your favorite symbols and patterns
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Pattern Detection</h3>
              <p className="text-sm text-muted-foreground">
                Our system monitors markets and detects patterns on closed {wedgeConfig.wedgeEnabled ? '1H' : ''} candles
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Get Notified</h3>
              <p className="text-sm text-muted-foreground">
                Receive instant email alerts when patterns are detected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          <strong>Disclaimer:</strong> Alerts are for educational use only and do not constitute financial advice. Trading involves risk of loss. Past pattern performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
};

export default MemberAlerts;
