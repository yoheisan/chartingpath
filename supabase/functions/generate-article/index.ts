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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
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

    const { topic, category, difficulty, keywords } = await req.json();

    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log('Generating article for topic:', topic);

    // Generate article content using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
- Use clear, accessible language for intermediate traders

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

Make it highly educational, practical, and valuable for traders looking to improve their skills.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your workspace.');
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