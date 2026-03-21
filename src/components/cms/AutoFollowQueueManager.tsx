import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, RefreshCw, Loader2, Users, CheckCircle, XCircle, Clock, SkipForward, TrendingUp, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";

interface QueueItem {
  id: string;
  target_user_id: string;
  target_username: string | null;
  status: string;
  error_message: string | null;
  attempted_at: string | null;
  created_at: string;
}

interface DailyFollow {
  day: string;
  count: number;
}

export function AutoFollowQueueManager() {
  const [bulkInput, setBulkInput] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch queue stats (use count queries instead of fetching all rows)
  const { data: stats } = useQuery({
    queryKey: ["x-follow-queue-stats"],
    queryFn: async () => {
      const statuses = ["pending", "followed", "skipped", "failed"];
      const results: Record<string, number> = {};
      
      await Promise.all(
        statuses.map(async (status) => {
          const { count, error } = await supabase
            .from("x_follow_queue")
            .select("*", { count: "exact", head: true })
            .eq("status", status);
          if (!error) results[status] = count ?? 0;
        })
      );

      const total = Object.values(results).reduce((a, b) => a + b, 0);
      return { ...results, total } as { pending: number; followed: number; skipped: number; failed: number; total: number };
    },
  });

  // Fetch daily follow velocity (last 7 days)
  const { data: dailyFollows } = useQuery({
    queryKey: ["x-follow-daily-velocity"],
    queryFn: async () => {
      const days: DailyFollow[] = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = subDays(new Date(), i);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const { count } = await supabase
          .from("x_follow_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", "followed")
          .gte("attempted_at", dayStart.toISOString())
          .lte("attempted_at", dayEnd.toISOString());

        days.push({
          day: format(dayStart, "MMM d"),
          count: count ?? 0,
        });
      }
      return days.reverse();
    },
  });

  // Fetch items by tab filter
  const { data: filteredItems, isLoading } = useQuery({
    queryKey: ["x-follow-queue-list", activeTab],
    queryFn: async () => {
      let query = supabase
        .from("x_follow_queue")
        .select("*")
        .limit(100);

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      if (activeTab === "followed") {
        query = query.order("attempted_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
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
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["x-follow-queue-stats"] });
    queryClient.invalidateQueries({ queryKey: ["x-follow-queue-list"] });
    queryClient.invalidateQueries({ queryKey: ["x-follow-daily-velocity"] });
  };

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

  const followedPct = stats && stats.total > 0
    ? Math.round(((stats.followed ?? 0) / stats.total) * 100)
    : 0;

  const todayFollows = dailyFollows?.[dailyFollows.length - 1]?.count ?? 0;
  const avgDaily = dailyFollows
    ? Math.round(dailyFollows.reduce((s, d) => s + d.count, 0) / dailyFollows.length)
    : 0;
  const estimatedDaysLeft = avgDaily > 0 && stats?.pending
    ? Math.ceil(stats.pending / avgDaily)
    : null;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Follow Queue Progress</CardTitle>
            <Button variant="outline" size="sm" onClick={invalidateAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {stats?.followed ?? 0} followed of {stats?.total ?? 0} total
              </span>
              <span className="font-medium">{followedPct}%</span>
            </div>
            <Progress value={followedPct} className="h-3" />
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats?.pending ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{stats?.followed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Followed</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{todayFollows}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{avgDaily}</p>
              <p className="text-xs text-muted-foreground">Avg/Day (7d)</p>
            </div>
          </div>

          {/* Estimated completion */}
          {estimatedDaysLeft !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Calendar className="h-4 w-4" />
              <span>
                At current rate ({avgDaily}/day), the queue will complete in ~<strong className="text-foreground">{estimatedDaysLeft} days</strong>
              </span>
            </div>
          )}

          {/* 7-day velocity chart (simple bar) */}
          {dailyFollows && dailyFollows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Follow Velocity (7 days)
              </div>
              <div className="flex items-end gap-1 h-16">
                {dailyFollows.map((d) => {
                  const maxCount = Math.max(...dailyFollows.map((x) => x.count), 1);
                  const heightPct = (d.count / maxCount) * 100;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-sm text-muted-foreground">{d.count}</span>
                      <div
                        className="w-full bg-primary/70 rounded-t-sm min-h-[2px]"
                        style={{ height: `${Math.max(heightPct, 3)}%` }}
                      />
                      <span className="text-sm text-muted-foreground">{d.day.split(" ")[1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
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
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
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

      {/* Queue List with Tab Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Queue Accounts</CardTitle>
              <CardDescription>Browse accounts by status</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={invalidateAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="h-3 w-3" /> Pending
                <Badge variant="outline" className="ml-1 text-sm px-1.5">{stats?.pending?.toLocaleString() ?? 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="followed" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Followed
                <Badge variant="outline" className="ml-1 text-sm px-1.5">{stats?.followed?.toLocaleString() ?? 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="skipped" className="gap-1">
                <SkipForward className="h-3 w-3" /> Skipped
              </TabsTrigger>
              <TabsTrigger value="failed" className="gap-1">
                <XCircle className="h-3 w-3" /> Failed
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1">
                <Users className="h-3 w-3" /> All
              </TabsTrigger>
            </TabsList>

            {["pending", "followed", "skipped", "failed", "all"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>{tab === "followed" ? "Followed At" : "Added"}</TableHead>
                          {(tab === "failed" || tab === "all") && <TableHead>Error</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.target_username ? (
                                <a
                                  href={`https://x.com/${item.target_username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  @{item.target_username}
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{item.target_user_id}</TableCell>
                            <TableCell>{statusBadge(item.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {tab === "followed" && item.attempted_at
                                ? format(new Date(item.attempted_at), "MMM d, HH:mm")
                                : format(new Date(item.created_at), "MMM d")}
                            </TableCell>
                            {(tab === "failed" || tab === "all") && (
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {item.error_message || "—"}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {!filteredItems?.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No {tab === "all" ? "" : tab} accounts
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
