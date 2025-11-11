import { useState } from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Clock, CheckCircle, XCircle, Globe, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
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

  const handleEditClick = (post: ScheduledPost) => {
    setEditingPost(post);
    setEditedContent(post.content || "");
    // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
    const localDateTime = new Date(post.scheduled_time).toISOString().slice(0, 16);
    setEditedScheduledTime(localDateTime);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          content: editedContent,
          scheduled_time: new Date(editedScheduledTime).toISOString()
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
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
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.timezone 
                        ? formatInTimeZone(new Date(post.scheduled_time), post.timezone, "PPP 'at' p")
                        : format(new Date(post.scheduled_time), "PPP 'at' p")}
                    </span>
                    {post.timezone && (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {post.timezone}
                      </Badge>
                    )}
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
                    <h4 className="text-sm font-semibold mb-2">Content Preview:</h4>
                    <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                      {post.content || post.post_type === 'market_report' 
                        ? "Content will be generated fresh at posting time based on current market data"
                        : "No content available"}
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
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Market report content is generated fresh at posting time. Editing here will set static content instead.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Scheduled Time</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={editedScheduledTime}
                onChange={(e) => setEditedScheduledTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Time in your local timezone. Will be converted to UTC for storage.
              </p>
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