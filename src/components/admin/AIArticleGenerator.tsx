import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AIArticleGenerator = ({ onArticleGenerated }: { onArticleGenerated?: () => void }) => {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Technical Analysis");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; article?: any; error?: string } | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for the article",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/generate-article', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          difficulty,
          keywords: keywords.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Article generation failed');
      }

      setResult({ success: true, article: data.article });
      toast({
        title: "Article Generated Successfully",
        description: `"${data.article.title}" has been created as a draft`,
      });

      // Reset form
      setTopic("");
      setKeywords("");
      
      // Notify parent component
      if (onArticleGenerated) {
        onArticleGenerated();
      }

    } catch (error: any) {
      const errorMsg = error.message || 'Failed to generate article';
      setResult({ success: false, error: errorMsg });
      toast({
        title: "Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestedTopics = [
    "Fibonacci Retracements",
    "Volume Spread Analysis",
    "Market Breadth Indicators",
    "Options Trading Strategies",
    "Pivot Points Trading",
    "Ichimoku Cloud System",
    "Elliott Wave Theory",
    "Bollinger Bands Strategy",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Article Generator
        </CardTitle>
        <CardDescription>
          Generate comprehensive trading education articles using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Article Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., MACD Indicator, Support and Resistance, Candlestick Patterns"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Be specific for better results
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical Analysis">Technical Analysis</SelectItem>
                  <SelectItem value="Chart Patterns">Chart Patterns</SelectItem>
                  <SelectItem value="Trading Psychology">Trading Psychology</SelectItem>
                  <SelectItem value="Risk Management">Risk Management</SelectItem>
                  <SelectItem value="Trading Strategies">Trading Strategies</SelectItem>
                  <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Focus Keywords (optional)</Label>
            <Textarea
              id="keywords"
              placeholder="e.g., trading strategy, risk management, technical indicators"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Suggested Topics:</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => setTopic(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={loading || !topic.trim()}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Article...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Article with AI
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? (
                <>
                  Article "{result.article?.title}" generated successfully! 
                  Check the Learning Articles tab to review and publish it.
                </>
              ) : (
                <>Error: {result.error}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-semibold">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>OpenAI GPT-5 Mini generates a comprehensive 1500-2500 word article</li>
            <li>Includes proper structure, examples, and trading strategies</li>
            <li>Automatically creates SEO metadata</li>
            <li>Saves as draft for review before publishing</li>
          </ul>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
            ⚡ Using your OpenAI API account
          </p>
        </div>
      </CardContent>
    </Card>
  );
};