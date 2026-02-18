import { useState } from "react";
import { format } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Clock, CheckCircle, XCircle, Globe, ChevronDown, ChevronUp, RefreshCw, Sparkles, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduledPost {
  id: string;
  post_type: string;
  platform: string;
  scheduled_time: string;
  timezone?: string | null;
  title: string | null;
  content: string;
  status: string;
  recurrence_pattern?: string | null;
  image_url?: string | null;
  link_back_url?: string | null;
  social_media_accounts: {
    account_name: string;
    platform: string;
  } | null;
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function ScheduledPostsList({ posts, isLoading, onDelete, onRetry }: ScheduledPostsListProps) {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedScheduledTime, setEditedScheduledTime] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const handleEditClick = (post: ScheduledPost) => {
    setEditingPost(post);
    setEditedContent(post.content || "");
    
    // Convert UTC time to post's timezone for editing
    const postTimezone = post.timezone || 'America/New_York';
    const zonedDate = toZonedTime(new Date(post.scheduled_time), postTimezone);
    const localDateTime = format(zonedDate, "yyyy-MM-dd'T'HH:mm");
    setEditedScheduledTime(localDateTime);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    
    try {
      // Convert from post's timezone back to UTC
      const postTimezone = editingPost.timezone || 'America/New_York';
      const utcDate = fromZonedTime(editedScheduledTime, postTimezone);
      
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          content: editedContent,
          scheduled_time: utcDate.toISOString()
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      toast.success("Post updated successfully");
      setEditingPost(null);
      
      // Refresh the list
      if (onRetry) onRetry(editingPost.id);
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post", {
        description: error.message
      });
    }
  };

  const handleRetry = async (postId: string) => {
    setRetrying(postId);
    try {
      // Reset status to 'scheduled' and update scheduled time to 2 minutes from now
      const newScheduledTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'scheduled',
          scheduled_time: newScheduledTime
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success("Post rescheduled for 2 minutes from now", {
        description: "The AI content will be generated fresh when it runs"
      });

      if (onRetry) onRetry(postId);
    } catch (error: any) {
      console.error("Error retrying post:", error);
      toast.error("Failed to retry post", {
        description: error.message
      });
    } finally {
      setRetrying(null);
    }
  };

  const handleGeneratePreview = async (post: ScheduledPost) => {
    setGeneratingPreview(post.id);
    try {
      const reportConfig = (post as any).report_config || {};
      const { data, error } = await supabase.functions.invoke("generate-social-market-teaser", {
        body: {
          reportType: reportConfig.timeSpan || "post_market",
          timezone: post.timezone || "America/New_York",
          markets: reportConfig.markets || ["stocks", "forex", "crypto", "commodities"],
          tone: reportConfig.tone || "professional",
          linkBackUrl: post.link_back_url || "https://chartingpath.com/tools/market-breadth",
        },
      });

      if (error) throw error;

      const teaser: string = data.teaser;

      // Save to DB so it persists
      await supabase.from("scheduled_posts").update({ content: teaser }).eq("id", post.id);

      setPreviews((prev) => ({ ...prev, [post.id]: teaser }));
      toast.success("Preview generated and saved!");
      if (onRetry) onRetry(post.id);
    } catch (err: any) {
      console.error("Error generating preview:", err);
      toast.error(err.message || "Failed to generate preview");
    } finally {
      setGeneratingPreview(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No scheduled posts</h3>
        <p className="text-muted-foreground">
          Create your first scheduled post to get started
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => {
          const isExpanded = expandedPostId === post.id;
          return (
            <div
              key={post.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(post.status)}
                    <h3 className="font-semibold">
                      {post.title || `${post.post_type} post`}
                    </h3>
                    <Badge variant="outline">{post.post_type}</Badge>
                    <Badge variant="secondary">{post.platform}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <strong>Market Time:</strong> {post.timezone 
                          ? formatInTimeZone(new Date(post.scheduled_time), post.timezone, "PPP 'at' p")
                          : format(new Date(post.scheduled_time), "PPP 'at' p")}
                        {post.timezone && (
                          <Badge variant="outline" className="ml-1">
                            {post.timezone}
                          </Badge>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <strong>Your Time:</strong> {format(new Date(post.scheduled_time), "PPP 'at' p")}
                      </span>
                    </div>
                    {post.recurrence_pattern && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {post.recurrence_pattern === 'daily' ? 'Daily' : 
                         post.recurrence_pattern === 'weekdays' ? 'Weekdays' : 
                         post.recurrence_pattern === 'weekly' ? 'Weekly' : post.recurrence_pattern}
                      </Badge>
                    )}
                    {post.social_media_accounts && (
                      <span>
                        → {post.social_media_accounts.account_name}
                      </span>
                    )}
                    <Badge variant={post.status === "scheduled" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.status === 'failed' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleRetry(post.id)}
                      disabled={retrying === post.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${retrying === post.id ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditClick(post)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Content Preview:</h4>
                      <div className="flex gap-2">
                        {(previews[post.id] || post.content) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(previews[post.id] || post.content || "");
                              toast.success("Copied to clipboard!");
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        )}
                        {post.post_type === "market_report" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleGeneratePreview(post)}
                            disabled={generatingPreview === post.id}
                          >
                            {generatingPreview === post.id ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            {generatingPreview === post.id ? "Generating..." : "Generate Preview"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap font-medium">
                      {previews[post.id] || post.content
                        ? (previews[post.id] || post.content)
                        : (
                          <span className="text-muted-foreground italic">
                            No preview yet — click "Generate Preview" to see the actual AI-generated X post content.
                          </span>
                        )}
                    </div>
                  </div>
                  {post.image_url && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Image:</h4>
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="rounded-lg max-w-xs"
                      />
                    </div>
                  )}
                  {post.link_back_url && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Link:</h4>
                      <a
                        href={post.link_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {post.link_back_url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingPost?.post_type === 'market_report' && (
              <div className="p-3 bg-muted border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Market report content is generated fresh at posting time. Editing here will set static content instead.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Scheduled Time (Market Time)</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={editedScheduledTime}
                onChange={(e) => setEditedScheduledTime(e.target.value)}
              />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <Globe className="h-3 w-3 inline mr-1" />
                  Market timezone: <strong>{editingPost?.timezone || 'America/New_York'}</strong>
                </p>
                {editingPost && editedScheduledTime && (
                  <p>
                    <Clock className="h-3 w-3 inline mr-1" />
                    Your local time: <strong>
                      {format(
                        fromZonedTime(editedScheduledTime, editingPost.timezone || 'America/New_York'),
                        "PPP 'at' p"
                      )}
                    </strong>
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Enter post content..."
                className="min-h-[200px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}