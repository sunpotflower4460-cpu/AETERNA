import { deriveDynamicViabilityState, type DeriveDynamicViabilityStateParams } from '../../closure/deriveDynamicViabilityState.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { BodySurfaceState } from '../../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { TraceState } from '../../types/traceState.ts';
import type { WorldMediumState } from '../../types/worldMediumState.ts';

export interface DynamicViabilityScenarioOutcome {
  name: string;
  viability: DynamicViabilityState;
  inputSignature: string;
  postSignature: string;
}

function createBodySurface(overrides: Partial<BodySurfaceState> = {}): BodySurfaceState {
  return {
    timestamp: 100,
    boundaryIntegrity: 0.74,
    surfaceSensitivity: 0.58,
    permeability: 0.52,
    contactReadiness: 0.6,
    outputReadiness: 0.62,
    localIrritability: 0.2,
    recoveryShielding: 0.24,
    surfaceTension: 0.32,
    surfaceFatigue: 0.12,
    protectiveClosure: 0.16,
    externalContactLoad: 0.28,
    ...overrides,
  };
}

function createPulse(overrides: Partial<ActuationPulse> = {}): ActuationPulse {
  return {
    timestamp: 100,
    channel: 'visual',
    intensity: 0.6,
    coherence: 0.64,
    rhythm: 0.48,
    locality: 0.46,
    recoveryLinked: 0.28,
    boundaryLinked: 0.44,
    traceLinked: 0.36,
    outputReadiness: 0.62,
    ...overrides,
  };
}

function createReturns(overrides: Array<Partial<SensoryReturnPacket>> = [{}]): SensoryReturnPacket[] {
  return overrides.map((override, index) => ({
    timestamp: 100 + index,
    channel: 'simulatedLight',
    intensity: 0.52,
    novelty: 0.34,
    locality: 0.42,
    rhythm: 0.36,
    worldOriginStrength: 0.72,
    returnDelayHint: 0.36,
    mediumStabilityHint: 0.7,
    returnReadiness: 0.58,
    ...override,
  }));
}

function createWorld(overrides: Partial<WorldMediumState> = {}): WorldMediumState {
  return {
    timestamp: 100,
    ambientLight: 0.54,
    ambientNoise: 0.36,
    surfaceResistance: 0.48,
    echoLevel: 0.34,
    motionDrift: 0.22,
    fieldTemperature: 0.46,
    feedbackDelay: 0.38,
    lastPulseImpact: 0.5,
    mediumStability: 0.72,
    returnReadiness: 0.6,
    ...overrides,
  };
}

function createReafference(overrides: Partial<ReafferenceComparisonState> = {}): ReafferenceComparisonState {
  return {
    timestamp: 100,
    expectedReturn: 0.56,
    actualReturn: 0.5,
    returnDelay: 0.38,
    returnMismatch: 0.08,
    selfCausedMatch: 0.62,
    worldCausedDifference: 0.18,
    unresolvedReturn: 0.12,
    comparisonConfidence: 0.7,
    pulseReturnCorrelation: 0.68,
    returnAttenuation: 0.06,
    returnAmplification: 0,
    delayedEchoScore: 0,
    ...overrides,
  };
}

function createClosure(overrides: Partial<BodyWorldClosureState> = {}): BodyWorldClosureState {
  return {
    timestamp: 100,
    loopGain: 0.92,
    roundTripDelay: 0.38,
    returnStrength: 0.5,
    selfCausedMatch: 0.62,
    worldMismatch: 0.2,
    closureStability: 0.68,
    closureDrift: 0.16,
    unresolvedReturn: 0.12,
    feedbackSaturationRisk: 0.24,
    comparisonConfidence: 0.7,
    returnMismatch: 0.08,
    ...overrides,
  };
}

function createTrace(overrides: Partial<TraceState> = {}): TraceState {
  return {
    timestamp: 100,
    traceStrength: 0.38,
    recurrenceWeight: 0.34,
    salienceResidue: 0.3,
    replayReadiness: 0.32,
    replaySuppression: 0.16,
    settlingResidue: 0.28,
    recoveryLinkedResidue: 0.24,
    ...overrides,
  };
}

function createParams(overrides: Partial<DeriveDynamicViabilityStateParams> = {}): DeriveDynamicViabilityStateParams {
  return {
    closure: createClosure(),
    world: createWorld(),
    bodySurface: createBodySurface(),
    pulse: createPulse(),
    returns: createReturns(),
    reafference: createReafference(),
    trace: createTrace(),
    previousViability: null,
    dt: 1 / 60,
    ...overrides,
  };
}

function captureScenario(
  name: string,
  params: DeriveDynamicViabilityStateParams,
): DynamicViabilityScenarioOutcome {
  const inputSignature = JSON.stringify(params);
  const viability = deriveDynamicViabilityState(params);
  const postSignature = JSON.stringify(params);
  return { name, viability, inputSignature, postSignature };
}

