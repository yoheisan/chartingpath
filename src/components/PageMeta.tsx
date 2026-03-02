import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: string;
  ogImage?: string;
}

const BASE_URL = 'https://chartingpath.com';

/**
 * Lightweight component that dynamically updates document.title,
 * meta description, OG tags, and canonical URL.
 */
const DEFAULT_OG_IMAGE = 'https://dgznlsckoamseqcpzfqm.supabase.co/storage/v1/object/public/share-images/default-og.png';

export function PageMeta({ title, description, canonicalPath, ogType = 'website', ogImage }: PageMetaProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper to set or create a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        // Determine if property or name based attribute
        if (selector.startsWith('meta[property')) {
          el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.startsWith('meta[name')) {
          el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
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

    if (ogImage) {
      setMeta('meta[property="og:image"]', 'content', ogImage);
      setMeta('meta[name="twitter:image"]', 'content', ogImage);
    }

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
  }, [title, description, canonicalPath, ogType, ogImage]);

  return null;
}
