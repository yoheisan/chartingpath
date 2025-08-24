import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files
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
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
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
];