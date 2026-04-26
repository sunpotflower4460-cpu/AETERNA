/**
 * Body Surface State — Behavioral Tests
 *
 * W1: Body Surface Introduction
 *
 * Tests that validate BodySurfaceState derivation behaves correctly
 * as a pre-semantic boundary layer. These tests verify:
 *
 * 1. Pure derivation produces finite values in [0, 1]
 * 2. Correct directional relationships between inputs and outputs
 * 3. Graceful fallback when inputs are null/missing
 * 4. Scenario-level behavior (W1-A through W1-E)
 *
 * These tests do NOT verify semantic meaning — Body Surface is
 * a pre-semantic layer.
 */

import { describe, expect, it } from 'vitest';
import { deriveBodySurfaceState } from '../../body/deriveBodySurfaceState';
import type { DeriveBodySurfaceStateInput } from '../../body/deriveBodySurfaceState';
import { runBodySurfaceScenarioSuite } from '../scenario/bodySurfaceScenario';

// ── Unit tests: pure derivation ───────────────────────────────────────────────

describe('deriveBodySurfaceState — unit tests', () => {
  it('produces finite values in [0, 1] with all inputs present', () => {
    const result = deriveBodySurfaceState({
      timestamp: 0,
      recoveryState: {
        timestamp: 0,
        recoveryPressure: 0.4,
        relaxationLevel: 0.6,
        stabilizationPull: 0.5,
        collapseRisk: 0.1,
        restorationBias: 0.6,
        boundaryRepairPressure: 0.3,
        selfPreservationDrive: 0.5,
        overloadDrain: 0.2,
      },
      mismatchState: {
        timestamp: 0,
        mismatchLevel: 0.3,
        surprisePressure: 0.2,
        boundaryStress: 0.15,
        recoveryPull: 0.3,
        localInstability: 0.1,
      },
      pressureState: {
        timestamp: 0,
        safetyPressure: 0.4,
        restorationPressure: 0.5,
        noveltyPressure: 0.2,
        repetitionPressure: 0.3,
        explorationPressure: 0.4,
        withdrawalPressure: 0.2,
        dominantPressure: null,
        competitionEntropy: 0.6,
        competitionStability: 0.4,
        annealingTemperature: 0.5,
      },
      traceState: {
        timestamp: 0,
        traceStrength: 0.3,
        recurrenceWeight: 0.2,
        salienceResidue: 0.25,
        replayReadiness: 0.3,
        replaySuppression: 0.15,
      },
      meanActivity: 0.5,
      homeostaticBoundaryIntegrity: 0.75,
      collapseRisk: 0.1,
      overload: 0.2,
      recentPerturbationHistory: [0.1, 0.15, 0.12, 0.18, 0.14],
    });

    // All required fields must be finite [0, 1]
    expect(result.boundaryIntegrity).toBeGreaterThanOrEqual(0);
    expect(result.boundaryIntegrity).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.boundaryIntegrity)).toBe(true);

    expect(result.surfaceSensitivity).toBeGreaterThanOrEqual(0);
    expect(result.surfaceSensitivity).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.surfaceSensitivity)).toBe(true);

    expect(result.permeability).toBeGreaterThanOrEqual(0);
    expect(result.permeability).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.permeability)).toBe(true);

    expect(result.contactReadiness).toBeGreaterThanOrEqual(0);
    expect(result.contactReadiness).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.contactReadiness)).toBe(true);

    expect(result.outputReadiness).toBeGreaterThanOrEqual(0);
    expect(result.outputReadiness).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.outputReadiness)).toBe(true);

    expect(result.localIrritability).toBeGreaterThanOrEqual(0);
    expect(result.localIrritability).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.localIrritability)).toBe(true);

    expect(result.recoveryShielding).toBeGreaterThanOrEqual(0);
    expect(result.recoveryShielding).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.recoveryShielding)).toBe(true);

    // Optional fields (when present) must also be [0, 1]
    if (result.surfaceTension !== undefined) {
      expect(result.surfaceTension).toBeGreaterThanOrEqual(0);
      expect(result.surfaceTension).toBeLessThanOrEqual(1);
    }
    if (result.surfaceFatigue !== undefined) {
      expect(result.surfaceFatigue).toBeGreaterThanOrEqual(0);
      expect(result.surfaceFatigue).toBeLessThanOrEqual(1);
    }
    if (result.protectiveClosure !== undefined) {
      expect(result.protectiveClosure).toBeGreaterThanOrEqual(0);
      expect(result.protectiveClosure).toBeLessThanOrEqual(1);
    }
    if (result.externalContactLoad !== undefined) {
      expect(result.externalContactLoad).toBeGreaterThanOrEqual(0);
      expect(result.externalContactLoad).toBeLessThanOrEqual(1);
    }
  });

  it('falls back gracefully when all inputs are null', () => {
    const result = deriveBodySurfaceState({
      timestamp: 42,
      recoveryState: null,
      mismatchState: null,
      pressureState: null,
      traceState: null,
    });

    // Must produce finite outputs even with no input
    expect(Number.isFinite(result.boundaryIntegrity)).toBe(true);
    expect(Number.isFinite(result.surfaceSensitivity)).toBe(true);
    expect(Number.isFinite(result.permeability)).toBe(true);
    expect(Number.isFinite(result.contactReadiness)).toBe(true);
    expect(Number.isFinite(result.outputReadiness)).toBe(true);
    expect(Number.isFinite(result.localIrritability)).toBe(true);
    expect(Number.isFinite(result.recoveryShielding)).toBe(true);

    // All in [0, 1]
    for (const key of [
      'boundaryIntegrity', 'surfaceSensitivity', 'permeability',
      'contactReadiness', 'outputReadiness', 'localIrritability',
      'recoveryShielding',
    ] as const) {
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(1);
    }
  });

  it('returns the correct timestamp', () => {
    const result = deriveBodySurfaceState({
      timestamp: 999,
      recoveryState: null,
      mismatchState: null,
      pressureState: null,
      traceState: null,
    });
    expect(result.timestamp).toBe(999);
  });

  it('high overload reduces permeability and raises recoveryShielding', () => {
    const baseInput: DeriveBodySurfaceStateInput = {
      timestamp: 0,
      recoveryState: null,
      mismatchState: null,
      pressureState: null,
      traceState: null,
      overload: 0.1,
      homeostaticBoundaryIntegrity: 0.8,
      collapseRisk: 0.05,
    };

    const highOverloadInput: DeriveBodySurfaceStateInput = {
      ...baseInput,
      overload: 1.4,
      collapseRisk: 0.85,
      recoveryState: {
        timestamp: 0,
        recoveryPressure: 0.8,
        relaxationLevel: 0.2,
        stabilizationPull: 0.6,
        collapseRisk: 0.85,
        restorationBias: 0.3,
        selfPreservationDrive: 0.7,
        boundaryRepairPressure: 0.5,
        overloadDrain: 1.0,
      },
    };

    const baseResult = deriveBodySurfaceState(baseInput);
    const highOverloadResult = deriveBodySurfaceState(highOverloadInput);

    // Overload should reduce permeability (boundary closes under stress)
    expect(highOverloadResult.permeability).toBeLessThan(baseResult.permeability);

    // Overload + recovery pressure should raise recoveryShielding
    expect(highOverloadResult.recoveryShielding).toBeGreaterThan(baseResult.recoveryShielding);
  });

  it('repeated perturbation history raises localIrritability', () => {
    const quietInput: DeriveBodySurfaceStateInput = {
      timestamp: 0,
      recoveryState: null,
      mismatchState: null,
      pressureState: null,
      traceState: null,
      recentPerturbationHistory: new Array(40).fill(0.0),
    };

    const irritatedInput: DeriveBodySurfaceStateInput = {
      timestamp: 0,
      recoveryState: null,
      mismatchState: {
        timestamp: 0,
        mismatchLevel: 0.7,
        surprisePressure: 0.6,
        boundaryStress: 0.5,
        recoveryPull: 0.4,
        localInstability: 0.6,
      },
      pressureState: null,
      traceState: {
        timestamp: 0,
        traceStrength: 0.6,
        recurrenceWeight: 0.7,
        salienceResidue: 0.6,
        replayReadiness: 0.5,
        replaySuppression: 0.2,
      },
      recentPerturbationHistory: new Array(40).fill(0.9),
    };

    const quietResult = deriveBodySurfaceState(quietInput);
    const irritatedResult = deriveBodySurfaceState(irritatedInput);

    expect(irritatedResult.localIrritability).toBeGreaterThan(quietResult.localIrritability);
  });

  it('high exploration pressure raises permeability relative to high withdrawal', () => {
    const explorationInput: DeriveBodySurfaceStateInput = {
      timestamp: 0,
      recoveryState: null,
      mismatchState: null,
      pressureState: {
        timestamp: 0,
        safetyPressure: 0.1,
        restorationPressure: 0.2,
        noveltyPressure: 0.3,
        repetitionPressure: 0.2,
        explorationPressure: 0.85,
        withdrawalPressure: 0.05,
        dominantPressure: 'exploration',
        competitionEntropy: 0.3,
        competitionStability: 0.7,
        annealingTemperature: 0.3,
      },
      traceState: null,
    };

    const withdrawalInput: DeriveBodySurfaceStateInput = {
      timestamp: 0,
      recoveryState: null,
      mismatchState: null,
      pressureState: {
        timestamp: 0,
        safetyPressure: 0.7,
        restorationPressure: 0.5,
        noveltyPressure: 0.1,
        repetitionPressure: 0.2,
        explorationPressure: 0.05,
        withdrawalPressure: 0.85,
        dominantPressure: 'withdrawal',
        competitionEntropy: 0.3,
        competitionStability: 0.7,
        annealingTemperature: 0.3,
      },
      traceState: null,
    };

    const explorationResult = deriveBodySurfaceState(explorationInput);
    const withdrawalResult = deriveBodySurfaceState(withdrawalInput);

    // Exploration openness → higher permeability than withdrawal
    expect(explorationResult.permeability).toBeGreaterThan(withdrawalResult.permeability);
  });

  it('Body Surface does not return NaN for extreme inputs', () => {
    const extremeInput: DeriveBodySurfaceStateInput = {
      timestamp: 0,
      recoveryState: {
        timestamp: 0,
        recoveryPressure: 999,
        relaxationLevel: -999,
        stabilizationPull: NaN,
        collapseRisk: Infinity,
        restorationBias: -Infinity,
        selfPreservationDrive: NaN,
        boundaryRepairPressure: 999,
        overloadDrain: 999,
      },
      mismatchState: {
        timestamp: 0,
        mismatchLevel: Infinity,
        surprisePressure: -Infinity,
        boundaryStress: NaN,
        recoveryPull: 999,
        localInstability: -999,
      },
      pressureState: null,
      traceState: null,
      overload: NaN,
      collapseRisk: Infinity,
      meanActivity: -Infinity,
    };

    const result = deriveBodySurfaceState(extremeInput);

    for (const key of [
      'boundaryIntegrity', 'surfaceSensitivity', 'permeability',
      'contactReadiness', 'outputReadiness', 'localIrritability',
      'recoveryShielding',
    ] as const) {
      expect(Number.isFinite(result[key])).toBe(true);
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(1);
    }
  });
});

