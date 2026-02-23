import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Zap, ChevronDown, ChevronUp, FileSearch } from 'lucide-react';
import { analyzeTranslationGaps, buildPartialEnglish, type LanguageGapReport, type TranslationSourceType } from '@/utils/translationGapAnalysis';
import { languages } from '@/i18n/config';

const SOURCE_LABELS: Record<TranslationSourceType, { label: string; color: string }> = {
  static_ui: { label: 'Static UI', color: 'bg-blue-500/20 text-blue-300' },
  component_prop: { label: 'Component Prop', color: 'bg-purple-500/20 text-purple-300' },
  dynamic_data: { label: 'Dynamic Data', color: 'bg-orange-500/20 text-orange-300' },
  interpolated: { label: 'Interpolated', color: 'bg-green-500/20 text-green-300' },
};

interface TranslationGapAnalysisProps {
  onSyncGaps: (langCode: string, partialEnContent: Record<string, any>, missingKeys: string[]) => void;
  syncing: boolean;
}

export function TranslationGapAnalysis({ onSyncGaps, syncing }: TranslationGapAnalysisProps) {
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const reports = useMemo(() => analyzeTranslationGaps(), []);
  const totalEnKeys = reports[0]?.totalEnKeys || 0;
  const totalMissing = reports.reduce((sum, r) => sum + r.missingKeys.length, 0);
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    reports.forEach(r => Object.keys(r.missingByCategory).forEach(c => cats.add(c)));
    return Array.from(cats).sort();
  }, [reports]);

  const handleSyncGaps = (report: LanguageGapReport) => {
    const partial = buildPartialEnglish(report.missingKeys);
    onSyncGaps(report.langCode, partial, report.missingKeys);
  };

  const getFilteredMissingKeys = (report: LanguageGapReport) => {
    let keys = report.missingKeys;
    if (categoryFilter !== 'all') {
      keys = keys.filter(k => k.startsWith(categoryFilter + '.'));
    }
    if (sourceFilter !== 'all') {
      const sourceKeys = new Set(report.missingBySource[sourceFilter as TranslationSourceType] || []);
      keys = keys.filter(k => sourceKeys.has(k));
    }
    return keys;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5" />
            Static Locale Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${totalMissing === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm">
                <span className="font-bold text-lg">{totalEnKeys}</span> English keys ·{' '}
                <span className="font-bold text-lg text-destructive">{totalMissing}</span> total gaps across{' '}
                <span className="font-bold">{reports.filter(r => r.missingKeys.length > 0).length}</span> languages
              </div>
              {totalMissing > 0 && (
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {totalMissing} missing translations
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            This compares <code>en.json</code> keys against each locale's static JSON file. 
            Missing keys will show as untranslated in the UI. Use "Sync Gaps" to translate only the missing keys via Gemini.
          </p>

          {/* Source type legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(SOURCE_LABELS).map(([type, { label, color }]) => (
              <Badge key={type} className={`text-xs ${color}`}>{label}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-language gap cards */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => {
          const lang = languages.find(l => l.code === report.langCode);
          const isExpanded = expandedLang === report.langCode;
          const filteredKeys = isExpanded ? getFilteredMissingKeys(report) : [];

          return (
            <Card key={report.langCode} className={report.missingKeys.length === 0 ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang?.flag}</span>
                    <span className="font-medium">{lang?.name || report.langCode}</span>
                    <Badge variant={report.missingKeys.length === 0 ? 'default' : 'destructive'} className="text-xs">
                      {report.missingKeys.length === 0 ? '✓ Complete' : `${report.missingKeys.length} missing`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {report.translatedKeys}/{report.totalEnKeys}
                    </span>
                    {report.missingKeys.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncGaps(report)}
                          disabled={syncing}
                          className="text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Sync Gaps
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedLang(isExpanded ? null : report.langCode)}
                          className="text-xs"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Progress value={report.coveragePct} className="h-2 mb-2" />

                {/* Source breakdown badges */}
                {report.missingKeys.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Object.entries(report.missingBySource) as [TranslationSourceType, string[]][])
                      .filter(([, keys]) => keys.length > 0)
                      .map(([type, keys]) => (
                        <Badge key={type} className={`text-xs ${SOURCE_LABELS[type].color}`}>
                          {SOURCE_LABELS[type].label}: {keys.length}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Category breakdown badges */}
                {report.missingKeys.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(report.missingByCategory)
                      .sort((a, b) => b[1].length - a[1].length)
                      .slice(0, 8)
                      .map(([cat, keys]) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}: {keys.length}
                        </Badge>
                      ))}
                    {Object.keys(report.missingByCategory).length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(report.missingByCategory).length - 8} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Expanded detail view */}
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex gap-2 mb-3">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {allCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Source type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sources</SelectItem>
                          {Object.entries(SOURCE_LABELS).map(([type, { label }]) => (
                            <SelectItem key={type} value={type}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground self-center">
                        Showing {filteredKeys.length} of {report.missingKeys.length}
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredKeys.map(key => (
                        <div key={key} className="text-xs font-mono px-2 py-1 bg-muted rounded flex items-center justify-between">
                          <span className="truncate">{key}</span>
                        </div>
                      ))}
                      {filteredKeys.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No keys match filter</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
