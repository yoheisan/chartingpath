/**
 * Auto Translate Articles (Server-Side Orchestrator)
 * 
 * Fully self-contained orchestrator that translates published articles
 * directly using the Gemini API — no HTTP calls to other edge functions.
 * 
 * Processes ONE article per invocation to stay safely within the ~50s
 * edge function timeout. Picks up where it left off on each cron run
 * by querying for the next untranslated (article, language) pair.
 * 
 * Cron: every 3 hours → processes 1 article × 1 language per run.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const LANGUAGES = ['es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru', 'ar', 'af', 'ko', 'tr', 'nl', 'pl', 'vi']

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', pt: 'Portuguese', fr: 'French', zh: 'Chinese (Simplified)',
  de: 'German', hi: 'Hindi', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ru: 'Russian', ar: 'Arabic', af: 'Afrikaans',
  ko: 'Korean', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
  vi: 'Vietnamese',
}

const TECHNICAL_TERMS = [
  'Pine Script', 'MQL4', 'MQL5', 'TradingView', 'ChartingPath',
  'ATR', 'EMA', 'MACD', 'RSI', 'SL', 'TP', 'BTC', 'ETH',
  'Fibonacci', 'Bollinger Bands', 'Ichimoku', 'Heikin-Ashi',
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

async function translateContent(apiKey: string, text: string, langName: string, partNum: number, totalParts: number): Promise<string> {
  const prompt = `Translate the following Markdown content from English to ${langName}.

RULES:
- Preserve ALL Markdown formatting (headers, bold, italic, links, lists, code blocks, tables)
- Preserve technical terms unchanged: ${TECHNICAL_TERMS.join(', ')}
- Preserve URLs, image paths, and code examples unchanged
- Preserve any HTML tags unchanged
- Keep the same document structure and line breaks
- Translate naturally, not word-for-word
- This is part ${partNum} of ${totalParts} of a trading/finance educational article

CONTENT TO TRANSLATE:
${text}

Return ONLY the translated Markdown content, no explanation.`

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    }
  )

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Gemini API error: ${resp.status} ${errText}`)
  }

  const data = await resp.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function translateMeta(apiKey: string, article: any, langName: string): Promise<Record<string, string>> {
  const metaPrompt = `Translate these article metadata fields from English to ${langName}. Return ONLY valid JSON.

{
  "title": ${JSON.stringify(article.title)},
  "excerpt": ${JSON.stringify(article.excerpt || '')},
  "seo_title": ${JSON.stringify(article.seo_title || article.title)},
  "seo_description": ${JSON.stringify(article.seo_description || article.excerpt || '')}
}

Preserve technical terms: ${TECHNICAL_TERMS.join(', ')}. Return ONLY the JSON.`

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: metaPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    }
  )

  if (!resp.ok) throw new Error('Gemini metadata translation failed')
  const data = await resp.json()
  const metaText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const match = metaText.match(/\{[\s\S]*\}/)
  return match ? JSON.parse(match[0]) : {}
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('[auto-translate-articles] Starting inline orchestration')

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get all published articles
    const { data: articles, error: artErr } = await supabase
      .from('learning_articles')
      .select('id, title, slug, content, excerpt, seo_title, seo_description')
      .eq('status', 'published')
      .order('published_at', { ascending: true })

    if (artErr) throw artErr
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ message: 'No published articles' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Get all existing translations
    const { data: existing } = await supabase
      .from('learning_article_translations')
      .select('article_id, language_code, source_hash, is_manual_override')

    const existingSet = new Set<string>()
    const hashMap = new Map<string, string>()
    const manualOverrides = new Set<string>()

    existing?.forEach((e) => {
      const key = `${e.article_id}:${e.language_code}`
      existingSet.add(key)
      if (e.source_hash) hashMap.set(key, e.source_hash)
      if (e.is_manual_override) manualOverrides.add(key)
    })

    // 3. Find the FIRST (article, language) pair that needs translation
    let targetArticle: any = null
    let targetLang: string = ''

    for (const lang of LANGUAGES) {
      for (const article of articles) {
        const key = `${article.id}:${lang}`
        if (manualOverrides.has(key)) continue
        const contentHash = simpleHash(article.content)
        if (existingSet.has(key) && hashMap.get(key) === contentHash) continue
        // Found one that needs translation
        targetArticle = article
        targetLang = lang
        break
      }
      if (targetArticle) break
    }

    if (!targetArticle) {
      console.log('[auto-translate-articles] All articles fully translated!')
      return new Response(JSON.stringify({
        success: true,
        message: 'All articles are up to date',
        total_articles: articles.length,
        total_languages: LANGUAGES.length,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const langName = LANGUAGE_NAMES[targetLang]
    console.log(`[auto-translate-articles] Translating "${targetArticle.title}" → ${langName} (${targetLang})`)

    // 4. Translate the content (chunked)
    const chunks = splitMarkdownContent(targetArticle.content, 3000)
    const translatedChunks: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      if (Date.now() - startTime > 45_000) {
        console.log(`[auto-translate-articles] Time limit approaching at chunk ${i + 1}/${chunks.length}, aborting`)
        return new Response(JSON.stringify({
          success: false,
          message: `Timed out at chunk ${i + 1}/${chunks.length}`,
          article: targetArticle.slug,
          language: targetLang,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const translated = await translateContent(GEMINI_API_KEY, chunks[i], langName, i + 1, chunks.length)
      translatedChunks.push(translated)

      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    const translatedContent = translatedChunks.join('\n\n')

    // 5. Translate metadata
    const meta = await translateMeta(GEMINI_API_KEY, targetArticle, langName)

    // 6. Upsert
    const contentHash = simpleHash(targetArticle.content)
    const { error: upsertErr } = await supabase
      .from('learning_article_translations')
      .upsert(
        {
          article_id: targetArticle.id,
          language_code: targetLang,
          title: meta.title || targetArticle.title,
          excerpt: meta.excerpt || targetArticle.excerpt,
          content: translatedContent,
          seo_title: meta.seo_title || meta.title || targetArticle.seo_title,
          seo_description: meta.seo_description || targetArticle.seo_description,
          source_hash: contentHash,
          status: 'auto_translated',
          is_manual_override: false,
          translated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'article_id,language_code' }
      )

    if (upsertErr) throw upsertErr

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[auto-translate-articles] ✅ Done "${targetArticle.slug}" → ${targetLang} in ${duration}s (${chunks.length} chunks)`)

    // Count remaining
    let remainingCount = 0
    for (const lang of LANGUAGES) {
      for (const article of articles) {
        const key = `${article.id}:${lang}`
        if (manualOverrides.has(key)) continue
        if (key === `${targetArticle.id}:${targetLang}`) continue // just done
        const h = simpleHash(article.content)
        if (existingSet.has(key) && hashMap.get(key) === h) continue
        remainingCount++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      article: targetArticle.slug,
      language: targetLang,
      chunks: chunks.length,
      duration_seconds: parseFloat(duration),
      remaining: remainingCount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('[auto-translate-articles] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
