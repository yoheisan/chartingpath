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
    const { questionId, questionText, category } = await req.json();
    
    if (!questionId || !questionText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: questionId and questionText' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating image for question: ${questionId}`);

    const imagePrompt = generateImagePrompt(questionText, category);
    console.log(`Using prompt: ${imagePrompt}`);

    // Generate image using Gemini via Lovable AI gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: imagePrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini generation error:', response.status, errorText);
      throw new Error(`Image generation failed (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('No image in Gemini response');
    }

    console.log('Image generated via Gemini, uploading to Supabase Storage...');

    // Convert base64 data URL to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryStr = atob(base64Data);
    const imageBuffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      imageBuffer[i] = binaryStr.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const fileName = `${questionId}-${Date.now()}.png`;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: uploadError } = await supabaseClient.storage
      .from('quiz-images')
      .upload(fileName, imageBuffer.buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseClient.storage
      .from('quiz-images')
      .getPublicUrl(fileName);
    
    const permanentImageUrl = urlData.publicUrl;
    console.log('Image uploaded successfully to:', permanentImageUrl);

    const { error: updateError } = await supabaseClient
      .from('quiz_questions')
      .update({ 
        image_url: permanentImageUrl,
        image_metadata: {
          generated_at: new Date().toISOString(),
          prompt: imagePrompt,
          model: 'google/gemini-2.5-flash-image',
          storage_path: fileName
        }
      })
      .eq('id', questionId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: permanentImageUrl,
        questionId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-quiz-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate image',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function generateImagePrompt(questionText: string, category: string): string {
  const categoryPrompts: Record<string, string> = {
    'characteristics': 'Create a professional financial chart illustration showing ',
    'statistics': 'Create a modern infographic style illustration representing ',
    'risk_management': 'Create a professional business illustration showing ',
    'pattern_identification': 'Create a clean technical chart diagram showing ',
  };

  const basePrompt = categoryPrompts[category] || 'Create a professional trading-related illustration showing ';
  
  let conceptPrompt = '';
  
  if (questionText.includes('pip')) {
    conceptPrompt = 'forex trading pips on a currency chart with price movements and pip measurements';
  } else if (questionText.includes('lot')) {
    conceptPrompt = 'trading lot sizes with visual representation of position sizing';
  } else if (questionText.includes('risk') || questionText.includes('stop loss')) {
    conceptPrompt = 'risk management concept with charts showing stop loss levels and risk zones';
  } else if (questionText.includes('VIX') || questionText.includes('volatility')) {
    conceptPrompt = 'market volatility with VIX indicator and market turbulence visualization';
  } else if (questionText.includes('correlation')) {
    conceptPrompt = 'currency correlation with two charts moving in relation to each other';
  } else if (questionText.includes('Gold') || questionText.includes('Dollar')) {
    conceptPrompt = 'gold and dollar relationship with inverse correlation visual';
  } else if (questionText.includes('economic indicator')) {
    conceptPrompt = 'economic indicators dashboard with key metrics and gauges';
  } else if (questionText.includes('breakout')) {
    conceptPrompt = 'breakout pattern with price breaking through resistance level';
  } else if (questionText.includes('volume')) {
    conceptPrompt = 'volume bars on a trading chart with price action';
  } else if (questionText.includes('Head and Shoulders')) {
    conceptPrompt = 'head and shoulders chart pattern formation';
  } else if (questionText.includes('Double top')) {
    conceptPrompt = 'double top reversal pattern on a price chart';
  } else if (questionText.includes('Cup and Handle')) {
    conceptPrompt = 'cup and handle continuation pattern';
  } else if (questionText.includes('triangle')) {
    conceptPrompt = 'triangle chart pattern with converging trendlines';
  } else {
    conceptPrompt = 'abstract financial trading concept with charts and market data';
  }

  return `${basePrompt}${conceptPrompt}. Style: Professional, clean, modern financial illustration with a minimalist design. Use blue and green accent colors on a light background. Make it educational and clear.`;
}
