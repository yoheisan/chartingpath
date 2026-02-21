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
    let articleId: string | undefined;
    let articleIds: string[] | undefined;
    let batchSize = 5; // Process max 5 articles per invocation
    try {
      const body = await req.json();
      articleId = body.articleId;
      articleIds = body.articleIds;
      if (body.batchSize) batchSize = Math.min(body.batchSize, 10);
    } catch {
      // No body — process all unprocessed articles
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get published articles
    const idsToProcess = articleIds || (articleId ? [articleId] : null);
    let query = supabase
      .from('learning_articles')
      .select('id, title, content, slug, category, tags')
      .eq('status', 'published');
    if (idsToProcess) {
      query = query.in('id', idsToProcess);
    }
    const { data: articles, error: articlesError } = await query;
    if (articlesError) throw articlesError;
    if (!articles || articles.length === 0) throw new Error('No articles found');

    // Find which articles already have pieces
    const { data: existingPieces } = await supabase
      .from('educational_content_pieces')
      .select('article_id')
      .in('article_id', articles.map(a => a.id));
    const existingArticleIds = new Set((existingPieces || []).map(p => p.article_id));
    const newArticles = articles.filter(a => !existingArticleIds.has(a.id));

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All articles already have educational pieces', processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process a batch
    const batch = newArticles.slice(0, batchSize);
    let piecesGenerated = 0;

    for (const article of batch) {
      console.log(`Generating pieces for: ${article.title}`);

      const linkUrl = `https://chartingpath.com/learn/${article.slug}`;
      
      const ctaOptions: Record<string, string[]> = {
        glossary: [
          `Master the full concept 👉 ${linkUrl}`,
          `Deep dive into this topic 👉 ${linkUrl}`,
          `Full glossary breakdown 👉 ${linkUrl}`,
        ],
        key_learning: [
          `Read the complete guide 👉 ${linkUrl}`,
          `Get the full strategy 👉 ${linkUrl}`,
          `Learn the complete framework 👉 ${linkUrl}`,
        ],
        technique: [
          `Step-by-step setup guide 👉 ${linkUrl}`,
          `Full technique with examples 👉 ${linkUrl}`,
          `See real chart examples 👉 ${linkUrl}`,
        ],
        insight: [
          `More insights like this 👉 ${linkUrl}`,
          `Unlock the full analysis 👉 ${linkUrl}`,
          `Discover more edge 👉 ${linkUrl}`,
        ],
      };

      const prompt = `You are a financial education content strategist for @chartingpath on Twitter/X.

Break this trading education article into exactly 4 tweet-sized educational posts. Each tweet should be self-contained, valuable, and engaging.

CRITICAL REQUIREMENTS FOR EACH TWEET:
- Maximum 220 characters for the educational content (leave room for CTA + hashtags)
- Must be educational and actionable
- Include specific numbers, percentages, or levels when possible
- Start with an eye-catching emoji
- DO NOT include any links, URLs, or "[link to article]" placeholders — the CTA link will be appended automatically
- DO NOT end with "Learn more:", "Full guide:", etc. — the system adds the CTA
- Each tweet should cover a DIFFERENT aspect of the article

TYPES (assign one type per tweet, use all 4 different types):
1. "glossary" - Define a key term from the article in simple terms
2. "key_learning" - Share the most important takeaway or rule
3. "technique" - Describe a specific actionable technique or setup
4. "insight" - Share a surprising fact, statistic, or pro tip

ARTICLE TITLE: ${article.title}
ARTICLE CATEGORY: ${article.category}
ARTICLE CONTENT:
${article.content.substring(0, 4000)}

Respond in this exact JSON format (no markdown, just raw JSON):
[
  {"sequence": 1, "type": "glossary", "content": "tweet text WITHOUT any link", "hashtags": ["Trading", "Finance"]},
  {"sequence": 2, "type": "key_learning", "content": "tweet text WITHOUT any link", "hashtags": ["Trading", "Finance"]},
  {"sequence": 3, "type": "technique", "content": "tweet text WITHOUT any link", "hashtags": ["Trading", "Finance"]},
  {"sequence": 4, "type": "insight", "content": "tweet text WITHOUT any link", "hashtags": ["Trading", "Finance"]}
]`;

      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
            }),
          }
        );

        if (!geminiResponse.ok) {
          console.error(`Gemini error for ${article.title}: ${geminiResponse.status}`);
          continue;
        }

        const geminiData = await geminiResponse.json();
        let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const pieces = JSON.parse(rawText);

        const rows = pieces.map((piece: any) => {
          // Pick a random CTA for this piece type
          const ctas = ctaOptions[piece.type] || ctaOptions.insight;
          const cta = ctas[Math.floor(Math.random() * ctas.length)];
          // Clean any leftover link placeholders from AI output
          let cleanContent = piece.content
            .replace(/\[link to article\]/gi, '')
            .replace(/Learn more:?\s*$/i, '')
            .replace(/Full guide:?\s*$/i, '')
            .replace(/Read more:?\s*$/i, '')
            .replace(/https?:\/\/\S+/g, '')
            .trim();
          // Append CTA with link
          const fullContent = `${cleanContent}\n\n${cta}`;
          
          return {
            article_id: article.id,
            article_title: article.title,
            sequence_number: piece.sequence,
            total_in_series: pieces.length,
            content: fullContent,
            piece_type: piece.type,
            link_back_url: linkUrl,
            hashtags: piece.hashtags || [],
          };
        });

        // Insert immediately per article so progress is saved
        const { error: insertError } = await supabase
          .from('educational_content_pieces')
          .insert(rows);

        if (insertError) {
          console.error(`Insert error for ${article.title}:`, insertError.message);
        } else {
          piecesGenerated += rows.length;
          console.log(`✅ Inserted ${rows.length} pieces for: ${article.title}`);
        }
      } catch (parseError) {
        console.error(`Failed for ${article.title}:`, parseError);
        continue;
      }

      // Small delay between Gemini calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Recompute global_order for all pieces
    const { data: allPieces } = await supabase
      .from('educational_content_pieces')
      .select('id')
      .eq('is_active', true)
      .order('article_title', { ascending: true })
      .order('sequence_number', { ascending: true });

    if (allPieces) {
      for (let i = 0; i < allPieces.length; i++) {
        await supabase
          .from('educational_content_pieces')
          .update({ global_order: i })
          .eq('id', allPieces[i].id);
      }
    }

    const remaining = newArticles.length - batch.length;
    console.log(`Generated ${piecesGenerated} pieces from ${batch.length} articles. ${remaining} articles remaining.`);

    return new Response(
      JSON.stringify({
        processed: batch.length,
        piecesGenerated,
        totalQueue: allPieces?.length || 0,
        remaining,
        message: remaining > 0 ? `${remaining} articles remaining. Call again to process more.` : 'All articles processed!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-educational-posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
