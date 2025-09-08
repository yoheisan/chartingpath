import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageContent, messageType, userId } = await req.json();
    console.log('Processing message:', { messageContent, messageType, userId });

    // Check if this is a question that should get an AI response
    if (messageType !== 'question' && messageType !== 'urgent') {
      return new Response(JSON.stringify({ shouldRespond: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI response using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a helpful trading and financial analysis assistant for a trading community platform. 
    You provide educational information about trading, technical analysis, market patterns, and financial concepts.
    
    Guidelines:
    - Keep responses concise and helpful (under 200 words)
    - Focus on educational content, not financial advice
    - Always include a disclaimer that this is educational information, not financial advice
    - If the question is about urgent technical issues or account problems, suggest contacting moderators
    - If you're not confident about an answer, be honest about limitations
    - Use clear, accessible language suitable for traders of all levels`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageContent }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Calculate confidence score based on question type and content
    let confidenceScore = 0.8;
    if (messageType === 'urgent') confidenceScore = 0.6;
    if (messageContent.toLowerCase().includes('technical') || 
        messageContent.toLowerCase().includes('bug') ||
        messageContent.toLowerCase().includes('account')) {
      confidenceScore = 0.4;
    }

    // Only respond if confidence is above threshold
    if (confidenceScore < 0.5) {
      return new Response(JSON.stringify({ 
        shouldRespond: false,
        reason: 'Low confidence - suggest moderator contact'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store AI response in database
    const { data: aiMessage, error } = await supabase
      .from('community_messages')
      .insert({
        content: aiResponse,
        message_type: 'message',
        is_ai_response: true,
        ai_confidence_score: confidenceScore,
        user_id: '00000000-0000-0000-0000-000000000000' // System user ID
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing AI response:', error);
      throw new Error('Failed to store AI response');
    }

    return new Response(JSON.stringify({ 
      shouldRespond: true,
      response: aiResponse,
      confidenceScore,
      messageId: aiMessage.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in community AI assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      shouldRespond: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});