import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

const REQUIRED_DOCS = [
  'docs/energy-realness-principles.md',
  'docs/energy-reality-audit.md',
  'docs/implementation-language-guardrails.md',
];

const REQUIRED_PHRASES = [
  'A behavior is not considered real merely because it appears in the output.',
  'Decay, saturation, persistence, rhythm, recovery, and collapse must not be written as target outcomes.',
  'input = internal accumulation + dissipation + actuation output + residue conversion ± tolerance',
  'conservationResidual',
  'Energy flow is not yet verified. Current values are diagnostic/proxy readings.',
];

const FORBIDDEN_AFFIRMATIVE_CLAIMS = [
  'AETERNA is conscious',
  'AETERNA is alive',
  'AETERNA has a heartbeat',
  'AETERNA is breathing',
  'Energy is flowing through AETERNA.',
  '意識が証明されました',
  '生命が証明されました',
  'AETERNA は生きています',
];

function read(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

describe('v2.8 energy reality audit docs', () => {
  it('required docs exist', () => {
    for (const relPath of REQUIRED_DOCS) {
      expect(existsSync(resolve(ROOT, relPath)), `${relPath} should exist`).toBe(true);
    }
  });

  it('energy realness principles include the core invariants', () => {
    const content = read('docs/energy-realness-principles.md');
    for (const phrase of REQUIRED_PHRASES) {
      expect(content).toContain(phrase);
    }
  });

  it('energy reality audit classifies current dynamics without changing runtime', () => {
    const content = read('docs/energy-reality-audit.md');
    expect(content).toContain('This phase is documentation and audit only. It does not change runtime dynamics.');
    expect(content).toContain('World Medium is scalar and baseline-seeking');
    expect(content).toContain('Before adding any ExternalDriveField or Energy Intake Port');
    expect(content).toContain('Energy Ledger');
  });

  it('guardrails include energy-domain naming and result-coded behavior warnings', () => {
    const content = read('docs/implementation-language-guardrails.md');
    expect(content).toContain('Energy Realness 追記');
    expect(content).toContain('ExternalDriveField');
    expect(content).toContain('VitalPulse');
    expect(content).toContain('結果を書くな。条件を書け。');
  });

  it('does not add affirmative life/consciousness/energy-flow claims in v2.8 docs', () => {
    const combined = REQUIRED_DOCS.map(read).join('\n');
    for (const claim of FORBIDDEN_AFFIRMATIVE_CLAIMS) {
      expect(combined, `Found forbidden claim: ${claim}`).not.toContain(claim);
    }
  });
});
