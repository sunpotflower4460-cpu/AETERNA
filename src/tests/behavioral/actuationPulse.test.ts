import { beforeAll, describe, expect, it } from 'vitest';
import { deriveActuationPulse } from '../../actuation/deriveActuationPulse';
import { runActuationPulseScenarioSuite } from '../scenario/actuationPulseScenario';

describe('deriveActuationPulse — unit tests', () => {
  it('returns finite bounded visual pulse when recovery/trace/output readiness are aligned', () => {
    const pulse = deriveActuationPulse({
      timestamp: 10,
      bodySurfaceState: {
        timestamp: 10,
        boundaryIntegrity: 0.78,
        surfaceSensitivity: 0.42,
        permeability: 0.44,
        contactReadiness: 0.46,
        outputReadiness: 0.66,
        localIrritability: 0.28,
        recoveryShielding: 0.22,
        protectiveClosure: 0.16,
      },
      pressureState: {
        timestamp: 10,
        safetyPressure: 0.32,
        restorationPressure: 0.54,
        noveltyPressure: 0.48,
        repetitionPressure: 0.21,
        explorationPressure: 0.44,
        withdrawalPressure: 0.18,
        dominantPressure: 'restoration',
        competitionEntropy: 0.48,
        competitionStability: 0.52,
        annealingTemperature: 0.4,
        pressureEnergy: 0.32,
      },
      recoveryState: {
        timestamp: 10,
        recoveryPressure: 0.6,
        relaxationLevel: 0.5,
        stabilizationPull: 0.62,
        collapseRisk: 0.18,
        restorationBias: 0.66,
        boundaryRepairPressure: 0.48,
        selfPreservationDrive: 0.36,
        overloadDrain: 0.18,
      },
      traceState: {
        timestamp: 10,
        traceStrength: 0.52,
        recurrenceWeight: 0.34,
        salienceResidue: 0.28,
        replayReadiness: 0.42,
        replaySuppression: 0.12,
        recoveryLinkedResidue: 0.38,
        settlingResidue: 0.26,
      },
      mismatchState: {
        timestamp: 10,
        mismatchLevel: 0.22,
        surprisePressure: 0.18,
        boundaryStress: 0.12,
        recoveryPull: 0.35,
        localInstability: 0.2,
      },
      ongoingness: 0.72,
      stability: 0.68,
      boundaryIntegrity: 0.78,
      collapseRisk: 0.18,
      overload: 0.22,
      quietness: 0.34,
      meanActivity: 0.12,
    });

    expect(pulse).not.toBeNull();
    expect(pulse?.channel).toBe('visual');
    for (const key of [
      'intensity',
      'coherence',
      'rhythm',
      'locality',
      'recoveryLinked',
      'boundaryLinked',
      'traceLinked',
      'outputReadiness',
    ] as const) {
      expect(Number.isFinite(pulse![key])).toBe(true);
      expect(pulse![key]).toBeGreaterThanOrEqual(0);
      expect(pulse![key]).toBeLessThanOrEqual(1);
    }
  });

  it('returns simulatedForce pulse when boundary stress dominates', () => {
    const pulse = deriveActuationPulse({
      timestamp: 20,
      bodySurfaceState: {
        timestamp: 20,
        boundaryIntegrity: 0.52,
        surfaceSensitivity: 0.62,
        permeability: 0.24,
        contactReadiness: 0.2,
        outputReadiness: 0.5,
        localIrritability: 0.64,
        recoveryShielding: 0.3,
        protectiveClosure: 0.42,
      },
      pressureState: {
        timestamp: 20,
        safetyPressure: 0.88,
        restorationPressure: 0.46,
        noveltyPressure: 0.12,
        repetitionPressure: 0.16,
        explorationPressure: 0.08,
        withdrawalPressure: 0.62,
        dominantPressure: 'safety',
        competitionEntropy: 0.34,
        competitionStability: 0.7,
        annealingTemperature: 0.24,
        pressureEnergy: 0.66,
      },
      recoveryState: {
        timestamp: 20,
        recoveryPressure: 0.58,
        relaxationLevel: 0.28,
        stabilizationPull: 0.46,
        collapseRisk: 0.24,
        restorationBias: 0.44,
        boundaryRepairPressure: 0.42,
        selfPreservationDrive: 0.72,
        overloadDrain: 0.36,
      },
      traceState: {
        timestamp: 20,
        traceStrength: 0.24,
        recurrenceWeight: 0.14,
        salienceResidue: 0.18,
        replayReadiness: 0.16,
        replaySuppression: 0.38,
      },
      mismatchState: {
        timestamp: 20,
        mismatchLevel: 0.58,
        surprisePressure: 0.42,
        boundaryStress: 0.72,
        recoveryPull: 0.2,
        localInstability: 0.66,
      },
      ongoingness: 0.58,
      stability: 0.54,
      boundaryIntegrity: 0.52,
      collapseRisk: 0.24,
      overload: 0.42,
      quietness: 0.22,
      meanActivity: 0.18,
    });

    expect(pulse).not.toBeNull();
    expect(pulse?.channel).toBe('simulatedForce');
    expect((pulse?.boundaryLinked ?? 0) >= (pulse?.traceLinked ?? 1)).toBe(true);
  });

  it('returns null when collapse risk and shielding suppress output', () => {
    const pulse = deriveActuationPulse({
      timestamp: 30,
      bodySurfaceState: {
        timestamp: 30,
        boundaryIntegrity: 0.08,
        surfaceSensitivity: 0.1,
        permeability: 0.05,
        contactReadiness: 0.04,
        outputReadiness: 0.04,
        localIrritability: 0.12,
        recoveryShielding: 0.97,
      },
      recoveryState: {
        timestamp: 30,
        recoveryPressure: 0.82,
        relaxationLevel: 0.08,
        stabilizationPull: 0.12,
        collapseRisk: 0.94,
        restorationBias: 0.38,
        boundaryRepairPressure: 0.18,
        selfPreservationDrive: 0.9,
        overloadDrain: 1.2,
      },
      ongoingness: 0.14,
      stability: 0.16,
      boundaryIntegrity: 0.08,
      collapseRisk: 0.94,
      overload: 1.3,
      quietness: 0.86,
      meanActivity: 0.01,
    });

    expect(pulse).toBeNull();
  });

  it('does not contain semantic output fields', () => {
    const pulse = deriveActuationPulse({
      timestamp: 40,
      bodySurfaceState: {
        timestamp: 40,
        boundaryIntegrity: 0.74,
        surfaceSensitivity: 0.34,
        permeability: 0.38,
        contactReadiness: 0.44,
        outputReadiness: 0.58,
        localIrritability: 0.22,
        recoveryShielding: 0.18,
      },
      recoveryState: {
        timestamp: 40,
        recoveryPressure: 0.42,
        relaxationLevel: 0.48,
        stabilizationPull: 0.52,
        collapseRisk: 0.16,
        restorationBias: 0.54,
      },
      traceState: {
        timestamp: 40,
        traceStrength: 0.44,
        recurrenceWeight: 0.3,
        salienceResidue: 0.22,
        replayReadiness: 0.26,
        replaySuppression: 0.14,
      },
      ongoingness: 0.68,
      stability: 0.63,
      collapseRisk: 0.16,
      overload: 0.18,
      quietness: 0.3,
      meanActivity: 0.11,
    });

    expect(pulse).not.toBeNull();
    expect('text' in pulse!).toBe(false);
    expect('label' in pulse!).toBe(false);
    expect('meaning' in pulse!).toBe(false);
    expect('utterance' in pulse!).toBe(false);
  });
});

