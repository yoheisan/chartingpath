import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', pt: 'Portuguese', fr: 'French', zh: 'Chinese (Simplified)',
  de: 'German', hi: 'Hindi', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ru: 'Russian', ar: 'Arabic', af: 'Afrikaans',
  ko: 'Korean', tr: 'Turkish', nl: 'Dutch'
}

const TECHNICAL_TERMS = [
  'Pine Script', 'MQL4', 'MQL5', 'TradingView', 'ChartingPath',
  'ATR', 'EMA', 'MACD', 'RSI', 'SL', 'TP', 'BTC', 'ETH',
  'JSON', 'API', 'URL', 'USD', 'EUR', 'GBP'
]

function md5Hash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

async function paginatedSelect(
  supabase: any,
  table: string,
  selectCols: string,
  filters?: Record<string, string>
): Promise<any[]> {
  const results: any[] = []
  let from = 0
  const PAGE = 1000
  while (true) {
    let query = supabase.from(table).select(selectCols).range(from, from + PAGE - 1)
    if (filters) {
      for (const [col, val] of Object.entries(filters)) {
        query = query.eq(col, val)
      }
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('[auto-sync-translations] Starting automated translation sync')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    // Step 1: Build English source from translation_keys (authoritative source)
    // translation_keys.description stores the English value synced from en.json
    const allKeys = await paginatedSelect(supabase, 'translation_keys', 'key, description')
    
    const enMap = new Map<string, string>()
    for (const k of allKeys) {
      if (k.description) enMap.set(k.key, k.description)
    }

    // Overlay any explicit English translations (rare but possible)
    const enTranslations = await paginatedSelect(supabase, 'translations', 'key, value', { language_code: 'en' })
    for (const t of enTranslations) {
      enMap.set(t.key, t.value)
    }
    console.log(`[auto-sync-translations] ${enMap.size} English source keys`)

    if (enMap.size === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No English keys found, nothing to sync' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 2: For each language, find missing translations and fill gaps
    const languages = Object.keys(LANGUAGE_NAMES)
    const summary: Record<string, { translated: number; skipped: number; errors: number }> = {}
    let totalNewTranslations = 0

    for (const langCode of languages) {
      const langName = LANGUAGE_NAMES[langCode]
      summary[langCode] = { translated: 0, skipped: 0, errors: 0 }

      try {
        // Get existing translations for this language
        const existing = await paginatedSelect(supabase, 'translations', 'key, value, source_hash, is_manual_override', { language_code: langCode })
        const existingMap = new Map<string, any>()
        existing.forEach(t => existingMap.set(t.key, t))

        // Find missing and stale keys
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

        if (keysToTranslate.length === 0) {
          continue
        }

        console.log(`[auto-sync-translations] ${langCode}: ${keysToTranslate.length} keys to translate`)

        // Get tone context
        const { data: toneContext } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language_code', langCode)
          .eq('status', 'approved')
          .limit(3)

        // Batch translate (20 keys per batch)
        const BATCH_SIZE = 20
        for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
          const batch = keysToTranslate.slice(i, i + BATCH_SIZE)
          const keysForPrompt = batch.map(k => `"${k.key}": "${k.value}"`).join('\n')
          const toneExamples = toneContext?.map(t => `"${t.key}": "${t.value}"`).join('\n') || 'None available'

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

          try {
            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
                })
              }
            )

            if (!geminiResponse.ok) {
              console.error(`Gemini error for ${langCode}:`, await geminiResponse.text())
              summary[langCode].errors += batch.length
              continue
            }

            const geminiData = await geminiResponse.json()
            const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
              summary[langCode].errors += batch.length
              continue
            }

            const sanitized = jsonMatch[0]
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
              .replace(/\t/g, ' ')
            let translations: Record<string, string>
            try {
              translations = JSON.parse(sanitized)
            } catch {
              const aggressive = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, ' ')
              translations = JSON.parse(aggressive)
            }

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
                // Ensure key exists in translation_keys
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

            // Rate limit pause between batches
            if (i + BATCH_SIZE < keysToTranslate.length) {
              await new Promise(r => setTimeout(r, 1000))
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
    console.log(`[auto-sync-translations] Completed in ${duration}s. Total new: ${totalNewTranslations}`)

    return new Response(JSON.stringify({
      success: true,
      total_english_keys: enMap.size,
      total_new_translations: totalNewTranslations,
      duration_seconds: parseFloat(duration),
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[auto-sync-translations] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
