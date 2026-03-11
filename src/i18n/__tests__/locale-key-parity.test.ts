/**
 * Build Guard: Locale Key Parity
 * 
 * Ensures every static JSON locale file contains ALL keys present in en.json.
 * This prevents the "stale static fallback" bug where guests see English
 * because the locale file is missing newer keys.
 * 
 * Runs automatically on every build/deploy via Vitest.
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

describe('Locale key parity with en.json', () => {
  for (const [langCode, translations] of Object.entries(locales)) {
    it(`${langCode}.json contains all ${enKeys.length} keys from en.json`, () => {
      const langKeys = new Set(flattenKeys(translations));
      const missing = enKeys.filter(k => !langKeys.has(k));

      if (missing.length > 0) {
        const sample = missing.slice(0, 10).join('\n  - ');
        const extra = missing.length > 10 ? `\n  ... and ${missing.length - 10} more` : '';
        expect(missing).toEqual(
          [],
          `${langCode}.json is missing ${missing.length} keys:\n  - ${sample}${extra}`
        );
      }
    });
  }
});
