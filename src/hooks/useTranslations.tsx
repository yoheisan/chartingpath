import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

export const useTranslations = (namespace = 'translation') => {
  const { i18n } = useTranslation();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTranslations = async (language: string) => {
    try {
      setLoading(true);
      console.log('Loading translations for language:', language);
      const { data, error } = await supabase.functions.invoke('manage-translations', {
        body: {
          action: 'get_translations',
          language,
          namespace
        }
      });

      if (error) throw error;
      
      console.log('Loaded translations:', data);
      setTranslations(data || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load translations');
      console.error('Translation loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if i18n is ready before loading translations
    if (i18n.isInitialized) {
      loadTranslations(i18n.language);
    } else {
      // Wait for i18n to be initialized
      const checkInitialized = () => {
        if (i18n.isInitialized) {
          loadTranslations(i18n.language);
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    }

    // Listen for language changes using the store if available
    const handleLanguageChanged = (lng: string) => {
      loadTranslations(lng);
    };

    // Check if the event system is available
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChanged);
    }

    return () => {
      if (i18n && typeof i18n.off === 'function') {
        i18n.off('languageChanged', handleLanguageChanged);
      }
    };
  }, [namespace]);

  const t = (key: string, fallback?: string) => {
    const result = translations[key] || fallback || key;
    console.log(`Translation for "${key}":`, result, 'Available translations:', Object.keys(translations));
    return result;
  };

  return { t, loading, error, translations };
};