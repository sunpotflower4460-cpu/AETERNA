/**
 * Repeated Flow Path Scenario Suite
 *
 * S6: Path Formation by Repeated Flow
 *
 * These scenarios verify that the Repeated Flow Path derivation behaves
 * correctly under various upstream conditions. They are pre-semantic /
 * observer-side — no runtime edges, no path weights, no semantic relations.
 *
 * Scenarios:
 *   S6-A: quiet baseline — no false path in quiet baseline
 *   S6-B: repeated A→B flow raises recurrenceStrength
 *   S6-C: inconsistent delay lowers confidence
 *   S6-D: trace-supported repeated path
 *   S6-E: replay affinity path
 *   S6-F: closure-coupled path
 *   S6-G: read-only observation
 *   S6-H: no semantic leak
 */

import { deriveLocalExcitabilityField } from '../../observer/deriveLocalExcitabilityField.ts';
import { deriveRepeatedFlowPaths, type DeriveRepeatedFlowPathsParams } from '../../observer/deriveRepeatedFlowPaths.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../../types/mediumProfileState.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { RepeatedFlowPathObservationState } from '../../types/repeatedFlowPath.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { TraceState } from '../../types/traceState.ts';

export interface RepeatedFlowPathScenarioOutcome {
  name: string;
  observation: RepeatedFlowPathObservationState;
  inputSignature: string;
  postSignature: string;
}

// ---------------------------------------------------------------------------
// Factory helpers (matching style of localExcitabilityScenario.ts)
// ---------------------------------------------------------------------------

function createTrace(overrides: Partial<TraceState> = {}): TraceState {
  return {
    timestamp: 100,
    traceStrength: 0.35,
    recurrenceWeight: 0.32,
    salienceResidue: 0.28,
    replayReadiness: 0.30,
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
    intensity: 0.50,
    novelty: 0.32,
    locality: 0.44,
    rhythm: 0.36,
    worldOriginStrength: 0.70,
    returnDelayHint: 0.34,
    mediumStabilityHint: 0.68,
    ...override,
  }));
}

function createClosure(overrides: Partial<BodyWorldClosureState> = {}): BodyWorldClosureState {
  return {
    timestamp: 100,
    loopGain: 0.90,
    roundTripDelay: 0.36,
    returnStrength: 0.48,
    selfCausedMatch: 0.60,
    worldMismatch: 0.18,
    closureStability: 0.66,
    closureDrift: 0.14,
    unresolvedReturn: 0.12,
    feedbackSaturationRisk: 0.22,
    comparisonConfidence: 0.70,
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
    underCouplingRisk: 0.20,
    overCouplingRisk: 0.18,
    saturationRisk: 0.22,
    extinctionRisk: 0.20,
    viabilityConfidence: 0.64,
    returnContinuity: 0.52,
    traceContinuity: 0.48,
    mediumExchangeBalance: 0.52,
    closureViability: 0.58,
    ...overrides,
  };
}

function createMediumProfile(overrides: Partial<{
  echoDecayRate: number;
  echoPersistence: number;
  worldResistance: number;
  transmissionRatio: number;
  stableDelayWindow: number;
  unstableDelayScore: number;
}> = {}): MediumProfileState {
  return {
    timestamp: 100,
    delay: {
      timestamp: 100,
      averageReturnDelay: 0.36,
      minReturnDelay: 0.12,
      maxReturnDelay: 0.62,
      delayVariance: 0.14,
      stableDelayWindow: overrides.stableDelayWindow ?? 0.58,
      unstableDelayScore: overrides.unstableDelayScore ?? 0.18,
      delayedEchoScore: 0.08,
      delayProfileConfidence: 0.66,
    },
    echo: {
      timestamp: 100,
      echoStrength: 0.38,
      echoDecayRate: overrides.echoDecayRate ?? 0.42,
      echoPersistence: overrides.echoPersistence ?? 0.44,
      echoSaturationRisk: 0.20,
      visualEchoResidue: 0.30,
      forceEchoResidue: 0.26,
      returnEchoCoupling: 0.40,
      echoProfileConfidence: 0.66,
    },
    resistance: {
      timestamp: 100,
      worldResistance: overrides.worldResistance ?? 0.38,
      boundaryResistance: 0.30,
      returnAttenuation: 0.28,
      mediumAbsorption: 0.30,
      transmissionRatio: overrides.transmissionRatio ?? 0.58,
      resistanceBalance: 0.54,
      resistanceVariance: 0.12,
      resistanceProfileConfidence: 0.68,
    },
    profileConfidence: 0.68,
  };
}

