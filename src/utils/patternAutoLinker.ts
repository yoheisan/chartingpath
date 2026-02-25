/**
 * Auto-links known chart pattern names in markdown text to their
 * statistics pages on ChartingPath.
 *
 * Only replaces the first occurrence of each pattern per block
 * to avoid over-linking. Skips text that's already inside a link.
 */

const PATTERN_LINKS: [RegExp, string][] = [
  [/\bAscending Triangles?\b/gi, '/patterns/ascending-triangle/statistics'],
  [/\bDescending Triangles?\b/gi, '/patterns/descending-triangle/statistics'],
  [/\bSymmetrical Triangles?\b/gi, '/patterns/symmetrical-triangle/statistics'],
  [/\bDouble Bottoms?\b/gi, '/patterns/double-bottom/statistics'],
  [/\bDouble Tops?\b/gi, '/patterns/double-top/statistics'],
  [/\bTriple Bottoms?\b/gi, '/patterns/triple-bottom/statistics'],
  [/\bTriple Tops?\b/gi, '/patterns/triple-top/statistics'],
  [/\bHead and Shoulders\b/gi, '/patterns/head-and-shoulders/statistics'],
  [/\bHead & Shoulders\b/gi, '/patterns/head-and-shoulders/statistics'],
  [/\bInverse Head and Shoulders\b/gi, '/patterns/inverse-head-and-shoulders/statistics'],
  [/\bInverse Head & Shoulders\b/gi, '/patterns/inverse-head-and-shoulders/statistics'],
  [/\bBull Flags?\b/gi, '/patterns/bull-flag/statistics'],
  [/\bBear Flags?\b/gi, '/patterns/bear-flag/statistics'],
  [/\bRising Wedges?\b/gi, '/patterns/rising-wedge/statistics'],
  [/\bFalling Wedges?\b/gi, '/patterns/falling-wedge/statistics'],
  [/\bCup (?:and|&) Handles?\b/gi, '/patterns/cup-and-handle/statistics'],
  [/\bInverse Cup (?:and|&) Handles?\b/gi, '/patterns/inverse-cup-and-handle/statistics'],
];

/**
 * Injects markdown links for pattern names into a markdown string.
 * Only links the first occurrence of each pattern to avoid clutter.
 */
export function injectPatternLinks(markdown: string): string {
  let result = markdown;
  for (const [regex, path] of PATTERN_LINKS) {
    // Only replace the first match that is NOT already inside a markdown link [...](...) 
    let replaced = false;
    result = result.replace(regex, (match, offset) => {
      if (replaced) return match;
      // Check if this match is already inside a markdown link
      const before = result.slice(Math.max(0, offset - 200), offset);
      // If we see an unclosed [ before us, we're inside a link label
      const lastOpen = before.lastIndexOf('[');
      const lastClose = before.lastIndexOf(']');
      if (lastOpen > lastClose) return match;
      replaced = true;
      return `[${match}](${path})`;
    });
  }
  return result;
}
