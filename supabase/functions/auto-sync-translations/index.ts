import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', pt: 'Portuguese', fr: 'French', zh: 'Chinese (Simplified)',
  de: 'German', hi: 'Hindi', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ru: 'Russian', ar: 'Arabic', af: 'Afrikaans',
  ko: 'Korean', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
  vi: 'Vietnamese', th: 'Thai', ms: 'Malay', sw: 'Swahili'
}

const TECHNICAL_TERMS = [
  'Pine Script', 'MQL4', 'MQL5', 'TradingView', 'ChartingPath',
  'ATR', 'EMA', 'MACD', 'RSI', 'SL', 'TP', 'BTC', 'ETH',
  'JSON', 'API', 'URL', 'USD', 'EUR', 'GBP'
]

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/nicholasb4711/chartingpath/main/src/i18n/locales/en.json'

// ── helpers ──────────────────────────────────────────────────────────

function md5Hash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey))
    } else {
      result[fullKey] = String(obj[key])
    }
  }
  return result
}

async function paginatedSelect(
  supabase: any, table: string, selectCols: string, filters?: Record<string, string>
): Promise<any[]> {
  const results: any[] = []
  let from = 0
  const PAGE = 1000
  while (true) {
    let query = supabase.from(table).select(selectCols).range(from, from + PAGE - 1)
    if (filters) {
      for (const [col, val] of Object.entries(filters)) query = query.eq(col, val)
    }
    const { data, error } = await query
    if (error) { console.error(`Paginated fetch ${table} error:`, error); break }
    if (!data || data.length === 0) break
    results.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return results
}

async function translateBatch(
  geminiKey: string, langCode: string, langName: string,
  batch: Array<{ key: string; value: string }>,
  toneExamples: string
): Promise<Record<string, string>> {
  const keysForPrompt = batch.map(k => `"${k.key}": "${k.value.replace(/"/g, '\\"')}"`).join('\n')

  const prompt = `Translate the following English UI strings to ${langName} (${langCode}).

RULES:
- Return ONLY a valid JSON object with the same keys and translated values
- Preserve technical terms unchanged: ${TECHNICAL_TERMS.join(', ')}
- Preserve any HTML tags, variables like {count}, {{name}}, etc.
- Keep translations concise and natural for UI elements
- Match the tone of these existing ${langName} translations:
${toneExamples}

STRINGS TO TRANSLATE:
${keysForPrompt}

Return ONLY the JSON object, no markdown, no explanation.`

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
      })
    }
  )

  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`)

  const data = await resp.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Gemini response')

  const sanitized = jsonMatch[0].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/\t/g, ' ')
  try {
    return JSON.parse(sanitized)
  } catch {
    return JSON.parse(jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, ' '))
  }
}

// ── main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  // Support resumable runs: caller can specify which languages to process
  let requestedLanguages: string[] | null = null
  try {
    const body = await req.json()
    if (body?.languages && Array.isArray(body.languages)) {
      requestedLanguages = body.languages
    }
  } catch {
    // No body or invalid JSON — process all languages
  }

  console.log('[auto-sync] ▶ Starting translation pipeline', requestedLanguages ? `for languages: ${requestedLanguages.join(',')}` : '(all languages)')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    // ─── STEP 0: Fetch en.json and sync keys to translation_keys ────
    console.log('[auto-sync] Step 0: Fetching en.json from GitHub...')
    let enJsonContent: Record<string, any>
    try {
      const ghResp = await fetch(GITHUB_RAW_URL, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (!ghResp.ok) throw new Error(`GitHub ${ghResp.status}`)
      enJsonContent = await ghResp.json()
    } catch (e) {
      console.warn('[auto-sync] GitHub fetch failed, falling back to DB keys:', e)
      enJsonContent = {}
    }

    const flatEnglish = flattenObject(enJsonContent)
    const flatKeys = Object.keys(flatEnglish)
    console.log(`[auto-sync] Flattened ${flatKeys.length} keys from en.json`)

    // Upsert all keys into translation_keys
    let keysCreated = 0
    let keysUpdated = 0
    const UPSERT_BATCH = 100

    for (let i = 0; i < flatKeys.length; i += UPSERT_BATCH) {
      const batch = flatKeys.slice(i, i + UPSERT_BATCH).map(key => ({
        key,
        description: flatEnglish[key],
        category: key.split('.')[0] || 'general'
      }))

      const { error } = await supabase
        .from('translation_keys')
        .upsert(batch, { onConflict: 'key' })

      if (error) {
        console.error('[auto-sync] Key upsert error:', error)
      } else {
        keysCreated += batch.length
      }
    }

    // Check for description changes (stale English text)
    const existingKeys = await paginatedSelect(supabase, 'translation_keys', 'key, description')
    for (const ek of existingKeys) {
      if (flatEnglish[ek.key] && flatEnglish[ek.key] !== ek.description) {
        keysUpdated++
      }
    }

    console.log(`[auto-sync] Step 0 done: ${keysCreated} keys upserted, ${keysUpdated} descriptions changed`)

    // ─── STEP 1: Build English source map ────────────────────────────
    const enMap = new Map<string, string>()

    // Primary source: translation_keys.description (just synced from en.json)
    const allKeys = await paginatedSelect(supabase, 'translation_keys', 'key, description')
    for (const k of allKeys) {
      if (k.description) enMap.set(k.key, k.description)
    }

    // Overlay explicit English translations
    const enTranslations = await paginatedSelect(supabase, 'translations', 'key, value', { language_code: 'en' })
    for (const t of enTranslations) enMap.set(t.key, t.value)

    console.log(`[auto-sync] Step 1: ${enMap.size} English source keys`)

    if (enMap.size === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No English keys found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ─── STEP 2: Translate each language ─────────────────────────────
    const allLanguages = Object.keys(LANGUAGE_NAMES)
    // If specific languages requested, use those; otherwise process all
    const languagesToProcess = requestedLanguages
      ? allLanguages.filter(l => requestedLanguages!.includes(l))
      : allLanguages

    // Process ONE language at a time, limited keys per run
    const MAX_KEYS_PER_RUN = 200
    const currentLang = languagesToProcess[0]
    const remainingLanguages = languagesToProcess.slice(1)

    const summary: Record<string, { translated: number; skipped: number; errors: number }> = {}
    let totalNewTranslations = 0

    if (!currentLang) {
      return new Response(JSON.stringify({
        success: true, has_more: false, remaining_languages: [],
        message: 'No languages to process'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const langCode = currentLang
    const langName = LANGUAGE_NAMES[langCode]
    summary[langCode] = { translated: 0, skipped: 0, errors: 0 }

    try {
      const existing = await paginatedSelect(supabase, 'translations', 'key, value, source_hash, is_manual_override', { language_code: langCode })
      const existingMap = new Map<string, any>()
      existing.forEach(t => existingMap.set(t.key, t))

      const keysToTranslate: Array<{ key: string; value: string; isStale: boolean }> = []

      for (const [key, value] of enMap) {
        const ex = existingMap.get(key)
        const currentHash = md5Hash(value)

        if (!ex) {
          keysToTranslate.push({ key, value, isStale: false })
        } else if (ex.is_manual_override) {
          summary[langCode].skipped++
        } else if (ex.source_hash && ex.source_hash !== currentHash) {
          keysToTranslate.push({ key, value, isStale: true })
        } else {
          summary[langCode].skipped++
        }
      }

      const totalForLang = keysToTranslate.length
      const thisRunKeys = keysToTranslate.slice(0, MAX_KEYS_PER_RUN)
      const keysRemaining = totalForLang - thisRunKeys.length
      // If there are still keys left for this language, re-include it
      const langsDone = keysRemaining === 0
      const effectiveRemaining = langsDone ? remainingLanguages : [currentLang, ...remainingLanguages]

      console.log(`[auto-sync] ${langCode}: ${totalForLang} total keys to translate, processing ${thisRunKeys.length} this run, ${keysRemaining} remaining for this lang`)

      if (thisRunKeys.length > 0) {

        // Get tone context
        const { data: toneContext } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language_code', langCode)
          .eq('status', 'approved')
          .limit(3)

        const toneExamples = toneContext?.map((t: any) => `"${t.key}": "${t.value}"`).join('\n') || 'None available'

        // Batch translate (20 keys per batch)
        const BATCH_SIZE = 20
        for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
          const batch = keysToTranslate.slice(i, i + BATCH_SIZE)

          try {
            const translations = await translateBatch(
              GEMINI_API_KEY, langCode, langName,
              batch.map(b => ({ key: b.key, value: b.value })),
              toneExamples
            )

            for (const item of batch) {
              const translatedValue = translations[item.key]
              if (!translatedValue) { summary[langCode].errors++; continue }

              const sourceHash = md5Hash(item.value)

              if (item.isStale) {
                const { error } = await supabase
                  .from('translations')
                  .update({
                    value: translatedValue,
                    source_hash: sourceHash,
                    status: 'auto_translated',
                    automation_source: 'auto-sync-cron',
                    original_automated_value: translatedValue,
                    updated_at: new Date().toISOString()
                  })
                  .eq('key', item.key)
                  .eq('language_code', langCode)
                if (error) { summary[langCode].errors++ } else { summary[langCode].translated++ }
              } else {
                await supabase
                  .from('translation_keys')
                  .upsert({ key: item.key, description: item.value, category: item.key.split('.')[0] || 'general' }, { onConflict: 'key', ignoreDuplicates: true })

                const { error } = await supabase
                  .from('translations')
                  .insert({
                    key: item.key,
                    language_code: langCode,
                    value: translatedValue,
                    source_hash: sourceHash,
                    status: 'auto_translated',
                    automation_source: 'auto-sync-cron',
                    original_automated_value: translatedValue,
                    is_manual_override: false
                  })
                if (error) { summary[langCode].errors++ } else { summary[langCode].translated++ }
              }
            }

            if (i + BATCH_SIZE < keysToTranslate.length) {
              await new Promise(r => setTimeout(r, 2000))
            }
          } catch (batchError) {
            console.error(`Batch error for ${langCode}:`, batchError)
            summary[langCode].errors += batch.length
          }
        }

        totalNewTranslations += summary[langCode].translated
      } catch (langError) {
        console.error(`Language ${langCode} error:`, langError)
        summary[langCode].errors++
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[auto-sync] ✓ Completed in ${duration}s. Keys synced: ${flatKeys.length}, New translations: ${totalNewTranslations}`)

    return new Response(JSON.stringify({
      success: true,
      steps: {
        step0_keys_from_github: flatKeys.length,
        step0_keys_updated: keysUpdated,
      },
      total_english_keys: enMap.size,
      total_new_translations: totalNewTranslations,
      duration_seconds: parseFloat(duration),
      languages_processed: thisRunLanguages,
      remaining_languages: remainingLanguages,
      has_more: remainingLanguages.length > 0,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[auto-sync] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
