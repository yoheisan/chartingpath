import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Check, Loader2, TestTube } from "lucide-react";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MarketReportScheduler() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const scheduleMarketReports = async () => {
    setIsScheduling(true);
    try {
      // Get active account
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
      
      // Helper to create scheduled time in specific timezone
      const createScheduledTime = (timezone: string, hour: number, minute: number) => {
        const now = new Date();
        const tomorrow = addDays(now, 1);
        // Create time in target timezone
        const zonedDate = toZonedTime(tomorrow, timezone);
        const scheduledDate = setMilliseconds(
          setSeconds(
            setMinutes(
              setHours(zonedDate, hour),
              minute
            ),
            0
          ),
          0
        );
        // Convert back to UTC for storage
        return fromZonedTime(scheduledDate, timezone).toISOString();
      };

      // Create scheduled posts for all markets with correct timezone handling
      const scheduledPosts = [
        // Tokyo Pre-Market (8:00 AM JST - peak engagement, 1hr before market open)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "Tokyo Pre-Market Analysis 📊",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("Asia/Tokyo", 8, 0),
          timezone: "Asia/Tokyo",
          recurrence_pattern: "weekdays",
          report_config: {
            markets: ["stocks", "forex", "commodities"],
            timeSpan: "pre_market",
            tone: "professional"
          },
          status: "scheduled",
          link_back_url: "https://chartingpath.com/tools/market-breadth"
        },
        // Tokyo Post-Market (3:30 PM JST - 30min after market close)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "Tokyo Post-Market Report 📈",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("Asia/Tokyo", 15, 30),
          timezone: "Asia/Tokyo",
          recurrence_pattern: "weekdays",
          report_config: {
            markets: ["stocks", "forex", "commodities"],
            timeSpan: "post_market",
            tone: "professional"
          },
          status: "scheduled",
          link_back_url: "https://chartingpath.com/tools/market-breadth"
        },
        // London Pre-Market (6:45 AM GMT - peak engagement, 1hr 15min before market open)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "London Pre-Market Analysis 🇬🇧",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("Europe/London", 6, 45),
          timezone: "Europe/London",
          recurrence_pattern: "weekdays",
          report_config: {
            markets: ["stocks", "forex", "commodities"],
            timeSpan: "pre_market",
            tone: "professional"
          },
          status: "scheduled",
          link_back_url: "https://chartingpath.com/tools/market-breadth"
        },
        // London Post-Market (4:45 PM GMT - 15min after market close)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "London Post-Market Report 💷",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("Europe/London", 16, 45),
          timezone: "Europe/London",
          recurrence_pattern: "weekdays",
          report_config: {
            markets: ["stocks", "forex", "commodities"],
            timeSpan: "post_market",
            tone: "professional"
          },
          status: "scheduled",
          link_back_url: "https://chartingpath.com/tools/market-breadth"
        },
        // US Pre-Market (8:45 AM EST - peak engagement, 45min before market open)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "US Pre-Market Analysis 🇺🇸",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("America/New_York", 8, 45),
          timezone: "America/New_York",
          recurrence_pattern: "weekdays",
          report_config: {
            markets: ["stocks", "forex", "crypto", "commodities"],
            timeSpan: "pre_market",
            tone: "professional"
          },
          status: "scheduled",
          link_back_url: "https://chartingpath.com/tools/market-breadth"
        },
        // US Post-Market (4:30 PM EST - 30min after market close)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "US Post-Market Report 💹",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("America/New_York", 16, 30),
          timezone: "America/New_York",
          recurrence_pattern: "weekdays",
          report_config: {
            markets: ["stocks", "forex", "crypto", "commodities"],
            timeSpan: "post_market",
            tone: "professional"
          },
          status: "scheduled",
          link_back_url: "https://chartingpath.com/tools/market-breadth"
        }
      ];

      const { error: insertError } = await supabase
        .from("scheduled_posts")
        .insert(scheduledPosts);

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
      const { data, error } = await supabase.functions.invoke(
        "generate-social-market-teaser",
        {
          body: { 
            reportType,
            timezone,
            markets: ["stocks", "forex", "crypto", "commodities"],
            tone: "professional",
            linkBackUrl: "https://chartingpath.com/tools/market-breadth"
          }
        }
      );

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
        .from("social_media_accounts")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (accountError) throw accountError;
      if (!accounts || accounts.length === 0) {
        throw new Error("No active social media account found");
      }

      // Schedule for 2 minutes from now
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 2);

      const { error: insertError } = await supabase
        .from("scheduled_posts")
        .insert({
          account_id: accounts[0].id,
          post_type: "market_report",
          platform: "twitter",
          title: `TEST - ${marketName} ${reportType === "pre_market" ? "Pre-Market" : "Post-Market"}`,
          content: "", // Will be generated fresh
          scheduled_time: scheduledTime.toISOString(),
          timezone: timezone,
          recurrence_pattern: null,
          report_config: {
            timeSpan: reportType,
            markets: ["stocks", "forex", "crypto", "commodities"],
            tone: "professional"
          },
          link_back_url: "https://chartingpath.com/tools/market-breadth",
          status: "scheduled"
        });

      if (insertError) throw insertError;

      toast.success(`Test post scheduled for ${marketName} in 2 minutes!`, {
        description: "Check the Scheduled Posts tab to see it"
      });
    } catch (error: any) {
      console.error("Error scheduling test:", error);
      toast.error(error.message || "Failed to schedule test post");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Auto-Schedule Market Reports
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically schedule pre and post market reports for Tokyo, London, and US markets
          </p>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">Tokyo:</div>
            <div className="text-muted-foreground">
              Pre-Market at 8:00 AM JST • Post-Market at 3:30 PM JST
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">London:</div>
            <div className="text-muted-foreground">
              Pre-Market at 6:45 AM GMT • Post-Market at 4:45 PM GMT
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">US:</div>
            <div className="text-muted-foreground">
              Pre-Market at 8:45 AM EST • Post-Market at 4:30 PM EST
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">Recurrence:</div>
            <div className="text-muted-foreground">
              Weekdays only (Monday-Friday)
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={scheduleMarketReports} 
            disabled={isScheduling || isScheduled}
            className="w-full"
          >
            {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isScheduled && <Check className="mr-2 h-4 w-4" />}
            {isScheduled ? "Reports Scheduled" : "Schedule All Market Reports"}
          </Button>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Tokyo Pre-Market</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testContentGeneration("pre_market", "Asia/Tokyo", "Tokyo")}
                  disabled={isTesting}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => scheduleTestPost("pre_market", "Asia/Tokyo", "Tokyo")}
                  disabled={isScheduling}
                >
                  Post in 2min
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>London Pre-Market</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testContentGeneration("pre_market", "Europe/London", "London")}
                  disabled={isTesting}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => scheduleTestPost("pre_market", "Europe/London", "London")}
                  disabled={isScheduling}
                >
                  Post in 2min
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>US Post-Market</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testContentGeneration("post_market", "America/New_York", "US")}
                  disabled={isTesting}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => scheduleTestPost("post_market", "America/New_York", "US")}
                  disabled={isScheduling}
                >
                  Post in 2min
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
              {previewContent}
            </div>
            <p className="text-xs text-muted-foreground">
              This is a preview of what will be posted. Actual content is generated fresh at posting time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
