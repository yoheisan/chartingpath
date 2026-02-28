/**
 * Auto Translate Articles (Server-Side Orchestrator)
 * 
 * Fully server-side orchestrator that translates all published articles
 * across all 16 languages. Designed to be triggered by a daily cron job.
 * 
 * Processes one language at a time, batching articles to stay within
 * edge function time limits. If it can't finish all languages in one
 * invocation, it picks up where it left off on the next run.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const LANGUAGES = ['es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru', 'ar', 'af', 'ko', 'tr', 'nl', 'pl']

// Max execution budget ~50s to stay safely under edge function timeout
const MAX_EXEC_MS = 50_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('[auto-translate-articles] Starting server-side orchestration')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use the existing translate-articles function for the heavy lifting
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const summary: Record<string, { translated: number; skipped: number; errors: number; remaining: number }> = {}
    let totalTranslated = 0
    let languagesCompleted = 0
    let stoppedEarly = false

    for (const lang of LANGUAGES) {
      // Time check — stop if running low
      if (Date.now() - startTime > MAX_EXEC_MS) {
        console.log(`[auto-translate-articles] Time budget exhausted after ${languagesCompleted} languages`)
        stoppedEarly = true
        break
      }

      console.log(`[auto-translate-articles] Processing ${lang}...`)
      let langTranslated = 0
      let langSkipped = 0
      let langErrors = 0
      let remaining = 0
      let offset = 0
      const batchSize = 5 // conservative to avoid timeouts in sub-function

      // Loop through batches for this language
      while (true) {
        if (Date.now() - startTime > MAX_EXEC_MS) {
          stoppedEarly = true
          break
        }

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/translate-articles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              action: 'translate_all',
              target_languages: [lang],
              batch_size: batchSize,
              offset,
            }),
          })

          if (!response.ok) {
            const errText = await response.text()
            console.error(`[auto-translate-articles] ${lang} batch error: ${response.status} ${errText}`)
            langErrors++
            break
          }

          const result = await response.json()
          langTranslated += result.translated || 0
          langSkipped += result.skipped || 0
          langErrors += result.errors || 0
          remaining = result.remaining || 0

          console.log(`[auto-translate-articles] ${lang} batch: +${result.translated} translated, ${remaining} remaining`)

          if (remaining <= 0 || result.next_offset === null) {
            break
          }

          offset = result.next_offset

          // Brief pause between batches
          await new Promise(r => setTimeout(r, 1000))
        } catch (err) {
          console.error(`[auto-translate-articles] ${lang} fetch error:`, err)
          langErrors++
          break
        }
      }

      summary[lang] = { translated: langTranslated, skipped: langSkipped, errors: langErrors, remaining }
      totalTranslated += langTranslated
      languagesCompleted++

      // Pause between languages to be gentle on Gemini RPM
      if (!stoppedEarly) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[auto-translate-articles] Done in ${duration}s. Total translated: ${totalTranslated}, Languages: ${languagesCompleted}/${LANGUAGES.length}, Stopped early: ${stoppedEarly}`)

    return new Response(JSON.stringify({
      success: true,
      total_translated: totalTranslated,
      languages_completed: languagesCompleted,
      total_languages: LANGUAGES.length,
      stopped_early: stoppedEarly,
      duration_seconds: parseFloat(duration),
      summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[auto-translate-articles] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
