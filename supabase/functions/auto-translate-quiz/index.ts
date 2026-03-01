/**
 * Auto Translate Quiz Questions
 * 
 * Translates quiz questions (question_text, options, explanation) into
 * all supported languages using the Gemini API.
 * 
 * Processes a batch of untranslated questions per invocation.
 * Picks up where it left off by querying for missing translations.
 * 
 * Cron: every 6 hours or on-demand via POST.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGES = ['es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru', 'ar', 'af', 'ko', 'tr', 'nl', 'pl']

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', pt: 'Portuguese', fr: 'French', zh: 'Chinese (Simplified)',
  de: 'German', hi: 'Hindi', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ru: 'Russian', ar: 'Arabic', af: 'Afrikaans',
  ko: 'Korean', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
}

const TECHNICAL_TERMS = [
  'Pine Script', 'MQL4', 'MQL5', 'TradingView', 'ChartingPath',
  'ATR', 'EMA', 'MACD', 'RSI', 'SL', 'TP', 'BTC', 'ETH',
  'Fibonacci', 'Bollinger Bands', 'Ichimoku', 'Heikin-Ashi',
  'Head and Shoulders', 'Double Top', 'Double Bottom', 'Triple Top', 'Triple Bottom',
  'Cup and Handle', 'Bull Flag', 'Bear Flag', 'Ascending Triangle', 'Descending Triangle',
  'Rising Wedge', 'Falling Wedge', 'Donchian',
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

interface QuizQuestion {
  id: string
  question_text: string
  options: string[]
  explanation: string
}

async function translateQuizBatch(
  apiKey: string,
  questions: QuizQuestion[],
  langName: string,
): Promise<Array<{ question_text: string; options: string[]; explanation: string }>> {
  // Build a JSON payload for batch translation
  const payload = questions.map((q, i) => ({
    idx: i,
    question_text: q.question_text,
    options: q.options,
    explanation: q.explanation,
  }))

  const prompt = `Translate the following quiz questions from English to ${langName}.

RULES:
- Keep technical terms untranslated: ${TECHNICAL_TERMS.join(', ')}
- Keep chart pattern names in their English form unless there is a widely accepted ${langName} equivalent
- Maintain the same JSON structure
- Do NOT translate any numbers, symbols, or code
- Keep the same number of options in the same order
- Return ONLY valid JSON, no markdown fences, no explanation

INPUT:
${JSON.stringify(payload, null, 2)}

OUTPUT format (array of objects with same idx):
[{"idx": 0, "question_text": "...", "options": ["..."], "explanation": "..."}, ...]`

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
      }),
    },
  )

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Gemini API error: ${resp.status} - ${errText}`)
  }

  const data = await resp.json()
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  // Strip markdown fences if present
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  try {
    const results = JSON.parse(text)
    if (!Array.isArray(results)) throw new Error('Expected array')
    return results.sort((a: any, b: any) => a.idx - b.idx).map((r: any) => ({
      question_text: r.question_text,
      options: Array.isArray(r.options) ? r.options : [],
      explanation: r.explanation,
    }))
  } catch (e) {
    console.error('[auto-translate-quiz] Failed to parse Gemini response:', text.substring(0, 500))
    throw new Error(`Failed to parse translation response: ${e.message}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const startTime = Date.now()
  let totalTranslated = 0
  const BATCH_SIZE = 10
  const MAX_PER_RUN = 20 // Max questions per invocation to stay within timeout

  try {
    // Parse optional language filter from request body
    let targetLang: string | null = null
    try {
      const body = await req.json()
      targetLang = body?.language || null
    } catch { /* no body */ }

    const languagesToProcess = targetLang ? [targetLang] : LANGUAGES

    // 1. Get all quiz questions
    const { data: allQuestions, error: qErr } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options, explanation')
      .eq('is_active', true)

    if (qErr) throw qErr
    if (!allQuestions || allQuestions.length === 0) {
      return new Response(JSON.stringify({ message: 'No quiz questions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[auto-translate-quiz] ${allQuestions.length} active questions`)

    // 2. Get existing translations
    const { data: existing } = await supabase
      .from('quiz_question_translations')
      .select('question_id, language_code, source_hash, is_manual_override')

    const existingMap = new Map<string, { source_hash: string; is_manual_override: boolean }>()
    for (const ex of (existing || [])) {
      existingMap.set(`${ex.question_id}:${ex.language_code}`, {
        source_hash: ex.source_hash,
        is_manual_override: ex.is_manual_override,
      })
    }

    // 3. For each language, find untranslated questions
    for (const langCode of languagesToProcess) {
      if (totalTranslated >= MAX_PER_RUN) break

      const langName = LANGUAGE_NAMES[langCode]
      if (!langName) continue

      const needsTranslation: QuizQuestion[] = []

      for (const q of allQuestions) {
        if (totalTranslated + needsTranslation.length >= MAX_PER_RUN) break

        const key = `${q.id}:${langCode}`
        const ex = existingMap.get(key)
        const sourceHash = simpleHash(q.question_text + JSON.stringify(q.options) + q.explanation)

        // Skip if manually overridden or already up-to-date
        if (ex?.is_manual_override) continue
        if (ex?.source_hash === sourceHash) continue

        needsTranslation.push({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : [],
          explanation: q.explanation,
        })
      }

      if (needsTranslation.length === 0) continue

      console.log(`[auto-translate-quiz] ${langCode}: ${needsTranslation.length} questions to translate`)

      // Process in batches
      for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
        const batch = needsTranslation.slice(i, i + BATCH_SIZE)
        
        try {
          const translated = await translateQuizBatch(GEMINI_API_KEY, batch, langName)

          // Upsert translations
          const upsertRows = batch.map((q, idx) => {
            const tr = translated[idx]
            if (!tr) return null
            return {
              question_id: q.id,
              language_code: langCode,
              question_text: tr.question_text || q.question_text,
              options: tr.options.length === q.options.length ? tr.options : q.options,
              explanation: tr.explanation || q.explanation,
              source_hash: simpleHash(q.question_text + JSON.stringify(q.options) + q.explanation),
              status: 'auto_translated',
              is_manual_override: false,
              translated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }).filter(Boolean)

          if (upsertRows.length > 0) {
            const { error: upsertErr } = await supabase
              .from('quiz_question_translations')
              .upsert(upsertRows, { onConflict: 'question_id,language_code' })

            if (upsertErr) {
              console.error(`[auto-translate-quiz] Upsert error for ${langCode}:`, upsertErr)
            } else {
              totalTranslated += upsertRows.length
              console.log(`[auto-translate-quiz] ${langCode}: upserted ${upsertRows.length} translations`)
            }
          }
        } catch (batchErr) {
          console.error(`[auto-translate-quiz] Batch error for ${langCode}:`, batchErr)
          // Continue with next batch/language
        }

        // Small delay between batches
        await new Promise(r => setTimeout(r, 500))
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[auto-translate-quiz] Done in ${duration}s. Translated: ${totalTranslated}`)

    return new Response(JSON.stringify({
      success: true,
      translated: totalTranslated,
      duration_seconds: parseFloat(duration),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[auto-translate-quiz] Fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
