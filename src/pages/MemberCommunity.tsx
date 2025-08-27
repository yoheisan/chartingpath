import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Download, Share, Search, Users, Code, Star } from "lucide-react";
import { MemberNavigation } from "@/components/MemberNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommunityStrategy {
  id: string;
  title: string;
  description: string;
  strategy_code: string;
  strategy_type: string;
  tags: string[];
  likes_count: number;
  downloads_count: number;
  performance_data: any;
  is_featured: boolean;
  created_at: string;
  user_id: string;
}

interface UserStrategy {
  id: string;
  name: string;
  description: string;
  strategy_code: string;
  strategy_type: string;
}

const MemberCommunity = () => {
  const [strategies, setStrategies] = useState<CommunityStrategy[]>([]);
  const [myStrategies, setMyStrategies] = useState<UserStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<UserStrategy | null>(null);
  const [shareForm, setShareForm] = useState({
    title: "",
    description: "",
    tags: "",
    performance_data: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunityStrategies();
    fetchMyStrategies();
  }, []);

  const fetchCommunityStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('community_strategies')
        .select('*')
        .order('likes_count', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching community strategies:', error);
      toast({
        title: "Error",
        description: "Failed to load community strategies",
        variant: "destructive"
      });
    }
  };

  const fetchMyStrategies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyStrategies(data || []);
    } catch (error) {
      console.error('Error fetching user strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (strategyId: string, currentLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentLiked) {
        await supabase
          .from('strategy_likes')
          .delete()
          .eq('strategy_id', strategyId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('strategy_likes')
          .insert({ strategy_id: strategyId, user_id: user.id });
      }

      fetchCommunityStrategies();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleDownload = async (strategy: CommunityStrategy) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record download
      await supabase
        .from('strategy_downloads')
        .insert({ strategy_id: strategy.id, user_id: user.id });

      // Create download file
      const blob = new Blob([strategy.strategy_code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${strategy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${strategy.strategy_type}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Strategy downloaded successfully!"
      });

      fetchCommunityStrategies();
    } catch (error) {
      console.error('Error downloading strategy:', error);
      toast({
        title: "Error",
        description: "Failed to download strategy",
        variant: "destructive"
      });
    }
  };

  const handleShareStrategy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStrategy) return;

      const { error } = await supabase
        .from('community_strategies')
        .insert({
          user_id: user.id,
          original_strategy_id: selectedStrategy.id,
          title: shareForm.title || selectedStrategy.name,
          description: shareForm.description || selectedStrategy.description,
          strategy_code: selectedStrategy.strategy_code,
          strategy_type: selectedStrategy.strategy_type,
          tags: shareForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          performance_data: shareForm.performance_data ? JSON.parse(shareForm.performance_data) : {}
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Strategy shared with the community!"
      });

      setShowShareDialog(false);
      setSelectedStrategy(null);
      setShareForm({ title: "", description: "", tags: "", performance_data: "" });
      fetchCommunityStrategies();
    } catch (error) {
      console.error('Error sharing strategy:', error);
      toast({
        title: "Error",
        description: "Failed to share strategy",
        variant: "destructive"
      });
    }
  };

  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === "featured") return matchesSearch && strategy.is_featured;
    if (filterBy === "popular") return matchesSearch && strategy.likes_count > 5;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <MemberNavigation />
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Hub</h1>
            <p className="text-muted-foreground">Share strategies and learn from the community</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {strategies.length} Shared Strategies
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">Discover Strategies</TabsTrigger>
            <TabsTrigger value="my-shared">My Shared Strategies</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-2 border rounded-md bg-background"
              >
                <option value="all">All Strategies</option>
                <option value="featured">Featured</option>
                <option value="popular">Popular</option>
              </select>
            </div>

            {/* Strategy Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredStrategies.map((strategy) => (
                <Card key={strategy.id} className="relative">
                  {strategy.is_featured && (
                    <Badge className="absolute -top-2 -right-2 bg-primary">
                      Featured
                    </Badge>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{strategy.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {strategy.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {strategy.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {strategy.likes_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {strategy.downloads_count}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {strategy.strategy_type}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLike(strategy.id, false)}
                        className="flex-1"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Like
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(strategy)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-shared" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Strategies</h2>
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Share className="h-4 w-4 mr-2" />
                    Share Strategy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Share Strategy with Community</DialogTitle>
                    <DialogDescription>
                      Select a strategy to share and add community-friendly details
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Strategy</label>
                      <select 
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        onChange={(e) => {
                          const strategy = myStrategies.find(s => s.id === e.target.value);
                          setSelectedStrategy(strategy || null);
                        }}
                      >
                        <option value="">Choose a strategy...</option>
                        {myStrategies.map((strategy) => (
                          <option key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedStrategy && (
                      <>
                        <div>
                          <label className="text-sm font-medium">Public Title</label>
                          <Input
                            placeholder={selectedStrategy.name}
                            value={shareForm.title}
                            onChange={(e) => setShareForm(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            placeholder={selectedStrategy.description}
                            value={shareForm.description}
                            onChange={(e) => setShareForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Tags (comma-separated)</label>
                          <Input
                            placeholder="scalping, trend-following, breakout"
                            value={shareForm.tags}
                            onChange={(e) => setShareForm(prev => ({ ...prev, tags: e.target.value }))}
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleShareStrategy} className="flex-1">
                            Share Strategy
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowShareDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myStrategies.map((strategy) => (
                <Card key={strategy.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{strategy.strategy_type}</Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedStrategy(strategy);
                          setShowShareDialog(true);
                        }}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberCommunity;