import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = 'https://chartingpath.com';

/**
 * Lightweight component that dynamically updates document.title,
 * meta description, OG tags, and canonical URL.
 */
const DEFAULT_OG_IMAGE = 'https://chartingpath.com/images/default-og.png';

export function PageMeta({ title, description, canonicalPath, ogType = 'website', ogImage, jsonLd }: PageMetaProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper to set or create a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (selector.startsWith('meta[property')) {
          const m = selector.match(/property="([^"]+)"/);
          el.setAttribute('property', m ? m[1] : '');
        } else if (selector.startsWith('meta[name')) {
          const m = selector.match(/name="([^"]+)"/);
          el.setAttribute('name', m ? m[1] : '');
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);

    const resolvedImage = ogImage || DEFAULT_OG_IMAGE;
    setMeta('meta[property="og:image"]', 'content', resolvedImage);
    setMeta('meta[name="twitter:image"]', 'content', resolvedImage);

    // Canonical URL
    if (canonicalPath) {
      const canonicalUrl = `${BASE_URL}${canonicalPath}`;
      setMeta('meta[property="og:url"]', 'content', canonicalUrl);
      
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // JSON-LD structured data
    if (jsonLd) {
      const scriptId = 'page-meta-jsonld';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      const script = document.getElementById('page-meta-jsonld');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, canonicalPath, ogType, ogImage, jsonLd]);

  return null;
}
