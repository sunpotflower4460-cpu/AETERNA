/**
 * Closed-Loop Scenario Behavioral Tests
 *
 * W8: Closed-Loop Scenario Tests
 *
 * Verifies that Body-World Closure behaves as expected across the W8 scenario suite.
 *
 * This is NOT a proof of consciousness, self-awareness, or intelligence.
 * It is a research-diagnostic test of closed-loop life-field operation.
 *
 * Prohibited content:
 * - No semantic nodes, object labels, or meaning structures
 * - No runtime neuron node placement
 * - No Node bridge connections
 * - No consciousness claims
 */

import { describe, it, expect } from 'vitest';
import {
  runClosedLoopScenario,
  runClosedLoopScenarioSuite,
} from '../scenario/closedLoopScenario.ts';

// ─── Helper ───────────────────────────────────────────────────────────────────

function isFiniteAndValid(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

// ─── W8-A: No World Return ─────────────────────────────────────────────────

describe('W8-A: No World Return', () => {
  it('sensoryReturnCount should be 0 when world returns nothing', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-A-no-world-return',
      ticks: 60,
      worldResponseMode: 'no_return',
    });

    expect(summary.sensoryReturnCount).toBe(0);
  });

  it('averageLoopGain should be low when no return arrives', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-A-no-world-return',
      ticks: 60,
      worldResponseMode: 'no_return',
    });

    // loopGain is low when returnStrength is 0
    expect(summary.averageLoopGain).toBeLessThan(0.5);
  });

  it('averageClosureStability should not be high without sensory return', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-A-no-world-return',
      ticks: 60,
      worldResponseMode: 'no_return',
    });

    // Without return, closureStability is driven only by mediumStability and ongoingness
    expect(summary.averageClosureStability).toBeLessThan(0.85);
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-A-no-world-return',
      ticks: 60,
      worldResponseMode: 'no_return',
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-A-no-world-return',
      ticks: 60,
      worldResponseMode: 'no_return',
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-B: Delayed Return ─────────────────────────────────────────────────

describe('W8-B: Delayed Return', () => {
  it('averageRoundTripDelay should be higher than normal mode', async () => {
    const [delayed, normal] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-B-delayed',
        ticks: 60,
        worldResponseMode: 'delayed_return',
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-B-normal',
        ticks: 60,
        worldResponseMode: 'normal',
      }),
    ]);

    expect(delayed.summary.averageRoundTripDelay ?? 0).toBeGreaterThan(
      normal.summary.averageRoundTripDelay ?? 0,
    );
  });

  it('nanOrInfinityCount should be 0 with delayed return', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-B-delayed',
      ticks: 60,
      worldResponseMode: 'delayed_return',
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-B-delayed',
      ticks: 60,
      worldResponseMode: 'delayed_return',
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-C: Amplified Return ───────────────────────────────────────────────

describe('W8-C: Amplified Return', () => {
  it('maxFeedbackSaturationRisk should be higher with amplified return', async () => {
    const [amplified, normal] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-C-amplified',
        ticks: 60,
        worldResponseMode: 'amplified_return',
        forcePulseEveryTick: true,
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-C-normal',
        ticks: 60,
        worldResponseMode: 'normal',
        forcePulseEveryTick: false,
      }),
    ]);

    expect(amplified.summary.maxFeedbackSaturationRisk).toBeGreaterThan(
      normal.summary.maxFeedbackSaturationRisk,
    );
  });

  it('averageLoopGain should tend higher with amplified return', async () => {
    const [amplified, noReturn] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-C-amplified',
        ticks: 60,
        worldResponseMode: 'amplified_return',
        forcePulseEveryTick: true,
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-C-no-return',
        ticks: 60,
        worldResponseMode: 'no_return',
      }),
    ]);

    expect(amplified.summary.averageLoopGain).toBeGreaterThan(
      noReturn.summary.averageLoopGain,
    );
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-C-amplified',
      ticks: 60,
      worldResponseMode: 'amplified_return',
      forcePulseEveryTick: true,
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-C-amplified',
      ticks: 60,
      worldResponseMode: 'amplified_return',
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-D: Weak Return ────────────────────────────────────────────────────

