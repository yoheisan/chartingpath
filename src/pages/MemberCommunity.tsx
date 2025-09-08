import React, { useState, useEffect } from 'react';
import MemberNavigation from '@/components/MemberNavigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Download, Share2, Eye, TrendingUp, Users, MessageSquare, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import CommunityChatInterface from '@/components/CommunityChatInterface';
import ModeratorContactModal from '@/components/ModeratorContactModal';

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
  const [communityStrategies, setCommunityStrategies] = useState<CommunityStrategy[]>([]);
  const [myStrategies, setMyStrategies] = useState<UserStrategy[]>([]);
  const [mySharedStrategies, setMySharedStrategies] = useState<CommunityStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isModeratorContactOpen, setIsModeratorContactOpen] = useState(false);
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
      setCommunityStrategies(data || []);
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

      // Fetch personal strategies
      const { data: strategies, error: strategiesError } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (strategiesError) throw strategiesError;
      setMyStrategies(strategies || []);

      // Fetch shared strategies
      const { data: sharedStrategies, error: sharedError } = await supabase
        .from('community_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sharedError) throw sharedError;
      setMySharedStrategies(sharedStrategies || []);
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

      setIsShareDialogOpen(false);
      setSelectedStrategy(null);
      setShareForm({ title: "", description: "", tags: "", performance_data: "" });
      fetchCommunityStrategies();
      fetchMyStrategies();
    } catch (error) {
      console.error('Error sharing strategy:', error);
      toast({
        title: "Error",
        description: "Failed to share strategy",
        variant: "destructive"
      });
    }
  };

  const filteredStrategies = communityStrategies.filter(strategy => {
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
            <p className="text-muted-foreground">Chat, share strategies, and connect with fellow traders</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {communityStrategies.length} Shared Strategies
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community Chat
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Discover Strategies
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              My Shared Strategies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <CommunityChatInterface 
              onOpenModeratorContact={() => setIsModeratorContactOpen(true)}
            />
          </TabsContent>

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
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strategies</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {strategy.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {strategy.tags?.map((tag) => (
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

          <TabsContent value="shared">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Shared Strategies</h3>
                <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Strategy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Share Strategy with Community</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Select Strategy</label>
                        <Select onValueChange={(value) => {
                          const strategy = myStrategies.find(s => s.id === value);
                          setSelectedStrategy(strategy || null);
                        }}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose a strategy..." />
                          </SelectTrigger>
                          <SelectContent>
                            {myStrategies.map((strategy) => (
                              <SelectItem key={strategy.id} value={strategy.id}>
                                {strategy.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedStrategy && (
                        <>
                          <div>
                            <label className="text-sm font-medium">Public Title</label>
                            <Input
                              placeholder={selectedStrategy.name}
                              value={shareForm.title}
                              onChange={(e) => setShareForm(prev => ({ ...prev, title: e.target.value }))}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              placeholder={selectedStrategy.description}
                              value={shareForm.description}
                              onChange={(e) => setShareForm(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Tags (comma-separated)</label>
                            <Input
                              placeholder="scalping, trend-following, breakout"
                              value={shareForm.tags}
                              onChange={(e) => setShareForm(prev => ({ ...prev, tags: e.target.value }))}
                              className="mt-1"
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleShareStrategy} className="flex-1">
                              Share Strategy
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsShareDialogOpen(false)}
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
                {mySharedStrategies.map((strategy) => (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{strategy.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">{strategy.strategy_type}</Badge>
                        {strategy.is_featured && <Badge>Featured</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {strategy.likes_count} likes
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {strategy.downloads_count} downloads
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ModeratorContactModal 
        open={isModeratorContactOpen}
        onClose={() => setIsModeratorContactOpen(false)}
      />
    </div>
  );
};

export default MemberCommunity;