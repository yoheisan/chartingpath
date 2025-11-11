import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduledPostsList } from "./ScheduledPostsList";
import { CreatePostDialog } from "./CreatePostDialog";
import { toast } from "sonner";

export function ScheduledPostsManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          social_media_accounts(account_name, platform)
        `)
        .neq("status", "posted")
        .order("scheduled_time", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Posts</h2>
          <p className="text-muted-foreground">
            Manage automated Market Breadth Reports and content posts
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      <ScheduledPostsList
        posts={scheduledPosts || []}
        isLoading={isLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] })}
      />

      <CreatePostDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}