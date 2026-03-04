import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let wasmInitialized = false;
let cachedFont: Uint8Array | null = null;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
  await initWasm(await wasmRes.arrayBuffer());
  wasmInitialized = true;
}

async function loadFont(): Promise<Uint8Array> {
  if (cachedFont) return cachedFont;
  // Fetch Inter TTF from Google Fonts (use mobile UA to get TTF format)
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+' } }
  ).then(r => r.text());
  
  const match = css.match(/url\(([^)]+)\)\s*format\(['"]truetype['"]\)/);
  if (!match) throw new Error('No TTF URL in Google Fonts CSS');
  
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
  cachedFont = new Uint8Array(await fontRes.arrayBuffer());
  console.log(`[generate-share-image] Font loaded: ${cachedFont.byteLength} bytes`);
  return cachedFont;
}

function buildSvg(d: any): string {
  const W = 1200, H = 630;
  const entry = d.entry_price;
  const sl = d.stop_loss_price;
  const tp = d.take_profit_price;
  const isBullish = d.direction === 'long' || d.direction?.toLowerCase() === 'bullish';
  const dirColor = isBullish ? '#22c55e' : '#ef4444';
  const dirLabel = isBullish ? '▲ BULLISH' : '▼ BEARISH';
  const sym = d.instrument.replace('-USD', '').replace('=X', '').replace('=F', '');
  const pat = d.pattern_name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const grade = d.quality_score?.toUpperCase() ?? '?';
  const rr = Number(d.risk_reward_ratio).toFixed(1);
  const tf = d.timeframe?.toUpperCase() ?? '';
  const fp = (p: number) => p >= 1000 ? p.toFixed(2) : p >= 1 ? p.toPrecision(5) : p.toPrecision(4);

  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1419"/>
      <stop offset="100%" stop-color="#1a1f2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff6633"/>
      <stop offset="100%" stop-color="#ff8c00"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- Orange accent bar -->
  <rect width="${W}" height="4" fill="url(#accent)"/>

  <!-- Ticker & Pattern -->
  <text x="40" y="60" font-family="Inter, sans-serif" font-size="48" font-weight="800" fill="white">${esc(sym)}</text>
  <text x="${40 + sym.length * 30}" y="60" font-family="Inter, sans-serif" font-size="22" fill="#64748b">${esc(tf)}</text>
  <text x="40" y="90" font-family="Inter, sans-serif" font-size="20" fill="#94a3b8">${esc(pat)}</text>

  <!-- Direction badge -->
  <rect x="880" y="24" width="280" height="44" rx="22" fill="${dirColor}" opacity="0.2"/>
  <text x="1020" y="54" font-family="Inter, sans-serif" font-size="22" font-weight="800" fill="${dirColor}" text-anchor="middle">${esc(dirLabel)}</text>

  <!-- Grade badge -->
  <rect x="920" y="78" width="70" height="32" rx="16" fill="#3b82f6" opacity="0.25"/>
  <text x="955" y="100" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#60a5fa" text-anchor="middle">${esc(grade)}</text>

  <!-- R:R badge -->
  <rect x="1000" y="78" width="120" height="32" rx="16" fill="#8b5cf6" opacity="0.25"/>
  <text x="1060" y="100" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#a78bfa" text-anchor="middle">R:R ${esc(rr)}</text>

  <!-- TP Level -->
  <rect x="60" y="200" width="${130 + fp(tp).length * 10}" height="40" rx="6" fill="#22c55e"/>
  <text x="75" y="227" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="white">TP ${esc(fp(tp))}</text>
  <line x1="${200 + fp(tp).length * 10}" y1="220" x2="1140" y2="220" stroke="#22c55e" stroke-width="2" stroke-dasharray="8,4" opacity="0.4"/>

  <!-- Entry Level -->
  <rect x="60" y="310" width="${160 + fp(entry).length * 10}" height="40" rx="6" fill="#3b82f6"/>
  <text x="75" y="337" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="white">ENTRY ${esc(fp(entry))}</text>
  <line x1="${230 + fp(entry).length * 10}" y1="330" x2="1140" y2="330" stroke="#3b82f6" stroke-width="2" opacity="0.4"/>

  <!-- SL Level -->
  <rect x="60" y="420" width="${130 + fp(sl).length * 10}" height="40" rx="6" fill="#ef4444"/>
  <text x="75" y="447" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="white">SL ${esc(fp(sl))}</text>
  <line x1="${200 + fp(sl).length * 10}" y1="440" x2="1140" y2="440" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,4" opacity="0.4"/>

  <!-- Footer background -->
  <rect y="576" width="${W}" height="54" fill="rgba(10,14,20,0.95)"/>
  <text x="40" y="610" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#ff6633">ChartingPath</text>
  <text x="200" y="610" font-family="Inter, sans-serif" font-size="14" fill="#64748b">chartingpath.com</text>
  <text x="1160" y="610" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="end">Entry: ${esc(fp(entry))} | SL: ${esc(fp(sl))} | TP: ${esc(fp(tp))}</text>
</svg>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { token, pattern_id } = await req.json();
    if (!token && !pattern_id) {
      return new Response(JSON.stringify({ error: 'token or pattern_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let query = supabase.from('live_pattern_detections').select('*');
    if (token) query = query.eq('share_token', token);
    else query = query.eq('id', pattern_id);

    const { data: detection, error } = await query.single();
    if (error || !detection) {
      return new Response(JSON.stringify({ error: 'Detection not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const shareToken = detection.share_token || token;
    if (!shareToken) {
      return new Response(JSON.stringify({ error: 'No share token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load WASM + font in parallel
    const [_, fontData] = await Promise.all([ensureWasm(), loadFont()]);

    // Build SVG string and render to PNG via resvg-wasm with font buffers
    const svg = buildSvg(detection);
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        fontBuffers: [fontData],
        loadSystemFonts: false,
        defaultFontFamily: 'Inter',
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    const pngPath = `${shareToken}.png`;
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

    const { error: uploadErr } = await supabase.storage
      .from('share-images')
      .upload(pngPath, pngBlob, { contentType: 'image/png', upsert: true });

    if (uploadErr) { console.error('[generate-share-image] Upload error:', uploadErr); throw uploadErr; }

    const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/share-images/${pngPath}`;

    await supabase.from('live_pattern_detections')
      .update({ share_image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', detection.id);

    console.log(`[generate-share-image] Success: ${pngPath} for ${detection.instrument} (svg+resvg+fontBuffers)`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, token: shareToken, format: 'png' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[generate-share-image] Error:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
