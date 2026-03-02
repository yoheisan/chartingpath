import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const url = 'https://id-preview--c36c7d47-0b2b-4bf9-835b-9393a929a85f.lovable.app/images/og-upload.png';
    console.log(`Fetching: ${url}`);
    const r = await fetch(url);
    console.log(`Status: ${r.status}, Content-Type: ${r.headers.get('content-type')}`);
    
    // Get raw bytes regardless of what content-type the server reports
    const arrayBuf = await r.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    console.log(`Got ${bytes.length} bytes, first 4: ${bytes[0]} ${bytes[1]} ${bytes[2]} ${bytes[3]}`);
    
    // Verify PNG magic bytes: 137 80 78 71
    const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    console.log(`Is PNG: ${isPng}`);
    
    if (!isPng) {
      return new Response(JSON.stringify({ error: 'Not a valid PNG file', firstBytes: Array.from(bytes.slice(0, 20)) }), { status: 400 });
    }

    // Delete then re-upload to force content type
    await supabase.storage.from('share-images').remove(['default-og.png']);
    
    const { error } = await supabase.storage
      .from('share-images')
      .upload('default-og.png', bytes.buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, size: bytes.length, isPng }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
