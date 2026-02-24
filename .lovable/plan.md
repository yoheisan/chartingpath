

# SEO and AI Discoverability Strategy

## Overview
Implement four high-impact changes to help ChartingPath rank in search engines and get cited by AI assistants (ChatGPT, Perplexity, Claude). Currently the site has no sitemap, no structured data, no `llms.txt`, and limited per-page meta tags.

## Changes

### 1. Dynamic Sitemap Edge Function
Create a `sitemap` edge function that generates `sitemap.xml` on the fly by querying published `learning_articles` and combining with static routes.

**File:** `supabase/functions/sitemap/index.ts`

- Query `learning_articles` for all published slugs
- Combine with static routes (`/`, `/learn`, `/patterns/live`, `/chart-patterns/library`, `/chart-patterns/quiz`, `/tools/*`, `/pricing`, `/about`, `/blog/:slug`)
- Return valid XML sitemap with `<lastmod>` dates from article `published_at`
- Set `Content-Type: application/xml`
- No JWT required

**File:** `supabase/config.toml` -- add `[functions.sitemap]` with `verify_jwt = false`

### 2. Update robots.txt
**File:** `public/robots.txt`

- Add `Sitemap: https://chartingpath.com/sitemap.xml` (pointing to edge function URL proxied or direct)
- Explicitly allow AI crawlers: `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`
- Block admin routes: `Disallow: /admin/`

### 3. Add llms.txt
**File:** `public/llms.txt`

Create a structured plain-text file following the emerging `llms.txt` standard that describes ChartingPath to AI crawlers:
- Platform description and capabilities
- Key content areas (Edge Atlas, Pattern Screener, Pattern Lab, Learning articles)
- Unique data assets (320K+ historical pattern occurrences with outcomes)
- Links to key pages

### 4. JSON-LD Structured Data Component
**File:** `src/components/JsonLd.tsx`

Create a reusable component that injects JSON-LD `<script>` tags into the page head.

Schemas to implement:
- **Homepage:** `WebApplication` + `Organization` schema
- **Blog articles:** `Article` schema with `author`, `datePublished`, `description`
- **Quiz pages:** `Quiz` / `LearningResource` schema

**Integration points:**
- `src/pages/Index.tsx` -- add `WebApplication` JSON-LD
- `src/pages/blog/DynamicArticle.tsx` -- add `Article` JSON-LD using existing `seo_title`, `seo_description`, `published_at` fields
- `src/pages/blog/DynamicArticle.tsx` -- also enhance existing meta tag injection to include `og:type`, `og:url`, canonical link

### 5. Per-Page Meta Tags Enhancement
**File:** `src/components/PageMeta.tsx`

Create a lightweight component that dynamically updates `document.title`, meta description, OG tags, and canonical URL. Use it across key pages:

- `Index.tsx` -- homepage meta
- `DynamicArticle.tsx` -- already partially done, enhance with canonical + og:url
- `LivePatternsPage` -- screener-specific meta
- `PatternLibraryPage` -- library-specific meta

## Technical Details

### Sitemap Edge Function
```text
GET /functions/v1/sitemap -> XML sitemap

Static routes hardcoded + dynamic articles from:
  SELECT slug, published_at FROM learning_articles WHERE status = 'published'

Response: application/xml with proper XML declaration
Cache-Control: public, max-age=3600
```

### robots.txt updates
```text
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot  
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth

Sitemap: https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/sitemap
```

### JSON-LD example for articles
```text
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.seo_title,
  "description": article.seo_description,
  "datePublished": article.published_at,
  "publisher": { "@type": "Organization", "name": "ChartingPath" },
  "mainEntityOfPage": canonical URL
}
```

### llms.txt structure
```text
# ChartingPath
> Pattern-based trading signal discovery, research, and automation platform.

## Key Features
- Live Pattern Screener: 1,100+ instruments scanned for active chart patterns
- Edge Atlas: Historical win rates and expectancy for pattern+timeframe combinations
- Pattern Lab: Backtest any pattern on any ticker with historical data
- Learning Center: Educational articles on chart patterns and technical analysis

## Data
- 320,000+ historical pattern occurrences with verified outcomes
- Patterns based on Thomas Bulkowski's Encyclopedia of Chart Patterns

## Links
- Homepage: https://chartingpath.com
- Screener: https://chartingpath.com/patterns/live
- Learn: https://chartingpath.com/learn
- Pattern Library: https://chartingpath.com/chart-patterns/library
```

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/sitemap/index.ts` |
| Create | `src/components/JsonLd.tsx` |
| Create | `src/components/PageMeta.tsx` |
| Create | `public/llms.txt` |
| Edit   | `public/robots.txt` |
| Edit   | `supabase/config.toml` |
| Edit   | `src/pages/Index.tsx` |
| Edit   | `src/pages/blog/DynamicArticle.tsx` |

## Impact
- Sitemap lets Google and Bing discover all article pages (currently invisible to crawlers)
- JSON-LD enables rich snippets in search results (article cards, knowledge panels)
- `llms.txt` makes the platform discoverable and citable by AI assistants
- Per-page meta tags ensure each page has unique, relevant titles and descriptions for search results

