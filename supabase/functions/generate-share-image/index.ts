import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import generateImage from "./handler.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache font data across requests
let cachedFont: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  // Use Google Fonts CSS API to get the actual TTF URL, then fetch the binary
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }
  ).then(r => r.text());

  // Extract first TTF/WOFF2 URL from the CSS
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch) throw new Error('Could not find font URL in Google Fonts CSS');

  const fontUrl = urlMatch[1];
  const fontRes = await fetch(fontUrl);
  if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
  cachedFont = await fontRes.arrayBuffer();
  return cachedFont;
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

    // Load font data for Satori
    const fontData = await loadFont();

    // Generate PNG using og_edge (Satori) with explicit font data
    const imageResponse = generateImage(detection, fontData);
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

    console.log(`[generate-share-image] PNG ${pngPath} for ${detection.instrument} (og_edge/satori+inter)`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, token: shareToken, format: 'png' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[generate-share-image] Error:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
