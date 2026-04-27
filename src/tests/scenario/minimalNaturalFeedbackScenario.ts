import { deriveDynamicViabilityState } from '../../closure/deriveDynamicViabilityState.ts';
import { applyMinimalNaturalFeedback } from '../../closure/applyMinimalNaturalFeedback.ts';
import { deriveMinimalNaturalFeedback } from '../../closure/deriveMinimalNaturalFeedback.ts';
import {
  createNeutralNaturalFeedbackAdjustment,
  type NaturalFeedbackAdjustment,
  type NaturalFeedbackApplicationReport,
} from '../../types/naturalFeedbackAdjustment.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { BodySurfaceState } from '../../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { TraceState } from '../../types/traceState.ts';
import type { WorldMediumState } from '../../types/worldMediumState.ts';

export interface MinimalNaturalFeedbackScenarioFixture {
  name: string;
  closure: BodyWorldClosureState;
  world: WorldMediumState;
  bodySurface: BodySurfaceState;
  pulse: ActuationPulse;
  returns: SensoryReturnPacket[];
  reafference: ReafferenceComparisonState;
  trace: TraceState;
  previousAdjustment: NaturalFeedbackAdjustment | null;
  dt: number;
  viability: DynamicViabilityState;
}

export interface MinimalNaturalFeedbackScenarioOutcome {
  name: string;
  viability: DynamicViabilityState;
  adjustment: NaturalFeedbackAdjustment;
  report: NaturalFeedbackApplicationReport;
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

function deriveFixtureViability(fixture: Omit<MinimalNaturalFeedbackScenarioFixture, 'viability'>): DynamicViabilityState {
  return deriveDynamicViabilityState({
    closure: fixture.closure,
    world: fixture.world,
    bodySurface: fixture.bodySurface,
    pulse: fixture.pulse,
    returns: fixture.returns,
    reafference: fixture.reafference,
    trace: fixture.trace,
    previousViability: null,
    dt: fixture.dt,
  });
}

export function createMinimalNaturalFeedbackScenarioFixture(
  kind: 'viable-middle' | 'over-coupled' | 'under-coupled',
): MinimalNaturalFeedbackScenarioFixture {
  const base = {
    name: kind,
    closure: createClosure(),
    world: createWorld(),
    bodySurface: createBodySurface(),
    pulse: createPulse(),
    returns: createReturns(),
    reafference: createReafference(),
    trace: createTrace(),
    previousAdjustment: createNeutralNaturalFeedbackAdjustment(99),
    dt: 1 / 60,
  };

  const fixture = kind === 'over-coupled'
    ? {
        ...base,
        name: 'S3-A-over-coupled-loop-weak-damping',
        closure: createClosure({ loopGain: 1.34, returnStrength: 0.92, closureStability: 0.52, feedbackSaturationRisk: 0.88 }),
        world: createWorld({ echoLevel: 0.9, lastPulseImpact: 0.88, returnReadiness: 0.9, surfaceResistance: 0.18 }),
        reafference: createReafference({ actualReturn: 0.94, returnAmplification: 0.34, unresolvedReturn: 0.18 }),
        returns: createReturns([{ intensity: 0.96, worldOriginStrength: 0.94, returnReadiness: 0.92 }]),
        trace: createTrace({ traceStrength: 0.82, salienceResidue: 0.78, replayReadiness: 0.74 }),
      }
    : kind === 'under-coupled'
      ? {
          ...base,
          name: 'S3-B-under-coupled-loop-weak-reopening',
          closure: createClosure({ loopGain: 0.24, returnStrength: 0.12, closureStability: 0.28 }),
          world: createWorld({ lastPulseImpact: 0.08, returnReadiness: 0.12, surfaceResistance: 0.8, echoLevel: 0.1 }),
          reafference: createReafference({ actualReturn: 0.1, selfCausedMatch: 0.18, unresolvedReturn: 0.34 }),
          returns: createReturns([{ intensity: 0.16, worldOriginStrength: 0.45, returnReadiness: 0.14 }]),
          pulse: createPulse({ intensity: 0.68, coherence: 0.66, outputReadiness: 0.74 }),
          bodySurface: createBodySurface({ permeability: 0.32, outputReadiness: 0.7, contactReadiness: 0.42 }),
          trace: createTrace({ traceStrength: 0.12, recurrenceWeight: 0.1, salienceResidue: 0.08, replayReadiness: 0.08, settlingResidue: 0.06 }),
        }
      : {
          ...base,
          name: 'S3-C-no-feedback-when-viable',
        };

  return {
    ...fixture,
    viability: deriveFixtureViability(fixture),
  };
}

function captureScenario(
  fixture: MinimalNaturalFeedbackScenarioFixture,
): MinimalNaturalFeedbackScenarioOutcome {
  const inputSignature = JSON.stringify(fixture);
  const adjustment = deriveMinimalNaturalFeedback({
    viability: fixture.viability,
    closure: fixture.closure,
    world: fixture.world,
    bodySurface: fixture.bodySurface,
    trace: fixture.trace,
    previousAdjustment: fixture.previousAdjustment,
    dt: fixture.dt,
  });
  const report = applyMinimalNaturalFeedback({
    world: fixture.world,
    returns: fixture.returns,
    pulse: fixture.pulse,
    bodySurface: fixture.bodySurface,
    trace: fixture.trace,
    adjustment,
  }).report;
  const postSignature = JSON.stringify(fixture);
  return {
    name: fixture.name,
    viability: fixture.viability,
    adjustment,
    report,
    inputSignature,
    postSignature,
  };
}

export function runMinimalNaturalFeedbackScenarioSuite(): MinimalNaturalFeedbackScenarioOutcome[] {
  return [
    captureScenario(createMinimalNaturalFeedbackScenarioFixture('over-coupled')),
    captureScenario(createMinimalNaturalFeedbackScenarioFixture('under-coupled')),
    captureScenario(createMinimalNaturalFeedbackScenarioFixture('viable-middle')),
  ];
}
