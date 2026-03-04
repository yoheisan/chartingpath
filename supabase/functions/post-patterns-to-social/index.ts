import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";
import { render } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_DAILY_POSTS = 3;

const SESSIONS = [
  { name: 'tokyo',   start: 0,  end: 9  },
  { name: 'london',  start: 7,  end: 16 },
  { name: 'newyork', start: 13, end: 22 },
];

const ALLOWED_GRADES = ['A', 'B'];

const ASSET_EMOJI: Record<string, string> = {
  stocks: '📈', etf: '📊', forex: '💱', fx: '💱',
  crypto: '🪙', commodities: '🛢️', indices: '🌐',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCurrentSession(hourUtc: number): string {
  if (hourUtc >= 13 && hourUtc < 22) return 'newyork';
  if (hourUtc >= 7  && hourUtc < 16) return 'london';
  if (hourUtc >= 0  && hourUtc < 9)  return 'tokyo';
  return 'offhours';
}

function formatPatternName(raw: string): string {
  return raw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function directionEmoji(direction: string): string {
  return direction?.toLowerCase() === 'bullish' ? '🟢' : '🔴';
}

function buildTweet(pattern: any): string {
  const emoji = ASSET_EMOJI[pattern.asset_type?.toLowerCase()] ?? '📉';
  const dir = directionEmoji(pattern.direction);
  const patternName = formatPatternName(pattern.pattern_name);
  const grade = pattern.quality_score?.toUpperCase() ?? '?';
  const tf = pattern.timeframe?.toUpperCase() ?? '';
  const rr = Number(pattern.risk_reward_ratio).toFixed(1);
  const entry = Number(pattern.entry_price).toPrecision(5);
  const sl = Number(pattern.stop_loss_price).toPrecision(5);
  const tp = Number(pattern.take_profit_price).toPrecision(5);

  return (
    `${emoji} ${dir} ${patternName} — ${pattern.instrument} (${tf})\n\n` +
    `Grade: ${grade} | R:R ${rr}:1\n` +
    `Entry: ${entry} | SL: ${sl} | TP: ${tp}\n\n` +
    `Free alerts at chartingpath.com`
  ).slice(0, 280);
}

/** Build a consolidated tweet for multiple patterns sharing the same trade levels */
function buildConsolidatedTweet(group: any[]): string {
  const first = group[0];
  const emoji = ASSET_EMOJI[first.asset_type?.toLowerCase()] ?? '📉';
  const dir = directionEmoji(first.direction);
  const tf = first.timeframe?.toUpperCase() ?? '';
  const grade = first.quality_score?.toUpperCase() ?? '?';
  const rr = Number(first.risk_reward_ratio).toFixed(1);
  const entry = Number(first.entry_price).toPrecision(5);
  const sl = Number(first.stop_loss_price).toPrecision(5);
  const tp = Number(first.take_profit_price).toPrecision(5);

  const patternNames = group.map((p: any) => formatPatternName(p.pattern_name)).join(' + ');

  return (
    `${emoji} ${dir} ${patternNames} — ${first.instrument} (${tf})\n\n` +
    `Grade: ${grade} | R:R ${rr}:1\n` +
    `Entry: ${entry} | SL: ${sl} | TP: ${tp}\n\n` +
    `Free alerts at chartingpath.com`
  ).slice(0, 280);
}

/** Group patterns by instrument + entry/SL/TP key */
function groupByTradeLevels(patterns: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const p of patterns) {
    const key = `${p.instrument}|${Number(p.entry_price).toPrecision(5)}|${Number(p.stop_loss_price).toPrecision(5)}|${Number(p.take_profit_price).toPrecision(5)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return groups;
}

// ─── Chart SVG Generation ───────────────────────────────────────────────────

function generateChartSVG(bars: any[], visualSpec: any, symbol: string, timeframe: string, patternName: string, direction: string, qualityScore: string): string {
  const width = 800, height = 400;
  const colors = {
    background: '#0f0f0f', text: '#a1a1a1', upCandle: '#22c55e', downCandle: '#ef4444',
    primary: '#3b82f6', destructive: '#ef4444', positive: '#22c55e', muted: '#888888',
    detection: '#f97316', formationZone: '#38bdf8',
  };
  const padding = { top: 50, right: 80, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const overlays = visualSpec?.overlays || [];

  if (!bars || bars.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${colors.background}"/><text x="50%" y="50%" text-anchor="middle" fill="${colors.text}" font-family="monospace">No chart data</text></svg>`;
  }

  // Build timestamp-to-index map for precise positioning
  const tsIndex = new Map<string, number>();
  bars.forEach((b: any, i: number) => tsIndex.set(b.t, i));

  const allPrices = bars.flatMap((b: any) => [b.h, b.l]);
  overlays.forEach((o: any) => { if (o.price) allPrices.push(o.price); });
  const minP = Math.min(...allPrices) * 0.995;
  const maxP = Math.max(...allPrices) * 1.005;
  const range = maxP - minP;
  const priceToY = (p: number) => padding.top + chartH - ((p - minP) / range) * chartH;
  const barW = Math.max(2, Math.floor(chartW / bars.length) - 1);
  const barToX = (i: number) => padding.left + (i / bars.length) * chartW;

  // ── 1. Formation zone shading (teal, semi-transparent) ──────────────
  let formationZone = '';
  if (visualSpec?.window?.startTs) {
    const startIdx = tsIndex.get(visualSpec.window.startTs) ?? 0;
    const endIdx = visualSpec.entryBarIndex ?? (tsIndex.get(visualSpec.signalTs) ?? bars.length - 1);
    const x1 = barToX(startIdx);
    const x2 = barToX(Math.min(endIdx, bars.length - 1)) + barW;
    formationZone = `<rect x="${x1}" y="${padding.top}" width="${x2 - x1}" height="${chartH}" fill="${colors.formationZone}" opacity="0.07"/>`;
  }

  // ── 2. Candlesticks ─────────────────────────────────────────────────
  const candles = bars.map((bar: any, i: number) => {
    const x = barToX(i);
    const isUp = bar.c >= bar.o;
    const color = isUp ? colors.upCandle : colors.downCandle;
    const bodyTop = Math.min(priceToY(bar.o), priceToY(bar.c));
    const bodyH = Math.max(1, Math.abs(priceToY(bar.o) - priceToY(bar.c)));
    return `<line x1="${x+barW/2}" y1="${priceToY(bar.h)}" x2="${x+barW/2}" y2="${priceToY(bar.l)}" stroke="${color}" stroke-width="1"/><rect x="${x}" y="${bodyTop}" width="${barW}" height="${bodyH}" fill="${color}"/>`;
  }).join('');

  // ── 3. Horizontal overlay lines (Entry, SL, TP) ─────────────────────
  const hlines = overlays.filter((o: any) => o.type === 'hline').map((o: any) => {
    const y = priceToY(o.price);
    const c = (colors as any)[o.style] || colors.muted;
    const dash = o.id === 'entry' ? '0' : '5,3';
    return `<line x1="${padding.left}" y1="${y}" x2="${width-padding.right}" y2="${y}" stroke="${c}" stroke-width="1.5" stroke-dasharray="${dash}"/><rect x="${width-padding.right+5}" y="${y-10}" width="70" height="20" fill="${c}" rx="3"/><text x="${width-padding.right+40}" y="${y+4}" text-anchor="middle" fill="white" font-size="11" font-family="monospace" font-weight="500">${o.label}: ${o.price.toFixed(2)}</text>`;
  }).join('');

  // ── 4. ZigZag polyline from pivot overlays ──────────────────────────
  let zigzagLine = '';
  const pivotOverlay = overlays.find((o: any) => o.type === 'pivot');
  const pivots = pivotOverlay?.pivots || visualSpec?.pivots || [];
  if (pivots.length >= 2) {
    const points = pivots.map((pv: any) => {
      const idx = pv.index ?? tsIndex.get(pv.timestamp) ?? 0;
      const x = barToX(idx) + barW / 2;
      const y = priceToY(pv.price);
      return `${x},${y}`;
    }).join(' ');
    zigzagLine = `<polyline points="${points}" fill="none" stroke="${colors.muted}" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.7"/>`;

    // Pivot labels (H1, L1, H2, etc.)
    zigzagLine += pivots.map((pv: any) => {
      const idx = pv.index ?? tsIndex.get(pv.timestamp) ?? 0;
      const x = barToX(idx) + barW / 2;
      const y = priceToY(pv.price);
      const labelY = pv.type === 'high' ? y - 8 : y + 14;
      const label = pv.label || (pv.type === 'high' ? 'H' : 'L');
      return `<text x="${x}" y="${labelY}" text-anchor="middle" fill="${colors.muted}" font-size="9" font-family="monospace">${label}</text>`;
    }).join('');
  }

  // ── 5. Entry triangle marker (blue) ─────────────────────────────────
  let entryMarker = '';
  const entryIdx = visualSpec?.entryBarIndex;
  const entryPrice = visualSpec?.entryPrice;
  if (entryIdx != null && entryPrice != null && entryIdx < bars.length) {
    const x = barToX(entryIdx) + barW / 2;
    const y = priceToY(entryPrice);
    const isLong = direction === 'long';
    // Triangle: pointing up for long, down for short
    const triSize = 8;
    const tri = isLong
      ? `${x},${y - triSize} ${x - triSize},${y + triSize} ${x + triSize},${y + triSize}`
      : `${x},${y + triSize} ${x - triSize},${y - triSize} ${x + triSize},${y - triSize}`;
    entryMarker = `<polygon points="${tri}" fill="${colors.primary}" stroke="${colors.primary}" stroke-width="1"/>`;
  }

  // ── 6. Detection arrow (orange) ─────────────────────────────────────
  let detectionMarker = '';
  if (visualSpec?.signalTs) {
    const sigIdx = tsIndex.get(visualSpec.signalTs);
    if (sigIdx != null && sigIdx < bars.length) {
      const sigBar = bars[sigIdx];
      const x = barToX(sigIdx) + barW / 2;
      const isLong = direction === 'long';
      const anchorPrice = isLong ? sigBar.l : sigBar.h;
      const y = priceToY(anchorPrice);
      const arrowY = isLong ? y + 15 : y - 15;
      const arrowHead = isLong ? '↑' : '↓';
      detectionMarker = `<text x="${x}" y="${arrowY}" text-anchor="middle" fill="${colors.detection}" font-size="14" font-family="monospace" font-weight="bold">${arrowHead}</text>`;
    }
  }

  const dirColor = direction === 'long' ? colors.positive : colors.destructive;
  const dirArrow = direction === 'long' ? '↑' : '↓';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${colors.background}"/>
    <text x="${padding.left}" y="25" fill="${colors.text}" font-size="14" font-family="monospace" font-weight="600">${symbol}</text>
    <text x="${padding.left}" y="42" fill="${colors.muted}" font-size="11" font-family="monospace">${patternName} • ${timeframe.toUpperCase()}</text>
    <text x="${padding.left+200}" y="33" fill="${dirColor}" font-size="16" font-family="monospace" font-weight="bold">${dirArrow} ${direction.toUpperCase()}</text>
    <rect x="${width-100}" y="10" width="90" height="35" rx="8" fill="${colors.positive}20" stroke="${colors.positive}" stroke-width="1.5"/>
    <text x="${width-55}" y="25" text-anchor="middle" fill="${colors.positive}" font-size="10" font-family="monospace" font-weight="500">Grade</text>
    <text x="${width-55}" y="40" text-anchor="middle" fill="${colors.positive}" font-size="14" font-family="monospace" font-weight="bold">${qualityScore}</text>
    ${formationZone}
    ${candles}
    ${hlines}
    ${zigzagLine}
    ${entryMarker}
    ${detectionMarker}
    <text x="${width/2}" y="${height-10}" text-anchor="middle" fill="${colors.muted}" font-size="10" font-family="monospace" opacity="0.5">ChartingPath.com</text>
  </svg>`;
}

// ─── PNG Generation ─────────────────────────────────────────────────────────

async function generateChartPNG(bars: any[], visualSpec: any, symbol: string, timeframe: string, patternName: string, direction: string, qualityScore: string): Promise<Uint8Array> {
  const svg = generateChartSVG(bars, visualSpec, symbol, timeframe, patternName, direction, qualityScore);
  console.log(`[pattern-poster] Generated SVG for ${symbol} (${svg.length} bytes)`);
  const pngData = await render(svg);
  console.log(`[pattern-poster] Converted to PNG (${pngData.length} bytes)`);
  return pngData;
}

// ─── Twitter OAuth ──────────────────────────────────────────────────────────

function generateOAuthSignature(
  method: string, url: string, params: Record<string, string>,
  consumerSecret: string, tokenSecret: string
): string {
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&')
  )}`;
  const key = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return createHmac('sha1', key).update(base).digest('base64');
}

function generateOAuthHeader(method: string, url: string): string {
  const apiKey = Deno.env.get('TWITTER_API_KEY')!;
  const apiSecret = Deno.env.get('TWITTER_API_SECRET')!;
  const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN')!;
  const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')!;

  const params = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  const sig = generateOAuthSignature(method, url, params, apiSecret, accessTokenSecret);
  return 'OAuth ' + Object.entries({ ...params, oauth_signature: sig })
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');
}

// ─── Twitter Media Upload ───────────────────────────────────────────────────

async function uploadMediaToTwitter(pngData: Uint8Array): Promise<string> {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';

  // Convert PNG to base64
  const base64Data = btoa(String.fromCharCode(...pngData));

  // Build multipart form
  const boundary = '----TwitterMediaBoundary' + Math.random().toString(36).substring(2);
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="media_data"',
    '',
    base64Data,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: generateOAuthHeader('POST', url),
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const responseText = await res.text();
  if (!res.ok) {
    console.error(`[pattern-poster] Media upload failed: ${res.status} ${responseText}`);
    throw new Error(`Twitter media upload ${res.status}: ${responseText}`);
  }

  const mediaResponse = JSON.parse(responseText);
  const mediaId = mediaResponse.media_id_string;
  console.log(`[pattern-poster] 📸 Media uploaded: ${mediaId}`);
  return mediaId;
}

async function postToTwitter(text: string, mediaId?: string): Promise<{ id: string }> {
  const url = 'https://api.x.com/2/tweets';
  const payload: any = { text };
  if (mediaId) {
    payload.media = { media_ids: [mediaId] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: generateOAuthHeader('POST', url),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();

  if (res.status === 429) throw new RateLimitError(body);
  if (!res.ok) throw new Error(`Twitter ${res.status}: ${body}`);
  return JSON.parse(body).data;
}

class RateLimitError extends Error {
  constructor(body: string) {
    super(`Twitter 429: ${body}`);
    this.name = 'RateLimitError';
  }
}

// ─── Budget check ───────────────────────────────────────────────────────────

async function checkAndIncrementBudget(supabase: any, platform: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  // Upsert today's row
  const { data, error } = await supabase
    .from('social_post_budget')
    .upsert(
      { platform, post_date: today, post_count: 0, max_posts: MAX_DAILY_POSTS },
      { onConflict: 'platform,post_date', ignoreDuplicates: true }
    )
    .select()
    .single();

  // Ensure max_posts is always synced to current constant
  await supabase
    .from('social_post_budget')
    .update({ max_posts: MAX_DAILY_POSTS })
    .eq('platform', platform)
    .eq('post_date', today);

  // Re-fetch to get actual count (upsert with ignoreDuplicates won't return existing row reliably)
  const { data: budget } = await supabase
    .from('social_post_budget')
    .select('post_count, max_posts')
    .eq('platform', platform)
    .eq('post_date', today)
    .single();

  if (!budget) return true; // If no row, allow (first post)

  if (budget.post_count >= budget.max_posts) {
    console.warn(`[pattern-poster] ⛔ Daily budget exhausted: ${budget.post_count}/${budget.max_posts}`);
    return false;
  }

  // Increment
  await supabase
    .from('social_post_budget')
    .update({ post_count: budget.post_count + 1, updated_at: new Date().toISOString() })
    .eq('platform', platform)
    .eq('post_date', today);

  console.log(`[pattern-poster] 📊 Budget: ${budget.post_count + 1}/${budget.max_posts}`);
  return true;
}

// ─── Ensure share token ──────────────────────────────────────────────────────

async function ensureShareToken(supabase: any, patternId: string): Promise<string> {
  const { data } = await supabase
    .from('live_pattern_detections')
    .select('share_token')
    .eq('id', patternId)
    .single();

  if (data?.share_token) return data.share_token;

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  await supabase
    .from('live_pattern_detections')
    .update({ share_token: token })
    .eq('id', patternId);

  return token;
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const nowUtc = new Date();
    const hourUtc = nowUtc.getUTCHours();
    const session = getCurrentSession(hourUtc);
    console.log(`[pattern-poster] Running at ${nowUtc.toISOString()} — session: ${session}`);

    // ── Budget check ──────────────────────────────────────────────────────
    const withinBudget = await checkAndIncrementBudget(supabase, 'twitter');
    if (!withinBudget) {
      return new Response(JSON.stringify({ posted: 0, reason: 'daily_budget_exhausted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Find already-posted pattern IDs ───────────────────────────────────
    const sessionStart = new Date(nowUtc);
    const sessionDef = SESSIONS.find(s => s.name === session);
    if (sessionDef) {
      sessionStart.setUTCHours(sessionDef.start, 0, 0, 0);
      if (sessionStart > nowUtc) sessionStart.setDate(sessionStart.getDate() - 1);
    } else {
      sessionStart.setTime(nowUtc.getTime() - 3 * 60 * 60 * 1000);
    }

    const { data: recentPosts } = await supabase
      .from('post_history')
      .select('pattern_id')
      .eq('post_type', 'pattern_alert')
      .gte('posted_at', sessionStart.toISOString());

    const postedPatternIds = new Set((recentPosts ?? []).map((p: any) => p.pattern_id).filter(Boolean));

    // ── Fetch A/B grade active patterns ───────────────────────────────────
    const { data: patterns, error: pErr } = await supabase
      .from('live_pattern_detections')
      .select('id, pattern_name, instrument, asset_type, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, share_token, share_image_url, status, trend_alignment, bars, visual_spec')
      .in('quality_score', ALLOWED_GRADES)
      .in('status', ['active', 'pending'])
      .order('last_confirmed_at', { ascending: false })
      .limit(100);

    if (pErr) throw pErr;

    if (!patterns || patterns.length === 0) {
      console.log('[pattern-poster] No A/B grade patterns available');
      return new Response(JSON.stringify({ posted: 0, reason: 'no_patterns' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter for contextually-aligned patterns only:
    // Bullish setups should be with_trend or neutral (not counter_trend)
    // Bearish setups should be with_trend or neutral (not counter_trend)
    // Patterns without trend data are excluded to maintain quality
    const contextFiltered = patterns.filter((p: any) => {
      const alignment = p.trend_alignment?.toLowerCase();
      if (!alignment) {
        console.log(`[pattern-poster] Skipping ${p.instrument} ${p.pattern_name} — no trend data`);
        return false;
      }
      if (alignment === 'counter_trend') {
        console.log(`[pattern-poster] Skipping ${p.instrument} ${p.pattern_name} — counter-trend`);
        return false;
      }
      return true; // 'with_trend' or 'neutral'/'sideways'
    });

    console.log(`[pattern-poster] ${patterns.length} A/B patterns → ${contextFiltered.length} after trend filter`);

    // Prefer patterns WITH images, then without
    const unposted = contextFiltered.filter((p: any) => !postedPatternIds.has(p.id));

    // Consolidate patterns with identical instrument + trade levels into one tweet
    const groups = groupByTradeLevels(unposted);
    console.log(`[pattern-poster] ${unposted.length} unposted patterns → ${groups.size} unique trade-level groups`);

    // Pick the best group to post (highest grade, then best R:R)
    let bestGroup: any[] | null = null;
    let bestScore = -1;
    for (const group of groups.values()) {
      const first = group[0];
      const gradeScore = first.quality_score === 'A' ? 2 : 1;
      const rrScore = Number(first.risk_reward_ratio) || 0;
      const score = gradeScore * 10 + rrScore;
      if (score > bestScore) {
        bestScore = score;
        bestGroup = group;
      }
    }

    const toPost = bestGroup ? [bestGroup] : [];

    // ── Get active Twitter account ────────────────────────────────────────
    const { data: accounts } = await supabase
      .from('social_media_accounts')
      .select('id, platform, account_name')
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .limit(1);

    const twitterAccount = accounts?.[0];
    if (!twitterAccount) {
      console.warn('[pattern-poster] No active Twitter account found');
      return new Response(JSON.stringify({ posted: 0, reason: 'no_twitter_account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Post ──────────────────────────────────────────────────────────────
    const results: any[] = [];

    for (const group of toPost) {
      const primary = group[0];
      try {
        const token = await ensureShareToken(supabase, primary.id);
        const shareUrl = `https://chartingpath.com/s/${token}`;
        const tweet = group.length > 1
          ? buildConsolidatedTweet(group)
          : buildTweet(primary);

        const patternNames = group.map((p: any) => p.pattern_name).join(' + ');
        console.log(`[pattern-poster] Posting: ${primary.instrument} [${patternNames}] (${primary.quality_score}) — ${group.length} pattern(s) consolidated`);

        // ── Generate chart image ────────────────────────────────────────
        let mediaId: string | undefined;
        try {
          const bars = primary.bars || [];
          const overlays = primary.visual_spec?.overlays || [];
          const dir = primary.direction?.toLowerCase() === 'bullish' ? 'long' : 'short';

          if (bars.length > 0) {
            const pngData = await generateChartPNG(
              bars, overlays, primary.instrument, primary.timeframe,
              formatPatternName(primary.pattern_name), dir, primary.quality_score || '?'
            );

            // Upload to Supabase Storage
            const fileName = `social/${primary.id}-${Date.now()}.png`;
            const { error: uploadErr } = await supabase.storage
              .from('share-images')
              .upload(fileName, pngData, { contentType: 'image/png', upsert: true });

            if (uploadErr) {
              console.warn(`[pattern-poster] Storage upload failed: ${uploadErr.message}`);
            } else {
              // Update share_image_url on the pattern
              const { data: urlData } = supabase.storage.from('share-images').getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                await supabase.from('live_pattern_detections')
                  .update({ share_image_url: urlData.publicUrl })
                  .eq('id', primary.id);
              }
            }

            // Upload to Twitter
            mediaId = await uploadMediaToTwitter(pngData);
            console.log(`[pattern-poster] 📸 Chart image attached: ${mediaId}`);
          } else {
            console.log(`[pattern-poster] No bar data for ${primary.instrument} — posting text-only`);
          }
        } catch (imgErr: any) {
          console.warn(`[pattern-poster] ⚠️ Image generation failed, posting text-only: ${imgErr.message}`);
        }

        const twitterResponse = await postToTwitter(tweet, mediaId);

        // Record post_history for ALL patterns in the group to prevent re-posting
        for (const p of group) {
          await supabase.from('post_history').insert({
            account_id: twitterAccount.id,
            platform: 'twitter',
            post_type: 'pattern_alert',
            content: tweet,
            link_back_url: shareUrl,
            platform_post_id: twitterResponse?.id,
            platform_response: twitterResponse,
            pattern_id: p.id,
            session_window: session,
            posted_at: nowUtc.toISOString(),
          });
        }

        results.push({
          pattern_ids: group.map((p: any) => p.id),
          instrument: primary.instrument,
          tweet_id: twitterResponse?.id,
          consolidated: group.length,
          has_image: !!mediaId,
        });
        console.log(`[pattern-poster] ✅ Posted ${primary.instrument} — tweet ${twitterResponse?.id} — ${group.length} signal(s) — image: ${!!mediaId}`);

      } catch (err: any) {
        if (err.name === 'RateLimitError') {
          console.warn('[pattern-poster] ⏳ Rate limited — will retry next invocation');
          results.push({ pattern_id: primary.id, instrument: primary.instrument, error: 'rate_limited' });
          break;
        }
        console.error(`[pattern-poster] ❌ Failed to post ${primary.instrument}:`, err.message);
        results.push({ pattern_id: primary.id, instrument: primary.instrument, error: err.message });
      }
    }

    console.log(`[pattern-poster] Done — posted ${results.filter(r => !r.error).length}/${toPost.length}`);

    return new Response(
      JSON.stringify({ posted: results.filter(r => !r.error).length, results, session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[pattern-poster] Fatal error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