function createReafference(overrides: Partial<ReafferenceComparisonState> = {}): ReafferenceComparisonState {
  return {
    timestamp: 100,
    expectedReturn: 0.42,
    actualReturn: 0.44,
    returnDelay: 0.36,
    returnMismatch: 0.08,
    selfCausedMatch: 0.60,
    worldCausedDifference: 0.22,
    unresolvedReturn: 0.12,
    comparisonConfidence: 0.70,
    ...overrides,
  };
}

/**
 * Build a LocalExcitabilityFieldState with specific region activations forced high.
 * This simulates deliberate activity in specific cells without artificial injection.
 */
function buildFieldWithActiveRegions(
  highRegionIndices: number[],
  viabilityOverrides: Partial<DynamicViabilityState> = {},
  traceOverrides: Partial<TraceState> = {},
  timestamp = 100,
): LocalExcitabilityFieldState {
  const viability = createViability({
    flowContinuity: 0.72,
    energyThroughput: 0.68,
    ...viabilityOverrides,
  });
  const trace = createTrace(traceOverrides);
  const returns = createReturns([{ intensity: 0.78, worldOriginStrength: 0.82, locality: 0.76 }]);
  const closure = createClosure({ loopGain: 1.05, returnStrength: 0.75 });
  const mediumProfile = createMediumProfile();

  // Build a "warm" previous field to seed recovery
  const baseField = deriveLocalExcitabilityField({
    trace,
    returns,
    closure,
    mediumProfile,
    viability,
    previousField: null,
    dt: 1 / 60,
  });

  // Override specific cells to force high activation for scenario purposes
  const cells = baseField.cells.map((cell, index) => {
    if (highRegionIndices.includes(index)) {
      return {
        ...cell,
        activationLevel: 0.72,
        excitability: 0.68,
        propagationTendency: 0.64,
        thresholdProximity: 0.60,
      };
    }
    return cell;
  });

  return { ...baseField, timestamp, cells };
}

/**
 * Run the full repeated flow derivation for N iterations to build up flowCount.
 * This simulates repeated A→B activation sequences.
 */
function runRepeatedActivations(
  fromRegionIndex: number,
  toRegionIndex: number,
  iterations: number,
  params: Omit<DeriveRepeatedFlowPathsParams, 'localField' | 'previousLocalField' | 'previousObservation'>,
): RepeatedFlowPathObservationState {
  let prevField = buildFieldWithActiveRegions([fromRegionIndex], {}, {}, 100);
  let currField = buildFieldWithActiveRegions([toRegionIndex], {}, {}, 101);
  let prevObs: RepeatedFlowPathObservationState | null = null;

  for (let i = 0; i < iterations; i++) {
    const obs = deriveRepeatedFlowPaths({
      ...params,
      localField: i % 2 === 0 ? currField : prevField,
      previousLocalField: i % 2 === 0 ? prevField : currField,
      previousObservation: prevObs,
      dt: 1 / 60,
    });
    prevObs = obs;
  }

  return prevObs!;
}

function captureScenario(
  name: string,
  params: DeriveRepeatedFlowPathsParams,
): RepeatedFlowPathScenarioOutcome {
  const inputSignature = JSON.stringify({
    ...params,
    localField: params.localField?.timestamp,
    previousLocalField: params.previousLocalField?.timestamp,
  });
  const observation = deriveRepeatedFlowPaths(params);
  const postSignature = JSON.stringify({
    ...params,
    localField: params.localField?.timestamp,
    previousLocalField: params.previousLocalField?.timestamp,
  });
  return { name, observation, inputSignature, postSignature };
}

// ---------------------------------------------------------------------------
// Scenario suite
// ---------------------------------------------------------------------------

