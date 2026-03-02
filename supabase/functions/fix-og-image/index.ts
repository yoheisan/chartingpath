import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * Creates a branded OG image by generating an SVG and converting it
 * to PNG via an external service, then uploading to Supabase storage.
 */
serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Create a branded SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f0f0f"/>
  <text x="600" y="280" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="700">ChartingPath</text>
  <text x="600" y="340" text-anchor="middle" fill="#888888" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400">AI-Powered Chart Pattern Scanner &amp; Backtester</text>
  <line x1="400" y1="380" x2="800" y2="380" stroke="#3b82f6" stroke-width="2" opacity="0.5"/>
  <text x="600" y="580" text-anchor="middle" fill="#555555" font-family="system-ui, -apple-system, sans-serif" font-size="16">chartingpath.com</text>
</svg>`;

    // Convert SVG to PNG using images.weserv.nl (already used in the project)
    const svgBase64 = encodeBase64(new TextEncoder().encode(svg));
    const pngUrl = `https://images.weserv.nl/?url=data:image/svg+xml;base64,${svgBase64}&w=1200&h=630&output=png`;
    
    console.log('Converting SVG to PNG via weserv.nl...');
    const pngRes = await fetch(pngUrl);
    
    if (!pngRes.ok) {
      // Fallback: try another SVG-to-PNG service
      console.log(`weserv.nl failed (${pngRes.status}), trying direct SVG upload...`);
      
      // Upload SVG version as fallback (works for most platforms except Twitter)
      const svgBytes = new TextEncoder().encode(svg);
      await supabase.storage.from('share-images').remove(['default-og.png']);
      const { error: svgErr } = await supabase.storage
        .from('share-images')
        .upload('default-og.svg', svgBytes.buffer, {
          contentType: 'image/svg+xml',
          cacheControl: '31536000',
          upsert: true,
        });
      
      if (svgErr) {
        return new Response(JSON.stringify({ error: svgErr.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true, format: 'svg-fallback' }));
    }

    const pngBuffer = await pngRes.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    console.log(`PNG: ${pngBytes.length} bytes, first 4: ${pngBytes[0]} ${pngBytes[1]} ${pngBytes[2]} ${pngBytes[3]}`);

    // Verify PNG magic bytes
    const isPng = pngBytes[0] === 137 && pngBytes[1] === 80 && pngBytes[2] === 78 && pngBytes[3] === 71;
    if (!isPng) {
      return new Response(JSON.stringify({ error: 'Conversion did not produce valid PNG' }), { status: 500 });
    }

    // Delete existing and upload
    await supabase.storage.from('share-images').remove(['default-og.png']);
    
    const { error } = await supabase.storage
      .from('share-images')
      .upload('default-og.png', pngBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, size: pngBytes.length, isPng, format: 'png' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
