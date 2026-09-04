import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PURE_ROOT = resolve(__dirname, '../../pure');

/**
 * docs/pure-physics-implementation-plan.md §9's forbidden identifiers.
 * Checked as code identifiers, not bare substrings, so a comment that
 * documents "we don't use Math.random here" (which itself must contain
 * the word to say so) doesn't trip its own guard - the same
 * mention-vs-use distinction as src/tests/support/claimGuard.ts.
 */
const FORBIDDEN_CODE_PATTERNS: RegExp[] = [
  /\bMath\.random\s*\(/,
  /\bDate\.now\s*\(/,
  /\bclamp\s*\(/i,
  /\bmaxDelta\b/,
  /\bamplitudeClamp\b/,
  /\bboost\b/i,
  /\bstabilize\b/i,
  /\bmakeAlive\b/i,
  /\bmakeConscious\b/i,
  /\bforceRecovery\b/i,
  /\bdesiredTarget\b/i,
];

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and JSDoc comments
    .replace(/\/\/.*$/gm, ''); // line comments
}

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('pure core forbidden patterns (docs/pure-physics-implementation-plan.md §9)', () => {
  const files = listTsFiles(PURE_ROOT);

  it('found at least one file to check (guards against a broken glob silently passing)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [f.replace(PURE_ROOT + '/', ''), f]))('%s contains no forbidden identifiers', (_name, filePath) => {
    const code = stripComments(readFileSync(filePath as string, 'utf8'));
    for (const pattern of FORBIDDEN_CODE_PATTERNS) {
      expect(code, `Found forbidden pattern ${pattern} in ${filePath}`).not.toMatch(pattern);
    }
  });

  it('does not import from legacy/organism layers', () => {
    for (const filePath of files) {
      const code = readFileSync(filePath, 'utf8');
      const importLines = code.match(/^import .*from ['"].*['"];?$/gm) ?? [];
      for (const line of importLines) {
        expect(line, `${filePath} imports from a legacy/organism path`).not.toMatch(
          /from ['"].*\/(organism|core\/AeternaNetwork|core\/dynamicCore|core\/dormantNodes|aeternaTuning)/,
        );
      }
    }
  });
});
