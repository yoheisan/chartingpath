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
    const { reportType, timezone } = await req.json(); // reportType: "pre_market" | "post_market"
    
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
      throw new Error('Could not fetch latest market report');
    }

    // Generate social media teaser based on report type
    const teaserPrompt = reportType === 'pre_market'
      ? `Create a compelling PRE-MARKET social media teaser (max 240 characters) from this market report. Focus on key overnight moves and what to watch. End with "Register at ChartingPath.com for full analysis 📊"`
      : `Create a compelling POST-MARKET social media teaser (max 240 characters) from this market report. Focus on major market moves and closing sentiment. End with "Register at ChartingPath.com for full analysis 📊"`;

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
            content: 'You are a financial content writer creating engaging, concise social media posts. Always include emojis for impact and end with the registration CTA.'
          },
          {
            role: 'user',
            content: `${teaserPrompt}\n\nFull Report:\n${latestReport.report}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
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
