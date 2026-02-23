import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Scan, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Search,
  Eye,
  CheckSquare,
  Square,
  GitCompare,
  FileText,
  Loader2
} from 'lucide-react';

interface ScanSession {
  id: string;
  version_number: number;
  scan_status: string;
  total_strings_found: number;
  new_strings_count: number;
  modified_strings_count: number;
  scan_date: string;
  completed_at: string | null;
  scan_metadata: any;
  current_extracted_count?: number;
}

interface ExtractedString {
  id: string;
  string_key: string;
  original_text: string;
  context_path: string;
  context_element: string;
  context_selector: string;
  review_status: string;
  is_translatable: boolean;
}

interface StringChange {
  id: string;
  string_key: string;
  change_type: 'added' | 'modified' | 'removed';
  old_text: string | null;
  new_text: string | null;
}

export const SiteStringScanner = () => {
  const [scanSessions, setScanSessions] = useState<ScanSession[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanSession | null>(null);
  const [extractedStrings, setExtractedStrings] = useState<ExtractedString[]>([]);
  const [stringChanges, setStringChanges] = useState<StringChange[]>([]);
  const [selectedStrings, setSelectedStrings] = useState<Set<string>>(new Set());
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeView, setActiveView] = useState<'scanner' | 'results' | 'comparison'>('scanner');
  const [compareVersionsState, setCompareVersionsState] = useState<{ old: number; new: number }>({ old: 1, new: 2 });
  const { toast } = useToast();

  useEffect(() => {
    loadScanSessions();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentScan && currentScan.scan_status === 'in_progress') {
      interval = setInterval(() => {
        checkScanProgress();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [currentScan]);

  const loadScanSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('site_scan_sessions')
        .select('*')
        .order('version_number', { ascending: false });

      if (error) throw error;
      setScanSessions(data || []);
    } catch (error) {
      console.error('Error loading scan sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scan sessions',
        variant: 'destructive'
      });
    }
  };

  const startScan = async () => {
    if (!baseUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a base URL to scan',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setScanProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('site-string-extractor', {
        body: {
          action: 'start_scan',
          base_url: baseUrl
        }
      });

      if (error) throw error;

      toast({
        title: 'Scan Started',
        description: `Site scan initiated for version ${data.version_number}`
      });

      setCurrentScan({
        id: data.scan_session_id,
        version_number: data.version_number,
        scan_status: 'in_progress',
        total_strings_found: 0,
        new_strings_count: 0,
        modified_strings_count: 0,
        scan_date: new Date().toISOString(),
        completed_at: null,
        scan_metadata: { base_url: baseUrl }
      });

      await loadScanSessions();
    } catch (error) {
      console.error('Error starting scan:', error);
      toast({
        title: 'Error',
        description: 'Failed to start site scan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkScanProgress = async () => {
    if (!currentScan) return;

    try {
      const { data, error } = await supabase.functions.invoke('site-string-extractor', {
        body: {
          action: 'get_scan_status',
          scan_session_id: currentScan.id
        }
      });

      if (error) throw error;

      setCurrentScan(data);
      setScanProgress(data.scan_status === 'completed' ? 100 : 
                     data.scan_status === 'failed' ? 0 : 50);

      if (data.scan_status === 'completed') {
        toast({
          title: 'Scan Complete',
          description: `Found ${data.total_strings_found} translatable strings`
        });
        await loadScanSessions();
      } else if (data.scan_status === 'failed') {
        toast({
          title: 'Scan Failed',
          description: 'The site scan encountered an error',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking scan progress:', error);
    }
  };

  const loadScanResults = async (scanSessionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('site-string-extractor', {
        body: {
          action: 'get_scan_results',
          scan_session_id: scanSessionId
        }
      });

      if (error) throw error;
      setExtractedStrings(data || []);
      setActiveView('results');
    } catch (error) {
      console.error('Error loading scan results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scan results',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const performVersionComparison = async () => {
    if (!compareVersionsState.old || !compareVersionsState.new) {
      toast({
        title: 'Error',
        description: 'Please select both versions to compare',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('site-string-extractor', {
        body: {
          action: 'compare_versions',
          old_version: compareVersionsState.old,
          new_version: compareVersionsState.new
        }
      });

      if (error) throw error;
      setStringChanges(data || []);
      setActiveView('comparison');

      toast({
        title: 'Comparison Complete',
        description: `Found ${data?.length || 0} changes between versions`
      });
    } catch (error) {
      console.error('Error comparing versions:', error);
      const errorMsg = error instanceof Error ? error.message : 
        (typeof error === 'object' && error !== null && 'message' in error) ? String((error as any).message) : 'Failed to compare versions';
      toast({
        title: 'Error',
        description: errorMsg.includes('Version(s) not found') 
          ? 'You need at least 2 completed scans before you can compare versions. Run another scan first.'
          : 'Failed to compare versions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStringSelection = (stringId: string) => {
    const newSelected = new Set(selectedStrings);
    if (newSelected.has(stringId)) {
      newSelected.delete(stringId);
    } else {
      newSelected.add(stringId);
    }
    setSelectedStrings(newSelected);
  };

  const approveSelectedStrings = async () => {
    if (selectedStrings.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select strings to approve',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('site-string-extractor', {
        body: {
          action: 'approve_strings',
          string_ids: Array.from(selectedStrings)
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedStrings.size} strings approved and added to translations`
      });

      setSelectedStrings(new Set());
      // Refresh the current results
      if (currentScan) {
        await loadScanResults(currentScan.id);
      }
    } catch (error) {
      console.error('Error approving strings:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve strings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'modified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'removed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeView === 'scanner' ? 'default' : 'outline'}
          onClick={() => setActiveView('scanner')}
          className="flex items-center gap-2"
        >
          <Scan className="h-4 w-4" />
          Site Scanner
        </Button>
        <Button
          variant={activeView === 'results' ? 'default' : 'outline'}
          onClick={() => setActiveView('results')}
          className="flex items-center gap-2"
          disabled={extractedStrings.length === 0}
        >
          <FileText className="h-4 w-4" />
          Scan Results
        </Button>
        <Button
          variant={activeView === 'comparison' ? 'default' : 'outline'}
          onClick={() => setActiveView('comparison')}
          className="flex items-center gap-2"
        >
          <GitCompare className="h-4 w-4" />
          Version Comparison
        </Button>
      </div>

      {/* Scanner Tab */}
      {activeView === 'scanner' && (
        <div className="space-y-6">
          {/* Start New Scan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Site String Extractor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Base URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://your-site.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={startScan}
                    disabled={loading || !baseUrl}
                    className="flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                    Start Scan
                  </Button>
                </div>
              </div>

              {currentScan && currentScan.scan_status === 'in_progress' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Scanning in progress...</span>
                  </div>
                  <Progress value={scanProgress} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Found {currentScan.current_extracted_count || 0} strings so far...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
            </CardHeader>
            <CardContent>
              {scanSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No scans performed yet. Start your first scan above.
                </p>
              ) : (
                <div className="space-y-3">
                  {scanSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(session.scan_status)}
                          <div>
                            <div className="font-medium">Version {session.version_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(session.scan_date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {session.scan_status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadScanResults(session.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Strings:</span>
                          <div className="font-medium">{session.total_strings_found || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">New Strings:</span>
                          <div className="font-medium">{session.new_strings_count || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Modified:</span>
                          <div className="font-medium">{session.modified_strings_count || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Compare Versions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium mb-2 block">Old Version</label>
                  <Input
                    type="number"
                    value={compareVersionsState.old}
                    onChange={(e) => setCompareVersionsState(prev => ({ ...prev, old: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">New Version</label>
                  <Input
                    type="number"
                    value={compareVersionsState.new}
                    onChange={(e) => setCompareVersionsState(prev => ({ ...prev, new: parseInt(e.target.value) }))}
                  />
                </div>
                <Button 
                  onClick={performVersionComparison}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                  Compare
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Tab */}
      {activeView === 'results' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Extracted Strings</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedStrings.size === extractedStrings.length) {
                      setSelectedStrings(new Set());
                    } else {
                      setSelectedStrings(new Set(extractedStrings.map(s => s.id)));
                    }
                  }}
                >
                  {selectedStrings.size === extractedStrings.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedStrings.size > 0 && (
                  <Button
                    onClick={approveSelectedStrings}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve {selectedStrings.size} Strings
                  </Button>
                )}
                <Badge variant="secondary">
                  {extractedStrings.length} strings found
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {extractedStrings.map((string) => (
                  <div key={string.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStringSelection(string.id)}
                        className="mt-1"
                      >
                        {selectedStrings.has(string.id) ? 
                          <CheckSquare className="h-4 w-4 text-primary" /> :
                          <Square className="h-4 w-4 text-muted-foreground" />
                        }
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {string.string_key}
                          </code>
                          <Badge variant={string.review_status === 'approved' ? 'default' : 'outline'}>
                            {string.review_status}
                          </Badge>
                          <Badge variant="secondary">{string.context_element}</Badge>
                        </div>
                        <div className="text-sm mb-2">
                          <strong>Text:</strong> {string.original_text}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>Path: {string.context_path}</div>
                          <div>Selector: {string.context_selector}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Tab */}
      {activeView === 'comparison' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Version Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {stringChanges.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No version comparison performed yet. Use the scanner tab to compare versions.
                </p>
              ) : (
                <div className="space-y-3">
                  {stringChanges.map((change) => (
                    <div key={change.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className={getChangeTypeColor(change.change_type)}>
                          {change.change_type.toUpperCase()}
                        </Badge>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {change.string_key}
                        </code>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {change.old_text && (
                          <div>
                            <div className="font-medium text-muted-foreground mb-1">Old Text:</div>
                            <div className="bg-red-50 border border-red-200 p-2 rounded">
                              {change.old_text}
                            </div>
                          </div>
                        )}
                        {change.new_text && (
                          <div>
                            <div className="font-medium text-muted-foreground mb-1">New Text:</div>
                            <div className="bg-green-50 border border-green-200 p-2 rounded">
                              {change.new_text}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};