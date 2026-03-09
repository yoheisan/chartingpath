import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit2, Check, X, Shield, RefreshCw } from 'lucide-react';
import { languages } from '@/i18n/config';
import i18n from '@/i18n/config';

interface SearchResult {
  id: string;
  key: string;
  language_code: string;
  value: string;
  status: string;
  is_manual_override: boolean;
  original_automated_value: string | null;
  source_hash: string | null;
  english_value?: string;
}

export const TranslationOverrideSearch = () => {
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!query.trim() && langFilter === 'all') return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'search_translations',
          search_query: query.trim() || undefined,
          language_filter: langFilter !== 'all' ? langFilter : undefined,
          limit: 50
        }
      });

      if (error) throw error;

      // Enrich with English value
      const translations: SearchResult[] = (data?.translations || []).map((t: any) => ({
        id: t.id,
        key: t.key,
        language_code: t.language_code,
        value: t.value,
        status: t.status,
        is_manual_override: t.is_manual_override,
        original_automated_value: t.original_automated_value,
        source_hash: t.source_hash,
        english_value: t.translation_keys?.description || undefined
      }));

      setResults(translations);
    } catch (err) {
      console.error('Search error:', err);
      toast({ title: 'Search failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, langFilter, toast]);

  const handleStartEdit = (result: SearchResult) => {
    setEditingId(result.id);
    setEditValue(result.value);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveOverride = async (result: SearchResult) => {
    if (!editValue.trim()) return;
    setSaving(true);

    try {
      const { error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'update_translation',
          translation_id: result.id,
          translation: {
            key: result.key,
            language_code: result.language_code,
            value: editValue.trim(),
            is_manual_override: true,
            original_automated_value: result.original_automated_value || result.value,
            automation_source: result.is_manual_override ? 'manual' : 'auto-sync-cron'
          }
        }
      });

      if (error) throw error;

      // Update local state
      setResults(prev => prev.map(r =>
        r.id === result.id
          ? { ...r, value: editValue.trim(), is_manual_override: true, original_automated_value: result.original_automated_value || result.value }
          : r
      ));

      // Reload i18n bundle for this language
      try {
        const { data: localeData } = await supabase.functions.invoke('manage-translations', {
          body: { action: 'export_locale_json', language: result.language_code }
        });
        if (localeData) {
          i18n.addResourceBundle(result.language_code, 'translation', localeData, true, true);
        }
      } catch (e) {
        console.warn('Failed to reload locale bundle:', e);
      }

      setEditingId(null);
      setEditValue('');
      toast({ title: 'Override saved', description: `"${result.key}" updated for ${result.language_code}` });
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevertOverride = async (result: SearchResult) => {
    if (!result.original_automated_value) return;
    setSaving(true);

    try {
      const { error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'update_translation',
          translation_id: result.id,
          translation: {
            key: result.key,
            language_code: result.language_code,
            value: result.original_automated_value,
            is_manual_override: false
          }
        }
      });

      if (error) throw error;

      setResults(prev => prev.map(r =>
        r.id === result.id
          ? { ...r, value: result.original_automated_value!, is_manual_override: false }
          : r
      ));

      toast({ title: 'Override reverted', description: `"${result.key}" restored to automated value` });
    } catch (err) {
      console.error('Revert error:', err);
      toast({ title: 'Revert failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Translation Override Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Find a specific translation by key or text, then manually override it. Overridden translations are protected from automated sync.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search by key (e.g. hero.title) or translated text..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages.filter(l => l.code !== 'en').map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => {
                const lang = languages.find(l => l.code === result.language_code);
                const isEditing = editingId === result.id;

                return (
                  <div key={result.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{result.key}</code>
                        <Badge variant="secondary" className="text-xs">
                          {lang?.flag} {lang?.name || result.language_code}
                        </Badge>
                        {result.is_manual_override && (
                          <Badge variant="destructive" className="text-xs">Override</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{result.status}</Badge>
                      </div>
                      <div className="flex gap-1">
                        {!isEditing ? (
                          <Button size="sm" variant="outline" onClick={() => handleStartEdit(result)} className="gap-1">
                            <Edit2 className="h-3 w-3" /> Edit
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => handleSaveOverride(result)} disabled={saving} className="gap-1">
                              <Check className="h-3 w-3" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {result.is_manual_override && result.original_automated_value && !isEditing && (
                          <Button size="sm" variant="ghost" onClick={() => handleRevertOverride(result)} disabled={saving} className="gap-1 text-xs">
                            <RefreshCw className="h-3 w-3" /> Revert
                          </Button>
                        )}
                      </div>
                    </div>

                    {result.english_value && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">English:</span> {result.english_value}
                      </div>
                    )}

                    {isEditing ? (
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={2}
                        className="text-sm"
                        autoFocus
                      />
                    ) : (
                      <div className="p-2 bg-muted rounded text-sm">{result.value}</div>
                    )}

                    {result.is_manual_override && result.original_automated_value && !isEditing && (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-muted-foreground">
                        <span className="font-medium">Original auto:</span> {result.original_automated_value}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !loading && query && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No translations found. Try a different search term.
        </div>
      )}
    </div>
  );
};
