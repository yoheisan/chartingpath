/**
 * Auto-sync script: copies missing keys from en.json into all locale files
 * using English text as placeholder. Run via: npx tsx scripts/sync-locale-keys.ts
 * 
 * This ensures static JSON fallbacks are never stale for guests.
 * The DB translation pipeline will later replace these with proper translations.
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');

const LANG_CODES = [
  'es', 'pt', 'fr', 'zh', 'de', 'hi', 'id', 'it', 'ja', 'ru',
  'ar', 'af', 'ko', 'tr', 'nl', 'pl', 'vi',
];

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key]);
    }
  }
  return result;
}

function setNestedKey(obj: Record<string, any>, dotKey: string, value: string) {
  const parts = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
const flatEn = flattenObject(en);
const enKeys = Object.keys(flatEn);

let totalAdded = 0;

for (const lang of LANG_CODES) {
  const langPath = path.join(LOCALES_DIR, `${lang}.json`);
  const langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
  const flatLang = flattenObject(langData);
  
  const missing = enKeys.filter(k => !(k in flatLang));
  
  if (missing.length === 0) {
    console.log(`✓ ${lang}.json — complete`);
    continue;
  }

  for (const key of missing) {
    setNestedKey(langData, key, flatEn[key]); // English placeholder
  }

  fs.writeFileSync(langPath, JSON.stringify(langData, null, 2) + '\n', 'utf-8');
  console.log(`⚡ ${lang}.json — added ${missing.length} keys (English placeholders)`);
  totalAdded += missing.length;
}

console.log(`\nDone. Added ${totalAdded} placeholder entries across ${LANG_CODES.length} locales.`);
console.log('These will be replaced by proper translations via the DB pipeline.');
