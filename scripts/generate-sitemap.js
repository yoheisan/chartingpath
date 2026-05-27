const SUPABASE_URL = "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";

const BASE_URL = "https://chartingpath.com";

const STATIC_ROUTES = [
  // Core pages
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/learn", priority: "0.9", changefreq: "daily" },
  { path: "/community", priority: "0.7", changefreq: "daily" },

  // Live data pages
  { path: "/patterns/live", priority: "0.9", changefreq: "hourly" },
  { path: "/tools/agent-scoring", priority: "0.8", changefreq: "hourly" },

  // Pattern education
  { path: "/chart-patterns/library", priority: "0.8", changefreq: "weekly" },
  { path: "/chart-patterns/generator", priority: "0.7", changefreq: "monthly" },
  { path: "/chart-patterns/strategies", priority: "0.7", changefreq: "weekly" },
  { path: "/chart-patterns/quiz", priority: "0.7", changefreq: "weekly" },

  // Quizzes
  { path: "/quiz/pattern-identification", priority: "0.6", changefreq: "monthly" },
  { path: "/quiz/trading-knowledge", priority: "0.6", changefreq: "monthly" },
  { path: "/quiz/stock-market", priority: "0.6", changefreq: "monthly" },
  { path: "/quiz/forex", priority: "0.6", changefreq: "monthly" },
  { path: "/quiz/crypto", priority: "0.6", changefreq: "monthly" },
  { path: "/quiz/commodities", priority: "0.6", changefreq: "monthly" },

  // Tools
  { path: "/tools/pip-calculator", priority: "0.7", changefreq: "monthly" },
  { path: "/tools/risk-calculator", priority: "0.7", changefreq: "monthly" },
  { path: "/tools/market-breadth", priority: "0.7", changefreq: "daily" },
  { path: "/tools/economic-calendar", priority: "0.7", changefreq: "daily" },
  { path: "/tools/paper-trading", priority: "0.6", changefreq: "monthly" },

  // Projects / Pattern Lab
  { path: "/projects/pattern-lab/new", priority: "0.8", changefreq: "weekly" },
  { path: "/projects/pattern-lab/audit", priority: "0.7", changefreq: "weekly" },
  { path: "/projects/pricing", priority: "0.6", changefreq: "monthly" },

  // Edge Atlas & Stats
  { path: "/edge-atlas", priority: "0.8", changefreq: "daily" },
  { path: "/patterns/stats", priority: "0.9", changefreq: "daily" },

  // Feature pages
  { path: "/features/trading-copilot", priority: "0.6", changefreq: "monthly" },

  // Legal / support
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/support", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
];

// Pattern statistics pages — high-value SEO landing pages
const PATTERN_IDS = [
  "ascending-triangle",
  "descending-triangle",
  "double-bottom",
  "double-top",
  "triple-bottom",
  "triple-top",
  "head-and-shoulders",
  "inverse-head-and-shoulders",
  "bull-flag",
  "bear-flag",
  "rising-wedge",
  "falling-wedge",
  "cup-and-handle",
  "donchian-breakout-long",
  "donchian-breakout-short",
];

// Programmatic SEO — 15 patterns × 5 asset classes × 5 timeframes = 375 pages
const STAT_ASSET_CLASSES = ["forex", "crypto", "stocks", "commodities", "indices"];
const STAT_TIMEFRAMES = ["1h", "4h", "8h", "1d", "1wk"];

async function fetchSupabase(table, columns, filters = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", columns);
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, String(val));
    }
  }
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    console.error(`Failed to fetch ${table}:`, res.status, await res.text());
    return [];
  }
  return res.json();
}

async function generateSitemap() {
  const today = new Date().toISOString().split("T")[0];

  // Fetch published articles
  const articles = await fetchSupabase(
    "learning_articles",
    "slug,published_at,updated_at",
    { status: "eq.published", order: "published_at.desc.nullslast" }
  );

  // Fetch instrument+pattern combos from the materialized view
  const instrumentStats = await fetchSupabase(
    "instrument_pattern_stats_mv",
    "pattern_id,symbol",
    { total_trades: "gte.10" }
  );

  // Fetch all active instruments for /instruments/:symbol pages
  const allInstruments = await fetchSupabase(
    "instruments",
    "symbol",
    { is_active: "eq.true" }
  );

  // Deduplicate instrument+pattern pairs
  const instrumentPairs = new Set();
  if (Array.isArray(instrumentStats)) {
    for (const row of instrumentStats) {
      instrumentPairs.add(`${row.pattern_id}|${row.symbol}`);
    }
  }

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

  // Instrument+pattern pages
  for (const pair of instrumentPairs) {
    const [patternId, symbol] = pair.split("|");
    xml += `  <url>
    <loc>${BASE_URL}/patterns/${patternId}/${encodeURIComponent(symbol)}/statistics</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  // Individual instrument pages
  if (Array.isArray(allInstruments)) {
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
  if (Array.isArray(articles)) {
    for (const article of articles) {
      const lastmod = (article.updated_at || article.published_at || today).split("T")[0];
      xml += `  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  xml += `</urlset>\n`;

  // Write to public/sitemap.xml
  const { writeFileSync } = await import("fs");
  const { resolve } = await import("path");
  writeFileSync(resolve("public/sitemap.xml"), xml);

  const totalUrls =
    STATIC_ROUTES.length +
    PATTERN_IDS.length +
    PATTERN_IDS.length * STAT_ASSET_CLASSES.length * STAT_TIMEFRAMES.length +
    instrumentPairs.size +
    (Array.isArray(allInstruments) ? allInstruments.length : 0) +
    (Array.isArray(articles) ? articles.length : 0);

  console.log(`sitemap.xml written with ${totalUrls} URLs`);
}

generateSitemap().catch((err) => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
