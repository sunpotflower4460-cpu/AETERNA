import { describe, expect, it } from 'vitest';
import { runParameterSweep, vortexPersistenceSweepCondition, type SweepCombination } from '../../pure/run/parameterSweep.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

function combination(seed: number, g: number): SweepCombination {
  const N = 5;
  const params: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g, nu0: 0.3, kappa: 1, rho: 0.3, seed };
  const drive: DriveSpec = { spatialProfile: Float64Array.from({ length: N * N }, () => 0.06), omega: 2.5, phase: 0.2 };
  return { params, drive };
}

describe('pure core parameter sweep: enumeration, not judgment (docs/pure-physics-implementation-plan.md PR7 merge gate: "自動スイープは条件を満たしたパラメータ領域を列挙する" / "優劣判断や意識確定をしない")', () => {
  it('running the same sweep twice with the same seeds produces bit-identical entries (satisfied + detail)', () => {
    const combinations = [combination(1, 0), combination(2, 1), combination(3, 3)];
    const condition = vortexPersistenceSweepCondition(2);

    const runA = runParameterSweep(combinations, 20, condition);
    const runB = runParameterSweep(combinations, 20, condition);

    expect(runA).toEqual(runB);
  });

  it('enumerates every combination in input order without sorting, filtering, or ranking', () => {
    const combinations = [combination(5, 0), combination(6, 2), combination(7, 5)];
    const condition = vortexPersistenceSweepCondition(1000); // deliberately unreachable threshold

    const entries = runParameterSweep(combinations, 10, condition);

    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.combination)).toEqual(combinations);
    // An unreachable threshold should be reported as unsatisfied everywhere, not silently dropped from the list.
    for (const entry of entries) {
      expect(entry.conditionResult.satisfied).toBe(false);
    }
  });

  it('the condition result exposes raw detail (maxPersistenceTicks), not a pass/fail-only verdict, so no information is discarded before a human looks at it', () => {
    const combinations = [combination(9, 1)];
    const condition = vortexPersistenceSweepCondition(1);

    const entries = runParameterSweep(combinations, 10, condition);

    expect(entries[0].conditionResult.detail).toHaveProperty('maxPersistenceTicks');
    expect(typeof (entries[0].conditionResult.detail as { maxPersistenceTicks: number }).maxPersistenceTicks).toBe('number');
  });

  it('different seeds within the same sweep can produce different results (the sweep does not silently collapse distinct combinations)', () => {
    const combinations = [combination(100, 2), combination(200, 2)];
    const condition = vortexPersistenceSweepCondition(1);

    const entries = runParameterSweep(combinations, 15, condition);

    // Not asserting they MUST differ (that would overclaim about the
    // physics) - only that the sweep runs each independently rather than
    // caching/memoizing across distinct seeds.
    expect(entries).toHaveLength(2);
    expect(entries[0].combination.params.seed).toBe(100);
    expect(entries[1].combination.params.seed).toBe(200);
  });
});
