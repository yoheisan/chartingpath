import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Download, Upload, Globe, ArrowLeft, Search, Edit, Eye, Filter, RefreshCw, Scan, Zap, BarChart3, BookOpen, FileSearch, Bug } from 'lucide-react';
import i18n, { languages } from '@/i18n/config';
import { reloadLanguageFromDB } from '@/i18n/dbTranslationLoader';
import { useNavigate, Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { SiteStringScanner } from '@/components/SiteStringScanner';
import enTranslations from '@/i18n/locales/en.json';
import { TranslationGapAnalysis } from '@/components/TranslationGapAnalysis';
import { TranslationDebugPanel } from '@/components/TranslationDebugPanel';
import { TranslationOverrideSearch } from '@/components/TranslationOverrideSearch';

/** Flatten nested object to dot-key names only (no values) */
function flattenKeysOnly(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...flattenKeysOnly(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

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
  const [activeTab, setActiveTab] = useState<'coverage' | 'pending' | 'search' | 'submit' | 'scanner' | 'gaps' | 'debug' | 'override'>('coverage');
  const [gapSyncing, setGapSyncing] = useState(false);
  const [healAllSyncing, setHealAllSyncing] = useState(false);
  const [healProgress, setHealProgress] = useState<{ lang: string; translated: number; remaining: number; errors: number } | null>(null);
  const [coverageData, setCoverageData] = useState<Record<string, { total: number; translated: number; approved: number; auto_translated: number; stale: number }>>({});
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [syncingLanguages, setSyncingLanguages] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [syncPercent, setSyncPercent] = useState<number>(0);
  const [syncLangResults, setSyncLangResults] = useState<Record<string, { translated: number; errors: number; status: 'pending' | 'syncing' | 'done' | 'error' }>>({}); 
  const [articleSyncing, setArticleSyncing] = useState(false);
  const [articleSyncProgress, setArticleSyncProgress] = useState<string>('');
  const [articleSyncPercent, setArticleSyncPercent] = useState<number>(0);
  const [articleCoverage, setArticleCoverage] = useState<{ total_articles: number; language_summary: Record<string, { translated: number; stale?: number; total: number }> } | null>(null);
  const [articleCoverageLoading, setArticleCoverageLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isStatusRefreshing = coverageLoading || articleCoverageLoading;
  const loadingRef = useRef(false);

  // Keep ref in sync so interval/focus callbacks see latest value
  useEffect(() => {
    loadingRef.current = isStatusRefreshing;
  }, [isStatusRefreshing]);

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
      await Promise.all([loadCoverageStats(), loadArticleCoverage()]);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadCoverageStats = async (showToast = false) => {
    setCoverageLoading(true);
    try {
      const enMod = (await import('@/i18n/locales/en.json')).default;
      const flatKeys = flattenKeysOnly(enMod);
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: { action: 'get_coverage_stats', en_flat_keys: flatKeys }
      });
      if (error) throw error;
      const dbCoverage = data.coverage || {};
      const dbCoverageValues = Object.values(dbCoverage) as Array<{ total: number; translated: number; approved: number; auto_translated: number; stale: number }>;
      const totalKeys = data.total_keys || dbCoverageValues[0]?.total || 0;
      const fullCoverage: Record<string, { total: number; translated: number; approved: number; auto_translated: number; stale: number }> = {};
      for (const lang of languages) {
        if (lang.code === 'en') continue;
        fullCoverage[lang.code] = dbCoverage[lang.code] || { total: totalKeys, translated: 0, approved: 0, auto_translated: 0, stale: 0 };
      }
      setCoverageData(fullCoverage);
      if (showToast) {
        toast({ title: 'Coverage stats refreshed', description: `${data.total_keys || 0} total keys synced from source` });
      }
    } catch (error) {
      console.error('Error loading coverage stats:', error);
      if (showToast) {
        toast({ title: 'Error', description: 'Failed to refresh coverage stats', variant: 'destructive' });
      }
    } finally {
      setCoverageLoading(false);
    }
  };

  const handleSyncTranslations = async (targetLanguages?: string[]) => {
    setSyncingLanguages('all');
    const langs = targetLanguages || languages.filter(l => l.code !== 'en').map(l => l.code);
    let totalTranslated = 0;
    let totalErrors = 0;
    const totalSteps = langs.length + 2; // keys prep + langs + export
    let currentStep = 0;

    // Initialize per-language tracking
    const initialResults: Record<string, { translated: number; errors: number; status: 'pending' | 'syncing' | 'done' | 'error' }> = {};
    langs.forEach(code => { initialResults[code] = { translated: 0, errors: 0, status: 'pending' }; });
    setSyncLangResults(initialResults);

    // First pass: ensure translation_keys exist (fast, one call)
    currentStep++;
    setSyncPercent(Math.round((currentStep / totalSteps) * 100));
    setSyncProgress('Preparing translation keys...');
    try {
      const { error: prepError } = await supabase.functions.invoke('sync-translations', {
        body: {
          en_content: enTranslations,
          target_languages: [], // empty = just create keys, no translations
          prepare_keys_only: true
        }
      });
      if (prepError) console.error('Key prep error:', prepError);
    } catch (e) {
      console.error('Key prep error:', e);
    }

    // Second pass: translate one language at a time, with chunked calls
    for (let i = 0; i < langs.length; i++) {
      const langCode = langs[i];
      const langName = languages.find(l => l.code === langCode)?.name || langCode;
      currentStep++;
      setSyncPercent(Math.round((currentStep / totalSteps) * 100));
      setSyncLangResults(prev => ({ ...prev, [langCode]: { ...prev[langCode], status: 'syncing' } }));

      let langTranslated = 0;
      let langErrors = 0;
      let remaining = Infinity;
      let chunkNum = 0;
      const MAX_CHUNKS = 100; // Safety limit

      try {
        while (remaining > 0 && chunkNum < MAX_CHUNKS) {
          chunkNum++;
          setSyncProgress(`Translating ${langName} (${i + 1}/${langs.length}) — chunk ${chunkNum}...`);

          const { data, error } = await supabase.functions.invoke('sync-translations', {
            body: {
              en_content: enTranslations,
              target_languages: [langCode],
              skip_key_creation: true,
              max_keys: 60
            }
          });

          if (error) {
            console.error(`Sync error for ${langCode} chunk ${chunkNum}:`, error);
            langErrors++;
            break;
          }

          const langStats = data?.summary?.[langCode];
          if (langStats) {
            langTranslated += langStats.translated || 0;
            langErrors += langStats.errors || 0;
            remaining = langStats.remaining ?? 0;
          } else {
            remaining = 0;
          }

          setSyncLangResults(prev => ({
            ...prev,
            [langCode]: { translated: langTranslated, errors: langErrors, status: 'syncing' }
          }));
        }

        totalTranslated += langTranslated;
        totalErrors += langErrors;
        setSyncLangResults(prev => ({
          ...prev,
          [langCode]: { translated: langTranslated, errors: langErrors, status: langErrors > 0 && langTranslated === 0 ? 'error' : 'done' }
        }));

        await loadCoverageStats();
      } catch (error) {
        console.error(`Sync error for ${langCode}:`, error);
        totalErrors++;
        setSyncLangResults(prev => ({ ...prev, [langCode]: { translated: 0, errors: 1, status: 'error' } }));
      }
    }

    // Auto re-export: reload locale bundles from DB into i18n runtime
    currentStep++;
    setSyncPercent(100);
    setSyncProgress('Re-exporting locale files from DB...');
    let exportErrors = 0;
    for (const langCode of langs) {
      try {
        const { data: localeData, error: exportError } = await supabase.functions.invoke('manage-translations', {
          body: { action: 'export_locale_json', language: langCode }
        });
        if (exportError) {
          console.error(`Export error for ${langCode}:`, exportError);
          exportErrors++;
          continue;
        }
        if (localeData) {
          i18n.addResourceBundle(langCode, 'translation', localeData, true, true);
          console.log(`Re-exported ${langCode} locale (${Object.keys(localeData).length} top-level keys)`);
        }
      } catch (e) {
        console.error(`Export error for ${langCode}:`, e);
        exportErrors++;
      }
    }

    toast({
      title: 'Sync & Export Complete',
      description: `Translated ${totalTranslated} keys across ${langs.length} languages${totalErrors > 0 ? ` (${totalErrors} sync errors)` : ''}${exportErrors > 0 ? ` (${exportErrors} export errors)` : '. Locale bundles reloaded.'}`
    });

    await loadCoverageStats();
    setSyncingLanguages(null);
    setSyncProgress('');
    setSyncPercent(0);
    setSyncLangResults({});
  };

  const loadArticleCoverage = async () => {
    setArticleCoverageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-articles', {
        body: { action: 'get_status' }
      });
      if (error) throw error;
      setArticleCoverage({
        total_articles: data.total_articles || 0,
        language_summary: data.language_summary || {}
      });
    } catch (error) {
      console.error('Error loading article coverage:', error);
    } finally {
      setArticleCoverageLoading(false);
    }
  };

  const refreshStatusSnapshots = async (showToast = false) => {
    await Promise.all([loadCoverageStats(showToast), loadArticleCoverage()]);
    await reloadLanguageFromDB(i18n.language || 'en');
  };

  useEffect(() => {
    if (!isAdmin || activeTab !== 'coverage') return;

    const refresh = () => {
      if (!loadingRef.current) {
        refreshStatusSnapshots().catch((err) => console.error('Background status refresh failed:', err));
      }
    };

    const intervalId = window.setInterval(refresh, 15000);
    const onFocus = () => refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAdmin, activeTab]);

  const handleSyncArticleTranslations = async (targetLangCode?: string) => {
    setArticleSyncing(true);
    setArticleSyncPercent(0);
    const langs = targetLangCode
      ? [targetLangCode]
      : languages.filter(l => l.code !== 'en').map(l => l.code);
    let totalTranslated = 0;
    let totalErrors = 0;
    const BATCH_SIZE = 1; // 1 article per call to stay within edge function 50s timeout
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000;
    const CONCURRENCY = 1; // process 1 language at a time to avoid overwhelming Gemini + edge function timeouts

    // Worker that processes all batches for a single language
    const processLanguage = async (langCode: string, langIndex: number) => {
      const langName = languages.find(l => l.code === langCode)?.name || langCode;
      let offset = 0;
      let hasMore = true;
      let consecutiveFailures = 0;
      let langTranslated = 0;
      let langErrors = 0;

      while (hasMore) {
        setArticleSyncProgress(`Translating articles: ${langName} + ${Math.min(CONCURRENCY, langs.length)} languages in parallel — batch from ${offset}...`);

        try {
          const { data, error } = await supabase.functions.invoke('translate-articles', {
            body: {
              action: 'translate_all',
              language_code: langCode,
              target_languages: [langCode],
              batch_size: BATCH_SIZE,
              offset
            }
          });

          if (error) {
            consecutiveFailures++;
            console.error(`Article sync error for ${langCode} (attempt ${consecutiveFailures}):`, error);
            if (consecutiveFailures >= MAX_RETRIES) {
              langErrors++;
              hasMore = false;
              continue;
            }
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS * consecutiveFailures));
            continue;
          }

          consecutiveFailures = 0;
          langTranslated += data?.translated || 0;
          langErrors += data?.errors || 0;

          if (data?.next_offset != null) {
            offset = data.next_offset;
          } else {
            hasMore = false;
          }

          // Delay between batches to let edge function cool down
          if (hasMore) {
            await new Promise(r => setTimeout(r, 2000));
          }
        } catch (error) {
          consecutiveFailures++;
          console.error(`Article sync error for ${langCode} (attempt ${consecutiveFailures}):`, error);
          if (consecutiveFailures >= MAX_RETRIES) {
            langErrors++;
            hasMore = false;
            continue;
          }
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * consecutiveFailures));
        }
      }

      return { translated: langTranslated, errors: langErrors };
    };

    // Process languages in parallel chunks of CONCURRENCY
    for (let i = 0; i < langs.length; i += CONCURRENCY) {
      const chunk = langs.slice(i, i + CONCURRENCY);
      const chunkNames = chunk.map(c => languages.find(l => l.code === c)?.name || c).join(', ');
      setArticleSyncProgress(`Processing: ${chunkNames} (${i + 1}-${Math.min(i + CONCURRENCY, langs.length)} of ${langs.length})...`);
      setArticleSyncPercent(Math.round((i / langs.length) * 100));

      const results = await Promise.all(
        chunk.map((langCode, idx) => processLanguage(langCode, i + idx))
      );

      for (const r of results) {
        totalTranslated += r.translated;
        totalErrors += r.errors;
      }

      // Refresh coverage after each parallel chunk
      await loadArticleCoverage();
    }

    setArticleSyncPercent(100);
    toast({
      title: 'Article Translation Complete',
      description: `Translated ${totalTranslated} articles across ${langs.length} language(s)${totalErrors > 0 ? ` (${totalErrors} errors)` : ''}`
    });

    setArticleSyncing(false);
    setArticleSyncProgress('');
    setArticleSyncPercent(0);
  };

  const handleSyncGaps = async (langCode: string, partialEnContent: Record<string, any>, missingKeys: string[]) => {
    setGapSyncing(true);
    const langName = languages.find(l => l.code === langCode)?.name || langCode;
    
    try {
      // First ensure keys exist
      const { error: prepError } = await supabase.functions.invoke('sync-translations', {
        body: {
          en_content: partialEnContent,
          target_languages: [],
          prepare_keys_only: true
        }
      });
      if (prepError) console.error('Key prep error:', prepError);

      // Translate the gaps in chunks to avoid edge function timeout
      let totalTranslated = 0;
      let totalErrors = 0;
      let totalSkipped = 0;
      let remaining = Infinity;
      let chunkNum = 0;

      while (remaining > 0 && chunkNum < 100) {
        chunkNum++;
        const { data, error } = await supabase.functions.invoke('sync-translations', {
          body: {
            en_content: partialEnContent,
            target_languages: [langCode],
            skip_key_creation: true,
            max_keys: 60
          }
        });

        if (error) throw error;

        const langStats = data?.summary?.[langCode];
        totalTranslated += langStats?.translated || 0;
        totalErrors += langStats?.errors || 0;
        totalSkipped += langStats?.skipped || 0;
        remaining = langStats?.remaining ?? 0;
      }

      const translated = totalTranslated;
      const errors = totalErrors;
      const skipped = totalSkipped;

      // Re-export locale bundle from DB (always, even if 0 new translations —
      // the DB may already have keys the static JSON file is missing)
      const { data: localeData, error: exportError } = await supabase.functions.invoke('manage-translations', {
        body: { action: 'export_locale_json', language: langCode }
      });
      if (!exportError && localeData) {
        i18n.addResourceBundle(langCode, 'translation', localeData, true, true);
      }

      // If nothing was translated but nothing errored, the DB already had them
      const alreadyInDb = translated === 0 && errors === 0 && skipped > 0;
      toast({
        title: `Gap Sync Complete: ${langName}`,
        description: alreadyInDb
          ? `All ${missingKeys.length} keys already exist in the database. Runtime bundle refreshed. To update static files, use "Export JSON".`
          : `Translated ${translated} of ${missingKeys.length} missing keys${errors ? ` (${errors} errors)` : ''}`
      });

      await loadCoverageStats();
    } catch (error) {
      console.error(`Gap sync error for ${langCode}:`, error);
      toast({
        title: 'Gap Sync Failed',
        description: `Failed to sync ${langName} gaps`,
        variant: 'destructive'
      });
    } finally {
      setGapSyncing(false);
    }
  };


  const handleHealAllGaps = async () => {
    setHealAllSyncing(true);
    setHealProgress(null);
    try {
      // 1. Seed en.json keys into translation_keys + translations tables
      toast({ title: 'Step 1/3', description: 'Seeding English keys...' });
      const { error: seedError } = await supabase.functions.invoke('sync-translations', {
        body: { en_content: enTranslations, target_languages: [], prepare_keys_only: true }
      });
      if (seedError) console.error('Seed error (non-fatal):', seedError);

      // 2. Get gap analysis from DB
      toast({ title: 'Step 2/3', description: 'Analyzing gaps...' });
      const { data: healData, error: healError } = await supabase.functions.invoke('manage-translations', {
        body: { action: 'heal_all_gaps', en_fallback_content: enTranslations }
      });
      if (healError) throw healError;

      if (!healData?.target_languages?.length) {
        toast({ title: 'No Gaps Found', description: 'All languages are fully translated.' });
        return;
      }

      const allLangs: string[] = healData.target_languages;
      const totalGaps = healData.total_gaps || 0;

      toast({
        title: 'Step 3/3 — Translating',
        description: `${totalGaps} gaps across ${allLangs.length} languages. This may take several minutes...`
      });

      // 3. Translate one language at a time for maximum resilience
      let grandTotalTranslated = 0;
      let grandTotalErrors = 0;
      const MAX_RETRIES = 3;
      const MAX_CHUNKS_PER_LANG = 200; // safety cap: 200 chunks × 60 keys = 12,000 keys per language

      for (let langIdx = 0; langIdx < allLangs.length; langIdx++) {
        const lang = allLangs[langIdx];
        let langTranslated = 0;
        let langErrors = 0;
        let remaining = Infinity;
        let chunkNum = 0;
        let consecutiveFailures = 0;

        while (remaining > 0 && chunkNum < MAX_CHUNKS_PER_LANG) {
          chunkNum++;

          try {
            const { data, error } = await supabase.functions.invoke('sync-translations', {
              body: {
                en_content: healData.en_content,
                target_languages: [lang],
                skip_key_creation: true,
                max_keys: 60
              }
            });

            if (error) {
              consecutiveFailures++;
              console.error(`[heal] ${lang} chunk ${chunkNum} error:`, error);
              langErrors++;

              if (consecutiveFailures >= MAX_RETRIES) {
                console.warn(`[heal] ${lang}: ${MAX_RETRIES} consecutive failures, moving to next language`);
                break;
              }
              // Wait before retry (exponential backoff: 2s, 4s, 8s)
              await new Promise(r => setTimeout(r, 2000 * Math.pow(2, consecutiveFailures - 1)));
              continue;
            }

            // Reset failure counter on success
            consecutiveFailures = 0;

            const langStats = data?.summary?.[lang];
            const chunkTranslated = langStats?.translated || 0;
            const chunkErrors = langStats?.errors || 0;
            remaining = langStats?.remaining ?? 0;

            langTranslated += chunkTranslated;
            langErrors += chunkErrors;

            // Live UI status update (so cards don't look stuck at 4975 during long runs)
            if (chunkTranslated > 0) {
              setCoverageData(prev => {
                const current = prev[lang];
                if (!current) return prev;
                const translated = Math.min(current.total, current.translated + chunkTranslated);
                const autoTranslated = Math.min(current.total, current.auto_translated + chunkTranslated);
                return {
                  ...prev,
                  [lang]: {
                    ...current,
                    translated,
                    auto_translated: autoTranslated,
                  },
                };
              });
            }

            setHealProgress({
              lang,
              translated: grandTotalTranslated + langTranslated,
              remaining,
              errors: grandTotalErrors + langErrors
            });

            // If nothing was translated and nothing remaining, we're done with this lang
            if (chunkTranslated === 0 && remaining === 0) break;
            // If nothing translated but still remaining, might be stuck — count as soft failure
            if (chunkTranslated === 0 && remaining > 0) {
              consecutiveFailures++;
              if (consecutiveFailures >= MAX_RETRIES) {
                console.warn(`[heal] ${lang}: no progress after ${MAX_RETRIES} attempts, moving on`);
                break;
              }
            }
          } catch (err) {
            consecutiveFailures++;
            console.error(`[heal] ${lang} chunk ${chunkNum} exception:`, err);
            langErrors++;
            if (consecutiveFailures >= MAX_RETRIES) {
              console.warn(`[heal] ${lang}: ${MAX_RETRIES} consecutive exceptions, moving to next language`);
              break;
            }
            await new Promise(r => setTimeout(r, 2000 * Math.pow(2, consecutiveFailures - 1)));
          }
        }

        grandTotalTranslated += langTranslated;
        grandTotalErrors += langErrors;
      }

      // 4. Refresh runtime bundles
      for (const lang of allLangs) {
        try {
          const { data: localeData, error: exportError } = await supabase.functions.invoke('manage-translations', {
            body: { action: 'export_locale_json', language: lang }
          });
          if (!exportError && localeData) {
            i18n.addResourceBundle(lang, 'translation', localeData, true, true);
          }
        } catch (e) {
          console.error(`[heal] Failed to refresh ${lang} bundle:`, e);
        }
      }

      toast({
        title: 'All Gaps Healed',
        description: `Translated ${grandTotalTranslated} keys across ${allLangs.length} languages${grandTotalErrors ? ` (${grandTotalErrors} errors)` : ''}`
      });

      await loadCoverageStats();
    } catch (error) {
      console.error('Heal all gaps error:', error);
      toast({
        title: 'Heal All Gaps Failed',
        description: 'Failed to translate all gaps. Check console for details.',
        variant: 'destructive'
      });
    } finally {
      setHealAllSyncing(false);
      setHealProgress(null);
    }
  };

  const handleExportJson = async (langCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: { action: 'export_locale_json', language: langCode }
      });
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${langCode}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Exported', description: `${langCode}.json downloaded` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', variant: 'destructive' });
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

  // Production Sync removed — DB-first architecture means translations
  // are served directly from the database at runtime. No manual publish needed.

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
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
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
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTab === 'gaps' ? 'default' : 'outline'}
            onClick={() => setActiveTab('gaps')}
            className="flex items-center gap-2"
          >
            <FileSearch className="h-4 w-4" />
            Gap Analysis
          </Button>
          <Button
            variant={activeTab === 'coverage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('coverage')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Coverage & Sync
          </Button>
          <Button
            variant={activeTab === 'override' ? 'default' : 'outline'}
            onClick={() => setActiveTab('override')}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Override
          </Button>
          <Button
            variant={activeTab === 'search' ? 'default' : 'outline'}
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search & Edit
          </Button>
          <Button
            variant={activeTab === 'scanner' ? 'default' : 'outline'}
            onClick={() => setActiveTab('scanner')}
            className="flex items-center gap-2"
          >
            <Scan className="h-4 w-4" />
            Site Scanner
          </Button>
          <Button
            variant={activeTab === 'submit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('submit')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Submit New
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Pending ({pendingTranslations.length})
          </Button>
          <Button
            variant={activeTab === 'debug' ? 'default' : 'outline'}
            onClick={() => setActiveTab('debug')}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Debug Tools
          </Button>
        </div>

        {/* Coverage & Sync Tab */}
        {activeTab === 'coverage' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Translation Coverage
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => refreshStatusSnapshots(true)}
                      variant="outline"
                      size="sm"
                      disabled={isStatusRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${coverageLoading ? 'animate-spin' : ''}`} />
                      {coverageLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                      onClick={() => handleSyncTranslations()}
                      disabled={!!syncingLanguages}
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      {syncingLanguages ? 'Syncing...' : 'Sync All Languages'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {syncProgress && (
                  <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{syncProgress}</span>
                      <span className="text-primary">{syncPercent}%</span>
                    </div>
                    <Progress value={syncPercent} className="h-3" />
                    {Object.keys(syncLangResults).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(syncLangResults).map(([code, result]) => {
                          const lang = languages.find(l => l.code === code);
                          return (
                            <Badge
                              key={code}
                              variant={result.status === 'done' ? 'default' : result.status === 'error' ? 'destructive' : result.status === 'syncing' ? 'secondary' : 'outline'}
                              className={`text-xs ${result.status === 'syncing' ? 'animate-pulse' : ''} ${result.status === 'done' ? 'bg-green-600' : ''}`}
                            >
                              {lang?.flag} {code.toUpperCase()}
                              {result.status === 'done' && ` ✓${result.translated > 0 ? ` +${result.translated}` : ''}`}
                              {result.status === 'error' && ' ✗'}
                              {result.status === 'syncing' && ' ⟳'}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {/* Summary row */}
                {Object.keys(coverageData).length > 0 && (() => {
                  const allStats = Object.values(coverageData);
                  const totalKeys = allStats[0]?.total || 0;
                  const allMatch = allStats.every(s => s.translated === totalKeys);
                  const missingLangs = Object.entries(coverageData)
                    .filter(([, s]) => s.translated < totalKeys)
                    .map(([code, s]) => `${code} (${s.translated})`);
                  return (
                    <div className={`mb-4 p-4 rounded-lg border ${allMatch ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Source keys: <span className="font-bold text-lg">{totalKeys}</span>
                          <span className="mx-2">•</span>
                          Languages: <span className="font-bold">{allStats.length}</span>
                        </div>
                        {allMatch ? (
                          <Badge variant="default" className="bg-green-600">✓ All languages at 100%</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-600 text-white">
                            ⚠ Missing: {missingLangs.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(coverageData).map(([langCode, stats]) => {
                    const lang = languages.find(l => l.code === langCode);
                    const pct = stats.total > 0 ? Math.round((stats.translated / stats.total) * 100) : 0;
                    return (
                      <Card key={langCode} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {lang?.flag} {lang?.name || langCode}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {stats.translated}/{stats.total}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2 mb-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pct}% complete</span>
                          <div className="flex gap-1">
                            {stats.approved > 0 && (
                              <Badge variant="default" className="text-xs px-1 py-0">
                                {stats.approved} approved
                              </Badge>
                            )}
                            {stats.auto_translated > 0 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {stats.auto_translated} auto
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleSyncTranslations([langCode])}
                            disabled={!!syncingLanguages}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleExportJson(langCode)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {Object.keys(coverageData).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No coverage data available. Click "Sync All Languages" to start translating.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Article Translations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Blog Article Translations
                    {articleCoverage && (
                      <Badge variant="secondary" className="ml-2">
                        {articleCoverage.total_articles} articles
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => refreshStatusSnapshots(false)}
                      variant="outline"
                      size="sm"
                      disabled={isStatusRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${articleCoverageLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => handleSyncArticleTranslations()}
                      disabled={articleSyncing}
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      {articleSyncing ? 'Translating...' : 'Translate All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {articleSyncProgress && (
                  <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{articleSyncProgress}</span>
                      <span className="text-primary">{articleSyncPercent}%</span>
                    </div>
                    <Progress value={articleSyncPercent} className="h-3" />
                  </div>
                )}
                {articleCoverage && Object.keys(articleCoverage.language_summary).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {languages.filter(l => l.code !== 'en').map(lang => {
                      const stats = articleCoverage.language_summary[lang.code];
                      const translated = stats?.translated || 0;
                      const stale = stats?.stale || 0;
                      const total = articleCoverage.total_articles;
                      const pct = total > 0 ? Math.round((translated / total) * 100) : 0;
                      const missing = total - translated - stale;
                      return (
                        <Card key={lang.code} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {lang.flag} {lang.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {translated}/{total}
                            </span>
                          </div>
                          <Progress value={pct} className="h-2 mb-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{pct}% up-to-date</span>
                            <div className="flex gap-1">
                              {stale > 0 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {stale} stale
                                </Badge>
                              )}
                              {missing > 0 && (
                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                  {missing} missing
                                </Badge>
                              )}
                            </div>
                          </div>
                          {(missing > 0 || stale > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2 text-xs"
                              onClick={() => handleSyncArticleTranslations(lang.code)}
                              disabled={articleSyncing}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Translate {missing + stale} articles
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {articleCoverageLoading ? 'Loading coverage...' : 'Click "Refresh" to load blog article translation coverage per language.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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

        {/* Gap Analysis Tab */}
        {activeTab === 'gaps' && (
          <TranslationGapAnalysis onSyncGaps={handleSyncGaps} onHealAllGaps={handleHealAllGaps} syncing={gapSyncing} healingSyncing={healAllSyncing} healProgress={healProgress} />
        )}

        {/* Override Tab */}
        {activeTab === 'override' && (
          <TranslationOverrideSearch />
        )}

        {/* Site Scanner Tab */}
        {activeTab === 'scanner' && (
          <SiteStringScanner />
        )}

        {/* Debug Tools Tab */}
        {activeTab === 'debug' && (
          <TranslationDebugPanel />
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

        {/* DB-First Architecture Info */}
        <Card className="mt-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Automated DB-First Architecture</h4>
                <p className="text-sm text-muted-foreground">
                  Translations are served directly from the database at runtime. No manual publishing is required — 
                  once translations are synced or approved, users see them automatically on next page load.
                </p>
              </div>
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