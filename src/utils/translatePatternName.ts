import i18n from '@/i18n/config';

/**
 * Translates a pattern name from the database using the patternNames namespace.
 * Falls back to the original English name if no translation exists.
 */
export function translatePatternName(name: string): string {
  const key = `patternNames.${name}`;
  const translated = i18n.t(key, { defaultValue: name });
  return translated;
}