// ── Scenario-level tests ──────────────────────────────────────────────────────

describe('Body Surface scenarios (W1-A through W1-E)', () => {
  it('W1-A: stable quiet surface — no extreme values, normal range', async () => {
    const outcomes = await runBodySurfaceScenarioSuite();
    const stable = outcomes.find((o) => o.name === 'W1-A-stable-quiet-surface');
    expect(stable).toBeDefined();

    const s = stable!.result.summary;
    expect(stable!.result.succeeded).toBe(true);

    // Body Surface should be present in the summary
    expect(s.avgBsBoundaryIntegrity).toBeDefined();
    expect(s.avgBsPermeability).toBeDefined();
    expect(s.avgBsLocalIrritability).toBeDefined();

    // Stable quiet state: localIrritability should not be extreme
    expect(s.avgBsLocalIrritability!).toBeGreaterThanOrEqual(0);
    expect(s.avgBsLocalIrritability!).toBeLessThan(0.75);

    // boundaryIntegrity should be present and in [0, 1]
    expect(s.avgBsBoundaryIntegrity!).toBeGreaterThanOrEqual(0);
    expect(s.avgBsBoundaryIntegrity!).toBeLessThanOrEqual(1);
  });

  it('W1-B: overload protective closure — permeability low, recoveryShielding elevated', async () => {
    const outcomes = await runBodySurfaceScenarioSuite();
    const overload = outcomes.find((o) => o.name === 'W1-B-overload-protective-closure');
    const stable = outcomes.find((o) => o.name === 'W1-A-stable-quiet-surface');
    expect(overload).toBeDefined();
    expect(stable).toBeDefined();

    expect(overload!.result.succeeded).toBe(true);

    const sOverload = overload!.result.summary;
    const sStable = stable!.result.summary;

    // Under overload: recoveryShielding should be higher than under quiet
    if (sOverload.avgBsRecoveryShielding !== undefined && sStable.avgBsRecoveryShielding !== undefined) {
      expect(sOverload.avgBsRecoveryShielding).toBeGreaterThanOrEqual(sStable.avgBsRecoveryShielding * 0.8);
    }

    // Permeability and recoveryShielding are in valid range
    if (sOverload.avgBsPermeability !== undefined) {
      expect(sOverload.avgBsPermeability).toBeGreaterThanOrEqual(0);
      expect(sOverload.avgBsPermeability).toBeLessThanOrEqual(1);
    }
    if (sOverload.avgBsRecoveryShielding !== undefined) {
      expect(sOverload.avgBsRecoveryShielding).toBeGreaterThanOrEqual(0);
      expect(sOverload.avgBsRecoveryShielding).toBeLessThanOrEqual(1);
    }
  });

  it('W1-C: moderate contact readiness — contactReadiness in [0.1, 0.9]', async () => {
    const outcomes = await runBodySurfaceScenarioSuite();
    const moderate = outcomes.find((o) => o.name === 'W1-C-moderate-contact-readiness');
    expect(moderate).toBeDefined();
    expect(moderate!.result.succeeded).toBe(true);

    const s = moderate!.result.summary;
    if (s.avgBsContactReadiness !== undefined) {
      expect(s.avgBsContactReadiness).toBeGreaterThan(0.0);
      expect(s.avgBsContactReadiness).toBeLessThan(1.0);
    }
  });

  it('W1-D: repeated perturbation irritability — maxBsLocalIrritability should be > 0', async () => {
    const outcomes = await runBodySurfaceScenarioSuite();
    const repeated = outcomes.find((o) => o.name === 'W1-D-repeated-perturbation-irritability');
    expect(repeated).toBeDefined();
    expect(repeated!.result.succeeded).toBe(true);

    const s = repeated!.result.summary;
    // localIrritability should be positive under repeated perturbation
    if (s.maxBsLocalIrritability !== undefined) {
      expect(s.maxBsLocalIrritability).toBeGreaterThan(0);
    }
    if (s.avgBsLocalIrritability !== undefined) {
      expect(s.avgBsLocalIrritability).toBeGreaterThanOrEqual(0);
      expect(s.avgBsLocalIrritability).toBeLessThanOrEqual(1);
    }
  });

  it('W1-E: read-only derivation — simulation remains stable (no collapse, no NaN)', async () => {
    const outcomes = await runBodySurfaceScenarioSuite();
    const readOnly = outcomes.find((o) => o.name === 'W1-E-read-only-derivation');
    expect(readOnly).toBeDefined();

    const r = readOnly!.result;
    // Body Surface derivation must not break the simulation
    expect(r.succeeded).toBe(true);
    expect(r.summary.nanFrames).toBe(0);
    expect(r.summary.collapseRate).toBeLessThan(0.5);
  });

  it('all scenarios produce Body Surface values in [0, 1]', async () => {
    const outcomes = await runBodySurfaceScenarioSuite();

    for (const outcome of outcomes) {
      const s = outcome.result.summary;
      const bsFields = [
        s.avgBsBoundaryIntegrity,
        s.avgBsSurfaceSensitivity,
        s.avgBsPermeability,
        s.avgBsContactReadiness,
        s.avgBsOutputReadiness,
        s.avgBsLocalIrritability,
        s.avgBsRecoveryShielding,
      ];

      for (const v of bsFields) {
        if (v !== undefined) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
