import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CalendarPlus, RefreshCw, BookOpen, Globe, Trash2, Pencil, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

const PIECE_TYPE_COLORS: Record<string, string> = {
  glossary: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  key_learning: "bg-green-500/10 text-green-400 border-green-500/20",
  technique: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  insight: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  definition: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const MARKET_LABELS: Record<string, string> = {
  us: "🇺🇸 US (9:00 AM EST)",
  eu: "🇬🇧 EU (8:30 AM GMT)",
  asia_tokyo: "🇯🇵 Tokyo (9:00 AM JST)",
  asia_shanghai: "🇨🇳 Shanghai (9:00 AM HKT)",
};

export function EducationalContentManager() {
  const [articleFilter, setArticleFilter] = useState<string>("all");
  const [editingPiece, setEditingPiece] = useState<any | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const buildFullPost = (piece: any): string => {
    const parts: string[] = [piece.content];
    if (piece.link_back_url) parts.push(`\n${piece.link_back_url}`);
    if (piece.hashtags?.length) parts.push(`\n${piece.hashtags.map((t: string) => `#${t}`).join(" ")}`);
    return parts.join("\n");
  };

  const handleCopy = async (piece: any) => {
    const text = buildFullPost(piece);
    await navigator.clipboard.writeText(text);
    setCopiedId(piece.id);
    toast.success("Copied to clipboard — ready to paste!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch educational pieces
  const { data: pieces, isLoading: piecesLoading } = useQuery({
    queryKey: ["educational-pieces", articleFilter],
    queryFn: async () => {
      let query = supabase
        .from("educational_content_pieces")
        .select("*")
        .eq("is_active", true)
        .order("global_order", { ascending: true });
      
      if (articleFilter !== "all") {
        query = query.eq("article_id", articleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch schedule state
  const { data: scheduleState } = useQuery({
    queryKey: ["educational-schedule-state"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_schedule_state")
        .select("*")
        .order("market_region");
      if (error) throw error;
      return data;
    },
  });

  // Fetch articles for filter
  const { data: articles } = useQuery({
    queryKey: ["published-articles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_articles")
        .select("id, title")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Generate pieces from all articles
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-educational-posts", {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["educational-pieces"] });
      toast.success(`Generated ${data.piecesGenerated} pieces from ${data.processed} articles. Total queue: ${data.totalQueue}`);
    },
    onError: (error: Error) => {
      toast.error(`Generation failed: ${error.message}`);
    },
  });

  // Schedule posts for tomorrow
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("schedule-educational-posts", {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["educational-schedule-state"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      if (data.scheduled) {
        toast.success(`Scheduled ${data.scheduled} educational posts for ${data.date}`);
      } else {
        toast.info(data.message || "No posts scheduled");
      }
    },
    onError: (error: Error) => {
      toast.error(`Scheduling failed: ${error.message}`);
    },
  });

  // Delete piece
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("educational_content_pieces")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educational-pieces"] });
      toast.success("Piece removed from rotation");
    },
  });

  // Update piece
  const updateMutation = useMutation({
    mutationFn: async ({ id, content, hashtags, link_back_url }: { id: string; content: string; hashtags: string[]; link_back_url: string }) => {
      const { error } = await supabase
        .from("educational_content_pieces")
        .update({ content, hashtags, link_back_url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educational-pieces"] });
      setEditingPiece(null);
      toast.success("Piece updated");
    },
  });

  const openEdit = (piece: any) => {
    setEditingPiece(piece);
    setEditContent(piece.content);
    setEditHashtags((piece.hashtags || []).join(", "));
    setEditLinkUrl(piece.link_back_url || "");
  };

  // Unique articles in pieces
  const uniqueArticles = pieces
    ? [...new Set(pieces.map(p => p.article_title))].length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Educational Content Pipeline</h2>
          <p className="text-muted-foreground">
            Auto-generate tweet-sized learning posts from blog articles and schedule across 4 markets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Generate from Articles</>
            )}
          </Button>
          <Button
            onClick={() => scheduleMutation.mutate()}
            disabled={scheduleMutation.isPending || !pieces?.length}
          >
            {scheduleMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scheduling...</>
            ) : (
              <><CalendarPlus className="h-4 w-4 mr-2" />Schedule Tomorrow</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <BookOpen className="h-4 w-4" /> Articles Processed
          </div>
          <p className="text-2xl font-bold">{uniqueArticles}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Sparkles className="h-4 w-4" /> Total Pieces
          </div>
          <p className="text-2xl font-bold">{pieces?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Globe className="h-4 w-4" /> Markets
          </div>
          <p className="text-2xl font-bold">{scheduleState?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <RefreshCw className="h-4 w-4" /> Loop Length
          </div>
          <p className="text-2xl font-bold">
            {pieces?.length ? `${Math.ceil(pieces.length / 4)}d` : "—"}
          </p>
        </Card>
      </div>

      {/* Market Rotation State */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Market Rotation Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {scheduleState?.map((market) => (
            <div key={market.id} className="p-3 rounded-lg border bg-muted/30">
              <p className="font-medium text-sm">
                {MARKET_LABELS[market.market_region] || market.market_region}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Position: {market.current_position} / {pieces?.length || 0}
              </p>
              {market.last_scheduled_at && (
                <p className="text-xs text-muted-foreground">
                  Last: {new Date(market.last_scheduled_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={articleFilter} onValueChange={setArticleFilter}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by article" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Articles</SelectItem>
            {articles?.map((article) => (
              <SelectItem key={article.id} value={article.id}>
                {article.title.substring(0, 50)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {pieces?.length || 0} pieces
        </span>
      </div>

      {/* Content Table */}
      {piecesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pieces?.length ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-36">Article</TableHead>
                <TableHead className="w-44">Link</TableHead>
                <TableHead className="w-20">Posts</TableHead>
                <TableHead className="w-16">Copy</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {piece.global_order ?? "—"}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2">{piece.content}</p>
                    {piece.hashtags && piece.hashtags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {piece.hashtags.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="text-xs text-muted-foreground">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PIECE_TYPE_COLORS[piece.piece_type] || ""}>
                      {piece.piece_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {piece.article_title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({piece.sequence_number}/{piece.total_in_series})
                    </span>
                  </TableCell>
                  <TableCell>
                    {piece.link_back_url ? (
                      <a
                        href={piece.link_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 line-clamp-1"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {piece.link_back_url.replace("https://chartingpath.lovable.app/blog/", "")}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{piece.posted_count}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(piece)}
                      title="Copy full post to clipboard"
                    >
                      {copiedId === piece.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(piece)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteMutation.mutate(piece.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Educational Content Yet</h3>
          <p className="text-muted-foreground mb-4">
            Click "Generate from Articles" to break your {articles?.length || 0} published articles into tweet-sized educational posts.
          </p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content Now
          </Button>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPiece} onOpenChange={(open) => !open && setEditingPiece(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Content Piece</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{editContent.length} characters</p>
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={editLinkUrl}
                onChange={(e) => setEditLinkUrl(e.target.value)}
                placeholder="https://chartingpath.lovable.app/blog/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hashtags (comma-separated)</Label>
              <Input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="Trading, Finance, Forex"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPiece(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({
                id: editingPiece.id,
                content: editContent,
                hashtags: editHashtags.split(",").map(h => h.trim()).filter(Boolean),
                link_back_url: editLinkUrl,
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
