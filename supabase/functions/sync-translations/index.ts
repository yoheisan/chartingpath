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
  vi: 'Vietnamese'
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
  prepare_keys_only?: boolean
  skip_key_creation?: boolean
  max_keys?: number // Limit keys per invocation to avoid timeout
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Handle GET requests for locale export (allows lov-download-to-repo)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const langCode = url.searchParams.get('lang')
    if (langCode) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { data: translations, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language_code', langCode)
          .order('key')
        if (error) throw error
        const nested: Record<string, any> = {}
        for (const { key, value } of translations || []) {
          const parts = key.split('.')
          let current = nested
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
              current[parts[i]] = {}
            }
            current = current[parts[i]]
          }
          current[parts[parts.length - 1]] = value
        }
        return new Response(JSON.stringify(nested, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    return new Response(JSON.stringify({ error: 'lang parameter required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // Handle export_locale_json action
    if (body.action === 'export_locale_json' && body.language_code) {
      const langCode = body.language_code
      const { data: translations, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language_code', langCode)
        .order('key')

      if (error) throw error

      // Build nested JSON from flat keys
      const nested: Record<string, any> = {}
      for (const { key, value } of translations || []) {
        const parts = key.split('.')
        let current = nested
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {}
          }
          current = current[parts[i]]
        }
        current[parts[parts.length - 1]] = value
      }

      return new Response(JSON.stringify(nested, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const { en_content, target_languages, dry_run = false, prepare_keys_only = false, skip_key_creation = false, max_keys = 60 }: SyncRequest = body
    const KEY_LIMIT = Math.min(max_keys, 200) // Cap at 200 to stay within timeout

    if (!en_content || typeof en_content !== 'object') {
      throw new Error('en_content (English JSON content) is required')
    }

    // Flatten incoming English content (en.json subset/full)
    const flatEnglish = flattenObject(en_content)

    // Build source text map from extracted_strings so scanner-only keys can also be translated
    const extractedSourceMap = new Map<string, string>()
    let exFrom = 0
    const EX_PAGE = 1000
    while (true) {
      const { data: exPage, error: exError } = await supabase
        .from('extracted_strings')
        .select('string_key, original_text')
        .not('string_key', 'is', null)
        .range(exFrom, exFrom + EX_PAGE - 1)

      if (exError) {
        console.error('Error fetching extracted_strings source text:', exError)
        break
      }
      if (!exPage || exPage.length === 0) break

      for (const row of exPage as Array<{ string_key: string | null; original_text: string | null }>) {
        if (row.string_key && row.original_text && !extractedSourceMap.has(row.string_key)) {
          extractedSourceMap.set(row.string_key, row.original_text)
        }
      }

      if (exPage.length < EX_PAGE) break
      exFrom += EX_PAGE
    }

    // Expand flatEnglish with canonical keys from translation_keys (if missing from en.json payload)
    let canonicalAdded = 0
    let tkFrom = 0
    const TK_PAGE = 1000
    while (true) {
      const { data: keyPage, error: keyPageError } = await supabase
        .from('translation_keys')
        .select('key, description')
        .range(tkFrom, tkFrom + TK_PAGE - 1)

      if (keyPageError) {
        console.error('Error fetching translation_keys for canonical merge:', keyPageError)
        break
      }
      if (!keyPage || keyPage.length === 0) break

      for (const row of keyPage as Array<{ key: string; description: string | null }>) {
        if (!flatEnglish[row.key]) {
          const extractedText = extractedSourceMap.get(row.key)
          const description = row.description || ''
          const usableDescription =
            description &&
            !description.startsWith('Auto-synced from en.json') &&
            !description.startsWith('Auto-imported from extracted_strings')
              ? description
              : null

          flatEnglish[row.key] = extractedText || usableDescription || row.key
          canonicalAdded++
        }
      }

      if (keyPage.length < TK_PAGE) break
      tkFrom += TK_PAGE
    }

    const totalKeys = Object.keys(flatEnglish).length
    console.log(`Processing ${totalKeys} English keys (${canonicalAdded} canonical-only keys added)`)

    // Paginate to avoid 1000-row default limit
    const existingKeySet = new Set<string>()

    // Ensure all keys exist in translation_keys table (FK requirement)
    if (!skip_key_creation) {
      const allKeys = Object.keys(flatEnglish)
      let from = 0
      const PAGE_SIZE = 1000
      while (true) {
        const { data: page, error: pageError } = await supabase
          .from('translation_keys')
          .select('key')
          .range(from, from + PAGE_SIZE - 1)
        if (pageError) {
          console.error('Error fetching translation_keys page:', pageError)
          break
        }
        if (!page || page.length === 0) break
        for (const k of page) existingKeySet.add(k.key)
        if (page.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      console.log(`Found ${existingKeySet.size} existing translation_keys`)
      
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
            .upsert(batch, { onConflict: 'key', ignoreDuplicates: false })
          if (insertKeysError) {
            console.error(`Error inserting translation_keys batch:`, insertKeysError)
          }
        }
      }

      // Also update descriptions for existing keys that may have NULL descriptions
      const existingKeysToUpdate = allKeys.filter(k => existingKeySet.has(k))
      if (existingKeysToUpdate.length > 0) {
        console.log(`Updating descriptions for ${existingKeysToUpdate.length} existing translation_keys`)
        const BATCH_SIZE_KEYS = 100
        for (let i = 0; i < existingKeysToUpdate.length; i += BATCH_SIZE_KEYS) {
          const batch = existingKeysToUpdate.slice(i, i + BATCH_SIZE_KEYS).map(key => ({
            key,
            description: flatEnglish[key],
          }))
          const { error: updateError } = await supabase
            .from('translation_keys')
            .upsert(batch, { onConflict: 'key', ignoreDuplicates: false })
          if (updateError) {
            console.error(`Error updating translation_keys descriptions:`, updateError)
          }
        }
      }
    }

    // Prune orphan keys that no longer exist in en.json
    const enKeySet = new Set(Object.keys(flatEnglish))
    const orphanKeys: string[] = []
    for (const k of existingKeySet) {
      if (!enKeySet.has(k)) orphanKeys.push(k)
    }
    if (orphanKeys.length > 0) {
      console.log(`Pruning ${orphanKeys.length} orphan keys no longer in en.json`)
      // Delete from translations first (FK), then translation_keys
      const PRUNE_BATCH = 100
      for (let i = 0; i < orphanKeys.length; i += PRUNE_BATCH) {
        const batch = orphanKeys.slice(i, i + PRUNE_BATCH)
        await supabase.from('translations').delete().in('key', batch)
        await supabase.from('translation_keys').delete().in('key', batch)
      }
    }

    // If only preparing keys, return early
    if (prepare_keys_only) {
      return new Response(JSON.stringify({
        success: true,
        total_english_keys: totalKeys,
        keys_prepared: true,
        orphan_keys_pruned: orphanKeys.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
        // Get existing translations for this language (paginated to avoid 1000-row limit)
        const allExistingTranslations: any[] = []
        let txFrom = 0
        const TX_PAGE = 1000
        while (true) {
          const { data: txPage, error: fetchError } = await supabase
            .from('translations')
            .select('key, value, source_hash, is_manual_override, status')
            .eq('language_code', langCode)
            .range(txFrom, txFrom + TX_PAGE - 1)
          if (fetchError) {
            console.error(`Error fetching ${langCode} translations:`, fetchError)
            summary[langCode].errors++
            break
          }
          if (!txPage || txPage.length === 0) break
          allExistingTranslations.push(...txPage)
          if (txPage.length < TX_PAGE) break
          txFrom += TX_PAGE
        }

        const existingMap = new Map<string, any>()
        allExistingTranslations.forEach(t => existingMap.set(t.key, t))

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

        const totalRemaining = keysToTranslate.length
        // Chunk: only process up to KEY_LIMIT keys per invocation
        const keysThisRun = keysToTranslate.slice(0, KEY_LIMIT)
        const remainingAfter = totalRemaining - keysThisRun.length

        console.log(`${langCode}: ${keysThisRun.length}/${totalRemaining} keys this run (${remainingAfter} remaining)`)

        if (dry_run) {
          summary[langCode].translated = keysThisRun.length
          ;(summary[langCode] as any).remaining = remainingAfter
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
        for (let i = 0; i < keysThisRun.length; i += BATCH_SIZE) {
          const batch = keysThisRun.slice(i, i + BATCH_SIZE)

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

            // Sanitize control characters inside JSON string values that Gemini sometimes includes
            // We need to strip ALL control chars (0x00-0x1F, 0x7F) except structural JSON whitespace
            // between tokens. The safest approach: strip them all, then the JSON structure (braces,
            // brackets, colons, commas) plus spaces/newlines between tokens remain valid.
            const sanitized = jsonMatch[0]
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip non-standard control chars
              .replace(/\t/g, ' ') // replace tabs with spaces
            let translations: Record<string, string>
            try {
              translations = JSON.parse(sanitized)
            } catch {
              // Last resort: strip ALL control chars including newlines inside strings
              const aggressive = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, ' ')
              translations = JSON.parse(aggressive)
            }

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
            if (i + BATCH_SIZE < keysThisRun.length) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }

          } catch (batchError) {
            console.error(`Batch error for ${langCode}:`, batchError)
            summary[langCode].errors += batch.length
          }
        }

        // Add remaining count to summary
        ;(summary[langCode] as any).remaining = remainingAfter

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
