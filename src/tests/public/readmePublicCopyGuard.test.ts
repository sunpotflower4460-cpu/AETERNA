/**
 * readmePublicCopyGuard.test.ts
 * AETERNA-NATURAL v2.2 — README Public Copy Guard Tests
 *
 * Tests that README.md contains required v2.2 public demo copy
 * and does not contain forbidden claims.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const README_PATH = resolve(__dirname, '../../../README.md');
const readmeContent = readFileSync(README_PATH, 'utf-8');
const readmeLower = readmeContent.toLowerCase();

const FORBIDDEN_CLAIMS = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'aeterna is alive',
  'aeterna feels',
  'aeterna wants',
  'mystical proof',
  'healing proof',
  'vortex is mind',
  'plasticity is memory',
  'ratio proves truth',
];

describe('README — v2.2 public copy guard', () => {
  it('README has AETERNA-NATURAL title', () => {
    expect(readmeContent).toContain('# AETERNA-NATURAL');
  });

  it('README has "Torus Field Observation Lab" subtitle', () => {
    expect(readmeContent).toContain('Torus Field Observation Lab');
  });

  it('README has "What you can observe" section', () => {
    expect(readmeContent).toContain('What you can observe');
  });

  it('README has "What this is not" section', () => {
    expect(readmeContent).toContain('What this is not');
  });

  it('README "What this is not" covers consciousness', () => {
    expect(readmeLower).toContain('consciousness');
  });

  it('README has Quick Start section', () => {
    expect(readmeContent).toContain('Quick Start');
  });

  it('README Quick Start mentions Safe Observation', () => {
    expect(readmeContent).toContain('Safe Observation');
  });

  it('README has Public Research Mode section', () => {
    expect(readmeContent).toContain('Public Research Mode');
  });

  it('README has Reproducibility section', () => {
    expect(readmeContent).toContain('Reproducibility');
  });

  it('README has Guardrails section', () => {
    expect(readmeContent).toContain('Guardrails');
  });

  it('README has Status section indicating research prototype', () => {
    expect(readmeLower).toContain('research prototype');
  });

  it('README has no forbidden claims', () => {
    for (const claim of FORBIDDEN_CLAIMS) {
      expect(readmeLower, `"${claim}" found in README`).not.toContain(claim.toLowerCase());
    }
  });
});
