import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Step 1: Upload SVG to storage
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0f0f0f"/>
  <text x="600" y="280" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="700">ChartingPath</text>
  <text x="600" y="340" text-anchor="middle" fill="#888888" font-family="system-ui,-apple-system,sans-serif" font-size="24">AI-Powered Chart Pattern Scanner</text>
  <line x1="400" y1="380" x2="800" y2="380" stroke="#3b82f6" stroke-width="2" opacity="0.5"/>
  <text x="600" y="580" text-anchor="middle" fill="#555555" font-family="system-ui,-apple-system,sans-serif" font-size="16">chartingpath.com</text>
</svg>`;

    const svgBytes = new TextEncoder().encode(svg);
    await supabase.storage.from('share-images').remove(['_temp-og.svg']);
    await supabase.storage.from('share-images').upload('_temp-og.svg', svgBytes.buffer, {
      contentType: 'image/svg+xml',
      cacheControl: '60',
      upsert: true,
    });

    // Step 2: Convert SVG→PNG via weserv.nl using the public storage URL
    const svgUrl = `${supabaseUrl}/storage/v1/object/public/share-images/_temp-og.svg`;
    const pngConvertUrl = `https://images.weserv.nl/?url=${encodeURIComponent(svgUrl)}&w=1200&h=630&output=png`;
    
    console.log(`Converting: ${pngConvertUrl}`);
    const pngRes = await fetch(pngConvertUrl);
    console.log(`weserv status: ${pngRes.status}, content-type: ${pngRes.headers.get('content-type')}`);
    
    if (!pngRes.ok) {
      const body = await pngRes.text();
      return new Response(JSON.stringify({ error: `weserv failed: ${pngRes.status}`, body }), { status: 500 });
    }

    const pngBuffer = await pngRes.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    const isPng = pngBytes[0] === 137 && pngBytes[1] === 80 && pngBytes[2] === 78 && pngBytes[3] === 71;
    console.log(`PNG: ${pngBytes.length} bytes, valid: ${isPng}`);

    if (!isPng) {
      return new Response(JSON.stringify({ error: 'Not valid PNG', first: Array.from(pngBytes.slice(0, 10)) }), { status: 500 });
    }

    // Step 3: Upload PNG
    await supabase.storage.from('share-images').remove(['default-og.png']);
    const { error } = await supabase.storage.from('share-images').upload('default-og.png', pngBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: true,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Cleanup temp SVG
    await supabase.storage.from('share-images').remove(['_temp-og.svg']);

    return new Response(JSON.stringify({ success: true, size: pngBytes.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
