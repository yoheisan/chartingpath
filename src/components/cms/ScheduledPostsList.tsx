import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Clock, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduledPost {
  id: string;
  post_type: string;
  platform: string;
  scheduled_time: string;
  title: string | null;
  status: string;
  social_media_accounts: {
    account_name: string;
    platform: string;
  } | null;
}

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function ScheduledPostsList({ posts, isLoading, onDelete }: ScheduledPostsListProps) {
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
    <div className="space-y-4">
      {posts.map((post) => (
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {format(new Date(post.scheduled_time), "PPP 'at' p")}
                </span>
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
              <Button variant="ghost" size="sm">
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
        </div>
      ))}
    </div>
  );
}