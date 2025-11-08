import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ContentSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; articlesSeeded?: number; questionsSeeded?: number; error?: string } | null>(null);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Seeding failed');
      }

      setResult(data);
      toast({
        title: "Content Seeded Successfully",
        description: `${data.articlesSeeded} articles and ${data.questionsSeeded} quiz questions added to database`,
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to seed content';
      setResult({ success: false, error: errorMsg });
      toast({
        title: "Seeding Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Content Database Seeder
        </CardTitle>
        <CardDescription>
          Import existing blog articles and quiz questions into the database for content management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will migrate all hardcoded articles and quiz questions into the database. 
            Existing content with matching slugs/codes will be updated.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleSeed} 
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Content...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed Content Database
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
                  Successfully seeded {result.articlesSeeded} articles and {result.questionsSeeded} quiz questions
                </>
              ) : (
                <>Error: {result.error}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-semibold">What gets seeded:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All blog articles from /blog pages</li>
            <li>All quiz questions with answers and explanations</li>
            <li>Pattern images metadata</li>
            <li>SEO metadata for all content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};