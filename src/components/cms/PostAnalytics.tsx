import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Heart, Share2, MessageCircle, MousePointer } from "lucide-react";
import { format } from "date-fns";

export function PostAnalytics() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["post-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_history")
        .select("*")
        .order("posted_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const totalEngagement = history?.reduce((acc, post) => 
    acc + (post.likes || 0) + (post.shares || 0) + (post.comments || 0) + (post.clicks || 0), 0
  ) || 0;

  const totalPosts = history?.length || 0;
  const avgEngagement = totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Post Analytics</h2>
        <p className="text-muted-foreground">
          Track performance of your automated social media posts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Posts</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{totalPosts}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Likes</h3>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">
            {history?.reduce((acc, post) => acc + (post.likes || 0), 0) || 0}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Shares</h3>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">
            {history?.reduce((acc, post) => acc + (post.shares || 0), 0) || 0}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Avg. Engagement</h3>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{avgEngagement}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        <div className="space-y-4">
          {history?.slice(0, 10).map((post) => (
            <div
              key={post.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{post.platform}</Badge>
                  <Badge variant="secondary">{post.post_type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(post.posted_at), "PPp")}
                  </span>
                </div>
                <p className="text-sm line-clamp-2 mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    {post.shares || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointer className="h-4 w-4" />
                    {post.clicks || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}