import { describe, expect, it } from 'vitest';
import { deriveConservationResiduals } from '../../observer/safety/conservationCheckers.ts';
import { detectRunaway } from '../../observer/safety/runawayDetector.ts';
import { PHASE0_MECHANISM_WRITEBACK_FLAGS } from '../../observer/safety/mechanismWritebackFlags.ts';

describe('phase0 safety modules', () => {
  it('computes residuals for energy, momentum, and winding conservation', () => {
    const residuals = deriveConservationResiduals({
      measuredEnergy: 12,
      expectedEnergy: 10,
      measuredMomentum: 3,
      expectedMomentum: 5,
      measuredWinding: -1,
      expectedWinding: 2,
    });

    expect(residuals).toEqual({
      energyResidual: 2,
      momentumResidual: 2,
      windingResidual: 3,
    });
  });

  it('detects runaway when residuals keep increasing beyond threshold', () => {
    const result = detectRunaway([
      { totalEnergy: 1, semanticLeakCount: 0, hasNaNOrInf: false, residuals: { energyResidual: 0.6, momentumResidual: 0.1, windingResidual: 0.1 } },
      { totalEnergy: 1.1, semanticLeakCount: 0, hasNaNOrInf: false, residuals: { energyResidual: 0.8, momentumResidual: 0.1, windingResidual: 0.1 } },
      { totalEnergy: 1.3, semanticLeakCount: 0, hasNaNOrInf: false, residuals: { energyResidual: 1.0, momentumResidual: 0.1, windingResidual: 0.1 } },
    ]);

    expect(result.runaway).toBe(true);
    expect(result.reasons.join(' ')).toContain('Conservation residuals');
    expect(result.logDirectory).toBe('logs/safety/');
  });

  it('detects runaway for exponential energy divergence and NaN/Inf', () => {
    const result = detectRunaway([
      { totalEnergy: 1, semanticLeakCount: 0, hasNaNOrInf: false, residuals: { energyResidual: 0.1, momentumResidual: 0.1, windingResidual: 0.1 } },
      { totalEnergy: 2, semanticLeakCount: 0, hasNaNOrInf: false, residuals: { energyResidual: 0.1, momentumResidual: 0.1, windingResidual: 0.1 } },
      { totalEnergy: 3, semanticLeakCount: 1, hasNaNOrInf: true, residuals: { energyResidual: 0.1, momentumResidual: 0.1, windingResidual: 0.1 } },
    ]);

    expect(result.runaway).toBe(true);
    expect(result.shouldStopExperiment).toBe(true);
    expect(result.reasons.join(' ')).toContain('NaN/Inf');
    expect(result.reasons.join(' ')).toContain('semanticLeakCount');
  });

  it('marks all phase0 mechanisms with writeback_enabled false', () => {
    const flagById = (id: string) => PHASE0_MECHANISM_WRITEBACK_FLAGS.find((flag) => flag.mechanismId === id);

    expect(PHASE0_MECHANISM_WRITEBACK_FLAGS).toHaveLength(8);
    expect(PHASE0_MECHANISM_WRITEBACK_FLAGS.every((flag) => flag.writeback_enabled === false)).toBe(true);
    expect(flagById('weak_plasticity_trace')?.requires_writeback_review).toBe(true);
    expect(flagById('reafference_comparison')?.requires_writeback_review).toBe(true);
    expect(flagById('vital_pulse_breath_wave')?.requires_writeback_review).toBe(true);
  });
});
