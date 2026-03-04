import React from 'https://esm.sh/react@18.2.0';
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Bar { open: number; high: number; low: number; close: number; }

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toPrecision(5);
  return price.toPrecision(4);
}

function parseBars(detection: any): Bar[] {
  let bars: Bar[] = [];
  try {
    const rawBars = typeof detection.bars === 'string' ? JSON.parse(detection.bars) : detection.bars;
    if (Array.isArray(rawBars)) {
      bars = rawBars.map((b: any) => ({
        open: Number(b.open ?? b.o ?? 0), high: Number(b.high ?? b.h ?? 0),
        low: Number(b.low ?? b.l ?? 0), close: Number(b.close ?? b.c ?? 0),
      }));
    }
  } catch { /* fallback below */ }
  if (bars.length < 3) {
    const mid = detection.entry_price;
    const range = Math.abs(detection.take_profit_price - detection.stop_loss_price) * 0.3;
    bars = Array.from({ length: 20 }, (_, i) => {
      const noise = Math.sin(i * 0.8) * range + (Math.random() - 0.5) * range * 0.5;
      const o = mid + noise, c = o + (Math.random() - 0.5) * range * 0.4;
      return { open: o, high: Math.max(o, c) + Math.random() * range * 0.2, low: Math.min(o, c) - Math.random() * range * 0.2, close: c };
    });
  }
  return bars;
}

