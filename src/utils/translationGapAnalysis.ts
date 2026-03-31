import enTranslations from '@/i18n/locales/en.json';
import esTranslations from '@/i18n/locales/es.json';
import ptTranslations from '@/i18n/locales/pt.json';
import frTranslations from '@/i18n/locales/fr.json';
import zhTranslations from '@/i18n/locales/zh.json';
import deTranslations from '@/i18n/locales/de.json';
import hiTranslations from '@/i18n/locales/hi.json';
import idTranslations from '@/i18n/locales/id.json';
import itTranslations from '@/i18n/locales/it.json';
import jaTranslations from '@/i18n/locales/ja.json';
import ruTranslations from '@/i18n/locales/ru.json';
import arTranslations from '@/i18n/locales/ar.json';
import afTranslations from '@/i18n/locales/af.json';
import koTranslations from '@/i18n/locales/ko.json';
import trTranslations from '@/i18n/locales/tr.json';
import nlTranslations from '@/i18n/locales/nl.json';
import plTranslations from '@/i18n/locales/pl.json';
import viTranslations from '@/i18n/locales/vi.json';

const localeMap: Record<string, Record<string, any>> = {
  es: esTranslations,
  pt: ptTranslations,
  fr: frTranslations,
  zh: zhTranslations,
  de: deTranslations,
  hi: hiTranslations,
  id: idTranslations,
  it: itTranslations,
  ja: jaTranslations,
  ru: ruTranslations,
  ar: arTranslations,
  af: afTranslations,
  ko: koTranslations,
  tr: trTranslations,
  nl: nlTranslations,
  pl: plTranslations,
  vi: viTranslations,
};

/** Flatten a nested object into dot-separated keys */
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key]);
    }
  }
  return result;
}

/** Translation source categories */
export type TranslationSourceType = 'static_ui' | 'component_prop' | 'dynamic_data' | 'interpolated';

/** Categorize a key by its source type */
function categorizeKey(key: string, value: string): TranslationSourceType {
  // Keys with interpolation variables like {{count}} or {count}
  if (/\{\{?\w+\}?\}/.test(value)) return 'interpolated';
  
  // Keys from data-driven sections (edge atlas patterns, screener signals, etc.)
  const dynamicPrefixes = [
    'edgeAtlas.stocksDesc', 'edgeAtlas.cryptoDesc', 'edgeAtlas.fxDesc',
    'edgeAtlas.indicesDesc', 'edgeAtlas.commoditiesDesc',
    'teaserSignals.', 'screener.columns.', 'screener.assetTypes.',
  ];
  if (dynamicPrefixes.some(p => key.startsWith(p))) return 'dynamic_data';
  
  // Component-level props (used in reusable components like PricingTeaser, CopilotShowcase)
  const componentPrefixes = [
    'copilotShowcase.', 'pricingTeaser.', 'patternScreenerTeaser.',
    'livePatternPreview.', 'howItWorks.',
  ];
  if (componentPrefixes.some(p => key.startsWith(p))) return 'component_prop';
  
  return 'static_ui';
}

export interface LanguageGapReport {
  langCode: string;
  totalEnKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  missingByCategory: Record<string, string[]>;
  missingBySource: Record<TranslationSourceType, string[]>;
  coveragePct: number;
}

/** Analyze all locale files and return gap reports */
export function analyzeTranslationGaps(): LanguageGapReport[] {
  const flatEn = flattenObject(enTranslations);
  const enKeys = Object.keys(flatEn);
  const totalEnKeys = enKeys.length;

  const reports: LanguageGapReport[] = [];

  for (const [langCode, translations] of Object.entries(localeMap)) {
    const flatLang = flattenObject(translations);
    const missingKeys = enKeys.filter(k => !(k in flatLang));

    // Group by top-level category (namespace)
    const missingByCategory: Record<string, string[]> = {};
    const missingBySource: Record<TranslationSourceType, string[]> = {
      static_ui: [],
      component_prop: [],
      dynamic_data: [],
      interpolated: [],
    };

    for (const key of missingKeys) {
      const category = key.split('.')[0];
      if (!missingByCategory[category]) missingByCategory[category] = [];
      missingByCategory[category].push(key);

      const sourceType = categorizeKey(key, flatEn[key]);
      missingBySource[sourceType].push(key);
    }

    reports.push({
      langCode,
      totalEnKeys,
      translatedKeys: totalEnKeys - missingKeys.length,
      missingKeys,
      missingByCategory,
      missingBySource,
      coveragePct: Math.round(((totalEnKeys - missingKeys.length) / totalEnKeys) * 100),
    });
  }

  // Sort by most gaps first
  reports.sort((a, b) => b.missingKeys.length - a.missingKeys.length);
  return reports;
}

/** Get the flat English source for building partial sync payloads */
export function getEnglishSource(): Record<string, any> {
  return enTranslations;
}

/** Build a partial en.json containing only the specified keys (nested) */
export function buildPartialEnglish(keys: string[]): Record<string, any> {
  const flatEn = flattenObject(enTranslations);
  const result: Record<string, any> = {};
  
  for (const key of keys) {
    if (!(key in flatEn)) continue;
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = flatEn[key];
  }
  
  return result;
}
