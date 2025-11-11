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
    const { reportType, timezone, markets, tone, linkBackUrl } = await req.json(); // reportType: "pre_market" | "post_market"
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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
      .single();

    if (reportError || !latestReport) {
      console.error('Could not fetch latest market report:', reportError);
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
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial social media content creator. Your posts ALWAYS include specific market data (exact prices, percentages, levels) and ALWAYS end with the provided link. Never skip the call-to-action link. Focus on actionable insights that traders can use immediately.'
          },
          {
            role: 'user',
            content: `${teaserPrompt}\n\nFull Report:\n${latestReport.report}`
          }
        ],
        max_tokens: 180,
        temperature: 0.8,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const teaser = openAIData.choices[0].message.content.trim();

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
