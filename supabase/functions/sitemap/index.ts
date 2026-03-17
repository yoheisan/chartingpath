import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://chartingpath.com';

const STATIC_ROUTES = [
  // Core pages
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/learn', priority: '0.9', changefreq: 'daily' },
  { path: '/community', priority: '0.7', changefreq: 'daily' },

  // Live data pages
  { path: '/patterns/live', priority: '0.9', changefreq: 'hourly' },
  { path: '/tools/agent-scoring', priority: '0.8', changefreq: 'hourly' },

  // Pattern education
  { path: '/chart-patterns/library', priority: '0.8', changefreq: 'weekly' },
  { path: '/chart-patterns/generator', priority: '0.7', changefreq: 'monthly' },
  { path: '/chart-patterns/strategies', priority: '0.7', changefreq: 'weekly' },
  { path: '/chart-patterns/quiz', priority: '0.7', changefreq: 'weekly' },

  // Quizzes
  { path: '/quiz/pattern-identification', priority: '0.6', changefreq: 'monthly' },
  { path: '/quiz/trading-knowledge', priority: '0.6', changefreq: 'monthly' },
  { path: '/quiz/stock-market', priority: '0.6', changefreq: 'monthly' },
  { path: '/quiz/forex', priority: '0.6', changefreq: 'monthly' },
  { path: '/quiz/crypto', priority: '0.6', changefreq: 'monthly' },
  { path: '/quiz/commodities', priority: '0.6', changefreq: 'monthly' },

  // Tools
  { path: '/tools/pip-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/tools/risk-calculator', priority: '0.7', changefreq: 'monthly' },
  { path: '/tools/market-breadth', priority: '0.7', changefreq: 'daily' },
  { path: '/tools/economic-calendar', priority: '0.7', changefreq: 'daily' },
  { path: '/tools/paper-trading', priority: '0.6', changefreq: 'monthly' },

  // Projects / Pattern Lab
  { path: '/projects/pattern-lab/new', priority: '0.8', changefreq: 'weekly' },
  { path: '/projects/pattern-lab/audit', priority: '0.7', changefreq: 'weekly' },
  { path: '/projects/pricing', priority: '0.6', changefreq: 'monthly' },

  // Edge Atlas & Stats
  { path: '/edge-atlas', priority: '0.8', changefreq: 'daily' },
  { path: '/patterns/stats', priority: '0.9', changefreq: 'daily' },

  // Feature pages
  { path: '/features/trading-copilot', priority: '0.6', changefreq: 'monthly' },

  // Legal / support
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/support', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

// Pattern statistics pages — high-value SEO landing pages
const PATTERN_IDS = [
  'ascending-triangle', 'descending-triangle',
  'double-bottom', 'double-top', 'triple-bottom', 'triple-top',
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'bull-flag', 'bear-flag', 'rising-wedge', 'falling-wedge',
  'cup-and-handle',
  'donchian-breakout-long', 'donchian-breakout-short',
];

// Programmatic SEO — 15 patterns × 5 asset classes × 5 timeframes = 375 pages
const STAT_ASSET_CLASSES = ['forex', 'crypto', 'stocks', 'commodities', 'indices'];
const STAT_TIMEFRAMES = ['1h', '4h', '8h', '1d', '1wk'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch published articles
    const { data: articles, error } = await supabase
      .from('learning_articles')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
    }

    // Fetch instrument+pattern combos from the materialized view
    const { data: instrumentStats, error: mvError } = await supabase
      .from('instrument_pattern_stats_mv')
      .select('pattern_id, symbol')
      .gte('total_trades', 10);

    if (mvError) {
      console.error('Error fetching instrument pattern stats:', mvError);
    }

    // Deduplicate instrument+pattern pairs (view may have multiple timeframe rows)
    const instrumentPairs = new Set<string>();
    if (instrumentStats) {
      for (const row of instrumentStats) {
        instrumentPairs.add(`${row.pattern_id}|${row.symbol}`);
      }
    }

    // Fetch all active instruments for /instruments/:symbol pages
    const { data: allInstruments, error: instrError } = await supabase
      .from('instruments')
      .select('symbol')
      .eq('is_active', true);

    if (instrError) {
      console.error('Error fetching instruments:', instrError);
    }

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static routes
    for (const route of STATIC_ROUTES) {
      xml += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
    }

    // Pattern statistics pages (global)
    for (const pid of PATTERN_IDS) {
      xml += `  <url>
    <loc>${BASE_URL}/patterns/${pid}/statistics</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Programmatic pattern stats pages (375+ long-tail SEO pages)
    for (const pid of PATTERN_IDS) {
      for (const ac of STAT_ASSET_CLASSES) {
        for (const tf of STAT_TIMEFRAMES) {
          xml += `  <url>
    <loc>${BASE_URL}/patterns/stats/${pid}/${ac}/${tf}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      }
    }

    for (const pair of instrumentPairs) {
      const [patternId, symbol] = pair.split('|');
      xml += `  <url>
    <loc>${BASE_URL}/patterns/${patternId}/${symbol}/statistics</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    // Individual instrument pages
    if (allInstruments) {
      for (const inst of allInstruments) {
        xml += `  <url>
    <loc>${BASE_URL}/instruments/${encodeURIComponent(inst.symbol)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // Dynamic article routes
    if (articles) {
      for (const article of articles) {
        const lastmod = (article.updated_at || article.published_at || today).split('T')[0];
        xml += `  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Sitemap error:', err);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});
