import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the PNG from the public directory of the deployed site
    // Try multiple URLs
    const urls = [
      'https://chartingpath.lovable.app/images/default-og.png',
      'https://chartingpath.com/images/default-og.png',
      'https://id-preview--c36c7d47-0b2b-4bf9-835b-9393a929a85f.lovable.app/images/default-og.png',
    ];
    let imgRes: Response | null = null;
    for (const u of urls) {
      console.log(`Trying: ${u}`);
      const r = await fetch(u);
      if (r.ok) { imgRes = r; console.log(`Success: ${u}`); break; }
      console.log(`Failed: ${u} -> ${r.status}`);
    }
    if (!imgRes) {
      return new Response(JSON.stringify({ error: 'Could not fetch image from any URL' }), { status: 500 });
    }
    
    const imgBlob = await imgRes.blob();
    console.log(`Fetched image: ${imgBlob.size} bytes, type: ${imgBlob.type}`);

    // Delete existing broken file first
    await supabase.storage.from('share-images').remove(['default-og.png']);

    // Upload with correct content type
    const { error } = await supabase.storage
      .from('share-images')
      .upload('default-og.png', imgBlob, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, size: imgBlob.size }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
