import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', pt: 'Portuguese', fr: 'French', zh: 'Chinese (Simplified)',
  de: 'German', hi: 'Hindi', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ru: 'Russian', ar: 'Arabic', af: 'Afrikaans',
  ko: 'Korean', tr: 'Turkish', nl: 'Dutch', pl: 'Polish'
}

const TECHNICAL_TERMS = [
  'Pine Script', 'MQL4', 'MQL5', 'TradingView', 'ChartingPath',
  'ATR', 'EMA', 'MACD', 'RSI', 'SL', 'TP', 'BTC', 'ETH',
  'Fibonacci', 'Bollinger Bands', 'Ichimoku', 'Heikin-Ashi'
]

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

interface TranslateRequest {
  action: 'translate_article' | 'translate_all' | 'get_status'
  article_id?: string
  language_code?: string  // single language for translate_article
  target_languages?: string[]  // for translate_all, defaults to all
  batch_size?: number  // max articles per call (default 10)
  offset?: number  // skip first N untranslated articles
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    const { action, article_id, language_code, target_languages, batch_size = 10, offset = 0 }: TranslateRequest = await req.json()

    if (action === 'get_status') {
      // Return translation status for all articles
      // Paginate articles (default limit is 1000)
      const allArticles: any[] = []
      let artFrom = 0
      const PAGE = 1000
      while (true) {
        const { data, error } = await supabase
          .from('learning_articles')
          .select('id, title, slug')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .range(artFrom, artFrom + PAGE - 1)
        if (error || !data || data.length === 0) break
        allArticles.push(...data)
        if (data.length < PAGE) break
        artFrom += PAGE
      }

      // Paginate translations (critical: can exceed 1000 rows)
      const allTranslations: any[] = []
      let trFrom = 0
      while (true) {
        const { data, error } = await supabase
          .from('learning_article_translations')
          .select('article_id, language_code, status')
          .range(trFrom, trFrom + PAGE - 1)
        if (error || !data || data.length === 0) break
        allTranslations.push(...data)
        if (data.length < PAGE) break
        trFrom += PAGE
      }

      const statusMap: Record<string, Record<string, string>> = {}
      allTranslations.forEach(t => {
        if (!statusMap[t.article_id]) statusMap[t.article_id] = {}
        statusMap[t.article_id][t.language_code] = t.status
      })

      // Build per-language summary
      const langSummary: Record<string, { translated: number; total: number }> = {}
      const totalArticles = allArticles.length
      allTranslations.forEach(t => {
        if (!langSummary[t.language_code]) langSummary[t.language_code] = { translated: 0, total: totalArticles }
        langSummary[t.language_code].translated++
      })

      return new Response(JSON.stringify({
        total_articles: totalArticles,
        language_summary: langSummary,
        articles: allArticles.map(a => ({
          ...a,
          translations: statusMap[a.id] || {}
        }))
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'translate_article') {
      if (!article_id || !language_code) {
        throw new Error('article_id and language_code required')
      }

      const result = await translateSingleArticle(supabase, GEMINI_API_KEY, article_id, language_code)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'translate_all') {
      const startTime = Date.now()
      console.log('[translate-articles] translate_all called, batch_size:', batch_size, 'offset:', offset)
      // Translate all published articles for one language at a time
      // Client should call this per-language to avoid timeouts
      const langs = target_languages || [language_code]
      if (!langs || langs.length === 0) throw new Error('target_languages or language_code required')

      const langCode = langs[0] // Process one language per call
      const langName = LANGUAGE_NAMES[langCode]
      if (!langName) throw new Error(`Unknown language: ${langCode}`)

      // Fetch all published articles
      const { data: articles, error: articlesError } = await supabase
        .from('learning_articles')
        .select('id, title, slug, content, excerpt, seo_title, seo_description')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (articlesError) throw articlesError

      // Get existing translations for this language
      const { data: existing } = await supabase
        .from('learning_article_translations')
        .select('article_id, source_hash, is_manual_override')
        .eq('language_code', langCode)

      const existingMap = new Map(existing?.map(e => [e.article_id, e]) || [])

      let translated = 0, skipped = 0, errors = 0

      // Filter to only articles needing translation
      const needsTranslation: typeof articles = []
      for (const article of (articles || [])) {
        const contentHash = simpleHash(article.content)
        const ex = existingMap.get(article.id)
        if (ex?.is_manual_override) { skipped++; continue }
        if (ex?.source_hash === contentHash) { skipped++; continue }
        needsTranslation.push(article)
      }

      // Apply offset and batch_size
      const batch = needsTranslation.slice(offset, offset + batch_size)

      for (const article of batch) {
        // Check time budget - abort if approaching 45s timeout
        if (Date.now() - startTime > 40_000) {
          console.log(`[translate-articles] Time limit approaching, stopping after ${translated} articles`)
          break
        }

        try {
          console.log(`[translate-articles] Translating "${article.slug}" → ${langCode}`)
          await translateSingleArticle(supabase, GEMINI_API_KEY, article.id, langCode, article)
          translated++
          console.log(`[translate-articles] ✅ Done "${article.slug}" → ${langCode}`)
        } catch (e) {
          console.error(`Error translating ${article.slug} to ${langCode}:`, e)
          errors++
        }

        // Minimal delay to avoid burst throttling (paid tier: 2000 RPM)
        await new Promise(r => setTimeout(r, 300))
      }

      const remaining = needsTranslation.length - offset - batch.length

      return new Response(JSON.stringify({
        success: true,
        language: langCode,
        translated,
        skipped,
        errors,
        total: articles?.length || 0,
        needs_translation: needsTranslation.length,
        remaining,
        next_offset: remaining > 0 ? offset + batch_size : null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error('translate-articles error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function translateSingleArticle(
  supabase: any,
  apiKey: string,
  articleId: string,
  langCode: string,
  preloadedArticle?: any
) {
  const langName = LANGUAGE_NAMES[langCode]
  if (!langName) throw new Error(`Unknown language: ${langCode}`)

  // Fetch article if not preloaded
  const article = preloadedArticle || await (async () => {
    const { data, error } = await supabase
      .from('learning_articles')
      .select('id, title, slug, content, excerpt, seo_title, seo_description')
      .eq('id', articleId)
      .single()
    if (error) throw error
    return data
  })()

  const contentHash = simpleHash(article.content)

  // Split content into chunks (~3000 chars each) to stay within token limits
  const chunks = splitMarkdownContent(article.content, 3000)
  const translatedChunks: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const prompt = `Translate the following Markdown content from English to ${langName}.

RULES:
- Preserve ALL Markdown formatting (headers, bold, italic, links, lists, code blocks, tables)
- Preserve technical terms unchanged: ${TECHNICAL_TERMS.join(', ')}
- Preserve URLs, image paths, and code examples unchanged
- Preserve any HTML tags unchanged
- Keep the same document structure and line breaks
- Translate naturally, not word-for-word
- This is part ${i + 1} of ${chunks.length} of a trading/finance educational article

CONTENT TO TRANSLATE:
${chunks[i]}

Return ONLY the translated Markdown content, no explanation.`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        })
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errText}`)
    }

    const data = await geminiResponse.json()
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    translatedChunks.push(translated)

    // Minimal delay between chunks (paid tier)
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  const translatedContent = translatedChunks.join('\n\n')

  // Translate metadata (title, excerpt, seo fields)
  const metaPrompt = `Translate these article metadata fields from English to ${langName}. Return ONLY valid JSON.

{
  "title": ${JSON.stringify(article.title)},
  "excerpt": ${JSON.stringify(article.excerpt || '')},
  "seo_title": ${JSON.stringify(article.seo_title || article.title)},
  "seo_description": ${JSON.stringify(article.seo_description || article.excerpt || '')}
}

Preserve technical terms: ${TECHNICAL_TERMS.join(', ')}. Return ONLY the JSON.`

  const metaResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: metaPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      })
    }
  )

  if (!metaResponse.ok) throw new Error('Gemini metadata translation failed')

  const metaData = await metaResponse.json()
  const metaText = metaData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const metaMatch = metaText.match(/\{[\s\S]*\}/)
  const meta = metaMatch ? JSON.parse(metaMatch[0]) : {}

  // Upsert the translation
  const { error: upsertError } = await supabase
    .from('learning_article_translations')
    .upsert({
      article_id: article.id,
      language_code: langCode,
      title: meta.title || article.title,
      excerpt: meta.excerpt || article.excerpt,
      content: translatedContent,
      seo_title: meta.seo_title || meta.title || article.seo_title,
      seo_description: meta.seo_description || article.seo_description,
      source_hash: contentHash,
      status: 'auto_translated',
      is_manual_override: false,
      translated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'article_id,language_code' })

  if (upsertError) throw upsertError

  return {
    success: true,
    article_id: article.id,
    language_code: langCode,
    chunks_translated: chunks.length
  }
}

function splitMarkdownContent(content: string, maxChars: number): string[] {
  if (content.length <= maxChars) return [content]

  const chunks: string[] = []
  const lines = content.split('\n')
  let current = ''

  for (const line of lines) {
    if (current.length + line.length + 1 > maxChars && current.length > 0) {
      chunks.push(current.trim())
      current = ''
    }
    current += line + '\n'
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}
