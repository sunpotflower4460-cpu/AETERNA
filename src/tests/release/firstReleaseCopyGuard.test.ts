/**
 * firstReleaseCopyGuard.test.ts
 * AETERNA-NATURAL v1.4 — First Release Copy Guard
 *
 * Reads the content of key documentation files and checks none of them
 * contain prohibited proof claims.
 *
 * Prohibited claims:
 *   "consciousness proved", "life proved", "intelligence proved",
 *   "healing proof", "mystical proof", "soul resonance",
 *   "AI became alive", "AETERNA is conscious", "AETERNA wants",
 *   "AETERNA feels"
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

const DOCS_TO_CHECK = [
  resolve(ROOT, 'README.md'),
  resolve(ROOT, 'docs/public-research-mode.md'),
  resolve(ROOT, 'docs/first-release-notes.md'),
];

const PROHIBITED_CLAIMS = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'healing proof',
  'mystical proof',
  'soul resonance',
  'ai became alive',
  'aeterna is conscious',
  'aeterna wants',
  'aeterna feels',
];

function containsProhibitedClaim(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of PROHIBITED_CLAIMS) {
    if (lower.includes(claim)) return claim;
  }
  return null;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('first release copy guard — prohibited proof claims', () => {
  for (const docPath of DOCS_TO_CHECK) {
    const fileName = docPath.replace(ROOT + '/', '');

    it(`${fileName} does not contain prohibited proof claims`, () => {
      const content = readFileSync(docPath, 'utf-8');
      const hit = containsProhibitedClaim(content);
      expect(hit).toBeNull();
    });
  }
});