describe('Actuation Pulse scenarios (W2-A through W2-E)', () => {
  let outcomes: Awaited<ReturnType<typeof runActuationPulseScenarioSuite>>;

  beforeAll(async () => {
    outcomes = await runActuationPulseScenarioSuite();
  }, 120000);

  it('W2-A: quiet state does not force continuous pulse generation', async () => {
    const quiet = outcomes.find((o) => o.name === 'W2-A-quiet-no-forced-output');
    expect(quiet).toBeDefined();
    expect(quiet!.result.succeeded).toBe(true);
    expect((quiet!.result.summary.actuationPulseNullCount ?? 0)).toBeGreaterThan(
      quiet!.result.summary.actuationPulseGeneratedCount ?? 0,
    );
  });

  it('W2-B: recovery state yields weak recovery-linked pulse', async () => {
    const recovery = outcomes.find((o) => o.name === 'W2-B-recovery-linked-pulse');
    expect(recovery).toBeDefined();
    expect(recovery!.result.succeeded).toBe(true);
    expect((recovery!.result.summary.actuationPulseGeneratedCount ?? 0)).toBeGreaterThan(0);
    expect((recovery!.result.summary.avgActuationRecoveryLinked ?? 0)).toBeGreaterThan(0.2);
  });

  it('W2-C: boundary stress favors simulatedForce / boundary-linked pulses', async () => {
    const boundary = outcomes.find((o) => o.name === 'W2-C-boundary-linked-force-pulse');
    expect(boundary).toBeDefined();
    expect(boundary!.result.succeeded).toBe(true);
    expect((boundary!.result.summary.actuationPulseChannelCount?.simulatedForce ?? 0)).toBeGreaterThan(0);
    expect((boundary!.result.summary.avgActuationBoundaryLinked ?? 0)).toBeGreaterThan(0.2);
  });

  it('W2-D: low output readiness suppresses pulse generation', async () => {
    const suppressed = outcomes.find((o) => o.name === 'W2-D-low-output-readiness-suppression');
    expect(suppressed).toBeDefined();
    expect(suppressed!.result.succeeded).toBe(true);
    expect((suppressed!.result.summary.avgActuationOutputReadiness ?? 1)).toBeLessThan(0.3);
    expect((suppressed!.result.summary.actuationPulseGeneratedCount ?? 0)).toBeLessThan(
      (suppressed!.result.summary.actuationPulseNullCount ?? 0),
    );
  });

  it('W2-E: scenario metrics stay pre-semantic', async () => {
    const nonSemantic = outcomes.find((o) => o.name === 'W2-E-no-semantic-output');
    expect(nonSemantic).toBeDefined();
    expect(nonSemantic!.result.succeeded).toBe(true);

    const metric = nonSemantic!.result.metrics.find((m) => m.ap_channel != null);
    expect(metric).toBeDefined();
    expect(metric?.ap_channel === 'visual' || metric?.ap_channel === 'simulatedForce').toBe(true);
    expect('text' in (metric ?? {})).toBe(false);
    expect('label' in (metric ?? {})).toBe(false);
    expect('meaning' in (metric ?? {})).toBe(false);
    expect('utterance' in (metric ?? {})).toBe(false);
  });
});
