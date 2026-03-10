#!/usr/bin/env node
/**
 * i18n Lint Script
 * 
 * Scans public-facing TSX files for hardcoded text that should use t() calls.
 * Run: npx tsx scripts/lint-i18n.ts
 * 
 * Exits with code 1 if violations found (useful for CI).
 */

import fs from 'fs';
import path from 'path';

// Only scan public-facing pages and components (skip admin, email templates)
const SCAN_DIRS = [
  'src/pages',
  'src/components/landing',
  'src/components/screener',
];

// Files/dirs to skip entirely
const SKIP_PATTERNS = [
  '/admin/',
  '/Admin',
  'Management.tsx',
  'EmailPreview',
  'SocialMediaCMS',
  'PatternVisualizationPreview',
  'TranslationDebug',
  'SiteStringScanner',
  '__tests__',
  '.test.',
];

// Regex patterns for hardcoded text in JSX
// Matches: >Some Text< or >Some text with spaces<
const HARDCODED_TEXT_PATTERN = />([A-Z][a-zA-Z\s\-—,.'&!?:]{8,})</g;

// Also catch string props that look like user-visible text
const HARDCODED_PROP_PATTERNS = [
  /title=["']([A-Z][a-zA-Z\s\-—,.'&!?:]{8,})["']/g,
  /description=["']([A-Z][a-zA-Z\s\-—,.'&!?:]{8,})["']/g,
  /placeholder=["']([A-Z][a-zA-Z\s\-—,.'&!?:]{8,})["']/g,
  /label=["']([A-Z][a-zA-Z\s\-—,.'&!?:]{8,})["']/g,
  /alt=["']([A-Z][a-zA-Z\s\-—,.'&!?:]{8,})["']/g,
];

// False positive suppressors
const FALSE_POSITIVE_PATTERNS = [
  /className=/,
  /console\./,
  /\/\//,       // comments
  /import /,
  /from ['"]/, 
  /const |let |var /,
  /interface |type /,
  /\/\*\*/,
  /@/,          // decorators/emails
  /https?:\/\//, // URLs
  /data-/,
  /aria-/,
];

interface Violation {
  file: string;
  line: number;
  text: string;
  context: string;
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip lines that are likely false positives
    if (FALSE_POSITIVE_PATTERNS.some(p => p.test(trimmed))) continue;
    // Skip lines already using t() or translation functions
    if (trimmed.includes('t(') || trimmed.includes('{t(')) continue;
    // Skip comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

    // Check for hardcoded text content between JSX tags
    let match: RegExpExecArray | null;
    
    HARDCODED_TEXT_PATTERN.lastIndex = 0;
    while ((match = HARDCODED_TEXT_PATTERN.exec(line)) !== null) {
      const text = match[1].trim();
      // Skip very short matches and common non-translatable patterns
      if (text.length < 10) continue;
      if (/^[A-Z_]+$/.test(text)) continue; // ALL_CAPS constants
      if (/^\d/.test(text)) continue; // starts with number
      
      violations.push({
        file: filePath,
        line: i + 1,
        text,
        context: trimmed.substring(0, 100),
      });
    }

    // Check string props
    for (const pattern of HARDCODED_PROP_PATTERNS) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(line)) !== null) {
        violations.push({
          file: filePath,
          line: i + 1,
          text: match[1].trim(),
          context: trimmed.substring(0, 100),
        });
      }
    }
  }

  return violations;
}

function getAllTsxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      // Skip files matching skip patterns
      if (SKIP_PATTERNS.some(p => fullPath.includes(p))) continue;
      files.push(fullPath);
    }
  }
  return files;
}

// Run
console.log('🔍 Scanning for hardcoded i18n strings...\n');

const allViolations: Violation[] = [];

for (const dir of SCAN_DIRS) {
  const files = getAllTsxFiles(dir);
  for (const file of files) {
    const violations = scanFile(file);
    allViolations.push(...violations);
  }
}

if (allViolations.length === 0) {
  console.log('✅ No hardcoded strings found. All public-facing text uses t() calls.\n');
  process.exit(0);
} else {
  console.log(`⚠️  Found ${allViolations.length} potential hardcoded strings:\n`);
  
  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  for (const [file, violations] of byFile) {
    console.log(`📄 ${file} (${violations.length} violations):`);
    for (const v of violations) {
      console.log(`   L${v.line}: "${v.text}"`);
    }
    console.log();
  }

  console.log(`Total: ${allViolations.length} hardcoded strings in ${byFile.size} files.`);
  console.log('Wrap these with t() calls and add keys to en.json.\n');
  process.exit(1);
}
