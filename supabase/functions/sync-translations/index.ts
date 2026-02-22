import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', pt: 'Portuguese', fr: 'French', zh: 'Chinese (Simplified)',
  de: 'German', hi: 'Hindi', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ru: 'Russian', ar: 'Arabic', af: 'Afrikaans',
  ko: 'Korean', tr: 'Turkish'
}

const TECHNICAL_TERMS = [
  'Pine Script', 'MQL4', 'MQL5', 'TradingView', 'ChartingPath',
  'ATR', 'EMA', 'MACD', 'RSI', 'SL', 'TP', 'BTC', 'ETH',
  'JSON', 'API', 'URL', 'USD', 'EUR', 'GBP'
]

function md5Hash(str: string): string {
  // Simple hash for stale detection (not cryptographic)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
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

interface SyncRequest {
  en_content: Record<string, any>
  target_languages?: string[]
  dry_run?: boolean
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
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const { en_content, target_languages, dry_run = false }: SyncRequest = await req.json()

    if (!en_content || typeof en_content !== 'object') {
      throw new Error('en_content (English JSON content) is required')
    }

    // Flatten the English content
    const flatEnglish = flattenObject(en_content)
    const totalKeys = Object.keys(flatEnglish).length
    console.log(`Processing ${totalKeys} English keys`)

    // Ensure all keys exist in translation_keys table (FK requirement)
    const allKeys = Object.keys(flatEnglish)
    const { data: existingKeys } = await supabase
      .from('translation_keys')
      .select('key')
    
    const existingKeySet = new Set((existingKeys || []).map((k: any) => k.key))
    const missingKeys = allKeys.filter(k => !existingKeySet.has(k))
    
    if (missingKeys.length > 0) {
      console.log(`Creating ${missingKeys.length} missing translation_keys`)
      const BATCH_SIZE_KEYS = 100
      for (let i = 0; i < missingKeys.length; i += BATCH_SIZE_KEYS) {
        const batch = missingKeys.slice(i, i + BATCH_SIZE_KEYS).map(key => {
          const parts = key.split('.')
          return {
            key,
            description: flatEnglish[key],
            category: parts[0] || 'general',
            page_context: null,
            element_context: null
          }
        })
        const { error: insertKeysError } = await supabase
          .from('translation_keys')
          .insert(batch)
        if (insertKeysError) {
          console.error(`Error inserting translation_keys batch:`, insertKeysError)
        }
      }
    }

    const languages = target_languages || Object.keys(LANGUAGE_NAMES)
    const summary: Record<string, { translated: number; skipped: number; stale: number; errors: number }> = {}

    for (const langCode of languages) {
      const langName = LANGUAGE_NAMES[langCode]
      if (!langName) {
        console.warn(`Unknown language code: ${langCode}, skipping`)
        continue
      }

      summary[langCode] = { translated: 0, skipped: 0, stale: 0, errors: 0 }

      try {
        // Get existing translations for this language
        const { data: existingTranslations, error: fetchError } = await supabase
          .from('translations')
          .select('key, value, source_hash, is_manual_override, status')
          .eq('language_code', langCode)

        if (fetchError) {
          console.error(`Error fetching ${langCode} translations:`, fetchError)
          summary[langCode].errors++
          continue
        }

        const existingMap = new Map<string, any>()
        existingTranslations?.forEach(t => existingMap.set(t.key, t))

        // Find missing and stale keys
        const keysToTranslate: Array<{ key: string; value: string; isStale: boolean }> = []

        for (const [key, value] of Object.entries(flatEnglish)) {
          const existing = existingMap.get(key)
          const currentHash = md5Hash(value)

          if (!existing) {
            // Missing key
            keysToTranslate.push({ key, value, isStale: false })
          } else if (existing.is_manual_override) {
            // Manual override - skip
            summary[langCode].skipped++
          } else if (existing.source_hash && existing.source_hash !== currentHash) {
            // Stale translation
            keysToTranslate.push({ key, value, isStale: true })
            summary[langCode].stale++
          } else {
            // Up to date
            summary[langCode].skipped++
          }
        }

        if (keysToTranslate.length === 0) {
          console.log(`${langCode}: No translations needed`)
          continue
        }

        console.log(`${langCode}: ${keysToTranslate.length} keys to translate`)

        if (dry_run) {
          summary[langCode].translated = keysToTranslate.length
          continue
        }

        // Get a few existing approved translations for tone context
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
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096,
                  }
                })
              }
            )

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text()
              console.error(`Gemini API error for ${langCode}:`, errText)
              summary[langCode].errors += batch.length
              continue
            }

            const geminiData = await geminiResponse.json()
            const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

            // Parse the JSON response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
              console.error(`Failed to parse Gemini response for ${langCode} batch ${i}`)
              summary[langCode].errors += batch.length
              continue
            }

            const translations = JSON.parse(jsonMatch[0])

            // Insert/upsert translations
            for (const item of batch) {
              const translatedValue = translations[item.key]
              if (!translatedValue) {
                summary[langCode].errors++
                continue
              }

              const sourceHash = md5Hash(item.value)

              if (item.isStale) {
                // Update stale translation
                const { error: updateError } = await supabase
                  .from('translations')
                  .update({
                    value: translatedValue,
                    source_hash: sourceHash,
                    status: 'auto_translated',
                    automation_source: 'gemini-2.0-flash',
                    original_automated_value: translatedValue,
                    updated_at: new Date().toISOString()
                  })
                  .eq('key', item.key)
                  .eq('language_code', langCode)

                if (updateError) {
                  console.error(`Error updating ${langCode}/${item.key}:`, updateError)
                  summary[langCode].errors++
                } else {
                  summary[langCode].translated++
                }
              } else {
                // Insert new translation
                const { error: insertError } = await supabase
                  .from('translations')
                  .insert({
                    key: item.key,
                    language_code: langCode,
                    value: translatedValue,
                    source_hash: sourceHash,
                    status: 'auto_translated',
                    automation_source: 'gemini-2.0-flash',
                    original_automated_value: translatedValue,
                    is_manual_override: false
                  })

                if (insertError) {
                  console.error(`Error inserting ${langCode}/${item.key}:`, insertError)
                  summary[langCode].errors++
                } else {
                  summary[langCode].translated++
                }
              }
            }

            // Small delay between batches to respect rate limits
            if (i + BATCH_SIZE < keysToTranslate.length) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }

          } catch (batchError) {
            console.error(`Batch error for ${langCode}:`, batchError)
            summary[langCode].errors += batch.length
          }
        }

      } catch (langError) {
        console.error(`Language ${langCode} error:`, langError)
        summary[langCode].errors++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_english_keys: totalKeys,
      dry_run,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sync translations error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
