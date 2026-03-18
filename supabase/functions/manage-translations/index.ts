import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface TranslationRequest {
  action: 'extract_keys' | 'get_translations' | 'submit_translation' | 'approve_translation' | 'sync_to_production' | 'get_pending_translations' | 'search_translations' | 'update_translation' | 'get_translation_details' | 'export_locale_json' | 'get_coverage_stats' | 'heal_all_gaps'
  language?: string
  namespace?: string
  keys?: Array<{ key: string; description?: string; category?: string; page_context?: string; element_context?: string }>
  translation?: { 
    key: string; 
    language_code: string; 
    value: string; 
    is_manual_override?: boolean;
    automation_source?: string;
    original_automated_value?: string;
    context_page?: string;
    context_element?: string;
  }
  translation_id?: string
  search_query?: string
  page_filter?: string
  status_filter?: string
  language_filter?: string
  limit?: number
  offset?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Support GET for direct locale JSON download: ?action=export_locale_json&language=ja
    const url = new URL(req.url)
    if (req.method === 'GET' && url.searchParams.get('action') === 'export_locale_json') {
      const lang = url.searchParams.get('language')
      if (!lang) {
        return new Response(JSON.stringify({ error: 'language param required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { data: exportData, error: exportError } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language_code', lang)
        .in('status', ['approved', 'auto_translated'])
      if (exportError) throw exportError
      const nested: Record<string, any> = {}
      exportData?.forEach((item: { key: string; value: string }) => {
        const parts = item.key.split('.')
        let current = nested
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {}
          current = current[parts[i]]
        }
        current[parts[parts.length - 1]] = item.value
      })
      return new Response(JSON.stringify(nested, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      action, 
      language, 
      namespace, 
      keys, 
      translation, 
      translation_id,
      search_query,
      page_filter,
      status_filter,
      language_filter,
      en_fallback_content,
      en_flat_keys,
      limit = 50,
      offset = 0
    }: TranslationRequest & { en_fallback_content?: Record<string, any>; en_flat_keys?: string[] } = await req.json()
    console.log('Translation management action:', action)

    switch (action) {
      case 'extract_keys': {
        // Extract new translation keys and add them to the system
        if (!keys || !Array.isArray(keys)) {
          throw new Error('Keys array is required for extract_keys action')
        }

        const results = []
        for (const keyData of keys) {
          // Insert translation key if it doesn't exist
          const { data: existingKey } = await supabase
            .from('translation_keys')
            .select('key')
            .eq('key', keyData.key)
            .single()

          if (!existingKey) {
            const { error: keyError } = await supabase
              .from('translation_keys')
              .insert({
                key: keyData.key,
                description: keyData.description || `Auto-extracted key: ${keyData.key}`,
                category: keyData.category || 'general',
                page_context: keyData.page_context,
                element_context: keyData.element_context
              })

            if (keyError) {
              console.error('Error inserting translation key:', keyError)
              continue
            }
            results.push({ key: keyData.key, status: 'created' })
          } else {
            results.push({ key: keyData.key, status: 'exists' })
          }
        }

        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_translations': {
        const { data, error } = await supabase.rpc('get_translations', {
          p_language_code: language || 'en'
        })

        if (error) throw error

        // Convert to key-value object for easier consumption
        const translations: Record<string, string> = {}
        data?.forEach((item: { key: string; value: string }) => {
          translations[item.key] = item.value
        })

        return new Response(JSON.stringify(translations), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'submit_translation': {
        if (!translation) {
          throw new Error('Translation object is required')
        }

        const { error } = await supabase
          .from('translations')
          .insert({
            key: translation.key,
            language_code: translation.language_code,
            value: translation.value,
            status: 'pending',
            created_by: null, // Could be set to user ID if authenticated
            is_manual_override: translation.is_manual_override || false,
            automation_source: translation.automation_source,
            original_automated_value: translation.original_automated_value,
            context_page: translation.context_page,
            context_element: translation.context_element
          })

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'approve_translation': {
        if (!translation_id) {
          throw new Error('Translation ID is required for approval')
        }

        const { error } = await supabase
          .from('translations')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: null // Could be set to admin user ID
          })
          .eq('id', translation_id)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_pending_translations': {
        const { data, error } = await supabase
          .from('translations')
          .select(`
            id,
            key,
            language_code,
            value,
            created_at,
            translation_keys(description, category)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'search_translations': {
        let query = supabase
          .from('translations')
          .select(`
            id,
            key,
            language_code,
            value,
            status,
            version,
            created_at,
            updated_at,
            is_manual_override,
            automation_source,
            original_automated_value,
            context_page,
            context_element,
            translation_keys(description, category, page_context, element_context)
          `)
          .order('updated_at', { ascending: false })

        // Apply filters
        if (search_query) {
          query = query.or(`key.ilike.%${search_query}%,value.ilike.%${search_query}%`)
        }
        
        if (language_filter) {
          query = query.eq('language_code', language_filter)
        }
        
        if (status_filter) {
          query = query.eq('status', status_filter)
        }
        
        if (page_filter) {
          query = query.eq('context_page', page_filter)
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) throw error

        // Get total count for pagination
        const { count: totalCount } = await supabase
          .from('translations')
          .select('*', { count: 'exact', head: true })

        return new Response(JSON.stringify({
          translations: data,
          total_count: totalCount,
          has_more: (offset + limit) < (totalCount || 0)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_translation_details': {
        if (!translation_id) {
          throw new Error('Translation ID is required')
        }

        const { data, error } = await supabase
          .from('translations')
          .select(`
            id,
            key,
            language_code,
            value,
            status,
            version,
            created_at,
            updated_at,
            reviewed_at,
            reviewed_by,
            created_by,
            is_manual_override,
            automation_source,
            original_automated_value,
            context_page,
            context_element,
            translation_keys(description, category, page_context, element_context)
          `)
          .eq('id', translation_id)
          .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'update_translation': {
        if (!translation_id || !translation) {
          throw new Error('Translation ID and translation object are required')
        }

        // If this is a manual override, preserve the original automated value
        const updateData: any = {
          value: translation.value,
          status: 'approved', // Auto-approve manual overrides
          updated_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          is_manual_override: translation.is_manual_override || true
        }

        if (translation.context_page) {
          updateData.context_page = translation.context_page
        }
        
        if (translation.context_element) {
          updateData.context_element = translation.context_element
        }

        // If this is the first manual override, save the original automated value
        if (translation.original_automated_value) {
          updateData.original_automated_value = translation.original_automated_value
          updateData.automation_source = translation.automation_source || 'system'
        }

        const { error } = await supabase
          .from('translations')
          .update(updateData)
          .eq('id', translation_id)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'sync_to_production': {
        // Get all approved translations
        const { data: approvedTranslations, error } = await supabase
          .from('translations')
          .select('key, language_code, value, is_manual_override')
          .eq('status', 'approved')

        if (error) throw error

        // Group by language
        const translationsByLanguage: Record<string, Record<string, string>> = {}
        const metadataByLanguage: Record<string, Record<string, any>> = {}
        
        approvedTranslations?.forEach((trans) => {
          if (!translationsByLanguage[trans.language_code]) {
            translationsByLanguage[trans.language_code] = {}
            metadataByLanguage[trans.language_code] = {}
          }
          translationsByLanguage[trans.language_code][trans.key] = trans.value
          metadataByLanguage[trans.language_code][trans.key] = {
            is_manual_override: trans.is_manual_override
          }
        })

        return new Response(JSON.stringify({
          success: true,
          translations: translationsByLanguage,
          metadata: metadataByLanguage,
          message: 'Use these translations to update your locale files'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'export_locale_json': {
        if (!language) {
          throw new Error('Language code is required for export')
        }

        // Get all approved + auto_translated translations for this language
        const { data: exportData, error: exportError } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language_code', language)
          .in('status', ['approved', 'auto_translated'])

        if (exportError) throw exportError

        // Build nested JSON from flat keys
        const nested: Record<string, any> = {}
        exportData?.forEach((item: { key: string; value: string }) => {
          const parts = item.key.split('.')
          let current = nested
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {}
            current = current[parts[i]]
          }
          current[parts[parts.length - 1]] = item.value
        })

        return new Response(JSON.stringify(nested, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_coverage_stats': {
        // Get DB key count
        const { count: dbKeyCount, error: keysError } = await supabase
          .from('translation_keys')
          .select('*', { count: 'exact', head: true })

        if (keysError) throw keysError

        // If client sent en_fallback_content, count those keys as the real source of truth
        let staticKeyCount = 0
        const flattenObj2 = (obj: Record<string, any>, prefix = ''): string[] => {
          const keys: string[] = []
          for (const key of Object.keys(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              keys.push(...flattenObj2(obj[key], fullKey))
            } else {
              keys.push(fullKey)
            }
          }
          return keys
        }

        let enKeysList: string[] = []
        if (en_fallback_content && typeof en_fallback_content === 'object') {
          enKeysList = flattenObj2(en_fallback_content)
          staticKeyCount = enKeysList.length

          // Auto-sync missing keys into translation_keys (fire-and-forget, batched)
          if (staticKeyCount > (dbKeyCount || 0)) {
            // Fetch existing keys from DB
            const existingKeys = new Set<string>()
            let from = 0
            const PAGE = 1000
            while (true) {
              const { data: rows, error: fetchErr } = await supabase
                .from('translation_keys')
                .select('key')
                .range(from, from + PAGE - 1)
              if (fetchErr || !rows || rows.length === 0) break
              rows.forEach((r: { key: string }) => existingKeys.add(r.key))
              if (rows.length < PAGE) break
              from += PAGE
            }

            const missing = enKeysList.filter(k => !existingKeys.has(k))
            if (missing.length > 0) {
              console.log(`[coverage] Syncing ${missing.length} missing keys to translation_keys`)
              const UPSERT_BATCH = 200
              for (let b = 0; b < missing.length; b += UPSERT_BATCH) {
                const batch = missing.slice(b, b + UPSERT_BATCH).map(key => ({
                  key,
                  category: key.split('.')[0],
                  description: `Auto-synced from en.json`,
                }))
                await supabase.from('translation_keys').upsert(batch, { onConflict: 'key' })
              }
            }
          }
        }

        // Use whichever is higher — the DB count (post-sync) or the static count
        const totalKeys = Math.max(dbKeyCount || 0, staticKeyCount)

        const targetLanguages = ['es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru', 'ar', 'af', 'ko', 'tr', 'nl', 'pl', 'vi']
        const coverage: Record<string, { total: number; translated: number; approved: number; auto_translated: number; stale: number }> = {}

        // Use head-only count queries instead of fetching all rows — prevents broken pipe timeouts
        const countQuery = async (lang: string, statuses: string[], staleOnly = false): Promise<number> => {
          let query = supabase
            .from('translations')
            .select('*', { count: 'exact', head: true })
            .eq('language_code', lang)

          if (statuses.length > 0) {
            query = query.in('status', statuses)
          }
          if (staleOnly) {
            query = query.is('source_hash', null)
          }

          const { count, error } = await query
          if (error) { console.error(`Count error ${lang}:`, error); return 0 }
          return count || 0
        }

        // Process all languages in parallel batches of 5 to avoid connection limits
        const BATCH = 5
        for (let i = 0; i < targetLanguages.length; i += BATCH) {
          const batch = targetLanguages.slice(i, i + BATCH)
          await Promise.all(batch.map(async (lang) => {
            const [translated, approved, autoTranslated, stale] = await Promise.all([
              countQuery(lang, ['approved', 'auto_translated']),
              countQuery(lang, ['approved']),
              countQuery(lang, ['auto_translated']),
              countQuery(lang, ['approved', 'auto_translated'], true),
            ])
            coverage[lang] = { total: totalKeys, translated, approved, auto_translated: autoTranslated, stale }
          }))
        }

        return new Response(JSON.stringify({ 
          total_keys: totalKeys,
          coverage 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'heal_all_gaps': {
        // Full pipeline heal: find all gaps across all languages
        const targetLanguages = ['es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru', 'ar', 'af', 'ko', 'tr', 'nl', 'pl', 'vi']

        // Use en_fallback_content from client (static en.json) for keys missing from DB
        const clientEnContent = en_fallback_content

        // Helper: flatten nested object to dot-separated keys
        const flattenObj = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
          const result: Record<string, string> = {}
          for (const key of Object.keys(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              Object.assign(result, flattenObj(obj[key], fullKey))
            } else {
              result[fullKey] = String(obj[key])
            }
          }
          return result
        }

        // 1. Get all canonical keys
        const allKeys: Array<{ key: string; category: string; description: string | null }> = []
        let from = 0
        const PAGE = 1000
        while (true) {
          const { data, error } = await supabase
            .from('translation_keys')
            .select('key, category, description')
            .range(from, from + PAGE - 1)
          if (error) throw error
          if (!data || data.length === 0) break
          allKeys.push(...data)
          if (data.length < PAGE) break
          from += PAGE
        }
        const allKeySet = new Set(allKeys.map(k => k.key))

        // 2. Get English source values from DB translations table
        const enValues: Record<string, string> = {}
        from = 0
        while (true) {
          const { data, error } = await supabase
            .from('translations')
            .select('key, value')
            .eq('language_code', 'en')
            .in('status', ['approved', 'auto_translated'])
            .range(from, from + PAGE - 1)
          if (error) throw error
          if (!data || data.length === 0) break
          data.forEach((r: { key: string; value: string }) => { enValues[r.key] = r.value })
          if (data.length < PAGE) break
          from += PAGE
        }
        const dbEnCount = Object.keys(enValues).length

        // 3. Fallback: use translation_keys.description as English source
        //    (sync-translations stores en text in description when creating keys)
        let descFallback = 0
        for (const k of allKeys) {
          if (!enValues[k.key] && k.description) {
            enValues[k.key] = k.description
            descFallback++
          }
        }

        // 4. Merge with client-provided fallback (static en.json) for any remaining gaps
        const flatClientEn = clientEnContent ? flattenObj(clientEnContent) : {}
        let enSeeded = 0
        for (const k of allKeys) {
          if (!enValues[k.key] && flatClientEn[k.key]) {
            enValues[k.key] = flatClientEn[k.key]
            enSeeded++
          }
        }
        console.log(`[heal_all_gaps] DB English: ${dbEnCount}, Description fallback: ${descFallback}, Client fallback: ${enSeeded}, Total: ${Object.keys(enValues).length}`)

        // 4. For each language, find which keys are missing translations
        const gapsByLang: Record<string, string[]> = {}
        let totalGaps = 0

        for (const lang of targetLanguages) {
          const translatedKeys = new Set<string>()
          from = 0
          while (true) {
            const { data, error } = await supabase
              .from('translations')
              .select('key')
              .eq('language_code', lang)
              .in('status', ['approved', 'auto_translated'])
              .range(from, from + PAGE - 1)
            if (error) throw error
            if (!data || data.length === 0) break
            data.forEach((r: { key: string }) => translatedKeys.add(r.key))
            if (data.length < PAGE) break
            from += PAGE
          }

          const missing = allKeys
            .filter(k => !translatedKeys.has(k.key) && enValues[k.key])
            .map(k => k.key)

          if (missing.length > 0) {
            gapsByLang[lang] = missing
            totalGaps += missing.length
          }
        }

        // 5. Build nested English content for sync-translations
        const enNested: Record<string, any> = {}
        const gapKeySet = new Set<string>()
        Object.values(gapsByLang).forEach(keys => keys.forEach(k => gapKeySet.add(k)))

        gapKeySet.forEach(key => {
          if (!enValues[key]) return
          const parts = key.split('.')
          let current = enNested
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
              current[parts[i]] = {}
            }
            current = current[parts[i]]
          }
          current[parts[parts.length - 1]] = enValues[key]
        })

        return new Response(JSON.stringify({
          total_keys: allKeySet.size,
          total_gaps: totalGaps,
          en_seeded_from_fallback: enSeeded,
          languages_with_gaps: Object.keys(gapsByLang).length,
          gaps_by_language: Object.fromEntries(
            Object.entries(gapsByLang).map(([lang, keys]) => [lang, keys.length])
          ),
          en_content: enNested,
          target_languages: Object.keys(gapsByLang)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    const rawMsg = error?.message ?? 'Unknown error';
    // Detect upstream HTML error pages (e.g. Cloudflare 502) and return a clean message
    const isHtml = rawMsg.includes('<!DOCTYPE') || rawMsg.includes('<html');
    const safeMsg = isHtml
      ? 'Upstream service temporarily unavailable (502). Please retry in a moment.'
      : rawMsg;
    console.error('Translation management error:', { message: safeMsg });
    return new Response(
      JSON.stringify({ error: safeMsg }),
      { 
        status: isHtml ? 502 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})