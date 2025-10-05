import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, TrendingUp, Mail, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const MarketBreadthReport = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState("");
  
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

  useEffect(() => {
    loadSubscription();
  }, []);

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
          send_time: data.send_time.substring(0, 5), // Format HH:MM
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

  const handleGenerateInstant = async () => {
    setIsGenerating(true);
    setReport("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-market-report", {
        body: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          markets: ["stocks", "forex", "crypto", "commodities"],
          timeSpan: "previous_day",
          tone: "professional",
        },
      });

      if (error) throw error;

      setReport(data.report);
      toast({
        title: "Report Generated",
        description: "Your market breadth report is ready.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Generation Failed",
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Market Breadth Report
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-powered market analysis summarizing what happened across all markets
          </p>
        </div>

        <Tabs defaultValue="instant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instant">Instant Report</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Emails</TabsTrigger>
          </TabsList>

          <TabsContent value="instant" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Instant Report</CardTitle>
                  <CardDescription>View a comprehensive report covering all markets right now</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Report Settings:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Markets: All (Stocks, Forex, Crypto, Commodities)</li>
                      <li>• Timezone: Your local timezone</li>
                      <li>• Time Span: Previous Day</li>
                      <li>• Tone: Professional</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleGenerateInstant}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:row-span-2">
                <CardHeader>
                  <CardTitle>Your Market Report</CardTitle>
                  <CardDescription>
                    {report ? "AI-generated market analysis" : "Generate report to view analysis"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto">
                      <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Your market breadth report will appear here</p>
                      <p className="text-sm mt-2">Click Generate Report to view the latest market analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            {isLoadingSubscription ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading subscription settings...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Subscription Settings</CardTitle>
                    <CardDescription>Configure automated market reports delivered to your inbox</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Preview</CardTitle>
                    <CardDescription>Review your email report settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketBreadthReport;