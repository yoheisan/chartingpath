import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, Code, ArrowLeft, Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import MemberNavigation from "@/components/MemberNavigation";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MemberScripts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const { toast } = useToast();

  const scripts = [
    {
      id: 1,
      name: "Golden Cross Strategy",
      description: "Moving average crossover with RSI confirmation",
      language: "Pine Script",
      strategy: "Trend Following",
      downloads: 1247,
      rating: 4.8,
      premium: false
    },
    {
      id: 2,
      name: "Bollinger Band Squeeze",
      description: "Volatility breakout strategy with volume confirmation",
      language: "Python",
      strategy: "Breakout",
      downloads: 892,
      rating: 4.6,
      premium: true
    },
    {
      id: 3,
      name: "RSI Divergence Detector",
      description: "Automatic divergence detection and alert system",
      language: "MQL5",
      strategy: "Reversal",
      downloads: 634,
      rating: 4.9,
      premium: true
    },
    // Add more scripts...
  ];

  const filteredScripts = scripts.filter(script => {
    return (
      script.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedLanguage === "all" || script.language === selectedLanguage) &&
      (selectedStrategy === "all" || script.strategy === selectedStrategy)
    );
  });

  const handleDownload = (scriptId: number, scriptName: string) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'script_downloaded', {
        event_category: 'Members',
        event_label: scriptName,
        value: scriptId
      });
    }
    // Simulate download
    console.log(`Downloading script: ${scriptName}`);
  };

  const upgradeToElite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upgrade",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-change-membership', {
        body: {
          user_id: user.id,
          new_plan: 'elite',
          reason: 'Dev upgrade to elite',
          is_free_assignment: true
        }
      });

      if (error) throw error;

      toast({
        title: "Upgraded to Elite!",
        description: "Your account has been upgraded to Elite membership",
      });

      // Refresh the page to see changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade membership",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <MemberNavigation />
        
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Script Library
            </h1>
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access your complete collection of ready-to-use trading scripts. Download, customize, and deploy instantly.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Scripts</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="Pine Script">Pine Script</SelectItem>
                    <SelectItem value="Python">Python</SelectItem>
                    <SelectItem value="MQL5">MQL5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Strategy Type</label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    <SelectItem value="Trend Following">Trend Following</SelectItem>
                    <SelectItem value="Breakout">Breakout</SelectItem>
                    <SelectItem value="Reversal">Reversal</SelectItem>
                    <SelectItem value="Scalping">Scalping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedLanguage("all");
                    setSelectedStrategy("all");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scripts Grid */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Scripts ({filteredScripts.length})</h2>
            <div className="text-sm text-muted-foreground">
              Total Downloads: {scripts.reduce((sum, script) => sum + script.downloads, 0)}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScripts.map((script) => (
              <Card key={script.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{script.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{script.language}</Badge>
                        <Badge variant="outline">{script.strategy}</Badge>
                        {script.premium && (
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription>{script.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{script.downloads} downloads</span>
                    <div className="flex items-center gap-1">
                      <span>★ {script.rating}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleDownload(script.id, script.name)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline">
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Access Notice */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Member Access Required</h3>
                <p className="text-muted-foreground">
                  This script library is available to active subscribers. Your current plan provides access to {scripts.length} scripts 
                  with unlimited downloads and updates.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/pricing">Upgrade Plan</Link>
                  </Button>
                  <Button variant="ghost" size="sm">
                    View Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberScripts;