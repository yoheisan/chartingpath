import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslationRequest {
  action: 'extract_keys' | 'get_translations' | 'submit_translation' | 'approve_translation' | 'sync_to_production' | 'get_pending_translations'
  language?: string
  namespace?: string
  keys?: Array<{ key: string; description?: string; category?: string }>
  translation?: { key: string; language_code: string; value: string }
  translation_id?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, language, namespace, keys, translation, translation_id }: TranslationRequest = await req.json()
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
                category: keyData.category || 'general'
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
            created_by: null // Could be set to user ID if authenticated
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

      case 'sync_to_production': {
        // Get all approved translations
        const { data: approvedTranslations, error } = await supabase
          .from('translations')
          .select('key, language_code, value')
          .eq('status', 'approved')

        if (error) throw error

        // Group by language
        const translationsByLanguage: Record<string, Record<string, string>> = {}
        
        approvedTranslations?.forEach((trans) => {
          if (!translationsByLanguage[trans.language_code]) {
            translationsByLanguage[trans.language_code] = {}
          }
          translationsByLanguage[trans.language_code][trans.key] = trans.value
        })

        return new Response(JSON.stringify({
          success: true,
          translations: translationsByLanguage,
          message: 'Use these translations to update your locale files'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Translation management error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})