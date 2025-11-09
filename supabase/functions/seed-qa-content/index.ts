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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Seeding Q&A content from quiz questions...');

    // Fetch active quiz questions with images
    const { data: quizQuestions, error: quizError } = await supabaseClient
      .from('quiz_questions')
      .select('*')
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .limit(50);

    if (quizError) {
      throw quizError;
    }

    console.log(`Found ${quizQuestions?.length || 0} quiz questions with images`);

    const contentToInsert = [];

    for (const question of quizQuestions || []) {
      // Parse options to get the correct answer text
      const options = question.options as any;
      const correctAnswerText = options[question.correct_answer];

      // Create engaging social media content
      const content = `🎯 Trading Quiz Challenge!\n\n${question.question}\n\nThink you know the answer? Test your trading knowledge at ChartingPath.com 📚\n\n#TradingEducation #ChartPatterns #TechnicalAnalysis`;

      contentToInsert.push({
        content_type: 'qa_content',
        title: question.question.substring(0, 100),
        content,
        image_url: question.image_url,
        link_back_url: `https://chartingpath.com/quiz/${question.category}`,
        tags: [question.category, question.difficulty, 'quiz'],
        is_active: true
      });
    }

    // Insert into content library
    const { data: insertedContent, error: insertError } = await supabaseClient
      .from('content_library')
      .upsert(contentToInsert, { onConflict: 'title' })
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully seeded ${insertedContent?.length || 0} Q&A content items`);

    return new Response(
      JSON.stringify({ 
        success: true,
        seeded: insertedContent?.length || 0,
        message: 'Q&A content seeded from quiz questions'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in seed-qa-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
