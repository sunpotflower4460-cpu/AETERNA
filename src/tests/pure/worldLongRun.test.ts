import { describe, expect, it } from 'vitest';
import { runWorldLongRun, type WorldLongRunConfig } from '../../pure/run/worldLongRun.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

function baseConfig(N: number): WorldLongRunConfig {
  const psiParams: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1.5, nu0: 0.2, kappa: 1, rho: 0.3, seed: 7 };
  const chiParams: PureCoreParams = { ...psiParams, seed: 8 };
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.05), omega: 2, phase: 0.1 };
  return { psiParams, chiParams, k: 4, lambda: 0.5, drive, totalTicks: 50, checkpointInterval: 10, residualTolerance: { n: 1e-6, h: 1e-6 } };
}

describe('pure core K15 world long run: normal completion (docs/vessel/K15-runtime-design.md Choice 3)', () => {
  it('reaches the full tick budget with no stop condition under a reasonable tolerance', () => {
    const result = runWorldLongRun(baseConfig(8));
    expect(result.stopped).toBe(false);
    expect(result.stopCondition).toBeUndefined();
    expect(result.finalTick).toBe(50);
  });

  it('produces a checkpoint at every checkpointInterval plus a final one', () => {
    const result = runWorldLongRun(baseConfig(8));
    const ticks = result.checkpoints.map((c) => c.tick);
    expect(ticks).toEqual([10, 20, 30, 40, 50]);
  });

  it('does not duplicate the final checkpoint when totalTicks is already a multiple of checkpointInterval', () => {
    const config = { ...baseConfig(8), totalTicks: 30, checkpointInterval: 10 };
    const result = runWorldLongRun(config);
    expect(result.checkpoints.map((c) => c.tick)).toEqual([10, 20, 30]);
  });

  it('adds exactly one checkpoint when totalTicks never reaches a checkpointInterval multiple', () => {
    const config = { ...baseConfig(8), totalTicks: 5, checkpointInterval: 100 };
    const result = runWorldLongRun(config);
    expect(result.checkpoints.map((c) => c.tick)).toEqual([5]);
  });

  it('is deterministic: two independent runs with the same config produce bit-identical final state for both psi and chi', () => {
    const a = runWorldLongRun(baseConfig(8));
    const b = runWorldLongRun(baseConfig(8));
    expect(a.finalPsi.real).toEqual(b.finalPsi.real);
    expect(a.finalPsi.imag).toEqual(b.finalPsi.imag);
    expect(a.finalPsiNu).toEqual(b.finalPsiNu);
    expect(a.finalChi.real).toEqual(b.finalChi.real);
    expect(a.finalChi.imag).toEqual(b.finalChi.imag);
    expect(a.finalChiNu).toEqual(b.finalChiNu);
  });

  it('handles totalTicks=0 by producing a single checkpoint of the untouched initial state', () => {
    const result = runWorldLongRun({ ...baseConfig(8), totalTicks: 0 });
    expect(result.finalTick).toBe(0);
    expect(result.checkpoints).toHaveLength(1);
    expect(result.checkpoints[0].tick).toBe(0);
  });
});

