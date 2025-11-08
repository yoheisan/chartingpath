import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ARTICLES } from './articles-data.ts';
import { QUIZ_QUESTIONS } from './quiz-data.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    console.log('Starting content migration...');

    // Upsert articles (update if slug exists, insert if new)
    const { data: insertedArticles, error: articlesError } = await supabase
      .from('learning_articles')
      .upsert(ARTICLES.map(article => ({
        ...article,
        author_id: user.id,
        status: 'published',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })), {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select();

    if (articlesError) {
      console.error('Articles upsert error:', articlesError);
      throw new Error(`Failed to upsert articles: ${articlesError.message}`);
    }

    // Upsert quiz questions (update if question_code exists, insert if new)
    const { data: insertedQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .upsert(QUIZ_QUESTIONS.map(q => ({
        ...q,
        created_by: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })), {
        onConflict: 'question_code',
        ignoreDuplicates: false
      })
      .select();

    if (questionsError) {
      console.error('Quiz questions upsert error:', questionsError);
      throw new Error(`Failed to upsert quiz questions: ${questionsError.message}`);
    }

    console.log(`Migration complete: ${insertedArticles?.length} articles, ${insertedQuestions?.length} quiz questions`);

    return new Response(
      JSON.stringify({
        success: true,
        articlesInserted: insertedArticles?.length || 0,
        questionsInserted: insertedQuestions?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seed content error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 
      }
    );
  }
});
