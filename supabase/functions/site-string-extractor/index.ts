const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DomStringPayload {
  text: string;
  path: string;
  element: string;
  selector: string;
}

interface StringExtractionRequest {
  action:
    | 'start_scan'
    | 'ingest_strings'
    | 'complete_scan'
    | 'mark_failed'
    | 'get_scan_status'
    | 'get_scan_results'
    | 'compare_versions'
    | 'approve_strings'
    | 'diff_missing_translations'
    | 'auto_approve_and_translate';
  scan_session_id?: string;
  base_url?: string;
  old_version?: number;
  new_version?: number;
  string_ids?: string[];
  strings?: DomStringPayload[];
  error_message?: string;
  language_codes?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: StringExtractionRequest = await req.json();
    const { action, scan_session_id, base_url, old_version, new_version, string_ids, strings, error_message } = body;

    switch (action) {
      // ─── Start Scan ─────────────────────────────────────────
      case 'start_scan': {
        if (!base_url) throw new Error('Base URL is required for scanning');

        const { data: latestSession } = await supabase
          .from('site_scan_sessions')
          .select('version_number')
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        const newVersionNumber = (latestSession?.version_number || 0) + 1;

        const { data: scanSession, error: sessionError } = await supabase
          .from('site_scan_sessions')
          .insert({
            version_number: newVersionNumber,
            scan_status: 'in_progress',
            scan_metadata: { base_url },
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        return jsonResponse({
          scan_session_id: scanSession.id,
          version_number: newVersionNumber,
          status: 'started',
        });
      }

      // ─── Ingest Strings ─────────────────────────────────────
      case 'ingest_strings': {
        if (!scan_session_id) throw new Error('Scan session ID is required');
        if (!Array.isArray(strings) || strings.length === 0) {
          return jsonResponse({ success: true, inserted: 0 });
        }

        const seen = new Set<string>();
        const rows: any[] = [];

        for (const s of strings) {
          const text = (s?.text || '').trim();
          if (!text || text.length < 2) continue;
          if (!isTranslatableText(text)) continue;

          const element = (s?.element || 'text').toString();
          const selector = (s?.selector || '').toString();
          const path = (s?.path || '').toString();

          const stringKey = generateStringKey(text, element);
          const stringHash = await generateHash(text);

          const unique = `${stringKey}_${stringHash}_${path}`;
          if (seen.has(unique)) continue;
          seen.add(unique);

          rows.push({
            scan_session_id,
            string_key: stringKey,
            original_text: text,
            context_path: path,
            context_element: element,
            context_selector: selector,
            string_hash: stringHash,
            extraction_method: 'dom',
            is_translatable: true,
            review_status: 'pending',
          });
        }

        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
          const slice = rows.slice(i, i + BATCH);
          const { error } = await supabase.from('extracted_strings').insert(slice);
          if (error) {
            console.error('Insert extracted_strings batch error:', error);
            throw error;
          }
        }

        return jsonResponse({ success: true, inserted: rows.length });
      }

      // ─── Complete Scan ──────────────────────────────────────
      case 'complete_scan': {
        if (!scan_session_id) throw new Error('Scan session ID is required');

        const { count } = await supabase
          .from('extracted_strings')
          .select('*', { count: 'exact', head: true })
          .eq('scan_session_id', scan_session_id);

        await supabase
          .from('site_scan_sessions')
          .update({
            scan_status: 'completed',
            total_strings_found: count || 0,
            completed_at: new Date().toISOString(),
          })
          .eq('id', scan_session_id);

        return jsonResponse({ success: true, total_strings_found: count || 0 });
      }

      // ─── Mark Failed ────────────────────────────────────────
      case 'mark_failed': {
        if (!scan_session_id) throw new Error('Scan session ID is required');

        await supabase
          .from('site_scan_sessions')
          .update({
            scan_status: 'failed',
            completed_at: new Date().toISOString(),
            scan_metadata: { error: error_message || 'unknown' },
          })
          .eq('id', scan_session_id);

        return jsonResponse({ success: true });
      }

      // ─── Get Scan Status ────────────────────────────────────
      case 'get_scan_status': {
        if (!scan_session_id) throw new Error('Scan session ID is required');

        const { data: session, error } = await supabase
          .from('site_scan_sessions')
          .select('*')
          .eq('id', scan_session_id)
          .single();

        if (error) throw error;

        const { count: extractedCount } = await supabase
          .from('extracted_strings')
          .select('*', { count: 'exact', head: true })
          .eq('scan_session_id', scan_session_id);

        return jsonResponse({ ...session, current_extracted_count: extractedCount });
      }

      // ─── Get Scan Results (paginated) ───────────────────────
      case 'get_scan_results': {
        if (!scan_session_id) throw new Error('Scan session ID is required');

        // Paginate to avoid 1000-row limit
        const allStrings: any[] = [];
        let from = 0;
        const PAGE = 1000;
        while (true) {
          const { data, error } = await supabase
            .from('extracted_strings')
            .select('*')
            .eq('scan_session_id', scan_session_id)
            .order('created_at', { ascending: false })
            .range(from, from + PAGE - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;
          allStrings.push(...data);
          if (data.length < PAGE) break;
          from += PAGE;
        }

        return jsonResponse(allStrings);
      }

      // ─── Compare Versions ──────────────────────────────────
      case 'compare_versions': {
        if (!old_version || !new_version) throw new Error('Both old and new version numbers are required');

        const { data: oldSession } = await supabase
          .from('site_scan_sessions')
          .select('id')
          .eq('version_number', old_version)
          .single();

        const { data: newSession } = await supabase
          .from('site_scan_sessions')
          .select('id')
          .eq('version_number', new_version)
          .single();

        if (!oldSession || !newSession) {
          const { data: availableVersions } = await supabase
            .from('site_scan_sessions')
            .select('version_number, scan_status, created_at')
            .order('version_number', { ascending: false })
            .limit(10);

          throw new Error(
            `Version(s) not found. Requested: v${old_version} and v${new_version}. ` +
              `Available versions: ${availableVersions?.map((v: any) => `v${v.version_number} (${v.scan_status})`).join(', ') || 'none'}.`
          );
        }

        await compareAndLogChanges(supabase, oldSession.id, newSession.id);

        const { data: changes, error } = await supabase
          .from('string_change_log')
          .select('*')
          .eq('old_scan_session_id', oldSession.id)
          .eq('new_scan_session_id', newSession.id);

        if (error) throw error;
        return jsonResponse(changes);
      }

      // ─── Approve Strings ───────────────────────────────────
      case 'approve_strings': {
        if (!string_ids || string_ids.length === 0) throw new Error('String IDs are required for approval');

        const { error } = await supabase
          .from('extracted_strings')
          .update({
            review_status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .in('id', string_ids);

        if (error) throw error;

        await createTranslationKeysFromStrings(supabase, string_ids);

        return jsonResponse({ success: true });
      }

      // ─── NEW: Diff Missing Translations ─────────────────────
      // Finds extracted strings from the latest completed scan that
      // do NOT yet exist in `translation_keys`. These are the gaps.
      case 'diff_missing_translations': {
        // Get latest completed scan
        const { data: latestScan } = await supabase
          .from('site_scan_sessions')
          .select('id')
          .eq('scan_status', 'completed')
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        if (!latestScan) {
          return jsonResponse({ missing: [], message: 'No completed scans found' });
        }

        // Get all extracted string_keys from that scan
        const extractedKeys = new Set<string>();
        let from = 0;
        const PAGE = 1000;
        while (true) {
          const { data } = await supabase
            .from('extracted_strings')
            .select('string_key')
            .eq('scan_session_id', latestScan.id)
            .range(from, from + PAGE - 1);
          if (!data || data.length === 0) break;
          data.forEach((r: any) => extractedKeys.add(r.string_key));
          if (data.length < PAGE) break;
          from += PAGE;
        }

        // Get all existing translation_keys
        const existingKeys = new Set<string>();
        from = 0;
        while (true) {
          const { data } = await supabase
            .from('translation_keys')
            .select('key')
            .range(from, from + PAGE - 1);
          if (!data || data.length === 0) break;
          data.forEach((r: any) => existingKeys.add(r.key));
          if (data.length < PAGE) break;
          from += PAGE;
        }

        // Diff: keys in extracted but not in translation_keys
        const missing = [...extractedKeys].filter(k => !existingKeys.has(k));

        console.log(`[diff_missing] Extracted: ${extractedKeys.size}, Existing keys: ${existingKeys.size}, Missing: ${missing.length}`);

        return jsonResponse({
          scan_session_id: latestScan.id,
          total_extracted: extractedKeys.size,
          total_existing_keys: existingKeys.size,
          missing_count: missing.length,
          missing_keys: missing.slice(0, 500), // cap response size
        });
      }

      // ─── NEW: Auto-Approve and Translate ────────────────────
      // Server-side action: takes the latest scan, approves all pending
      // strings that pass quality checks, creates translation keys, and
      // triggers auto-translation. Designed to be called by a cron job.
      case 'auto_approve_and_translate': {
        // Get latest completed scan
        const { data: latestScan } = await supabase
          .from('site_scan_sessions')
          .select('id')
          .eq('scan_status', 'completed')
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        if (!latestScan) {
          return jsonResponse({ success: false, message: 'No completed scans found' });
        }

        // Find all pending strings from this scan
        const pendingIds: string[] = [];
        let from = 0;
        const PAGE = 1000;
        while (true) {
          const { data } = await supabase
            .from('extracted_strings')
            .select('id, original_text')
            .eq('scan_session_id', latestScan.id)
            .eq('review_status', 'pending')
            .eq('is_translatable', true)
            .range(from, from + PAGE - 1);
          if (!data || data.length === 0) break;
          // Additional quality filter: at least 3 chars and contains a word
          for (const row of data) {
            if (row.original_text?.trim().length >= 3 && /[a-zA-Z]{2,}/.test(row.original_text)) {
              pendingIds.push(row.id);
            }
          }
          if (data.length < PAGE) break;
          from += PAGE;
        }

        if (pendingIds.length === 0) {
          return jsonResponse({ success: true, approved: 0, message: 'No pending strings to approve' });
        }

        console.log(`[auto_approve] Approving ${pendingIds.length} strings from scan ${latestScan.id}`);

        // Approve in batches
        const APPROVE_BATCH = 200;
        for (let i = 0; i < pendingIds.length; i += APPROVE_BATCH) {
          const batch = pendingIds.slice(i, i + APPROVE_BATCH);
          await supabase
            .from('extracted_strings')
            .update({
              review_status: 'approved',
              reviewed_at: new Date().toISOString(),
            })
            .in('id', batch);
        }

        // Create translation keys + auto-translate
        // Process in chunks to avoid timeouts
        const TRANSLATE_BATCH = 50;
        for (let i = 0; i < pendingIds.length; i += TRANSLATE_BATCH) {
          const batch = pendingIds.slice(i, i + TRANSLATE_BATCH);
          await createTranslationKeysFromStrings(supabase, batch);
        }

        console.log(`[auto_approve] Done. Approved and translated ${pendingIds.length} strings.`);

        return jsonResponse({
          success: true,
          approved: pendingIds.length,
          scan_session_id: latestScan.id,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in site-string-extractor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Helpers ──────────────────────────────────────────────

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isTranslatableText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  if (/^[\d\s\-_.,!@#$%^&*()+=\[\]{}|\\:";'<>?/~`]*$/.test(text)) return false;

  const technicalPatterns = [
    /^[a-z]+\.[a-z]+$/i,
    /^https?:\/\//i,
    /^[a-f0-9]{8,}$/i,
    /^\d{4}-\d{2}-\d{2}/,
    /^[\w\-_.]+@[\w\-_.]+\.\w+$/i,
  ];

  for (const pattern of technicalPatterns) {
    if (pattern.test(text.trim())) return false;
  }

  if (!/[a-zA-Z]/.test(text)) return false;
  return true;
}

function generateStringKey(text: string, context: string): string {
  const cleanText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  const contextKey = context
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);

  return `${contextKey}_${cleanText}`;
}

async function generateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function compareAndLogChanges(supabase: any, oldSessionId: string, newSessionId: string) {
  const { data: oldStrings } = await supabase
    .from('extracted_strings')
    .select('string_key, original_text, string_hash')
    .eq('scan_session_id', oldSessionId);

  const { data: newStrings } = await supabase
    .from('extracted_strings')
    .select('string_key, original_text, string_hash')
    .eq('scan_session_id', newSessionId);

  const oldMap = new Map();
  const newMap = new Map();

  oldStrings?.forEach((s: any) => oldMap.set(s.string_key, s));
  newStrings?.forEach((s: any) => newMap.set(s.string_key, s));

  const changes: any[] = [];

  for (const [key, newString] of newMap) {
    if (!oldMap.has(key)) {
      changes.push({
        string_key: key,
        old_scan_session_id: oldSessionId,
        new_scan_session_id: newSessionId,
        change_type: 'added',
        new_text: newString.original_text,
        new_hash: newString.string_hash,
      });
    } else {
      const oldString = oldMap.get(key);
      if (oldString.string_hash !== newString.string_hash) {
        changes.push({
          string_key: key,
          old_scan_session_id: oldSessionId,
          new_scan_session_id: newSessionId,
          change_type: 'modified',
          old_text: oldString.original_text,
          new_text: newString.original_text,
          old_hash: oldString.string_hash,
          new_hash: newString.string_hash,
        });
      }
    }
  }

  for (const [key, oldString] of oldMap) {
    if (!newMap.has(key)) {
      changes.push({
        string_key: key,
        old_scan_session_id: oldSessionId,
        new_scan_session_id: newSessionId,
        change_type: 'removed',
        old_text: oldString.original_text,
        old_hash: oldString.string_hash,
      });
    }
  }

  if (changes.length > 0) {
    await supabase.from('string_change_log').insert(changes);
  }

  await supabase
    .from('site_scan_sessions')
    .update({
      new_strings_count: changes.filter((c) => c.change_type === 'added').length,
      modified_strings_count: changes.filter((c) => c.change_type === 'modified').length,
    })
    .eq('id', newSessionId);
}

async function createTranslationKeysFromStrings(supabase: any, stringIds: string[]) {
  const { data: strings } = await supabase.from('extracted_strings').select('*').in('id', stringIds);

  const newKeys: Array<{ key: string; value: string }> = [];

  for (const string of strings || []) {
    const { error: keyError } = await supabase.from('translation_keys').upsert({
      key: string.string_key,
      description: `Auto-extracted: ${string.original_text.substring(0, 100)}`,
      category: 'auto_extracted',
      page_context: string.context_path,
      element_context: string.context_element,
    });

    if (keyError) {
      console.error('Error creating translation key:', keyError);
      continue;
    }

    await supabase.from('translations').upsert({
      key: string.string_key,
      language_code: 'en',
      value: string.original_text,
      status: 'approved',
      automation_source: 'site_scanner',
      context_page: string.context_path,
      context_element: string.context_element,
    }, { onConflict: 'key,language_code' });

    newKeys.push({ key: string.string_key, value: string.original_text });
  }

  if (newKeys.length > 0) {
    await autoTranslateStrings(supabase, newKeys);
  }
}

const TARGET_LANGUAGES: Record<string, string> = {
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  de: 'German',
  hi: 'Hindi',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ru: 'Russian',
  ar: 'Arabic',
  af: 'Afrikaans',
  ko: 'Korean',
  tr: 'Turkish',
};

async function autoTranslateStrings(supabase: any, keys: Array<{ key: string; value: string }>) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY not set, skipping auto-translation');
    return;
  }

  console.log(`Auto-translating ${keys.length} strings into ${Object.keys(TARGET_LANGUAGES).length} languages`);

  const sourceMap: Record<string, string> = {};
  for (const k of keys) {
    sourceMap[k.key] = k.value;
  }

  for (const [langCode, langName] of Object.entries(TARGET_LANGUAGES)) {
    try {
      const prompt = `Translate the following JSON values from English to ${langName}. Keep JSON keys unchanged. Return ONLY valid JSON, no markdown fences.\n\n${JSON.stringify(sourceMap, null, 2)}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
          }),
        }
      );

      if (!response.ok) {
        console.error(`Gemini API error for ${langCode}: ${response.status}`);
        await response.text();
        continue;
      }

      const result = await response.json();
      let rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      rawText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      rawText = rawText.replace(/[\x00-\x1F\x7F]/g, (ch: string) => (ch === '\n' || ch === '\t' ? ch : ''));

      const translated: Record<string, string> = JSON.parse(rawText);

      for (const [key, value] of Object.entries(translated)) {
        if (typeof value !== 'string' || !value.trim()) continue;

        await supabase.from('translations').upsert(
          {
            key,
            language_code: langCode,
            value: value.trim(),
            status: 'auto_translated',
            automation_source: 'site_scanner_auto',
            context_page: 'auto_extracted',
          },
          { onConflict: 'key,language_code' }
        );
      }

      console.log(`✓ Translated ${Object.keys(translated).length} strings to ${langName}`);
    } catch (error) {
      console.error(`Error translating to ${langName}:`, error);
    }
  }

  console.log('Auto-translation complete');
}
