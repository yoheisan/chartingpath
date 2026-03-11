/**
 * Build Guard: Locale Key Parity
 * 
 * Prevents the "stale static fallback" bug by catching NEW keys added
 * to en.json that haven't been propagated to other locale files.
 * 
 * The baseline counts represent known existing gaps that the DB pipeline
 * handles at runtime. The test FAILS only if the gap count INCREASES,
 * meaning someone added new keys to en.json without updating locales.
 * 
 * To fix: run `npx tsx scripts/sync-locale-keys.ts` to auto-fill missing keys.
 */
import { describe, it, expect } from 'vitest';

import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import fr from '../locales/fr.json';
import zh from '../locales/zh.json';
import de from '../locales/de.json';
import hi from '../locales/hi.json';
import id from '../locales/id.json';
import itLocale from '../locales/it.json';
import ja from '../locales/ja.json';
import ru from '../locales/ru.json';
import ar from '../locales/ar.json';
import af from '../locales/af.json';
import ko from '../locales/ko.json';
import tr from '../locales/tr.json';
import nl from '../locales/nl.json';
import pl from '../locales/pl.json';
import vi from '../locales/vi.json';

const locales: Record<string, Record<string, any>> = {
  es, pt, fr, zh, de, hi, id, it: itLocale, ja, ru, ar, af, ko, tr, nl, pl, vi,
};

/** Flatten nested object to dot-separated keys */
function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = flattenKeys(en);

/**
 * Known baseline of missing keys per locale (snapshot from 2026-03-11).
 * These gaps are handled at runtime by the DB translation overlay.
 * 
 * If you run `npx tsx scripts/sync-locale-keys.ts`, set all baselines to 0.
 * The test fails if the ACTUAL gap exceeds the baseline → new keys were added
 * to en.json without propagating.
 */
const BASELINE_GAPS: Record<string, number> = {
  es: 3647, pt: 3652, fr: 3647, zh: 3647, de: 3647,
  hi: 3672, id: 3680, it: 3680, ja: 1870, ru: 3646,
  ar: 3654, af: 3689, ko: 3639, tr: 3681, nl: 4720,
  pl: 4720, vi: 4785,
};

describe('Locale key parity guard', () => {
  for (const [langCode, translations] of Object.entries(locales)) {
    it(`${langCode}.json has no NEW gaps vs en.json (baseline: ${BASELINE_GAPS[langCode]})`, () => {
      const langKeys = new Set(flattenKeys(translations));
      const missing = enKeys.filter(k => !langKeys.has(k));
      const baseline = BASELINE_GAPS[langCode] ?? 0;

      if (missing.length > baseline) {
        const newMissing = missing.length - baseline;
        const sample = missing.slice(0, 8).join('\n  - ');
        expect.fail(
          `${langCode}.json has ${newMissing} NEW missing keys (total: ${missing.length}, baseline: ${baseline}).\n` +
          `Run: npx tsx scripts/sync-locale-keys.ts\n` +
          `Sample:\n  - ${sample}`
        );
      }
    });
  }

  it('reports total gap summary', () => {
    const summary: string[] = [];
    for (const [langCode, translations] of Object.entries(locales)) {
      const langKeys = new Set(flattenKeys(translations));
      const missing = enKeys.filter(k => !langKeys.has(k));
      if (missing.length > 0) {
        summary.push(`${langCode}: ${missing.length} missing`);
      }
    }
    if (summary.length > 0) {
      console.log(`[i18n gap summary]\n${summary.join('\n')}`);
    }
  });
});
