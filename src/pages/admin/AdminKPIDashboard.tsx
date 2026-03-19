import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, ArrowLeft, RefreshCw, TrendingUp, Users, Bell, 
  DollarSign, AlertTriangle, CheckCircle, XCircle, BarChart3, Clock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchKPIData, TimeWindow, KPIData } from "@/services/adminKpiService";
import { DataScalingCard } from "@/components/admin/DataScalingCard";
import { UserGeographyCard } from "@/components/admin/UserGeographyCard";

const AdminKPIDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [planCounts, setPlanCounts] = useState({ free: 0, lite: 0, plus: 0, pro: 0, team: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadKPIData();
    }
  }, [isAdmin, timeWindow]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: adminCheck, error } = await supabase
        .rpc('is_admin', { _user_id: user.id });

      if (error || !adminCheck) {
        toast({
          title: "Access Denied",
          description: "Admin privileges required",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Admin access check failed:', error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    setRefreshing(true);
    try {
      const data = await fetchKPIData(timeWindow);
      setKpiData(data);
      
      // Fetch subscription plan counts for scaling card
      const { data: planData } = await supabase
        .from('profiles')
        .select('subscription_plan');
      
      if (planData) {
        const counts = { free: 0, lite: 0, plus: 0, pro: 0, team: 0 };
        planData.forEach((p: { subscription_plan: string | null }) => {
          const plan = (p.subscription_plan || 'free').toLowerCase();
          if (plan === 'starter' || plan === 'free') counts.free++;
          else if (plan === 'lite') counts.lite++;
          else if (plan === 'plus') counts.plus++;
          else if (plan === 'pro') counts.pro++;
          else if (plan === 'elite' || plan === 'team') counts.team++;
        });
        setPlanCounts(counts);
      }
    } catch (error) {
      console.error('Error loading KPI data:', error);
      toast({
        title: "Error",
        description: "Failed to load KPI data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin || !kpiData) {
    return null;
  }

  const { funnel, activation, retention, usage, topSymbols, topPatterns, monetization, dataQuality, wedgePurity, wedgePatternPurity, timeToStep, wedgeTimeToStep, northStar, revenueIntent, cohorts, validatedTraders, stripeConversion } = kpiData;

  // Calculate funnel conversion rates
  const funnelSteps = [
    { name: 'Sessions', count: funnel.sessions, rate: 100 },
    { name: 'Signups', count: funnel.signups, rate: funnel.sessions > 0 ? (funnel.signups / funnel.sessions) * 100 : 0 },
    { name: 'Preset Loads', count: funnel.presetLoads, rate: funnel.signups > 0 ? (funnel.presetLoads / funnel.signups) * 100 : 0 },
    { name: 'Backtests', count: funnel.backtestCompletions, rate: funnel.presetLoads > 0 ? (funnel.backtestCompletions / funnel.presetLoads) * 100 : 0 },
    { name: 'Alerts Created', count: funnel.alertCreations, rate: funnel.backtestCompletions > 0 ? (funnel.alertCreations / funnel.backtestCompletions) * 100 : 0 },
    { name: 'Return After Alert', count: funnel.returnAfterAlert, rate: funnel.alertCreations > 0 ? (funnel.returnAfterAlert / funnel.alertCreations) * 100 : 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Link>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Crypto 1H Wedge KPIs</h1>
                <Badge variant="outline">Beta</Badge>
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
              <Button onClick={loadKPIData} variant="outline" size="sm" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date(kpiData.lastRefreshed).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Data Quality Warnings */}
        {dataQuality.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Quality Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2">
                {dataQuality.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* North Star + Validated Traders + Stripe Conversion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">🌟 Activated Traders</p>
                  <p className="text-3xl font-bold text-primary">{northStar.activatedTraders}</p>
                  <p className="text-xs text-muted-foreground">
                    Backtest + Alert in 24h
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">✅ Validated Traders</p>
                  <p className="text-3xl font-bold text-green-600">{validatedTraders.validatedTraders}</p>
                  <p className="text-xs text-muted-foreground">
                    Alert triggered in 7d
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Validation Rate</p>
                  <p className="text-3xl font-bold">{validatedTraders.validatedVsActivated.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    Median: {validatedTraders.medianTimeToFirstTriggerHours?.toFixed(1) || 'N/A'}h to trigger
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Checkout Started</p>
                  <p className="text-3xl font-bold">{stripeConversion.checkoutStarted}</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeConversion.checkoutCompleted} client completed
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">💵 Paid Started (Webhook)</p>
                  <p className="text-3xl font-bold text-green-600">{stripeConversion.paidStarted}</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeConversion.conversionRate.toFixed(1)}% of checkouts
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Scaling Widget */}
        <DataScalingCard planCounts={planCounts} />

        {/* Funnel + Activation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activation Funnel</CardTitle>
              <CardDescription>
                User journey from landing to alert creation
                {!funnel.landingInstrumented && (
                  <Badge variant="outline" className="ml-2 text-amber-600">
                    Landing views proxied
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="w-32">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnelSteps.map((step, i) => (
                    <TableRow key={step.name}>
                      <TableCell className="font-medium">{step.name}</TableCell>
                      <TableCell className="text-right">{step.count}</TableCell>
                      <TableCell className="text-right">
                        {i === 0 ? '-' : `${step.rate.toFixed(1)}%`}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(step.rate, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Activation Metrics</CardTitle>
              <CardDescription>
                Users who completed backtest + alert within 72h of signup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Signups</p>
                  <p className="text-2xl font-bold">{activation.totalSignups}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Activated</p>
                  <p className="text-2xl font-bold text-primary">{activation.activatedUsers}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Median time to first backtest</span>
                  <span className="font-medium">
                    {activation.medianTimeToBacktestHours 
                      ? `${activation.medianTimeToBacktestHours.toFixed(1)}h`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Median time to first alert</span>
                  <span className="font-medium">
                    {activation.medianTimeToAlertHours 
                      ? `${activation.medianTimeToAlertHours.toFixed(1)}h`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Activation Rate</span>
                  <span className="text-2xl font-bold text-primary">
                    {activation.activationRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Symbols + Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Symbols</CardTitle>
              <CardDescription>Most used in presets, backtests, and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {topSymbols.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSymbols.map((item, i) => (
                      <TableRow key={item.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                            <span className="font-mono font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Patterns</CardTitle>
              <CardDescription>Most used patterns across all events</CardDescription>
            </CardHeader>
            <CardContent>
              {topPatterns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pattern</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPatterns.map((item, i) => (
                      <TableRow key={item.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Performance + Monetization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Performance</CardTitle>
              <CardDescription>Alert creation and trigger statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{usage.totalAlerts}</p>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{usage.activeAlerts}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{usage.triggeredAlerts}</p>
                  <p className="text-sm text-muted-foreground">Triggered</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Active Alerts by Plan</p>
                {usage.alertsByPlan.map(({ plan, count }) => (
                  <div key={plan} className="flex items-center gap-2">
                    <Badge variant={plan === 'elite' ? 'default' : 'secondary'} className="w-16 justify-center">
                      {plan}
                    </Badge>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${usage.activeAlerts > 0 ? (count / usage.activeAlerts) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg backtests/user</span>
                  <span className="font-medium">{usage.avgBacktestsPerUser.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg alerts/user</span>
                  <span className="font-medium">{usage.avgAlertsPerUser.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monetization</CardTitle>
              <CardDescription>Paywall interactions and conversions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Paywall Shown</p>
                  <p className="text-2xl font-bold">{monetization.paywallShown}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pricing Clicked</p>
                  <p className="text-2xl font-bold">{monetization.pricingClicked}</p>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-3xl font-bold text-primary">{monetization.conversions}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold text-primary">
                      {monetization.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {monetization.paywallShown === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No paywall events recorded. Check instrumentation.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wedge Purity + Pattern Purity + Time-to-Step Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Wedge Purity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Wedge Purity
              </CardTitle>
              <CardDescription>
                Events that match crypto + 1H (should be 100% after hardening)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-primary">{wedgePurity.purityRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {wedgePurity.totalEvents - wedgePurity.nonWedgeEvents} / {wedgePurity.totalEvents} events
                  </p>
                </div>
                {wedgePurity.purityRate < 100 && (
                  <Badge variant="destructive">
                    {wedgePurity.nonWedgeEvents} violations
                  </Badge>
                )}
                {wedgePurity.purityRate === 100 && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Perfect
                  </Badge>
                )}
              </div>

              {wedgePurity.violations.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Top Violations</p>
                  {wedgePurity.violations.slice(0, 5).map((v, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="font-mono text-muted-foreground">
                        {v.instrumentCategory} / {v.timeframe}
                      </span>
                      <span className="text-red-600">{v.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wedge Pattern Purity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Wedge Pattern Purity
              </CardTitle>
              <CardDescription>
                % of backtests where enabled_patterns ⊆ SUPPORTED_WEDGE_PATTERN_IDS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-primary">{wedgePatternPurity.purityRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {wedgePatternPurity.pureBacktests} / {wedgePatternPurity.totalBacktests} backtests
                  </p>
                </div>
                {wedgePatternPurity.purityRate < 100 && (
                  <Badge variant="destructive">
                    {wedgePatternPurity.totalBacktests - wedgePatternPurity.pureBacktests} violations
                  </Badge>
                )}
                {wedgePatternPurity.purityRate === 100 && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Perfect
                  </Badge>
                )}
              </div>

              {wedgePatternPurity.violations.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Top Unsupported Patterns</p>
                  {wedgePatternPurity.violations.slice(0, 5).map((v, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="font-mono text-muted-foreground truncate max-w-[180px]" title={v.patterns.join(', ')}>
                        {v.patterns.join(', ')}
                      </span>
                      <span className="text-red-600">{v.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time-to-Step Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Between Steps
              </CardTitle>
              <CardDescription>
                Median minutes between funnel steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Preset → Backtest</span>
                  <span className="font-bold">
                    {timeToStep.presetToBacktest 
                      ? `${timeToStep.presetToBacktest.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Backtest → Create Alert</span>
                  <span className="font-bold">
                    {timeToStep.backtestToAlert 
                      ? `${timeToStep.backtestToAlert.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Create Alert → Signup</span>
                  <span className="font-bold">
                    {timeToStep.alertToSignup 
                      ? `${timeToStep.alertToSignup.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Signup → Alert Created</span>
                  <span className="font-bold">
                    {timeToStep.signupToAlert 
                      ? `${timeToStep.signupToAlert.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wedge-Only Time-to-Step Metrics */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Wedge Time-to-Step
                <Badge variant="outline" className="text-xs">Crypto 1H Only</Badge>
              </CardTitle>
              <CardDescription>
                Median minutes for wedge sessions only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="text-sm">Preset → Backtest</span>
                  <span className="font-bold text-primary">
                    {wedgeTimeToStep.presetToBacktest 
                      ? `${wedgeTimeToStep.presetToBacktest.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="text-sm">Backtest → Click Create Alert</span>
                  <span className="font-bold text-primary">
                    {wedgeTimeToStep.backtestToCreateAlertClicked 
                      ? `${wedgeTimeToStep.backtestToCreateAlertClicked.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="text-sm">Click → Alert Created</span>
                  <span className="font-bold text-primary">
                    {wedgeTimeToStep.createAlertClickedToAlertCreated 
                      ? `${wedgeTimeToStep.createAlertClickedToAlertCreated.toFixed(1)} min`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Quality Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Event Instrumentation Status</CardTitle>
            <CardDescription>Events detected in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                'signup_completed',
                'preset_loaded',
                'backtest_started',
                'backtest_completed',
                'alert_created',
                'share_created',
                'paywall_shown',
                'pricing_clicked',
                'paid_started',
              ].map(eventName => {
                const isPresent = dataQuality.eventsPresent.includes(eventName);
                return (
                  <div 
                    key={eventName}
                    className={`p-3 rounded-lg border flex items-center gap-2 ${
                      isPresent ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    }`}
                  >
                    {isPresent ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-mono ${isPresent ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {eventName}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminKPIDashboard;