describe('pure core K15 world long run: stop conditions halt the run and preserve the last good state on EITHER book', () => {
  it('an absurdly tight residual tolerance stops the run early, reporting the reason and a consistent attemptedTick/finalTick pair', () => {
    const config = { ...baseConfig(8), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const result = runWorldLongRun(config);

    expect(result.stopped).toBe(true);
    expect(result.stopCondition?.reason).toBe('ledger-residual-exceeded');
    expect(result.stopCondition!.attemptedTick).toBeGreaterThan(0);
    expect(result.stopCondition?.detail).toContain('residualN');
    expect(result.finalTick).toBe(result.stopCondition!.attemptedTick - 1);
    expect(result.finalTick).toBeLessThan(config.totalTicks);
  });

  it('the preserved final state after a stop matches exactly what an unconstrained run shows at that same tick', () => {
    const strictConfig = { ...baseConfig(8), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const stopped = runWorldLongRun(strictConfig);
    expect(stopped.stopped).toBe(true);

    const unconstrained = runWorldLongRun({ ...baseConfig(8), totalTicks: stopped.finalTick, residualTolerance: { n: 1, h: 1 } });

    expect(stopped.finalPsi.real).toEqual(unconstrained.finalPsi.real);
    expect(stopped.finalChi.real).toEqual(unconstrained.finalChi.real);
    expect(stopped.finalPsiNu).toEqual(unconstrained.finalPsiNu);
    expect(stopped.finalChiNu).toEqual(unconstrained.finalChiNu);
  });

  it('a stop condition still produces exactly one checkpoint, at the last good tick', () => {
    const config = { ...baseConfig(8), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const result = runWorldLongRun(config);

    expect(result.checkpoints).toHaveLength(1);
    expect(result.checkpoints[0].tick).toBe(result.finalTick);
    expect(result.checkpoints[0].snapshot.tick).toBe(result.finalTick);
  });

  it('throws for an invalid totalTicks or checkpointInterval', () => {
    expect(() => runWorldLongRun({ ...baseConfig(8), totalTicks: -1 })).toThrow();
    expect(() => runWorldLongRun({ ...baseConfig(8), checkpointInterval: 0 })).toThrow();
  });
});

describe('pure core K15 world long run: resumeFrom reproduces an uninterrupted run split across two calls', () => {
  it('running 30 then resuming for 20 more matches a single uninterrupted 50-tick run bit-for-bit', () => {
    const config = baseConfig(8);
    const uninterrupted = runWorldLongRun(config);

    const firstHalf = runWorldLongRun({ ...config, totalTicks: 30 });
    expect(firstHalf.stopped).toBe(false);
    const lastCheckpoint = firstHalf.checkpoints[firstHalf.checkpoints.length - 1];
    expect(lastCheckpoint.tick).toBe(30);

    const secondHalf = runWorldLongRun({
      ...config,
      totalTicks: 20,
      resumeFrom: { tick: firstHalf.finalTick, psi: firstHalf.finalPsi, psiNu: firstHalf.finalPsiNu, chi: firstHalf.finalChi, chiNu: firstHalf.finalChiNu },
    });

    expect(secondHalf.finalTick).toBe(uninterrupted.finalTick);
    expect(secondHalf.finalPsi.real).toEqual(uninterrupted.finalPsi.real);
    expect(secondHalf.finalPsi.imag).toEqual(uninterrupted.finalPsi.imag);
    expect(secondHalf.finalPsiNu).toEqual(uninterrupted.finalPsiNu);
    expect(secondHalf.finalChi.real).toEqual(uninterrupted.finalChi.real);
    expect(secondHalf.finalChi.imag).toEqual(uninterrupted.finalChi.imag);
    expect(secondHalf.finalChiNu).toEqual(uninterrupted.finalChiNu);
  });

  it('a resumed run restored from a serialized-and-parsed worldSnapshot (simulating a fresh process) still matches bit-for-bit', () => {
    const config = baseConfig(8);
    const uninterrupted = runWorldLongRun(config);

    const firstHalf = runWorldLongRun({ ...config, totalTicks: 30 });
    const checkpointSnapshot = firstHalf.checkpoints[firstHalf.checkpoints.length - 1].snapshot;
    const rehydrated = JSON.parse(JSON.stringify(checkpointSnapshot)) as typeof checkpointSnapshot;

    const secondHalf = runWorldLongRun({
      ...config,
      totalTicks: 20,
      resumeFrom: {
        tick: rehydrated.tick,
        psi: { real: Float64Array.from(rehydrated.psiReal), imag: Float64Array.from(rehydrated.psiImag) },
        psiNu: Float64Array.from(rehydrated.psiNu),
        chi: { real: Float64Array.from(rehydrated.chiReal), imag: Float64Array.from(rehydrated.chiImag) },
        chiNu: Float64Array.from(rehydrated.chiNu),
      },
    });

    expect(secondHalf.finalPsi.real).toEqual(uninterrupted.finalPsi.real);
    expect(secondHalf.finalChi.real).toEqual(uninterrupted.finalChi.real);
    expect(secondHalf.finalChiNu).toEqual(uninterrupted.finalChiNu);
  });

  it('checkpoints taken during a resumed run are tagged with absolute tick numbers, not relative ones', () => {
    const config = { ...baseConfig(8), totalTicks: 10, checkpointInterval: 5 };
    const seed = runWorldLongRun(config);
    const resumed = runWorldLongRun({
      ...config,
      resumeFrom: { tick: 100, psi: seed.finalPsi, psiNu: seed.finalPsiNu, chi: seed.finalChi, chiNu: seed.finalChiNu },
    });
    expect(resumed.checkpoints.map((c) => c.tick)).toEqual([105, 110]);
  });

  it('throws for a negative or non-integer resumeFrom.tick', () => {
    const config = baseConfig(8);
    const seed = runWorldLongRun(config);
    expect(() =>
      runWorldLongRun({ ...config, resumeFrom: { tick: -1, psi: seed.finalPsi, psiNu: seed.finalPsiNu, chi: seed.finalChi, chiNu: seed.finalChiNu } }),
    ).toThrow();
    expect(() =>
      runWorldLongRun({ ...config, resumeFrom: { tick: 1.5, psi: seed.finalPsi, psiNu: seed.finalPsiNu, chi: seed.finalChi, chiNu: seed.finalChiNu } }),
    ).toThrow();
  });
});
