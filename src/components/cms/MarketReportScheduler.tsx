import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Check, Loader2, TestTube, Pause, Play, Copy, BarChart3 } from "lucide-react";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const BREADTH_URL = "https://chartingpath.com/tools/market-breadth";

export function MarketReportScheduler() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [autoScheduleActive, setAutoScheduleActive] = useState(true);
  const [isTogglingSchedule, setIsTogglingSchedule] = useState(false);

  // Manual breadth generator state
  const [isGeneratingBreadth, setIsGeneratingBreadth] = useState(false);
  const [breadthContent, setBreadthContent] = useState<string>("");
  const [breadthCopied, setBreadthCopied] = useState(false);
  const [breadthRegion, setBreadthRegion] = useState<string>("us");
  const [breadthType, setBreadthType] = useState<"pre_market" | "post_market">("post_market");

  // Toggle auto-schedule cron jobs
  const toggleAutoSchedule = async () => {
    setIsTogglingSchedule(true);
    try {
      if (autoScheduleActive) {
        // Cancel all scheduled (not yet posted) market report posts
        const { error } = await supabase
          .from("scheduled_posts")
          .update({ status: "cancelled" })
          .eq("status", "scheduled")
          .eq("post_type", "market_report");

        if (error) throw error;
        setAutoScheduleActive(false);
        toast.success("Auto-schedule paused. All pending market report posts cancelled.");
      } else {
        setAutoScheduleActive(true);
        toast.success("Auto-schedule resumed. New posts will be scheduled on next cron run.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle auto-schedule");
    } finally {
      setIsTogglingSchedule(false);
    }
  };

  const REGION_CONFIG: Record<string, { timezone: string; markets: string[]; label: string }> = {
    tokyo: { timezone: "Asia/Tokyo", markets: ["stocks", "forex", "commodities"], label: "Tokyo" },
    london: { timezone: "Europe/London", markets: ["stocks", "forex", "commodities"], label: "London" },
    us: { timezone: "America/New_York", markets: ["stocks", "forex", "crypto", "commodities"], label: "US" },
  };

  const generateBreadthContent = useCallback(async () => {
    setIsGeneratingBreadth(true);
    setBreadthContent("");
    setBreadthCopied(false);
    const config = REGION_CONFIG[breadthRegion];
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-social-market-teaser",
        {
          body: {
            reportType: breadthType,
            timezone: config.timezone,
            markets: config.markets,
            tone: "professional",
            linkBackUrl: BREADTH_URL
          }
        }
      );

      if (error) throw error;

      const teaser = data?.teaser || data?.content || "";
      const fullPost = `${teaser}\n\n📊 Full Market Breadth Dashboard 👉 ${BREADTH_URL}\n\n#MarketBreadth #Trading #StockMarket #Finance`;
      setBreadthContent(fullPost);
      toast.success(`${config.label} ${breadthType === "pre_market" ? "Pre" : "Post"}-Market content generated!`);
    } catch (error: any) {
      console.error("Error generating breadth content:", error);
      toast.error(error.message || "Failed to generate market breadth content");
    } finally {
      setIsGeneratingBreadth(false);
    }
  }, [breadthRegion, breadthType]);

  const copyBreadthContent = async () => {
    await navigator.clipboard.writeText(breadthContent);
    setBreadthCopied(true);
    toast.success("Copied to clipboard — paste directly to X/Twitter!");
    setTimeout(() => setBreadthCopied(false), 2000);
  };

  const scheduleMarketReports = async () => {
    setIsScheduling(true);
    try {
      const { data: accounts, error: accountError } = await supabase
        .from("social_media_accounts")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (accountError) throw accountError;
      if (!accounts || accounts.length === 0) {
        throw new Error("No active social media account found. Please add an account first.");
      }

      const accountId = accounts[0].id;
      
      const createScheduledTime = (timezone: string, hour: number, minute: number) => {
        const now = new Date();
        const tomorrow = addDays(now, 1);
        const zonedDate = toZonedTime(tomorrow, timezone);
        const scheduledDate = setMilliseconds(
          setSeconds(setMinutes(setHours(zonedDate, hour), minute), 0),
          0
        );
        return fromZonedTime(scheduledDate, timezone).toISOString();
      };

      const scheduledPosts = [
        {
          account_id: accountId, post_type: "market_report", platform: "twitter",
          title: "Tokyo Pre-Market Analysis 📊", content: "",
          scheduled_time: createScheduledTime("Asia/Tokyo", 8, 0),
          timezone: "Asia/Tokyo", recurrence_pattern: "weekdays",
          report_config: { markets: ["stocks", "forex", "commodities"], timeSpan: "pre_market", tone: "professional" },
          status: "scheduled", link_back_url: BREADTH_URL
        },
        {
          account_id: accountId, post_type: "market_report", platform: "twitter",
          title: "Tokyo Post-Market Report 📈", content: "",
          scheduled_time: createScheduledTime("Asia/Tokyo", 15, 30),
          timezone: "Asia/Tokyo", recurrence_pattern: "weekdays",
          report_config: { markets: ["stocks", "forex", "commodities"], timeSpan: "post_market", tone: "professional" },
          status: "scheduled", link_back_url: BREADTH_URL
        },
        {
          account_id: accountId, post_type: "market_report", platform: "twitter",
          title: "London Pre-Market Analysis 🇬🇧", content: "",
          scheduled_time: createScheduledTime("Europe/London", 6, 45),
          timezone: "Europe/London", recurrence_pattern: "weekdays",
          report_config: { markets: ["stocks", "forex", "commodities"], timeSpan: "pre_market", tone: "professional" },
          status: "scheduled", link_back_url: BREADTH_URL
        },
        {
          account_id: accountId, post_type: "market_report", platform: "twitter",
          title: "London Post-Market Report 💷", content: "",
          scheduled_time: createScheduledTime("Europe/London", 16, 45),
          timezone: "Europe/London", recurrence_pattern: "weekdays",
          report_config: { markets: ["stocks", "forex", "commodities"], timeSpan: "post_market", tone: "professional" },
          status: "scheduled", link_back_url: BREADTH_URL
        },
        {
          account_id: accountId, post_type: "market_report", platform: "twitter",
          title: "US Pre-Market Analysis 🇺🇸", content: "",
          scheduled_time: createScheduledTime("America/New_York", 8, 45),
          timezone: "America/New_York", recurrence_pattern: "weekdays",
          report_config: { markets: ["stocks", "forex", "crypto", "commodities"], timeSpan: "pre_market", tone: "professional" },
          status: "scheduled", link_back_url: BREADTH_URL
        },
        {
          account_id: accountId, post_type: "market_report", platform: "twitter",
          title: "US Post-Market Report 💹", content: "",
          scheduled_time: createScheduledTime("America/New_York", 16, 30),
          timezone: "America/New_York", recurrence_pattern: "weekdays",
          report_config: { markets: ["stocks", "forex", "crypto", "commodities"], timeSpan: "post_market", tone: "professional" },
          status: "scheduled", link_back_url: BREADTH_URL
        }
      ];

      const { error: insertError } = await supabase.from("scheduled_posts").insert(scheduledPosts);
      if (insertError) throw insertError;

      setIsScheduled(true);
      toast.success("Successfully scheduled all market reports!", {
        description: "6 recurring posts created for Tokyo, London, and US markets"
      });
    } catch (error: any) {
      console.error("Error scheduling reports:", error);
      toast.error(error.message || "Failed to schedule market reports");
    } finally {
      setIsScheduling(false);
    }
  };

  const testContentGeneration = async (reportType: "pre_market" | "post_market", timezone: string, marketName: string) => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-market-teaser", {
        body: { reportType, timezone, markets: ["stocks", "forex", "crypto", "commodities"], tone: "professional", linkBackUrl: BREADTH_URL }
      });
      if (error) throw error;
      setPreviewContent(`📍 ${marketName} ${reportType === "pre_market" ? "Pre-Market" : "Post-Market"}\n⏰ Timezone: ${timezone}\n\n${data.teaser}`);
      setShowPreview(true);
      toast.success("Content preview generated!");
    } catch (error: any) {
      console.error("Error testing content:", error);
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsTesting(false);
    }
  };

  const scheduleTestPost = async (reportType: "pre_market" | "post_market", timezone: string, marketName: string) => {
    setIsScheduling(true);
    try {
      const { data: accounts, error: accountError } = await supabase
        .from("social_media_accounts").select("id").eq("is_active", true).limit(1);
      if (accountError) throw accountError;
      if (!accounts || accounts.length === 0) throw new Error("No active social media account found");

      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
      const { data: existingTestPosts } = await supabase
        .from("scheduled_posts").select("scheduled_time")
        .eq("status", "scheduled").eq("post_type", "market_report")
        .gte("scheduled_time", new Date().toISOString())
        .lte("scheduled_time", tenMinutesFromNow.toISOString())
        .order("scheduled_time", { ascending: false }).limit(1);

      let scheduledTime: Date;
      if (existingTestPosts && existingTestPosts.length > 0) {
        scheduledTime = new Date(new Date(existingTestPosts[0].scheduled_time).getTime() + 3 * 60 * 1000);
      } else {
        scheduledTime = new Date(Date.now() + 2 * 60 * 1000);
      }

      const { error: insertError } = await supabase.from("scheduled_posts").insert({
        account_id: accounts[0].id, post_type: "market_report", platform: "twitter",
        title: `TEST - ${marketName} ${reportType === "pre_market" ? "Pre-Market" : "Post-Market"}`,
        content: "", scheduled_time: scheduledTime.toISOString(), timezone,
        recurrence_pattern: null,
        report_config: { timeSpan: reportType, markets: ["stocks", "forex", "crypto", "commodities"], tone: "professional" },
        link_back_url: BREADTH_URL, status: "scheduled"
      });
      if (insertError) throw insertError;

      const minutesUntil = Math.round((scheduledTime.getTime() - Date.now()) / 60000);
      toast.success(`Test post scheduled for ${marketName} in ~${minutesUntil} min!`, {
        description: "Will auto-generate AI content and publish to X"
      });

      setTimeout(async () => {
        try {
          const { data, error: schedulerError } = await supabase.functions.invoke('social-media-scheduler');
          if (schedulerError) { toast.error('Failed to publish test post'); }
          else if (data?.success) { toast.success(`🎉 ${marketName} test post published to X!`); }
          else { toast.info('Scheduler ran but post may not be ready yet'); }
        } catch { toast.error('Failed to auto-publish test post'); }
      }, 125000);
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule test post");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-Schedule Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Auto-Schedule Market Reports
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically schedule pre and post market reports for Tokyo, London, and US markets
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoScheduleActive ? "default" : "secondary"} className="text-xs">
                {autoScheduleActive ? "Active" : "Paused"}
              </Badge>
              <Button
                variant={autoScheduleActive ? "destructive" : "default"}
                size="sm"
                onClick={toggleAutoSchedule}
                disabled={isTogglingSchedule}
              >
                {isTogglingSchedule ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : autoScheduleActive ? (
                  <Pause className="h-4 w-4 mr-1.5" />
                ) : (
                  <Play className="h-4 w-4 mr-1.5" />
                )}
                {autoScheduleActive ? "Stop Auto-Schedule" : "Resume Auto-Schedule"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-[100px]">Tokyo:</div>
              <div className="text-muted-foreground">Pre-Market at 8:00 AM JST • Post-Market at 3:30 PM JST</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-[100px]">London:</div>
              <div className="text-muted-foreground">Pre-Market at 6:45 AM GMT • Post-Market at 4:45 PM GMT</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-[100px]">US:</div>
              <div className="text-muted-foreground">Pre-Market at 8:45 AM EST • Post-Market at 4:30 PM EST</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-[100px]">Recurrence:</div>
              <div className="text-muted-foreground">Weekdays only (Monday-Friday)</div>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={scheduleMarketReports} disabled={isScheduling || isScheduled || !autoScheduleActive} className="w-full">
              {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isScheduled && <Check className="mr-2 h-4 w-4" />}
              {isScheduled ? "Reports Scheduled" : "Schedule All Market Reports"}
            </Button>

            <div className="space-y-3 text-sm">
              {[
                { label: "Tokyo Pre-Market", type: "pre_market" as const, tz: "Asia/Tokyo", name: "Tokyo" },
                { label: "London Pre-Market", type: "pre_market" as const, tz: "Europe/London", name: "London" },
                { label: "US Post-Market", type: "post_market" as const, tz: "America/New_York", name: "US" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span>{m.label}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => testContentGeneration(m.type, m.tz, m.name)} disabled={isTesting}>Preview</Button>
                    <Button size="sm" onClick={() => scheduleTestPost(m.type, m.tz, m.name)} disabled={isScheduling}>Post in 2min</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Manual Market Breadth Generator */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Manual Market Breadth Post
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate a copy-paste ready market breadth summary for the latest market close
            </p>
          </div>

          <Button
            onClick={generateBreadthContent}
            disabled={isGeneratingBreadth}
            className="w-full"
          >
            {isGeneratingBreadth ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating from latest close...</>
            ) : (
              <><BarChart3 className="h-4 w-4 mr-2" />Generate Market Breadth Post</>
            )}
          </Button>

          {breadthContent && (
            <div className="space-y-3">
              <div className="relative">
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm font-mono leading-relaxed border">
                  {breadthContent}
                </div>
                <div className="absolute top-2 right-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyBreadthContent}
                    className="h-8 gap-1.5"
                  >
                    {breadthCopied ? (
                      <><Check className="h-3.5 w-3.5 text-green-500" />Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" />Copy All</>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {breadthContent.length} characters • Paste directly into X/Twitter
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">{previewContent}</div>
            <p className="text-xs text-muted-foreground">
              This is a preview of what will be posted. Actual content is generated fresh at posting time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
