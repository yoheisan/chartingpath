import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * OG Share Edge Function
 * 
 * Serves pre-rendered HTML with OG meta tags for social media crawlers.
 * Human visitors get redirected to the SPA at /s/:token.
 * Bot crawlers (Twitter, Facebook, WhatsApp, LinkedIn, etc.) get
 * server-rendered HTML with og:image, og:title, og:description.
 */

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Extract token from path: /og-share?token=xxx or /og-share/xxx
    const token = url.searchParams.get('token') || url.pathname.split('/').pop();
    const versionParam = url.searchParams.get('v');

    if (!token || token === 'og-share') {
      return new Response('Not found', { status: 404 });
    }

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://chartingpath.com').replace(/\/+$/, '');
    const spaUrl = `${siteUrl}/s/${token}`;

    // Bot crawlers get server-rendered HTML with OG tags
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from('live_pattern_detections')
      .select('instrument, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, updated_at, share_image_url')
      .eq('share_token', token)
      .single();

    if (error || !data) {
      // Redirect to SPA even if not found — let SPA show the error
      return new Response(null, {
        status: 302,
        headers: { 'Location': spaUrl },
      });
    }

    const displaySymbol = data.instrument.replace('-USD', '').replace('=X', '').replace('=F', '');
    const dirLabel = data.direction === 'long' ? '↑ Long' : '↓ Short';
    const title = `${data.pattern_name} on ${displaySymbol} — ${dirLabel}`;
    const description = `Entry: ${data.entry_price} | SL: ${data.stop_loss_price} | TP: ${data.take_profit_price} | R:R 1:${data.risk_reward_ratio?.toFixed(1)} | Quality: ${data.quality_score || 'N/A'}`;
    
    // Prefer pre-generated PNG URL from DB; fallback to token PNG; final fallback to default image.
    // Add version param to force social recrawl on regenerated posts.
    const imageVersion = versionParam || String(Date.parse(data.updated_at ?? '') || Date.now());
    const tokenPngUrl = `${supabaseUrl}/storage/v1/object/public/share-images/${token}.png`;
    const fallbackPngUrl = `${supabaseUrl}/storage/v1/object/public/share-images/default-og.png`;

    const candidateImageUrl = data.share_image_url && data.share_image_url.endsWith('.png')
      ? data.share_image_url
      : tokenPngUrl;

    let ogImageUrl = `${candidateImageUrl}?v=${encodeURIComponent(imageVersion)}`;
    try {
      const imageRes = await fetch(candidateImageUrl, { method: 'HEAD' });
      if (!imageRes.ok) {
        ogImageUrl = `${fallbackPngUrl}?v=${encodeURIComponent(imageVersion)}`;
      }
    } catch {
      ogImageUrl = `${fallbackPngUrl}?v=${encodeURIComponent(imageVersion)}`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)} | ChartingPath</title>
  <meta name="description" content="${escapeHtml(description)}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${escapeHtml(title)}"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta property="og:image" content="${ogImageUrl}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${supabaseUrl}/functions/v1/og-share?token=${encodeURIComponent(token)}${versionParam ? `&v=${encodeURIComponent(versionParam)}` : ''}"/>
  <meta property="og:site_name" content="ChartingPath"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(title)}"/>
  <meta name="twitter:description" content="${escapeHtml(description)}"/>
  <meta name="twitter:image" content="${ogImageUrl}"/>
  <meta name="twitter:site" content="@ChartingPath"/>

  <!-- Redirect human visitors -->
  <meta http-equiv="refresh" content="0;url=${spaUrl}"/>
</head>
<body>
  <p>Redirecting to <a href="${spaUrl}">${escapeHtml(title)}</a>...</p>
  <script>window.location.replace(${JSON.stringify(spaUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[og-share] Error:', err);
    return new Response('Internal error', { status: 500 });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