function renderChart(detection: any) {
  const bars = parseBars(detection);
  const entry = detection.entry_price;
  const sl = detection.stop_loss_price;
  const tp = detection.take_profit_price;
  const isBullish = detection.direction === 'long' || detection.direction?.toLowerCase() === 'bullish';
  const dirColor = isBullish ? '#22c55e' : '#ef4444';
  const displayInstrument = detection.instrument.replace('-USD', '').replace('=X', '').replace('=F', '');
  const displayPattern = detection.pattern_name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const grade = detection.quality_score?.toUpperCase() ?? '?';
  const rr = Number(detection.risk_reward_ratio).toFixed(1);
  const tf = detection.timeframe?.toUpperCase() ?? '';

  // Chart geometry
  const W = 1200, H = 630;
  const CL = 90, CR = W - 150, CT = 120, CB = H - 100;
  const CW = CR - CL, CH = CB - CT;

  const allP = [...bars.flatMap(b => [b.high, b.low]), entry, sl, tp];
  const pMin = Math.min(...allP) * 0.995, pMax = Math.max(...allP) * 1.005;
  const pRange = pMax - pMin || 1;
  const yFor = (p: number) => CT + (1 - (p - pMin) / pRange) * CH;
  const barSpacing = CW / bars.length;
  const xFor = (i: number) => CL + i * barSpacing + barSpacing / 2;
  const barW = Math.min(Math.max(barSpacing * 0.6, 3), 14);

  const entryY = yFor(entry), tpY = yFor(tp), slY = yFor(sl);

  // Build candle SVG path data for embedding
  const candleElements = bars.map((bar, i) => {
    const x = xFor(i);
    const isGreen = bar.close >= bar.open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    const bodyTop = yFor(Math.max(bar.open, bar.close));
    const bodyBot = yFor(Math.min(bar.open, bar.close));
    const bodyH = Math.max(bodyBot - bodyTop, 1);
    return React.createElement('g', { key: i },
      React.createElement('line', { x1: x, y1: yFor(bar.high), x2: x, y2: yFor(bar.low), stroke: color, strokeWidth: 1.5, opacity: 0.8 }),
      React.createElement('rect', { x: x - barW/2, y: bodyTop, width: barW, height: bodyH, fill: color, rx: 1 })
    );
  });

  // Y-axis labels
  const yLabels = Array.from({length: 6}, (_, i) => {
    const price = pMin + (pRange / 5) * i;
    const y = yFor(price);
    return React.createElement('text', { key: `y${i}`, x: CL - 8, y: y + 4, textAnchor: 'end', fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }, formatPrice(price));
  });

  const levelLine = (price: number, color: string, label: string, dashed: boolean) => {
    const y = yFor(price);
    return React.createElement('g', { key: label },
      React.createElement('line', { x1: CL, y1: y, x2: CR, y2: y, stroke: color, strokeWidth: 1.5, strokeDasharray: dashed ? '6,4' : undefined, opacity: 0.7 }),
      React.createElement('rect', { x: CR + 6, y: y - 13, width: W - CR - 12, height: 26, rx: 4, fill: color, opacity: 0.9 }),
      React.createElement('text', { x: CR + 14, y: y + 5, fill: 'white', fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }, `${label} ${formatPrice(price)}`)
    );
  };

  return React.createElement('div', {
    style: {
      width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)', position: 'relative',
      fontFamily: 'sans-serif', color: 'white',
    }
  },
    // Orange accent bar
    React.createElement('div', { style: { width: '100%', height: '4px', background: 'linear-gradient(90deg, #ff6633, #ff8c00)' }}),
    // Header
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 40px 0' }},
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column' }},
        React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: '12px' }},
          React.createElement('span', { style: { fontSize: 32, fontWeight: 800 }}, displayInstrument),
          React.createElement('span', { style: { fontSize: 20, color: '#64748b' }}, tf),
        ),
        React.createElement('span', { style: { fontSize: 16, color: '#94a3b8', marginTop: 4 }}, displayPattern),
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }},
        React.createElement('div', { style: { background: dirColor + '30', borderRadius: 20, padding: '8px 24px' }},
          React.createElement('span', { style: { color: dirColor, fontSize: 18, fontWeight: 800 }}, isBullish ? '▲ BULLISH' : '▼ BEARISH')
        ),
        React.createElement('div', { style: { display: 'flex', gap: '8px' }},
          React.createElement('div', { style: { background: '#3b82f640', borderRadius: 15, padding: '4px 16px' }},
            React.createElement('span', { style: { color: '#60a5fa', fontSize: 14, fontWeight: 700 }}, grade)
          ),
          React.createElement('div', { style: { background: '#8b5cf640', borderRadius: 15, padding: '4px 16px' }},
            React.createElement('span', { style: { color: '#a78bfa', fontSize: 14, fontWeight: 700 }}, `R:R ${rr}`)
          ),
        ),
      ),
    ),
    // Chart area as SVG
    React.createElement('svg', {
      viewBox: `0 0 ${W} ${H}`,
      width: W, height: H - 120,
      style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }
    },
      // TP/SL zones
      React.createElement('rect', { x: CL, y: Math.min(entryY, tpY), width: CW, height: Math.abs(tpY - entryY), fill: '#22c55e', opacity: 0.06 }),
      React.createElement('rect', { x: CL, y: Math.min(entryY, slY), width: CW, height: Math.abs(slY - entryY), fill: '#ef4444', opacity: 0.06 }),
      // Chart border
      React.createElement('rect', { x: CL, y: CT, width: CW, height: CH, fill: 'none', stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.08, rx: 4 }),
      ...yLabels,
      ...candleElements,
      levelLine(entry, '#3b82f6', 'ENTRY', false),
      levelLine(sl, '#ef4444', 'SL', true),
      levelLine(tp, '#22c55e', 'TP', true),
    ),
    // Footer
    React.createElement('div', {
      style: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 54,
        background: 'rgba(10,14,20,0.9)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 40px',
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16 }},
        React.createElement('span', { style: { color: '#ff6633', fontSize: 18, fontWeight: 800 }}, 'ChartingPath'),
        React.createElement('span', { style: { color: '#64748b', fontSize: 14 }}, 'chartingpath.com'),
      ),
      React.createElement('span', { style: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace' }},
        `Entry: ${formatPrice(entry)} | SL: ${formatPrice(sl)} | TP: ${formatPrice(tp)}`
      ),
    ),
  );
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

    const chartElement = renderChart(detection);
    const imageResponse = new ImageResponse(chartElement, { width: 1200, height: 630 });
    const pngBuffer = new Uint8Array(await imageResponse.arrayBuffer());

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

    console.log(`[generate-share-image] PNG ${pngPath} for ${detection.instrument} (og_edge/satori)`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, token: shareToken, format: 'png' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[generate-share-image] Error:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
