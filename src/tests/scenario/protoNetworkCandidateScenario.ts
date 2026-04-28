/**
 * Proto-Network Candidate Scenario Suite
 *
 * S7: Proto-Network Candidate Observation
 *
 * These scenarios verify that the Proto-Network Candidate derivation behaves
 * correctly under various upstream conditions. They are pre-semantic /
 * observer-side — no runtime edges, no semantic graphs, no concept relations.
 *
 * Scenarios:
 *   S7-A: quiet baseline — no false proto-network in quiet baseline
 *   S7-B: repeated co-activation group raises coActivationStrength
 *   S7-C: propagation group consistency raises propagationStrength
 *   S7-D: trace-correlated group raises traceCorrelation
 *   S7-E: replay co-return group raises replayCoReturn
 *   S7-F: closure-coupled proto-network raises closureCoupling
 *   S7-G: weak plasticity observation only (no runtime edges)
 *   S7-H: no semantic leak
 *   S7-I: no Node bridge
 */

import { deriveLocalExcitabilityField } from '../../observer/deriveLocalExcitabilityField.ts';
import { deriveProtoNetworkCandidates } from '../../observer/deriveProtoNetworkCandidates.ts';
import { deriveRepeatedFlowPaths, type DeriveRepeatedFlowPathsParams } from '../../observer/deriveRepeatedFlowPaths.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../../types/mediumProfileState.ts';
import type { ProtoNetworkObservationState } from '../../types/protoNetworkCandidate.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { RepeatedFlowPathObservationState } from '../../types/repeatedFlowPath.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { TraceState } from '../../types/traceState.ts';

export interface ProtoNetworkCandidateScenarioOutcome {
  name: string;
  observation: ProtoNetworkObservationState;
  inputSignature: string;
  postSignature: string;
}

// ---------------------------------------------------------------------------
// Factory helpers (matching style of repeatedFlowPathScenario.ts)
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

  const baseField = deriveLocalExcitabilityField({
    trace,
    returns,
    closure,
    mediumProfile,
    viability,
    previousField: null,
    dt: 1 / 60,
  });

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
 * Build a RepeatedFlowPathObservationState by running multiple activations.
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

/**
 * Build a RepeatedFlowPathObservationState from given params and fields.
 */
function buildRfpObservation(
  params: Omit<DeriveRepeatedFlowPathsParams, 'localField' | 'previousLocalField' | 'previousObservation'>,
  localField: LocalExcitabilityFieldState,
  previousLocalField: LocalExcitabilityFieldState,
  rfpPrevious: RepeatedFlowPathObservationState | null = null,
): RepeatedFlowPathObservationState {
  return deriveRepeatedFlowPaths({
    ...params,
    localField,
    previousLocalField,
    previousObservation: rfpPrevious,
    dt: 1 / 60,
  });
}

function captureScenario(
  name: string,
  rfpState: RepeatedFlowPathObservationState | null,
  localField: LocalExcitabilityFieldState | null,
  trace: TraceState | null,
  mediumProfile: MediumProfileState | null,
  closure: BodyWorldClosureState | null,
  reafference: ReafferenceComparisonState | null,
  viability: DynamicViabilityState | null,
  previousObservation: ProtoNetworkObservationState | null = null,
): ProtoNetworkCandidateScenarioOutcome {
  const sigParams = {
    rfpCandidateCount: rfpState?.pathCandidateCount,
    localFieldTimestamp: localField?.timestamp,
    trace: trace?.timestamp,
  };
  const inputSignature = JSON.stringify(sigParams);

  const observation = deriveProtoNetworkCandidates({
    localField,
    repeatedFlowPaths: rfpState,
    trace,
    mediumProfile,
    closure,
    reafference,
    viability,
    previousObservation,
    dt: 1 / 60,
  });

  const postSignature = JSON.stringify(sigParams);
  return { name, observation, inputSignature, postSignature };
}

// ---------------------------------------------------------------------------
// Scenario suite
// ---------------------------------------------------------------------------

