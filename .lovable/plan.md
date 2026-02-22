

# Automated Translation Pipeline Implementation

## Overview

Build a `sync-translations` edge function that detects missing/stale translations across all 14 non-English locales and uses Gemini to auto-translate them. Enhance the existing Translation Management admin page with coverage stats and a "Sync Now" trigger.

## What This Solves

- Spanish (and other locales) are missing keys like `hero.headline1`, `hero.headline2`, `projects.*`
- No automated way to detect or fill gaps when new English content is added
- Manual translation is not scalable across 14 languages

## Implementation Steps

### Step 1: Database Schema Update

Add columns to the `translations` table to support stale detection:
- `source_hash` (text) -- MD5 hash of the English source value, used to detect when source text changes
- Allow `auto_translated` as a valid status alongside `pending` and `approved`

### Step 2: Create `sync-translations` Edge Function

Core logic:
1. Accept `en.json` content (flattened key-value pairs) and a list of target language codes
2. For each target language, query the `translations` table to find:
   - Missing keys (no translation exists)
   - Stale keys (source_hash differs from current English value hash)
3. Skip keys where `is_manual_override = true` (never overwrite human edits)
4. Batch missing keys (20-30 per call) and send to Gemini 2.0 Flash with context-aware prompts
5. Insert results into `translations` table with status `auto_translated`
6. Return a summary: per-language counts of translated, skipped, stale keys

Gemini prompt strategy:
- Include key path for context (e.g., `pricing.plans.pro.description`)
- Include 2-3 existing approved translations in the target language for tone consistency
- Instruct to preserve technical terms (Pine Script, MQL4, ATR, EMA, etc.)
- Target language name and code

### Step 3: Add `export_locale_json` Action to `manage-translations`

New action in the existing edge function that:
- Fetches all approved translations for a given language
- Structures them as nested JSON matching `en.json` format (e.g., `hero.headline1` becomes `{ hero: { headline1: "..." } }`)
- Returns downloadable JSON content

### Step 4: Enhance Translation Management Admin UI

Add to the existing `TranslationManagement.tsx` page:
- **Coverage Dashboard** section showing per-language completion percentage (e.g., "Spanish: 142/170 -- 83%")
- **"Sync Now" button** that triggers the sync-translations function with current en.json keys
- **Progress indicator** during sync (shows which language is being processed)
- **"Export JSON" button** per language to download the generated locale file
- **Stale indicator** badge on translations where the English source changed since last translation

### Step 5: Integration with Admin Content Management

Add a "Translations" tab to `AdminContentManagement.tsx` that links to the Translation Management page or embeds a summary widget showing coverage stats.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/...` | Create | Add `source_hash` column, update status enum |
| `supabase/functions/sync-translations/index.ts` | Create | Core auto-translation pipeline |
| `supabase/functions/manage-translations/index.ts` | Modify | Add `export_locale_json` action |
| `src/pages/TranslationManagement.tsx` | Modify | Add coverage dashboard, sync button, export |
| `src/pages/AdminContentManagement.tsx` | Modify | Add Translations tab |
| `supabase/config.toml` | Modify | Register sync-translations function |

## Safeguards

- Manual overrides (`is_manual_override = true`) are never overwritten
- Source hash tracking detects when English text changes, flagging translations as stale
- Gemini calls are batched (20-30 keys per request) to stay within rate limits
- Error handling per language -- if one language fails, others continue
- Existing GEMINI_API_KEY secret is already configured and will be used

