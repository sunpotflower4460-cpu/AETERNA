import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator, applyLaplaceBeltrami } from '../../pure/geometry/laplaceBeltrami.ts';
import { createLinearCayleyStepper } from '../../pure/field/linearCayleyStep.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

const LINEAR_CAYLEY_STEP_SOURCE = readFileSync(
  resolve(__dirname, '../../pure/field/linearCayleyStep.ts'),
  'utf8',
);

function randomComplexField(size: number, seed: number): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = random() - 0.5;
    imag[i] = random() - 0.5;
  }
  return { real, imag };
}

/** A deliberately-bad forward-Euler step for comparison: psi_next = psi + i*alpha*dt*L*psi. */
function forwardEulerLinearStep(operator: ReturnType<typeof createLaplaceBeltramiOperator>, psi: ComplexField, alpha: number, dt: number): ComplexField {
  const lPsi = applyLaplaceBeltrami(operator, psi);
  const real = new Float64Array(psi.real.length);
  const imag = new Float64Array(psi.imag.length);
  for (let i = 0; i < psi.real.length; i++) {
    // psi + i*alpha*dt*(Lpsi_r + i*Lpsi_i) = (psi_r - alpha*dt*Lpsi_i) + i*(psi_i + alpha*dt*Lpsi_r)
    real[i] = psi.real[i] - alpha * dt * lPsi.imag[i];
    imag[i] = psi.imag[i] + alpha * dt * lPsi.real[i];
  }
  return { real, imag };
}

describe('pure core: linear step is Cayley/CN, not forward Euler (docs/pure-physics-implementation-plan.md §3 gate)', () => {
  it('the linear step source uses a linear solve (luFactorize/luSolve), not a bare explicit update', () => {
    expect(LINEAR_CAYLEY_STEP_SOURCE).toContain('luFactorize');
    expect(LINEAR_CAYLEY_STEP_SOURCE).toContain('luSolve');
    // The forbidden pattern this test is named for: psi_next = psi + i*alpha*L*dt*psi
    // written directly (no solve). If this ever appears, it is the exact
    // unconditionally-unstable scheme the plan singles out at
    // docs/pure-physics-implementation-plan.md #3.
    expect(LINEAR_CAYLEY_STEP_SOURCE).not.toMatch(/real\[i\]\s*=\s*psi\.real\[i\]\s*[+-]/);
  });

  it('demonstrates why: a real forward-Euler step on this operator amplifies the norm, while the Cayley step does not', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const alpha = 1;
    const dt = 0.01;
    const stepper = createLinearCayleyStepper(operator, geometry, alpha, dt);

    let psiCayley = randomComplexField(geometry.N * geometry.N, 6);
    let psiEuler: ComplexField = { real: Float64Array.from(psiCayley.real), imag: Float64Array.from(psiCayley.imag) };
    const normStart = weightedNormSquared(psiCayley, geometry);

    for (let tick = 0; tick < 50; tick++) {
      psiCayley = stepper.step(psiCayley);
      psiEuler = forwardEulerLinearStep(operator, psiEuler, alpha, dt);
    }

    const normCayley = weightedNormSquared(psiCayley, geometry);
    const normEuler = weightedNormSquared(psiEuler, geometry);

    // Cayley: norm preserved (docs/pure-physics-implementation-plan.md's
    // claimed property). Forward Euler: norm has grown - the
    // "|1+i*lambda*dt| = sqrt(1+(lambda*dt)^2) > 1" amplification the
    // plan describes, made concrete rather than asserted.
    expect(normCayley / normStart).toBeCloseTo(1, 6);
    expect(normEuler).toBeGreaterThan(normStart * 1.001);
  });
});
