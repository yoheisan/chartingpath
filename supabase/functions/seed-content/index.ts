import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Blog articles content
const articles = [
  {
    title: "Head and Shoulders Pattern: Complete Trading Guide",
    slug: "head-and-shoulders-pattern",
    category: "Chart Patterns",
    subcategory: "Reversal Patterns",
    content_type: "article",
    difficulty_level: "intermediate",
    reading_time_minutes: 8,
    excerpt: "The Head and Shoulders pattern is one of the most reliable reversal patterns in technical analysis, signaling a potential trend change from bullish to bearish.",
    content: `The Head and Shoulders pattern is one of the most reliable reversal patterns in technical analysis, signaling a potential trend change from bullish to bearish.

## Pattern Structure

The Head and Shoulders pattern consists of three distinct peaks:

1. **Left Shoulder**: The first peak formed during an uptrend
2. **Head**: A higher peak that exceeds the left shoulder
3. **Right Shoulder**: A third peak that's similar in height to the left shoulder but lower than the head

The **Neckline** connects the lows between the shoulders and head, acting as a critical support level.

## How to Trade

1. Wait for price to break below the neckline
2. Enter short position on neckline break
3. Place stop loss above the right shoulder
4. Target: Measure the distance from head to neckline, project downward from breakout point

## Success Rate

According to Thomas Bulkowski's research, the Head and Shoulders pattern has a 93% accuracy rate with an average decline of 17%, making it one of the most reliable reversal indicators in technical analysis.`,
    tags: ["chart patterns", "reversal", "technical analysis", "bearish"],
    related_patterns: ["double-top", "triple-top"],
    seo_title: "Head and Shoulders Pattern Trading Guide | Complete Analysis",
    seo_description: "Learn the Head and Shoulders pattern with 93% accuracy rate. Complete guide on structure, trading strategy, and risk management.",
    seo_keywords: ["head and shoulders pattern", "reversal pattern", "technical analysis", "chart patterns", "trading strategy"],
    featured_image_url: "/lovable-uploads/inverted-head-shoulders.png",
    status: "published",
  },
  {
    title: "Support and Resistance: The Foundation of Technical Analysis",
    slug: "support-and-resistance-basics",
    category: "Technical Analysis",
    subcategory: "Core Concepts",
    content_type: "article",
    difficulty_level: "beginner",
    reading_time_minutes: 10,
    excerpt: "Support and resistance levels are the cornerstone of technical analysis, representing price levels where buying or selling pressure historically emerges.",
    content: `Support and resistance levels are fundamental concepts in technical analysis that every trader must master.

## What is Support?

Support is a price level where buying interest is strong enough to prevent the price from declining further. Think of it as a "floor" that price bounces off.

## What is Resistance?

Resistance is a price level where selling interest is strong enough to prevent the price from rising further. Think of it as a "ceiling" that price struggles to break through.

## How to Identify Support and Resistance

1. **Historical Price Action**: Look for areas where price has reversed multiple times
2. **Round Numbers**: Psychological levels like $50, $100 often act as support/resistance
3. **Moving Averages**: Dynamic support/resistance that moves with price
4. **Pivot Points**: Mathematical calculations based on previous period's high, low, close

## Trading Strategy

- **Buy at Support**: When price approaches support in an uptrend
- **Sell at Resistance**: When price approaches resistance in a downtrend
- **Breakout Trading**: When price breaks through key levels with volume

## Role Reversal

A key concept: When resistance is broken, it often becomes support. Similarly, broken support often becomes resistance.`,
    tags: ["support", "resistance", "technical analysis", "price action"],
    seo_title: "Support and Resistance Levels | Technical Analysis Guide",
    seo_description: "Master support and resistance - the foundation of technical analysis. Learn identification, trading strategies, and role reversal concepts.",
    seo_keywords: ["support levels", "resistance levels", "technical analysis", "price action", "trading"],
    featured_image_url: "/lovable-uploads/support-resistance-chart.png",
    status: "published",
  },
  // Add more articles as needed
];

// Quiz questions content
const quizQuestions = [
  {
    question_code: "HS_V1",
    category: "pattern_recognition",
    difficulty: "intermediate",
    question_text: "What pattern is shown in this candlestick chart?",
    options: JSON.stringify(["Head and Shoulders", "Double Top", "Triple Top"]),
    correct_answer: 0,
    explanation: "Head and Shoulders has 93% accuracy rate according to Thomas Bulkowski's Encyclopedia of Chart Patterns, with average decline of 17%. This pattern is one of the most reliable reversal indicators, consisting of three peaks where the middle peak (head) is highest. Professional traders at top Wall Street firms use this pattern because of its high success rate and clear entry/exit points.",
    pattern_name: "Head and Shoulders",
    pattern_key: "head-shoulders",
    tags: ["reversal", "bearish", "chart-patterns"],
    seo_title: "Head and Shoulders Pattern Quiz Question",
    seo_description: "Test your knowledge of the Head and Shoulders reversal pattern",
    seo_keywords: ["head and shoulders", "chart pattern quiz", "technical analysis test"],
  },
  {
    question_code: "DB_V2",
    category: "pattern_recognition",
    difficulty: "intermediate",
    question_text: "Identify this reversal pattern in the candlestick chart:",
    options: JSON.stringify(["Cup and Handle", "Double Bottom", "Inverse Head and Shoulders"]),
    correct_answer: 1,
    explanation: "Double Bottom is a bullish reversal pattern with 79% success rate and 35% average rise according to Bulkowski's research. The pattern shows two distinct attempts by sellers to push price lower, both finding support at approximately the same level. When price breaks above the neckline, it confirms buyers have taken control.",
    pattern_name: "Double Bottom",
    pattern_key: "double-bottom",
    tags: ["reversal", "bullish", "chart-patterns"],
    seo_title: "Double Bottom Pattern Quiz Question",
    seo_description: "Test your knowledge of the Double Bottom bullish reversal pattern",
    seo_keywords: ["double bottom", "chart pattern quiz", "bullish reversal"],
  },
  // Add more quiz questions...
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_admin', { _user_id: user.id });

    if (adminError || !isAdmin) {
      throw new Error('Admin access required');
    }

    // Seed articles
    const { data: insertedArticles, error: articlesError } = await supabase
      .from('learning_articles')
      .upsert(articles.map(article => ({
        ...article,
        author_id: user.id,
        published_at: new Date().toISOString(),
      })), { onConflict: 'slug' });

    if (articlesError) {
      console.error('Error seeding articles:', articlesError);
      throw articlesError;
    }

    // Seed quiz questions
    const { data: insertedQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .upsert(quizQuestions.map(q => ({
        ...q,
        created_by: user.id,
      })), { onConflict: 'question_code' });

    if (questionsError) {
      console.error('Error seeding questions:', questionsError);
      throw questionsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        articlesSeeded: articles.length,
        questionsSeeded: quizQuestions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});