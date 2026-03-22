import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Bell, Plus, TrendingUp, ArrowLeft, Star, Crown, Zap, Pause, Play, Trash2, AlertTriangle, Lock, RefreshCw, Search, X, Mail, Smartphone, Code, Repeat, ArrowRight, CheckCircle2, Bot, Webhook, Copy, ShieldCheck, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { wedgeConfig } from "@/config/wedge";
import { usePlaybookContext } from "@/hooks/usePlaybookContext";
import { trackAlertCreated, trackPaywallShown } from "@/services/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { PageMeta } from '@/components/PageMeta';
import { useAuthGate } from "@/hooks/useAuthGate";
import { AuthGateDialog } from "@/components/AuthGateDialog";
import { UniversalSymbolSearch } from "@/components/charts/UniversalSymbolSearch";
import { Checkbox } from "@/components/ui/checkbox";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PushNotificationPrompt } from "@/components/alerts/PushNotificationPrompt";
import { AlertHistoryLog } from "@/components/alerts/AlertHistoryLog";
import { PlanAlertGenerator } from "@/components/alerts/PlanAlertGenerator";
import { useMasterPlan } from "@/hooks/useMasterPlan";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
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
  auto_paper_trade?: boolean;
  webhook_url?: string | null;
}

const MemberAlerts = () => {
  const { t } = useTranslation();
  const { user, isAuthLoading: authLoading } = useAuth();
  const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthGate("alerts");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copilotPaperEnabled, setCopilotPaperEnabled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { playbookContext, clearPlaybookContext } = usePlaybookContext();

  // Data fetch timeout (20 seconds)
  const DATA_TIMEOUT_MS = 20000;

  // Form state
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState(wedgeConfig.wedgeEnabled ? "1h" : "");
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(['email', 'push']);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastCreatedSymbol, setLastCreatedSymbol] = useState("");
  const [lastCreatedPatterns, setLastCreatedPatterns] = useState<string[]>([]);

  // Automation state
  const [autoPaperTrade, setAutoPaperTrade] = useState(false);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const patternOptions = [
    { value: 'donchian-breakout-long', label: t('patternNames.Donchian Breakout (Long)', 'Donchian Breakout (Long)') },
    { value: 'donchian-breakout-short', label: t('patternNames.Donchian Breakout (Short)', 'Donchian Breakout (Short)') },
    { value: 'double-top', label: t('patternNames.Double Top', 'Double Top (Short)') },
    { value: 'double-bottom', label: t('patternNames.Double Bottom', 'Double Bottom (Long)') },
    { value: 'ascending-triangle', label: t('patternNames.Ascending Triangle', 'Ascending Triangle (Long)') },
    { value: 'descending-triangle', label: t('patternNames.Descending Triangle', 'Descending Triangle (Short)') },
    { value: 'head-and-shoulders', label: t('patternNames.Head & Shoulders', 'Head & Shoulders (Short)') },
    { value: 'inverse-head-and-shoulders', label: t('patternNames.Inverse Head & Shoulders', 'Inverse H&S (Long)') },
    { value: 'rising-wedge', label: t('patternNames.Rising Wedge', 'Rising Wedge (Short)') },
    { value: 'falling-wedge', label: t('patternNames.Falling Wedge', 'Falling Wedge (Long)') },
    { value: 'bull-flag', label: t('patternNames.Bull Flag', 'Bull Flag (Long)') },
    { value: 'bear-flag', label: t('patternNames.Bear Flag', 'Bear Flag (Short)') },
    { value: 'cup-and-handle', label: t('patternNames.Cup & Handle', 'Cup & Handle (Long)') },
    { value: 'hammer', label: t('patternNames.Hammer', 'Hammer') },
    { value: 'inverted_hammer', label: t('patternNames.Inverted Hammer', 'Inverted Hammer') },
    { value: 'bullish_engulfing', label: t('patternNames.Bullish Engulfing', 'Bullish Engulfing') },
    { value: 'bearish_engulfing', label: t('patternNames.Bearish Engulfing', 'Bearish Engulfing') },
    { value: 'doji', label: t('patternNames.Doji', 'Doji') },
    { value: 'morning_star', label: t('patternNames.Morning Star', 'Morning Star') },
    { value: 'evening_star', label: t('patternNames.Evening Star', 'Evening Star') },
  ];

  const timeframeOptions = wedgeConfig.wedgeEnabled ? [
    { value: '1h', label: t('alerts.tf1hRec') },
    { value: '15m', label: t('alerts.tf15m') },
    { value: '4h', label: t('alerts.tf4h') },
    { value: '8h', label: t('alerts.tf8h') },
    { value: '1d', label: t('alerts.tf1d') },
  ] : [
    { value: '15m', label: t('alerts.tf15m') },
    { value: '1h', label: t('alerts.tf1h') },
    { value: '4h', label: t('alerts.tf4h') },
    { value: '8h', label: t('alerts.tf8h') },
    { value: '1d', label: t('alerts.tf1d') },
  ];

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
      if (playbookContext.symbol) setSymbol(playbookContext.symbol);
      if (playbookContext.pattern) {
        const patternMap: Record<string, string> = {
          'Donchian Breakout (Long)': 'donchian_breakout_long',
          'Donchian Breakout (Short)': 'donchian_breakout_short',
          'Double Top': 'double-top',
          'Double Bottom': 'double-bottom',
          'Ascending Triangle': 'ascending-triangle',
          'Descending Triangle': 'descending-triangle',
          'Head & Shoulders': 'head-and-shoulders',
          'Inverse H&S': 'inverse-head-and-shoulders',
          'Rising Wedge': 'rising-wedge',
          'Falling Wedge': 'falling-wedge',
          'Bull Flag': 'bull-flag',
          'Bear Flag': 'bear-flag',
          'Cup & Handle': 'cup-and-handle',
          'Triangle': 'ascending-triangle',
        };
        const mappedPattern = patternMap[playbookContext.pattern] || playbookContext.pattern.toLowerCase();
        setSelectedPatterns([mappedPattern]);
      }
      if (playbookContext.timeframe) setTimeframe(playbookContext.timeframe);
      // Deploy-as-Alert extensions: auto-enable paper trading
      if (playbookContext.autoPaperTrade) setAutoPaperTrade(true);
      if (playbookContext.riskPercent) setRiskPercent(playbookContext.riskPercent);
    }
  }, [playbookContext]);

  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (userId: string) => {
    setDataLoading(true);
    setFetchError(null);
    
    let timedOut = false;
    
    // Create timeout for request
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setDataLoading(false);
      setFetchError('Request timed out. Please check your connection and try again.');
    }, DATA_TIMEOUT_MS);
    
    try {
      await Promise.all([
        fetchProfile(userId),
        fetchAlerts(userId)
      ]);
      // If timeout already fired, don't overwrite the error state
      if (timedOut) return;
    } catch (error: any) {
      if (timedOut) return;
      console.error('Data fetch error:', error);
      setFetchError(error.message || 'Failed to load alerts.');
    } finally {
      clearTimeout(timeoutId);
      if (!timedOut) {
        setDataLoading(false);
      }
    }
  };

  const handleRetry = () => {
    if (user) {
      fetchData(user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, subscription_plan, subscription_status')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error);
      return;
    }
    setProfile(data || { id: '', subscription_plan: 'free', subscription_status: 'active' });
  };

  const fetchAlerts = async (userId: string) => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Alerts fetch error:', error);
      return;
    }
    setAlerts(data || []);
  };

  const togglePattern = (patternValue: string) => {
    setSelectedPatterns(prev => 
      prev.includes(patternValue)
        ? prev.filter(p => p !== patternValue)
        : [...prev, patternValue]
    );
  };

  const clearPatterns = () => {
    setSelectedPatterns([]);
  };

  const createAlert = async () => {
    if (!user || !symbol || !timeframe || selectedPatterns.length === 0) {
      toast({
        title: t('alerts.missingInfo'),
        description: t('alerts.missingInfoDesc'),
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await supabase.functions.invoke('create-alert', {
        body: {
          symbol: symbol.toUpperCase(),
          patterns: selectedPatterns,
          timeframe,
          action: 'create',
          auto_paper_trade: autoPaperTrade,
          webhook_url: webhookUrl || null,
          webhook_secret: webhookSecret || null,
          risk_percent: riskPercent,
        }
      });

      if (response.error) throw new Error(response.error.message);

      const result = response.data;

      if (result.code === 'ALERT_LIMIT') {
        trackPaywallShown({
          context: 'alerts_limit',
          current_plan: profile?.subscription_plan || 'free',
          limit_type: 'alert_creation'
        });
        
        toast({
          title: t('alerts.alertLimitReached'),
          description: t('alerts.alertLimitReachedDesc', { max: result.max }),
          variant: "destructive",
        });
        return;
      }

      if (!result.success) throw new Error(result.error || 'Failed to create alert');

      // Track each pattern created
      selectedPatterns.forEach(p => {
        trackAlertCreated({
          symbol: symbol.toUpperCase(),
          pattern: p,
          timeframe,
          plan_tier: profile?.subscription_plan || 'free'
        });
      });

      const alertCount = result.alerts?.length || selectedPatterns.length;
      const createdSymbol = symbol.toUpperCase();
      const createdPatterns = [...selectedPatterns];
      
      toast({
        title: alertCount > 1 ? t('alerts.alertsCreated') : t('alerts.alertCreated'),
        description: t('alerts.alertCreatedDesc', { count: alertCount, symbol: createdSymbol }),
      });

      setLastCreatedSymbol(createdSymbol);
      setLastCreatedPatterns(createdPatterns);
      setShowSuccessDialog(true);

      clearPlaybookContext();
      setSymbol("");
      setTimeframe(wedgeConfig.wedgeEnabled ? "1h" : "");
      setSelectedPatterns([]);

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

  const toggleAlert = async (alertId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      if (newStatus === 'active') {
        const response = await supabase.functions.invoke('create-alert', {
          body: { alertId, action: 'enable' }
        });

        if (response.error) throw new Error(response.error.message);

        const result = response.data;
        if (result.code === 'ALERT_LIMIT') {
          trackPaywallShown({
            context: 'alerts_limit',
            current_plan: profile?.subscription_plan || 'free',
            limit_type: 'alert_enable'
          });
          
          toast({
            title: t('alerts.alertLimitReached'),
            description: t('alerts.alertLimitReachedEnable', { max: result.max }),
            variant: "destructive",
          });
          return;
        }

        if (!result.success) throw new Error(result.error || 'Failed to enable alert');
      } else {
        const { error } = await supabase
          .from('alerts')
          .update({ status: newStatus })
          .eq('id', alertId);

        if (error) throw error;
      }

      toast({
        title: t('alerts.alertUpdated'),
        description: newStatus === 'active' ? t('alerts.alertActivated') : t('alerts.alertPaused'),
      });

      if (user) await fetchAlerts(user.id);
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
        title: t('alerts.alertDeleted'),
        description: t('alerts.alertDeletedDesc'),
      });

      if (user) await fetchAlerts(user.id);
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

  // Loading skeleton
  if (authLoading || (user && dataLoading && alerts.length === 0 && !profile)) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="text-center mb-8">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If no user after auth check, show auth gate
  if (!user) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
             {t('alerts.title')}
           </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
           {t('alerts.subtitle')}
         </p>
          <Button asChild size="lg">
            <Link to={`/auth?redirect=${encodeURIComponent('/members/alerts')}`}>
              <Lock className="h-4 w-4 mr-2" />
              {t('alerts.signInToManage')}
            </Link>
          </Button>
        </div>
        <AuthGateDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          featureLabel="alerts"
        />
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                 <h3 className="font-semibold text-lg">{t('alerts.failedToLoad')}</h3>
                   <p className="text-sm text-muted-foreground mt-1">{fetchError}</p>
                 </div>
                 <Button onClick={handleRetry} className="mt-4">
                   <RefreshCw className="h-4 w-4 mr-2" />
                   {t('alerts.retry')}
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const planLimits = getAlertLimits(profile?.subscription_plan || 'free');
  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const canCreateMore = planLimits.max === 999999 || activeAlerts.length < planLimits.max;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <PageMeta
        title="Pattern Alert System — Get Notified When Patterns Form | ChartingPath"
        description="Set email alerts for any chart pattern on any instrument. ChartingPath scans 800+ markets every hour and notifies you the moment your pattern appears."
        canonicalPath="/members/alerts"
      />
      
      {/* Back Navigation */}
      <div className="mb-6">
         <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
           <ArrowLeft className="h-4 w-4" />
           {t('common.backToHome')}
        </Link>
      </div>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt userId={profile?.id} />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
             {t('alerts.title')}
           </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
           {t('alerts.subtitle')}
         </p>
        
        {/* Plan Status */}
        <div className="flex items-center justify-center gap-2">
          <Badge className="flex items-center gap-1">
            {getPlanIcon(profile?.subscription_plan || 'free')}
            {planLimits.name} {t('alerts.plan')}
          </Badge>
          <span className="text-sm text-muted-foreground">
            ({activeAlerts.length}/{planLimits.max === 999999 ? '∞' : planLimits.max} {t('alerts.statusActive').toLowerCase()})
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create Alert Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
               {t('alerts.createNew')}
             </CardTitle>
            <CardDescription>
               {t('alerts.createNewDesc')}
               {playbookContext && (
                <Badge variant="secondary" className="ml-2">
                  {playbookContext.source === 'pattern-lab' ? t('alerts.prefilledFromPatternLab', 'Pre-filled from Pattern Lab') : t('alerts.prefilledFromPlaybook')}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('alerts.symbol')}</Label>
              <UniversalSymbolSearch
                onSelect={(selectedSymbol) => setSymbol(selectedSymbol)}
                trigger={
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-10 font-normal"
                  >
                    {symbol ? (
                      <span className="text-foreground font-medium">{symbol}</span>
                    ) : (
                     <span className="text-muted-foreground">{t('alerts.searchSymbol')}</span>
                   )}
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </Button>
                }
              />
            </div>

            <div className="space-y-2">
               <Label htmlFor="timeframe">
                 {t('alerts.timeframe')}
               {wedgeConfig.wedgeEnabled && (
                   <Badge variant="outline" className="ml-2 text-xs">{t('alerts.oneHourRecommended')}</Badge>
                 )}
              </Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder={t('alerts.selectTimeframe')} />
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
              <div className="flex items-center justify-between">
                <Label>{t('alerts.chartPatterns')}</Label>
                <div className="flex items-center gap-1">
                  {selectedPatterns.length < patternOptions.length && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedPatterns(patternOptions.map(p => p.value))}
                     >
                       {t('alerts.selectAll')}
                    </Button>
                  )}
                  {selectedPatterns.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={clearPatterns}
                    >
                      {t('alerts.clear')} ({selectedPatterns.length})
                      <X className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {patternOptions.map((option) => (
                  <div 
                    key={option.value} 
                    className="flex items-center space-x-2 py-1"
                  >
                    <Checkbox
                      id={option.value}
                      checked={selectedPatterns.includes(option.value)}
                      onCheckedChange={() => togglePattern(option.value)}
                    />
                    <label
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {selectedPatterns.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('alerts.patternsSelected', { count: selectedPatterns.length })}
                  {planLimits.max !== 999999 && ` ${t('alerts.slotsRemaining', { count: Math.max(0, planLimits.max - activeAlerts.length) })}`}
                </p>
              )}
            </div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <Label>{t('alerts.deliveryMethod')}</Label>
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id="delivery-email"
                    checked={deliveryMethods.includes('email')}
                    onCheckedChange={(checked) => {
                      setDeliveryMethods(prev => 
                        checked 
                          ? [...prev, 'email'] 
                          : prev.filter(m => m !== 'email')
                      );
                    }}
                  />
                  <label htmlFor="delivery-email" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t('alerts.email')}
                  </label>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id="delivery-push"
                    checked={deliveryMethods.includes('push')}
                    onCheckedChange={(checked) => {
                      setDeliveryMethods(prev => 
                        checked 
                          ? [...prev, 'push'] 
                          : prev.filter(m => m !== 'push')
                      );
                    }}
                  />
                  <label htmlFor="delivery-push" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                     {t('alerts.pushNotification')}
                  </label>
                </div>
              </div>
              {deliveryMethods.length === 0 && (
                 <p className="text-xs text-destructive">
                   {t('alerts.selectDelivery')}
                </p>
              )}
            </div>

            {/* Automation Settings */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {t('alerts.automation', 'Automation')}
              </Label>
              
              {/* Auto Paper Trade */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t('alerts.autoPaperTrade', 'Auto Paper Trade')}</Label>
                  <p className="text-xs text-muted-foreground">{t('alerts.autoPaperTradeDesc', 'Auto-open paper trades when pattern triggers')}</p>
                </div>
                <Switch checked={autoPaperTrade} onCheckedChange={setAutoPaperTrade} />
              </div>

              {autoPaperTrade && (
                <div className="space-y-2 pl-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('alerts.riskPercent', 'Risk per trade')}</Label>
                    <span className="text-sm font-medium">{riskPercent.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[riskPercent]}
                    onValueChange={([v]) => setRiskPercent(v)}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">{t('alerts.riskPercentDesc', 'Percentage of paper portfolio to risk per trade (0.5-5%)')}</p>
                </div>
              )}

              {/* Webhook */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">{t('alerts.webhookRelay', 'Signal Webhook')}</Label>
                </div>
                <p className="text-xs text-muted-foreground">{t('alerts.webhookDesc', 'Send signals to TradingView, 3Commas, MT4/MT5 bridges, or your own bot')}</p>
                <Input
                  placeholder="https://your-endpoint.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="text-sm"
                />
                {webhookUrl && !webhookUrl.startsWith('https://') && (
                  <p className="text-xs text-destructive">{t('alerts.webhookHttpsRequired', 'URL must start with https://')}</p>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t('alerts.webhookSecretPlaceholder', 'HMAC secret (optional)')}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="text-sm flex-1"
                    type="password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const secret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');
                      setWebhookSecret(secret);
                      navigator.clipboard.writeText(secret);
                      toast({ title: t('alerts.secretGenerated', 'Secret generated & copied') });
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    {t('alerts.generate', 'Generate')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Copilot paper toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 mb-4">
              <div className="space-y-0.5">
                <label htmlFor="copilot-paper-toggle" className="text-sm font-medium cursor-pointer">
                  Also send to Copilot paper when triggered
                </label>
                {copilotPaperEnabled && (
                  <p className="text-sm text-muted-foreground">
                    Copilot will evaluate this setup against your Master Plan when the alert fires.
                  </p>
                )}
              </div>
              <button
                id="copilot-paper-toggle"
                role="switch"
                aria-checked={copilotPaperEnabled}
                onClick={() => setCopilotPaperEnabled(!copilotPaperEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  copilotPaperEnabled ? 'bg-blue-500' : 'bg-muted'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  copilotPaperEnabled ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {!canCreateMore ? (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">{t('alerts.alertLimitReached')}</span>
                </div>
                 <p className="text-sm text-muted-foreground mb-3">
                   {t('alerts.usingAlerts', { current: activeAlerts.length, max: planLimits.max, plan: planLimits.name })}
                 </p>
                <Button asChild size="sm">
                  <Link to="/projects/pricing">
                     <TrendingUp className="h-4 w-4 mr-2" />
                     {t('alerts.upgradeForMore')}
                  </Link>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => requireAuth(createAlert)} 
                disabled={creating || selectedPatterns.length === 0 || deliveryMethods.length === 0}
                className="w-full"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     {t('alerts.creatingAlert')}
                   </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('alerts.createAlertBtn', { count: selectedPatterns.length })}
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
               {t('alerts.yourAlerts')}
             </CardTitle>
            <CardDescription>
               {t('alerts.manageAlerts')}
             </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <p className="text-muted-foreground">{t('alerts.noAlertsYet')}</p>
                 <p className="text-sm text-muted-foreground mt-2">
                   {t('alerts.createFirstAlert')}
                 </p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <button
                      onClick={() => navigate('/members/dashboard', { state: { symbol: alert.symbol } })}
                      className="flex items-center gap-4 cursor-pointer text-left flex-1 min-w-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{alert.symbol}</span>
                          <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                            {alert.status === 'active' ? t('alerts.statusActive') : t('alerts.statusPaused')}
                          </Badge>
                          {alert.auto_paper_trade && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Bot className="h-3 w-3" />
                              Auto
                            </Badge>
                          )}
                          {alert.webhook_url && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Webhook className="h-3 w-3" />
                              Webhook
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.pattern} • {alert.timeframe}
                        </p>
                      </div>
                    </button>
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
                             <AlertDialogTitle>{t('alerts.deleteAlert')}</AlertDialogTitle>
                             <AlertDialogDescription>
                               {t('alerts.deleteAlertConfirm', { symbol: alert.symbol })}
                             </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                             <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                             <AlertDialogAction onClick={() => deleteAlert(alert.id)}>
                               {t('common.delete')}
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

      {/* Alert History Log */}
      {user && (
        <div className="mt-8">
          <AlertHistoryLog userId={user.id} />
        </div>
      )}

      {/* Notification Settings */}
      <div id="notification-settings" className="mt-8 scroll-mt-6">
        <NotificationSettings userId={profile?.id} />
      </div>

      {/* How It Works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('alerts.howItWorks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
               <h3 className="font-semibold mb-2">{t('alerts.step1Title')}</h3>
               <p className="text-sm text-muted-foreground">
                 {t('alerts.step1Desc')}
               </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
               <h3 className="font-semibold mb-2">{t('alerts.step2Title')}</h3>
               <p className="text-sm text-muted-foreground">
                 {t('alerts.step2Desc')}
               </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
               <h3 className="font-semibold mb-2">{t('alerts.step3Title')}</h3>
               <p className="text-sm text-muted-foreground">
                 {t('alerts.step3Desc')}
               </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
         <p className="text-sm text-muted-foreground text-center">
           <strong>{t('common.disclaimer')}</strong> {t('alerts.disclaimer')}
        </p>
      </div>
      {/* Alert Created Success Dialog with Scripts CTA */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">{t('alerts.alertCreated', 'Alert Created!')}</DialogTitle>
            <DialogDescription className="text-center">
              {t('alerts.successDialogDesc', {
                symbol: lastCreatedSymbol,
                count: lastCreatedPatterns.length,
                defaultValue: `Monitoring ${lastCreatedPatterns.length} pattern(s) on ${lastCreatedSymbol}. You'll be notified when they trigger.`
              })}
            </DialogDescription>
          </DialogHeader>

          {/* Automation CTA */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('alerts.automateTitle', 'Automate This Strategy')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('alerts.automateDesc', 'Turn repeat alerts into fully automated trading scripts. Deploy on TradingView or MT4/MT5 — no coding required.')}
            </p>
            <ul className="space-y-1.5">
              {[
                t('alerts.automBenefit1', 'Execute trades instantly when patterns trigger'),
                t('alerts.automBenefit2', 'Built-in risk management & position sizing'),
                t('alerts.automBenefit3', 'Pine Script v6, MQL4 & MQL5 export'),
              ].map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Repeat className="h-3 w-3 text-primary flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="w-full"
              size="sm"
            >
              <Link to={`/members/scripts?symbol=${lastCreatedSymbol}&pattern=${lastCreatedPatterns[0] || ''}&timeframe=${timeframe}`}>
                <Code className="h-3.5 w-3.5 mr-2" />
                {t('alerts.generateScript', 'Generate Trading Script')}
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Link>
            </Button>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button variant="ghost" size="sm" onClick={() => setShowSuccessDialog(false)}>
              {t('common.dismiss', 'Dismiss')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="alerts" />
    </div>
  );
};

export default MemberAlerts;