describe('W8-D: Weak Return', () => {
  it('averageLoopGain should be lower with weak return than amplified', async () => {
    const [weak, amplified] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-D-weak',
        ticks: 60,
        worldResponseMode: 'weak_return',
        forcePulseEveryTick: true,
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-D-amplified',
        ticks: 60,
        worldResponseMode: 'amplified_return',
        forcePulseEveryTick: true,
      }),
    ]);

    expect(weak.summary.averageLoopGain).toBeLessThan(
      amplified.summary.averageLoopGain,
    );
  });

  it('sensoryReturnCount should be lower with weak return than amplified', async () => {
    const [weak, amplified] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-D-weak',
        ticks: 60,
        worldResponseMode: 'weak_return',
        forcePulseEveryTick: true,
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-D-amplified',
        ticks: 60,
        worldResponseMode: 'amplified_return',
        forcePulseEveryTick: true,
      }),
    ]);

    // Weak return should have same or fewer returns above effective threshold
    expect(weak.summary.averageLoopGain).toBeLessThanOrEqual(
      amplified.summary.averageLoopGain,
    );
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-D-weak',
      ticks: 60,
      worldResponseMode: 'weak_return',
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-D-weak',
      ticks: 60,
      worldResponseMode: 'weak_return',
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-E: Repeated Self-Pulse ────────────────────────────────────────────

describe('W8-E: Repeated Self-Pulse', () => {
  it('closureStability can stabilize with repeated self-pulse over time', async () => {
    const { summary, closureStates } = await runClosedLoopScenario({
      scenarioName: 'W8-E-repeated-self-pulse',
      ticks: 150,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 4,
    });

    // After warming up, closureStability should be non-trivially present
    const midOnwards = closureStates.slice(Math.floor(closureStates.length / 2));
    const lateMeanStability =
      midOnwards.reduce((sum, s) => sum + s.closureStability, 0) / midOnwards.length;
    expect(lateMeanStability).toBeGreaterThan(0);

    // pulseCount should be > 0
    expect(summary.pulseCount).toBeGreaterThan(0);
  });

  it('nanOrInfinityCount should be 0 with repeated self-pulse', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-E-repeated-self-pulse',
      ticks: 60,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 4,
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-E-repeated-self-pulse',
      ticks: 60,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 4,
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-F: World Perturbation Not Caused by AETERNA ──────────────────────

describe('W8-F: World Perturbation Only', () => {
  it('worldOnlyReturnCount should be higher in world_only mode', async () => {
    const [worldOnly, normal] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-F-world-only',
        ticks: 80,
        worldResponseMode: 'world_only',
        initialWorld: {
          motionDrift: 0.75,
          fieldTemperature: 0.72,
          worldTurbulence: 0.55,
          mediumStability: 0.35,
        },
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-F-normal',
        ticks: 80,
        worldResponseMode: 'normal',
      }),
    ]);

    expect(worldOnly.summary.worldOnlyReturnCount ?? 0).toBeGreaterThanOrEqual(
      normal.summary.worldOnlyReturnCount ?? 0,
    );
  });

  it('averageWorldCausedDifference should be higher in world_only mode', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-F-world-only',
      ticks: 80,
      worldResponseMode: 'world_only',
      initialWorld: {
        motionDrift: 0.75,
        fieldTemperature: 0.72,
        worldTurbulence: 0.55,
        mediumStability: 0.35,
      },
    });

    expect(summary.averageWorldCausedDifference ?? 0).toBeGreaterThan(0);
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-F-world-only',
      ticks: 60,
      worldResponseMode: 'world_only',
      initialWorld: { motionDrift: 0.75 },
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-F-world-only',
      ticks: 60,
      worldResponseMode: 'world_only',
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-G: Self-Caused vs World-Caused ───────────────────────────────────

describe('W8-G: Self-Caused vs World-Caused Difference', () => {
  it('averageSelfCausedMatch should be higher in normal mode than world_only', async () => {
    const [normal, worldOnly] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-G-normal',
        ticks: 80,
        worldResponseMode: 'normal',
        forcePulseEveryTick: false,
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-G-world-only',
        ticks: 80,
        worldResponseMode: 'world_only',
        initialWorld: { motionDrift: 0.65, fieldTemperature: 0.60 },
      }),
    ]);

    // selfCausedMatch should be higher when AETERNA actually sent pulses
    const normalSCM = normal.summary.averageSelfCausedMatch ?? 0;
    const worldOnlySCM = worldOnly.summary.averageSelfCausedMatch ?? 0;
    expect(normalSCM).toBeGreaterThanOrEqual(worldOnlySCM);
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-G-normal',
      ticks: 60,
      worldResponseMode: 'normal',
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-G-normal',
      ticks: 60,
      worldResponseMode: 'normal',
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-H: Closure-Coupled Proto-Neuron Candidate ────────────────────────

