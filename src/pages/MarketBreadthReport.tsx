import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, TrendingUp, Mail, Clock, Calendar, RefreshCw, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { getPrefetchedReport, clearPrefetchedReport } from "@/utils/marketReportPrefetch";
import { useTranslation } from "react-i18next";
import { usePaperTrading } from "@/hooks/usePaperTrading";
import PortfolioSummaryCard from "@/components/report/PortfolioSummaryCard";

const MarketBreadthReport = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState("");
  const [reportMetadata, setReportMetadata] = useState<{
    cached: boolean;
    region?: string;
    cache_age_minutes?: number;
    generated_at?: string;
  }>({ cached: false });
  
  // Report generation settings (separate from email subscription)
  const [reportTimezone, setReportTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  
  // Email subscription settings
  const [subscription, setSubscription] = useState({
    email: "",
    markets: ["stocks", "forex", "crypto", "commodities"],
    timezone: "America/New_York",
    frequency: "daily",
    send_time: "09:00",
    tone: "professional",
    time_span: "previous_day",
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Fetch user ID for paper trading data
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { portfolio, openTrades, closedTrades, winRate, loading: portfolioLoading } = usePaperTrading(userId);

  // Map timezone to region for realtime matching
  const getRegion = (tz: string): string => {
    if (tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore') || tz.includes('Shanghai')) return 'Asia';
    if (tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) return 'Europe';
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Toronto')) return 'Americas';
    if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'Australia';
    return tz; // fallback to exact timezone
  };

  const currentRegion = getRegion(reportTimezone);

  useEffect(() => {
    loadSubscription();
    
    // Check for prefetched data first
    const prefetchedData = getPrefetchedReport();
    if (prefetchedData) {
      setReport(prefetchedData.report);
      setReportMetadata({
        cached: prefetchedData.cached,
        region: prefetchedData.region,
        cache_age_minutes: prefetchedData.cache_age_minutes,
        generated_at: prefetchedData.generated_at,
      });
      clearPrefetchedReport(); // Clear after use
      setHasInitialLoad(true);
    } else {
      handleGenerateInstant();
    }
    
    setHasInitialLoad(true);
  }, []);

  // Set up realtime subscription for auto-refresh (timezone-specific)
  useEffect(() => {
    console.log(`Setting up realtime subscription for timezone: ${reportTimezone}`);
    
    const channel = supabase
      .channel('market-report-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cached_market_reports',
          filter: `timezone=eq.${reportTimezone}`, // Listen to specific timezone
        },
        (payload) => {
          console.log('New report received via realtime:', payload);
          const newReport = payload.new as any;
          
          // Only update if it's for our timezone and timespan
          if (newReport.timezone === reportTimezone && newReport.time_span === 'previous_day') {
            setReport(newReport.report);
            setReportMetadata({
              cached: true,
              region: newReport.region || currentRegion,
              cache_age_minutes: 0,
              generated_at: newReport.generated_at,
            });
            
            const localName = reportTimezone.split('/')[1] || reportTimezone;
            toast({
              title: "Report Auto-Updated",
              description: `Fresh ${localName} market analysis with local data just arrived!`,
              variant: "default",
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [reportTimezone, currentRegion, toast]);

  // Regenerate report when timezone changes (skip initial render)
  useEffect(() => {
    if (hasInitialLoad) {
      handleGenerateInstant(reportTimezone);
    }
  }, [reportTimezone]);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingSubscription(false);
        return;
      }

      const { data, error } = await supabase
        .from("market_report_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSubscription({
          email: data.email,
          markets: data.markets,
          timezone: data.timezone,
          frequency: data.frequency,
          send_time: data.send_time.substring(0, 5),
          tone: data.tone,
          time_span: data.time_span,
          is_active: data.is_active,
        });
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleGenerateInstant = async (customTimezone?: string, force = false) => {
    setIsGenerating(true);

    try {
      const timezoneToUse = customTimezone || reportTimezone;
      
      // Show progress toast
      toast({
        title: t('marketReport.toastGenerating'),
        description: t('marketReport.toastGeneratingDesc'),
        variant: "default",
      });
      
      const { data, error } = await supabase.functions.invoke("get-cached-market-report", {
        body: {
          timezone: timezoneToUse,
          markets: ["stocks", "forex", "crypto", "commodities"],
          timeSpan: "previous_day",
          tone: "professional",
          forceGenerate: force,
        },
      });

      if (error) {
        // Handle payment/credits error
        if (error.message?.includes("credits") || error.message?.includes("Payment required")) {
          toast({
            title: t('marketReport.toastCreditsRequired'),
            description: t('marketReport.toastCreditsRequiredDesc'),
            variant: "destructive",
          });
          return;
        }
        
        // Handle rate limit error gracefully
        if (error.message?.includes("Rate limit")) {
          toast({
            title: t('marketReport.toastPleaseWait'),
            description: t('marketReport.toastPleaseWaitDesc'),
            variant: "default",
          });
          return;
        }
        throw error;
      }

      setReport(data.report);
      setReportMetadata({
        cached: data.cached,
        region: data.region,
        cache_age_minutes: data.cache_age_minutes,
        generated_at: data.generated_at,
      });
      
      if (data.cached) {
        const cacheAge = data.cache_age_minutes || 0;
        const cacheStatus = cacheAge < 5 ? 'Fresh' : cacheAge < 30 ? 'Recent' : 'Cached';
        toast({
          title: `${cacheStatus} Report Loaded`,
          description: `${data.region} report from ${cacheAge} minutes ago. Auto-updates enabled.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Fresh Report Generated",
          description: `New ${data.region} analysis completed. Watching for updates...`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: t('marketReport.toastErrorGenerating'),
        description: error.message || t('marketReport.toastErrorGeneratingDesc'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('marketReport.toastAuthRequired'),
        description: t('marketReport.toastAuthRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    if (!subscription.email.trim()) {
      toast({
        title: t('marketReport.toastEmailRequired'),
        description: t('marketReport.toastEmailRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    if (subscription.markets.length === 0) {
      toast({
        title: t('marketReport.toastNoMarkets'),
        description: t('marketReport.toastNoMarketsDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.functions.invoke("save-market-report-subscription", {
        body: subscription,
      });

      if (error) throw error;

      toast({
        title: t('marketReport.toastSaved'),
        description: t('marketReport.toastSavedDesc'),
      });
    } catch (error) {
      console.error("Error saving subscription:", error);
      toast({
        title: t('marketReport.toastSaveFailed'),
        description: error.message || t('marketReport.toastSaveFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMarket = (market: string) => {
    setSubscription(prev => ({
      ...prev,
      markets: prev.markets.includes(market)
        ? prev.markets.filter(m => m !== market)
        : [...prev.markets, market]
    }));
  };

  const handleSendTestEmail = async () => {
    if (!subscription.email.trim()) {
      toast({
        title: t('marketReport.toastEmailRequired'),
        description: t('marketReport.toastEnterEmailFirst'),
        variant: "destructive",
      });
      return;
    }

    if (!report) {
      toast({
        title: t('marketReport.toastNoReport'),
        description: t('marketReport.toastNoReportDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);

    try {
      const { error } = await supabase.functions.invoke("send-market-report", {
        body: {
          email: subscription.email,
          report: report,
          timezone: reportTimezone,
          markets: subscription.markets,
          timeSpan: subscription.time_span,
          tone: subscription.tone,
          unsubscribeToken: null, // Test emails don't need unsubscribe links
        },
      });

      if (error) throw error;

      toast({
        title: t('marketReport.toastTestSent'),
        description: t('marketReport.toastTestSentDesc', { email: subscription.email }),
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: t('marketReport.toastSendFailed'),
        description: error.message || t('marketReport.toastSendFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('marketReport.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('marketReport.subtitle')}
          </p>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('marketReport.dailyIntelligence')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('marketReport.dailyIntelligenceDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('marketReport.multiMarketCoverage')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('marketReport.multiMarketCoverageDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Summary - Real Paper Trading Data */}
        {userId && (
          <PortfolioSummaryCard
            portfolio={portfolio}
            openTrades={openTrades}
            closedTrades={closedTrades}
            winRate={winRate}
            loading={portfolioLoading}
          />
        )}

        <div className="space-y-6">
          {/* Market Report Display */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('marketReport.todaysAnalysis')}
                    {reportMetadata.cached && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        <Zap className="h-3 w-3" />
                        {reportMetadata.cache_age_minutes !== undefined && reportMetadata.cache_age_minutes < 5 ? t('marketReport.fresh') : t('marketReport.cached')}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {reportMetadata.region ? (
                      <>
                        {t('marketReport.regionReport', { region: reportMetadata.region })}
                        {reportMetadata.cache_age_minutes !== undefined && (
                          <> • {t('marketReport.updatedAgo', { minutes: reportMetadata.cache_age_minutes })}</>
                        )}
                        <> • {t('marketReport.autoRefreshEnabled')}</>
                      </>
                    ) : (
                      <>{t('marketReport.defaultDesc')}</>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateInstant(reportTimezone, true)}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {t('marketReport.generateFresh')}
                </Button>
              </div>
              
              {/* Timezone Selector for Report */}
              <div className="pt-4">
                <div className="flex-1">
                   <Label htmlFor="report-timezone" className="text-sm">
                    {t('marketReport.reportTimezone')}
                   </Label>
                  <Select
                    value={reportTimezone}
                    onValueChange={(value) => setReportTimezone(value)}
                  >
                    <SelectTrigger id="report-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">New York (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Chicago (CT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PT)</SelectItem>
                      <SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                      <SelectItem value="Pacific/Auckland">Auckland (NZST)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {new Date().toLocaleString('en-US', { 
                      timeZone: reportTimezone, 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('marketReport.generatingAnalysis')}</p>
                </div>
              ) : report ? (
                <div className="ft-article max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-3xl font-serif font-bold mb-6 text-foreground leading-tight" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-2xl font-serif font-bold mt-8 mb-4 text-foreground leading-tight" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-serif font-semibold mt-6 mb-3 text-foreground leading-snug" {...props} />,
                      p: ({node, ...props}) => <p className="text-base font-sans leading-relaxed mb-4 text-foreground/90" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-base leading-relaxed text-foreground/90" {...props} />,
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('marketReport.loadingAnalysis')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Subscription Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('marketReport.emailSubscription')}
              </CardTitle>
              <CardDescription>
                {t('marketReport.emailSubscriptionDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('marketReport.loadingSubscription')}</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Settings Form */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('marketReport.enableEmailReports')}</Label>
                        <p className="text-sm text-muted-foreground">{t('marketReport.receiveAutomatedReports')}</p>
                      </div>
                      <Switch
                        checked={subscription.is_active}
                        onCheckedChange={(checked) =>
                          setSubscription({ ...subscription, is_active: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="sub-email">{t('marketReport.emailAddress')}</Label>
                      <Input
                        id="sub-email"
                        type="email"
                        placeholder="your@email.com"
                        value={subscription.email}
                        onChange={(e) =>
                          setSubscription({ ...subscription, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">{t('marketReport.marketsToInclude')}</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-stocks"
                            checked={subscription.markets.includes("stocks")}
                            onCheckedChange={() => toggleMarket("stocks")}
                          />
                          <label htmlFor="sub-stocks" className="text-sm cursor-pointer">
                            {t('marketReport.stockMarket')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-forex"
                            checked={subscription.markets.includes("forex")}
                            onCheckedChange={() => toggleMarket("forex")}
                          />
                          <label htmlFor="sub-forex" className="text-sm cursor-pointer">
                            {t('marketReport.forexMarket')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-crypto"
                            checked={subscription.markets.includes("crypto")}
                            onCheckedChange={() => toggleMarket("crypto")}
                          />
                          <label htmlFor="sub-crypto" className="text-sm cursor-pointer">
                            {t('marketReport.cryptocurrency')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-commodities"
                            checked={subscription.markets.includes("commodities")}
                            onCheckedChange={() => toggleMarket("commodities")}
                          />
                          <label htmlFor="sub-commodities" className="text-sm cursor-pointer">
                            {t('marketReport.commodities')}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sub-timezone">{t('marketReport.timezone')}</Label>
                      <Select
                        value={subscription.timezone}
                        onValueChange={(value) =>
                          setSubscription({ ...subscription, timezone: value })
                        }
                      >
                        <SelectTrigger id="sub-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                          <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                          <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                          <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sub-frequency">{t('marketReport.frequency')}</Label>
                      <Select
                        value={subscription.frequency}
                        onValueChange={(value) =>
                          setSubscription({ ...subscription, frequency: value })
                        }
                      >
                        <SelectTrigger id="sub-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('marketReport.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('marketReport.weeklyMonday')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sub-time">{t('marketReport.sendTime')}</Label>
                      <Input
                        id="sub-time"
                        type="time"
                        value={subscription.send_time}
                        onChange={(e) =>
                          setSubscription({ ...subscription, send_time: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('marketReport.sendTimeHint')}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sub-timespan">{t('marketReport.timeSpan')}</Label>
                      <Select
                        value={subscription.time_span}
                        onValueChange={(value) =>
                          setSubscription({ ...subscription, time_span: value })
                        }
                      >
                        <SelectTrigger id="sub-timespan">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="previous_day">{t('marketReport.previousDay')}</SelectItem>
                          <SelectItem value="past_5_sessions">{t('marketReport.past5Sessions')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleSaveSubscription}
                        disabled={isSaving}
                        className="w-full"
                        size="lg"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('marketReport.saving')}
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            {t('marketReport.saveSubscription')}
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest || !subscription.email || !report}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        {isSendingTest ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('marketReport.sending')}
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            {t('marketReport.sendTestEmail')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Subscription Preview */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">{t('marketReport.subscriptionPreview')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('marketReport.reviewSettings')}
                      </p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('marketReport.emailAddress')}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.email || t('marketReport.notSet')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('marketReport.frequency')}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.frequency === "daily" ? t('marketReport.daily') : t('marketReport.weeklyMonday')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('marketReport.sendTime')}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.send_time} ({subscription.timezone})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('marketReport.marketsToInclude')}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.markets.length > 0
                              ? subscription.markets
                                  .map(m => m.charAt(0).toUpperCase() + m.slice(1))
                                  .join(", ")
                              : t('marketReport.noneSelected')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">{t('marketReport.settings')}</p>
                          <p className="text-sm text-muted-foreground">
                             {subscription.tone.charAt(0).toUpperCase() + subscription.tone.slice(1)} {t('marketReport.tone')},{" "}
                             {subscription.time_span === "previous_day" ? t('marketReport.previousDay') : t('marketReport.past5Sessions')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium">
                          {t('marketReport.status')}{" "}
                          <span className={subscription.is_active ? "text-green-600" : "text-muted-foreground"}>
                            {subscription.is_active ? t('marketReport.active') : t('marketReport.inactive')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MarketBreadthReport;
