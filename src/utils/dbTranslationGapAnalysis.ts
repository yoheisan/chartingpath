/**
 * DB-Based Translation Gap Analysis
 * 
 * Queries the Supabase `translations` table directly to compute
 * coverage statistics. This is the audit-ready, single-source-of-truth
 * replacement for the static-file-based gap analysis.
 * 
 * The DB `translation_keys` table holds the canonical key registry;
 * the `translations` table holds per-language values.
 */
import { supabase } from '@/integrations/supabase/client';
import enTranslations from '@/i18n/locales/en.json';

export interface DBLanguageCoverage {
  langCode: string;
  totalKeys: number;
  translatedKeys: number;
  approvedKeys: number;
  autoTranslatedKeys: number;
  missingKeys: number;
  coveragePct: number;
  lastSyncedAt: string | null;
}

export interface DBGapDetail {
  key: string;
  category: string;
  description: string | null;
}

/** Fetch coverage stats from the DB (via manage-translations edge function) */
export async function fetchDBCoverageStats(): Promise<DBLanguageCoverage[]> {
  const { data, error } = await supabase.functions.invoke('manage-translations', {
    body: { action: 'get_coverage_stats', en_fallback_content: enTranslations }
  });

  if (error || !data) {
    console.error('[db-gap] Error fetching coverage:', error);
    return [];
  }

  const totalKeys = data.total_keys || 0;
  const coverage: DBLanguageCoverage[] = [];

  for (const [langCode, stats] of Object.entries(data.coverage || {}) as [string, any][]) {
    coverage.push({
      langCode,
      totalKeys,
      translatedKeys: stats.translated || 0,
      approvedKeys: stats.approved || 0,
      autoTranslatedKeys: stats.auto_translated || 0,
      missingKeys: totalKeys - (stats.translated || 0),
      coveragePct: totalKeys > 0 ? Math.round(((stats.translated || 0) / totalKeys) * 100) : 0,
      lastSyncedAt: null, // Could be added if we track per-language sync timestamps
    });
  }

  // Sort by most gaps first
  coverage.sort((a, b) => b.missingKeys - a.missingKeys);
  return coverage;
}

/** Fetch the specific missing keys for a language */
export async function fetchMissingKeysForLanguage(langCode: string): Promise<DBGapDetail[]> {
  // Get all canonical keys
  const allKeys: Array<{ key: string; category: string; description: string | null }> = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('translation_keys')
      .select('key, category, description')
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    allKeys.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Get translated keys for this language
  const translatedSet = new Set<string>();
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('translations')
      .select('key')
      .eq('language_code', langCode)
      .in('status', ['approved', 'auto_translated'])
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(r => translatedSet.add(r.key));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return allKeys
    .filter(k => !translatedSet.has(k.key))
    .map(k => ({
      key: k.key,
      category: k.category || k.key.split('.')[0],
      description: k.description,
    }));
}
