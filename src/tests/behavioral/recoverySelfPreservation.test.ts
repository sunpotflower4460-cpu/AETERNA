import { describe, expect, it } from 'vitest';
import { runRecoveryProfilesScenarioSuite } from '../scenario/recoveryProfilesScenario';

describe('Phase 3 Recovery / Self-Preservation profiles', () => {
  it('exposes recover/shift/degrade trajectories and collapse distinctions', async () => {
    const outcomes = await runRecoveryProfilesScenarioSuite();
    expect(outcomes.length).toBeGreaterThanOrEqual(7);

    const summaries = outcomes.map((outcome) => outcome.result.summary);

    // Recovery and degradation should both appear across scenario set
    const totalRecover = summaries.reduce((sum, s) => sum + (s.recoveryFrameCount ?? 0), 0);
    const totalShift = summaries.reduce((sum, s) => sum + (s.shiftFrameCount ?? 0), 0);
    const totalDegrade = summaries.reduce((sum, s) => sum + (s.degradeFrameCount ?? 0), 0);
    const totalPartialRepair = summaries.reduce((sum, s) => sum + (s.partialRepairFrameCount ?? 0), 0);
    expect(totalRecover).toBeGreaterThan(0);
    expect(totalShift + totalPartialRepair).toBeGreaterThan(0);
    expect(totalDegrade).toBeGreaterThan(0);

    // Soft collapse should be observable without requiring hard collapse in every run
    const totalSoftCollapse = summaries.reduce((sum, s) => sum + (s.softCollapseFrames ?? 0), 0);
    expect(totalSoftCollapse).toBeGreaterThan(0);

    // Recovery mechanics should produce finite profile values
    for (const summary of summaries) {
      if (summary.avgRecoveryPressure !== undefined) {
        expect(summary.avgRecoveryPressure).toBeGreaterThanOrEqual(0);
        expect(summary.avgRecoveryPressure).toBeLessThanOrEqual(1);
      }
      if (summary.avgRecoveryTime !== undefined) {
        expect(summary.avgRecoveryTime).toBeGreaterThan(0);
      }
      if (summary.avgSettlingTime !== undefined) {
        expect(summary.avgSettlingTime).toBeGreaterThan(0);
      }
    }

    const strongRestoration = outcomes.find((outcome) => outcome.name === 'same-perturbation-strong-restoration-bias');
    const weakRestoration = outcomes.find((outcome) => outcome.name === 'same-perturbation-weak-restoration-bias');
    expect(strongRestoration).toBeDefined();
    expect(weakRestoration).toBeDefined();

    expect((strongRestoration?.result.summary.avgRecoveryPressure ?? 0))
      .toBeGreaterThan((weakRestoration?.result.summary.avgRecoveryPressure ?? 0));
    expect((strongRestoration?.result.summary.avgBoundaryRepairPressure ?? 0))
      .toBeGreaterThan((weakRestoration?.result.summary.avgBoundaryRepairPressure ?? 0));
    expect((strongRestoration?.result.summary.avgRecoveryCollapseRisk ?? 1))
      .toBeLessThan((weakRestoration?.result.summary.avgRecoveryCollapseRisk ?? 1));
  });
});