export function runProtoNetworkCandidateScenarioSuite(): ProtoNetworkCandidateScenarioOutcome[] {
  // -------------------------------------------------------------------------
  // S7-A: Quiet baseline — no false proto-network in quiet baseline
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

  const quietRfp = buildRfpObservation(
    { trace: quietTrace, mediumProfile: null, closure: quietClosure, reafference: null, viability: quietViability },
    quietCurrentField,
    quietPrevField,
  );

  const quietBaseline = captureScenario(
    'S7-A-quiet-baseline',
    quietRfp,
    quietCurrentField,
    quietTrace,
    null,
    quietClosure,
    null,
    quietViability,
  );

  // -------------------------------------------------------------------------
  // S7-B: Repeated co-activation group — coActivationStrength rises
  // -------------------------------------------------------------------------
  const coActParams = {
    trace: createTrace({ recurrenceWeight: 0.62, traceStrength: 0.58 }),
    mediumProfile: createMediumProfile({ stableDelayWindow: 0.72, unstableDelayScore: 0.12 }),
    closure: createClosure({ loopGain: 1.05, returnStrength: 0.70, selfCausedMatch: 0.68 }),
    reafference: createReafference({ selfCausedMatch: 0.68 }),
    viability: createViability({ flowContinuity: 0.78, delayCoherence: 0.72, traceContinuity: 0.68 }),
  };
  // Run S6 repeatedly to build up flowCount / recurrenceStrength
  const coActRfp1 = runRepeatedActivations(0, 5, 6, coActParams);
  const coActRfp2 = runRepeatedActivations(1, 6, 6, coActParams);
  // Merge by running one more step with both as candidates via previousObservation
  const coActField = buildFieldWithActiveRegions([0, 1, 5, 6], {}, {}, 200);
  const coActPrevField = buildFieldWithActiveRegions([0, 1], {}, {}, 199);
  const coActRfpMerged = deriveRepeatedFlowPaths({
    ...coActParams,
    localField: coActField,
    previousLocalField: coActPrevField,
    previousObservation: coActRfp1,
    dt: 1 / 60,
  });
  // Run again with second rfp's candidates carried
  const coActRfpFinal = deriveRepeatedFlowPaths({
    ...coActParams,
    localField: coActField,
    previousLocalField: coActPrevField,
    previousObservation: {
      ...coActRfpMerged,
      candidates: [...coActRfpMerged.candidates, ...coActRfp2.candidates].slice(0, 24),
    },
    dt: 1 / 60,
  });

  const coActivationScenario = captureScenario(
    'S7-B-repeated-co-activation-group',
    coActRfpFinal,
    coActField,
    coActParams.trace,
    coActParams.mediumProfile,
    coActParams.closure,
    coActParams.reafference,
    coActParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-C: Propagation group consistency — propagationStrength rises
  // -------------------------------------------------------------------------
  const propParams = {
    trace: createTrace({ recurrenceWeight: 0.55, traceStrength: 0.52 }),
    mediumProfile: createMediumProfile({ stableDelayWindow: 0.82, unstableDelayScore: 0.08 }),
    closure: createClosure({ loopGain: 1.02 }),
    reafference: createReafference(),
    viability: createViability({
      flowContinuity: 0.82,
      delayCoherence: 0.80,
      traceContinuity: 0.76,
    }),
  };
  const propRfp = runRepeatedActivations(2, 7, 6, propParams);
  const propField = buildFieldWithActiveRegions(
    [2, 7],
    { flowContinuity: 0.82 },
    { traceStrength: 0.52 },
    210,
  );
  const propPrevField = buildFieldWithActiveRegions([2], {}, {}, 209);
  const propRfpFinal = deriveRepeatedFlowPaths({
    ...propParams,
    localField: propField,
    previousLocalField: propPrevField,
    previousObservation: propRfp,
    dt: 1 / 60,
  });

  const propagationScenario = captureScenario(
    'S7-C-propagation-group-consistency',
    propRfpFinal,
    propField,
    propParams.trace,
    propParams.mediumProfile,
    propParams.closure,
    propParams.reafference,
    propParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-D: Trace-correlated group — traceCorrelation rises
  // -------------------------------------------------------------------------
  const traceParams = {
    trace: createTrace({
      traceStrength: 0.78,
      recurrenceWeight: 0.74,
      salienceResidue: 0.66,
      settlingResidue: 0.70,
      recoveryLinkedResidue: 0.64,
    }),
    mediumProfile: createMediumProfile(),
    closure: createClosure(),
    reafference: createReafference(),
    viability: createViability({ flowContinuity: 0.72, traceContinuity: 0.76 }),
  };
  const traceRfp = runRepeatedActivations(3, 8, 6, traceParams);
  const traceField = buildFieldWithActiveRegions(
    [3, 8],
    {},
    { traceStrength: 0.78, recurrenceWeight: 0.74 },
    220,
  );
  const tracePrevField = buildFieldWithActiveRegions([3], {}, { traceStrength: 0.78 }, 219);
  const traceRfpFinal = deriveRepeatedFlowPaths({
    ...traceParams,
    localField: traceField,
    previousLocalField: tracePrevField,
    previousObservation: traceRfp,
    dt: 1 / 60,
  });

  const traceScenario = captureScenario(
    'S7-D-trace-correlated-group',
    traceRfpFinal,
    traceField,
    traceParams.trace,
    traceParams.mediumProfile,
    traceParams.closure,
    traceParams.reafference,
    traceParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-E: Replay co-return group — replayCoReturn rises
  // -------------------------------------------------------------------------
  const replayParams = {
    trace: createTrace({
      traceStrength: 0.64,
      recurrenceWeight: 0.60,
      replayReadiness: 0.80,
      replaySuppression: 0.05,
      settlingResidue: 0.66,
    }),
    mediumProfile: createMediumProfile(),
    closure: createClosure(),
    reafference: createReafference(),
    viability: createViability({ flowContinuity: 0.68, returnContinuity: 0.74, traceContinuity: 0.72 }),
  };
  const replayRfp = runRepeatedActivations(4, 9, 6, replayParams);
  const replayField = buildFieldWithActiveRegions(
    [4, 9],
    {},
    { replayReadiness: 0.80, replaySuppression: 0.05 },
    230,
  );
  const replayPrevField = buildFieldWithActiveRegions([4], {}, { replayReadiness: 0.80 }, 229);
  const replayRfpFinal = deriveRepeatedFlowPaths({
    ...replayParams,
    localField: replayField,
    previousLocalField: replayPrevField,
    previousObservation: replayRfp,
    dt: 1 / 60,
  });

  const replayScenario = captureScenario(
    'S7-E-replay-co-return-group',
    replayRfpFinal,
    replayField,
    replayParams.trace,
    replayParams.mediumProfile,
    replayParams.closure,
    replayParams.reafference,
    replayParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-F: Closure-coupled proto-network — closureCoupling rises
  // -------------------------------------------------------------------------
  const closureParams = {
    trace: createTrace({ recurrenceWeight: 0.55, traceStrength: 0.52 }),
    mediumProfile: createMediumProfile(),
    closure: createClosure({
      loopGain: 1.12,
      returnStrength: 0.84,
      returnMismatch: 0.60,
      selfCausedMatch: 0.74,
      worldMismatch: 0.54,
      closureDrift: 0.46,
    }),
    reafference: createReafference({
      returnMismatch: 0.58,
      selfCausedMatch: 0.72,
    }),
    viability: createViability({ flowContinuity: 0.72 }),
  };
  const closureRfp = runRepeatedActivations(5, 10, 6, closureParams);
  const closureField = buildFieldWithActiveRegions([5, 10], {}, {}, 240);
  const closurePrevField = buildFieldWithActiveRegions([5], {}, {}, 239);
  const closureRfpFinal = deriveRepeatedFlowPaths({
    ...closureParams,
    localField: closureField,
    previousLocalField: closurePrevField,
    previousObservation: closureRfp,
    dt: 1 / 60,
  });

  const closureScenario = captureScenario(
    'S7-F-closure-coupled-proto-network',
    closureRfpFinal,
    closureField,
    closureParams.trace,
    closureParams.mediumProfile,
    closureParams.closure,
    closureParams.reafference,
    closureParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-G: Weak plasticity observation only — no runtime edges
  // -------------------------------------------------------------------------
  const plasticityParams = {
    trace: createTrace({ recurrenceWeight: 0.50, traceStrength: 0.48 }),
    mediumProfile: createMediumProfile({ worldResistance: 0.20, transmissionRatio: 0.74 }),
    closure: createClosure(),
    reafference: createReafference(),
    viability: createViability({ flowContinuity: 0.70, traceContinuity: 0.68 }),
  };
  // Run many activations to build up flowCount >= 3
  const plasticityRfp = runRepeatedActivations(6, 11, 8, plasticityParams);
  const plasticityField = buildFieldWithActiveRegions([6, 11], {}, {}, 250);
  const plasticityPrevField = buildFieldWithActiveRegions([6], {}, {}, 249);
  const plasticityRfpFinal = deriveRepeatedFlowPaths({
    ...plasticityParams,
    localField: plasticityField,
    previousLocalField: plasticityPrevField,
    previousObservation: plasticityRfp,
    dt: 1 / 60,
  });

  const plasticityScenario = captureScenario(
    'S7-G-weak-plasticity-observation-only',
    plasticityRfpFinal,
    plasticityField,
    plasticityParams.trace,
    plasticityParams.mediumProfile,
    plasticityParams.closure,
    plasticityParams.reafference,
    plasticityParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-H: No semantic leak — check that forbidden fields are absent
  // -------------------------------------------------------------------------
  const noSemanticLeak = captureScenario(
    'S7-H-no-semantic-leak',
    closureRfpFinal,
    closureField,
    closureParams.trace,
    closureParams.mediumProfile,
    closureParams.closure,
    closureParams.reafference,
    closureParams.viability,
  );

  // -------------------------------------------------------------------------
  // S7-I: No Node bridge — check that forbidden node bridge fields are absent
  // -------------------------------------------------------------------------
  const noNodeBridge = captureScenario(
    'S7-I-no-node-bridge',
    coActRfpFinal,
    coActField,
    coActParams.trace,
    coActParams.mediumProfile,
    coActParams.closure,
    coActParams.reafference,
    coActParams.viability,
  );

  return [
    quietBaseline,
    coActivationScenario,
    propagationScenario,
    traceScenario,
    replayScenario,
    closureScenario,
    plasticityScenario,
    noSemanticLeak,
    noNodeBridge,
  ];
}
