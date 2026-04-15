import { useEffect } from "react";

type JsonLdData = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdData;
}

const SCRIPT_ID_PREFIX = 'jsonld-';

/**
 * Injects a JSON-LD <script> tag into <head>.
 * Automatically adds @context if not present.
 */
export function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    const jsonLd = { '@context': 'https://schema.org', ...data };
    const id = `${SCRIPT_ID_PREFIX}${(data['@type'] as string || 'default').toLowerCase()}`;

    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [data]);

  return null;
}

// Pre-built schema helpers

export function WebApplicationJsonLd() {
  return (
    <>
      <JsonLd data={{
        '@type': 'WebApplication',
        name: 'ChartingPath',
        url: 'https://chartingpath.com',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        description: 'Pattern-based trading signal discovery, research, and automation platform. Scan 1,100+ instruments for chart patterns, backtest with 320K+ historical occurrences.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '0',
          highPrice: '49',
          offerCount: '3',
        },
        featureList: [
          'Live pattern screener across 1,100+ instruments',
          'Edge Atlas with historical win rates and expectancy',
          'Pattern Lab backtesting engine',
          'AI Trading Copilot',
          'Pine Script and MQL code export',
        ],
      }} />
      <JsonLd data={{
        '@type': 'Organization',
        name: 'ChartingPath',
        url: 'https://chartingpath.com',
        logo: 'https://chartingpath.com/lovable-uploads/580e72d2-457e-4e16-8d46-2a0bd9299238.png',
        sameAs: ['https://x.com/ChartingPath'],
        founder: {
          '@type': 'Person',
          name: 'Yohei',
          jobTitle: 'Founder',
        },
        description: 'Chart pattern detection platform with proven outcome data. Real win rates from live pattern tracking across FX and US equities.',
      }} />
      <JsonLd data={{
        '@type': 'WebSite',
        name: 'ChartingPath',
        url: 'https://chartingpath.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://chartingpath.com/patterns/live?search={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }} />
    </>
  );
}

export function FAQJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <JsonLd data={{
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }} />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd data={{
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }} />
  );
}

export function ArticleJsonLd({
  headline,
  description,
  datePublished,
  dateModified,
  slug,
  imageUrl,
}: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  slug: string;
  imageUrl?: string;
}) {
  return (
    <JsonLd data={{
      '@type': 'Article',
      headline,
      description,
      datePublished,
      ...(dateModified && { dateModified }),
      ...(imageUrl && { image: imageUrl }),
      author: { '@type': 'Organization', name: 'ChartingPath' },
      publisher: {
        '@type': 'Organization',
        name: 'ChartingPath',
        logo: {
          '@type': 'ImageObject',
          url: 'https://chartingpath.com/lovable-uploads/580e72d2-457e-4e16-8d46-2a0bd9299238.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://chartingpath.com/learn/${slug}`,
      },
    }} />
  );
}
