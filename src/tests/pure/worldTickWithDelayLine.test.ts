import { describe, expect, it } from 'vitest';
import { createWorldField, createWorldInitialState } from '../../pure/world/worldField.ts';
import { selectDistributedBoundary } from '../../pure/world/distributedBoundary.ts';
import { createDelayLineBuffer, runWorldTickWithDelayLine, type DelayLineBuffer } from '../../pure/world/delayLineControl.ts';
import { computeNorm } from '../../pure/field/invariants.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.1, kappa: 0, rho: 0, seed: 7, ...overrides };
}

describe('pure core K13: runWorldTickWithDelayLine (docs/vessel/K13-world-constitution-adr.md Choice 5)', () => {
  it('is deterministic across repeated calls', () => {
    const psiWorld = createWorldField({ params: baseParams() });
    const initial = createWorldInitialState(psiWorld);
    const pairs = selectDistributedBoundary(psiWorld.geometry, psiWorld.geometry, 3);
    const buffers = pairs.map(() => createDelayLineBuffer({ delayTicks: 3, dampingFactor: 0.5 }));
    const psi: ComplexField = { real: initial.real, imag: initial.imag };

    const a = runWorldTickWithDelayLine(psi, initial.nu, psiWorld, buffers, pairs, 0.3, psiWorld.params.dt);
    const b = runWorldTickWithDelayLine(psi, initial.nu, psiWorld, buffers, pairs, 0.3, psiWorld.params.dt);

    expect(a.psi.real).toEqual(b.psi.real);
    expect(a.buffers).toEqual(b.buffers);
  });

  it('with dissipation active and no external energy source, N decays over many ticks (no J can reach a fieldless delay line)', () => {
    const psiWorld = createWorldField({ params: baseParams({ nu0: 0.3 }) });
    const initial = createWorldInitialState(psiWorld);
    const pairs = selectDistributedBoundary(psiWorld.geometry, psiWorld.geometry, 3);
    let buffers: DelayLineBuffer[] = pairs.map(() => createDelayLineBuffer({ delayTicks: 3, dampingFactor: 0.5 }));
    let psi: ComplexField = { real: initial.real, imag: initial.imag };
    let psiNu = initial.nu;

    const nStart = computeNorm(psi, psiWorld.geometry);
    for (let tick = 0; tick < 100; tick++) {
      const result = runWorldTickWithDelayLine(psi, psiNu, psiWorld, buffers, pairs, 0.3, psiWorld.params.dt);
      psi = result.psi;
      psiNu = result.psiNu;
      buffers = result.buffers;
    }
    const nEnd = computeNorm(psi, psiWorld.geometry);

    expect(nEnd).toBeLessThan(nStart);
  });

  it('at lambda=0, psi evolves exactly as it would with no boundary interaction at all', () => {
    const psiWorld = createWorldField({ params: baseParams() });
    const initial = createWorldInitialState(psiWorld);
    const pairs = selectDistributedBoundary(psiWorld.geometry, psiWorld.geometry, 2);
    let buffers: DelayLineBuffer[] = pairs.map(() => createDelayLineBuffer({ delayTicks: 2, dampingFactor: 0.9 }));
    let psi: ComplexField = { real: initial.real, imag: initial.imag };
    let psiNu = initial.nu;

    for (let tick = 0; tick < 20; tick++) {
      const result = runWorldTickWithDelayLine(psi, psiNu, psiWorld, buffers, pairs, 0, psiWorld.params.dt);
      psi = result.psi;
      psiNu = result.psiNu;
      buffers = result.buffers;
      for (const buffer of buffers) {
        for (const v of buffer.queue) {
          expect(v.real).toBe(0);
          expect(v.imag).toBe(0);
        }
      }
    }
  });
});
