/**
 * Local Excitability Field Scenario Suite
 *
 * S5: Local Excitability Field
 *
 * These scenarios verify that the Local Excitability Field derivation
 * behaves correctly under various upstream conditions. They are pre-neural /
 * pre-semantic — no neuron nodes, no path formation, no semantic interpretation.
 */

import { deriveLocalExcitabilityField, type DeriveLocalExcitabilityFieldParams } from '../../observer/deriveLocalExcitabilityField.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../../types/mediumProfileState.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { TraceState } from '../../types/traceState.ts';

export interface LocalExcitabilityScenarioOutcome {
  name: string;
  field: LocalExcitabilityFieldState;
  inputSignature: string;
  postSignature: string;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function createTrace(overrides: Partial<TraceState> = {}): TraceState {
  return {
    timestamp: 100,
    traceStrength: 0.35,
    recurrenceWeight: 0.32,
    salienceResidue: 0.28,
    replayReadiness: 0.3,
    replaySuppression: 0.14,
    settlingResidue: 0.26,
    recoveryLinkedResidue: 0.22,
    ...overrides,
  };
}

function createReturns(overrides: Array<Partial<SensoryReturnPacket>> = [{}]): SensoryReturnPacket[] {
  return overrides.map((override, index) => ({
    timestamp: 100 + index,
    channel: 'simulatedLight' as const,
    intensity: 0.5,
    novelty: 0.32,
    locality: 0.44,
    rhythm: 0.36,
    worldOriginStrength: 0.7,
    returnDelayHint: 0.34,
    mediumStabilityHint: 0.68,
    returnReadiness: 0.56,
    ...override,
  }));
}

function createClosure(overrides: Partial<BodyWorldClosureState> = {}): BodyWorldClosureState {
  return {
    timestamp: 100,
    loopGain: 0.9,
    roundTripDelay: 0.36,
    returnStrength: 0.48,
    selfCausedMatch: 0.6,
    worldMismatch: 0.18,
    closureStability: 0.66,
    closureDrift: 0.14,
    unresolvedReturn: 0.12,
    feedbackSaturationRisk: 0.22,
    comparisonConfidence: 0.7,
    returnMismatch: 0.08,
    ...overrides,
  };
}

function createViability(overrides: Partial<DynamicViabilityState> = {}): DynamicViabilityState {
  return {
    timestamp: 100,
    flowContinuity: 0.58,
    energyThroughput: 0.54,
    dissipationBalance: 0.56,
    resistanceBalance: 0.52,
    delayCoherence: 0.58,
    boundaryExchange: 0.56,
    underCouplingRisk: 0.2,
    overCouplingRisk: 0.18,
    saturationRisk: 0.22,
    extinctionRisk: 0.2,
    viabilityConfidence: 0.64,
    returnContinuity: 0.52,
    traceContinuity: 0.48,
    mediumExchangeBalance: 0.52,
    closureViability: 0.58,
    ...overrides,
  };
}

function createMediumProfile(overrides: Partial<{
  echoStrength: number;
  echoDecayRate: number;
  echoPersistence: number;
  echoSaturationRisk: number;
  worldResistance: number;
  returnAttenuation: number;
  mediumAbsorption: number;
  transmissionRatio: number;
  resistanceBalance: number;
  boundaryResistance: number;
}> = {}): MediumProfileState {
  return {
    timestamp: 100,
    delay: {
      timestamp: 100,
      averageReturnDelay: 0.36,
      minReturnDelay: 0.12,
      maxReturnDelay: 0.62,
      delayVariance: 0.14,
      stableDelayWindow: 0.58,
      unstableDelayScore: 0.18,
      delayedEchoScore: 0.08,
      delayProfileConfidence: 0.66,
    },
    echo: {
      timestamp: 100,
      echoStrength: overrides.echoStrength ?? 0.38,
      echoDecayRate: overrides.echoDecayRate ?? 0.42,
      echoPersistence: overrides.echoPersistence ?? 0.44,
      echoSaturationRisk: overrides.echoSaturationRisk ?? 0.2,
      visualEchoResidue: 0.3,
      forceEchoResidue: 0.26,
      returnEchoCoupling: 0.4,
      echoProfileConfidence: 0.66,
    },
    resistance: {
      timestamp: 100,
      worldResistance: overrides.worldResistance ?? 0.38,
      boundaryResistance: overrides.boundaryResistance ?? 0.3,
      returnAttenuation: overrides.returnAttenuation ?? 0.28,
      mediumAbsorption: overrides.mediumAbsorption ?? 0.3,
      transmissionRatio: overrides.transmissionRatio ?? 0.58,
      resistanceBalance: overrides.resistanceBalance ?? 0.54,
      resistanceVariance: 0.12,
      resistanceProfileConfidence: 0.68,
    },
    profileConfidence: 0.68,
  };
}

function createParams(overrides: Partial<DeriveLocalExcitabilityFieldParams> = {}): DeriveLocalExcitabilityFieldParams {
  return {
    trace: createTrace(),
    returns: createReturns(),
    closure: createClosure(),
    mediumProfile: createMediumProfile(),
    viability: createViability(),
    previousField: null,
    dt: 1 / 60,
    ...overrides,
  };
}

function captureScenario(
  name: string,
  params: DeriveLocalExcitabilityFieldParams,
): LocalExcitabilityScenarioOutcome {
  const inputSignature = JSON.stringify(params);
  const field = deriveLocalExcitabilityField(params);
  const postSignature = JSON.stringify(params);
  return { name, field, inputSignature, postSignature };
}

// ---------------------------------------------------------------------------
// Scenario suite
// ---------------------------------------------------------------------------

export function runLocalExcitabilityScenarioSuite(): LocalExcitabilityScenarioOutcome[] {
  // S5-A: Quiet field — no false hotspots
  const quietField = captureScenario('S5-A-quiet-field', createParams({
    trace: createTrace({
      traceStrength: 0.04,
      recurrenceWeight: 0.03,
      salienceResidue: 0.02,
      replayReadiness: 0.02,
      settlingResidue: 0.02,
      recoveryLinkedResidue: 0.01,
    }),
    returns: [],
    closure: createClosure({
      loopGain: 0.12,
      returnStrength: 0.06,
      closureStability: 0.24,
      returnMismatch: 0.04,
    }),
    viability: createViability({
      flowContinuity: 0.12,
      energyThroughput: 0.1,
      dissipationBalance: 0.3,
      resistanceBalance: 0.3,
      saturationRisk: 0.04,
      overCouplingRisk: 0.04,
      extinctionRisk: 0.72,
      viabilityConfidence: 0.22,
    }),
  }));

  // S5-B: Repeated local return raises threshold proximity / trace residue
  // Use repeated field evolution with heavy return packets
  const heavyReturnParams = createParams({
    returns: createReturns([
      { intensity: 0.88, worldOriginStrength: 0.92, locality: 0.86 },
      { intensity: 0.82, worldOriginStrength: 0.88, locality: 0.8, channel: 'simulatedPressure' },
    ]),
    trace: createTrace({
      traceStrength: 0.72,
      recurrenceWeight: 0.68,
      salienceResidue: 0.64,
      replayReadiness: 0.6,
      settlingResidue: 0.58,
    }),
    closure: createClosure({
      loopGain: 1.1,
      returnStrength: 0.82,
      closureStability: 0.72,
    }),
  });
  const repeatedReturn = captureScenario('S5-B-repeated-return-raises-threshold', heavyReturnParams);

  // S5-C: Refractory reduces excitability
  const refractoryActive = captureScenario('S5-C-refractory-reduces-excitability', createParams({
    viability: createViability({
      overCouplingRisk: 0.86,
      saturationRisk: 0.82,
      flowContinuity: 0.42,
      viabilityConfidence: 0.3,
    }),
  }));

  // S5-D: Recovery restores excitability (after refractory, now recovering)
  const recovering = captureScenario('S5-D-recovery-restores-excitability', createParams({
    viability: createViability({
      overCouplingRisk: 0.06,
      saturationRisk: 0.08,
      flowContinuity: 0.72,
      extinctionRisk: 0.06,
      delayCoherence: 0.78,
      traceContinuity: 0.72,
      returnContinuity: 0.7,
      viabilityConfidence: 0.82,
    }),
    trace: createTrace({
      traceStrength: 0.64,
      recurrenceWeight: 0.58,
      recoveryLinkedResidue: 0.62,
      settlingResidue: 0.56,
    }),
  }));

  // S5-E: High resistance lowers propagation tendency
  const highResistance = captureScenario('S5-E-high-resistance-lowers-propagation', createParams({
    mediumProfile: createMediumProfile({
      worldResistance: 0.88,
      boundaryResistance: 0.84,
      transmissionRatio: 0.12,
      resistanceBalance: 0.14,
    }),
    viability: createViability({
      resistanceBalance: 0.12,
    }),
  }));

  // S5-F: Low dissipation preserves trace residue
  const lowDissipation = captureScenario('S5-F-low-dissipation-preserves-trace', createParams({
    mediumProfile: createMediumProfile({
      echoDecayRate: 0.06,
      echoPersistence: 0.88,
      mediumAbsorption: 0.06,
      returnAttenuation: 0.06,
    }),
    trace: createTrace({
      traceStrength: 0.58,
      settlingResidue: 0.54,
      recoveryLinkedResidue: 0.5,
    }),
  }));

  // S5-G: Read-only observation (no mutation)
  const readOnlyCheck = captureScenario('S5-G-read-only-observation', createParams());

  // S5-H: No semantic leak
  const noSemanticLeak = captureScenario('S5-H-no-semantic-leak', createParams());

  return [
    quietField,
    repeatedReturn,
    refractoryActive,
    recovering,
    highResistance,
    lowDissipation,
    readOnlyCheck,
    noSemanticLeak,
  ];
}
