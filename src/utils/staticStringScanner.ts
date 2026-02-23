/**
 * Static hardcoded-string scanner.
 * 
 * Since we can't do true AST parsing in the browser, this utility works by
 * comparing the *rendered DOM text* against the English translation values.
 * Any visible text node that doesn't match a known translation value is likely
 * a hardcoded/untranslated string.
 * 
 * Usage: Call `scanDomForHardcodedStrings()` from the console or admin panel.
 */

import enTranslations from '@/i18n/locales/en.json';

/** Flatten nested JSON to dot-separated keys */
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

export interface HardcodedStringEntry {
  text: string;
  element: string;
  selector: string;
  parentComponent?: string;
}

// Words/patterns to skip (not meaningful for translation)
const SKIP_PATTERNS = [
  /^\d+$/, // pure numbers
  /^\d+[.,%]?\d*$/, // numbers with formatting
  /^[A-Z]{2,6}\/[A-Z]{2,6}$/, // currency pairs like EUR/USD
  /^[A-Z]{1,5}$/, // tickers like AAPL
  /^https?:\/\//, // URLs
  /^[@#]/, // social handles / hashtags
  /^[→←↑↓•·|—–\-+×÷=<>≤≥≈∞%$€£¥₹]+$/, // symbols
  /^\s*$/, // whitespace
  /^[0-9a-f]{8}-/, // UUIDs
  /^\d{1,2}:\d{2}/, // times
  /^\d{4}-\d{2}/, // dates
];

const MIN_TEXT_LENGTH = 2; // skip single chars

/**
 * Scan the current DOM for text nodes that aren't in the translation files.
 * Returns an array of suspected hardcoded strings.
 */
export function scanDomForHardcodedStrings(): HardcodedStringEntry[] {
  const flatEn = flattenObject(enTranslations);
  const knownValues = new Set(Object.values(flatEn).map(v => v.trim().toLowerCase()));
  
  // Also add values with interpolation placeholders replaced
  for (const val of Object.values(flatEn)) {
    const stripped = val.replace(/\{\{.*?\}\}/g, '').trim().toLowerCase();
    if (stripped.length > 2) knownValues.add(stripped);
  }

  const results: HardcodedStringEntry[] = [];
  const seen = new Set<string>();

  // Walk all text nodes in the document body
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const text = node.textContent?.trim();
        if (!text || text.length < MIN_TEXT_LENGTH) return NodeFilter.FILTER_REJECT;
        // Skip script/style/noscript
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName?.toLowerCase();
        if (['script', 'style', 'noscript', 'code', 'pre'].includes(tag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim() || '';
    const lower = text.toLowerCase();

    // Skip if matches known patterns
    if (SKIP_PATTERNS.some(p => p.test(text))) continue;

    // Skip if it's a known translation value
    if (knownValues.has(lower)) continue;

    // Skip duplicates
    if (seen.has(lower)) continue;
    seen.add(lower);

    const parent = walker.currentNode.parentElement;
    const selector = getSelector(parent);

    results.push({
      text: text.substring(0, 200), // Truncate long strings
      element: parent?.tagName?.toLowerCase() || 'unknown',
      selector,
    });
  }

  return results;
}

function getSelector(el: Element | null): string {
  if (!el) return '';
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body && parts.length < 4) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }
    if (current.className && typeof current.className === 'string') {
      const firstClass = current.className.split(' ')[0];
      if (firstClass && !firstClass.startsWith('__')) {
        part += `.${firstClass}`;
      }
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

// Expose globally
if (typeof window !== 'undefined') {
  (window as any).__scanHardcoded = scanDomForHardcodedStrings;
}
