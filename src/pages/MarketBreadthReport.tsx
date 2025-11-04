import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, TrendingUp, Mail, Clock, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useMarketReport } from "@/contexts/MarketReportContext";

const MarketBreadthReport = () => {
  const { toast } = useToast();
  const { cachedReport, isReportFresh } = useMarketReport();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState("");
  
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

  useEffect(() => {
    loadSubscription();
    
    // Use cached report if available and fresh
    if (cachedReport && isReportFresh(reportTimezone)) {
      setReport(cachedReport.report);
    } else {
      handleGenerateInstant();
    }
  }, []);

  // Auto-regenerate report when timezone changes
  useEffect(() => {
    // Skip initial render (already handled by the above useEffect)
    if (reportTimezone !== Intl.DateTimeFormat().resolvedOptions().timeZone) {
      handleGenerateInstant(reportTimezone);
    }
  }, [reportTimezone]);

  // Auto-regenerate report every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing market report...');
      handleGenerateInstant();
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    return () => clearInterval(interval);
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

  const handleGenerateInstant = async (customTimezone?: string) => {
    setIsGenerating(true);

    try {
      const timezoneToUse = customTimezone || reportTimezone;
      const { data, error } = await supabase.functions.invoke("generate-market-report", {
        body: {
          timezone: timezoneToUse,
          markets: ["stocks", "forex", "crypto", "commodities"],
          timeSpan: "previous_day",
          tone: "professional",
        },
      });

      if (error) throw error;

      setReport(data.report);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: error.message || "Failed to generate report. Please try again.",
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
        title: "Authentication Required",
        description: "Please log in to save email subscription settings.",
        variant: "destructive",
      });
      return;
    }

    if (!subscription.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (subscription.markets.length === 0) {
      toast({
        title: "No Markets Selected",
        description: "Please select at least one market.",
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
        title: "Subscription Saved",
        description: "Your email report preferences have been saved.",
      });
    } catch (error) {
      console.error("Error saving subscription:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save subscription. Please try again.",
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
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    if (!report) {
      toast({
        title: "No Report Available",
        description: "Please generate a report first.",
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
        },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent!",
        description: `Market report sent to ${subscription.email}`,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Market Breadth Report
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Catch up on what happened in the market daily before trading hours
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
                  <h3 className="font-semibold text-lg mb-2">Daily Market Intelligence</h3>
                  <p className="text-sm text-muted-foreground">
                    Get comprehensive AI-powered market analysis delivered to your inbox. Stay informed about what happened across all markets—all in one report.
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
                  <h3 className="font-semibold text-lg mb-2">Multi-Market Coverage</h3>
                  <p className="text-sm text-muted-foreground">
                    Track movements across stocks, forex, crypto, and commodities. Get cross-market insights and correlations that matter for your trading decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Market Report Display */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Today's Market Analysis
                  </CardTitle>
                  <CardDescription>
                    Comprehensive market breadth report for all markets based on your selected timezone
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateInstant()}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Update
                </Button>
              </div>
              
              {/* Timezone Selector for Report */}
              <div className="pt-4">
                <div className="flex-1">
                  <Label htmlFor="report-timezone" className="text-sm">
                    Report Timezone
                  </Label>
                  <Select
                    value={reportTimezone}
                    onValueChange={(value) => setReportTimezone(value)}
                  >
                    <SelectTrigger id="report-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
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
                  <p className="text-muted-foreground">Generating your market analysis...</p>
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
                  <p>Loading market analysis...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Subscription Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Subscription
              </CardTitle>
              <CardDescription>
                Receive automated market reports delivered to your inbox
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading subscription settings...</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Settings Form */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Email Reports</Label>
                        <p className="text-sm text-muted-foreground">Receive automated reports</p>
                      </div>
                      <Switch
                        checked={subscription.is_active}
                        onCheckedChange={(checked) =>
                          setSubscription({ ...subscription, is_active: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="sub-email">Email Address</Label>
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
                      <Label className="mb-3 block">Markets to Include</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-stocks"
                            checked={subscription.markets.includes("stocks")}
                            onCheckedChange={() => toggleMarket("stocks")}
                          />
                          <label htmlFor="sub-stocks" className="text-sm cursor-pointer">
                            Stock Market
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-forex"
                            checked={subscription.markets.includes("forex")}
                            onCheckedChange={() => toggleMarket("forex")}
                          />
                          <label htmlFor="sub-forex" className="text-sm cursor-pointer">
                            Forex Market
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-crypto"
                            checked={subscription.markets.includes("crypto")}
                            onCheckedChange={() => toggleMarket("crypto")}
                          />
                          <label htmlFor="sub-crypto" className="text-sm cursor-pointer">
                            Cryptocurrency
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sub-commodities"
                            checked={subscription.markets.includes("commodities")}
                            onCheckedChange={() => toggleMarket("commodities")}
                          />
                          <label htmlFor="sub-commodities" className="text-sm cursor-pointer">
                            Commodities
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sub-timezone">Timezone</Label>
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
                      <Label htmlFor="sub-frequency">Frequency</Label>
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
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sub-time">Send Time</Label>
                      <Input
                        id="sub-time"
                        type="time"
                        value={subscription.send_time}
                        onChange={(e) =>
                          setSubscription({ ...subscription, send_time: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Reports will be sent at this time in your selected timezone
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sub-timespan">Time Span</Label>
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
                          <SelectItem value="previous_day">Previous Day</SelectItem>
                          <SelectItem value="past_5_sessions">Past 5 Sessions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sub-tone">Report Tone</Label>
                      <Select
                        value={subscription.tone}
                        onValueChange={(value) =>
                          setSubscription({ ...subscription, tone: value })
                        }
                      >
                        <SelectTrigger id="sub-tone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="narrative">Narrative</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
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
                            Saving...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Save Subscription
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
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Test Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Subscription Preview */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Subscription Preview</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Review your email report settings
                      </p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email Address</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.email || "Not set"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Frequency</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.frequency === "daily" ? "Daily" : "Weekly (Monday)"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Send Time</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.send_time} ({subscription.timezone})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Markets</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.markets.length > 0
                              ? subscription.markets
                                  .map(m => m.charAt(0).toUpperCase() + m.slice(1))
                                  .join(", ")
                              : "None selected"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">Settings</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.tone.charAt(0).toUpperCase() + subscription.tone.slice(1)} tone,{" "}
                            {subscription.time_span === "previous_day" ? "Previous Day" : "Past 5 Sessions"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium">
                          Status:{" "}
                          <span className={subscription.is_active ? "text-green-600" : "text-muted-foreground"}>
                            {subscription.is_active ? "Active" : "Inactive"}
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