export function runRepeatedFlowPathScenarioSuite(): RepeatedFlowPathScenarioOutcome[] {
  // -------------------------------------------------------------------------
  // S6-A: Quiet baseline — no false path in quiet baseline
  // Very low activity fields → few or no sequential activations
  // -------------------------------------------------------------------------
  const quietViability = createViability({
    flowContinuity: 0.08,
    energyThroughput: 0.06,
    dissipationBalance: 0.30,
    resistanceBalance: 0.30,
    saturationRisk: 0.02,
    overCouplingRisk: 0.02,
    extinctionRisk: 0.80,
    viabilityConfidence: 0.18,
  });
  const quietTrace = createTrace({
    traceStrength: 0.03,
    recurrenceWeight: 0.02,
    salienceResidue: 0.01,
    replayReadiness: 0.01,
    replaySuppression: 0.72,
    settlingResidue: 0.01,
    recoveryLinkedResidue: 0.01,
  });
  const quietClosure = createClosure({
    loopGain: 0.10,
    returnStrength: 0.04,
    closureStability: 0.20,
    returnMismatch: 0.02,
    selfCausedMatch: 0.05,
    closureDrift: 0.02,
  });
  const quietCurrentField = deriveLocalExcitabilityField({
    trace: quietTrace, returns: [], closure: quietClosure,
    mediumProfile: null, viability: quietViability, previousField: null, dt: 1 / 60,
  });
  const quietPrevField = deriveLocalExcitabilityField({
    trace: quietTrace, returns: [], closure: quietClosure,
    mediumProfile: null, viability: quietViability, previousField: null, dt: 1 / 60,
  });
  const quietBaseline = captureScenario('S6-A-quiet-baseline', {
    localField: quietCurrentField,
    previousLocalField: quietPrevField,
    trace: quietTrace,
    mediumProfile: null,
    closure: quietClosure,
    reafference: null,
    viability: quietViability,
    previousObservation: null,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-B: Repeated A→B flow raises recurrenceStrength
  // Run many activations of region index 0 → region index 5
  // -------------------------------------------------------------------------
  const baseParams = {
    trace: createTrace({ recurrenceWeight: 0.55, traceStrength: 0.52 }),
    mediumProfile: createMediumProfile({ stableDelayWindow: 0.72, unstableDelayScore: 0.12 }),
    closure: createClosure({ loopGain: 1.05, returnStrength: 0.70, selfCausedMatch: 0.68 }),
    reafference: createReafference({ selfCausedMatch: 0.68 }),
    viability: createViability({ flowContinuity: 0.72, delayCoherence: 0.70, traceContinuity: 0.65 }),
  };
  const repeatedFlow5Obs = runRepeatedActivations(0, 5, 5, baseParams);
  const repeatedFlow5 = captureScenario('S6-B-repeated-A-to-B-flow', {
    ...baseParams,
    localField: buildFieldWithActiveRegions([5], {}, {}, 150),
    previousLocalField: buildFieldWithActiveRegions([0], {}, {}, 149),
    previousObservation: repeatedFlow5Obs,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-C: Inconsistent delay lowers confidence
  // Same pair but with high unstableDelayScore → lower delayConsistency
  // -------------------------------------------------------------------------
  const inconsistentDelayParams = {
    ...baseParams,
    mediumProfile: createMediumProfile({
      stableDelayWindow: 0.18,
      unstableDelayScore: 0.88,
    }),
    viability: createViability({
      flowContinuity: 0.72,
      delayCoherence: 0.12,  // Very low delay coherence
      traceContinuity: 0.65,
    }),
  };
  const inconsistentDelayObs = runRepeatedActivations(1, 6, 5, inconsistentDelayParams);
  const inconsistentDelay = captureScenario('S6-C-inconsistent-delay-lowers-confidence', {
    ...inconsistentDelayParams,
    localField: buildFieldWithActiveRegions([6], {}, {}, 160),
    previousLocalField: buildFieldWithActiveRegions([1], {}, {}, 159),
    previousObservation: inconsistentDelayObs,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-D: Trace-supported repeated path
  // Trace residue is strong in toRegion → traceSupport is elevated
  // -------------------------------------------------------------------------
  const traceParams = {
    ...baseParams,
    trace: createTrace({
      traceStrength: 0.76,
      recurrenceWeight: 0.72,
      salienceResidue: 0.64,
      settlingResidue: 0.68,
      recoveryLinkedResidue: 0.62,
    }),
  };
  const traceObs = runRepeatedActivations(2, 7, 5, traceParams);
  const traceSupported = captureScenario('S6-D-trace-supported-path', {
    ...traceParams,
    localField: buildFieldWithActiveRegions([7], {}, { traceStrength: 0.76, recurrenceWeight: 0.72 }, 170),
    previousLocalField: buildFieldWithActiveRegions([2], {}, { traceStrength: 0.76 }, 169),
    previousObservation: traceObs,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-E: Replay affinity path
  // Quiet/replay conditions + high replayReadiness → replayAffinity elevated
  // -------------------------------------------------------------------------
  const replayParams = {
    ...baseParams,
    trace: createTrace({
      traceStrength: 0.62,
      recurrenceWeight: 0.58,
      replayReadiness: 0.78,
      replaySuppression: 0.06,  // Low suppression → quiet settling
      settlingResidue: 0.64,
    }),
    viability: createViability({
      flowContinuity: 0.68,
      returnContinuity: 0.72,
      traceContinuity: 0.70,
    }),
  };
  const replayObs = runRepeatedActivations(3, 8, 5, replayParams);
  const replayAffinity = captureScenario('S6-E-replay-affinity-path', {
    ...replayParams,
    localField: buildFieldWithActiveRegions([8], {}, { replayReadiness: 0.78, replaySuppression: 0.06 }, 180),
    previousLocalField: buildFieldWithActiveRegions([3], {}, { replayReadiness: 0.78 }, 179),
    previousObservation: replayObs,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-F: Closure-coupled path
  // World Loop return/mismatch events accompany A→B flow → closureCoupling elevated
  // -------------------------------------------------------------------------
  const closureParams = {
    ...baseParams,
    closure: createClosure({
      loopGain: 1.10,
      returnStrength: 0.82,
      returnMismatch: 0.58,  // High mismatch → closureCoupling rises
      selfCausedMatch: 0.72,
      worldMismatch: 0.52,
      closureDrift: 0.44,
    }),
    reafference: createReafference({
      returnMismatch: 0.56,
      selfCausedMatch: 0.70,
    }),
  };
  const closureObs = runRepeatedActivations(4, 9, 5, closureParams);
  const closureCoupled = captureScenario('S6-F-closure-coupled-path', {
    ...closureParams,
    localField: buildFieldWithActiveRegions([9], {}, {}, 190),
    previousLocalField: buildFieldWithActiveRegions([4], {}, {}, 189),
    previousObservation: closureObs,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-G: Read-only observation — inputs are not mutated
  // -------------------------------------------------------------------------
  const readOnlyCurrentField = buildFieldWithActiveRegions([0, 5], {}, {}, 200);
  const readOnlyPrevField = buildFieldWithActiveRegions([0], {}, {}, 199);
  const readOnly = captureScenario('S6-G-read-only-observation', {
    localField: readOnlyCurrentField,
    previousLocalField: readOnlyPrevField,
    trace: createTrace(),
    mediumProfile: createMediumProfile(),
    closure: createClosure(),
    reafference: createReafference(),
    viability: createViability(),
    previousObservation: null,
    dt: 1 / 60,
  });

  // -------------------------------------------------------------------------
  // S6-H: No semantic leak
  // -------------------------------------------------------------------------
  const noSemanticLeak = captureScenario('S6-H-no-semantic-leak', {
    localField: buildFieldWithActiveRegions([1, 6], {}, {}, 210),
    previousLocalField: buildFieldWithActiveRegions([1], {}, {}, 209),
    trace: createTrace(),
    mediumProfile: createMediumProfile(),
    closure: createClosure(),
    reafference: createReafference(),
    viability: createViability(),
    previousObservation: null,
    dt: 1 / 60,
  });

  return [
    quietBaseline,
    repeatedFlow5,
    inconsistentDelay,
    traceSupported,
    replayAffinity,
    closureCoupled,
    readOnly,
    noSemanticLeak,
  ];
}