export function runDynamicViabilityScenarioSuite(): DynamicViabilityScenarioOutcome[] {
  const viableMiddleFlow = captureScenario('S2-A-viable-middle-flow', createParams({
    previousViability: {
      timestamp: 99,
      flowContinuity: 0.6,
      energyThroughput: 0.56,
      dissipationBalance: 0.58,
      resistanceBalance: 0.54,
      delayCoherence: 0.6,
      boundaryExchange: 0.58,
      underCouplingRisk: 0.22,
      overCouplingRisk: 0.2,
      saturationRisk: 0.24,
      extinctionRisk: 0.22,
      viabilityConfidence: 0.66,
      returnContinuity: 0.55,
      traceContinuity: 0.5,
      mediumExchangeBalance: 0.54,
      closureViability: 0.6,
    },
  }));

  const underCoupledLoop = captureScenario('S2-B-under-coupled-loop', createParams({
    closure: createClosure({ loopGain: 0.24, returnStrength: 0.12, closureStability: 0.28 }),
    world: createWorld({ lastPulseImpact: 0.08, returnReadiness: 0.12, surfaceResistance: 0.8 }),
    reafference: createReafference({ actualReturn: 0.1, selfCausedMatch: 0.18, unresolvedReturn: 0.34 }),
    returns: createReturns([{ intensity: 0.16, worldOriginStrength: 0.45, returnReadiness: 0.14 }]),
    pulse: createPulse({ intensity: 0.68, coherence: 0.66, outputReadiness: 0.74 }),
  }));

  const overCoupledLoop = captureScenario('S2-C-over-coupled-loop', createParams({
    closure: createClosure({ loopGain: 1.34, returnStrength: 0.92, closureStability: 0.52, feedbackSaturationRisk: 0.88 }),
    world: createWorld({ echoLevel: 0.9, lastPulseImpact: 0.88, returnReadiness: 0.9, surfaceResistance: 0.18 }),
    reafference: createReafference({ actualReturn: 0.94, returnAmplification: 0.34, unresolvedReturn: 0.18 }),
    returns: createReturns([{ intensity: 0.96, worldOriginStrength: 0.94, returnReadiness: 0.92 }]),
    trace: createTrace({ traceStrength: 0.82, salienceResidue: 0.78, replayReadiness: 0.74 }),
  }));

  const extinctionRisk = captureScenario('S2-D-extinction-risk', createParams({
    closure: createClosure({ loopGain: 0.12, returnStrength: 0.03, closureStability: 0.16, closureDrift: 0.08 }),
    world: createWorld({ echoLevel: 0.04, lastPulseImpact: 0.02, returnReadiness: 0.05, mediumStability: 0.44 }),
    reafference: createReafference({ actualReturn: 0.02, selfCausedMatch: 0.04, unresolvedReturn: 0.04, comparisonConfidence: 0.22 }),
    returns: [],
    pulse: createPulse({ intensity: 0.08, coherence: 0.12, outputReadiness: 0.16, boundaryLinked: 0.1 }),
    trace: createTrace({ traceStrength: 0.04, recurrenceWeight: 0.05, salienceResidue: 0.03, replayReadiness: 0.02, settlingResidue: 0.02 }),
  }));

  const delayIncoherence = captureScenario('S2-E-delay-incoherence', createParams({
    closure: createClosure({ roundTripDelay: 0.95, closureDrift: 0.52, unresolvedReturn: 0.48 }),
    world: createWorld({ feedbackDelay: 0.94, mediumStability: 0.5 }),
    reafference: createReafference({ returnDelay: 0.96, unresolvedReturn: 0.52, comparisonConfidence: 0.38 }),
    returns: createReturns([{ returnDelayHint: 0.98, intensity: 0.44, returnReadiness: 0.42 }]),
    trace: createTrace({ traceStrength: 0.18, recurrenceWeight: 0.14, replayReadiness: 0.12, settlingResidue: 0.1 }),
  }));

  const boundaryExchangeBalance = captureScenario('S2-F-boundary-exchange-balance', createParams({
    bodySurface: createBodySurface({
      boundaryIntegrity: 0.76,
      permeability: 0.54,
      contactReadiness: 0.64,
      outputReadiness: 0.62,
      recoveryShielding: 0.3,
      externalContactLoad: 0.34,
    }),
    world: createWorld({ surfaceResistance: 0.5, returnReadiness: 0.58 }),
  }));

  const noCommandStabilization = captureScenario('S2-G-no-command-stabilization', createParams({
    closure: createClosure({ loopGain: 1.4, closureStability: 0.22, feedbackSaturationRisk: 0.92 }),
    world: createWorld({ echoLevel: 0.94, lastPulseImpact: 0.92, returnReadiness: 0.9 }),
    reafference: createReafference({ actualReturn: 0.95, returnAmplification: 0.4, unresolvedReturn: 0.32 }),
  }));

  const noSemanticLeak = captureScenario('S2-H-no-semantic-leak', createParams());

  return [
    viableMiddleFlow,
    underCoupledLoop,
    overCoupledLoop,
    extinctionRisk,
    delayIncoherence,
    boundaryExchangeBalance,
    noCommandStabilization,
    noSemanticLeak,
  ];
}
