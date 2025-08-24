import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Download, Upload, Globe } from 'lucide-react';
import { languages } from '@/i18n/config';

interface PendingTranslation {
  id: string;
  key: string;
  language_code: string;
  value: string;
  created_at: string;
  translation_keys: {
    description: string;
    category: string;
  };
}

export const TranslationManagement = () => {
  const [pendingTranslations, setPendingTranslations] = useState<PendingTranslation[]>([]);
  const [newTranslation, setNewTranslation] = useState({
    key: '',
    language_code: 'en',
    value: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingTranslations();
  }, []);

  const loadPendingTranslations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: { action: 'get_pending_translations' }
      });

      if (error) throw error;
      setPendingTranslations(data || []);
    } catch (error) {
      console.error('Error loading pending translations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending translations',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitTranslation = async () => {
    if (!newTranslation.key || !newTranslation.value) {
      toast({
        title: 'Error',
        description: 'Key and value are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'submit_translation',
          translation: newTranslation
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Translation submitted for approval'
      });

      setNewTranslation({ key: '', language_code: 'en', value: '' });
      loadPendingTranslations();
    } catch (error) {
      console.error('Error submitting translation:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit translation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTranslation = async (translationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'approve_translation',
          translation_id: translationId
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Translation approved'
      });

      loadPendingTranslations();
    } catch (error) {
      console.error('Error approving translation:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve translation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToProduction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: { action: 'sync_to_production' }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Translations synced. Update your locale files with the returned data.',
        duration: 10000
      });

      console.log('Production sync data:', data);
    } catch (error) {
      console.error('Error syncing to production:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync translations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Globe className="w-8 h-8" />
          Translation Management
        </h1>
        <p className="text-muted-foreground">
          Manage translations, approve content, and sync to production
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submit New Translation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Submit Translation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Translation Key</label>
              <Input
                placeholder="e.g., hero.title"
                value={newTranslation.key}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, key: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <Select
                value={newTranslation.language_code}
                onValueChange={(value) => setNewTranslation(prev => ({ ...prev, language_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Translation</label>
              <Textarea
                placeholder="Enter translation..."
                value={newTranslation.value}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, value: e.target.value }))}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSubmitTranslation}
              disabled={loading}
              className="w-full"
            >
              Submit for Approval
            </Button>
          </CardContent>
        </Card>

        {/* Production Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Production Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export approved translations for production deployment. This will generate the translation data that should be used to update your locale files.
            </p>
            <Button 
              onClick={handleSyncToProduction}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Export for Production
            </Button>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Workflow:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Submit translations here</li>
                <li>Approve translations below</li>
                <li>Export approved translations</li>
                <li>Update locale JSON files</li>
                <li>Deploy to production</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Translations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Approvals ({pendingTranslations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTranslations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pending translations
            </p>
          ) : (
            <div className="space-y-4">
              {pendingTranslations.map((translation) => (
                <div key={translation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {translation.key}
                        </code>
                        <Badge variant="secondary">
                          {languages.find(l => l.code === translation.language_code)?.flag}{' '}
                          {languages.find(l => l.code === translation.language_code)?.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {translation.translation_keys?.description}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApproveTranslation(translation.id)}
                      disabled={loading}
                      size="sm"
                      className="gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded">
                    <p className="font-medium">{translation.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};