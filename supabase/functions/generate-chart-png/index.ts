import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Chart PNG Generator Edge Function
 * 
 * Generates static PNG screenshots of chart patterns for:
 * - Email alerts
 * - Social media sharing
 * - PDF report generation
 * - OG image previews
 * 
 * Uses a lightweight HTML5 Canvas approach that renders server-side.
 * For full-fidelity screenshots, this would integrate with Playwright.
 * 
 * This is a simplified implementation using SVG-to-PNG conversion.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompressedBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface ChartPNGRequest {
  bars: CompressedBar[];
  overlays: Array<{
    type: 'hline';
    id: string;
    price: number;
    label: string;
    style: 'primary' | 'destructive' | 'positive' | 'muted';
  }>;
  symbol: string;
  timeframe: string;
  patternName: string;
  direction: 'long' | 'short';
  qualityScore: number;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

// Color palette for chart rendering
const COLORS = {
  dark: {
    background: '#0f0f0f',
    text: '#a1a1a1',
    grid: 'rgba(255,255,255,0.05)',
    upCandle: '#22c55e',
    downCandle: '#ef4444',
    primary: '#3b82f6',
    destructive: '#ef4444',
    positive: '#22c55e',
    muted: '#888888',
  },
  light: {
    background: '#ffffff',
    text: '#666666',
    grid: 'rgba(0,0,0,0.05)',
    upCandle: '#22c55e',
    downCandle: '#ef4444',
    primary: '#3b82f6',
    destructive: '#ef4444',
    positive: '#22c55e',
    muted: '#888888',
  }
};

function generateChartSVG(request: ChartPNGRequest): string {
  const {
    bars,
    overlays,
    symbol,
    timeframe,
    patternName,
    direction,
    qualityScore,
    width = 800,
    height = 400,
    theme = 'dark'
  } = request;

  const colors = COLORS[theme];
  const padding = { top: 50, right: 80, bottom: 30, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (bars.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${colors.background}"/>
      <text x="50%" y="50%" text-anchor="middle" fill="${colors.text}" font-family="system-ui">No chart data</text>
    </svg>`;
  }

  // Calculate price range
  const allPrices = bars.flatMap(b => [b.h, b.l]);
  overlays.forEach(o => allPrices.push(o.price));
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;
  const priceRange = maxPrice - minPrice;

  // Map functions
  const priceToY = (price: number): number => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const barWidth = Math.max(2, Math.floor(chartWidth / bars.length) - 1);
  const barToX = (index: number): number => {
    return padding.left + (index / bars.length) * chartWidth;
  };

  // Generate candlesticks
  const candlesticks = bars.map((bar, i) => {
    const x = barToX(i);
    const isUp = bar.c >= bar.o;
    const color = isUp ? colors.upCandle : colors.downCandle;
    
    const highY = priceToY(bar.h);
    const lowY = priceToY(bar.l);
    const openY = priceToY(bar.o);
    const closeY = priceToY(bar.c);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(openY - closeY));
    
    return `
      <line x1="${x + barWidth/2}" y1="${highY}" x2="${x + barWidth/2}" y2="${lowY}" stroke="${color}" stroke-width="1"/>
      <rect x="${x}" y="${bodyTop}" width="${barWidth}" height="${bodyHeight}" fill="${color}"/>
    `;
  }).join('');

  // Generate overlay lines
  const overlayLines = overlays.map(overlay => {
    const y = priceToY(overlay.price);
    const color = colors[overlay.style as keyof typeof colors] || colors.muted;
    
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
            stroke="${color}" stroke-width="1.5" stroke-dasharray="${overlay.id === 'entry' ? '0' : '5,3'}"/>
      <rect x="${width - padding.right + 5}" y="${y - 10}" width="70" height="20" fill="${color}" rx="3"/>
      <text x="${width - padding.right + 40}" y="${y + 4}" text-anchor="middle" fill="white" font-size="11" font-family="system-ui" font-weight="500">
        ${overlay.label}: ${overlay.price.toFixed(2)}
      </text>
    `;
  }).join('');

  // Quality score badge
  const getQualityColor = (score: number): string => {
    if (score >= 8) return colors.positive;
    if (score >= 6) return '#22c55e';
    if (score >= 5) return '#eab308';
    if (score >= 3.5) return '#f97316';
    return colors.destructive;
  };

  const qualityBadge = `
    <rect x="${width - 100}" y="10" width="90" height="35" rx="8" fill="${getQualityColor(qualityScore)}20" stroke="${getQualityColor(qualityScore)}" stroke-width="1.5"/>
    <text x="${width - 55}" y="25" text-anchor="middle" fill="${getQualityColor(qualityScore)}" font-size="10" font-family="system-ui" font-weight="500">
      Quality Score
    </text>
    <text x="${width - 55}" y="40" text-anchor="middle" fill="${getQualityColor(qualityScore)}" font-size="14" font-family="monospace" font-weight="bold">
      ${qualityScore.toFixed(1)}/10
    </text>
  `;

  // Title
  const directionColor = direction === 'long' ? colors.positive : colors.destructive;
  const directionArrow = direction === 'long' ? '↑' : '↓';

  const title = `
    <text x="${padding.left}" y="25" fill="${colors.text}" font-size="14" font-family="system-ui" font-weight="600">
      ${symbol}
    </text>
    <text x="${padding.left}" y="42" fill="${colors.muted}" font-size="11" font-family="system-ui">
      ${patternName} • ${timeframe.toUpperCase()}
    </text>
    <text x="${padding.left + 200}" y="33" fill="${directionColor}" font-size="16" font-family="system-ui" font-weight="bold">
      ${directionArrow} ${direction.toUpperCase()}
    </text>
  `;

  // Watermark
  const watermark = `
    <text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="${colors.muted}" font-size="10" font-family="system-ui" opacity="0.5">
      ChartingPath.com
    </text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${colors.background}"/>
    ${title}
    ${qualityBadge}
    ${candlesticks}
    ${overlayLines}
    ${watermark}
  </svg>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ChartPNGRequest = await req.json();

    console.log(`[ChartPNG] Generating chart for ${requestData.symbol} - ${requestData.patternName}`);

    // Validate input
    if (!requestData.bars || requestData.bars.length === 0) {
      throw new Error('No bar data provided');
    }

    // Generate SVG
    const svg = generateChartSVG(requestData);

    // For now, return SVG directly
    // In production with Playwright, we would:
    // 1. Render the SVG in a headless browser
    // 2. Take a screenshot
    // 3. Return the PNG buffer

    // Check if client wants SVG or base64
    const format = req.headers.get('Accept')?.includes('image/svg+xml') ? 'svg' : 'base64';

    if (format === 'svg') {
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    }

    // Return as base64 encoded data URL
    const base64 = btoa(svg);
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return new Response(JSON.stringify({
      success: true,
      format: 'svg',
      dataUrl,
      width: requestData.width || 800,
      height: requestData.height || 400,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('[ChartPNG] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate chart image',
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
