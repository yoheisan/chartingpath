import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [postType, setPostType] = useState<"market_report" | "content_library" | "custom">("market_report");
  const [platform, setPlatform] = useState<"twitter" | "instagram" | "both">("both");
  const [scheduledTime, setScheduledTime] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [isRecurring, setIsRecurring] = useState(false);
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
      
      const { error } = await supabase.from("scheduled_posts").insert({
        post_type: postType,
        platform,
        account_id: accountId,
        scheduled_time: scheduledTime,
        timezone,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? "daily" : null,
        title: title || null,
        content: postType === "custom" ? content : null,
        report_config: postType === "market_report" ? reportConfig : null,
        link_back_url: "https://yoursite.com/tools/market-breadth",
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post scheduled successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to schedule post");
    },
  });

  const resetForm = () => {
    setPostType("market_report");
    setPlatform("both");
    setScheduledTime("");
    setIsRecurring(false);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
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

          <div className="flex items-center space-x-2">
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label>Recurring Daily</Label>
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