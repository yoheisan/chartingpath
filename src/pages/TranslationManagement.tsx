import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Download, Upload, Globe, ArrowLeft, Search, Edit, Eye, Filter, RefreshCw } from 'lucide-react';
import { languages } from '@/i18n/config';
import { useNavigate, Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

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

interface Translation {
  id: string;
  key: string;
  language_code: string;
  value: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  is_manual_override: boolean;
  automation_source: string | null;
  original_automated_value: string | null;
  context_page: string | null;
  context_element: string | null;
  translation_keys: {
    description: string;
    category: string;
    page_context: string | null;
    element_context: string | null;
  };
}

export const TranslationManagement = () => {
  const [pendingTranslations, setPendingTranslations] = useState<PendingTranslation[]>([]);
  const [allTranslations, setAllTranslations] = useState<Translation[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState({
    key: '',
    language_code: 'en',
    value: '',
    context_page: '',
    context_element: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'search' | 'submit'>('search');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Check if user is admin
      const { data: adminCheck, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (error) {
        console.error('Admin check error:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify admin permissions',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      if (!adminCheck) {
        toast({
          title: 'Access Denied',
          description: 'You need admin privileges to access this page',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadPendingTranslations();
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setAuthLoading(false);
    }
  };

  const searchTranslations = async () => {
    if (!searchQuery && (!languageFilter || languageFilter === 'all') && (!statusFilter || statusFilter === 'all') && !pageFilter) {
      setAllTranslations([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'search_translations',
          search_query: searchQuery || undefined,
          language_filter: (languageFilter && languageFilter !== 'all') ? languageFilter : undefined,
          status_filter: (statusFilter && statusFilter !== 'all') ? statusFilter : undefined,
          page_filter: pageFilter || undefined,
          limit: 100
        }
      });

      if (error) throw error;
      setAllTranslations(data.translations || []);
    } catch (error) {
      console.error('Error searching translations:', error);
      toast({
        title: 'Error',
        description: 'Failed to search translations',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

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
          translation: {
            ...newTranslation,
            is_manual_override: true
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Translation submitted for approval'
      });

      setNewTranslation({ key: '', language_code: 'en', value: '', context_page: '', context_element: '' });
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

  const handleEditTranslation = (translation: Translation) => {
    setSelectedTranslation(translation);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTranslation) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'update_translation',
          translation_id: selectedTranslation.id,
          translation: {
            key: selectedTranslation.key,
            language_code: selectedTranslation.language_code,
            value: selectedTranslation.value,
            is_manual_override: true,
            original_automated_value: selectedTranslation.original_automated_value || selectedTranslation.value,
            automation_source: selectedTranslation.automation_source || 'system',
            context_page: selectedTranslation.context_page,
            context_element: selectedTranslation.context_element
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Translation updated successfully'
      });

      setEditDialogOpen(false);
      setSelectedTranslation(null);
      searchTranslations();
    } catch (error) {
      console.error('Error updating translation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update translation',
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Globe className="w-8 h-8" />
            Translation Management
          </h1>
          <p className="text-muted-foreground">
            Search, edit, and manage translations for all pages and elements
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'search' ? 'default' : 'outline'}
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search & Edit Translations
          </Button>
          <Button
            variant={activeTab === 'submit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('submit')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Submit New Translation
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Pending Approvals ({pendingTranslations.length})
          </Button>
        </div>

        {/* Search & Edit Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Search Translations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search Query</label>
                    <Input
                      placeholder="Search keys or values..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Language</label>
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All languages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All languages</SelectItem>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Page Context</label>
                    <Input
                      placeholder="Page name..."
                      value={pageFilter}
                      onChange={(e) => setPageFilter(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={searchTranslations}
                    disabled={searchLoading}
                    className="flex items-center gap-2"
                  >
                    {searchLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setLanguageFilter('all');
                      setStatusFilter('all');
                      setPageFilter('');
                      setAllTranslations([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {allTranslations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results ({allTranslations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allTranslations.map((translation) => (
                      <div key={translation.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                {translation.key}
                              </code>
                              <Badge variant="secondary">
                                {languages.find(l => l.code === translation.language_code)?.flag}{' '}
                                {languages.find(l => l.code === translation.language_code)?.name}
                              </Badge>
                              <Badge variant={translation.status === 'approved' ? 'default' : 'outline'}>
                                {translation.status}
                              </Badge>
                              {translation.is_manual_override && (
                                <Badge variant="destructive">Manual Override</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>{translation.translation_keys?.description}</p>
                              {translation.context_page && (
                                <p><strong>Page:</strong> {translation.context_page}</p>
                              )}
                              {translation.context_element && (
                                <p><strong>Element:</strong> {translation.context_element}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleEditTranslation(translation)}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                        <div className="mt-3">
                          <div className="p-3 bg-muted rounded">
                            <p className="font-medium">{translation.value}</p>
                          </div>
                          {translation.original_automated_value && translation.is_manual_override && (
                            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Original automated:</strong> {translation.original_automated_value}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Submit New Translation Tab */}
        {activeTab === 'submit' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Submit New Translation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Page Context (Optional)</label>
                  <Input
                    placeholder="e.g., homepage, pricing"
                    value={newTranslation.context_page}
                    onChange={(e) => setNewTranslation(prev => ({ ...prev, context_page: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Element Context (Optional)</label>
                  <Input
                    placeholder="e.g., header, button, paragraph"
                    value={newTranslation.context_element}
                    onChange={(e) => setNewTranslation(prev => ({ ...prev, context_element: e.target.value }))}
                  />
                </div>
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
        )}

        {/* Pending Translations Tab */}
        {activeTab === 'pending' && (
          <Card>
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
        )}

        {/* Production Sync Card - Always Visible */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Production Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export approved translations for production deployment. Manual overrides will be preserved.
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
              <h4 className="font-medium mb-2">Enhanced Workflow:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Search existing translations</li>
                <li>Edit specific words/sentences manually</li>
                <li>Submit new translations if needed</li>
                <li>Approve pending translations</li>
                <li>Export all approved translations</li>
                <li>Update locale JSON files</li>
                <li>Deploy to production</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Edit Translation Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Translation</DialogTitle>
              <DialogDescription>
                Make manual changes to this translation. The original automated value will be preserved.
              </DialogDescription>
            </DialogHeader>
            {selectedTranslation && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Key</label>
                  <Input 
                    value={selectedTranslation.key} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Input 
                    value={languages.find(l => l.code === selectedTranslation.language_code)?.name || selectedTranslation.language_code} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Translation Value</label>
                  <Textarea
                    value={selectedTranslation.value}
                    onChange={(e) => setSelectedTranslation(prev => 
                      prev ? { ...prev, value: e.target.value } : null
                    )}
                    rows={4}
                    placeholder="Enter the corrected translation..."
                  />
                </div>
                {selectedTranslation.original_automated_value && (
                  <div>
                    <label className="text-sm font-medium">Original Automated Value</label>
                    <Textarea
                      value={selectedTranslation.original_automated_value}
                      disabled
                      className="bg-muted"
                      rows={2}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Page Context</label>
                    <Input
                      value={selectedTranslation.context_page || ''}
                      onChange={(e) => setSelectedTranslation(prev => 
                        prev ? { ...prev, context_page: e.target.value } : null
                      )}
                      placeholder="e.g., homepage, pricing"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Element Context</label>
                    <Input
                      value={selectedTranslation.context_element || ''}
                      onChange={(e) => setSelectedTranslation(prev => 
                        prev ? { ...prev, context_element: e.target.value } : null
                      )}
                      placeholder="e.g., header, button"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};