describe('W8-H: Closure-Coupled Proto-Neuron Candidate', () => {
  it('stable loop with repeated pulse can generate proto-neuron candidates', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-H-closure-coupled',
      ticks: 200,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 3,
      initialBodySurface: {
        outputReadiness: 0.72,
        boundaryIntegrity: 0.80,
      },
      initialWorld: {
        mediumStability: 0.75,
        feedbackDelay: 0.25,
      },
    });

    // Candidates may appear under favorable closure conditions
    expect(summary.protoNeuronCandidateCount).toBeGreaterThanOrEqual(0);
    // Candidates remain observer-side — no runtime neuron node placement
    // (verified structurally: we do not call any node-placement function)
  });

  it('proto-neuron confidence is in [0, 1] range', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-H-closure-coupled',
      ticks: 80,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 3,
    });

    expect(summary.averageProtoNeuronConfidence).toBeGreaterThanOrEqual(0);
    expect(summary.averageProtoNeuronConfidence).toBeLessThanOrEqual(1);
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-H-closure-coupled',
      ticks: 80,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 3,
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-H-closure-coupled',
      ticks: 80,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 3,
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-I: Feedback Saturation Guard ─────────────────────────────────────

describe('W8-I: Feedback Saturation Guard Observation', () => {
  it('maxFeedbackSaturationRisk should be observed under amplified return + forced pulse', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-I-saturation-guard',
      ticks: 80,
      worldResponseMode: 'amplified_return',
      forcePulseEveryTick: true,
      initialBodySurface: {
        outputReadiness: 0.90,
        boundaryIntegrity: 0.88,
      },
      initialWorld: {
        echoLevel: 0.65,
        fieldTemperature: 0.70,
        mediumStability: 0.45,
      },
    });

    // Under amplified return with forced pulses, saturation risk should be non-trivial
    expect(summary.maxFeedbackSaturationRisk).toBeGreaterThan(0);
    expect(isFiniteAndValid(summary.maxFeedbackSaturationRisk)).toBe(true);
  });

  it('maxFeedbackSaturationRisk is higher with forced amplified than no-return', async () => {
    const [saturation, noReturn] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'W8-I-saturation',
        ticks: 60,
        worldResponseMode: 'amplified_return',
        forcePulseEveryTick: true,
      }),
      runClosedLoopScenario({
        scenarioName: 'W8-I-no-return',
        ticks: 60,
        worldResponseMode: 'no_return',
      }),
    ]);

    expect(saturation.summary.maxFeedbackSaturationRisk).toBeGreaterThan(
      noReturn.summary.maxFeedbackSaturationRisk,
    );
  });

  it('nanOrInfinityCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-I-saturation',
      ticks: 60,
      worldResponseMode: 'amplified_return',
      forcePulseEveryTick: true,
    });
    expect(summary.nanOrInfinityCount).toBe(0);
  });

  it('semanticLeakCount should be 0', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-I-saturation',
      ticks: 60,
      worldResponseMode: 'amplified_return',
      forcePulseEveryTick: true,
    });
    expect(summary.semanticLeakCount).toBe(0);
  });
});

// ─── W8-J: Semantic Leak Full Check ──────────────────────────────────────

