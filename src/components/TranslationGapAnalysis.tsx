import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Zap, ChevronDown, ChevronUp, Database, RefreshCw, Loader2 } from 'lucide-react';
import { fetchDBCoverageStats, fetchMissingKeysForLanguage, type DBLanguageCoverage, type DBGapDetail } from '@/utils/dbTranslationGapAnalysis';
import { buildPartialEnglish } from '@/utils/translationGapAnalysis';
import { languages } from '@/i18n/config';

interface TranslationGapAnalysisProps {
  onSyncGaps: (langCode: string, partialEnContent: Record<string, any>, missingKeys: string[]) => void;
  onHealAllGaps?: () => void;
  syncing: boolean;
  healingSyncing?: boolean;
}

export function TranslationGapAnalysis({ onSyncGaps, syncing }: TranslationGapAnalysisProps) {
  const [coverage, setCoverage] = useState<DBLanguageCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [missingDetails, setMissingDetails] = useState<Record<string, DBGapDetail[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  const loadCoverage = async () => {
    setLoading(true);
    try {
      const stats = await fetchDBCoverageStats();
      setCoverage(stats);
    } catch (err) {
      console.error('Failed to load DB coverage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoverage();
  }, []);

  const handleExpand = async (langCode: string) => {
    if (expandedLang === langCode) {
      setExpandedLang(null);
      return;
    }
    setExpandedLang(langCode);
    if (!missingDetails[langCode]) {
      setLoadingDetails(langCode);
      try {
        const details = await fetchMissingKeysForLanguage(langCode);
        setMissingDetails(prev => ({ ...prev, [langCode]: details }));
      } catch (err) {
        console.error(`Failed to load missing keys for ${langCode}:`, err);
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  const handleSyncGaps = (langCode: string) => {
    const details = missingDetails[langCode];
    if (!details || details.length === 0) return;
    const keys = details.map(d => d.key);
    const partial = buildPartialEnglish(keys);
    onSyncGaps(langCode, partial, keys);
  };

  const totalKeys = coverage[0]?.totalKeys || 0;
  const totalMissing = coverage.reduce((sum, c) => sum + c.missingKeys, 0);
  const langsWithGaps = coverage.filter(c => c.missingKeys > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            DB-Sourced Gap Analysis
            <Badge variant="outline" className="text-xs ml-2">Single Source of Truth</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading coverage from database...
            </div>
          ) : (
            <>
              <div className={`p-4 rounded-lg border ${totalMissing === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm">
                    <span className="font-bold text-lg">{totalKeys}</span> canonical keys ·{' '}
                    <span className="font-bold text-lg text-destructive">{totalMissing}</span> total gaps across{' '}
                    <span className="font-bold">{langsWithGaps}</span> languages
                  </div>
                  <div className="flex gap-2">
                    {totalMissing > 0 && (
                      <Badge variant="secondary" className="bg-yellow-600 text-white">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {totalMissing} missing
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={loadCoverage} disabled={loading}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Coverage is computed from the <code>translations</code> table in Supabase — the canonical source of truth.
                Static JSON files are derived fallback artifacts. Use "Sync Gaps" to translate missing keys via Gemini.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Per-language cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4">
          {coverage.map((item) => {
            const lang = languages.find(l => l.code === item.langCode);
            const isExpanded = expandedLang === item.langCode;
            const details = missingDetails[item.langCode] || [];
            const isLoadingThis = loadingDetails === item.langCode;

            return (
              <Card key={item.langCode} className={item.missingKeys === 0 ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang?.flag}</span>
                      <span className="font-medium">{lang?.name || item.langCode}</span>
                      <Badge variant={item.missingKeys === 0 ? 'default' : 'destructive'} className="text-xs">
                        {item.missingKeys === 0 ? '✓ Complete' : `${item.missingKeys} missing`}
                      </Badge>
                      {item.approvedKeys > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {item.approvedKeys} approved
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {item.translatedKeys}/{item.totalKeys}
                      </span>
                      {item.missingKeys > 0 && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncGaps(item.langCode)}
                            disabled={syncing || !missingDetails[item.langCode]}
                            className="text-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Sync Gaps
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExpand(item.langCode)}
                            className="text-xs"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <Progress value={item.coveragePct} className="h-2 mb-2" />

                  {/* Status breakdown */}
                  {item.missingKeys > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">Auto-translated: {item.autoTranslatedKeys}</Badge>
                      <Badge variant="outline" className="text-xs">Approved: {item.approvedKeys}</Badge>
                      <Badge variant="outline" className="text-xs">Missing: {item.missingKeys}</Badge>
                    </div>
                  )}

                  {/* Expanded detail view */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4">
                      {isLoadingThis ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading missing keys...
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground mb-2">
                            {details.length} keys missing from DB
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {details.map(detail => (
                              <div key={detail.key} className="text-xs font-mono px-2 py-1 bg-muted rounded flex items-center justify-between gap-2">
                                <span className="truncate">{detail.key}</span>
                                <Badge variant="outline" className="text-xs shrink-0">{detail.category}</Badge>
                              </div>
                            ))}
                            {details.length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                All keys are translated in the database ✓
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
