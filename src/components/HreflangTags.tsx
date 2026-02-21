import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { languages } from '@/i18n/config';

/**
 * Dynamically injects hreflang <link> tags into <head> for SEO.
 * Also updates the <html lang=""> attribute.
 */
const HreflangTags = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Update html lang attribute
    document.documentElement.lang = i18n.language;

    // Set dir attribute for RTL languages
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

    // Clean up old hreflang tags
    document.querySelectorAll('link[data-hreflang]').forEach(el => el.remove());

    const baseUrl = 'https://chartingpath.com';
    const path = location.pathname;

    // Add hreflang for each supported language
    languages.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang.code;
      link.href = `${baseUrl}${path}${lang.code !== 'en' ? `?lang=${lang.code}` : ''}`;
      link.setAttribute('data-hreflang', 'true');
      document.head.appendChild(link);
    });

    // x-default
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = `${baseUrl}${path}`;
    xDefault.setAttribute('data-hreflang', 'true');
    document.head.appendChild(xDefault);

    return () => {
      document.querySelectorAll('link[data-hreflang]').forEach(el => el.remove());
    };
  }, [i18n.language, location.pathname]);

  return null;
};

export default HreflangTags;
