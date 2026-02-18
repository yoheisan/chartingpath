import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, timezone, markets, tone, linkBackUrl, timeSpan } = await req.json(); // reportType: "pre_market" | "post_market"
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the latest full market report
    const { data: latestReport, error: reportError } = await supabaseClient
      .from('cached_market_reports')
      .select('report')
      .eq('timezone', timezone || 'America/New_York')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no cached report exists, generate one
    if (!latestReport) {
      console.log('No cached report found, generating new one...');
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

      console.log('Using newly generated report for teaser');
      const report = newReport.report;
      
      // Continue with report generation using the new report
      const link = linkBackUrl || 'https://chartingpath.com/tools/market-breadth';

      const teaserPrompt = reportType === 'pre_market'
        ? `Create a compelling PRE-MARKET social media post (max 240 characters) from this market report. 
        
        CRITICAL REQUIREMENTS:
        - Eye-catching emoji at start (🔥📊💹⚡️📈)
        - ONE key market level or percentage move with specific numbers
        - Brief actionable insight or pattern alert
        - MUST end with: "Full Analysis + Free Scripts → ${link} 🚀"
        
        Format: [Emoji] [Specific Move/Level] - [Brief insight]. Full Analysis + Free Scripts → ${link} 🚀
        
        Example: 🔥 S&P 500 testing 5,200 resistance - Double top forming on 4H. Full Analysis + Free Scripts → ${link} 🚀`
        : `Create a compelling POST-MARKET social media post (max 240 characters) from this market report.
        
        CRITICAL REQUIREMENTS:
        - Eye-catching emoji at start (📊✅❌💰📉📈)
        - Closing level with exact change percentage
        - Key pattern confirmation or market insight
        - MUST end with: "Full Analysis + Free Scripts → ${link} 🚀"
        
        Format: [Emoji] [Market closed at X, +/- Y%] - [Key takeaway]. Full Analysis + Free Scripts → ${link} 🚀
        
        Example: ✅ S&P closed at 5,195 (+0.8%) - Bullish engulfing confirmed. Full Analysis + Free Scripts → ${link} 🚀`;

      console.log('Generating social teaser with Gemini...');
      
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an expert financial social media content creator. Your posts ALWAYS include specific market data (exact prices, percentages, levels) and ALWAYS end with the provided link. Never skip the call-to-action link. Focus on actionable insights that traders can use immediately.\n\n${teaserPrompt}\n\nFull Report:\n${report}` }] }],
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
        JSON.stringify({ 
          teaser,
          reportType,
          generatedAt: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (reportError) {
      console.error('Error fetching cached report:', reportError);
      throw new Error('Could not fetch latest market report');
    }

    console.log('Using market report for teaser generation, report length:', latestReport.report.length);

    const link = linkBackUrl || 'https://chartingpath.com/tools/market-breadth';

    // Generate social media teaser based on report type
    const teaserPrompt = reportType === 'pre_market'
      ? `Create a compelling PRE-MARKET social media post (max 240 characters) from this market report. 
      
      CRITICAL REQUIREMENTS:
      - Eye-catching emoji at start (🔥📊💹⚡️📈)
      - ONE key market level or percentage move with specific numbers
      - Brief actionable insight or pattern alert
      - MUST end with: "Full Analysis + Free Scripts → ${link} 🚀"
      
      Format: [Emoji] [Specific Move/Level] - [Brief insight]. Full Analysis + Free Scripts → ${link} 🚀
      
      Example: 🔥 S&P 500 testing 5,200 resistance - Double top forming on 4H. Full Analysis + Free Scripts → ${link} 🚀`
      : `Create a compelling POST-MARKET social media post (max 240 characters) from this market report.
      
      CRITICAL REQUIREMENTS:
      - Eye-catching emoji at start (📊✅❌💰📉📈)
      - Closing level with exact change percentage
      - Key pattern confirmation or market insight
      - MUST end with: "Full Analysis + Free Scripts → ${link} 🚀"
      
      Format: [Emoji] [Market closed at X, +/- Y%] - [Key takeaway]. Full Analysis + Free Scripts → ${link} 🚀
      
      Example: ✅ S&P closed at 5,195 (+0.8%) - Bullish engulfing confirmed. Full Analysis + Free Scripts → ${link} 🚀`;

    console.log('Generating social teaser with OpenAI...');
    
    const geminiResponse2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are an expert financial social media content creator. Your posts ALWAYS include specific market data (exact prices, percentages, levels) and ALWAYS end with the provided link. Never skip the call-to-action link. Focus on actionable insights that traders can use immediately.\n\n${teaserPrompt}\n\nFull Report:\n${latestReport.report}` }] }],
        generationConfig: { maxOutputTokens: 180 },
      }),
    });

    if (!geminiResponse2.ok) {
      const errorText = await geminiResponse2.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse2.status}`);
    }

    const geminiData2 = await geminiResponse2.json();
    const teaser = (geminiData2.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    console.log('Generated teaser:', teaser);

    return new Response(
      JSON.stringify({ 
        teaser,
        reportType,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-social-market-teaser:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
