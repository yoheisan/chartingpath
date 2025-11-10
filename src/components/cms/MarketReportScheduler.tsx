import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Check, Loader2 } from "lucide-react";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

export function MarketReportScheduler() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

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
        // Tokyo Pre-Market (8:30 AM JST - 30min before market open)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "Tokyo Pre-Market Analysis 📊",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("Asia/Tokyo", 8, 30),
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
        // London Pre-Market (7:30 AM GMT - 30min before market open)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "London Pre-Market Analysis 🇬🇧",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("Europe/London", 7, 30),
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
        // US Pre-Market (9:00 AM EST - 30min before market open)
        {
          account_id: accountId,
          post_type: "market_report",
          platform: "twitter",
          title: "US Pre-Market Analysis 🇺🇸",
          content: "", // Will be generated fresh by scheduler
          scheduled_time: createScheduledTime("America/New_York", 9, 0),
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
              Pre-Market at 8:30 AM JST • Post-Market at 3:30 PM JST
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">London:</div>
            <div className="text-muted-foreground">
              Pre-Market at 7:30 AM GMT • Post-Market at 4:45 PM GMT
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">US:</div>
            <div className="text-muted-foreground">
              Pre-Market at 9:00 AM EST • Post-Market at 4:30 PM EST
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="font-medium min-w-[100px]">Recurrence:</div>
            <div className="text-muted-foreground">
              Weekdays only (Monday-Friday)
            </div>
          </div>
        </div>

        <Button 
          onClick={scheduleMarketReports} 
          disabled={isScheduling || isScheduled}
          className="w-full"
        >
          {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isScheduled && <Check className="mr-2 h-4 w-4" />}
          {isScheduled ? "Reports Scheduled" : "Schedule All Market Reports"}
        </Button>
      </div>
    </Card>
  );
}
