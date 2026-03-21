import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, Radio, ToggleLeft, ToggleRight } from 'lucide-react';
import { missingKeyCollector, type MissingKeyEntry } from '@/i18n/missingKeyCollector';

export function TranslationDebugPanel() {
  const [runtimeKeys, setRuntimeKeys] = useState<MissingKeyEntry[]>([]);
  const [enabled, setEnabled] = useState(missingKeyCollector.isEnabled());

  useEffect(() => {
    const unsub = missingKeyCollector.subscribe(() => {
      setRuntimeKeys(missingKeyCollector.getAll());
    });
    setRuntimeKeys(missingKeyCollector.getAll());
    return () => {
      unsub();
    };
  }, []);

  const toggleCollector = useCallback(() => {
    if (enabled) {
      missingKeyCollector.disable();
    } else {
      missingKeyCollector.enable();
    }
    setEnabled(!enabled);
  }, [enabled]);

  const exportRuntimeCsv = useCallback(() => {
    const csv = missingKeyCollector.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-keys-runtime-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const byLang = missingKeyCollector.getByLanguage();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="w-4 h-4" /> Runtime Missing Key Logger ({runtimeKeys.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={toggleCollector}>
                {enabled ? (
                  <ToggleRight className="w-4 h-4 mr-1 text-primary" />
                ) : (
                  <ToggleLeft className="w-4 h-4 mr-1" />
                )}
                {enabled ? 'Active' : 'Paused'}
              </Button>
              {runtimeKeys.length > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={exportRuntimeCsv}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      missingKeyCollector.clear();
                      setRuntimeKeys([]);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Clear
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            {enabled
              ? 'Collecting missing i18n keys. Browse the app in a non-English language to capture untranslated keys.'
              : 'Paused. Enable to start collecting missing translation keys as you browse.'}
          </p>

          {runtimeKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {enabled
                ? 'No missing keys detected yet. Switch to a non-English language and browse the app.'
                : 'Enable the logger and browse the app.'}
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(byLang).map(([lang, entries]) => (
                <div key={lang}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{lang}</Badge>
                    <span className="text-xs text-muted-foreground">{entries.length} missing keys</span>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {entries.map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2 py-1 bg-muted rounded text-xs font-mono"
                        >
                          <span className="truncate flex-1">{entry.key}</span>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            {entry.route && <span className="text-muted-foreground">{entry.route}</span>}
                            <Badge variant="secondary" className="text-sm">
                              ×{entry.count}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground">
            Note: the legacy DOM hardcoded-string scanner was removed; use the automated Site Scanner to extract UI strings into the DB.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
