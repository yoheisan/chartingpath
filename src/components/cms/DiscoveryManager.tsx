import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Upload,
  Play,
  RefreshCw,
  CheckCircle2,
  Users,
  Target,
  Loader2,
} from "lucide-react";

interface DiscoveryStats {
  seeds: { pending: number; crawling: number; completed: number; total: number };
  total_discovered: number;
  high_score_candidates: number;
}

interface DiscoveredAccount {
  id: string;
  user_id: string;
  username: string | null;
  name: string | null;
  followers_count: number | null;
  following_count: number | null;
  discovery_count: number;
  status: string;
  discovered_via: string[];
}

interface Seed {
  id: string;
  seed_user_id: string;
  seed_username: string | null;
  status: string;
  accounts_found: number | null;
  crawled_at: string | null;
}

export function DiscoveryManager() {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [candidates, setCandidates] = useState<DiscoveredAccount[]>([]);
  const [bulkInput, setBulkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [enqueuing, setEnqueuing] = useState(false);
  const [minScore, setMinScore] = useState("3");
  const [minFollowers, setMinFollowers] = useState("100");
  const [statusFilter, setStatusFilter] = useState("discovered");
  const [candidatePage, setCandidatePage] = useState(0);

  const PAGE_SIZE = 50;

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("discover-x-accounts", {
        body: { action: "get_stats" },
      });
      if (error) throw error;
      setStats(data);
    } catch (e: any) {
      console.error("Failed to fetch stats:", e);
    }
  }, []);

  const fetchSeeds = useCallback(async () => {
    const { data } = await supabase
      .from("x_discovery_seeds")
      .select("*")
      .order("created_at", { ascending: true }) as any;
    if (data) setSeeds(data);
  }, []);

  const fetchCandidates = useCallback(async () => {
    const from = candidatePage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("x_discovered_accounts")
      .select("*")
      .order("discovery_count", { ascending: false })
      .range(from, to) as any;

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    if (data) setCandidates(data);
  }, [candidatePage, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchSeeds();
    fetchCandidates();
  }, [fetchStats, fetchSeeds, fetchCandidates]);

  const handleAddSeeds = async () => {
    if (!bulkInput.trim()) return;
    setLoading(true);

    try {
      const lines = bulkInput
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const seedsToAdd = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          user_id: parts[0],
          username: parts[1] || undefined,
        };
      });

      const { data, error } = await supabase.functions.invoke("discover-x-accounts", {
        body: { action: "add_seeds", seeds: seedsToAdd },
      });

      if (error) throw error;
      toast.success(`Added ${data.inserted} seed accounts`);
      setBulkInput("");
      fetchSeeds();
      fetchStats();
    } catch (e: any) {
      toast.error("Failed to add seeds: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCrawl = async () => {
    setCrawling(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-x-accounts", {
        body: { action: "crawl_next" },
      });
      if (error) throw error;
      toast.success(
        data.message || `Crawled @${data.username}: ${data.found} accounts found (${data.new_accounts} new)`
      );
      fetchSeeds();
      fetchStats();
      fetchCandidates();
    } catch (e: any) {
      toast.error("Crawl failed: " + e.message);
    } finally {
      setCrawling(false);
    }
  };

  const handleScoreAndEnqueue = async () => {
    setEnqueuing(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-x-accounts", {
        body: {
          action: "score_and_enqueue",
          min_score: parseInt(minScore),
          min_followers: parseInt(minFollowers),
        },
      });
      if (error) throw error;
      toast.success(data.message || `Enqueued ${data.enqueued} candidates`);
      fetchStats();
      fetchCandidates();
    } catch (e: any) {
      toast.error("Enqueue failed: " + e.message);
    } finally {
      setEnqueuing(false);
    }
  };

  const seedProgress = stats
    ? stats.seeds.total > 0
      ? Math.round((stats.seeds.completed / stats.seeds.total) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Target className="h-4 w-4" /> Seeds
          </div>
          <p className="text-2xl font-bold">
            {stats?.seeds.completed || 0}/{stats?.seeds.total || 0}
          </p>
          <p className="text-xs text-muted-foreground">crawled</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" /> Discovered
          </div>
          <p className="text-2xl font-bold">
            {stats?.total_discovered?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-muted-foreground">unique accounts</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle2 className="h-4 w-4" /> High Score (3+)
          </div>
          <p className="text-2xl font-bold">
            {stats?.high_score_candidates?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-muted-foreground">ready to enqueue</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Search className="h-4 w-4" /> Progress
          </div>
          <Progress value={seedProgress} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{seedProgress}% complete</p>
        </Card>
      </div>

      {/* Add Seeds */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Add Seed Accounts</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Paste X user IDs (one per line, optionally comma-separated with username):
          <code className="ml-1 bg-muted px-1 rounded">user_id,username</code>
        </p>
        <Textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          placeholder={"1234567890,elonmusk\n9876543210,realDonaldTrump"}
          rows={5}
        />
        <Button onClick={handleAddSeeds} disabled={loading || !bulkInput.trim()} className="mt-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Add Seeds
        </Button>
      </Card>

      {/* Seeds Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Seed Accounts ({seeds.length})</h3>
          <Button onClick={handleTriggerCrawl} disabled={crawling} size="sm">
            {crawling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Crawl Next
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Found</TableHead>
                <TableHead>Crawled At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seeds.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.seed_user_id}</TableCell>
                  <TableCell>@{s.seed_username || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.status === "completed"
                          ? "default"
                          : s.status === "crawling"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.accounts_found || 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.crawled_at ? new Date(s.crawled_at).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {seeds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No seeds added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Score & Enqueue */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Score & Enqueue Candidates</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-enqueue discovered accounts that meet the minimum score and follower thresholds into the follow queue.
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="text-sm font-medium">Min Discovery Score</label>
            <Input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-24 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Min Followers</label>
            <Input
              type="number"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              className="w-28 mt-1"
            />
          </div>
          <Button onClick={handleScoreAndEnqueue} disabled={enqueuing}>
            {enqueuing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Enqueue Top Candidates
          </Button>
        </div>
      </Card>

      {/* Candidates Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Discovered Accounts</h3>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCandidatePage(0); }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="discovered">Discovered</SelectItem>
                <SelectItem value="enqueued">Enqueued</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => { fetchCandidates(); fetchStats(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">@{c.username || c.user_id}</TableCell>
                <TableCell>{c.name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={c.discovery_count >= 3 ? "default" : "outline"}>
                    {c.discovery_count}
                  </Badge>
                </TableCell>
                <TableCell>{c.followers_count?.toLocaleString() || 0}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === "enqueued"
                        ? "default"
                        : c.status === "rejected"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {c.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No candidates found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={candidatePage === 0}
            onClick={() => setCandidatePage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {candidatePage + 1}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={candidates.length < PAGE_SIZE}
            onClick={() => setCandidatePage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
