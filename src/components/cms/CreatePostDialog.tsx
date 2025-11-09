import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [postType, setPostType] = useState<"market_report" | "content_library" | "custom">("market_report");
  const [platform, setPlatform] = useState<"twitter" | "instagram" | "both">("both");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [recurrencePattern, setRecurrencePattern] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reportConfig, setReportConfig] = useState({
    markets: ["stocks", "forex", "crypto", "commodities"],
    timeSpan: "pre_market",
    tone: "professional",
  });

  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const accountId = accounts?.find(a => a.platform === platform || platform === "both")?.id;
      
      if (!accountId) {
        throw new Error("No social media account found. Please add an account first.");
      }

      // Build scheduled time based on whether it's recurring or not
      let scheduledTime: string;
      if (recurrencePattern && recurrencePattern !== "none") {
        // For recurring posts, use today's date with the selected time
        const today = new Date();
        const [hours, minutes] = selectedTime.split(":");
        today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledTime = today.toISOString();
      } else {
        // For one-time posts, require both date and time
        if (!selectedDate) {
          throw new Error("Please select a date for the post");
        }
        const [hours, minutes] = selectedTime.split(":");
        const dateTime = new Date(selectedDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledTime = dateTime.toISOString();
      }
      
      const postData = {
        account_id: accountId,
        post_type: postType,
        platform: platform,
        content: postType === "custom" ? content : `${reportConfig.timeSpan} report - ${reportConfig.markets.join(", ")}`,
        scheduled_time: scheduledTime,
        timezone: timezone,
        recurrence_pattern: recurrencePattern || null,
        report_config: postType === "market_report" ? reportConfig : null,
        status: "scheduled",
        link_back_url: "https://chartingpath.com/tools/market-breadth",
        image_url: null,
        content_library_id: null,
      };
      
      const { error } = await supabase
        .from("scheduled_posts")
        .insert([postData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success(recurrencePattern ? "Recurring post scheduled successfully" : "Post scheduled successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Schedule error:", error);
      toast.error(error.message || "Failed to schedule post");
    },
  });

  const resetForm = () => {
    setPostType("market_report");
    setPlatform("both");
    setSelectedDate(undefined);
    setSelectedTime("09:00");
    setRecurrencePattern("");
    setTitle("");
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Post</DialogTitle>
          <DialogDescription>
            Create an automated post for Market Breadth Reports or Q&A content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={(v: any) => setPostType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market_report">Market Breadth Report</SelectItem>
                <SelectItem value="content_library">Q&A Content</SelectItem>
                <SelectItem value="custom">Custom Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title (Optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pre-Market Analysis - US"
            />
          </div>

          {postType === "market_report" && (
            <div className="space-y-2">
              <Label>Report Time Span</Label>
              <Select
                value={reportConfig.timeSpan}
                onValueChange={(v) => setReportConfig({ ...reportConfig, timeSpan: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_market">Pre-Market</SelectItem>
                  <SelectItem value="post_market">Post-Market</SelectItem>
                  <SelectItem value="intraday">Intraday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {postType === "custom" && (
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your custom post content..."
                rows={4}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Recurrence Pattern</Label>
            <Select value={recurrencePattern || "none"} onValueChange={(v) => setRecurrencePattern(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time post</SelectItem>
                <SelectItem value="daily">Daily (every day)</SelectItem>
                <SelectItem value="weekdays">Weekdays only (Mon-Fri)</SelectItem>
                <SelectItem value="weekly">Weekly (same day each week)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {recurrencePattern && recurrencePattern !== "none" ? "Post will automatically repeat on schedule" : "Post will only run once"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(!recurrencePattern || recurrencePattern === "none") && (
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">US Eastern</SelectItem>
                  <SelectItem value="Europe/London">UK</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia (Tokyo)</SelectItem>
                  <SelectItem value="Asia/Hong_Kong">Asia (Hong Kong)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => createMutation.mutate()}>
            Schedule Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}