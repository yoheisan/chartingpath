/**
 * DB-First Translation Loader
 * 
 * Fetches translations for a SINGLE language at a time from the Supabase
 * `translations` table. Only the user's active language is loaded at startup;
 * additional languages are loaded on-demand when the user switches.
 * 
 * This avoids fetching 30,000+ rows across 17 languages on every page load.
 */
import { supabase } from '@/integrations/supabase/client';
import i18n from './config';

/** Cache to avoid re-fetching languages already loaded from DB */
const loadedLanguages = new Set<string>();

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

/** Fetch translations for a single language from DB (paginated) */
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

/** 
 * Load a single language from DB and merge into i18n runtime.
 * Skips if already loaded or if language is English (static source).
 */
async function loadLanguageBundle(langCode: string, forceReload = false): Promise<boolean> {
  if (langCode === 'en') return true;
  if (!forceReload && loadedLanguages.has(langCode)) return true;

  const bundle = await fetchLanguageFromDB(langCode);
  if (!bundle) return false;

  if (forceReload) {
    i18n.removeResourceBundle(langCode, 'translation');
  }

  i18n.addResourceBundle(langCode, 'translation', bundle, true, true);
  loadedLanguages.add(langCode);
  console.log(`[i18n-loader] ${forceReload ? 'Reloaded' : 'Loaded'} ${langCode} from DB`);
  // Force re-render of all components using useTranslation
  i18n.emit('loaded');
  return true;
}

export async function loadLanguageFromDB(langCode: string): Promise<boolean> {
  return loadLanguageBundle(langCode, false);
}

/** Force-refresh a language from DB even if it was previously cached */
export async function reloadLanguageFromDB(langCode: string): Promise<boolean> {
  return loadLanguageBundle(langCode, true);
}

/** 
 * Load ONLY the current language from DB at startup.
 * Other languages load on-demand via the languageChanged listener.
 */
export async function loadCurrentLanguageFromDB(): Promise<boolean> {
  const lang = i18n.language || 'en';
  if (lang === 'en') return true;
  return loadLanguageFromDB(lang);
}

// Keep backward compat export name
export async function loadAllTranslationsFromDB(): Promise<{ loaded: string[]; failed: string[] }> {
  const lang = i18n.language || 'en';
  if (lang === 'en') return { loaded: ['en'], failed: [] };
  
  const success = await loadLanguageFromDB(lang);
  return {
    loaded: success ? [lang] : [],
    failed: success ? [] : [lang],
  };
}
