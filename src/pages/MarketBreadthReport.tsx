import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const MarketBreadthReport = () => {
  const { toast } = useToast();
  const [timezone, setTimezone] = useState("America/New_York");
  const [markets, setMarkets] = useState({
    stocks: true,
    forex: true,
    crypto: true,
    commodities: false,
  });
  const [timeSpan, setTimeSpan] = useState("previous_day");
  const [tone, setTone] = useState("professional");
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [report, setReport] = useState("");

  const selectedMarkets = Object.entries(markets)
    .filter(([_, selected]) => selected)
    .map(([market]) => market);

  const handleGenerate = async () => {
    if (selectedMarkets.length === 0) {
      toast({
        title: "No Markets Selected",
        description: "Please select at least one market to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setReport("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-market-report", {
        body: {
          timezone,
          markets: selectedMarkets,
          timeSpan,
          tone,
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

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!report) {
      toast({
        title: "No Report",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-market-report", {
        body: {
          email,
          report,
          timezone,
          markets: selectedMarkets,
          timeSpan,
          tone,
        },
      });

      if (error) throw error;

      toast({
        title: "Report Sent",
        description: `Market breadth report sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
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
            AI-powered market analysis summarizing what happened across selected markets
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configure Your Report</CardTitle>
                <CardDescription>Customize your market analysis preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
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
                  <Label className="mb-3 block">Markets to Analyze</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="stocks"
                        checked={markets.stocks}
                        onCheckedChange={(checked) =>
                          setMarkets({ ...markets, stocks: checked as boolean })
                        }
                      />
                      <label htmlFor="stocks" className="text-sm cursor-pointer">
                        Stock Market (S&P 500, NASDAQ, Dow Jones)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="forex"
                        checked={markets.forex}
                        onCheckedChange={(checked) =>
                          setMarkets({ ...markets, forex: checked as boolean })
                        }
                      />
                      <label htmlFor="forex" className="text-sm cursor-pointer">
                        Forex Market (Major Currency Pairs)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="crypto"
                        checked={markets.crypto}
                        onCheckedChange={(checked) =>
                          setMarkets({ ...markets, crypto: checked as boolean })
                        }
                      />
                      <label htmlFor="crypto" className="text-sm cursor-pointer">
                        Cryptocurrency (BTC, ETH, Top Altcoins)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="commodities"
                        checked={markets.commodities}
                        onCheckedChange={(checked) =>
                          setMarkets({ ...markets, commodities: checked as boolean })
                        }
                      />
                      <label htmlFor="commodities" className="text-sm cursor-pointer">
                        Commodities (Gold, Oil, Copper)
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeSpan">Time Span</Label>
                  <Select value={timeSpan} onValueChange={setTimeSpan}>
                    <SelectTrigger id="timeSpan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous_day">Previous Day</SelectItem>
                      <SelectItem value="past_5_sessions">Past 5 Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Report Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
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
                  onClick={handleGenerate}
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

            {report && (
              <Card>
                <CardHeader>
                  <CardTitle>Email This Report</CardTitle>
                  <CardDescription>Receive the report in your inbox</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className="w-full"
                    variant="outline"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send to Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Your Market Report</CardTitle>
                <CardDescription>
                  {report ? "AI-generated market analysis" : "Configure and generate your report"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Your market breadth report will appear here</p>
                    <p className="text-sm mt-2">Configure your preferences and click Generate Report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketBreadthReport;