import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { missingKeyCollector } from './missingKeyCollector';

// Static JSON files serve as BUILD-TIME fallback.
// At runtime, the DB loader (dbTranslationLoader.ts) overlays
// the canonical translations from Supabase on top of these.
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import ptTranslations from './locales/pt.json';
import frTranslations from './locales/fr.json';
import zhTranslations from './locales/zh.json';
import deTranslations from './locales/de.json';
import hiTranslations from './locales/hi.json';
import idTranslations from './locales/id.json';
import itTranslations from './locales/it.json';
import jaTranslations from './locales/ja.json';
import ruTranslations from './locales/ru.json';
import arTranslations from './locales/ar.json';
import afTranslations from './locales/af.json';
import koTranslations from './locales/ko.json';
import trTranslations from './locales/tr.json';
import nlTranslations from './locales/nl.json';
import plTranslations from './locales/pl.json';
import viTranslations from './locales/vi.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  pt: { translation: ptTranslations },
  fr: { translation: frTranslations },
  zh: { translation: zhTranslations },
  de: { translation: deTranslations },
  hi: { translation: hiTranslations },
  id: { translation: idTranslations },
  it: { translation: itTranslations },
  ja: { translation: jaTranslations },
  ru: { translation: ruTranslations },
  ar: { translation: arTranslations },
  af: { translation: afTranslations },
  ko: { translation: koTranslations },
  tr: { translation: trTranslations },
  nl: { translation: nlTranslations },
  pl: { translation: plTranslations },
  vi: { translation: viTranslations },
};

const SUPPORTED_LANGS = Object.keys(resources);
const LANG_STORAGE_KEY = 'cp_language';

/**
 * Resolve initial language:
 * 1. localStorage (user previously chose a language)
 * 2. Browser locale (navigator.language) mapped to supported codes
 * 3. Fallback to 'en'
 */
function detectInitialLanguage(): string {
  // 1. Check localStorage for a previously saved choice
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage unavailable (SSR / privacy mode)
  }

  // 2. Browser locale detection (geo-based)
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGS.includes(browserLang)) {
      return browserLang;
    }
  }

  // 3. Fallback
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    // Re-render components when resource bundles are added (DB overlay)
    react: {
      bindI18n: 'languageChanged loaded added',
      bindI18nStore: 'added removed',
    },
    saveMissing: true,
    missingKeyHandler: missingKeyCollector.handler,
  });

// Load ONLY the current language from DB at startup (not all 14).
// Other languages load on-demand when user switches.
import('./dbTranslationLoader').then(({ loadCurrentLanguageFromDB, loadLanguageFromDB }) => {
  loadCurrentLanguageFromDB().catch(err => {
    console.warn('[i18n] DB translation overlay failed, using static fallback:', err);
  });

  // Lazy-load translations when user switches language
  i18n.on('languageChanged', (lng: string) => {
    loadLanguageFromDB(lng).catch(err => {
      console.warn(`[i18n] Failed to load ${lng} from DB:`, err);
    });
  });
});

export default i18n;

// Language options for G20 countries
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];