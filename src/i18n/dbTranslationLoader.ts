/**
 * DB-First Translation Loader
 * 
 * Fetches translations from the Supabase `translations` table at runtime,
 * making the DB the single canonical source of truth.
 * Static JSON locale files serve only as offline/build-time fallback.
 * 
 * Architecture:
 *   en.json → DB (via sync-translations) → runtime i18n bundle
 *   Static locale files = derived fallback artifacts
 */
import { supabase } from '@/integrations/supabase/client';
import i18n from './config';

const SUPPORTED_LANGUAGES = [
  'es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru', 'ar', 'af', 'ko', 'tr'
];

/** Convert flat dot-key translations into nested object */
function buildNestedObject(flatEntries: Array<{ key: string; value: string }>): Record<string, any> {
  const nested: Record<string, any> = {};
  for (const { key, value } of flatEntries) {
    const parts = key.split('.');
    let current = nested;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return nested;
}

/** Fetch all translations for a language from DB (paginated) */
async function fetchLanguageFromDB(langCode: string): Promise<Record<string, any> | null> {
  try {
    const allRows: Array<{ key: string; value: string }> = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language_code', langCode)
        .in('status', ['approved', 'auto_translated'])
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error(`[i18n-loader] Error fetching ${langCode}:`, error.message);
        return null;
      }
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (allRows.length === 0) return null;
    return buildNestedObject(allRows);
  } catch (err) {
    console.error(`[i18n-loader] Failed to load ${langCode} from DB:`, err);
    return null;
  }
}

/** Load a single language from DB and merge into i18n runtime */
export async function loadLanguageFromDB(langCode: string): Promise<boolean> {
  if (langCode === 'en') return true; // English is always from static file
  const bundle = await fetchLanguageFromDB(langCode);
  if (!bundle) return false;
  i18n.addResourceBundle(langCode, 'translation', bundle, true, true);
  return true;
}

/** 
 * Load ALL supported languages from DB into i18n runtime.
 * Called once at app startup. Static JSON files remain as fallback
 * (already loaded in config.ts resources).
 */
export async function loadAllTranslationsFromDB(): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = [];
  const failed: string[] = [];

  // Load in parallel (all languages at once)
  const results = await Promise.allSettled(
    SUPPORTED_LANGUAGES.map(async (lang) => {
      const success = await loadLanguageFromDB(lang);
      return { lang, success };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      loaded.push(result.value.lang);
    } else {
      const lang = result.status === 'fulfilled' ? result.value.lang : 'unknown';
      failed.push(lang);
    }
  }

  console.log(`[i18n-loader] DB load complete: ${loaded.length} loaded, ${failed.length} using static fallback`);
  return { loaded, failed };
}
