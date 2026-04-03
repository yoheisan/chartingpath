import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

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

    const { topic, category, difficulty, keywords } = await req.json();

    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log('Generating article for topic:', topic);

    // --- Step 1: Extract pattern key from topic ---
    const PATTERN_MAP: Record<string, string> = {
      'ascending triangle': 'ascending-triangle',
      'head and shoulders': 'head-shoulders',
      'bull flag': 'bull-flag',
      'bear flag': 'bear-flag',
      'descending triangle': 'descending-triangle',
      'symmetrical triangle': 'symmetrical-triangle',
      'double top': 'double-top',
      'double bottom': 'double-bottom',
      'rising wedge': 'rising-wedge',
      'falling wedge': 'falling-wedge',
      'cup and handle': 'cup-handle',
      'triple top': 'triple-top',
      'triple bottom': 'triple-bottom',
      'inverted head and shoulders': 'inverted-head-shoulders',
      'bump and run reversal': 'bump-run-reversal',
      'island reversal': 'island-reversal',
      'rectangle': 'rectangle',
      'pennant': 'pennant',
    };

    const topicLower = topic.toLowerCase();
    let matchedPatternKey: string | null = null;
    for (const [name, key] of Object.entries(PATTERN_MAP)) {
      if (topicLower.includes(name)) {
        matchedPatternKey = key;
        break;
      }
    }

    // --- Step 2 & 3: Query outcome data and format ---
    let outcomeDataString = '';
    if (matchedPatternKey) {
      console.log('Querying outcome data for pattern:', matchedPatternKey);
      const { data: outcomes, error: outcomeError } = await supabase
        .rpc('get_pattern_outcome_stats', { p_pattern_type: matchedPatternKey })
        .limit(5);

      // Fallback: direct query if RPC doesn't exist
      let rows = outcomes;
      if (outcomeError) {
        console.log('RPC not found, using direct query');
        const { data: directRows } = await supabase
          .from('historical_pattern_occurrences')
          .select('pattern_type, timeframe, outcome, r_multiple')
          .eq('pattern_type', matchedPatternKey)
          .not('outcome', 'is', null);

        if (directRows && directRows.length > 0) {
          // Aggregate in memory
          const byTf: Record<string, { n: number; wins: number; rSum: number }> = {};
          for (const row of directRows) {
            const tf = row.timeframe || 'unknown';
            if (!byTf[tf]) byTf[tf] = { n: 0, wins: 0, rSum: 0 };
            byTf[tf].n++;
            if (row.outcome === 'win') byTf[tf].wins++;
            byTf[tf].rSum += (row.r_multiple || 0);
          }
          rows = Object.entries(byTf)
            .map(([tf, d]) => ({
              timeframe: tf,
              n: d.n,
              win_rate: Math.round((d.wins / d.n) * 1000) / 10,
              avg_r: Math.round((d.rSum / d.n) * 100) / 100,
            }))
            .sort((a, b) => b.n - a.n)
            .slice(0, 5);
        }
      }

      if (rows && rows.length > 0) {
        const totalN = rows.reduce((sum: number, r: any) => sum + (r.n || 0), 0);
        if (totalN >= 10) {
          const lines = rows.map((r: any) =>
            `- ${r.timeframe}: ${r.win_rate}% win rate, ${r.avg_r}R avg, n=${r.n}`
          );
          outcomeDataString = `ChartingPath live data (from ${totalN} tracked outcomes):\n${lines.join('\n')}`;
          console.log('Outcome data injected:', outcomeDataString);
        }
      }
    }

    // --- Step 4 & 5: Build prompts with outcome data ---
    let systemPromptExtra = '';
    let userPromptExtra = '';
    if (outcomeDataString) {
      systemPromptExtra = `\n\nWhen discussing performance statistics for this pattern, ALWAYS lead with ChartingPath's own live outcome data provided below. Present it as: 'According to ChartingPath's live detection database of [n] tracked outcomes...' Do not use Bulkowski or generic textbook statistics when ChartingPath data is available.`;
      userPromptExtra = `\n\nChartingPath outcome data for this pattern:\n${outcomeDataString}`;
    }

    // Generate article content using OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an expert financial markets and trading education writer. Create comprehensive, professional educational articles about trading topics.

Your articles should:
- Be 1500-2500 words with clear structure
- Use markdown formatting with proper headings (##, ###)
- Include practical examples and actionable insights
- Cover: What it is, How to use it, Trading strategies, Success rates/statistics when available
- Be educational and professional in tone
- Include real-world application and risk management
- Use clear, accessible language for intermediate traders${systemPromptExtra}

Format the response as JSON with these fields:
{
  "title": "Engaging title with main keyword",
  "excerpt": "Compelling 2-3 sentence summary",
  "content": "Full markdown article content with proper structure",
  "tags": ["array", "of", "relevant", "tags"],
  "seo_title": "SEO-optimized title (60 chars max)",
  "seo_description": "Meta description (155 chars max)",
  "seo_keywords": ["keyword", "array"],
  "reading_time_minutes": estimated_minutes
}`
          },
          {
            role: 'user',
            content: `Generate a comprehensive trading education article about: ${topic}

Category: ${category || 'Technical Analysis'}
Difficulty Level: ${difficulty || 'intermediate'}
${keywords ? `Focus Keywords: ${keywords}` : ''}

Make it highly educational, practical, and valuable for traders looking to improve their skills.${userPromptExtra}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from AI');
    }

    console.log('AI response received, parsing...');

    // Parse JSON response
    let articleData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      articleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI-generated content');
    }

    // Generate slug from title
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Prepare article for database
    const article = {
      title: articleData.title,
      slug,
      category: category || 'Technical Analysis',
      subcategory: null,
      content_type: 'article' as const,
      difficulty_level: difficulty || 'intermediate',
      reading_time_minutes: articleData.reading_time_minutes || 10,
      excerpt: articleData.excerpt,
      content: articleData.content,
      tags: articleData.tags || [],
      related_patterns: [],
      seo_title: articleData.seo_title || articleData.title.substring(0, 60),
      seo_description: articleData.seo_description || articleData.excerpt.substring(0, 155),
      seo_keywords: articleData.seo_keywords || articleData.tags || [],
      status: 'draft' as const,
      author_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Article prepared, saving to database...');

    // Save to database
    const { data: savedArticle, error: saveError } = await supabase
      .from('learning_articles')
      .insert(article)
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error(`Failed to save article: ${saveError.message}`);
    }

    console.log('Article saved successfully:', savedArticle.id);

    return new Response(
      JSON.stringify({
        success: true,
        article: savedArticle,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate article error:', error);
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