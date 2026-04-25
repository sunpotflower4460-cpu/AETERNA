import { describe, expect, it } from 'vitest';
import { classifyCollapseMode, classifyRecoveryTrajectory, deriveRecoveryState } from '../organism/deriveRecoveryState';

describe('deriveRecoveryState', () => {
  it('derives bounded recovery metrics from perturbation + restoration inputs', () => {
    const state = deriveRecoveryState({
      timestamp: 100,
      meanPredictionError: 0.7,
      perturbationLoad: 0.8,
      boundaryIntegrity: 0.75,
      restorationBias: 0.62,
      stability: 0.58,
      overload: 0.31,
      depletion: 0.28,
      selfPreservationBias: 0.56,
      recentPerturbationHistory: [0.2, 0.35, 0.7, 0.5],
    });

    expect(state.recoveryPressure).toBeGreaterThanOrEqual(0);
    expect(state.recoveryPressure).toBeLessThanOrEqual(1);
    expect(state.collapseRisk).toBeGreaterThanOrEqual(0);
    expect(state.collapseRisk).toBeLessThanOrEqual(1);

    const trajectory = classifyRecoveryTrajectory(state, { stability: 0.58, boundaryIntegrity: 0.75 });
    expect(['recover', 'shift', 'degrade', 'partial_repair']).toContain(trajectory);

    const collapseMode = classifyCollapseMode(state, { meanActivity: 0.2, maxActivity: 0.8, boundaryIntegrity: 0.75 });
    expect(['stable', 'soft_collapse', 'hard_collapse', 'runaway']).toContain(collapseMode);
  });
});
