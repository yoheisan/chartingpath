import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, Radio, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { missingKeyCollector, type MissingKeyEntry } from '@/i18n/missingKeyCollector';
import { scanDomForHardcodedStrings, type HardcodedStringEntry } from '@/utils/staticStringScanner';

export function TranslationDebugPanel() {
  const [runtimeKeys, setRuntimeKeys] = useState<MissingKeyEntry[]>([]);
  const [hardcodedStrings, setHardcodedStrings] = useState<HardcodedStringEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [enabled, setEnabled] = useState(missingKeyCollector.isEnabled());
  const [, forceUpdate] = useState(0);

  // Subscribe to runtime collector changes
  useEffect(() => {
    const unsub = missingKeyCollector.subscribe(() => {
      setRuntimeKeys(missingKeyCollector.getAll());
    });
    setRuntimeKeys(missingKeyCollector.getAll());
    return () => { unsub(); };
  }, []);

  const toggleCollector = useCallback(() => {
    if (enabled) {
      missingKeyCollector.disable();
    } else {
      missingKeyCollector.enable();
    }
    setEnabled(!enabled);
  }, [enabled]);

  const runDomScan = useCallback(() => {
    setScanning(true);
    // Small delay to let any pending renders complete
    setTimeout(() => {
      const results = scanDomForHardcodedStrings();
      setHardcodedStrings(results);
      setScanning(false);
    }, 200);
  }, []);

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

  const exportHardcodedCsv = useCallback(() => {
    const header = 'text,element,selector';
    const rows = hardcodedStrings.map(e =>
      `"${e.text.replace(/"/g, '""')}",${e.element},"${e.selector.replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardcoded-strings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [hardcodedStrings]);

  const byLang = missingKeyCollector.getByLanguage();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="runtime">
        <TabsList className="w-full">
          <TabsTrigger value="runtime" className="flex-1">
            <Radio className="w-4 h-4 mr-1" />
            Runtime Logger ({runtimeKeys.length})
          </TabsTrigger>
          <TabsTrigger value="dom" className="flex-1">
            <Search className="w-4 h-4 mr-1" />
            DOM Scanner ({hardcodedStrings.length})
          </TabsTrigger>
        </TabsList>

        {/* Runtime missing key logger */}
        <TabsContent value="runtime">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Runtime Missing Key Logger</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={toggleCollector}>
                    {enabled ? <ToggleRight className="w-4 h-4 mr-1 text-green-500" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
                    {enabled ? 'Active' : 'Paused'}
                  </Button>
                  {runtimeKeys.length > 0 && (
                    <>
                      <Button size="sm" variant="outline" onClick={exportRuntimeCsv}>
                        <Download className="w-4 h-4 mr-1" /> CSV
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { missingKeyCollector.clear(); setRuntimeKeys([]); }}>
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
                  ? '🟢 Collecting missing keys. Browse the app in a non-English language to capture untranslated strings.' 
                  : '⚪ Paused. Enable to start collecting missing translation keys as you browse.'}
              </p>

              {runtimeKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {enabled ? 'No missing keys detected yet. Switch to a non-English language and browse the app.' : 'Enable the logger and browse the app.'}
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
                            <div key={i} className="flex items-center justify-between px-2 py-1 bg-muted rounded text-xs font-mono">
                              <span className="truncate flex-1">{entry.key}</span>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                {entry.route && <span className="text-muted-foreground">{entry.route}</span>}
                                <Badge variant="secondary" className="text-[10px]">×{entry.count}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOM Scanner */}
        <TabsContent value="dom">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">DOM Hardcoded String Scanner</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={runDomScan} disabled={scanning}>
                    <Search className="w-4 h-4 mr-1" />
                    {scanning ? 'Scanning...' : 'Scan Current Page'}
                  </Button>
                  {hardcodedStrings.length > 0 && (
                    <Button size="sm" variant="outline" onClick={exportHardcodedCsv}>
                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Scans the current page's DOM for visible text that isn't found in the English translation file. 
                These are likely hardcoded strings that need to be extracted to <code>en.json</code> and wrapped in <code>t()</code>.
              </p>

              {hardcodedStrings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Click "Scan Current Page" to find hardcoded strings on this page.
                </p>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {hardcodedStrings.map((entry, i) => (
                      <div key={i} className="px-2 py-1.5 bg-muted rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate flex-1">{entry.text}</span>
                          <Badge variant="outline" className="text-[10px] ml-2 shrink-0">&lt;{entry.element}&gt;</Badge>
                        </div>
                        <div className="text-muted-foreground text-[10px] font-mono mt-0.5 truncate">{entry.selector}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
