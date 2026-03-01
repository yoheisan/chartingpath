import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, RefreshCw, Loader2, Users, CheckCircle, XCircle, Clock, SkipForward } from "lucide-react";
import { format } from "date-fns";

interface QueueItem {
  id: string;
  target_user_id: string;
  target_username: string | null;
  status: string;
  error_message: string | null;
  attempted_at: string | null;
  created_at: string;
}

export function AutoFollowQueueManager() {
  const [bulkInput, setBulkInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch queue stats
  const { data: stats } = useQuery({
    queryKey: ["x-follow-queue-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("x_follow_queue")
        .select("status");
      if (error) throw error;
      const counts = { pending: 0, followed: 0, skipped: 0, failed: 0, total: 0 };
      data?.forEach((row: { status: string }) => {
        counts.total++;
        if (row.status in counts) counts[row.status as keyof typeof counts]++;
      });
      return counts;
    },
  });

  // Fetch recent queue items
  const { data: recentItems, isLoading } = useQuery({
    queryKey: ["x-follow-queue-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("x_follow_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as QueueItem[];
    },
  });

  // Bulk add mutation
  const addUsersMutation = useMutation({
    mutationFn: async (users: { user_id: string; username?: string }[]) => {
      const { data, error } = await supabase.functions.invoke("auto-follow-x", {
        body: { action: "add_users", users },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Users Added",
        description: `${data.inserted} new users added to queue (${data.total_submitted} submitted)`,
      });
      setBulkInput("");
      queryClient.invalidateQueries({ queryKey: ["x-follow-queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["x-follow-queue-recent"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleBulkAdd = () => {
    const lines = bulkInput.trim().split("\n").filter(Boolean);
    const users = lines.map((line) => {
      const parts = line.split(/[\t,]+/).map((s) => s.trim());
      return { user_id: parts[0], username: parts[1] || undefined };
    });
    if (!users.length) return;
    addUsersMutation.mutate(users);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
      pending: { variant: "outline", icon: Clock },
      followed: { variant: "default", icon: CheckCircle },
      skipped: { variant: "secondary", icon: SkipForward },
      failed: { variant: "destructive", icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="gap-1">
        <Icon className="h-3 w-3" /> {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats?.total ?? 0, icon: Users },
          { label: "Pending", value: stats?.pending ?? 0, icon: Clock },
          { label: "Followed", value: stats?.followed ?? 0, icon: CheckCircle },
          { label: "Skipped", value: stats?.skipped ?? 0, icon: SkipForward },
          { label: "Failed", value: stats?.failed ?? 0, icon: XCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Add */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Add Users</CardTitle>
          <CardDescription>
            Paste X user IDs (one per line). Optionally add username after a comma: <code>123456,username</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={"123456789\n987654321,elonmusk\n111222333"}
            rows={6}
          />
          <Button
            onClick={handleBulkAdd}
            disabled={!bulkInput.trim() || addUsersMutation.isPending}
          >
            {addUsersMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Add to Queue
          </Button>
        </CardContent>
      </Card>

      {/* Recent Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Queue</CardTitle>
            <CardDescription>Last 50 entries</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["x-follow-queue-stats"] });
              queryClient.invalidateQueries({ queryKey: ["x-follow-queue-recent"] });
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempted</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.target_user_id}</TableCell>
                      <TableCell>{item.target_username ? `@${item.target_username}` : "—"}</TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.attempted_at ? format(new Date(item.attempted_at), "MMM d, HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {item.error_message || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!recentItems?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Queue is empty
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
