import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ContentMigration = ({ onMigrationComplete }: { onMigrationComplete?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; articlesInserted?: number; questionsInserted?: number; error?: string } | null>(null);
  const { toast } = useToast();

  const handleMigrate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-all-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult({ 
        success: true, 
        articlesInserted: data.articlesInserted,
        questionsInserted: data.questionsInserted 
      });
      
      toast({
        title: "Migration Successful",
        description: `Migrated ${data.articlesInserted} articles and ${data.questionsInserted} quiz questions`,
      });

      if (onMigrationComplete) {
        onMigrationComplete();
      }

    } catch (error: any) {
      const errorMsg = error.message || 'Failed to migrate content';
      setResult({ success: false, error: errorMsg });
      toast({
        title: "Migration Failed",
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
          <Database className="h-5 w-5 text-primary" />
          One-Time Content Migration
        </CardTitle>
        <CardDescription>
          Migrate all 25 hardcoded blog articles and 100+ quiz questions to the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            <strong>This is a one-time operation.</strong> It will copy all existing hardcoded content into your database. 
            After migration, you'll manage all content through the CMS.
          </AlertDescription>
        </Alert>

        <div className="bg-accent/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">What will be migrated:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ 25 Blog Articles (Support/Resistance, MACD, Moving Averages, Candlestick Patterns, etc.)</li>
            <li>✓ 100+ Quiz Questions (Pattern Recognition, Technical Knowledge, Risk Management)</li>
            <li>✓ All metadata (SEO titles, descriptions, tags, difficulty levels)</li>
            <li>✓ All relationships (related patterns, categories)</li>
          </ul>
        </div>

        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <strong>Important:</strong> This will insert content into your database. If you've already run this migration, 
            you may end up with duplicate content. Only run this once.
          </AlertDescription>
        </Alert>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating Content...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Start Migration
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Content Migration</AlertDialogTitle>
              <AlertDialogDescription>
                This will migrate all 25 articles and 100+ quiz questions from your hardcoded files into the database. 
                <br/><br/>
                <strong>This operation cannot be easily undone.</strong> Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMigrate}>
                Yes, Migrate Content
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  <strong>Migration Complete!</strong>
                  <br />
                  Successfully migrated {result.articlesInserted} articles and {result.questionsInserted} quiz questions.
                  <br />
                  Check the Articles and Quizzes tabs to manage your content.
                </>
              ) : (
                <>Error: {result.error}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-semibold">After migration:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All content will be editable in the CMS (Articles & Quizzes tabs)</li>
            <li>You can add new content using the AI Generator</li>
            <li>Original hardcoded files will remain as backup</li>
            <li>Live site will read from database instead of code</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
