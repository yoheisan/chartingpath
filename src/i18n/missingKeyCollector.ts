/**
 * Runtime missing-key collector for i18next.
 * Captures every t() call that falls back to the English default,
 * letting you see exactly which keys are untranslated at runtime.
 */

export interface MissingKeyEntry {
  key: string;
  namespace: string;
  language: string;
  fallbackValue: string;
  firstSeenAt: number;
  count: number;
  /** The component/page route where this was first seen */
  route?: string;
}

class MissingKeyCollector {
  private keys = new Map<string, MissingKeyEntry>();
  private listeners = new Set<() => void>();
  private enabled = false;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  /** i18next missingKeyHandler callback */
  handler = (lngs: readonly string[], ns: string, key: string, fallbackValue: string) => {
    if (!this.enabled) return;
    // Skip English — it's the source
    const lang = Array.isArray(lngs) ? lngs[0] : String(lngs);
    if (lang === 'en') return;

    const compositeKey = `${lang}::${key}`;
    const existing = this.keys.get(compositeKey);
    if (existing) {
      existing.count++;
      return;
    }

    this.keys.set(compositeKey, {
      key,
      namespace: ns,
      language: lang,
      fallbackValue,
      firstSeenAt: Date.now(),
      count: 1,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    this.notify();
  };

  /** Get all collected missing keys */
  getAll(): MissingKeyEntry[] {
    return Array.from(this.keys.values());
  }

  /** Get missing keys grouped by language */
  getByLanguage(): Record<string, MissingKeyEntry[]> {
    const result: Record<string, MissingKeyEntry[]> = {};
    for (const entry of this.keys.values()) {
      if (!result[entry.language]) result[entry.language] = [];
      result[entry.language].push(entry);
    }
    return result;
  }

  /** Get unique missing key names (across all languages) */
  getUniqueKeys(): string[] {
    const keys = new Set<string>();
    for (const entry of this.keys.values()) {
      keys.add(entry.key);
    }
    return Array.from(keys);
  }

  /** Clear all collected data */
  clear() {
    this.keys.clear();
    this.notify();
  }

  /** Get total count */
  get size() {
    return this.keys.size;
  }

  /** Subscribe to changes */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  /** Export as CSV for quick analysis */
  exportCsv(): string {
    const entries = this.getAll();
    const header = 'language,key,namespace,fallbackValue,count,route';
    const rows = entries.map(e =>
      `${e.language},${e.key},${e.namespace},"${e.fallbackValue.replace(/"/g, '""')}",${e.count},${e.route || ''}`
    );
    return [header, ...rows].join('\n');
  }
}

export const missingKeyCollector = new MissingKeyCollector();

// Expose globally for debugging in console
if (typeof window !== 'undefined') {
  (window as any).__missingKeys = missingKeyCollector;
}
