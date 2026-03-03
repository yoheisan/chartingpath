import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map timezone to region key (must match get-cached-market-report)
function getRegion(tz: string): string {
  if (tz.includes('Tokyo') || tz.includes('Hong_Kong') || tz.includes('Singapore') || tz.includes('Shanghai')) return 'Asia';
  if (tz.includes('London') || tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) return 'Europe';
  if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Toronto')) return 'Americas';
  if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'Australia';
  return tz;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, timezone, markets, tone, linkBackUrl, timeSpan } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const region = getRegion(timezone || 'America/New_York');

    // Try cached report using REGION key (matching how get-cached-market-report stores them)
    const { data: latestReport, error: reportError } = await supabaseClient
      .from('cached_market_reports')
      .select('report, generated_at')
      .eq('timezone', region)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let report: string;

    if (latestReport?.report) {
      const ageMinutes = Math.round((Date.now() - new Date(latestReport.generated_at).getTime()) / 60000);
      console.log(`Using cached report for region ${region} (age: ${ageMinutes}min, length: ${latestReport.report.length})`);
      report = latestReport.report;
    } else {
      // No cached report, generate fresh one
      console.log(`No cached report for region ${region}, generating new one...`);
      const { data: newReport, error: generateError } = await supabaseClient.functions.invoke('get-cached-market-report', {
        body: { 
          timezone: timezone || 'America/New_York',
          markets: markets || ['stocks', 'forex', 'crypto', 'commodities'],
          timeSpan: timeSpan || 'previous_day',
          tone: tone || 'professional',
          forceGenerate: true 
        }
      });

      if (generateError || !newReport?.report) {
        console.error('Could not generate market report:', generateError);
        throw new Error('Could not fetch or generate market report');
      }
      report = newReport.report;
    }

    // Validate report has real data (not all zeros)
    if (report.includes('$0 (') || report.includes('$0.00') || report.match(/\b0\s*\(0\.?0*%\)/)) {
      console.warn('WARNING: Report appears to contain zero-value data, may indicate data fetch failure');
    }

    const link = 'chartingpath.com';

    const teaserPrompt = reportType === 'pre_market'
      ? `Create a compelling PRE-MARKET social media post (max 240 characters) from this market report. 
      
      CRITICAL REQUIREMENTS:
      - Eye-catching emoji at start (🔥📊💹⚡️📈)
      - ONE key market level or percentage move with specific numbers
      - Brief actionable insight or pattern alert
      - MUST end with: "Full Analysis + Free Scripts → ${link} 🚀"
      - If any price is $0 or 0%, SKIP that instrument entirely — do NOT mention it
      
      Format: [Emoji] [Specific Move/Level] - [Brief insight]. Full Analysis + Free Scripts → ${link} 🚀
      
      Example: 🔥 S&P 500 testing 5,200 resistance - Double top forming on 4H. Full Analysis + Free Scripts → ${link} 🚀`
      : `Create a compelling POST-MARKET social media post (max 240 characters) from this market report.
      
      CRITICAL REQUIREMENTS:
      - Eye-catching emoji at start (📊✅❌💰📉📈)
      - Closing level with exact change percentage
      - Key pattern confirmation or market insight
      - MUST end with: "Full Analysis + Free Scripts → ${link} 🚀"
      - If any price is $0 or 0% or NaN, SKIP that instrument entirely — do NOT mention it
      
      Format: [Emoji] [Market closed at X, +/- Y%] - [Key takeaway]. Full Analysis + Free Scripts → ${link} 🚀
      
      Example: ✅ S&P closed at 5,195 (+0.8%) - Bullish engulfing confirmed. Full Analysis + Free Scripts → ${link} 🚀`;

    console.log('Generating social teaser with Gemini...');
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are an expert financial social media content creator. Your posts ALWAYS include specific market data (exact prices, percentages, levels) and ALWAYS end with the provided link. Never skip the call-to-action link. Focus on actionable insights that traders can use immediately.\n\nIMPORTANT: If any instrument shows a price of $0 or 0% change or NaN%, do NOT include that instrument in the post. Only reference instruments with valid, non-zero price data.\n\n${teaserPrompt}\n\nFull Report:\n${report}` }] }],
        generationConfig: { maxOutputTokens: 180 },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const teaser = (geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    console.log('Generated teaser:', teaser);

    return new Response(
      JSON.stringify({ teaser, reportType, generatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-social-market-teaser:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
