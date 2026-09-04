import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { applyMediumHistoryStep, type MediumHistoryParams } from '../../pure/medium/history.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

const HISTORY_SOURCE = readFileSync(resolve(__dirname, '../../pure/medium/history.ts'), 'utf8');

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('pure core medium history: no max(nu,0) clamp exists, non-negativity is algebraic (docs/pure-physics-implementation-plan.md PR6 merge gate)', () => {
  it('the source contains no clamp/Math.max(...,0)-style pattern (mention-vs-use distinction: only code is scanned, not doc-comment prose)', () => {
    const code = stripComments(HISTORY_SOURCE);
    expect(code).not.toMatch(/\bclamp\s*\(/i);
    expect(code).not.toMatch(/Math\.max\s*\(\s*nu/i);
    expect(code).not.toMatch(/Math\.max\s*\(\s*0/i);
  });

  it('nu never goes negative across a wide randomized sweep of kappa/rho/nu0/amplitude/dt, including the kappa=rho=0 degenerate case', () => {
    const random = createSeededRandom(77);
    for (let trial = 0; trial < 500; trial++) {
      const kappa = trial % 20 === 0 ? 0 : random() * 10;
      const rho = trial % 23 === 0 ? 0 : random() * 10;
      const nu0 = random() * 5;
      const amplitudeSquared = random() * 20;
      const nuStart = random() * 5;
      const dt = random() * 2;

      const psi: ComplexField = { real: Float64Array.from([Math.sqrt(amplitudeSquared)]), imag: new Float64Array(1) };
      const nu = Float64Array.from([nuStart]);
      const params: MediumHistoryParams = { kappa, rho, nu0 };

      const nuNext = applyMediumHistoryStep(psi, nu, params, dt);

      expect(nuNext[0]).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(nuNext[0])).toBe(true);
    }
  });

  it('nu starting at exactly 0 stays non-negative (boundary case, not just interior values)', () => {
    const psi: ComplexField = { real: Float64Array.from([2]), imag: new Float64Array(1) };
    const nu = Float64Array.from([0]);

    const nuNext = applyMediumHistoryStep(psi, nu, { kappa: 3, rho: 0.5, nu0: 1.2 }, 0.3);

    expect(nuNext[0]).toBeGreaterThanOrEqual(0);
  });

  it('nu stays non-negative when integrated forward over many ticks with a nonzero field (long-run check, not just single-step)', () => {
    const kappa = 4;
    const rho = 0.2;
    const nu0 = 0.6;
    const dt = 0.05;
    const random = createSeededRandom(88);

    let nu = 0.6;
    for (let tick = 0; tick < 2000; tick++) {
      const amplitudeSquared = random() * 3; // field amplitude fluctuates tick to tick
      const psi: ComplexField = { real: Float64Array.from([Math.sqrt(amplitudeSquared)]), imag: new Float64Array(1) };
      const nuNext = applyMediumHistoryStep(psi, Float64Array.from([nu]), { kappa, rho, nu0 }, dt);
      nu = nuNext[0];
      expect(nu).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(nu)).toBe(true);
    }
  });
});
