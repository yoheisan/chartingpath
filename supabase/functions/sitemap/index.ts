import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://chartingpath.com';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/learn', priority: '0.9', changefreq: 'daily' },
  { path: '/patterns/live', priority: '0.9', changefreq: 'hourly' },
  { path: '/chart-patterns/library', priority: '0.8', changefreq: 'weekly' },
  { path: '/chart-patterns/quiz', priority: '0.7', changefreq: 'weekly' },
  { path: '/pattern-lab', priority: '0.8', changefreq: 'weekly' },
  { path: '/tools/edge-atlas', priority: '0.8', changefreq: 'daily' },
  { path: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
];

// Pattern statistics pages — high-value SEO landing pages
const PATTERN_IDS = [
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle',
  'double-bottom', 'double-top', 'triple-bottom', 'triple-top',
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'bull-flag', 'bear-flag', 'rising-wedge', 'falling-wedge',
  'cup-and-handle', 'inverse-cup-and-handle',
  'donchian-breakout-long', 'donchian-breakout-short',
];

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

    // Instrument+pattern statistics pages (long-tail SEO)
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

    // Dynamic article routes
    if (articles) {
      for (const article of articles) {
        const lastmod = (article.updated_at || article.published_at || today).split('T')[0];
        xml += `  <url>
    <loc>${BASE_URL}/learn/${article.slug}</loc>
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
