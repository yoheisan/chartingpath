import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Chart SVG Generator (inlined to keep single-file edge function) ──────────

interface CompressedBar {
  t: string; o: number; h: number; l: number; c: number; v: number;
}

const COLORS = {
  background: '#0f0f0f',
  text: '#a1a1a1',
  muted: '#888888',
  grid: 'rgba(255,255,255,0.05)',
  upCandle: '#22c55e',
  downCandle: '#ef4444',
  primary: '#3b82f6',
  destructive: '#ef4444',
  positive: '#22c55e',
  amber: '#f59e0b',
};

function generateShareChartSVG(
  bars: CompressedBar[],
  symbol: string,
  patternName: string,
  direction: string,
  entry: number,
  stopLoss: number,
  takeProfit: number,
  qualityScore: string | null,
): string {
  const width = 1200;
  const height = 630; // OG image standard
  const padding = { top: 60, right: 100, bottom: 40, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!bars || bars.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${COLORS.background}"/>
      <text x="50%" y="50%" text-anchor="middle" fill="${COLORS.text}" font-family="system-ui" font-size="24">No chart data</text>
    </svg>`;
  }

  // Price range including trade levels
  const allPrices = bars.flatMap(b => [b.h, b.l]);
  allPrices.push(entry, stopLoss, takeProfit);
  const minPrice = Math.min(...allPrices) * 0.998;
  const maxPrice = Math.max(...allPrices) * 1.002;
  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number) =>
    padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const barW = Math.max(3, Math.floor(chartWidth / bars.length) - 1);
  const barToX = (i: number) => padding.left + (i / bars.length) * chartWidth;

  // Candlesticks
  const candles = bars.map((bar, i) => {
    const x = barToX(i);
    const isUp = bar.c >= bar.o;
    const color = isUp ? COLORS.upCandle : COLORS.downCandle;
    const highY = priceToY(bar.h);
    const lowY = priceToY(bar.l);
    const openY = priceToY(bar.o);
    const closeY = priceToY(bar.c);
    const bodyTop = Math.min(openY, closeY);
    const bodyH = Math.max(1, Math.abs(openY - closeY));
    return `<line x1="${x + barW / 2}" y1="${highY}" x2="${x + barW / 2}" y2="${lowY}" stroke="${color}" stroke-width="1"/>
<rect x="${x}" y="${bodyTop}" width="${barW}" height="${bodyH}" fill="${color}"/>`;
  }).join('\n');

  // Trade level lines
  const tradeLevels = [
    { price: entry, color: COLORS.amber, label: 'Entry', dash: '0' },
    { price: stopLoss, color: COLORS.destructive, label: 'SL', dash: '6,4' },
    { price: takeProfit, color: COLORS.positive, label: 'TP', dash: '6,4' },
  ].map(({ price, color, label, dash }) => {
    const y = priceToY(price);
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${dash}" opacity="0.8"/>
<rect x="${width - padding.right + 5}" y="${y - 12}" width="85" height="24" fill="${color}" rx="4" opacity="0.9"/>
<text x="${width - padding.right + 47}" y="${y + 4}" text-anchor="middle" fill="white" font-size="12" font-family="system-ui, sans-serif" font-weight="600">${label} ${price.toFixed(price >= 100 ? 0 : price >= 1 ? 2 : 4)}</text>`;
  }).join('\n');

  // Header
  const dirColor = direction === 'long' ? COLORS.positive : COLORS.destructive;
  const dirArrow = direction === 'long' ? '↑' : '↓';
  const displaySymbol = symbol.replace('=X', '').replace('=F', '').replace('-USD', '');
  const rr = Math.abs((takeProfit - entry) / (entry - stopLoss));

  const header = `
<text x="${padding.left + 10}" y="30" fill="white" font-size="22" font-family="system-ui, sans-serif" font-weight="700">${displaySymbol}</text>
<text x="${padding.left + 10}" y="52" fill="${COLORS.muted}" font-size="14" font-family="system-ui, sans-serif">${patternName}</text>
<text x="${padding.left + 300}" y="40" fill="${dirColor}" font-size="18" font-family="system-ui, sans-serif" font-weight="700">${dirArrow} ${direction.toUpperCase()}</text>
<text x="${padding.left + 450}" y="40" fill="${COLORS.muted}" font-size="14" font-family="system-ui, sans-serif">R:R 1:${rr.toFixed(1)}</text>`;

  // Quality badge
  let qualityBadge = '';
  if (qualityScore) {
    const score = parseFloat(qualityScore);
    const qColor = score >= 7 ? COLORS.positive : score >= 5 ? '#eab308' : COLORS.destructive;
    qualityBadge = `
<rect x="${width - 130}" y="12" width="110" height="40" rx="10" fill="${qColor}20" stroke="${qColor}" stroke-width="1.5"/>
<text x="${width - 75}" y="30" text-anchor="middle" fill="${qColor}" font-size="10" font-family="system-ui, sans-serif" font-weight="500">Quality</text>
<text x="${width - 75}" y="46" text-anchor="middle" fill="${qColor}" font-size="16" font-family="monospace" font-weight="bold">${score.toFixed(1)}/10</text>`;
  }

  // Watermark
  const watermark = `<text x="${width / 2}" y="${height - 12}" text-anchor="middle" fill="${COLORS.muted}" font-size="13" font-family="system-ui, sans-serif" opacity="0.6">ChartingPath.com</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="${COLORS.background}"/>
${header}
${qualityBadge}
${candles}
${tradeLevels}
${watermark}
</svg>`;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Pattern ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch pattern with all needed fields
    const { data: existing, error: fetchErr } = await supabase
      .from('live_pattern_detections')
      .select('share_token, instrument, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, quality_score, bars')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return new Response(JSON.stringify({ error: 'Pattern not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return existing token if already shared (image already generated)
    if (existing.share_token) {
      return new Response(JSON.stringify({
        success: true,
        shareToken: existing.share_token,
        instrument: existing.instrument,
        patternName: existing.pattern_name,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a short, URL-friendly token
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    const { error: updateErr } = await supabase
      .from('live_pattern_detections')
      .update({ share_token: token })
      .eq('id', id);

    if (updateErr) {
      console.error('[share-pattern] Update error:', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to generate share link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate chart SVG and upload to storage (non-blocking — don't fail sharing if this errors)
    try {
      const svg = generateShareChartSVG(
        existing.bars as CompressedBar[],
        existing.instrument,
        existing.pattern_name,
        existing.direction,
        existing.entry_price,
        existing.stop_loss_price,
        existing.take_profit_price,
        existing.quality_score,
      );

      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const filePath = `${token}.svg`;

      const { error: uploadErr } = await supabase.storage
        .from('share-images')
        .upload(filePath, svgBlob, {
          contentType: 'image/svg+xml',
          cacheControl: '86400',
          upsert: true,
        });

      if (uploadErr) {
        console.error('[share-pattern] Image upload error:', uploadErr);
      } else {
        console.log(`[share-pattern] Chart image uploaded: share-images/${filePath}`);
      }
    } catch (imgErr) {
      console.error('[share-pattern] Image generation error:', imgErr);
    }

    console.log(`[share-pattern] Created token ${token} for ${existing.instrument} - ${existing.pattern_name}`);

    return new Response(JSON.stringify({
      success: true,
      shareToken: token,
      instrument: existing.instrument,
      patternName: existing.pattern_name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[share-pattern] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
