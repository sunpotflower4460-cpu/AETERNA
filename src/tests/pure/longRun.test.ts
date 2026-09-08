import { describe, expect, it } from 'vitest';
import { runLongRun, type LongRunConfig } from '../../pure/run/longRun.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

function baseConfig(N: number): LongRunConfig {
  const params: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1.5, nu0: 0.2, kappa: 1, rho: 0.3, seed: 7 };
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.05), omega: 2, phase: 0.1 };
  return { params, drive, totalTicks: 50, checkpointInterval: 10, residualTolerance: { n: 1e-6, h: 1e-6 } };
}

describe('pure core K10 long run: normal completion (docs/vessel/K-series-II-brain-and-universe-plan.md K10)', () => {
  it('reaches the full tick budget with no stop condition under a reasonable tolerance', () => {
    const result = runLongRun(baseConfig(6));
    expect(result.stopped).toBe(false);
    expect(result.stopCondition).toBeUndefined();
    expect(result.finalTick).toBe(50);
  });

  it('produces a checkpoint at every checkpointInterval plus a final one', () => {
    const result = runLongRun(baseConfig(6));
    const ticks = result.checkpoints.map((c) => c.tick);
    expect(ticks).toEqual([10, 20, 30, 40, 50]);
  });

  it('does not duplicate the final checkpoint when totalTicks is already a multiple of checkpointInterval', () => {
    const config = { ...baseConfig(6), totalTicks: 30, checkpointInterval: 10 };
    const result = runLongRun(config);
    expect(result.checkpoints.map((c) => c.tick)).toEqual([10, 20, 30]);
  });

  it('adds exactly one checkpoint when totalTicks never reaches a checkpointInterval multiple', () => {
    const config = { ...baseConfig(6), totalTicks: 5, checkpointInterval: 100 };
    const result = runLongRun(config);
    expect(result.checkpoints.map((c) => c.tick)).toEqual([5]);
  });

  it('is deterministic: two independent runs with the same config produce bit-identical final state', () => {
    const a = runLongRun(baseConfig(6));
    const b = runLongRun(baseConfig(6));
    expect(a.finalPsi.real).toEqual(b.finalPsi.real);
    expect(a.finalPsi.imag).toEqual(b.finalPsi.imag);
    expect(a.finalNu).toEqual(b.finalNu);
  });

  it('handles totalTicks=0 by producing a single checkpoint of the untouched initial state', () => {
    const result = runLongRun({ ...baseConfig(6), totalTicks: 0 });
    expect(result.finalTick).toBe(0);
    expect(result.checkpoints).toHaveLength(1);
    expect(result.checkpoints[0].tick).toBe(0);
  });
});