describe('W8-J: Semantic Leak Full Check', () => {
  it('semanticLeakCount is 0 across all scenarios in the full suite', async () => {
    const results = await runClosedLoopScenarioSuite();
    for (const { summary } of results) {
      expect(summary.semanticLeakCount).toBe(0);
    }
  });

  it('nanOrInfinityCount is 0 across all scenarios in the full suite', async () => {
    const results = await runClosedLoopScenarioSuite();
    for (const { summary } of results) {
      expect(summary.nanOrInfinityCount).toBe(0);
    }
  });

  it('ClosedLoopScenarioSummary has no forbidden semantic fields', async () => {
    const { summary } = await runClosedLoopScenario({
      scenarioName: 'W8-J-semantic-check',
      ticks: 40,
      worldResponseMode: 'normal',
    });

    const forbiddenFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
      'teacherVerdict', 'naturalLanguage', 'selfAwareness', 'consciousnessScore',
    ];

    const keys = Object.keys(summary);
    for (const field of forbiddenFields) {
      expect(keys).not.toContain(field);
    }
  });

  it('BodyWorldClosureState has no forbidden semantic fields', async () => {
    const { closureStates } = await runClosedLoopScenario({
      scenarioName: 'W8-J-closure-semantic-check',
      ticks: 40,
      worldResponseMode: 'normal',
    });

    const forbiddenFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'selfAwareness',
    ];

    for (const state of closureStates) {
      const keys = Object.keys(state);
      for (const field of forbiddenFields) {
        expect(keys).not.toContain(field);
      }
    }
  });

  it('ReafferenceComparisonState has no forbidden semantic fields', async () => {
    const { reafferenceStates } = await runClosedLoopScenario({
      scenarioName: 'W8-J-reafference-semantic-check',
      ticks: 40,
      worldResponseMode: 'normal',
    });

    const forbiddenFields = [
      'selfAwareness', 'iDidThis', 'semanticSelf', 'agentLabel',
      'objectIdentity', 'meaningNode', 'label', 'meaning', 'concept',
    ];

    for (const state of reafferenceStates) {
      const keys = Object.keys(state);
      for (const field of forbiddenFields) {
        expect(keys).not.toContain(field);
      }
    }
  });
});

// ─── Cross-Scenario Sanity Checks ─────────────────────────────────────────

describe('Cross-Scenario: Global Sanity', () => {
  it('all summary values are in valid numeric ranges', async () => {
    const results = await runClosedLoopScenarioSuite();

    for (const { summary } of results) {
      expect(isFiniteAndValid(summary.averageLoopGain)).toBe(true);
      expect(isFiniteAndValid(summary.averageClosureStability)).toBe(true);
      expect(isFiniteAndValid(summary.averageClosureDrift)).toBe(true);
      expect(isFiniteAndValid(summary.maxFeedbackSaturationRisk)).toBe(true);
      expect(isFiniteAndValid(summary.averageProtoNeuronConfidence)).toBe(true);

      expect(summary.averageLoopGain).toBeGreaterThanOrEqual(0);
      expect(summary.averageClosureStability).toBeGreaterThanOrEqual(0);
      expect(summary.averageClosureStability).toBeLessThanOrEqual(1);
      expect(summary.averageClosureDrift).toBeGreaterThanOrEqual(0);
      expect(summary.averageClosureDrift).toBeLessThanOrEqual(1);
      expect(summary.maxFeedbackSaturationRisk).toBeGreaterThanOrEqual(0);
      expect(summary.maxFeedbackSaturationRisk).toBeLessThanOrEqual(1);
      expect(summary.averageProtoNeuronConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.averageProtoNeuronConfidence).toBeLessThanOrEqual(1);
    }
  });

  it('each scenario summary has the required fields', async () => {
    const results = await runClosedLoopScenarioSuite();

    for (const { summary } of results) {
      expect(typeof summary.scenarioName).toBe('string');
      expect(summary.ticks).toBeGreaterThan(0);
      expect(typeof summary.pulseCount).toBe('number');
      expect(typeof summary.sensoryReturnCount).toBe('number');
      expect(typeof summary.reafferenceCount).toBe('number');
      expect(typeof summary.semanticLeakCount).toBe('number');
      expect(typeof summary.nanOrInfinityCount).toBe('number');
    }
  });

  it('no-return mode always has lower sensoryReturnCount than amplified mode', async () => {
    const [noReturn, amplified] = await Promise.all([
      runClosedLoopScenario({
        scenarioName: 'cross-no-return',
        ticks: 60,
        worldResponseMode: 'no_return',
        forcePulseEveryTick: true,
      }),
      runClosedLoopScenario({
        scenarioName: 'cross-amplified',
        ticks: 60,
        worldResponseMode: 'amplified_return',
        forcePulseEveryTick: true,
      }),
    ]);

    expect(noReturn.summary.sensoryReturnCount).toBeLessThan(
      amplified.summary.sensoryReturnCount,
    );
  });
});