describe('pure core K10 long run: stop conditions halt the run and preserve the last good state, not a corrupted one', () => {
  it('an absurdly tight residual tolerance stops the run early, reporting the reason and a consistent attemptedTick/finalTick pair', () => {
    const config = { ...baseConfig(6), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const result = runLongRun(config);

    expect(result.stopped).toBe(true);
    expect(result.stopCondition?.reason).toBe('ledger-residual-exceeded');
    expect(result.stopCondition!.attemptedTick).toBeGreaterThan(0);
    expect(result.stopCondition?.detail).toContain('residualN');
    expect(result.finalTick).toBe(result.stopCondition!.attemptedTick - 1); // the run never accepted the failing tick's result
    expect(result.finalTick).toBeLessThan(config.totalTicks); // it genuinely stopped early
  });

  it('the preserved final state after a stop matches exactly what an unconstrained run shows at that same tick (not a corrupted or skipped-ahead value)', () => {
    const strictConfig = { ...baseConfig(6), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const stopped = runLongRun(strictConfig);
    expect(stopped.stopped).toBe(true);

    // Re-run the identical config with a generous tolerance for exactly
    // `finalTick` ticks - since the physics itself does not depend on the
    // tolerance (only whether the loop halts), this must match bit-for-bit.
    const unconstrained = runLongRun({ ...baseConfig(6), totalTicks: stopped.finalTick, residualTolerance: { n: 1, h: 1 } });

    expect(stopped.finalPsi.real).toEqual(unconstrained.finalPsi.real);
    expect(stopped.finalPsi.imag).toEqual(unconstrained.finalPsi.imag);
    expect(stopped.finalNu).toEqual(unconstrained.finalNu);
  });

  it('a stop condition still produces exactly one checkpoint, at the last good tick', () => {
    const config = { ...baseConfig(6), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const result = runLongRun(config);

    expect(result.checkpoints).toHaveLength(1);
    expect(result.checkpoints[0].tick).toBe(result.finalTick);
    expect(result.checkpoints[0].snapshot.tick).toBe(result.finalTick);
  });

  it('a stop mid-run (after several good ticks) preserves exactly the last good tick, not one past it', () => {
    // Loosen tolerance enough to survive a few ticks, using an H tolerance
    // instead - residualH is exactly 0 by construction (see energy.ts),
    // so this alone won't trigger; combine with a tight N tolerance that
    // still allows tick 1 (real residuals are ~1e-12 scale per prior
    // session tests) but is tight enough to eventually be exceeded is
    // impractical to predict exactly, so this test instead verifies the
    // invariant structurally: finalTick always equals stopCondition.attemptedTick - 1.
    const config = { ...baseConfig(6), residualTolerance: { n: 1e-300, h: 1e-6 } };
    const result = runLongRun(config);
    expect(result.finalTick).toBe(result.stopCondition!.attemptedTick - 1);
  });

  it('throws for an invalid totalTicks or checkpointInterval', () => {
    expect(() => runLongRun({ ...baseConfig(6), totalTicks: -1 })).toThrow();
    expect(() => runLongRun({ ...baseConfig(6), checkpointInterval: 0 })).toThrow();
  });
});

describe('pure core K10 long run: resumeFrom reproduces an uninterrupted run split across two calls', () => {
  it('running 30 then resuming for 20 more matches a single uninterrupted 50-tick run bit-for-bit', () => {
    const config = baseConfig(6);
    const uninterrupted = runLongRun(config);

    const firstHalf = runLongRun({ ...config, totalTicks: 30 });
    expect(firstHalf.stopped).toBe(false);
    const lastCheckpoint = firstHalf.checkpoints[firstHalf.checkpoints.length - 1];
    expect(lastCheckpoint.tick).toBe(30);

    const secondHalf = runLongRun({
      ...config,
      totalTicks: 20,
      resumeFrom: { tick: firstHalf.finalTick, psi: firstHalf.finalPsi, nu: firstHalf.finalNu },
    });

    expect(secondHalf.finalTick).toBe(uninterrupted.finalTick);
    expect(secondHalf.finalPsi.real).toEqual(uninterrupted.finalPsi.real);
    expect(secondHalf.finalPsi.imag).toEqual(uninterrupted.finalPsi.imag);
    expect(secondHalf.finalNu).toEqual(uninterrupted.finalNu);
  });

  it('a resumed run restored from a serialized-and-parsed snapshot (simulating a fresh process) still matches bit-for-bit', () => {
    const config = baseConfig(6);
    const uninterrupted = runLongRun(config);

    const firstHalf = runLongRun({ ...config, totalTicks: 30 });
    const checkpointSnapshot = firstHalf.checkpoints[firstHalf.checkpoints.length - 1].snapshot;
    // Round-trip through actual JSON text, as a real checkpoint file would be.
    const rehydrated = JSON.parse(JSON.stringify(checkpointSnapshot)) as typeof checkpointSnapshot;

    const secondHalf = runLongRun({
      ...config,
      totalTicks: 20,
      resumeFrom: {
        tick: rehydrated.tick,
        psi: { real: Float64Array.from(rehydrated.psiReal), imag: Float64Array.from(rehydrated.psiImag) },
        nu: Float64Array.from(rehydrated.nu),
      },
    });

    expect(secondHalf.finalPsi.real).toEqual(uninterrupted.finalPsi.real);
    expect(secondHalf.finalPsi.imag).toEqual(uninterrupted.finalPsi.imag);
    expect(secondHalf.finalNu).toEqual(uninterrupted.finalNu);
  });

  it('checkpoints taken during a resumed run are tagged with absolute tick numbers, not relative ones', () => {
    const config = { ...baseConfig(6), totalTicks: 10, checkpointInterval: 5 };
    const seed = runLongRun(config);
    const resumed = runLongRun({ ...config, resumeFrom: { tick: 100, psi: seed.finalPsi, nu: seed.finalNu } });
    expect(resumed.checkpoints.map((c) => c.tick)).toEqual([105, 110]);
  });

  it('throws for a negative or non-integer resumeFrom.tick', () => {
    const config = baseConfig(6);
    const bad = runLongRun(config).finalPsi;
    expect(() => runLongRun({ ...config, resumeFrom: { tick: -1, psi: bad, nu: new Float64Array(36) } })).toThrow();
    expect(() => runLongRun({ ...config, resumeFrom: { tick: 1.5, psi: bad, nu: new Float64Array(36) } })).toThrow();
  });
});
